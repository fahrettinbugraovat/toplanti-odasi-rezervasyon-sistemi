'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReservationData } from './context/ReservationContext';
import { useToast } from './context/ToastContext'; 
import { useUser } from './context/UserContext'; 

const TIME_SLOTS = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"];

export default function Home() {
  const router = useRouter(); 
  const { rooms, setRooms, operations, setOperations, requestOperationEdit, cancelOperation } = useReservationData();
  const { showToast } = useToast(); 
  const { user, mounted: userMounted } = useUser(); 

  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const [deletingOp, setDeletingOp] = useState<any>(null);
  const [editingOp, setEditingOp] = useState<any>(null);
  const [confirmEditOp, setConfirmEditOp] = useState<any>(null); 
  const [editForm, setEditForm] = useState({ title: '', room: '', time: '', date: '' });
  const [originalTime, setOriginalTime] = useState("");
  
  const [instantResRoom, setInstantResRoom] = useState<any>(null);
  const [instantResTitle, setInstantResTitle] = useState('');

  const getLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getLocalYYYYMMDD(new Date());

  // TARİH & SAAT BİRLEŞİK KONTROL FONKSİYONU
  const isPastSlotCheck = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr || !now) return false;
    const todayStrLocal = getLocalYYYYMMDD(new Date(now));

    if (dateStr < todayStrLocal) return true;
    if (dateStr > todayStrLocal) return false;
    if (!timeStr.includes(' - ')) return false;

    const endTimePart = timeStr.split(' - ')[1].trim();
    const endHour = parseInt(endTimePart.split(':')[0], 10);
    const endMin = parseInt(endTimePart.split(':')[1], 10);

    const currentTotalMins = new Date(now).getHours() * 60 + new Date(now).getMinutes();
    const endTotalMins = endHour * 60 + endMin;

    return endTotalMins <= currentTotalMins;
  };

  const formatDateForList = (dateString: string) => {
    if (!dateString) return "Belirsiz"; const d = new Date(dateString); if (isNaN(d.getTime())) return "Belirsiz";
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
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
  
  const sortedLogOperations = [...operations]
    .filter((op: any) => op.status !== 'iptal' && !isMeetingCompleted(op))
    .sort((a: any, b: any) => {
      const dateA = new Date(a.originalData?.startTime || 0).getTime();
      const dateB = new Date(b.originalData?.startTime || 0).getTime();
      return dateA - dateB;
    })
    .slice(0, 15); 

  const getAllBlocks = () => {
    return operations.filter((op: any) => op.status !== 'iptal');
  };

  const totalReservations = activeOperations.length;
  const totalSlots = rooms.length * TIME_SLOTS.length;
  const usageRate = totalSlots > 0 ? Math.min(100, Math.round((totalReservations / totalSlots) * 100)) : 0;

  const [stats, setStats] = useState({ rooms: 0, reservations: 0, usage: 0 });
  const [isAnimating, setIsAnimating] = useState(true); 

  const getCurrentSlot = () => {
    if (!now) return null;
    const d = new Date(now);
    const currentNum = d.getHours() + d.getMinutes() / 60;
    
    return TIME_SLOTS.find(slot => {
      const [start, end] = slot.split(' - ');
      const startNum = parseInt(start.split(':')[0], 10) + parseInt(start.split(':')[1], 10) / 60;
      const endNum = parseInt(end.split(':')[0], 10) + parseInt(end.split(':')[1], 10) / 60;
      return currentNum >= startNum && currentNum < endNum;
    }) || null;
  };

  const isRoomCurrentlyOccupied = (roomName: string) => {
    if (!now) return false;
    const d = new Date(now);
    const todayFormatted = formatDateForList(getLocalYYYYMMDD(d));
    const currentHour = d.getHours();
    const currentMinute = d.getMinutes();
    const currentTimeNum = currentHour + currentMinute / 60;

    const allBlocks = getAllBlocks();
    return allBlocks.some((block: any) => {
      const isTodayMatch = (block.date === 'Bugün' && todayFormatted === formatDateForList(getLocalYYYYMMDD(new Date())));
      if (block.date !== todayFormatted && !isTodayMatch) return false;

      const parts = (block.details || '').split(' • ');
      if (parts.length < 2) return false;
      const opRoom = parts[0].trim();
      const opTime = parts[1].trim();

      if (opRoom !== roomName) return false;
      if (!opTime.includes(' - ')) return false;

      const [start, end] = opTime.split(' - ');
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
      if (hasChanges && instantResRoom && (!updatedRooms.find((r: any) => r.id === instantResRoom.id) || updatedRooms.find((r: any) => r.id === instantResRoom.id)?.status !== 'Rezerve Ediliyor')) {
        setInstantResRoom(null);
      }
      return hasChanges ? updatedRooms : prevRooms;
    });
  }, [now, instantResRoom, setRooms]);

  useEffect(() => {
    if (editingOp) {
      const parts = (editingOp.details || '').split(' • ');
      const room = parts[0] || "";
      const timeStr = parts[1] || "";
      let parsedDate = todayStr; 
      const today = new Date();
      if (editingOp.date === 'Bugün') parsedDate = todayStr;
      else if (editingOp.date === 'Yarın') { today.setDate(today.getDate() + 1); parsedDate = getLocalYYYYMMDD(today); }
      
      setEditForm({ title: editingOp.title || "", room: room, time: timeStr, date: parsedDate });
      setOriginalTime(timeStr);
    }
  }, [editingOp, todayStr]);

  const handleCancelInstantRes = () => {
    if (instantResRoom) {
      setRooms((prev: any[]) => prev.map((r: any) => r.id === instantResRoom.id ? { ...r, status: 'Müsait', lockEndTime: null } : r));
    }
    setInstantResRoom(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { 
        setDeletingOp(null); 
        setEditingOp(null); 
        setConfirmEditOp(null); 
        if (instantResRoom) handleCancelInstantRes(); 
      } 
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantResRoom]);

  const handleConfirmDelete = async () => {
    if (!deletingOp) return;
    try {
      await cancelOperation(deletingOp.id);
      setDeletingOp(null);
      showToast({ type: 'success', title: 'İptal Edildi', message: 'Rezervasyon iptal edilerek geçmişe taşındı.' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Hata', message: 'İptal işlemi veritabanında başarısız oldu.' });
    }
  };

  const handlePreSaveEdit = () => {
    if (!editingOp || !editForm.time) return;
    setConfirmEditOp(editingOp); 
    setEditingOp(null); 
  };

  const handleSaveEdit = async () => {
    if (!confirmEditOp) return;
    try {
      const [startStr, endStr] = editForm.time.split(' - ');
      const baseDate = editForm.date ? new Date(editForm.date) : new Date();

      const startTime = new Date(baseDate);
      startTime.setHours(parseInt(startStr.split(':')[0], 10), parseInt(startStr.split(':')[1], 10), 0, 0);

      const endTime = new Date(baseDate);
      endTime.setHours(parseInt(endStr.split(':')[0], 10), parseInt(endStr.split(':')[1], 10), 0, 0);

      await requestOperationEdit(confirmEditOp.id, {
        title: editForm.title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      setConfirmEditOp(null);
      showToast({ type: 'success', title: 'Rezervasyon Güncellendi', message: 'Rezervasyon bilgileri başarıyla güncellendi.' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: error.message || 'Değişiklik kaydedilemedi.' });
    }
  };

  const handleStartInstantReservation = (room: any) => {
    setRooms((prev: any[]) => prev.map((r: any) => r.id === room.id ? { ...r, status: 'Rezerve Ediliyor', lockEndTime: Date.now() + 3 * 60 * 1000 } : r));
    setInstantResRoom(room);
    setInstantResTitle('');
  };

  const handleConfirmInstantReservation = async () => {
    if (!instantResRoom) return;
    const slot = getCurrentSlot();
    
    if (!slot) {
      showToast({ type: 'error', title: 'Uygun Saat Yok', message: 'Şu an mesai saatleri dışında olduğunuz için hızlı rezervasyon yapılamaz.' });
      return;
    }

    const finalTitle = instantResTitle.trim() || 'Hızlı Toplantı';

    const [startStr, endStr] = slot.split(' - ');
    const todayDate = new Date();
    const startDate = new Date(todayDate.setHours(parseInt(startStr.split(':')[0], 10), parseInt(startStr.split(':')[1], 10), 0, 0));
    const endDate = new Date(todayDate.setHours(parseInt(endStr.split(':')[0], 10), parseInt(endStr.split(':')[1], 10), 0, 0));

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          roomId: instantResRoom.id
        })
      });

      if (response.ok) {
        setRooms((prev: any[]) => prev.map((r: any) => r.id === instantResRoom.id ? { ...r, status: 'Müsait', lockEndTime: null } : r));
        setInstantResRoom(null);
        setInstantResTitle('');
        showToast({ type: 'success', title: 'Rezervasyon Tamamlandı', message: 'Oda şu anki saat dilimi için başarıyla rezerve edildi.' });
        window.location.reload(); 
      } else {
        const errorData = await response.json();
        showToast({ type: 'error', title: 'Kayıt Başarısız', message: errorData.error || 'Veritabanına kaydedilemedi.' });
      }
    } catch (error) {
      console.error("Rezervasyon eklenirken hata:", error);
      showToast({ type: 'error', title: 'Bağlantı Hatası', message: 'Sunucuya ulaşılamadı.' });
    }
  };

  const getTimeAgo = (createdAtStr?: string) => {
    if (!now || !createdAtStr) return "Az önce";
    const timestamp = new Date(createdAtStr).getTime();
    const diffMins = Math.floor((now - timestamp) / 60000);
    
    if (isNaN(diffMins) || diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} saat önce`;
    return `${Math.floor(diffMins / 1440)} gün önce`;
  };

  const getActionDetails = (op: any) => {
    const isCompleted = isMeetingCompleted(op);
    let actionText = 'Rezervasyon oluşturuldu';
    let icon = '🟢';
    let details = op.details;

    if (op.status === 'iptal') {
      actionText = 'Rezervasyon iptal edildi';
      icon = '🔴';
    } else if (isCompleted) {
      actionText = 'Toplantı tamamlandı';
      icon = '✅';
    } else if (op.status === 'aktif') {
      actionText = 'Rezervasyon oluşturuldu';
      icon = '🟢';
    }
    return { actionText, icon, displayDetails: details.replace(' • ', ' — '), isCompleted };
  };

  const currentActiveSlot = getCurrentSlot();

  let occupiedSlots: string[] = [];
  if (editingOp && now) {
    const formattedDate = formatDateForList(editForm.date);
    const allBlocks = getAllBlocks();
    allBlocks.forEach((block: any) => {
      const isTodayMatch = (block.date === 'Bugün' && formattedDate === formatDateForList(getLocalYYYYMMDD(new Date(now))));
      if (block.date === formattedDate || isTodayMatch) {
        const parts = (block.details || '').split(' • ');
        if (parts.length >= 2 && parts[0].trim() === editForm.room && parts[1].trim().includes(' - ')) {
          const opStartHour = parseInt(parts[1].trim().split(' - ')[0].split(':')[0], 10);
          const opEndHour = parseInt(parts[1].trim().split(' - ')[1].split(':')[0], 10);
          TIME_SLOTS.forEach(slot => {
            const slotStartHour = parseInt(slot.split(' - ')[0].split(':')[0], 10);
            if (slotStartHour >= opStartHour && slotStartHour < opEndHour) {
              occupiedSlots.push(slot);
            }
          });
        }
      }
    });
  }

  // KAYDET BUTONU ENGELLEYİCİ
  const isSaveDisabled = !editForm.time || isPastSlotCheck(editForm.date, editForm.time);

  if (!isMounted || !userMounted) return null;

  return (
    <div className="w-full flex flex-col gap-4 md:gap-5 xl:h-[calc(100vh-6.5rem)]">
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
                  const isOccupied = isRoomCurrentlyOccupied(room.name);
                  const isProcessing = room.status === 'Rezerve Ediliyor' && room.lockEndTime && now && now < room.lockEndTime;
                  const isAvailable = !isOccupied && !isProcessing;
                  const isOutsideWorkingHours = currentActiveSlot === null;
                  
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
                        <span className={`inline-flex items-center gap-2 font-semibold text-sm ${!isAvailable ? 'text-red-600 dark:text-red-500' : isOutsideWorkingHours ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${!isAvailable ? 'bg-red-600' : isOutsideWorkingHours ? 'bg-amber-500' : 'bg-emerald-500'}`}></span> 
                          {isProcessing ? 'İşlemde' : isOccupied ? 'Dolu' : isOutsideWorkingHours ? 'Mesai Dışı' : 'Boş'}
                        </span>
                      </td>
                      <td className="px-4 py-3 md:px-5 md:py-4 text-right border border-gray-200 dark:border-[#2d2d2d]">
                        <button 
                          disabled={!isAvailable || isOutsideWorkingHours} 
                          onClick={() => handleStartInstantReservation(room)} 
                          className={`px-4 py-1.5 text-xs font-bold rounded transition-colors whitespace-nowrap ${isAvailable && !isOutsideWorkingHours ? 'text-white bg-[#E4032C] hover:bg-red-700' : 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-[#2a2a2a] cursor-not-allowed'}`}
                        >
                          Rezervasyon Yap
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-lg flex flex-col min-h-[350px] xl:min-h-0 h-full shadow-sm dark:shadow-none">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Son İşlemler</h2>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-full">{sortedLogOperations.length} İşlem</span>
          </div>
          <div className="flex-1 p-4 md:p-5 space-y-3.5 overflow-y-auto min-h-0">
            {sortedLogOperations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-2 pt-8">
                <span className="material-symbols-outlined text-4xl opacity-50">history</span>
                <p className="text-xs font-semibold">Aktif işlem bulunmuyor</p>
              </div>
            ) : (
              sortedLogOperations.map((op: any) => {
                const { actionText, icon, displayDetails, isCompleted } = getActionDetails(op);
                const timeAgo = getTimeAgo(op.createdAt);
                
                const isOwnerOrAdmin = user?.role === 'ADMIN' || op.originalData?.userId === user?.id;
                const canEdit = op.status !== 'iptal' && !isCompleted && isOwnerOrAdmin; 
                const isFaded = isCompleted || op.status === 'iptal';

                return (
                  <div key={op.id} className={`flex flex-col gap-2 p-3 md:p-4 bg-white dark:bg-[#1c1c1c] rounded-lg border border-gray-200 dark:border-[#3d3d3d] transition-colors ${isFaded ? 'opacity-60' : 'hover:border-gray-300 dark:hover:border-[#4d4d4d]'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-bold text-sm flex items-center gap-1.5 ${isFaded ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          <span>{icon}</span> {actionText}
                        </p>
                        <p className={`text-xs mt-1.5 font-medium ${isFaded ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-500 dark:text-gray-400'}`}>{displayDetails}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {timeAgo}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                        <button onClick={() => setEditingOp(op)} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Düzenle</button>
                        <button onClick={() => setDeletingOp(op)} className="text-xs font-bold text-[#E4032C] hover:text-red-500 transition-colors">İptal Et</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {instantResRoom && currentActiveSlot && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2d2d2d] rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#212121] flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4032C] text-[20px]">bolt</span>Hızlı Rezervasyon
              </h3>
              <button onClick={handleCancelInstantRes} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seçilen Oda</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{instantResRoom.name}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#2d2d2d] my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Bugün</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#2d2d2d] my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saat Aralığı</span>
                  <span className="text-sm font-bold text-[#E4032C]">{currentActiveSlot}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Toplantı Başlığı (İsteğe Bağlı)</label>
                <input 
                  type="text" 
                  value={instantResTitle} 
                  onChange={e => setInstantResTitle(e.target.value)} 
                  placeholder="Örn: Hızlı Durum Değerlendirmesi" 
                  className="w-full p-3 border border-gray-300 dark:border-[#3d3d3d] rounded bg-white dark:bg-[#141414] text-base text-gray-900 dark:text-white focus:outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C]" 
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleCancelInstantRes} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded transition-colors w-full border border-gray-200 dark:border-[#333]">İptal</button>
                <button onClick={handleConfirmInstantReservation} className="px-5 py-2.5 text-sm font-bold rounded text-white w-full transition-colors bg-[#E4032C] hover:bg-red-700">Hemen Rezerve Et</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOp && (() => {
        return (
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
                      const isPastSlot = isPastSlotCheck(editForm.date, slot); 
                      const isOccupied = occupiedSlots.includes(slot) && slot !== originalTime; 
                      
                      const isDisabled = isOccupied || isPastSlot;

                      return (
                        <button key={slot} disabled={isDisabled} onClick={() => setEditForm({...editForm, time: slot})} className={`p-3 rounded border text-base font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? 'bg-[#E4032C] border-[#E4032C] text-white' : isDisabled ? 'bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60' : 'bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#3d3d3d] text-gray-700 dark:text-gray-300 hover:border-[#E4032C] hover:text-[#E4032C]'}`}>
                          <span>{slot}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-white' : isDisabled ? 'text-gray-400 dark:text-gray-600' : 'text-emerald-600 dark:text-emerald-500'}`}>
                            {isOccupied ? 'Dolu' : isPastSlot ? 'Geçti' : isSelected ? 'Seçildi' : 'Boş'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
                  <button onClick={() => setEditingOp(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">İptal</button>
                  <button onClick={handlePreSaveEdit} disabled={isSaveDisabled} className={`px-5 py-2.5 text-sm font-bold rounded text-white ${isSaveDisabled ? 'bg-[#E4032C] opacity-50 cursor-not-allowed' : 'bg-[#E4032C] hover:bg-red-700'}`}>Kaydet</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">Yaptığınız değişiklik doğrudan rezervasyon kaydına uygulanacaktır.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setConfirmEditOp(null); setEditingOp(confirmEditOp); }} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">Vazgeç</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-bold bg-[#E4032C] text-white hover:bg-red-700 rounded transition-colors">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

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