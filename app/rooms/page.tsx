'use client';
import { useState } from 'react';
import { useReservationData } from '../context/ReservationContext';

export default function RoomsPage() {
  const { rooms } = useReservationData(); 
  const [activeTab, setActiveTab] = useState<'oda' | 'rezervasyon'>('oda');
  const [searchQuery, setSearchQuery] = useState('');

  // YETKİLENDİRME KONTROLÜ: Kendi sistemindeki Auth yapısına (örn. NextAuth, JWT, Context) 
  // göre burayı dinamik hale getirebilirsin. Şimdilik test edebilmen için bir değişken olarak bıraktım.
  // true yaparsan butonlar görünür, false yaparsan sadece izleme moduna geçer.
  const isAdmin = true; 

  const filteredRooms = rooms.filter((room: any) => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col h-full">
      
      {/* BAŞLIK */}
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Oda ve Rezervasyon Yönetimi</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">Sistemdeki tüm odaları ve aktif rezervasyonları yönetin.</p>
      </div>

      {/* SEKMELER */}
      <div className="flex border-b border-gray-200 dark:border-[#2d2d2d] mb-6 shrink-0">
        <button 
          onClick={() => setActiveTab('oda')}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            activeTab === 'oda' 
              ? 'text-[#E4032C]' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Oda Yönetimi
          {activeTab === 'oda' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E4032C] rounded-t-md"></div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('rezervasyon')}
          className={`pb-3 px-4 text-sm font-bold transition-colors relative ${
            activeTab === 'rezervasyon' 
              ? 'text-[#E4032C]' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Rezervasyon Yönetimi
          {activeTab === 'rezervasyon' && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E4032C] rounded-t-md"></div>
          )}
        </button>
      </div>

      {activeTab === 'oda' ? (
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#333] rounded-lg shadow-sm dark:shadow-none flex flex-col flex-1 min-h-0 overflow-hidden">
          
          <div className="p-4 md:p-5 border-b border-gray-200 dark:border-[#333] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-white dark:bg-[#1c1c1c]">
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
            
            {/* SADECE ADMİNLER YENİ ODA EKLEYEBİLİR */}
            {isAdmin && (
              <button className="w-full sm:w-auto px-5 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Yeni Oda Ekle
              </button>
            )}
          </div>

          <div className="overflow-auto flex-1 min-h-0 relative p-4 md:p-5">
            {/* TABLO - TAM IZGARA (GRID) ÇİZGİLERİ VE DURUM SÜTUNU ÇIKARILMIŞ HALİ */}
            <table className="w-full text-left border-collapse border border-gray-200 dark:border-[#333] min-w-[700px] xl:min-w-full">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#212121]">
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#333]">Oda Adı</th>
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#333]">Kapasite</th>
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#333]">Özellikler</th>
                  
                  {/* SADECE ADMİNLER İŞLEMLER SÜTUNUNU GÖREBİLİR */}
                  {isAdmin && (
                    <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider text-right border border-gray-200 dark:border-[#333]">İşlemler</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {filteredRooms.map((room: any) => (
                  <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group">
                    
                    <td className="px-4 py-3 md:px-5 md:py-4 bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333]">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{room.name}</span>
                    </td>
                    
                    <td className="px-4 py-3 md:px-5 md:py-4 bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333]">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{room.capacity}</span>
                    </td>
                    
                    <td className="px-4 py-3 md:px-5 md:py-4 bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333]">
                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature: string) => (
                          <span key={feature} className="px-2.5 py-1 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </td>
                    
                    {/* SADECE ADMİNLER İÇİN BUTONLAR */}
                    {isAdmin && (
                      <td className="px-4 py-3 md:px-5 md:py-4 text-right bg-white dark:bg-[#1c1c1c] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333]">
                        <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Düzenle">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="text-gray-400 hover:text-[#E4032C] transition-colors" title="Sil">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col items-center justify-center flex-1 min-h-[400px]">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">event_note</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rezervasyon Yönetimi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">Tüm rezervasyonların geçmişini ve detaylarını buradan yönetebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}