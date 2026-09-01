'use client';
import { useState, useMemo } from 'react';
import { useReservationData } from '@/app/context/ReservationContext'; // Yol hatası alırsan '../../context/ReservationContext' yapabilirsin.
import { HarBadge, HarInput } from '../ui/HarUI';

export default function RoomsPage() {
  const { rooms } = useReservationData();
  const [searchQuery, setSearchQuery] = useState('');

  // Sadece isme göre arama işlevi bırakıldı
  const filteredRooms = useMemo(
    () => rooms.filter((room: any) => 
      room.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
    ),
    [rooms, searchQuery]
  );

  return (
    <div className="w-full flex flex-col h-full overflow-hidden pb-8">
      
     

      {/* LİSTE BÖLÜMÜ (Sadece Okunabilir) */}
      <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#333] rounded-lg shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        
        {/* ARAMA ÇUBUĞU */}
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#212121]">
          <div className="w-full sm:w-80">
            <HarInput
              type="text"
              placeholder="Oda Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              color="gray"
              variant="outlined"
              size="lg"
              border={{ radius: '4' }}
              className="w-full border border-gray-300 bg-white text-sm text-gray-900 transition-colors dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white"
            />
          </div>
        </div>

        {/* TABLO (İşlemler ve Rezervasyon Yönetimi Yok) */}
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
              {filteredRooms.map((room: any) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                  
                  {/* ODA ADI */}
                  <td className="px-4 py-4 font-bold text-sm text-gray-900 dark:text-white">{room.name}</td>
                  
                  {/* KAPASİTE */}
                  <td className="px-4 py-4 text-sm">{room.capacity}</td>
                  
                  {/* ÖZELLİKLER */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {room.features.map((feature: string) => (
                        <span key={feature} className="px-2 py-1 bg-gray-100 dark:bg-[#333] rounded text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* DURUM (Müsait, Dolu vb.) */}
                  <td className="px-4 py-4">
                    <HarBadge
                      dot
                      variant="surface-borderless"
                      status={room.status === 'Müsait' ? 'success' : room.status === 'Dolu' ? 'danger' : 'warning'}
                      className={`inline-flex items-center gap-1.5 font-semibold text-sm ${room.status === 'Müsait' ? 'text-emerald-600 dark:text-emerald-500' : room.status === 'Dolu' ? 'text-red-600 dark:text-red-500' : 'text-amber-500 dark:text-amber-400'}`}
                    >
                      {room.status}
                    </HarBadge>
                  </td>
                  
                </tr>
              ))}
              
              {/* ODA BULUNAMAMA DURUMU */}
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