'use client';
import { useState, useMemo } from 'react';
import { useReservationData } from '@/app/context/ReservationContext'; // Yol hatası alırsan '../../context/ReservationContext' yapabilirsin.

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
      
      {/* ÜST BAŞLIK */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Toplantı Odaları</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">Sistemdeki tüm toplantı odalarını ve özelliklerini buradan inceleyebilirsiniz.</p>
      </div>

      {/* LİSTE BÖLÜMÜ (Sadece Okunabilir) */}
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
                    <span className={`inline-flex items-center gap-1.5 font-semibold text-sm ${room.status === 'Müsait' ? 'text-emerald-600 dark:text-emerald-500' : room.status === 'Dolu' ? 'text-red-600 dark:text-red-500' : 'text-amber-500 dark:text-amber-400'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${room.status === 'Müsait' ? 'bg-emerald-500' : room.status === 'Dolu' ? 'bg-red-600' : 'bg-amber-500'}`}></span>
                      {room.status}
                    </span>
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