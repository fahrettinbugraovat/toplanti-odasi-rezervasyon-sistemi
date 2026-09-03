'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../context/UserContext'; 
import { HarButton } from '../ui/HarUI';

// 1. BAŞ HARFLERİ BULAN FONKSİYONU EKLİYORUZ
const getInitials = (name: string) => {
  if (!name) return 'K';

  const nameArray = name.trim().split(' ').filter(Boolean);
  if (nameArray.length === 0) return 'K';
  if (nameArray.length === 1) return nameArray[0].charAt(0).toUpperCase();
  
  const firstInitial = nameArray[0].charAt(0);
  const lastInitial = nameArray[nameArray.length - 1].charAt(0);
  
  return (firstInitial + lastInitial).toUpperCase();
};

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

  // LOGIN SAYFASINDA HEADER'I GİZLE
  if (pathname === '/login') return null;

  // ÇIKIŞ YAPMA (LOGOUT) FONKSİYONU
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsProfileOpen(false);
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
          <div className="hidden md:flex mr-5 items-center">
            <Link href="/" aria-label="Ana sayfa">
              <img src="/trtlogo.png" alt="TRT Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>
          <HarButton onClick={onMenuClick} variant="borderless" color="gray" className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] mr-3">
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </HarButton>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-wide hidden sm:block transition-colors">
            {getPageTitle()}
          </h1>
        </div>
        
        {/* ORTA KISIM: MOBİL TRT LOGOSU */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden flex items-center justify-center">
          <Link href="/" aria-label="Ana sayfa">
            <img src="/trtlogo.png" alt="TRT Logo" className="h-7 w-auto object-contain" />
          </Link>
        </div>

        {/* SAĞ KISIM: Profil Menüsü */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative ml-1" ref={profileRef}>
            
            {/* 2. BURASI DEĞİŞTİ: Sağ üstteki yuvarlak ikon */}
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center transition-colors bg-[#E4032C] text-white font-bold select-none ${isProfileOpen ? 'border-[#E4032C]' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'}`}
            >
              {mounted ? getInitials(user.fullName) : 'K'}
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex flex-col items-start">
                  
                  {/* 3. BURAYA DA UFAK BİR AVATAR EKLEDİK (Menü içi daha şık durur) */}
                  <div className="flex items-center gap-3 w-full mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#E4032C] text-white font-bold flex items-center justify-center select-none shrink-0 border-2 border-white dark:border-[#1c1c1c]">
                       {mounted ? getInitials(user.fullName) : 'K'}
                    </div>
                    <div className="flex flex-col w-full overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate w-full">{mounted ? user.fullName : 'Yükleniyor...'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full">{mounted ? user.email : ''}</span>
                    </div>
                  </div>

                  {mounted && user.username && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate w-full">
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
                  <HarButton
                    onClick={handleLogout}
                    color="red"
                    align="left"
                    icon={{
                      element: <span className="material-symbols-outlined text-[20px]">logout</span>,
                      position: 'start',
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#E4032C] hover:bg-red-50 dark:hover:bg-red-900/10 [&>.text]:flex [&>.text]:items-center [&>.text]:gap-3"
                  >
                    Çıkış Yap
                  </HarButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}