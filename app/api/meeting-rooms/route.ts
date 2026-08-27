import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma'; 

// ==========================================
// 1. TÜM ODALARI GETİR (GET İSTEĞİ)
// ==========================================
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error("Odalar çekilirken hata:", error);
    return NextResponse.json({ error: 'Odalar getirilirken hata oluştu.' }, { status: 500 });
  }
}

// ==========================================
// 2. YENİ ODA EKLE (POST İSTEĞİ)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, capacity, features } = body;

    // Basit bir validasyon (Eksik veri kontrolü)
    if (!name || !capacity || !features) {
      return NextResponse.json({ error: 'Eksik veri gönderdiniz.' }, { status: 400 });
    }

    // Prisma ile PostgreSQL'e kaydet
    const newRoom = await prisma.room.create({
      data: {
        name,
        capacity,
        features, 
        status: 'Müsait' // Varsayılan durum
      }
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("Oda eklenirken hata:", error);
    return NextResponse.json({ error: 'Oda eklenirken hata oluştu.' }, { status: 500 });
  }
}