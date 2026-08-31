'use client';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Giriş başarısız oldu.');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#111111] text-white' : 'bg-[#f4f4f4] text-[#1f1f1f]'}`}>
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="mb-7 md:mb-8">
          <img src="/trtlogo.png" alt="TRT Logo" className="h-12 md:h-16 w-auto object-contain" />
        </div>

        <div className={`w-full max-w-[420px] rounded-[10px] border ${theme === 'dark' ? 'bg-[#1b1b1b] border-[#2b2b2b] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]' : 'bg-[#f5f5f5] border-[#e5e5e5] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]'} p-5 sm:p-6`}>
          <div className="mb-6 text-center">
            <h2 className={`text-[1.7rem] md:text-[1.9rem] font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#1b1b1b]'}`}>
              Giriş Yap
            </h2>
          </div>

          {error && (
            <div className="mb-5 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className={`mb-2 block text-[0.9rem] font-semibold ${theme === 'dark' ? 'text-[#e6e6e6]' : 'text-[#2a2a2a]'}`}>
                E-posta
              </label>
              <div className="relative">
                <span className={`material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${theme === 'dark' ? 'text-[#d2d2d2]' : 'text-[#6b6b6b]'}`}>
                  person
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  autoComplete="off"
                  required
                  className={`h-[48px] w-full rounded-[6px] border py-2 pl-10 pr-4 text-[0.98rem] focus:outline-none focus:ring-2 focus:ring-[#E4032C] focus:border-[#E4032C] ${theme === 'dark' ? 'bg-[#2b2b2b] border-[#3a3a3a] text-white placeholder:text-[#a1a1a1]' : 'bg-[#f3f3f3] border-[#d4d4d4] text-[#1d1d1d] placeholder:text-[#8a8a8a]'}`}
                />
              </div>
            </div>

            <div>
              <label className={`mb-2 block text-[0.9rem] font-semibold ${theme === 'dark' ? 'text-[#e6e6e6]' : 'text-[#2a2a2a]'}`}>
                Şifre
              </label>
              <div className="relative">
                <span className={`material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${theme === 'dark' ? 'text-[#d2d2d2]' : 'text-[#6b6b6b]'}`}>
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className={`h-[48px] w-full rounded-[6px] border py-2 pl-10 pr-10 text-[0.98rem] focus:outline-none focus:ring-2 focus:ring-[#E4032C] focus:border-[#E4032C] ${theme === 'dark' ? 'bg-[#2b2b2b] border-[#3a3a3a] text-white placeholder:text-[#a1a1a1]' : 'bg-[#f3f3f3] border-[#d4d4d4] text-[#1d1d1d] placeholder:text-[#8a8a8a]'}`}
                />
                <span className={`material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] ${theme === 'dark' ? 'text-[#d2d2d2]' : 'text-[#6b6b6b]'}`}>
                  visibility_off
                </span>
              </div>
            </div>

            <div className="flex items-center pt-0.5">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#8a8a8a] bg-[#f3f3f3] text-[#E4032C] focus:ring-[#E4032C]"
              />
              <label htmlFor="remember" className={`ml-2 cursor-pointer select-none text-sm ${theme === 'dark' ? 'text-[#d7d7d7]' : 'text-[#3d3d3d]'}`}>
                Beni Hatırla
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`flex h-[48px] w-full items-center justify-center rounded-[6px] bg-[#E4032C] px-4 text-[0.98rem] font-semibold text-white transition-colors duration-200 hover:bg-[#c90026] disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
            </button>

            <div className="pt-1">
              <div className="flex items-center justify-between border-t border-[#d9d9d9] pt-3">
                <div className={`flex items-center gap-2 text-[0.95rem] font-medium ${theme === 'dark' ? 'text-white' : 'text-[#3b3b3b]'}`}>
                  <span className={`material-symbols-outlined text-[18px] ${theme === 'dark' ? 'text-white' : 'text-[#8a8a8a]'}`}>
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span>{theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}</span>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Tema değiştir"
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-[#4b5563]' : 'bg-[#dfe3e8]'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <footer className={`flex w-full items-center justify-between border-t px-6 py-4 text-xs ${theme === 'dark' ? 'border-[#262626] bg-[#111111] text-[#a3a3a3]' : 'border-[#e5e5e5] bg-[#f8f8f8] text-[#666666]'}`}>
        <span>© 2026 TRT Bilgi Teknolojileri Daire Başkanlığı</span>
        <Link href="/destek" className="font-medium transition-colors hover:text-[#E4032C]">Destek</Link>
      </footer>

    </div>
  );
}