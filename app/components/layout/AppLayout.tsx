'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Başlangıçta null atıyoruz ki Next.js sunucu tarafında (SSR) yanlış karar verip ekranı titretmesin
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    // Sayfa yüklendiğinde veya yenilendiğinde hafızaya (localStorage) bakılır
    const savedState = localStorage.getItem('sidebarState');
    if (savedState !== null) {
      setIsSidebarOpen(JSON.parse(savedState));
    } else {
      // Hafızada yoksa ilk girişte mobilde kapalı, masaüstünde açık gelsin
      setIsSidebarOpen(window.innerWidth >= 768);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarState', JSON.stringify(newState));
  };

  const handleCloseSidebar = () => {
    // BURASI ÖNEMLİ: Menü sekmelerine tıklandığında SADECE MOBİLDEYSE menüyü kapat. 
    // Masaüstündeysen menü açık kalmaya devam eder, sadece sayfa değişir.
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Hafızadaki durum okunana kadar titremeyi (flicker) önlemek için arka plan renginde boş ekran gösteriyoruz
  if (isSidebarOpen === null) {
    return <div className="bg-gray-50 dark:bg-[#141414] h-screen w-full"></div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white font-body-lg h-screen overflow-hidden flex flex-col transition-colors duration-300">
      
      <Header onMenuClick={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SADECE MOBİL İÇİN ARKA PLAN KARARTMASI */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/40 dark:bg-black/70 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* DİNAMİK YAN MENÜ (Masaüstünde daralıp genişler) */}
        <div 
          className={`absolute md:relative top-0 left-0 z-50 h-full bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-[#2d2d2d] shadow-2xl md:shadow-none transition-all duration-300 ease-in-out shrink-0
          ${isSidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0 w-[260px] md:w-[80px]'}`}
        >
          <Sidebar onClose={handleCloseSidebar} isExpanded={isSidebarOpen} />
        </div>

        {/* ANA İÇERİK */}
        <main className="min-w-0 flex-1 overflow-hidden w-full relative">
          <div className="p-3 md:p-4 lg:p-5 w-full h-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}