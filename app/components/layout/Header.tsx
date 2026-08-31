'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../context/UserContext'; 

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, mounted } = useUser(); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown); 
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Panel Özeti';
      case '/rooms': return 'Toplantı Odaları';
      case '/calendar': return 'Rezervasyon';
      case '/my-meetings': return 'Toplantılarım';
      case '/profile': return 'Profil Ayarları';
      case '/admin': return 'Yönetici Paneli';
      default: return 'Panel Özeti';
    }
  };

  // 1. LOGIN SAYFASINDA HEADER'I GİZLE
  if (pathname === '/login') return null;

  // 2. ÇIKIŞ YAPMA (LOGOUT) FONKSİYONU
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsProfileOpen(false);
      // Soft navigation yerine tarayıcıyı zorla yenileyerek Login sayfasına gönderiyoruz
      // (Eski UserContext verilerinin tamamen silinmesi için)
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2d2d2d] flex justify-between items-center h-[72px] px-4 md:px-6 shrink-0 w-full z-50 relative">
        
        {/* SOL KISIM */}
        <div className="flex items-center">
          {/* Masaüstü Logo */}
          <div className="hidden md:flex mr-5 items-center">
            <Link href="/" aria-label="Ana sayfa">
              <img src="/trtlogo.png" alt="TRT Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>
          {/* Hamburger Menü */}
          <button onClick={onMenuClick} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] mr-3">
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-wide hidden sm:block transition-colors">
            {getPageTitle()}
          </h1>
        </div>
        
        {/* ========================================================= */}
        {/* ORTA KISIM: MOBİL TRT LOGOSU (SADECE MOBİLDE VE TAM ORTADA) */}
        {/* ========================================================= */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden flex items-center justify-center">
          <Link href="/" aria-label="Ana sayfa">
            <img src="/trtlogo.png" alt="TRT Logo" className="h-7 w-auto object-contain" />
          </Link>
        </div>
        {/* ========================================================= */}

        {/* SAĞ KISIM: Profil Menüsü */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative ml-1" ref={profileRef}>
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center transition-colors ${isProfileOpen ? 'border-[#E4032C]' : 'border-gray-200 dark:border-[#2d2d2d] hover:border-gray-400'}`}>
              {mounted && user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[28px] text-gray-500 dark:text-gray-400">account_circle</span>
              )}
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex flex-col items-start">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate w-full">{mounted ? user.fullName : 'Yükleniyor...'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full">{mounted ? user.email : ''}</span>
                  
                  {mounted && user.username && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium truncate w-full">
                      @{user.username}
                    </span>
                  )}
                  
                  <span className="mt-2 text-[10px] font-bold tracking-wider bg-[#E4032C] text-white px-2 py-0.5 rounded-full uppercase">{mounted ? user.role : 'Admin'}</span>
                </div>
                
                <div className="py-1">
                  <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">manage_accounts</span>Profil Ayarları
                  </Link>
                  
                  {mounted && user.role.toLowerCase() === 'admin' && (
                    <Link href="/admin" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>Yönetici Paneli
                    </Link>
                  )}
                </div>

                <div className="py-1 border-t border-gray-200 dark:border-[#2d2d2d]">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#E4032C] hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">logout</span>Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}