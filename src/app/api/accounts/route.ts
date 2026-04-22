import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const accounts = await prisma.dpdAccount.findMany({
    where: { 
      userId: (session.user as any).id,
      status: "ACTIVE" 
    },
    select: {
      id: true,
      accountName: true,
      dpdUsername: true,
    }
  });

  return NextResponse.json(accounts);
}
