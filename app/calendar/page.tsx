'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Room, useReservationData } from '../context/ReservationContext';
import { useToast } from '../context/ToastContext';

const TIME_SLOTS = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"];

export default function CalendarView() {
  const { theme } = useTheme();
  const { rooms, operations, setOperations } = useReservationData();
  const { showToast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [localSelection, setLocalSelection] = useState<{room: Room, slots: string[]} | null>(null);
  const [localTitle, setLocalTitle] = useState('');

  const getLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateForList = (dateString: string) => {
    if (!dateString) return "Belirsiz"; const d = new Date(dateString); if (isNaN(d.getTime())) return "Belirsiz";
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date());
      setSelectedDate((date) => date ?? new Date());
    };
    updateCurrentTime();
    const timer = window.setInterval(updateCurrentTime, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const changeDate = (days: number) => {
    setSelectedDate((currentDate) => {
      if (!currentDate) return currentDate;
      const nextDate = new Date(currentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setDate(nextDate.getDate() + days);
      if (nextDate < today) return currentDate;
      return nextDate;
    });
    clearSelection();
  };

  const handleDateChange = (dateValue: string) => {
    if (!dateValue) return;
    const nextDate = new Date(`${dateValue}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (nextDate < today) return;
    setSelectedDate(nextDate);
    clearSelection();
  };

  const clearSelection = () => {
    setLocalSelection(null);
    setLocalTitle('');
  };

  const getAllBlocks = () => {
    const blocks: any[] = [];
    operations.forEach((op: any) => {
      if (op.status === 'iptal') return; 
      
      if (op.status === 'bekliyor') {
        blocks.push({ ...op, displayStatus: 'aktif_eski' });
        if (op.pendingChanges) {
          blocks.push({ 
            ...op, 
            date: op.pendingChanges.date, 
            details: op.pendingChanges.details, 
            displayStatus: 'bekliyor_yeni' 
          });
        }
      } else {
        blocks.push({ ...op, displayStatus: 'aktif' });
      }
    });
    return blocks.sort((a, b) => a.displayStatus === 'bekliyor_yeni' ? -1 : 1);
  };

  const checkIsPastSlot = (slot: string, targetDateStr: string) => {
    if (!currentTime || !targetDateStr) return false;
    const todayStrLocal = getLocalYYYYMMDD(currentTime);
    
    if (targetDateStr < todayStrLocal) return true; 
    if (targetDateStr > todayStrLocal) return false; 

    const [, end] = slot.split(' - ');
    const endHourNum = parseInt(end.split(':')[0], 10);
    const endMinNum = parseInt(end.split(':')[1], 10);
    
    if (currentTime.getHours() > endHourNum || (currentTime.getHours() === endHourNum && currentTime.getMinutes() >= endMinNum)) {
      return true;
    }
    return false;
  };

  const getReservationSpan = (roomName: string, slot: string, currentDateFormatted: string, todayFormatted: string) => {
    const allBlocks = getAllBlocks();
    
    for (const block of allBlocks) {
      const isTodayMatch = (block.date === 'Bugün' && currentDateFormatted === todayFormatted);
      if (block.date !== currentDateFormatted && !isTodayMatch) continue;

      const parts = (block.details || '').split(' • ');
      if (parts.length < 2) continue;
      const opRoom = parts[0].trim();
      const opTime = parts[1].trim();
      
      if (opRoom !== roomName.trim()) continue;

      if (!opTime.includes(' - ')) continue;
      const [opStartStr, opEndStr] = opTime.split(' - ');
      const opStartHour = parseInt(opStartStr.split(':')[0], 10);
      const opEndHour = parseInt(opEndStr.split(':')[0], 10);

      const slotStartHour = parseInt(slot.split(' - ')[0].split(':')[0], 10);

      if (slotStartHour === opStartHour) {
        const startIndex = TIME_SLOTS.indexOf(slot);
        let span = 1;
        for (let i = startIndex + 1; i < TIME_SLOTS.length; i++) {
          const nextSlotStart = parseInt(TIME_SLOTS[i].split(' - ')[0].split(':')[0], 10);
          if (nextSlotStart < opEndHour) span++;
          else break;
        }
        return { block, span, isStart: true };
      } else if (slotStartHour > opStartHour && slotStartHour < opEndHour) {
        return { block, span: 0, isStart: false };
      }
    }
    return null;
  };

  const selectEmptySlot = (room: Room, slot: string) => {
    if (!localSelection || localSelection.room.id !== room.id) {
      setLocalSelection({ room, slots: [slot] });
      return;
    }
    const isSelected = localSelection.slots.includes(slot);
    const newSlots = isSelected ? localSelection.slots.filter(s => s !== slot) : [...localSelection.slots, slot];
    
    if (newSlots.length === 0) setLocalSelection(null);
    else setLocalSelection({ room, slots: newSlots });
  };

  const isSlotSelected = (roomId: string, slot: string) => {
    return localSelection?.room.id === roomId && localSelection.slots.includes(slot);
  };

  const formatSelectedSlotsString = (slots: string[]) => {
    const sorted = [...slots].sort((a,b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
    const start = sorted[0].split(' - ')[0];
    const end = sorted[sorted.length - 1].split(' - ')[1];
    return `${start} - ${end}`;
  };

  const confirmReservation = () => {
    if (!localSelection || !selectedDate || !localTitle.trim()) return;
    try {
      const timeString = formatSelectedSlotsString(localSelection.slots);
      const formattedDate = formatDateForList(getLocalYYYYMMDD(selectedDate));
      
      setOperations([{
        id: Date.now() + Math.floor(Math.random() * 1000), 
        title: localTitle.trim(),
        details: `${localSelection.room.name} • ${timeString}`,
        date: formattedDate,
        status: 'aktif'
      }, ...operations]);

      clearSelection();
      showToast({ type: 'success', title: 'Rezervasyon Tamamlandı', message: 'Rezervasyon başarıyla oluşturuldu ve tüm sisteme yansıdı.' });
    } catch (error) {
      showToast({ type: 'error', title: 'İşlem Başarısız', message: 'Hata oluştu.' });
    }
  };

  if (!selectedDate || !currentTime) return null;

  const currentDateFormatted = formatDateForList(getLocalYYYYMMDD(selectedDate));
  const todayFormatted = formatDateForList(getLocalYYYYMMDD(currentTime));
  const targetDateStrForPastCheck = getLocalYYYYMMDD(selectedDate);
  const hasSelectedRange = localSelection !== null && localSelection.slots.length >= 1;

  return (
    <section className="h-full overflow-y-auto bg-[#f3f6ff] p-4 text-[#101b35] dark:bg-[#141414] dark:text-[#e5e7eb] md:p-5">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 xl:flex-row items-start pb-32">
        <div className="w-full xl:flex-1 border border-gray-200 bg-white dark:border-[#2d2d2d] dark:bg-[#1c1c1c] rounded-lg shadow-sm overflow-hidden h-fit">
          <div className="relative flex h-14 items-center justify-between border-b border-gray-200 bg-gray-50 px-5 dark:border-[#2d2d2d] dark:bg-[#212121]">
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
              <button title="Önceki gün" onClick={() => changeDate(-1)} className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">‹</button>
              <input type="date" min={getLocalYYYYMMDD(currentTime)} value={getLocalYYYYMMDD(selectedDate)} onChange={(event) => handleDateChange(event.target.value)} style={{ colorScheme: theme }} className="border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-900 rounded outline-none focus:border-[#E4032C] dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white" />
              <button title="Sonraki gün" onClick={() => changeDate(1)} className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">›</button>
            </div>
            <div className="ml-auto flex gap-3">
              <button onClick={() => { clearSelection(); setSelectedDate(new Date()); }} className="border border-[#E4032C] rounded px-4 py-1.5 text-xs font-bold text-[#E4032C] transition-colors hover:bg-[#E4032C] hover:text-white">Bugün</button>
            </div>
          </div>

          <div className="grid overflow-x-auto w-full" style={{ gridTemplateColumns: `180px repeat(${TIME_SLOTS.length}, minmax(110px, 1fr))` }}>
            <div className="h-12 border-b border-r border-gray-200 px-4 flex items-center font-bold text-xs text-gray-600 dark:text-gray-400 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a]">Oda</div>
            {TIME_SLOTS.map((slot) => (
              <div key={`header-${slot}`} className="h-12 border-b border-r border-gray-200 px-2 flex items-center justify-center font-bold text-[11px] text-gray-600 dark:text-gray-400 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a]">
                {slot}
              </div>
            ))}

            {rooms.map((room: any) => (
              <div key={room.id} className="contents group">
                <div className="h-[88px] border-b border-r border-gray-200 px-4 py-4 dark:border-[#2d2d2d] bg-white dark:bg-[#1c1c1c] flex flex-col justify-center transition-colors group-hover:bg-gray-50 dark:group-hover:bg-[#252525]">
                  <strong className="block text-sm text-gray-900 dark:text-white truncate">{room.name}</strong>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{room.capacity}</span>
                </div>

                {TIME_SLOTS.map((slot) => {
                  const cellKey = `${room.id}-${slot}`;
                  const isPast = checkIsPastSlot(slot, targetDateStrForPastCheck);
                  const resData = getReservationSpan(room.name, slot, currentDateFormatted, todayFormatted);
                  
                  if (resData && !resData.isStart) return null;

                  if (resData && resData.isStart) {
                    const isNewReq = resData.block.displayStatus === 'bekliyor_yeni';
                    return (
                      <div key={cellKey} className="h-[88px] border-b border-r border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#1c1c1c] p-1.5" style={{ gridColumn: `span ${resData.span}` }}>
                        <div className={`h-full w-full overflow-hidden rounded px-3 py-2 text-left text-xs font-bold text-white shadow-sm flex flex-col items-start ${isNewReq ? 'bg-amber-500 dark:bg-amber-600' : 'bg-[#E4032C]'}`}>
                          <span>{resData.block.title}</span>
                          {isNewReq && <span className="text-[9px] mt-1 opacity-90 uppercase tracking-wider">Onay Bekliyor</span>}
                        </div>
                      </div>
                    );
                  }

                  const isSelected = isSlotSelected(room.id, slot);
                  return (
                    <button 
                      key={cellKey} 
                      disabled={isPast}
                      onClick={() => selectEmptySlot(room, slot)} 
                      className={`h-[88px] border-b border-r border-gray-200 transition-colors dark:border-[#2d2d2d] focus:outline-none ${isPast ? 'bg-gray-50 dark:bg-[#1a1a1a] cursor-not-allowed opacity-60' : isSelected ? 'bg-red-50 ring-2 ring-inset ring-[#E4032C] dark:bg-[#3a2026] dark:ring-[#E4032C]' : 'bg-white dark:bg-[#1c1c1c] hover:bg-red-50 dark:hover:bg-[#2a1b1e]'}`} 
                      title={`${room.name} ${slot}`}
                    >
                      {isPast && <span className="text-[10px] text-gray-400 font-bold tracking-wider dark:text-gray-600">GEÇMİŞ</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {hasSelectedRange && localSelection && (
          <aside className="flex h-fit w-full flex-col border border-gray-200 bg-white rounded-lg shadow-sm p-5 dark:border-[#2d2d2d] dark:bg-[#1c1c1c] xl:w-[280px] shrink-0">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-[#2d2d2d]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Rezervasyon Özeti</h2>
              <button title="Kapat" onClick={clearSelection} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-5 border-l-[3px] border-[#E4032C] bg-gray-50 rounded-r p-3.5 dark:bg-[#1a1a1a]">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seçilen Oda</span>
              <strong className="mt-1 block text-sm text-gray-900 dark:text-white">{localSelection.room.name}</strong>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Tarih</label>
                <input readOnly value={currentDateFormatted} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs font-semibold text-gray-800 outline-none dark:bg-[#141414] dark:border-[#3d3d3d] dark:text-gray-200" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Saat</label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs font-semibold text-gray-800 dark:bg-[#141414] dark:border-[#3d3d3d] dark:text-gray-200">
                  {formatSelectedSlotsString(localSelection.slots)}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Toplantı Başlığı</label>
              <input value={localTitle} onChange={(event) => setLocalTitle(event.target.value)} placeholder="Örn: Proje İncelemesi" className="w-full border border-gray-300 rounded bg-white p-2.5 text-sm text-gray-900 outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white transition-colors" />
            </div>
            <button onClick={confirmReservation} disabled={!localTitle.trim()} className="mt-6 w-full bg-[#E4032C] py-3 rounded text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              Rezervasyonu Onayla
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}