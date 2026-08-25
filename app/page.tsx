'use client';
import { useEffect, useState } from 'react';
import { useReservationData } from './context/ReservationContext';
import { useToast } from './context/ToastContext'; 

const TIME_SLOTS = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"];

export default function Home() {
  const { rooms, setRooms, operations, setOperations, requestOperationEdit, cancelOperation } = useReservationData();
  const { showToast } = useToast(); 

  // --- DİNAMİK HESAPLAMA ---
  const activeOperations = operations.filter((op: any) => op.status !== 'iptal' && op.status !== 'bekliyor');
  const totalReservations = activeOperations.length;
  
  const totalSlots = rooms.length * TIME_SLOTS.length;
  const usageRate = totalSlots > 0 ? Math.min(100, Math.round((totalReservations / totalSlots) * 100)) : 0;

  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ rooms: 0, reservations: 0, usage: 0 });
  const [isAnimating, setIsAnimating] = useState(true); 
  const [now, setNow] = useState<number | null>(null);
  const [lockedSlots, setLockedSlots] = useState<Record<string, string | null>>({});

  const getLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getLocalYYYYMMDD(new Date());

  const formatDateForList = (dateString: string) => {
    if (!dateString) return "Belirsiz"; const d = new Date(dateString); if (isNaN(d.getTime())) return "Belirsiz";
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  // 1. DÜZELTME: Saat diliminin BİTİŞ saati geçmeden o dilim GEÇMİŞ sayılmaz!
  const checkIsPastSlot = (slot: string, targetDateStr: string) => {
    if (!now || !targetDateStr) return false;
    const todayStrLocal = getLocalYYYYMMDD(new Date(now));
    
    if (targetDateStr < todayStrLocal) return true; // Geçmiş günse kilitli
    if (targetDateStr > todayStrLocal) return false; // Gelecek günse açık

    // BİTİŞ SAATİNİ REFERANS ALIYORUZ (Örn: 10:00 - 11:00 için 11:00)
    const [, end] = slot.split(' - ');
    const endHourNum = parseInt(end.split(':')[0], 10);
    const endMinNum = parseInt(end.split(':')[1], 10);
    
    const d = new Date(now);
    // Yalnızca şu anki saat, slotun BİTİŞ saatini geçtiğinde kilitlenir
    if (d.getHours() > endHourNum || (d.getHours() === endHourNum && d.getMinutes() >= endMinNum)) {
      return true;
    }
    return false;
  };

  // 2. KONTROL: Anlık saatte oda doluysa "Dolu" yazar ve buton çalışmaz!
  const isRoomCurrentlyOccupied = (roomName: string) => {
    if (!now) return false;
    const d = new Date(now);
    const todayFormatted = formatDateForList(getLocalYYYYMMDD(d));
    
    const currentHour = d.getHours();
    const currentMinute = d.getMinutes();
    const currentTimeNum = currentHour + currentMinute / 60;

    return activeOperations.some((op: any) => {
      if (op.date !== 'Bugün' && op.date !== todayFormatted) return false;
      const [opRoom, opTime] = (op.details || '').split(' • ');
      if (opRoom !== roomName) return false;
      if (!opTime) return false;
      const [start, end] = opTime.split(' - ');
      if (!start || !end) return false;
      const startNum = parseInt(start.split(':')[0], 10) + parseInt(start.split(':')[1], 10) / 60;
      const endNum = parseInt(end.split(':')[0], 10) + parseInt(end.split(':')[1], 10) / 60;
      return currentTimeNum >= startNum && currentTimeNum < endNum;
    });
  };

  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const duration = 1500; const frameRate = 1000 / 60; const totalFrames = Math.round(duration / frameRate); let frame = 0;
    const counterTimer = setInterval(() => {
      frame++; const ease = 1 - Math.pow(1 - (frame / totalFrames), 4);
      setStats({ rooms: Math.round(rooms.length * ease), reservations: Math.round(totalReservations * ease), usage: Math.round(usageRate * ease) });
      if (frame >= totalFrames) { clearInterval(counterTimer); setIsAnimating(false); }
    }, frameRate);
    return () => { clearInterval(timer); clearInterval(counterTimer); };
  }, [rooms.length, totalReservations, usageRate]);

  // STATE: Modallar
  const [deletingOp, setDeletingOp] = useState<any>(null);
  const [editingOp, setEditingOp] = useState<any>(null);
  const [confirmEditOp, setConfirmEditOp] = useState<any>(null); 
  
  const [reservingRoomId, setReservingRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', room: '', time: '', date: '' });
  const [resForm, setResForm] = useState({ title: '', time: '', date: '' });
  const [originalTime, setOriginalTime] = useState("");

  useEffect(() => {
    if (!now) return;
    setRooms((prevRooms: any[]) => {
      let hasChanges = false;
      const updatedRooms = prevRooms.map((room: any) => {
        if (room.status === 'Rezerve Ediliyor' && room.lockEndTime && now >= room.lockEndTime) {
          hasChanges = true;
          return { ...room, status: 'Müsait', lockEndTime: null };
        }
        return room;
      });
      if (hasChanges && reservingRoomId && (!updatedRooms.find((r: any) => r.id === reservingRoomId) || updatedRooms.find((r: any) => r.id === reservingRoomId)?.status !== 'Rezerve Ediliyor')) {
        setReservingRoomId(null);
      }
      return hasChanges ? updatedRooms : prevRooms;
    });
  }, [now, reservingRoomId, setRooms]);

  useEffect(() => {
    if (editingOp) {
      const [room, timeStr] = editingOp.details.split(' • ');
      let parsedDate = todayStr; 
      const today = new Date();
      if (editingOp.date === 'Bugün') parsedDate = todayStr;
      else if (editingOp.date === 'Yarın') { today.setDate(today.getDate() + 1); parsedDate = getLocalYYYYMMDD(today); }
      
      setEditForm({ title: editingOp.title, room: room || "", time: "", date: parsedDate });
      setOriginalTime(timeStr || "");
    }
  }, [editingOp, todayStr]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDeletingOp(null); setEditingOp(null); setConfirmEditOp(null); if (reservingRoomId) handleCancelReservation(); } };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [reservingRoomId]);

  // --- İPTAL İŞLEMİ ---
  const handleConfirmDelete = async () => {
    if (!deletingOp) return;
    try {
      cancelOperation(deletingOp.id);
      setDeletingOp(null);
      showToast({ type: 'success', title: 'Rezervasyon İptal Edildi', message: 'Rezervasyon başarıyla iptal edildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi.' });
    }
  };

  // --- REZERVASYON DÜZENLEME AKIŞI (ONAYA GÖNDER) ---
  const handlePreSaveEdit = () => {
    if (!editingOp || !editForm.time) return;
    setConfirmEditOp(editingOp); 
    setEditingOp(null); 
  };

  const handleSendToApproval = () => {
    if (!confirmEditOp) return;
    try {
      const newDetails = `${editForm.room} • ${editForm.time}`;
      const newDate = formatDateForList(editForm.date);
      requestOperationEdit(confirmEditOp.id, newDetails, newDate);
      setConfirmEditOp(null);
      showToast({ type: 'success', title: 'Onaya Gönderildi', message: 'Rezervasyon değişikliğiniz yönetici onayına gönderildi.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Değişiklik talebi gönderilemedi.' });
    }
  };

  // --- YENİ REZERVASYON OLUŞTURMA AKIŞI ---
  const handleStartReservation = (roomId: string) => {
    setRooms((prev: any[]) => prev.map((r: any) => r.id === roomId ? { ...r, status: 'Rezerve Ediliyor', lockEndTime: Date.now() + 3 * 60 * 1000 } : r));
    setReservingRoomId(roomId); 
    setResForm({ title: '', time: '', date: todayStr });
    setLockedSlots((prev: any) => ({ ...prev, [roomId]: null }));
  };

  const handleCancelReservation = () => {
    if (!reservingRoomId) return;
    setRooms((prev: any[]) => prev.map((r: any) => r.id === reservingRoomId ? { ...r, status: 'Müsait', lockEndTime: null } : r));
    setLockedSlots((prev: any) => { const newLocks = {...prev}; delete newLocks[reservingRoomId]; return newLocks; });
    setReservingRoomId(null);
  };

  const handleConfirmReservation = async () => {
    if (!reservingRoomId) return;
    try {
      const reservedRoom = rooms.find((r: any) => r.id === reservingRoomId);
      setRooms((prev: any[]) => prev.map((r: any) => r.id === reservingRoomId ? { ...r, status: 'Müsait', lockEndTime: null } : r));
      
      if (reservedRoom) {
        setOperations([{ 
          id: Date.now(), 
          title: resForm.title || 'Yeni Toplantı', 
          details: `${reservedRoom.name} • ${resForm.time}`, 
          date: formatDateForList(resForm.date), 
          status: 'aktif' 
        }, ...operations]);
      }
      
      setLockedSlots((prev: any) => { const newLocks = {...prev}; delete newLocks[reservingRoomId]; return newLocks; });
      setReservingRoomId(null);
      showToast({ type: 'success', title: 'Rezervasyon Tamamlandı', message: 'Rezervasyon başarıyla oluşturuldu.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.' });
    }
  };

  const handleSelectTime = (slot: string) => {
    setResForm({ ...resForm, time: slot });
    if (reservingRoomId) setLockedSlots((prev: any) => ({ ...prev, [reservingRoomId]: slot }));
  };

  const getSlotStatusesForDate = (dateStr: string) => {
    if (!dateStr) return { occupied: [], reserving: [] };
    const formattedDate = formatDateForList(dateStr);
    const occupied: string[] = []; 
    const reserving: string[] = [];

    activeOperations.forEach((op: any) => {
      if (op.date === formattedDate || op.date === 'Bugün') {
        const [opRoom, opTime] = (op.details || '').split(' • ');
        if (opTime) occupied.push(opTime);
      }
    });
    return { occupied, reserving };
  };

  const slotStatusesEdit = getSlotStatusesForDate(editForm.date);
  const slotStatusesRes = getSlotStatusesForDate(resForm.date);

  const formatTimeLeft = (endTime: number | null) => {
    if (!endTime || !now) return "00:00";
    const diff = Math.max(0, Math.floor((endTime - now) / 1000));
    return `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
  };

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col gap-4 md:gap-5 xl:h-[calc(100vh-6.5rem)]">
      
      {/* ÜST İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 shrink-0">
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-4 md:p-5 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam Oda</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">{isAnimating ? stats.rooms : rooms.length}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[24px]">domain</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-4 md:p-5 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aktif Rezervasyonlar</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">{isAnimating ? stats.reservations : totalReservations}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[24px]">event</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg p-4 md:p-5 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanım Oranı</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">%{isAnimating ? stats.usage : usageRate}</h3>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-[#2a2a2a] rounded text-[#E4032C]"><span className="material-symbols-outlined text-[24px]">trending_up</span></div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5 mt-6 overflow-hidden">
            <div className="bg-[#E4032C] h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${isAnimating ? stats.usage : usageRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 flex-1 min-h-0">
        
        {/* ANLIK ODA DURUMU */}
        <div className="xl:col-span-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg overflow-hidden flex flex-col min-h-[350px] xl:min-h-0 h-full shadow-sm dark:shadow-none">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2d2d2d] flex justify-between items-center bg-gray-50 dark:bg-[#212121] shrink-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Anlık Oda Durumu</h2>
          </div>
          <div className="overflow-auto flex-1 min-h-0 relative">
            <table className="w-full text-left border-collapse min-w-[650px] xl:min-w-full">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">Oda Adı</th>
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">Kapasite & Özellikler</th>
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-[#2d2d2d]">Durum</th>
                  <th className="px-4 py-3 md:px-5 md:py-3.5 text-xs font-bold uppercase tracking-wider text-right border border-gray-200 dark:border-[#2d2d2d]">İşlem</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {rooms.map((room: any) => {
                  let displayStatus = 'Müsait';
                  
                  if (room.status === 'Rezerve Ediliyor' && room.lockEndTime && now && now < room.lockEndTime) {
                    displayStatus = 'Rezerve Ediliyor';
                  } else if (isRoomCurrentlyOccupied(room.name)) {
                    displayStatus = 'Dolu'; // ODA O AN DOLUYSA DOLU YAZAR
                  }
                  
                  const isAvailable = displayStatus === 'Müsait';
                  const isOccupied = displayStatus === 'Dolu';
                  
                  return (
                    <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] group">
                      <td className="px-4 py-3 md:px-5 md:py-4 font-semibold text-sm md:text-base border border-gray-200 dark:border-[#2d2d2d]">{room.name}</td>
                      <td className="px-4 py-3 md:px-5 md:py-4 border border-gray-200 dark:border-[#2d2d2d]">
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded bg-gray-100 dark:bg-[#2a2a2a] text-xs font-semibold text-gray-600 dark:text-gray-300">{room.capacity}</span>
                          {room.features.slice(0,1).map((feature: string) => <span key={feature} className="px-2.5 py-1 rounded bg-gray-100 dark:bg-[#2a2a2a] text-xs font-semibold text-gray-600 dark:text-gray-300">{feature}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 md:px-5 md:py-4 border border-gray-200 dark:border-[#2d2d2d]">
                        <span className={`inline-flex items-center gap-2 font-semibold text-sm ${isAvailable ? 'text-emerald-600 dark:text-emerald-500' : isOccupied ? 'text-red-600 dark:text-red-500' : 'text-amber-500 dark:text-amber-400'}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500' : isOccupied ? 'bg-red-600' : 'bg-amber-500'}`}></span> 
                          {isAvailable ? 'Müsait' : isOccupied ? 'Dolu' : `İşlemde (${formatTimeLeft(room.lockEndTime)})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 md:px-5 md:py-4 text-right border border-gray-200 dark:border-[#2d2d2d]">
                        {/* ODA DOLUYSA REZERVASYON YAP BUTONU DEVRE DIŞI BIRAKILIR */}
                        <button disabled={!isAvailable} onClick={() => handleStartReservation(room.id)} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors whitespace-nowrap ${isAvailable ? 'text-white bg-[#E4032C] hover:bg-red-700' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] cursor-not-allowed'}`}>Rezervasyon Yap</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SON İŞLEMLER */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg flex flex-col min-h-[350px] xl:min-h-0 h-full shadow-sm dark:shadow-none">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Son İşlemler</h2>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-full">{totalReservations} İşlem</span>
          </div>
          <div className="flex-1 p-4 md:p-5 space-y-3.5 overflow-y-auto min-h-0">
            {activeOperations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-2 pt-8"><span className="material-symbols-outlined text-4xl opacity-50">event_busy</span><p className="text-xs font-semibold">Yaklaşan işlem bulunmuyor</p></div>
            ) : (
              activeOperations.map((op: any) => (
                <div key={op.id} className="flex flex-col gap-2 p-3 md:p-4 bg-white dark:bg-[#1c1c1c] rounded-lg border border-gray-200 dark:border-[#3d3d3d] hover:border-gray-300 dark:hover:border-[#4d4d4d] transition-colors">
                  <div className="flex justify-between items-start">
                    <div><p className="font-bold text-sm text-gray-900 dark:text-white">{op.title}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{op.details}</p></div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300">{op.date}</span>
                  </div>
                  <div className="flex justify-end gap-3 mt-1 pt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                    <button onClick={() => setEditingOp(op)} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Düzenle</button>
                    <button onClick={() => setDeletingOp(op)} className="text-xs font-bold text-[#E4032C] hover:text-red-500 transition-colors">İptal</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* YENİ REZERVASYON MODALI */}
      {reservingRoomId && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C] text-[20px]">add_circle</span>Yeni Rezervasyon
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                  {formatTimeLeft(rooms.find((r:any) => r.id === reservingRoomId)?.lockEndTime || null)}
                </span>
                <button onClick={handleCancelReservation} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Toplantı Başlığı</label>
                <input type="text" value={resForm.title} onChange={e => setResForm({...resForm, title: e.target.value})} placeholder="Örn: Haftalık Değerlendirme" className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tarih</label>
                <input 
                  type="date" 
                  min={todayStr} 
                  value={resForm.date} 
                  onChange={e => setResForm({...resForm, date: e.target.value, time: ""})} 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Saat Aralığı</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map(slot => {
                    const isSelected = resForm.time === slot; 
                    const isOccupied = slotStatusesRes.occupied.includes(slot); 
                    const isReserving = slotStatusesRes.reserving.includes(slot); 
                    const isPast = checkIsPastSlot(slot, resForm.date); // Geçmiş kontrolü BİTİŞ saatine göre yapılır
                    
                    const isDisabled = isOccupied || isReserving || isPast;
                    
                    return (
                      <button key={slot} disabled={isDisabled} onClick={() => handleSelectTime(slot)} className={`p-3 rounded border text-base font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-[#E4032C] border-[#E4032C] text-white' : isPast ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60 dark:bg-[#1a1a1a] dark:border-[#222] dark:text-gray-600' : isOccupied ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60' : isReserving ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-500 cursor-not-allowed opacity-80' : 'bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-gray-300 hover:border-[#E4032C] hover:text-[#E4032C]'}`}>
                        <span className={`${isPast && !isOccupied && !isReserving ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}`}>{slot}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-white' : isPast ? 'text-gray-400 dark:text-gray-500' : isOccupied ? 'text-gray-400 dark:text-gray-600' : isReserving ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          {isPast ? 'GEÇMİŞ' : isOccupied ? 'DOLU' : isReserving ? 'İŞLEMDE' : isSelected ? 'SEÇİLDİ' : 'BOŞ'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button onClick={handleCancelReservation} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">İptal Et</button>
                <button onClick={handleConfirmReservation} disabled={!resForm.time} className={`px-5 py-2.5 text-sm font-bold rounded text-white ${!resForm.time ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>Onayla ve Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REZERVASYON DÜZENLEME MODALI */}
      {editingOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px]">edit_calendar</span>Rezervasyonu Düzenle</h3>
              <button onClick={() => setEditingOp(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Toplantı Başlığı</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tarih</label>
                <input 
                  type="date" 
                  min={todayStr} 
                  value={editForm.date} 
                  onChange={e => setEditForm({...editForm, date: e.target.value, time: ""})} 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-gray-50 dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Saat Aralığı</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map(slot => {
                    const isSelected = editForm.time === slot; 
                    const isOccupied = slotStatusesEdit.occupied.includes(slot) && slot !== originalTime; 
                    const isReserving = slotStatusesEdit.reserving.includes(slot) && slot !== originalTime; 
                    const isPast = checkIsPastSlot(slot, editForm.date);
                    
                    const isDisabled = isOccupied || isReserving || isPast;
                    
                    return (
                      <button key={slot} disabled={isDisabled} onClick={() => setEditForm({...editForm, time: slot})} className={`p-3 rounded border text-base font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-[#E4032C] border-[#E4032C] text-white' : isPast ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60 dark:bg-[#1a1a1a] dark:border-[#222] dark:text-gray-600' : isOccupied ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60' : isReserving ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-500 cursor-not-allowed opacity-80' : 'bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-gray-300 hover:border-[#E4032C] hover:text-[#E4032C]'}`}>
                        <span className={`${isPast && !isOccupied && !isReserving ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}`}>{slot}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-white' : isPast ? 'text-gray-400 dark:text-gray-500' : isOccupied ? 'text-gray-400 dark:text-gray-600' : isReserving ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          {isPast ? 'GEÇMİŞ' : isOccupied ? 'DOLU' : isReserving ? 'İŞLEMDE' : isSelected ? 'SEÇİLDİ' : 'BOŞ'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                <button onClick={() => setEditingOp(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">İptal</button>
                <button onClick={handlePreSaveEdit} disabled={!editForm.time} className={`px-5 py-2.5 text-sm font-bold rounded text-white ${!editForm.time ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONAYA GÖNDERME UYARI MODALI */}
      {confirmEditOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">info</span>
                Rezervasyon Değişikliği
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">Yaptığınız değişiklik yönetici onayına gönderilecektir. Onaylanana kadar mevcut rezervasyonunuz geçerli kalacaktır.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setConfirmEditOp(null); setEditingOp(confirmEditOp); }} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Vazgeç</button>
                <button onClick={handleSendToApproval} className="px-4 py-2 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded transition-colors">Onaya Gönder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İPTAL ONAY MODALI */}
      {deletingOp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121]"><h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-[#E4032C] text-[20px]">warning</span>İptal Onayı</h3></div>
            <div className="p-5">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-5"><strong>{deletingOp.title}</strong> işlemini iptal etmek istediğinize emin misiniz?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeletingOp(null)} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Vazgeç</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded">Evet, İptal Et</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}