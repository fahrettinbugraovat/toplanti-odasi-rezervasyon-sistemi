// app/api/auth/mock-ldap/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { createToken } from '../../../lib/jwt';

export async function GET() {
  try {
    // 1. LDAP SİMÜLASYONU: TRT Active Directory sisteminden "Fahrettin" onayı geldi varsayıyoruz.
    const ldapUserEmail = 'fahrettin.ovat@example.com'; 

    // 2. Veritabanında bu kullanıcı var mı bak, yoksa LDAP'tan gelen bilgilerle oluştur.
    let user = await prisma.user.findUnique({ where: { email: ldapUserEmail } });

    if (!user) {
       user = await prisma.user.create({
         data: {
           fullName: 'Fahrettin Buğra OVAT',
           email: ldapUserEmail,
           username: 'fbovat',
           password: 'ldap_generated_password', // LDAP'ta şifre tutulmaz ama Prisma zorunlu kıldığı için dolduruyoruz
           role: 'ADMIN'
         }
       });
    } else if (user.role !== 'ADMIN') {
       user = await prisma.user.update({
         where: { id: user.id },
         data: { role: 'ADMIN' }
       });
    }

    // 3. Kimlik Kartı (JWT) üret
    const token = await createToken({ 
      userId: user.id, 
      role: user.role,
      exp: Date.now() + (1000 * 60 * 60 * 24) // 24 saat geçerli
    });

    const response = NextResponse.json({ message: 'LDAP Simülasyonu Başarılı, giriş yapıldı.' }, { status: 200 });

    // 4. Token'ı güvenli HTTP-Only çereze (Cookie) yerleştir.
    // Frontend JS kodları bunu göremez, sadece tarayıcı API isteklerinde otomatik gönderir.
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 
    });

    return response;
  } catch (error) {
    console.error("LDAP Giriş Hatası:", error);
    return NextResponse.json({ error: 'LDAP Girişi Başarısız' }, { status: 500 });
  }
}