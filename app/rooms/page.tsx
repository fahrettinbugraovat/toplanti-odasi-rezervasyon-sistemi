'use client';
import { useState, useMemo } from 'react';
import { useReservationData } from '@/app/context/ReservationContext'; 

export default function RoomsPage() {
  const { rooms } = useReservationData();
  const [searchQuery, setSearchQuery] = useState('');

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

        {/* TABLO - GRID IZGARA GÖRÜNÜMÜ (3 SÜTUN) */}
        <div className="overflow-auto flex-1 p-4 md:p-5">
          <table className="w-full text-left border-collapse min-w-[600px] border border-gray-300 dark:border-[#404040]">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-[#404040] w-1/3">Oda Adı</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-[#404040] w-1/4">Kapasite</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border border-gray-300 dark:border-[#404040] w-auto">Donanımlar</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {filteredRooms.map((room: any) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                  
                  <td className="px-4 py-4 font-bold text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-[#404040]">
                    {room.name}
                  </td>
                  
                  <td className="px-4 py-4 text-sm border border-gray-300 dark:border-[#404040]">
                    {room.capacity}
                  </td>
                  
                  <td className="px-4 py-4 border border-gray-300 dark:border-[#404040]">
                    <div className="flex flex-wrap gap-2">
                      {room.features.map((feature: string) => (
                        <span key={feature} className="px-2 py-1 bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#4d4d4d] rounded text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                </tr>
              ))}
              
              {/* ODA BULUNAMAMA DURUMU (colSpan 3 olarak düzeltildi) */}
              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-[#404040]">
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