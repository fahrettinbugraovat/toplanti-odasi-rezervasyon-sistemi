'use client';

import { useState, useMemo, useEffect } from 'react';
import { useReservationData } from '@/app/context/ReservationContext';

export default function RoomsPage() {
  // 1. ODALARI VE REZERVASYONLARI MERKEZDEN (CONTEXT) ÇEKİYORUZ
  const { rooms, operations } = useReservationData();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. ZAMANLAYICI (Her dakika saati güncelleyip odanın durumunu kontrol eder)
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000); // 60 saniyede bir tetiklenir
    return () => clearInterval(timer);
  }, []);

  // --- ANLIK DOLULUK HESAPLAMA MOTORU ---
  const getRoomRealtimeStatus = (roomName: string) => {
    if (!now) return 'Müsait';

    const currentDate = new Date(now);
    const currentYear = currentDate.getFullYear();
    const todayStrLocal = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const currentMins = currentDate.getHours() * 60 + currentDate.getMinutes();

    // Sadece aktif olan rezervasyonları filtrele
    const activeMeetings = operations.filter((op: any) => op.status !== 'iptal');

    for (const op of activeMeetings) {
      // 1. Tarih bugüne mi ait?
      let parsedDate = op.date;
      if (parsedDate === 'Bugün') parsedDate = todayStrLocal;
      else {
        const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        const parts = (op.date || "").split(' ');
        if (parts.length === 2) {
          const day = parseInt(parts[0], 10);
          const monthIndex = months.indexOf(parts[1]);
          if (monthIndex !== -1 && !isNaN(day)) {
            parsedDate = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      }

      if (parsedDate !== todayStrLocal) continue; // Bugün değilse atla

      // 2. İsim eşleşiyor mu ve saat aralığı uyuyor mu?
      if (op.details && op.details.includes(roomName)) {
        const detailsParts = op.details.split(' • ');
        if (detailsParts.length >= 2) {
          const timeStr = detailsParts[1].trim(); // Örn: "14:00 - 16:00"
          if (timeStr.includes(' - ')) {
            const [startStr, endStr] = timeStr.split(' - ');
            
            const startMins = parseInt(startStr.split(':')[0], 10) * 60 + parseInt(startStr.split(':')[1], 10);
            const endMins = parseInt(endStr.split(':')[0], 10) * 60 + parseInt(endStr.split(':')[1], 10);

            // Eğer şu anki saat, toplantının başlangıç ve bitiş saati arasındaysa ODA DOLUDUR!
            if (currentMins >= startMins && currentMins < endMins) {
              return 'Dolu';
            }
          }
        }
      }
    }
    
    return 'Müsait';
  };

  // ARAMA FİLTRESİ
  const filteredRooms = useMemo(
    () => rooms.filter((room: any) => 
      room.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
    ),
    [rooms, searchQuery]
  );

  return (
    <div className="w-full flex flex-col h-full overflow-hidden pb-8">
      
      <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#333] rounded-lg shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        
        {/* ARAMA ÇUBUĞU */}
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#212121]">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Oda Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded-lg bg-white dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] transition-colors"
            />
          </div>
        </div>

        {/* TABLO */}
        <div className="overflow-auto flex-1 p-4 md:p-5">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#333]">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Oda Adı</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Kapasite</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Donanımlar</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Mevcut Durum</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-[#2d2d2d]">
              {filteredRooms.map((room: any) => {
                // Her oda için canlı durumu hesaplıyoruz
                const realStatus = getRoomRealtimeStatus(room.name);
                
                return (
                  <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                    
                    <td className="px-4 py-4 font-bold text-sm text-gray-900 dark:text-white">{room.name}</td>
                    
                    <td className="px-4 py-4 text-sm">{room.capacity}</td>
                    
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {room.features?.map((feature: string) => (
                          <span key={feature} className="px-2 py-1 bg-gray-100 dark:bg-[#333] rounded text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 font-semibold text-sm ${realStatus === 'Müsait' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${realStatus === 'Müsait' ? 'bg-emerald-500' : 'bg-red-600'}`}></span>
                        {realStatus}
                      </span>
                    </td>
                    
                  </tr>
                );
              })}
              
              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">search_off</span>
                    <p className="text-sm font-semibold">Aradığınız kriterlere uygun oda bulunamadı.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}