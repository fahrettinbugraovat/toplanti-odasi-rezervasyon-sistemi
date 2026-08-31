// lib/jwt.ts
// DIŞ KÜTÜPHANE KULLANILMAMIŞTIR - Saf Web Crypto API

const SECRET_KEY = process.env.JWT_SECRET || "trt-super-gizli-anahtar-2026";

// Base64Url Yardımcı Fonksiyonları
function base64UrlEncode(str: string) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

async function getKey() {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// 1. TOKEN OLUŞTURUCU (LDAP Başarılı olunca çalışacak)
export async function createToken(payload: any) {
  const header = { alg: "HS256", typ: "JWT" };
  const dataToSign = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dataToSign));
  
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const encodedSignature = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${dataToSign}.${encodedSignature}`;
}

// 2. TOKEN DOĞRULAYICI (Middleware kapısında çalışacak)
export async function verifyToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const dataToVerify = `${parts[0]}.${parts[1]}`;
    let base64Sig = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) base64Sig += '=';
    
    const binarySig = atob(base64Sig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) sigBytes[i] = binarySig.charCodeAt(i);

    const key = await getKey();
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(dataToVerify));

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.exp && payload.exp < Date.now()) return null; // Süresi geçmiş mi?

    return payload;
  } catch (error) {
    return null;
  }
}