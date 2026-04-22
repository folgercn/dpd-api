import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().trim().min(1, "请提供要解析的表格文本").max(
    Number(process.env.MAX_TEXT_LENGTH) || 10000, 
    "粘贴文本过长，请分批解析"
  ),
});

interface ParseRequest {
  text: string;
}

// 1. IP 限流存储 (简单内存模式)
const ipRateLimitMap = new Map<string, { count: number; lastReset: number }>();
const IP_LIMIT = Number(process.env.IP_RATE_LIMIT) || 30;
const LICENSE_LIMIT = Number(process.env.LICENSE_RATE_LIMIT) || 10;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

const shipmentSchema = z.object({
  recipientName: z.string().default(""),
  company: z.string().default(""),
  street: z.string().default(""),
  houseNumber: z.string().default(""),
  addressLine1: z.string().default(""),
  addressLine2: z.string().default(""),
  postalCode: z.string().default(""),
  city: z.string().default(""),
  countryCode: z.string().length(2).default("DE"),
  phone: z.string().default(""),
  email: z.string().default(""),
  weightKg: z.number().positive().default(1),
  parcelType: z.enum(["S", "M", "L", "XL", "XXL", "UNKNOWN"]).default("UNKNOWN"),
  serviceType: z.enum(["SHIPMENT", "RETURN", "UNKNOWN"]).default("UNKNOWN"),
  reference: z.string().default(""),
  lengthCm: z.number().nonnegative().default(0),
  widthCm: z.number().nonnegative().default(0),
  heightCm: z.number().nonnegative().default(0),
  sourceRow: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.string().default(""),
});

const responseSchema = z.object({
  shipments: z.array(shipmentSchema),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.EXTENSION_CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const shipmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["shipments"],
  properties: {
    shipments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "recipientName",
          "company",
          "street",
          "houseNumber",
          "addressLine1",
          "addressLine2",
          "postalCode",
          "city",
          "countryCode",
          "phone",
          "email",
          "weightKg",
          "parcelType",
          "serviceType",
          "reference",
          "lengthCm",
          "widthCm",
          "heightCm",
          "sourceRow",
          "confidence",
          "notes",
        ],
        properties: {
          recipientName: { type: "string" },
          company: { type: "string" },
          street: { type: "string" },
          houseNumber: { type: "string" },
          addressLine1: { type: "string" },
          addressLine2: { type: "string" },
          postalCode: { type: "string" },
          city: { type: "string" },
          countryCode: { type: "string", minLength: 2, maxLength: 2 },
          phone: { type: "string" },
          email: { type: "string" },
          weightKg: { type: "number" },
          parcelType: { type: "string", enum: ["S", "M", "L", "XL", "XXL", "UNKNOWN"] },
          serviceType: { type: "string", enum: ["SHIPMENT", "RETURN", "UNKNOWN"] },
          reference: { type: "string" },
          lengthCm: { type: "number", minimum: 0 },
          widthCm: { type: "number", minimum: 0 },
          heightCm: { type: "number", minimum: 0 },
          sourceRow: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          notes: { type: "string" },
        },
      },
    },
  },
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

function extractResponseText(payload: any) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const chatContent = payload.choices?.[0]?.message?.content;
  if (typeof chatContent === "string") {
    return chatContent;
  }

  for (const output of payload.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function normalizeShipment(shipment: z.infer<typeof shipmentSchema>) {
  const addressLine1 = shipment.addressLine1 || [shipment.street, shipment.houseNumber].filter(Boolean).join(" ");
  const serviceType = shipment.serviceType === "UNKNOWN" && shipment.weightKg > 20 ? "RETURN" : shipment.serviceType;

  return {
    ...shipment,
    addressLine1,
    countryCode: shipment.countryCode.toUpperCase(),
    serviceType,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP 级限流校验
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const ipData = ipRateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - ipData.lastReset > WINDOW_MS) {
    ipData.count = 1;
    ipData.lastReset = now;
  } else {
    ipData.count++;
  }
  ipRateLimitMap.set(ip, ipData);

  if (ipData.count > IP_LIMIT) {
    return json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  // 2. 鉴权校验
  const authHeader = req.headers.get("Authorization");
  const licenseKey = authHeader?.replace("Bearer ", "");

  if (!licenseKey) {
    return json({ error: "未授权：请提供激活码" }, { status: 401 });
  }

  const license = await (prisma as any).license.findUnique({
    where: { key: String(licenseKey) },
  });

  if (!license || !license.isActive) {
    return json({ error: "激活码无效或已被禁用" }, { status: 403 });
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return json({ error: "激活码已过期" }, { status: 403 });
  }

  // 3. License 级限流校验
  const windowStart = new Date(license.windowStart).getTime();
  let updatedRateLimitCount = license.rateLimitCount;
  let updatedWindowStart = license.windowStart;

  if (now - windowStart > WINDOW_MS) {
    updatedRateLimitCount = 1;
    updatedWindowStart = new Date(now);
  } else {
    updatedRateLimitCount++;
  }

  if (updatedRateLimitCount > LICENSE_LIMIT) {
    return json({ error: "该激活码请求频率过高，请一分钟后再试" }, { status: 429 });
  }

  // 4. 更新使用次数和限流状态
  if (license) {
    await (prisma as any).license.update({
      where: { id: license.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        rateLimitCount: updatedRateLimitCount,
        windowStart: updatedWindowStart,
      },
    });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ error: "无效的 JSON 请求体" }, { status: 400 });
  }
  const body = rawBody as ParseRequest;

  // 再次确保 license 存在（为了通过 IDE 的严格检查）
  if (!license) return json({ error: "激活码状态异常" }, { status: 500 });

  const maskedKey = license.key.length > 8 
    ? `${license.key.slice(0, 4)}...${license.key.slice(-4)}` 
    : "***";

  logger.info("[RECEIVE] 收到解析请求", { 
    ip, 
    license: maskedKey, 
    textLength: body.text?.length || 0 
  });

  const parsedRequest = requestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return json({ error: parsedRequest.error.issues[0]?.message || "请求格式无效" }, { status: 400 });
  }

  const provider = process.env.AI_PROVIDER || "openrouter";
  const apiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const keyName = provider === "openai" ? "OPENAI_API_KEY" : "OPENROUTER_API_KEY";
    return json({ error: `服务端缺少 ${keyName}，无法调用地址解析模型` }, { status: 500 });
  }

  const model = provider === "openai"
    ? process.env.OPENAI_ADDRESS_MODEL || "gpt-4o-mini"
    : process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
  const baseUrl = provider === "openai"
    ? process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    : process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const endpoint = provider === "openai" ? "responses" : "chat/completions";

  // --- AI 解析已停用，改用前端本地解析 ---
  return json({ 
    error: "服务端 AI 解析已停用。请确保您的插件已更新至最新版本以使用本地解析功能（响应更迅速且零延迟）。" 
  }, { status: 403 });
  const systemPrompt = [
    "You parse pasted logistics spreadsheet rows into DPD shipment fields.",
    "Keep one shipment per input row when possible.",
    "Infer German and EU address parts carefully. Return empty strings for unknown optional fields.",
    "Use ISO 3166-1 alpha-2 country codes. If country is missing and the address appears German, use DE.",
    "Extract shipment/order reference codes into reference. If both 'Customer Order No' and 'SKU' exist, combine them like 'OrderNo / SKU'.",
    "Extract parcel dimensions into lengthCm, widthCm and heightCm when present. Use 0 when absent.",
    "Set serviceType to RETURN when weightKg is above 20 or the row explicitly says return/retoure.",
    "Special format recognition: The input is a tab-separated row with exactly 18 columns: 1.Sender Name, 2.Sender Phone, 3.Sender Country, 4.Sender City, 5.Sender Address, 6.Sender Zip, 7.Recipient Name, 8.Recipient Company, 9.Recipient Phone, 10.Recipient Country, 11.Recipient City, 12.Recipient Address, 13.Recipient Address2, 14.Recipient Zip, 15.Customer Order No, 16.SKU, 17.Weight(kg), 18.Quantity.",
    "Extract the CUSTOMER'S address (the non-warehouse party).",
    "CRITICAL: Do NOT mix fields. If one column belongs to the warehouse (e.g., 'EXPO Service GmbH' or 'Hua Zhang'), ignore it completely. Do NOT put the warehouse's company name into the customer's company field.",
    "If the customer's company field is empty in the input, the 'company' field in JSON MUST be empty string.",
    "Return JSON only.",
  ].join(" ");
  const userPrompt = `Parse this pasted table text into JSON shipments:\n\n${parsedRequest.data.text}`;

  // 5. 调用 AI
  const startTime = Date.now();
  logger.info("[AI_REQUEST] 发起地址解析", { 
    provider, 
    model, 
    textLength: body.text.length,
    license: maskedKey 
  });

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
            "X-Title": process.env.OPENROUTER_APP_TITLE || "DPD Address Parser",
          }
        : {}),
    },
    body: JSON.stringify(provider === "openai"
      ? {
          model,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: systemPrompt }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: userPrompt }],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "dpd_shipments",
              strict: true,
              schema: shipmentJsonSchema,
            },
          },
        }
      : {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "dpd_shipments",
              strict: true,
              schema: shipmentJsonSchema,
            },
          },
        }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    logger.error("[AI_RESPONSE] AI 接口返回错误", { 
      status: response.status, 
      error: payload.error,
      license: license.key 
    });
    return json({ error: payload.error?.message || "AI 地址解析失败" }, { status: response.status });
  }

  const duration = Date.now() - startTime;
  const outputText = extractResponseText(payload);
  let outputJson: unknown;
  try {
    outputJson = JSON.parse(outputText || "{}");
  } catch (error) {
    logger.error("[AI_RESPONSE] 解析响应 JSON 失败", { 
      outputText, 
      license: license.key 
    });
    return json({ error: "AI 返回的地址不是有效 JSON" }, { status: 502 });
  }

  const parsedOutput = responseSchema.safeParse(outputJson);
  if (!parsedOutput.success) {
    logger.error("[AI_RESPONSE] 响应结构不匹配", { 
      errors: parsedOutput.error.flatten(),
      license: license.key 
    });
    return json({ error: "AI 返回的地址结构不符合预期" }, { status: 502 });
  }

  logger.info("[AI_RESPONSE] 解析成功", { 
    count: parsedOutput.data.shipments.length, 
    durationMs: duration,
    license: license.key 
  });

  return json({
    shipments: parsedOutput.data.shipments.map(normalizeShipment),
    model,
    provider,
  });
} catch (error: any) {
  logger.error("[SYSTEM_ERROR] 未捕获的系统错误", { 
    message: error.message, 
    stack: error.stack 
  });
  return json({ error: "系统内部错误" }, { status: 500 });
}
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
