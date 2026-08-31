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

    // BACKEND ZAMAN KONTROLÜ: Geçmiş saate rezervasyon yapılamaz (5 dk tolerans)
    const startObj = new Date(startTime);
    const bufferTime = new Date(Date.now() - 5 * 60000); 
    if (startObj < bufferTime) {
      return NextResponse.json({ error: 'Geçmiş bir tarih veya saat için işlem yapılamaz.' }, { status: 400 });
    }

    const initialStatus = role === 'ADMIN' ? 'ACTIVE' : 'PENDING';

    const newReservation = await prisma.reservation.create({
      data: {
        title,
        startTime: startObj,
        endTime: new Date(endTime),
        roomId,
        userId: userId, 
        status: initialStatus 
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
    const { id, status, action, title, startTime, endTime, roomId } = body;

    if (!id) return NextResponse.json({ error: 'ID gereklidir.' }, { status: 400 });

    const existingReservation = await prisma.reservation.findUnique({ where: { id: id } });
    if (!existingReservation) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 });

    const dataToUpdate: any = {};

    // YÖNETİCİ ONAY / RED İŞLEMİ
    if (role === 'ADMIN' && action === 'APPROVE') {
      dataToUpdate.title = existingReservation.pendingTitle || existingReservation.title;
      dataToUpdate.startTime = existingReservation.pendingStartTime || existingReservation.startTime;
      dataToUpdate.endTime = existingReservation.pendingEndTime || existingReservation.endTime;
      dataToUpdate.pendingTitle = null;
      dataToUpdate.pendingStartTime = null;
      dataToUpdate.pendingEndTime = null;
      dataToUpdate.status = 'ACTIVE';
    } 
    else if (role === 'ADMIN' && action === 'REJECT') {
      dataToUpdate.pendingTitle = null;
      dataToUpdate.pendingStartTime = null;
      dataToUpdate.pendingEndTime = null;
      dataToUpdate.status = 'ACTIVE';
    } 
    // NORMAL KULLANICI / İPTAL VEYA DÜZENLEME İŞLEMİ
    else {
      if (existingReservation.userId !== userId && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
      }

      if (status === 'CANCELLED') {
        dataToUpdate.status = 'CANCELLED';
      } else {
        // BACKEND ZAMAN KONTROLÜ
        if (startTime) {
          const startObj = new Date(startTime);
          const bufferTime = new Date(Date.now() - 5 * 60000);
          if (startObj < bufferTime) {
            return NextResponse.json({ error: 'Geçmiş bir zaman dilimi seçilemez.' }, { status: 400 });
          }
        }

        if (title) dataToUpdate.pendingTitle = title;
        if (startTime) dataToUpdate.pendingStartTime = new Date(startTime);
        if (endTime) dataToUpdate.pendingEndTime = new Date(endTime);
        if (roomId) dataToUpdate.roomId = roomId;

        dataToUpdate.status = 'PENDING';
      }
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