// src/app/api/admin/checkins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }
  return null;
}

// GET /api/admin/checkins
// 返回所有打卡记录，含用户昵称与打卡点名称
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const checkins = await prisma.checkin.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nickname: true } },
        poi: { select: { name: true } },
      },
    });

    const formatted = checkins.map((c) => ({
      id: c.id,
      userId: c.userId,
      routeId: c.routeId,
      poiId: c.poiId,
      status: c.status,
      createdAt: c.createdAt,
      user: { nickname: (c as any).user?.nickname || '' },
      poi: { name: (c as any).poi?.name || '' },
    }));

    return NextResponse.json(
      { success: true, data: { checkins: formatted }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取打卡记录失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}