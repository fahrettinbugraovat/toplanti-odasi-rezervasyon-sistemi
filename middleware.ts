import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/lib/jwt'; // Yolu kendi projene göre kontrol et (örn: '@/app/lib/jwt' veya './lib/jwt')

export async function middleware(request: NextRequest) {
  // 1. Kullanıcının tarayıcısındaki HTTP-Only cookie'yi (Kimlik Kartını) alıyoruz
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
  }

  // 2. Token'ı kendi yazdığımız motorla doğrula
  const decoded: any = await verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
  }

  // 3. API'ye kimin istek attığını bilmesi için Header ekliyoruz
  const requestHeaders = new Headers(request.headers);
  
  // KRİTİK DÜZELTME: Token içindeki ID'yi hem 'id' hem 'userId' olarak arayıp garantiye alıyoruz
  const finalUserId = decoded.id || decoded.userId; 
  
  requestHeaders.set('x-user-id', String(finalUserId));
  requestHeaders.set('x-user-role', String(decoded.role || 'USER'));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Hangi yolların bu kapıdan geçeceğini belirtiyoruz
export const config = {
  matcher: [
    '/api/users',
    '/api/users/:path*',
    '/api/reservations',
    '/api/reservations/:path*'
  ]
};