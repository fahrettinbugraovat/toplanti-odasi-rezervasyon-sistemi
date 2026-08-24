'use client';

import { createContext, useContext, useState } from 'react';

export type RoomStatus = 'Müsait' | 'Dolu' | 'Rezerve Ediliyor';

export interface Room {
  id: string;
  name: string;
  capacity: string;
  features: string[];
  status: RoomStatus;
  lockEndTime: number | null;
}

export interface Operation {
  id: number;
  title: string;
  details: string;
  date: string;
}

export interface CalendarReservation {
  id: number;
  roomId: string;
  start: number;
  end: number;
  title: string;
  date: string | null;
}

export interface PendingCalendarSelection {
  roomId: string;
  slots: number[];
  date: string;
}

const initialRooms: Room[] = [
  { id: '1', name: 'Boardroom Alpha', capacity: '12 Kişi', features: ['VC Gear'], status: 'Dolu', lockEndTime: null },
  { id: '2', name: 'Huddle Room 1', capacity: '4 Kişi', features: ['Whiteboard'], status: 'Müsait', lockEndTime: null },
  { id: '3', name: 'Creative Space', capacity: '8 Kişi', features: ['Projector'], status: 'Müsait', lockEndTime: null },
];

const initialOperations: Operation[] = [
  { id: 1, title: 'Yönetim Kurulu Toplantısı', details: 'Boardroom Alpha • 14:00 - 15:00', date: 'Bugün' },
  { id: 2, title: 'Proje Kick-off', details: 'Huddle Room 1 • 09:00 - 10:00', date: 'Yarın' },
  { id: 3, title: 'Tasarım İncelemesi', details: 'Creative Space • 11:00 - 12:00', date: '22 Eki' },
  { id: 4, title: 'Aylık Değerlendirme', details: 'Huddle Room 1 • 15:00 - 16:00', date: '23 Eki' },
];

const initialCalendarReservations: CalendarReservation[] = [
  { id: 1, roomId: '1', start: 1, end: 3, title: 'Proje Değerlendirmesi', date: null },
  { id: 2, roomId: '1', start: 5, end: 7, title: 'Tasarım İncelemesi', date: null },
];

interface ReservationContextValue {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
  reservations: CalendarReservation[];
  setReservations: React.Dispatch<React.SetStateAction<CalendarReservation[]>>;
  pendingSelection: PendingCalendarSelection | null;
  setPendingSelection: React.Dispatch<React.SetStateAction<PendingCalendarSelection | null>>;
  pendingTitle: string;
  setPendingTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [operations, setOperations] = useState(initialOperations);
  const [reservations, setReservations] = useState(initialCalendarReservations);
  const [pendingSelection, setPendingSelection] = useState<PendingCalendarSelection | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');

  return <ReservationContext.Provider value={{ rooms, setRooms, operations, setOperations, reservations, setReservations, pendingSelection, setPendingSelection, pendingTitle, setPendingTitle }}>{children}</ReservationContext.Provider>;
}

export function useReservationData() {
  const context = useContext(ReservationContext);
  if (!context) throw new Error('useReservationData must be used inside ReservationProvider');
  return context;
}
