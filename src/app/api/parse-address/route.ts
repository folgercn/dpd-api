import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().trim().min(1, "请提供要解析的表格文本"),
});

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
  const parsedRequest = requestSchema.safeParse(await req.json().catch(() => ({})));
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
  const systemPrompt = [
    "You parse pasted logistics spreadsheet rows into DPD shipment fields.",
    "Keep one shipment per input row when possible.",
    "Infer German and EU address parts carefully. Return empty strings for unknown optional fields.",
    "Use ISO 3166-1 alpha-2 country codes. If country is missing and the address appears German, use DE.",
    "Extract shipment/order reference codes into reference when present, such as SKU-like or order-number-like cells.",
    "Extract parcel dimensions into lengthCm, widthCm and heightCm when present. Use 0 when absent.",
    "Set serviceType to RETURN when weightKg is above 20 or the row explicitly says return/retoure.",
    "Return JSON only.",
  ].join(" ");
  const userPrompt = `Parse this pasted table text into JSON shipments:\n\n${parsedRequest.data.text}`;

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
    console.error("OpenAI address parse error:", payload);
    return json({ error: payload.error?.message || "AI 地址解析失败" }, { status: response.status });
  }

  const outputText = extractResponseText(payload);
  let outputJson: unknown;
  try {
    outputJson = JSON.parse(outputText || "{}");
  } catch (error) {
    console.error("Non-JSON structured address response:", outputText, error);
    return json({ error: "AI 返回的地址不是有效 JSON" }, { status: 502 });
  }

  const parsedOutput = responseSchema.safeParse(outputJson);
  if (!parsedOutput.success) {
    console.error("Invalid structured address response:", outputText, parsedOutput.error.flatten());
    return json({ error: "AI 返回的地址结构不符合预期" }, { status: 502 });
  }

  return json({
    shipments: parsedOutput.data.shipments.map(normalizeShipment),
    model,
    provider,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
