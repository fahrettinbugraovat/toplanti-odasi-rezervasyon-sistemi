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
  status?: 'aktif' | 'iptal' | 'bekliyor'; 
  pendingChanges?: { 
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
  requestOperationEdit: (id: number, newDetails: string, newDate: string) => void;
  approveOperationEdit: (id: number) => void;
  rejectOperationEdit: (id: number) => void;
  cancelOperation: (id: number) => void;
}

const ReservationContext = createContext<ReservationContextProps | undefined>(undefined);

// SAHTE ODALAR SİLİNDİ (DB KULLANILACAK)

// 1970 YILI HATASINA SEBEP OLAN ANTİK TOPLANTILAR SİLİNDİ :)
const initialOperations: Operation[] = [];

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]); // Başlangıçta boş, API'den dolacak
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [mounted, setMounted] = useState(false);

  // SİSTEM YÜKLENDİĞİNDE ÇALIŞACAK
  useEffect(() => {
    // 1. İşlemleri (Operasyonları) LocalStorage'dan çek
    const savedOperations = localStorage.getItem('operationsData');
    if (savedOperations) setOperations(JSON.parse(savedOperations));
    else setOperations(initialOperations);

    // 2. ODALARI GERÇEK VERİTABANINDAN ÇEK (Single Source of Truth)
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/meeting-rooms');
        if (response.ok) {
          const data = await response.json();
          // DB'den gelen odalara Arayüz (UI) için default statüler ekliyoruz
          const formattedRooms = data.map((room: any) => ({
            ...room,
            status: room.status || 'Müsait',
            lockEndTime: room.lockEndTime || null
          }));
          setRooms(formattedRooms);
        }
      } catch (error) {
        console.error("Odalar veritabanından çekilirken hata oluştu:", error);
      }
    };

    fetchRooms();
    setMounted(true);
  }, []);

  // ODALARI ARTIK LOCALSTORAGE'A KAYDETMİYORUZ ÇÜNKÜ PATRON VERİTABANI
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('operationsData', JSON.stringify(operations));
    }
  }, [operations, mounted]);

  // --- İŞ AKIŞI FONKSİYONLARI (Hiç dokunulmadı) ---
  const cancelOperation = (id: number) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, status: 'iptal' } : op));
  };

  const requestOperationEdit = (id: number, newDetails: string, newDate: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, status: 'bekliyor', pendingChanges: { details: newDetails, date: newDate } } : op
    ));
  };

  const approveOperationEdit = (id: number) => {
    setOperations(prev => prev.map(op => {
      if (op.id === id && op.pendingChanges) {
        return { 
          ...op, details: op.pendingChanges.details, date: op.pendingChanges.date, 
          status: 'aktif', pendingChanges: undefined 
        };
      }
      return op;
    }));
  };

  const rejectOperationEdit = (id: number) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, status: 'aktif', pendingChanges: undefined } : op
    ));
  };

  return (
    <ReservationContext.Provider value={{ 
      rooms, setRooms, reservations, setReservations, operations, setOperations,
      pendingSelection, setPendingSelection, pendingTitle, setPendingTitle,
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