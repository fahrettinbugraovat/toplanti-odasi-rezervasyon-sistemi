import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Başarıyla çıkış yapıldı.' }, { status: 200 });
    
    // Güvenli kimlik çerezini (auth_token) tarayıcıdan siliyoruz
    response.cookies.delete('auth_token');
    
    return response;
  } catch (error) {
    console.error('Çıkış yapma hatası:', error);
    return NextResponse.json({ error: 'Çıkış işlemi başarısız.' }, { status: 500 });
  }
}