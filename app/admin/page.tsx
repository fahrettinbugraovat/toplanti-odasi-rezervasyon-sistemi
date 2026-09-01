'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useReservationData } from '../context/ReservationContext';
import { useToast } from '../context/ToastContext';
import { HarButton } from '../components/ui/HarUI';

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, mounted } = useUser();
  const { 
    rooms, setRooms, 
    operations, setOperations,
    cancelOperation 
  } = useReservationData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ozet' | 'odalar' | 'rezervasyonlar'>('ozet');
  
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '', features: '' });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<any>(null); 
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60000); 
    return () => clearInterval(timer);
  }, []);

  // --- YETKİLENDİRME KONTROLÜ ---
  useEffect(() => {
    if (mounted && user.role.toLowerCase() !== 'admin') {
      router.push('/'); 
    }
  }, [mounted, user, router]);

  if (!mounted || user.role.toLowerCase() !== 'admin') return null;

  // --- ZAMAN VE TAMAMLANMA KONTROLÜ ---
  const getLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isMeetingCompleted = (op: any) => {
    if (!now) return false;
    const currentYear = new Date(now).getFullYear();
    const todayStrLocal = getLocalYYYYMMDD(new Date(now));
    
    let parsedDate = op.date;
    if (parsedDate === 'Bugün') parsedDate = todayStrLocal;
    else if (parsedDate === 'Yarın') {
       const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
       parsedDate = getLocalYYYYMMDD(tmr);
    } else {
       const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
       const parts = (op.date || "").split(' ');
       if (parts.length === 2) {
          const day = parseInt(parts[0], 10);
          const monthIndex = months.indexOf(parts[1]);
          if (monthIndex !== -1 && !isNaN(day)) {
             const m = String(monthIndex + 1).padStart(2, '0');
             const d = String(day).padStart(2, '0');
             parsedDate = `${currentYear}-${m}-${d}`;
          }
       }
    }

    if (parsedDate < todayStrLocal) return true; 
    if (parsedDate > todayStrLocal) return false; 
    
    const detailsParts = (op.details || '').split(' • ');
    if (detailsParts.length >= 2) {
       const timeStr = detailsParts[1].trim();
       if (timeStr.includes(' - ')) {
         const endStr = timeStr.split(' - ')[1];
         const endHour = parseInt(endStr.split(':')[0], 10);
         const endMin = parseInt(endStr.split(':')[1], 10);
         const d = new Date(now);
         const currentMins = d.getHours() * 60 + d.getMinutes();
         const endMins = endHour * 60 + endMin;
         return currentMins >= endMins;
       }
    }
    return false;
  };

  const activeOperations = operations.filter((op: any) => op.status !== 'iptal' && !isMeetingCompleted(op));
  const cancelledOperations = operations.filter((op: any) => op.status === 'iptal');

  const sortedOperationsForTable = [...operations].sort((a: any, b: any) => {
    const getStatusWeight = (op: any) => {
      if (op.status === 'iptal') return 4;
      if (isMeetingCompleted(op)) return 3; 
      return 2; 
    };
    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);
    if (weightA !== weightB) return weightA - weightB;
    return b.id < a.id ? -1 : 1; 
  });

  // --- ODA EKLEME API ENTEGRASYONU ---
  const handleSaveRoom = async () => {
    if (!roomForm.name.trim() || !roomForm.capacity.trim() || !roomForm.features.trim()) {
      showToast({ type: 'error', title: 'Eksik Bilgi', message: 'Lütfen tüm oda bilgilerini doldurun.' });
      return;
    }
    if (isNaN(Number(roomForm.capacity))) {
      showToast({ type: 'error', title: 'Geçersiz Kapasite', message: 'Kapasite sadece sayısal bir değer olmalıdır.' });
      return;
    }

    const featuresArray = roomForm.features.split(',').map(f => f.trim()).filter(f => f !== '');

    if (editingRoomId) {
      showToast({ type: 'error', title: 'Hazırlanıyor', message: 'Oda düzenleme altyapısı bir sonraki adımda eklenecek!' });
      return;
    } 

    try {
      const response = await fetch('/api/meeting-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomForm.name.trim(),
          capacity: `${roomForm.capacity.trim()} Kişi`,
          features: featuresArray
        })
      });

      if (!response.ok) throw new Error('Veritabanına kaydedilemedi');

      const newRoom = await response.json();
      
      setRooms([{ ...newRoom, status: 'Müsait', lockEndTime: null }, ...rooms]); 
      setRoomForm({ name: '', capacity: '', features: '' }); 
      showToast({ type: 'success', title: 'Oda Eklendi', message: 'Oda veritabanına başarıyla kaydedildi.' });

    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Oda kaydedilirken bir hata oluştu.' });
    }
  };

  const handleEditRoomClick = (room: any) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      capacity: room.capacity.replace(' Kişi', '').trim(),
      features: room.features?.join(', ') || ''
    });
  };

  const handleCancelRoomEdit = () => {
    setEditingRoomId(null);
    setRoomForm({ name: '', capacity: '', features: '' });
  };

  const handleConfirmDeleteRoom = () => {
    if (!deletingRoom) return;
    
    showToast({ type: 'error', title: 'Hazırlanıyor', message: 'Oda silme altyapısı bir sonraki adımda eklenecek!' });
    setDeletingRoom(null);
  };

  // KURUMSAL İPTAL (SOFT DELETE): Durumu PATCH ile CANCELLED yapıyor
  const handleCancelReservation = async (id: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: id, 
          status: 'CANCELLED' 
        })
      });

      if (response.ok) {
        cancelOperation(id);
        showToast({ type: 'success', title: 'İptal Edildi', message: 'Rezervasyon başarıyla iptal edildi.' });
        window.location.reload(); 
      } else {
        showToast({ type: 'error', title: 'Hata', message: 'İptal işlemi başarısız oldu.' });
      }
    } catch (error) {
      console.error("İptal hatası:", error);
      showToast({ type: 'error', title: 'Bağlantı Hatası', message: 'Sunucuya ulaşılamadı.' });
    }
  };

  return (
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
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 min-h-0 flex flex-col">
        
        {/* ==================================================== */}
        {/* 1. SEKME: ÖZET BİLGİLER VE KART LİSTELER             */}
        {/* ==================================================== */}
        {activeTab === 'ozet' && (
          <div className="flex flex-col gap-5 flex-1 min-h-0">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
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
                  <span className="material-symbols-outlined text-gray-500">{editingRoomId ? 'edit_square' : 'add_box'}</span>
                  {editingRoomId ? 'Toplantı Odasını Düzenle' : 'Toplantı Odası Ekle'}
                </h2>
              </div>
              <div className="p-6 md:p-8 space-y-5 flex-1 min-h-0 overflow-y-auto pb-24">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Oda İsmi</label>
                  <input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} placeholder="Örn: Huddle Room" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kapasite (Kişi Sayısı)</label>
                  <input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} placeholder="Örn: 10" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Özellikler (Virgülle ayırın)</label>
                  <input type="text" value={roomForm.features} onChange={e => setRoomForm({...roomForm, features: e.target.value})} placeholder="Örn: TV, Kamera, Mikrofon" className="w-full px-4 py-2.5 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
                </div>
              </div>
              <div className="p-5 md:p-6 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                <button onClick={handleCancelRoomEdit} className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] rounded transition-colors">
                  {editingRoomId ? 'Vazgeç' : 'Temizle'}
                </button>
                <HarButton onClick={handleSaveRoom} color="red" className="px-8 py-2.5 bg-[#E4032C] hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors">
                  {editingRoomId ? 'Değişiklikleri Kaydet' : 'Odayı Ekle'}
                </HarButton>
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
                  <div key={room.id} className={`flex justify-between items-center p-4 border-b border-gray-100 dark:border-[#2d2d2d] last:border-0 transition-colors rounded ${editingRoomId === room.id ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-[#E4032C]' : 'hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{room.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{room.capacity} • {room.features?.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded mr-2 hidden sm:block ${room.status === 'Müsait' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500' : 'bg-gray-100 text-gray-600 dark:bg-[#333] dark:text-gray-400'}`}>
                        Sistemde
                      </span>
                      <button onClick={() => handleEditRoomClick(room)} title="Düzenle" className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded hover:bg-gray-200 dark:hover:bg-[#333]">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => setDeletingRoom(room)} title="Sil" className="p-1.5 text-gray-500 hover:text-[#E4032C] dark:text-gray-400 dark:hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. SEKME: TÜM REZERVASYONLAR                         */}
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
                    const isCompleted = isMeetingCompleted(op);
                    const isAct = (op.status === 'aktif' || !op.status) && !isCompleted;
                    
                    return (
                      <tr key={op.id} className={`hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${isCancelled || isCompleted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4">
                          <p className={`font-bold text-sm ${(isCancelled || isCompleted) ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>{op.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold">{op.date}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{op.details}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isAct && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500">Aktif</span>}
                          {isCompleted && !isCancelled && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-500 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">check_circle</span> Tamamlandı</span>}
                          {isCancelled && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-gray-200 text-gray-600 dark:bg-[#333] dark:text-gray-400">İptal Edildi</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleCancelReservation(op.id)} 
                            disabled={isCancelled || isCompleted}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${(isCancelled || isCompleted) ? 'opacity-0 cursor-not-allowed' : 'bg-white border border-[#E4032C] text-[#E4032C] hover:bg-[#E4032C] hover:text-white dark:bg-transparent dark:border-[#E4032C] dark:hover:bg-[#E4032C] dark:hover:text-white'}`}
                          >
                            İptal Et
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>

      {/* ODA SİLME ONAY MODALI */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C] text-[20px]">warning</span>
                Oda Silme Onayı
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-5">
                <strong>{deletingRoom.name}</strong> adlı toplantı odasını sistemden tamamen silmek istediğinize emin misiniz?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeletingRoom(null)} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded transition-colors">
                  Vazgeç
                </button>
                <button onClick={handleConfirmDeleteRoom} className="px-4 py-2 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded transition-colors">
                  Evet, Odayı Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}