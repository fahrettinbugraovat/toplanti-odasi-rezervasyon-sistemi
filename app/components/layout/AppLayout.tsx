'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState');
    if (savedState !== null) {
      setIsSidebarOpen(JSON.parse(savedState));
    } else {
      setIsSidebarOpen(window.innerWidth >= 768);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarState', JSON.stringify(newState));
  };

  const handleCloseSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (isSidebarOpen === null) {
    return <div className="bg-gray-50 dark:bg-[#141414] h-screen w-full"></div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white font-body-lg h-screen overflow-hidden flex flex-col relative">
      
      <Header onMenuClick={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/40 dark:bg-black/70 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div 
          className={`absolute md:relative top-0 left-0 z-50 h-full bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-[#2d2d2d] shadow-2xl md:shadow-none transition-all duration-300 ease-in-out shrink-0
          ${isSidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0 w-[260px] md:w-[80px]'}`}
        >
          <Sidebar onClose={handleCloseSidebar} isExpanded={isSidebarOpen} />
        </div>

        <main className="min-w-0 flex-1 overflow-hidden w-full relative">
          <div className="p-3 md:p-4 lg:p-5 w-full h-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* FLOATING ACTION BUTTON (SAĞ ALT KÖŞE) - DOĞRUDAN TAKVİME YÖNLENDİRİR */}
      <Link
        href="/calendar" 
        className="
          fixed bottom-6 right-6 z-[99999] 
          flex items-center justify-center gap-2 
          bg-[#E4032C] hover:bg-[#c30225] text-white 
          px-4 py-4 sm:px-6 sm:py-4 
          rounded-full 
          shadow-[0_8px_16px_-4px_rgba(228,3,44,0.4)] 
          hover:shadow-[0_12px_20px_-4px_rgba(228,3,44,0.6)] 
          dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.5)] 
          dark:hover:shadow-[0_12px_20px_-4px_rgba(0,0,0,0.7)] 
          transform hover:-translate-y-1 hover:scale-105 
          transition-all duration-300 ease-out cursor-pointer
        "
        title="Yeni Rezervasyon"
      >
        <span className="material-symbols-outlined text-[24px] font-bold">add</span>
        <span className="hidden sm:block font-bold text-sm tracking-wide whitespace-nowrap">
          Yeni Rezervasyon
        </span>
      </Link>
      
    </div>
  );
}