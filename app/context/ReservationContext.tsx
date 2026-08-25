'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Room {
  id: string;
  name: string;
  capacity: string;
  features: string[];
  status: 'Müsait' | 'Dolu' | 'Rezerve Ediliyor';
  lockEndTime: number | null;
}

export interface Reservation {
  id: number;
  roomId: string;
  start: number;
  end: number;
  title: string;
  date: string | null;
}

export interface Operation {
  id: number;
  title: string;
  details: string;
  date: string;
  status?: 'aktif' | 'iptal' | 'bekliyor'; // Yeni Statüler
  pendingChanges?: { // Düzenleme talebi için geçici depo
    details: string;
    date: string;
  };
}

export interface PendingSelection {
  roomId: string;
  slots: number[];
  date: string;
}

interface ReservationContextProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
  pendingSelection: PendingSelection | null;
  setPendingSelection: (selection: PendingSelection | null) => void;
  pendingTitle: string;
  setPendingTitle: (title: string) => void;
  // Yeni Fonksiyonlar
  requestOperationEdit: (id: number, newDetails: string, newDate: string) => void;
  approveOperationEdit: (id: number) => void;
  rejectOperationEdit: (id: number) => void;
  cancelOperation: (id: number) => void;
}

const ReservationContext = createContext<ReservationContextProps | undefined>(undefined);

// BAŞLANGIÇ VERİSİ
const initialRooms: Room[] = [
  { id: '1', name: 'Boardroom Alpha', capacity: '12 Kişi', features: ['TV', 'Beyaz Tahta', 'Kamera'], status: 'Müsait', lockEndTime: null },
  { id: '2', name: 'Huddle Room 1', capacity: '4 Kişi', features: ['TV'], status: 'Müsait', lockEndTime: null },
  { id: '3', name: 'Creative Space', capacity: '8 Kişi', features: ['Beyaz Tahta', 'Projeksiyon'], status: 'Müsait', lockEndTime: null },
];

const initialOperations: Operation[] = [
  { id: 1, title: 'Proje Değerlendirmesi', details: 'Boardroom Alpha • 10:00 - 12:00', date: 'Bugün', status: 'aktif' },
  { id: 2, title: 'Tasarım İncelemesi', details: 'Boardroom Alpha • 14:00 - 16:00', date: 'Bugün', status: 'aktif' },
];

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedRooms = localStorage.getItem('roomsData');
    const savedOperations = localStorage.getItem('operationsData');

    if (savedRooms) setRooms(JSON.parse(savedRooms));
    else setRooms(initialRooms);

    if (savedOperations) setOperations(JSON.parse(savedOperations));
    else setOperations(initialOperations);

    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('roomsData', JSON.stringify(rooms));
      localStorage.setItem('operationsData', JSON.stringify(operations));
    }
  }, [rooms, operations, mounted]);

  // --- YENİ İŞ AKIŞI FONKSİYONLARI ---

  // 1. İptal Et (Siler gibi yapıp statüyü iptal'e çekeriz)
  const cancelOperation = (id: number) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, status: 'iptal' } : op));
  };

  // 2. Düzenleme Talebi Gönder (Mevcudu bozmadan beklemeye alır)
  const requestOperationEdit = (id: number, newDetails: string, newDate: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { ...op, status: 'bekliyor', pendingChanges: { details: newDetails, date: newDate } } 
        : op
    ));
  };

  // 3. Talebi Onayla (Değişiklikleri kalıcı yapar, statüyü aktife çeker)
  const approveOperationEdit = (id: number) => {
    setOperations(prev => prev.map(op => {
      if (op.id === id && op.pendingChanges) {
        return { 
          ...op, 
          details: op.pendingChanges.details, 
          date: op.pendingChanges.date, 
          status: 'aktif', 
          pendingChanges: undefined 
        };
      }
      return op;
    }));
  };

  // 4. Talebi Reddet (Bekleyen değişiklikleri siler, eski haline döndürür)
  const rejectOperationEdit = (id: number) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { ...op, status: 'aktif', pendingChanges: undefined } 
        : op
    ));
  };

  return (
    <ReservationContext.Provider value={{ 
      rooms, setRooms, 
      reservations, setReservations, 
      operations, setOperations,
      pendingSelection, setPendingSelection,
      pendingTitle, setPendingTitle,
      requestOperationEdit, approveOperationEdit, rejectOperationEdit, cancelOperation
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservationData = () => {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservationData must be used within a ReservationProvider");
  return context;
};