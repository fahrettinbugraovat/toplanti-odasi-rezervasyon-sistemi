'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();
  
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f4f7fa] via-white to-[#fcedf0] dark:from-[#121212] dark:via-[#1a1a1a] dark:to-[#221518]">
      
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        
        <div className="mb-8">
          <img src="/trtlogo.png" alt="TRT Logo" className="h-10 md:h-12 w-auto object-contain" />
        </div>

        <div className="bg-white dark:bg-[#1c1c1c] w-full max-w-[420px] p-8 sm:p-10 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-[#2d2d2d]">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Giriş Yap</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Devam etmek için hesabınıza giriş yapın.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-medium rounded text-center">
              {error}
            </div>
          )}

          {/* CHROME OTOMATİK DOLDURMAYI ENGELLEMEK İÇİN autoComplete="off" EKLENDİ */}
          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">E-posta</label>
              <div className="flex items-center px-4 py-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] focus-within:border-[#E4032C] focus-within:ring-1 focus-within:ring-[#E4032C] transition-all">
                <span className="material-symbols-outlined text-gray-400 mr-3 text-[20px]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  autoComplete="off" // DÜZELTME
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Şifre</label>
              <div className="flex items-center px-4 py-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] focus-within:border-[#E4032C] focus-within:ring-1 focus-within:ring-[#E4032C] transition-all">
                <span className="material-symbols-outlined text-gray-400 mr-3 text-[20px]">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password" // DÜZELTME: Chrome'u engellemenin en kesin yolu
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-[#E4032C] bg-gray-100 border-gray-300 rounded focus:ring-[#E4032C] focus:ring-2 cursor-pointer" />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">Beni Hatırla</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#E4032C] hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded transition-colors shadow-sm flex justify-center items-center"
            >
              {isLoading ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#2d2d2d] flex justify-center">
            <button type="button" onClick={toggleTheme} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              {theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}
            </button>
          </div>

        </div>
      </div>

      <footer className="w-full bg-white dark:bg-[#1c1c1c] border-t border-gray-200 dark:border-[#2d2d2d] py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-400 z-10 shrink-0">
        <span>© 2026 TRT Bilgi Teknolojileri Daire Başkanlığı</span>
        <Link href="/destek" className="mt-2 md:mt-0 font-medium hover:text-gray-900 dark:hover:text-white transition-colors">Destek</Link>
      </footer>

    </div>
  );
}