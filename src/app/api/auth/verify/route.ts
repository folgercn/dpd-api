import { NextRequest, NextResponse } from "next/server";
import { isLicenseKeyValid } from "@/lib/license";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ success: false, message: "请输入激活码" }, { status: 400, headers: corsHeaders });
    }

    if (!isLicenseKeyValid(String(licenseKey))) {
      return NextResponse.json({ success: false, message: "激活码不存在" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      message: "激活成功",
      expiresAt: null,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ success: false, message: "服务器内部错误" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
