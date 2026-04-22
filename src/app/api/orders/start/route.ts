import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { batchId } = body;

    // 1. 查找待处理的订单
    const orders = await prisma.order.findMany({
      where: {
        userId: (session.user as any).id,
        batchId: batchId || undefined,
        status: "PENDING",
      },
      select: { id: true }
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: "没有待处理的订单" });
    }

    // 2. 只需要将订单状态更新为 QUEUED
    // 背景轮询 Worker 会自动捡起这些状态为 QUEUED 的订单
    await prisma.order.updateMany({
      where: { id: { in: orders.map(o => o.id) } },
      data: { status: "QUEUED" }
    });

    return NextResponse.json({ 
      success: true, 
      count: orders.length 
    });

  } catch (error: any) {
    console.error("Start processing error:", error);
    return NextResponse.json({ 
      error: error.message || "启动任务失败" 
    }, { status: 500 });
  }
}
