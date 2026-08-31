import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers'; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId || userId === 'undefined') {
      return NextResponse.json({ error: 'Yetkisiz işlem. Kimlik bulunamadı.' }, { status: 401 });
    }

    // KRİTİK DÜZELTME: Gelen ID'yi Prisma'nın anlayacağı tipe (Sayıysa sayıya, metinse metne) çeviriyoruz
    const parsedId = isNaN(Number(userId)) ? userId : Number(userId);

    const user = await prisma.user.findUnique({
      where: { id: parsedId as any }
    });

    if (!user) {
       return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error("Kullanıcı çekilirken hata:", error);
    return NextResponse.json({ error: 'Kullanıcı bilgileri getirilemedi.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId || userId === 'undefined') {
      return NextResponse.json({ error: 'Yetkisiz işlem. Kimlik bulunamadı.' }, { status: 401 });
    }

    // ID Tipi düzeltmesi
    const parsedId = isNaN(Number(userId)) ? userId : Number(userId);

    const body = await request.json();
    // EKSİK OLAN ŞİFRE (newPassword) EKLENDİ
    const { fullName, username, email, phone, avatarUrl, newPassword } = body;

    let finalAvatarUrl = avatarUrl;

    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      const base64Data = avatarUrl.split(';base64,').pop();
      const extMatch = avatarUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
      const ext = extMatch ? extMatch[1] : 'jpg';
      
      const fileName = `avatar-${parsedId}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

      finalAvatarUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;
    } else if (avatarUrl === null) {
      finalAvatarUrl = null; 
    }

    const dataToUpdate: any = {};
    if (fullName !== undefined) dataToUpdate.fullName = fullName;
    if (username !== undefined) dataToUpdate.username = username;
    if (email !== undefined) dataToUpdate.email = email;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = finalAvatarUrl;
    if (newPassword !== undefined) dataToUpdate.password = newPassword; // ŞİFRE DB'YE YAZILIYOR

    const updatedUser = await prisma.user.update({
      where: { id: parsedId as any },
      data: dataToUpdate
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error("Veritabanı güncelleme hatası:", error);
    return NextResponse.json({ error: 'Güncelleme başarısız.' }, { status: 500 });
  }
}