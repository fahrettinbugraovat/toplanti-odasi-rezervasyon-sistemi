'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useReservationData } from '../context/ReservationContext';
import { useToast } from '../context/ToastContext';

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, mounted } = useUser();
  const { 
    rooms, setRooms, 
    operations, setOperations,
    approveOperationEdit, rejectOperationEdit, cancelOperation 
  } = useReservationData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ozet' | 'odalar' | 'rezervasyonlar' | 'onaylar'>('ozet');
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', features: '' });

  // --- YETKİLENDİRME KONTROLÜ ---
  useEffect(() => {
    if (mounted && user.role.toLowerCase() !== 'admin') {
      router.push('/'); 
    }
  }, [mounted, user, router]);

  if (!mounted || user.role.toLowerCase() !== 'admin') return null;

  // --- DİNAMİK VERİ FİLTRELEME ---
  const activeOperations = operations.filter((op: any) => op.status !== 'iptal' && op.status !== 'bekliyor');
  const cancelledOperations = operations.filter((op: any) => op.status === 'iptal');
  const pendingOperations = operations.filter((op: any) => op.status === 'bekliyor');

  // --- AKILLI SIRALAMA ---
  const sortedOperationsForTable = [...operations].sort((a: any, b: any) => {
    const getStatusWeight = (status: string) => {
      if (status === 'bekliyor') return 1;
      if (status === 'aktif' || !status) return 2;
      if (status === 'iptal') return 3;
      return 4;
    };
    const weightA = getStatusWeight(a.status);
    const weightB = getStatusWeight(b.status);
    if (weightA !== weightB) return weightA - weightB;
    return b.id - a.id; 
  });

  // --- ODA EKLEME ---
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
      showToast({ type: 'success', title: 'Oda Eklendi', message: 'Toplantı odası başarıyla sisteme eklendi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Oda Eklenemedi', message: 'Toplantı odası eklenirken bir hata oluştu.' });
    }
  };

  // --- REZERVASYON İPTAL İŞLEMİ ---
  const handleCancelReservation = (id: number) => {
    cancelOperation(id);
    showToast({ type: 'success', title: 'Rezervasyon İptal Edildi', message: 'Rezervasyon başarıyla iptal edildi ve geçmişe taşındı.' });
  };

  // --- ONAY VE RED İŞLEMLERİ ---
  const handleApprove = (id: number) => {
    approveOperationEdit(id);
    showToast({ type: 'success', title: 'Değişiklik Onaylandı', message: 'Rezervasyon değişikliği başarıyla uygulandı.' });
  };

  const handleReject = (id: number) => {
    rejectOperationEdit(id);
    showToast({ type: 'success', title: 'Değişiklik Reddedildi', message: 'Rezervasyon değişikliği reddedildi, mevcut kayıt korundu.' });
  };

  return (
    // DIŞ SCROLL KALDIRILDI: h-full ve overflow-hidden eklendi. Listelerin içi scroll edilecek.
    <div className="w-full flex flex-col gap-5 h-full max-w-[1400px] mx-auto overflow-hidden">
      
     

      {/* SEKME MENÜSÜ */}
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
          Tüm Rezervasyonlar
          {activeTab === 'rezervasyonlar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
        <button onClick={() => setActiveTab('onaylar')} className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'onaylar' ? 'text-[#E4032C]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
          Onay Bekleyenler
          {pendingOperations.length > 0 && (
            <span className="bg-[#E4032C] text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOperations.length}</span>
          )}
          {activeTab === 'onaylar' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E4032C]"></div>}
        </button>
      </div>

      {/* İÇERİK ALANI (Esnek ve listeleri kapsayacak bölüm) */}
      <div className="flex-1 min-h-0 flex flex-col">
        
        {/* ==================================================== */}
        {/* 1. SEKME: ÖZET BİLGİLER VE KART LİSTELER             */}
        {/* ==================================================== */}
        {activeTab === 'ozet' && (
          <div className="flex flex-col gap-5 flex-1 min-h-0">
            
            {/* ÜST İSTATİSTİK KARTLARI (Daralmaz) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Toplam Oda</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{rooms.length}</h3>
                </div>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/10 rounded flex items-center justify-center text-[#E4032C]">
                  <span className="material-symbols-outlined text-[24px]">meeting_room</span>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Aktif Rezervasyon</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{activeOperations.length}</h3>
                </div>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/10 rounded flex items-center justify-center text-[#E4032C]">
                  <span className="material-symbols-outlined text-[24px]">event_available</span>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">İptal Edilenler</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{cancelledOperations.length}</h3>
                </div>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/10 rounded flex items-center justify-center text-[#E4032C]">
                  <span className="material-symbols-outlined text-[24px]">event_busy</span>
                </div>
              </div>
            </div>

            {/* DİNAMİK KART LİSTELERİ (Esnek alan - İçeride Scroll) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
              
              {/* AKTİF REZERVASYONLAR */}
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2d2d2d] shrink-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-[22px]">event_available</span>
                    Aktif Rezervasyonlar
                  </h2>
                </div>
                <div className="px-6 flex flex-col flex-1 min-h-0 overflow-y-auto pb-24">
                  {activeOperations.length > 0 ? (
                    activeOperations.map((op: any) => {
                      const [roomName, timeStr] = op.details.split(' • ');
                      return (
                        <div key={op.id} className="py-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 flex justify-between items-center group">
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#E4032C] transition-colors">{op.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roomName} • {timeStr}</p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500 whitespace-nowrap">
                            {op.date}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-3xl opacity-50 mb-2">history</span>
                      <p className="text-sm font-semibold">Aktif rezervasyon bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* İPTAL EDİLENLER */}
              <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2d2d2d] shrink-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#E4032C] text-[22px]">event_busy</span>
                    İptal Edilenler
                  </h2>
                </div>
                <div className="px-6 flex flex-col flex-1 min-h-0 overflow-y-auto pb-24">
                  {cancelledOperations.length > 0 ? (
                    cancelledOperations.map((op: any) => {
                      const [roomName, timeStr] = op.details.split(' • ');
                      return (
                        <div key={op.id} className="py-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 flex justify-between items-center opacity-70">
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white line-through">{op.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roomName} • {timeStr}</p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-[#E4032C] dark:bg-red-900/20 whitespace-nowrap">
                            {op.date}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-4xl opacity-40 mb-3">history</span>
                      <p className="text-sm font-semibold">İptal edilen rezervasyon bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. SEKME: ODALARI DÜZENLE                            */}
        {/* ==================================================== */}
        {activeTab === 'odalar' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
            <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] shrink-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500">add_box</span>
                  Toplantı Odası Ekle
                </h2>
              </div>
              <div className="p-6 md:p-8 space-y-5 flex-1 min-h-0 overflow-y-auto pb-24">
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
              <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                <button onClick={() => setNewRoom({name: '', capacity: '', features: ''})} className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] rounded transition-colors">Temizle</button>
                <button onClick={handleAddRoom} className="px-8 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">Odayı Ekle</button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] shrink-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500">meeting_room</span>
                  Mevcut Odalar
                </h2>
              </div>
              <div className="p-2 flex flex-col flex-1 min-h-0 overflow-y-auto pb-24">
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

        {/* ==================================================== */}
        {/* 3. SEKME: TÜM REZERVASYONLAR (AKILLI SIRALAMALI)     */}
        {/* ==================================================== */}
        {activeTab === 'rezervasyonlar' && (
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">list_alt</span>
                Tüm Rezervasyon İşlemleri
              </h2>
            </div>
            <div className="overflow-x-auto w-full flex-1 min-h-0 overflow-y-auto pb-24">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2d2d2d] z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih & Detay</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-[#2d2d2d]">
                  {sortedOperationsForTable.map((op: any) => {
                    const isCancelled = op.status === 'iptal';
                    const isPending = op.status === 'bekliyor';
                    const isAct = op.status === 'aktif' || !op.status;
                    
                    return (
                      <tr key={op.id} className={`hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${isCancelled ? 'opacity-50' : isPending ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                        <td className="px-6 py-4">
                          <p className={`font-bold text-sm ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>{op.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold">{isPending ? op.pendingChanges?.date : op.date}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{isPending ? op.pendingChanges?.details : op.details}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isAct && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500">Aktif</span>}
                          {isCancelled && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-gray-200 text-gray-600 dark:bg-[#333] dark:text-gray-400">İptal Edildi</span>}
                          {isPending && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-500 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">schedule</span> Onay Bekliyor</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isPending ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleReject(op.id)} className="px-3 py-1.5 text-[11px] font-bold rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-[#333] dark:text-gray-300 dark:hover:bg-[#444]">Reddet</button>
                              <button onClick={() => handleApprove(op.id)} className="px-3 py-1.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400">Onayla</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleCancelReservation(op.id)} 
                              disabled={isCancelled}
                              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${isCancelled ? 'opacity-0 cursor-not-allowed' : 'bg-white border border-[#E4032C] text-[#E4032C] hover:bg-[#E4032C] hover:text-white dark:bg-transparent dark:border-[#E4032C] dark:hover:bg-[#E4032C] dark:hover:text-white'}`}
                            >
                              İptal Et
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. SEKME: ONAY BEKLEYENLER                           */}
        {/* ==================================================== */}
        {activeTab === 'onaylar' && (
          <div className="bg-white dark:bg-[#1c1c1c] border border-[#E4032C]/30 dark:border-[#E4032C]/50 rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
            <div className="px-6 py-5 border-b border-[#E4032C]/20 dark:border-[#E4032C]/30 bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C] text-[22px]">rule</span>
                Onay Bekleyen Değişiklik Talepleri
              </h2>
              <span className="text-xs font-bold bg-white dark:bg-[#141414] border border-[#E4032C]/30 text-[#E4032C] px-3 py-1 rounded-full">{pendingOperations.length} Kayıt</span>
            </div>
            <div className="px-6 flex flex-col flex-1 min-h-0 overflow-y-auto pb-24">
              {pendingOperations.length > 0 ? (
                pendingOperations.map((op: any) => {
                  const [oldRoomName, oldTimeStr] = op.details.split(' • ');
                  const [newRoomName, newTimeStr] = (op.pendingChanges?.details || '').split(' • ');
                  return (
                    <div key={op.id} className="py-5 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{op.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.fullName}</p>
                      </div>
                      <div className="flex-[2] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-gray-100 dark:border-[#333]">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Mevcut Durum</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{op.date}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{oldRoomName} • {oldTimeStr}</p>
                        </div>
                        <span className="hidden sm:block material-symbols-outlined text-gray-300 dark:text-gray-600">arrow_forward</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-[#E4032C] uppercase mb-1">Yeni Talep</p>
                          <p className="text-sm text-gray-900 dark:text-white font-bold">{op.pendingChanges?.date}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{newRoomName} • {newTimeStr}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => handleReject(op.id)} className="px-5 py-2 text-xs font-bold rounded bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#444] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors">Reddet</button>
                        <button onClick={() => handleApprove(op.id)} className="px-5 py-2 text-xs font-bold rounded bg-[#E4032C] hover:bg-red-700 text-white transition-colors">Onayla</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl opacity-40 mb-3">fact_check</span>
                  <p className="text-sm font-semibold">Onay bekleyen değişiklik talebi bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}