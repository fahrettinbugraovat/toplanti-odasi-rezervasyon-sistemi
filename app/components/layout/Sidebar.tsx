'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext'; 

interface SidebarProps {
  onClose: () => void;
  isExpanded?: boolean; 
}

export default function Sidebar({ onClose, isExpanded = true }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  // LOGIN SAYFASINDA MENÜYÜ GİZLEME MANTIĞI EKLENDİ
  if (pathname === '/login') return null;

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-lg text-sm transition-colors border-l-[3px] relative ${
      isActive ? 'text-gray-900 dark:text-white font-bold border-[#E4032C] bg-gray-100 dark:bg-[#2a2a2a]' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-transparent font-semibold'
    }`;
  };

  const getIconStyle = (path: string) => {
    return pathname === path ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  const navigateToTab = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    router.push(path);
  };

  return (
    <nav className="flex flex-col h-full py-4 bg-white dark:bg-[#1c1c1c] overflow-y-auto overflow-x-hidden">
      
      <ul className={`flex flex-col gap-2 flex-grow ${isExpanded ? 'px-4' : 'px-3'}`}>
        <li>
          <Link href="/" onClick={(event) => navigateToTab(event, '/')} className={getLinkClass('/')} title="Panel Özeti">
            <span className="material-symbols-outlined text-[22px]" style={getIconStyle('/')}>dashboard</span>
            {isExpanded && <span className="whitespace-nowrap">Panel Özeti</span>}
          </Link>
        </li>
        <li>
          <Link href="/rooms" onClick={(event) => navigateToTab(event, '/rooms')} className={getLinkClass('/rooms')} title="Toplantı Odaları">
            <span className="material-symbols-outlined text-[22px]" style={getIconStyle('/rooms')}>meeting_room</span>
            {isExpanded && <span className="whitespace-nowrap">Toplantı Odaları</span>}
          </Link>
        </li>
        <li>
          <Link href="/calendar" onClick={(event) => navigateToTab(event, '/calendar')} className={getLinkClass('/calendar')} title="Takvim">
            <span className="material-symbols-outlined text-[22px]" style={getIconStyle('/calendar')}>calendar_month</span>
            {isExpanded && <span className="whitespace-nowrap">Rezervasyon</span>}
          </Link>
        </li>
        <li>
          <Link href="/my-meetings" onClick={(event) => navigateToTab(event, '/my-meetings')} className={getLinkClass('/my-meetings')} title="Toplantılarım">
            <span className="material-symbols-outlined text-[22px]" style={getIconStyle('/my-meetings')}>event_available</span>
            {isExpanded && <span className="whitespace-nowrap">Toplantılarım</span>}
          </Link>
        </li>
      </ul>
      
      <div className={`mt-5 flex flex-col gap-1.5 pb-2 ${isExpanded ? 'px-4' : 'px-3'}`}>
        <div className="border-t border-gray-200 dark:border-[#2d2d2d] mb-2 pt-3"></div>
        
        <div 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}
          className={`flex items-center ${isExpanded ? 'justify-between p-2.5' : 'justify-center py-2.5'} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded text-sm font-semibold cursor-pointer transition-colors`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
            {isExpanded && <span className="whitespace-nowrap">{theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}</span>}
          </div>
          {isExpanded && (
            <div className={`w-9 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#E4032C]' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}