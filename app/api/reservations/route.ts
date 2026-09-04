import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma'; 
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');
    const filterStatus = searchParams.get('status');

    // ==========================================
    // OTOMATİK ZAMAN KONTROLÜ (TIMEZONE DÜZELTİLMİŞ)
    // Süresi dolan ve hala ACTIVE olan rezervasyonları COMPLETED olarak güncelle
    // ==========================================
    // Prisma ve veritabanı genellikle tarihleri UTC olarak saklar. 
    // Karşılaştırma yaparken güvenli olması için new Date() kullanıyoruz.
    const now = new Date();
    
    await prisma.reservation.updateMany({
      where: {
        endTime: {
          lte: now, // Bitiş zamanı şu andan küçük veya eşitse
        },
        status: 'ACTIVE', // Sadece aktif olanları güncelle
      },
      data: {
        status: 'COMPLETED',
      },
    });
    // ==========================================

    let whereClause: any = {};

    if (filterUserId && filterUserId !== 'undefined' && filterUserId !== 'null') {
      whereClause.userId = filterUserId;
    }

    if (filterStatus && filterStatus !== 'undefined' && filterStatus !== 'null') {
      whereClause.status = filterStatus; 
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        room: true,
        user: { select: { id: true, fullName: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error("API GET Hatası:", error);
    return NextResponse.json({ error: 'Rezervasyonlar getirilirken hata oluştu.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role');

    if (!userId || userId === 'undefined') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, startTime, endTime, roomId } = body;

    if (!title || !startTime || !endTime || !roomId) {
      return NextResponse.json({ error: 'Eksik veri gönderdiniz.' }, { status: 400 });
    }

    const startObj = new Date(startTime);
    const endObj = new Date(endTime);
    const now = new Date();

    if (endObj <= now) {
      return NextResponse.json({ error: 'Rezervasyonun bitiş zamanı şu anki zamandan önce veya eşit olamaz.' }, { status: 400 });
    }

    const startDateOnly = new Date(startObj);
    startDateOnly.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(now);
    todayDateOnly.setHours(0, 0, 0, 0);

    if (startDateOnly < todayDateOnly) {
      return NextResponse.json({ error: 'Geçmiş bir tarih için rezervasyon yapılamaz.' }, { status: 400 });
    }

    const newReservation = await prisma.reservation.create({
      data: {
        title,
        startTime: startObj,
        endTime: new Date(endTime),
        roomId,
        userId: userId,
        status: 'ACTIVE'
      },
      include: {
        room: true,
        user: { select: { id: true, fullName: true, email: true } }
      }
    });

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error("POST Hatası:", error);
    return NextResponse.json({ error: 'Kayıt oluşturulamadı.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role');

    if (!userId || userId === 'undefined') return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const body = await request.json();
    const { id, status, title, startTime, endTime, roomId } = body;

    if (!id) return NextResponse.json({ error: 'ID gereklidir.' }, { status: 400 });

    const existingReservation = await prisma.reservation.findUnique({ where: { id: id } });
    if (!existingReservation) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

    if (existingReservation.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    const dataToUpdate: any = {};

    if (status === 'CANCELLED') {
      dataToUpdate.status = 'CANCELLED';
    } else {
      if (title) dataToUpdate.title = title;
      if (startTime) {
        dataToUpdate.startTime = new Date(startTime);
      }
      if (endTime) {
        dataToUpdate.endTime = new Date(endTime);
      }

      const finalStart = dataToUpdate.startTime ?? existingReservation.startTime;
      const finalEnd = dataToUpdate.endTime ?? existingReservation.endTime;
      const now = new Date();

      if (new Date(finalEnd) <= now) {
        return NextResponse.json({ error: 'Rezervasyonun bitiş zamanı şu anki zamandan önce veya eşit olamaz.' }, { status: 400 });
      }

      const finalStartDateOnly = new Date(finalStart);
      finalStartDateOnly.setHours(0, 0, 0, 0);
      const todayDateOnly = new Date(now);
      todayDateOnly.setHours(0, 0, 0, 0);

      if (finalStartDateOnly < todayDateOnly) {
        return NextResponse.json({ error: 'Geçmiş bir tarih için rezervasyon yapılamaz.' }, { status: 400 });
      }

      if (roomId) dataToUpdate.roomId = roomId;
      dataToUpdate.status = 'ACTIVE';
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedReservation, { status: 200 });
  } catch (error) {
    console.error("PATCH Hatası:", error);
    return NextResponse.json({ error: 'Güncelleme başarısız.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role');

    if (!userId || userId === 'undefined') return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID gereklidir.' }, { status: 400 });
    
    const existingReservation = await prisma.reservation.findUnique({ where: { id: id } });
    if (!existingReservation) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

    if (existingReservation.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
    }

    await prisma.reservation.delete({ where: { id: id } });
    return NextResponse.json({ message: 'Silindi.' }, { status: 200 });
  } catch (error) {
    console.error("DELETE Hatası:", error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}