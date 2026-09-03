import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Prisma yolunu kendi projene göre ayarla
import { createToken } from '../../../lib/jwt'; // JWT motorunun yolu
import bcrypt from 'bcryptjs'; // BCRYPTJS EKLENDİ

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur.' }, { status: 400 });
    }

    // 1. Veritabanından kullanıcıyı e-posta ile bul
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // 2. Kullanıcı yoksa güvenlik amacıyla genel bir hata dön
    if (!user) {
      return NextResponse.json({ error: 'Geçersiz e-posta veya şifre.' }, { status: 401 });
    }

    // 3. ŞİFREYİ BCRYPT İLE KONTROL ET (Kritik Güvenlik Güncellemesi)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Geçersiz e-posta veya şifre.' }, { status: 401 });
    }

    // 4. Şifre doğru! Kendi yazdığımız motorla JWT Kimlik Kartını oluştur
    const token = await createToken({ 
      id: user.id, 
      role: user.role 
    });

    const response = NextResponse.json({ message: 'Giriş başarılı.' }, { status: 200 });

    // 5. Kimlik kartını tarayıcının çerezlerine (Cookie) güvenli bir şekilde yerleştir
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {})
    });

    return response;
    
  } catch (error) {
    console.error('Giriş API hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}