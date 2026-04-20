import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const batchId = searchParams.get("batchId") || undefined;

  const orders = await prisma.order.findMany({
    where: {
      userId: (session.user as any).id,
      status: status,
      batchId: batchId,
    },
    include: {
      dpdAccount: {
        select: {
          accountName: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json(orders);
}
