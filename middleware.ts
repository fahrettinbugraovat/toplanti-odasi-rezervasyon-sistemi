import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/lib/jwt'; // Yolu kendi projene göre kontrol et (örn: '@/app/lib/jwt' veya './lib/jwt')

type AuthPayload = {
  id?: string;
  userId?: string;
  role?: string;
};

const isAuthPayload = (value: unknown): value is AuthPayload => {
  return typeof value === 'object' && value !== null;
};

export async function middleware(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Kullanıcının tarayıcındaki HTTP-Only cookie'yi (Kimlik Kartını) alıyoruz
  const token = request.cookies.get('auth_token')?.value;

  if (isLoginPage && !token) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApiRequest) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Token'ı kendi yazdığımız motorla doğrula
  const decoded = await verifyToken(token);

  if (!decoded || !isAuthPayload(decoded)) {
    if (isApiRequest) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
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
    '/',
    '/login',
    '/rooms',
    '/calendar',
    '/my-meetings',
    '/profile',
    '/admin',
    '/api/users',
    '/api/users/:path*',
    '/api/rooms/:path*',
    '/api/reservations',
    '/api/reservations/:path*'
  ]
};