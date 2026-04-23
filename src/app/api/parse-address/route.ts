import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkAndConsumeLicenseRateLimit,
  isLicenseKeyValid,
  maskLicenseKey,
} from "@/lib/license";
import { logger } from "@/lib/logger";
import { getWarehouseInfo } from "@/lib/warehouse";

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

interface ExtractedRowMeta {
  sku: string;
  quantity: number | null;
  weightKg: number | null;
  addressBlock: string;
  sourceRow: string;
}

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
  weightKg: z.number().nonnegative().default(0),
  parcelType: z.enum(["S", "M", "L", "XL", "XXL", "UNKNOWN"]).default("UNKNOWN"),
  serviceType: z.enum(["SHIPMENT", "RETURN", "UNKNOWN"]).default("UNKNOWN"),
  reference: z.string().default(""),
  lengthCm: z.number().nonnegative().default(0),
  widthCm: z.number().nonnegative().default(0),
  heightCm: z.number().nonnegative().default(0),
  sourceRow: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.string().default(""),
  warehouse: z.object({
    recipientName: z.string().default(""),
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    company: z.string().default(""),
    street: z.string().default(""),
    houseNumber: z.string().default(""),
    postalCode: z.string().default(""),
    city: z.string().default(""),
    countryCode: z.string().length(2).default("DE"),
    phone: z.string().default(""),
    email: z.string().default(""),
  }).nullable().optional(),
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
          "warehouse",
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
          warehouse: {
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: [
                  "recipientName",
                  "firstName",
                  "lastName",
                  "company",
                  "street",
                  "houseNumber",
                  "postalCode",
                  "city",
                  "countryCode",
                  "phone",
                  "email",
                ],
                properties: {
                  recipientName: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  company: { type: "string" },
                  street: { type: "string" },
                  houseNumber: { type: "string" },
                  postalCode: { type: "string" },
                  city: { type: "string" },
                  countryCode: { type: "string", minLength: 2, maxLength: 2 },
                  phone: { type: "string" },
                  email: { type: "string" },
                },
              },
              { type: "null" },
            ],
          },
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

function splitCsvLikeFields(line: string) {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "\t" || char === ",")) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function preprocessInputText(rawText: string) {
  const text = String(rawText || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return {
      normalizedText: text,
      rows: [] as ExtractedRowMeta[],
    };
  }

  const lines = text.split("\n");
  const records: string[] = [];
  let buffer = "";
  let quoteCount = 0;

  for (const line of lines) {
    buffer = buffer ? `${buffer}\n${line}` : line;
    quoteCount += (line.match(/"/g) || []).length;

    if (quoteCount % 2 === 0) {
      records.push(buffer.trim());
      buffer = "";
      quoteCount = 0;
    }
  }

  if (buffer.trim()) {
    records.push(buffer.trim());
  }

  const rows = records.map((record) => {
    const fields = splitCsvLikeFields(record);
    if (fields.length < 4) {
      return {
        sku: "",
        quantity: null,
        weightKg: null,
        addressBlock: record.trim(),
        sourceRow: record.trim(),
      };
    }

    const sku = fields[0]?.trim() || "";
    const quantityValue = Number(fields[1]);
    const weightValue = Number(fields[2]);
    const addressBlock = fields.at(-1)?.trim() || "";

    return {
      sku,
      quantity: Number.isFinite(quantityValue) ? quantityValue : null,
      weightKg: Number.isFinite(weightValue) ? weightValue : null,
      addressBlock: addressBlock || record.trim(),
      sourceRow: record.trim(),
    };
  });

  return {
    normalizedText: rows.map((row, index) => {
      return `Record ${index + 1} AddressBlock:\n${row.addressBlock}`;
    }).join("\n\n"),
    rows,
  };
}

function normalizeShipment(shipment: z.infer<typeof shipmentSchema>) {
  const addressLine1 = shipment.addressLine1 || [shipment.street, shipment.houseNumber].filter(Boolean).join(" ");
  const normalizedWeightKg = Number(shipment.weightKg) || 0;
  const serviceType = shipment.serviceType === "UNKNOWN" && normalizedWeightKg <= 20 ? "RETURN" : shipment.serviceType;
  const warehouse = getWarehouseInfo();
  const shouldIncludeWarehouse = serviceType !== "RETURN";

  return {
    ...shipment,
    addressLine1,
    countryCode: shipment.countryCode.toUpperCase(),
    weightKg: normalizedWeightKg,
    serviceType,
    warehouse: shouldIncludeWarehouse ? warehouse : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const ipData = ipRateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - ipData.lastReset > WINDOW_MS) {
      ipData.count = 1;
      ipData.lastReset = now;
    } else {
      ipData.count += 1;
    }
    ipRateLimitMap.set(ip, ipData);

    if (ipData.count > IP_LIMIT) {
      return json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const authHeader = req.headers.get("Authorization");
    const licenseKey = authHeader?.replace("Bearer ", "");

    if (!licenseKey) {
      return json({ error: "未授权：请提供激活码" }, { status: 401 });
    }

    if (!isLicenseKeyValid(String(licenseKey))) {
      return json({ error: "激活码无效" }, { status: 403 });
    }

    const licenseRateLimit = checkAndConsumeLicenseRateLimit(String(licenseKey));
    if (!licenseRateLimit.allowed) {
      return json({ error: "该激活码请求频率过高，请一分钟后再试" }, { status: 429 });
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return json({ error: "无效的 JSON 请求体" }, { status: 400 });
    }
    const body = rawBody as ParseRequest;

    const maskedKey = maskLicenseKey(String(licenseKey));

    logger.info("[RECEIVE] 收到解析请求", {
      ip,
      license: maskedKey,
      textLength: body.text?.length || 0,
      rawText: body.text || "",
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
    const preprocessed = preprocessInputText(parsedRequest.data.text);
    logger.info("[PROCESS] 请求预处理完成", {
      license: maskedKey,
      rawText: parsedRequest.data.text,
      normalizedText: preprocessed.normalizedText,
      rowCount: preprocessed.rows.length,
      rows: preprocessed.rows,
    });

    const systemPrompt = [
      "Parse pasted German address text into DPD shipment JSON.",
      "Keep one shipment per row when possible.",
      "Treat the address block as the customer address.",
      "Infer German address parts carefully.",
      "If country is missing or misspelled but the address is clearly German, use DE.",
      "Use ISO 3166-1 alpha-2 country codes.",
      "Only extract address information.",
      "Do not infer or return model, SKU, quantity, or weight from the text.",
      "Extract phone from the address block when present.",
      "Extract email from the address block when present, including labels such as email, e-mail, 联系邮件, 联系邮箱, or 邮箱.",
      "Extract dimensions when present, otherwise use 0.",
      "Set serviceType to RETURN when weightKg is above 20 or the row says return or retoure.",
      "Do not treat warehouse info such as EXPO Service GmbH, Hua Zhang, or 15257038155 as customer data.",
      "Examples:",
      "Example 1 input: Frau Iskra Miteva / Gruetzmacherstr. 26 / Weyhe / Niedersachsen / Gemany / 28844 / 015736066844 -> recipientName Iskra Miteva, street Gruetzmacherstr., houseNumber 26, postalCode 28844, city Weyhe, countryCode DE, phone 015736066844.",
      "Example 2 input: Name:Steffen Wolter Address:Spielberger Str. 5 City:Karlsbad Province:Baden Wuerttemberg Country:Deutschland Zip Code:76307 Tel:01607994158 -> recipientName Steffen Wolter, street Spielberger Str., houseNumber 5, postalCode 76307, city Karlsbad, countryCode DE, phone 01607994158.",
      "Example 3 input: 收件人:Frau Renate Schober 电话:01713224094 国家:DE 城市:Bayern 省份:Dentlein 地址:Erlmuehler Str. 18 邮编:91599 -> recipientName Renate Schober, street Erlmuehler Str., houseNumber 18, postalCode 91599, countryCode DE, phone 01713224094. Prefer the real town over province labels when possible.",
      "Example 4 input: Frau Marlies Jurk / Kirchgasse 1 / Bad Rodach / Bayern / Germany / 96476 / 01735615703 -> recipientName Marlies Jurk, street Kirchgasse, houseNumber 1, postalCode 96476, city Bad Rodach, countryCode DE, phone 01735615703.",
      "Return JSON only.",
    ].join(" ");
    const userPrompt = `Parse this pasted table text into JSON shipments:\n\n${preprocessed.normalizedText}`;

    const startTime = Date.now();
    logger.info("[AI_REQUEST] 发起地址解析", {
      provider,
      model,
      textLength: body.text.length,
      license: maskedKey,
      normalizedText: preprocessed.normalizedText,
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
                name: "shipment_response",
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
                name: "shipment_response",
                strict: true,
                schema: shipmentJsonSchema,
              },
            },
          }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result) {
      logger.error("[AI_ERROR] 地址解析请求失败", {
        status: response.status,
        provider,
        model,
        response: result,
      });
      return json({ error: "AI 地址解析服务暂时不可用" }, { status: 502 });
    }

    const rawText = extractResponseText(result);
    if (!rawText) {
      logger.error("[AI_ERROR] 未获取到 AI 返回文本", { result });
      return json({ error: "AI 未返回可解析结果" }, { status: 502 });
    }
    logger.info("[AI_RESPONSE] 收到 AI 原始返回", {
      provider,
      model,
      license: maskedKey,
      rawText,
    });

    const parsedJson = JSON.parse(rawText);
    const parsedResponse = responseSchema.safeParse(parsedJson);
    if (!parsedResponse.success) {
      logger.error("[PROCESS_ERROR] AI 返回 JSON 结构无效", {
        issues: parsedResponse.error.issues,
        rawText,
      });
      return json({ error: "AI 返回格式无效" }, { status: 502 });
    }

    const shipments = parsedResponse.data.shipments.map((shipment, index) => {
      const normalized = normalizeShipment(shipment);
      const extracted = preprocessed.rows[index];

      if (!extracted) {
        return normalized;
      }

      const mergedWeightKg = extracted.weightKg ?? normalized.weightKg;
      const mergedServiceType =
        normalized.serviceType === "RETURN" || mergedWeightKg <= 20
          ? "RETURN"
          : "SHIPMENT";

      return {
        ...normalized,
        reference: normalized.reference || extracted.sku || "",
        quantity: extracted.quantity ?? 1,
        sku: extracted.sku || "",
        weightKg: mergedWeightKg,
        serviceType: mergedServiceType,
        warehouse: mergedServiceType === "RETURN" ? null : normalized.warehouse,
        sourceRow: extracted.sourceRow || normalized.sourceRow,
      };
    });
    const durationMs = Date.now() - startTime;

    logger.info("[RESPONSE] 地址解析完成", {
      count: shipments.length,
      durationMs,
      license: maskedKey,
      shipments,
    });

    return json({ shipments });
  } catch (error: any) {
    logger.error("[ERROR] 地址解析接口异常", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
    });
    return json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
