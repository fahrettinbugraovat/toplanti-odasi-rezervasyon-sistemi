'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Room, useReservationData } from '../../context/ReservationContext';
import { useToast } from '../../context/ToastContext';

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
interface SelectedSlot {
  room: Room;
  slots: number[];
}

export default function CalendarView() {
  const { theme } = useTheme();
  const { rooms, reservations, setReservations, setRooms, operations, setOperations, pendingSelection, setPendingSelection, pendingTitle, setPendingTitle } = useReservationData();
  const { showToast } = useToast();
  
  const selectedRoom = pendingSelection ? rooms.find((room) => room.id === pendingSelection.roomId) : null;
  const selectedSlot = selectedRoom && pendingSelection ? { room: selectedRoom, slots: pendingSelection.slots } : null;
  const reservationTitle = pendingTitle;
  const hasSelectedRange = selectedSlot !== null && selectedSlot.slots.length >= 1;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date());
      setSelectedDate((date) => date ?? (pendingSelection ? new Date(`${pendingSelection.date}T12:00:00`) : new Date()));
    };
    updateCurrentTime();
    const timer = window.setInterval(updateCurrentTime, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [pendingSelection]);

  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

  const isToday = selectedDate !== null && currentTime !== null && selectedDate.toDateString() === currentTime.toDateString();
  const isPastDate = selectedDate !== null && currentTime !== null && selectedDate < new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  const visibleTimeSlots = timeSlots
    .map((time, slotIndex) => ({ time, slotIndex }))
    .filter(() => !isPastDate);

  const selectEmptySlot = (room: Room, slotIndex: number) => {
    if (!selectedSlot?.room || selectedSlot.room.name !== room.name) {
      setPendingSelection({ roomId: room.id, slots: [slotIndex], date: selectedDate?.toISOString().split('T')[0] ?? '' });
      return;
    }

    const isSelected = selectedSlot.slots.includes(slotIndex);
    const slots = isSelected
      ? selectedSlot.slots.filter((selectedIndex) => selectedIndex !== slotIndex)
      : [...selectedSlot.slots, slotIndex].sort((first, second) => first - second);
    setPendingSelection(slots.length > 0 ? { roomId: room.id, slots, date: pendingSelection?.date ?? selectedDate?.toISOString().split('T')[0] ?? '' } : null);
  };

  const clearSelection = () => {
    setPendingSelection(null);
    setPendingTitle('');
  };

  const formatSelectedRanges = (slots: number[]) => {
    const ranges: string[] = [];
    let rangeStart = slots[0];
    let rangeEnd = slots[0];

    slots.slice(1).forEach((slot) => {
      if (slot === rangeEnd + 1) {
        rangeEnd = slot;
      } else {
        ranges.push(`${timeSlots[rangeStart]} - ${timeSlots[rangeEnd + 1] ?? '18:00'}`);
        rangeStart = slot;
        rangeEnd = slot;
      }
    });

    ranges.push(`${timeSlots[rangeStart]} - ${timeSlots[rangeEnd + 1] ?? '18:00'}`);
    return ranges;
  };

  const confirmReservation = async () => {
    if (!selectedSlot?.room || !selectedDate || !pendingSelection || !reservationTitle.trim()) return;
    
    try {
      const sortedSlots = [...selectedSlot.slots].sort((first, second) => first - second);
      const ranges: { start: number; end: number }[] = [];
      let rangeStart = sortedSlots[0];
      let rangeEnd = sortedSlots[0];

      sortedSlots.slice(1).forEach((slot) => {
        if (slot === rangeEnd + 1) {
          rangeEnd = slot;
        } else {
          ranges.push({ start: rangeStart, end: rangeEnd + 1 });
          rangeStart = slot;
          rangeEnd = slot;
        }
      });
      ranges.push({ start: rangeStart, end: rangeEnd + 1 });

      setReservations([...reservations, ...ranges.map((range) => ({ id: Date.now() + range.start, roomId: selectedSlot.room!.id, ...range, title: reservationTitle.trim(), date: pendingSelection.date }))]);
      const isCurrentReservation = isToday && selectedSlot.slots.some((slot) => slot === currentTime!.getHours() - 9);
      
      setRooms((currentRooms) => currentRooms.map((room) => room.id === selectedSlot.room.id
        ? { ...room, status: isCurrentReservation ? 'Dolu' : room.status === 'Rezerve Ediliyor' ? 'Müsait' : room.status, lockEndTime: null }
        : room));
        
      setOperations([{ id: Date.now(), title: reservationTitle.trim(), details: `${selectedSlot.room.name} • ${formatSelectedRanges(selectedSlot.slots).join(', ')}`, date: formatDate(selectedDate) }, ...operations]);
      
      setPendingTitle('');
      setPendingSelection(null);

      showToast({
        type: 'success',
        title: 'Rezervasyon Tamamlandı',
        message: 'Rezervasyonunuz başarıyla oluşturuldu.'
      });
      
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Rezervasyon Oluşturulamadı',
        message: 'Rezervasyon oluşturulurken bir hata oluştu.'
      });
    }
  };

  const isSlotSelected = (roomName: string, slotIndex: number) => (
    selectedSlot?.room?.name === roomName && selectedSlot.slots.includes(slotIndex)
  );

  const getReservation = (roomId: string, slotIndex: number) => reservations.find(
    (reservation) => reservation.roomId === roomId && reservation.start === slotIndex && (reservation.date === null || reservation.date === selectedDate?.toISOString().split('T')[0]),
  );

  if (!selectedDate || !currentTime) return null;

  return (
    <section className="h-full overflow-y-auto bg-[#f3f6ff] p-4 text-[#101b35] dark:bg-[#141414] dark:text-[#e5e7eb] md:p-5">
      {/* pb-32 ile Floating Button çakışması önlendi, items-start ile gereksiz uzama engellendi */}
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 xl:flex-row items-start pb-32">
        
        {/* TAKVİM GRID ALANI (h-fit ile dinamik yükseklik) */}
        <div className="w-full xl:flex-1 border border-gray-200 bg-white dark:border-[#2d2d2d] dark:bg-[#1c1c1c] rounded-lg shadow-sm overflow-hidden h-fit">
          
          {/* TAKVİM HEADER */}
          <div className="relative flex h-14 items-center justify-between border-b border-gray-200 bg-gray-50 px-5 dark:border-[#2d2d2d] dark:bg-[#212121]">
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
              <button title="Önceki gün" onClick={() => changeDate(-1)} className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">‹</button>
              <input type="date" aria-label="Takvim tarihi seç" min={currentTime.toISOString().split('T')[0]} value={selectedDate.toISOString().split('T')[0]} onChange={(event) => handleDateChange(event.target.value)} style={{ colorScheme: theme }} className="border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-900 rounded outline-none focus:border-[#E4032C] dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white" />
              <button title="Sonraki gün" onClick={() => changeDate(1)} className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">›</button>
            </div>
            <div className="ml-auto flex gap-3">
              <button onClick={() => { clearSelection(); setSelectedDate(new Date()); }} className="border border-[#E4032C] rounded px-4 py-1.5 text-xs font-bold text-[#E4032C] transition-colors hover:bg-[#E4032C] hover:text-white">Bugün</button>
              <button className="border border-gray-300 rounded px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white dark:bg-[#141414] dark:border-[#3d3d3d] dark:text-gray-300">Tüm Odalar ⌄</button>
            </div>
          </div>

          {/* DİNAMİK GRID TABLOSU */}
          <div className="grid overflow-x-auto w-full" style={{ gridTemplateColumns: `180px repeat(${visibleTimeSlots.length}, minmax(110px, 1fr))` }}>
            
            {/* ÜST BİLGİ SATIRI (Oda ve Saatler) */}
            <div className="h-12 border-b border-r border-gray-200 px-4 flex items-center font-bold text-xs text-gray-600 dark:text-gray-400 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a]">Oda</div>
            {visibleTimeSlots.map(({ time, slotIndex }) => (
              <div key={time} className="h-12 border-b border-r border-gray-200 px-2 flex items-center justify-center font-bold text-[11px] text-gray-600 dark:text-gray-400 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#1a1a1a]">
                {time} - {timeSlots[slotIndex + 1] ?? '18:00'}
              </div>
            ))}

            {/* DİNAMİK ODA SATIRLARI (Tamamen mevcut oda sayısına bağlıdır) */}
            {rooms.map((room) => (
              <div key={room.id} className="contents group">
                
                {/* SOL KOLON: ODA BİLGİSİ */}
                <div className="h-[88px] border-b border-r border-gray-200 px-4 py-4 dark:border-[#2d2d2d] bg-white dark:bg-[#1c1c1c] flex flex-col justify-center transition-colors group-hover:bg-gray-50 dark:group-hover:bg-[#252525]">
                  <strong className="block text-sm text-gray-900 dark:text-white truncate">{room.name}</strong>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{room.capacity}</span>
                </div>

                {/* SAĞ KOLONLAR: SAAT DİLİMLERİ VE REZERVASYONLAR */}
                {visibleTimeSlots.map(({ time, slotIndex }) => {
                  const reservation = getReservation(room.id, slotIndex);
                  
                  // Eğer rezervasyon birden fazla saate sarkıyorsa (span), ara hücreleri gizle
                  const isContinuation = reservations.some((item) => item.roomId === room.id && item.start < slotIndex && item.end > slotIndex);
                  if (isContinuation) return null;

                  // 1. DURUM: REZERVASYON VAR (Izgara kenarlıkları korunarak içine eklendi)
                  if (reservation) {
                    return (
                      <div 
                        key={time} 
                        className="h-[88px] border-b border-r border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#1c1c1c] p-1.5" 
                        style={{ gridColumn: `span ${reservation.end - reservation.start}` }}
                      >
                        <div className="h-full w-full overflow-hidden rounded bg-[#E4032C] px-3 py-2 text-left text-xs font-bold text-white shadow-sm flex items-start">
                          {reservation.title}
                        </div>
                      </div>
                    );
                  }

                  // 2. DURUM: BOŞ VEYA SEÇİLİ HÜCRE
                  const isSelected = isSlotSelected(room.name, slotIndex);
                  return (
                    <button 
                      key={time} 
                      onClick={() => selectEmptySlot(room, slotIndex)} 
                      className={`h-[88px] border-b border-r border-gray-200 transition-colors dark:border-[#2d2d2d] hover:bg-red-50 dark:hover:bg-[#2a1b1e] focus:outline-none ${isSelected ? 'bg-red-50 ring-2 ring-inset ring-[#E4032C] dark:bg-[#3a2026] dark:ring-[#E4032C]' : 'bg-white dark:bg-[#1c1c1c]'}`} 
                      title={`${room.name} ${time} seç`}
                    ></button>
                  );
                })}

              </div>
            ))}
          </div>
        </div>

        {/* SAĞ TARAF: REZERVASYON ÖZET PANELİ (h-fit ile yüksekliği içindeki veriye göre ayarlanır) */}
        {hasSelectedRange && selectedSlot && (
          <aside className="flex h-fit w-full flex-col border border-gray-200 bg-white rounded-lg shadow-sm p-5 dark:border-[#2d2d2d] dark:bg-[#1c1c1c] xl:w-[280px] shrink-0">
            
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-[#2d2d2d]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Rezervasyon Özeti</h2>
              <button title="Rezervasyon özetini kapat" onClick={clearSelection} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="mt-5 border-l-[3px] border-[#E4032C] bg-gray-50 rounded-r p-3.5 dark:bg-[#1a1a1a]">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seçilen Oda</span>
              <strong className="mt-1 block text-sm text-gray-900 dark:text-white">{selectedSlot.room.name}</strong>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="bg-white border border-gray-200 px-2 py-1 rounded text-[11px] font-semibold text-gray-600 dark:bg-[#2a2a2a] dark:border-[#333] dark:text-gray-300">{selectedSlot.room.capacity}</span>
                {selectedSlot.room.features.slice(0, 1).map(f => (
                  <span key={f} className="bg-white border border-gray-200 px-2 py-1 rounded text-[11px] font-semibold text-gray-600 dark:bg-[#2a2a2a] dark:border-[#333] dark:text-gray-300">{f}</span>
                ))}
              </div>
            </div>
            
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Tarih</label>
                <input readOnly value={formatDate(selectedDate)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs font-semibold text-gray-800 outline-none dark:bg-[#141414] dark:border-[#3d3d3d] dark:text-gray-200" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Saat</label>
                <div className="w-full max-h-24 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2 text-xs font-semibold text-gray-800 dark:bg-[#141414] dark:border-[#3d3d3d] dark:text-gray-200 space-y-1">
                  {formatSelectedRanges(selectedSlot.slots).map((range) => <div key={range}>{range}</div>)}
                </div>
              </div>
            </div>
            
            <div className="mt-5">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Toplantı Başlığı</label>
              <input value={reservationTitle} onChange={(event) => setPendingTitle(event.target.value)} placeholder="Örn: Proje İncelemesi" className="w-full border border-gray-300 rounded bg-white p-2.5 text-sm text-gray-900 outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white transition-colors" />
            </div>
            
            <div className="mt-4 mb-6">
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">Katılımcılar (Opsiyonel)</label>
              <input placeholder="E-posta ekle..." className="w-full border border-gray-300 rounded bg-white p-2.5 text-sm text-gray-900 outline-none focus:border-[#E4032C] focus:ring-1 focus:ring-[#E4032C] dark:border-[#3d3d3d] dark:bg-[#141414] dark:text-white transition-colors" />
            </div>
            
            <button onClick={confirmReservation} disabled={!reservationTitle.trim()} className="mt-auto w-full bg-[#E4032C] py-3 rounded text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              Rezervasyonu Onayla
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}