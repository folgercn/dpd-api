import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ExcelParser } from "@/services/excelParser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const dpdAccountId = formData.get("dpdAccountId") as string;

    if (!file || !dpdAccountId) {
      return NextResponse.json({ error: "文件或账号缺失" }, { status: 400 });
    }

    // 验证 DPD 账号是否存在
    const dpdAccount = await prisma.dpdAccount.findUnique({
      where: { id: dpdAccountId }
    });

    if (!dpdAccount) {
      return NextResponse.json({ error: "找不到指定的 DPD 账号" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedOrders = ExcelParser.parse(buffer);

    // 开启事务创建批次和任务
    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.batch.create({
        data: {
          userId: (session.user as any).id,
          fileName: file.name,
          totalCount: parsedOrders.length,
          status: "READY",
        },
      });

      await tx.order.createMany({
        data: parsedOrders.map((o) => ({
          ...o,
          userId: (session.user as any).id,
          dpdAccountId: dpdAccountId,
          batchId: b.id,
          status: "PENDING",
        })),
      });

      return b;
    });

    return NextResponse.json({ 
      success: true, 
      batchId: batch.id, 
      count: parsedOrders.length 
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ 
      error: error.message || "导入过程发生错误" 
    }, { status: 500 });
  }
}
