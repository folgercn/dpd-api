import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
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

/**
 * 核心提示：后端 AI 解析功能已迁移至插件本地。
 * 这样做是为了提供更快的解析速度（零延迟）并降低服务器负载。
 */
export async function POST(req: NextRequest) {
  return json({ 
    error: "服务端 AI 解析已迁移至插件本地。请确保您的插件已更新至 v1.0.22+，即可享受瞬间解析的快感，无需等待后端响应。" 
  }, { status: 410 }); // 410 Gone 表示功能已永久迁移
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
