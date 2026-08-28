import { NextResponse } from 'next/server';
// Not: Eğer '../../lib/prisma' hata verirse, bunu '@/lib/prisma' veya '../../../lib/prisma' olarak değiştirebilirsin.
import prisma from '../../lib/prisma'; 

// ==========================================
// 1. TÜM REZERVASYONLARI GETİR (GET İSTEĞİ)
// ==========================================
export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        room: true,
        user: true, 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(reservations, { status: 200 });
  } catch (error) {
    console.error("Rezervasyonlar çekilirken hata:", error);
    return NextResponse.json({ error: 'Rezervasyonlar getirilirken hata oluştu.' }, { status: 500 });
  }
}

// ==========================================
// 2. YENİ REZERVASYON OLUŞTUR (POST İSTEĞİ)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, startTime, endTime, roomId, userId } = body;

    // Basit bir validasyon
    if (!title || !startTime || !endTime || !roomId || !userId) {
      return NextResponse.json({ error: 'Eksik veri gönderdiniz. Lütfen tüm alanları doldurun.' }, { status: 400 });
    }

    // Prisma ile PostgreSQL'e kaydet
    const newReservation = await prisma.reservation.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomId,
        userId,
        status: 'ACTIVE' 
      },
      include: {
        room: true,
        user: true,
      }
    });

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error) {
    console.error("Rezervasyon eklenirken hata:", error);
    return NextResponse.json({ error: 'Rezervasyon eklenirken hata oluştu.' }, { status: 500 });
  }
}

// ==========================================
// 3. REZERVASYON İPTAL ET / GÜNCELLE (PATCH İSTEĞİ)
// ==========================================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID ve durum (status) gereklidir.' }, { status: 400 });
    }

    // Prisma ile veritabanındaki kaydın durumunu güncelle
    const updatedReservation = await prisma.reservation.update({
      where: { id: id },
      data: { status: status },
    });

    return NextResponse.json(updatedReservation, { status: 200 });
  } catch (error) {
    console.error("Rezervasyon güncellenirken hata:", error);
    return NextResponse.json({ error: 'Rezervasyon güncellenirken hata oluştu.' }, { status: 500 });
  }
}
// ==========================================
// 4. REZERVASYONU VERİTABANINDAN TAMAMEN SİL (DELETE İSTEĞİ)
// ==========================================
export async function DELETE(request: Request) {
  try {
    // YENİ: Paketten (body) değil, doğrudan URL adresinin sonundan ID'yi alıyoruz!
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Silmek için bir ID gereklidir.' }, { status: 400 });
    }

    // Prisma ile o satırı veritabanından tamamen uçur
    await prisma.reservation.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Rezervasyon başarıyla silindi.' }, { status: 200 });
  } catch (error) {
    console.error("Silme hatası:", error);
    return NextResponse.json({ error: 'Rezervasyon silinirken hata oluştu.' }, { status: 500 });
  }
}