'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useReservationData } from '../context/ReservationContext';
import { useToast } from '../context/ToastContext';

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, mounted } = useUser();
  const { rooms, setRooms, operations, setOperations } = useReservationData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ozet' | 'odalar' | 'rezervasyonlar'>('ozet');

  // Yeni Oda State
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    features: ''
  });

  // --- YETKİLENDİRME KONTROLÜ ---
  useEffect(() => {
    if (mounted) {
      if (user.role.toLowerCase() !== 'admin') {
        router.push('/'); // Admin değilse ana sayfaya yönlendir
      }
    }
  }, [mounted, user, router]);

  // Sayfa yüklenmediyse veya yetkisizse hiçbir şey gösterme
  if (!mounted || user.role.toLowerCase() !== 'admin') return null;

  // --- DİNAMİK VERİ HESAPLAMALARI ---
  const activeOperations = operations.filter((op: any) => op.status !== 'iptal');
  const cancelledOperations = operations.filter((op: any) => op.status === 'iptal');

  // --- ODA EKLEME İŞLEMİ ---
  const handleAddRoom = () => {
    if (!newRoom.name.trim() || !newRoom.capacity.trim() || !newRoom.features.trim()) {
      showToast({ type: 'error', title: 'Eksik Bilgi', message: 'Lütfen tüm oda bilgilerini doldurun.' });
      return;
    }

    if (isNaN(Number(newRoom.capacity))) {
      showToast({ type: 'error', title: 'Geçersiz Kapasite', message: 'Kapasite sadece sayısal bir değer olmalıdır.' });
      return;
    }

    try {
      const featuresArray = newRoom.features.split(',').map(f => f.trim()).filter(f => f !== '');
      
      const addedRoom = {
        id: Date.now().toString(),
        name: newRoom.name.trim(),
        capacity: `${newRoom.capacity.trim()} Kişi`,
        features: featuresArray,
        status: 'Müsait' as 'Müsait',
        lockEndTime: null
      };

      setRooms([...rooms, addedRoom]); 
      setNewRoom({ name: '', capacity: '', features: '' }); 
      setActiveTab('ozet'); 
      
      showToast({ type: 'success', title: 'Oda Eklendi', message: 'Toplantı odası başarıyla sisteme eklendi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Oda Eklenemedi', message: 'Toplantı odası eklenirken bir hata oluştu.' });
    }
  };

  // --- REZERVASYON İPTAL İŞLEMİ ---
  const handleCancelReservation = (id: number) => {
    try {
      setOperations(operations.map((op: any) => op.id === id ? { ...op, status: 'iptal' } : op));
      showToast({ type: 'success', title: 'Rezervasyon İptal Edildi', message: 'Rezervasyon başarıyla iptal edildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Rezervasyon iptal edilemedi.' });
    }
  };

  return (
    // Sağ alt butona çarpmaması için pb-32 eklendi
    <div className="w-full flex flex-col gap-6 md:gap-8 pb-32 overflow-y-auto max-w-[1400px] mx-auto">
      
    

      {/* SEKME (TAB) MENÜSÜ */}
      <div className="flex border-b border-gray-200 dark:border-[#2d2d2d] shrink-0 gap-6 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('ozet')} className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'ozet' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          İstatistikler / Özet
          {activeTab === 'ozet' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
        <button onClick={() => setActiveTab('odalar')} className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'odalar' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          Odaları Düzenle
          {activeTab === 'odalar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
        <button onClick={() => setActiveTab('rezervasyonlar')} className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'rezervasyonlar' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          Rezervasyonları Yönet
          {activeTab === 'rezervasyonlar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 min-h-0">
        
        {/* 1. SEKME: ÖZET BİLGİLER */}
        {activeTab === 'ozet' && (
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* ÜST KARTLAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam Oda</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{rooms.length}</h3>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[28px]">meeting_room</span></div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aktif Rezervasyon</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeOperations.length}</h3>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[28px]">event_available</span></div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İptal Edilenler</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{cancelledOperations.length}</h3>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[28px]">event_busy</span></div>
              </div>
            </div>

            {/* ALT LİSTELER: AKTİF VE İPTAL EDİLEN REZERVASYONLAR */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              
              {/* Aktif Rezervasyonlar */}
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-fit">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-[20px]">event_available</span>
                    Aktif Rezervasyonlar
                  </h2>
                </div>
                <div className="p-2 flex flex-col max-h-[350px] overflow-y-auto">
                  {activeOperations.length > 0 ? (
                    activeOperations.map((op: any) => (
                      <div key={op.id} className="p-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{op.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{op.details}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500">{op.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-3xl opacity-50 mb-2">event_note</span>
                      <p className="text-sm font-semibold">Aktif rezervasyon bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* İptal Edilen Rezervasyonlar */}
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-fit">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#E4032C] text-[20px]">event_busy</span>
                    İptal Edilenler
                  </h2>
                </div>
                <div className="p-2 flex flex-col max-h-[350px] overflow-y-auto">
                  {cancelledOperations.length > 0 ? (
                    cancelledOperations.map((op: any) => (
                      <div key={op.id} className="p-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors rounded opacity-75">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white line-through">{op.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{op.details}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500">{op.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-3xl opacity-50 mb-2">history</span>
                      <p className="text-sm font-semibold">İptal edilen rezervasyon bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. SEKME: ODALARI DÜZENLE (YENİ ODA EKLEME) */}
        {activeTab === 'odalar' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
            {/* ODA EKLEME FORMU */}
            <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500">add_box</span>
                  Toplantı Odası Ekle
                </h2>
              </div>
              <div className="p-6 md:p-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Oda İsmi</label>
                  <input type="text" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} placeholder="Örn: Huddle Room" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kapasite (Kişi Sayısı)</label>
                  <input type="number" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="Örn: 10" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Özellikler (Virgülle ayırın)</label>
                  <input type="text" value={newRoom.features} onChange={e => setNewRoom({...newRoom, features: e.target.value})} placeholder="Örn: TV, Kamera, Mikrofon" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
              </div>
              <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3">
                <button onClick={() => setNewRoom({name: '', capacity: '', features: ''})} className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] rounded transition-colors">Temizle</button>
                <button onClick={handleAddRoom} className="px-8 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">Odayı Ekle</button>
              </div>
            </div>

            {/* MEVCUT ODALAR LİSTESİ */}
            <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-fit">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500">meeting_room</span>
                  Mevcut Odalar
                </h2>
              </div>
              <div className="p-2 flex flex-col max-h-[400px] overflow-y-auto">
                {rooms.map((room) => (
                  <div key={room.id} className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors rounded">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{room.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{room.capacity} • {room.features.join(', ')}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${room.status === 'Müsait' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500' : 'bg-gray-100 text-gray-600 dark:bg-[#333] dark:text-gray-400'}`}>
                      Sistemde
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SEKME: REZERVASYONLARI YÖNET */}
        {activeTab === 'rezervasyonlar' && (
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">edit_calendar</span>
                Rezervasyon Yönetimi
              </h2>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2d2d2d]">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanıcı / Başlık</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Oda</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih & Saat</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-[#2d2d2d]">
                  {operations.length > 0 ? (
                    operations.map((op: any) => {
                      const [roomName, timeStr] = op.details.split(' • ');
                      const isCancelled = op.status === 'iptal';
                      return (
                        <tr key={op.id} className={`hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${isCancelled ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <p className={`font-bold text-sm ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>{op.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sistem Kullanıcısı</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">{roomName}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold">{op.date}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{timeStr}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-500' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500'}`}>
                              {isCancelled ? 'İptal Edildi' : 'Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleCancelReservation(op.id)} 
                              disabled={isCancelled}
                              className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${isCancelled ? 'bg-gray-100 text-gray-400 dark:bg-[#333] dark:text-gray-500 cursor-not-allowed' : 'bg-white border border-[#E4032C] text-[#E4032C] hover:bg-[#E4032C] hover:text-white dark:bg-transparent dark:border-[#E4032C] dark:hover:bg-[#E4032C] dark:hover:text-white'}`}
                            >
                              İptal Et
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm font-semibold">Sistemde henüz bir rezervasyon bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}