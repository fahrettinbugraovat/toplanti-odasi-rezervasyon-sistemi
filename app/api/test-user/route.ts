import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Şifreyi yine güvenli (hash'li) hale getiriyoruz
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // 2. Sisteme standart yetkili (USER) yeni bir personel hesabı ekliyoruz
    const newTestUser = await prisma.user.create({
      data: {
        fullName: 'TRT Personel',
        username: 'trtpersonel',
        email: 'personel@trt.net.tr',
        password: hashedPassword,
        phone: '05559998877',
        role: 'USER' // Dikkat: Bu sefer ADMIN değil, normal USER
      }
    });

    return NextResponse.json({ 
      message: 'İkinci test kullanıcısı (Standart Personel) başarıyla eklendi!', 
      user: {
        isim: newTestUser.fullName,
        email: newTestUser.email,
        sifre: '123456',
        yetki: newTestUser.role
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Kullanıcı oluşturma hatası:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu e-posta adresi (personel@trt.net.tr) zaten kayıtlı.' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Kullanıcı oluşturulamadı.' }, { status: 500 });
  }
}