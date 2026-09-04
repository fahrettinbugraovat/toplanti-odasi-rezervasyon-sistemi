import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '../../../lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const requireAdmin = async () => {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const role = requestHeaders.get('x-user-role');

  if (!userId || userId === 'undefined') {
    return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
  }

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
  }

  return null;
};

const parseRoomData = (body: any) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const capacityValue = typeof body.capacity === 'string' ? body.capacity.trim() : String(body.capacity ?? '').trim();
  const features = Array.isArray(body.features)
    ? body.features.filter((feature: unknown): feature is string => typeof feature === 'string').map((feature: string) => feature.trim()).filter(Boolean)
    : [];
  const capacity = Number(capacityValue.replace(/\s*Kişi$/i, ''));

  if (!name || !Number.isInteger(capacity) || capacity < 1 || features.length === 0) {
    return null;
  }

  return { name, capacity: `${capacity} Kişi`, features };
};

export async function PUT(request: Request, context: RouteContext) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  try {
    const { id } = await context.params;
    const data = parseRoomData(await request.json());
    if (!data) {
      return NextResponse.json({ error: 'Oda adı, geçerli kapasite ve en az bir özellik gereklidir.' }, { status: 400 });
    }

    const room = await prisma.room.update({ where: { id }, data });
    return NextResponse.json(room, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Oda bulunamadı.' }, { status: 404 });
    }
    console.error('Oda güncellenirken hata:', error);
    return NextResponse.json({ error: 'Oda güncellenirken hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  try {
    const { id } = await context.params;

    await prisma.$transaction(async (transaction) => {
      await transaction.reservation.deleteMany({ where: { roomId: id } });
      await transaction.room.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Oda başarıyla silindi.' }, { status: 200 });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Oda bulunamadı.' }, { status: 404 });
    }
    console.error('Oda silinirken hata:', error);
    return NextResponse.json({
      error: 'Oda silinirken hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}