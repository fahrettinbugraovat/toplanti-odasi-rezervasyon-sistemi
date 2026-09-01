'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HarAlert } from '../components/ui/HarUI';

type ToastType = 'success' | 'error';

interface ToastOptions {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextProps {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Portal'ın sadece istemcide (client) çalışması için
  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback(({ type, title, message, duration = 4000 }: ToastOptions) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* REACT PORTAL İLE DOĞRUDAN BODY'YE EKLENİYOR (HİÇBİR CSS ENGELLEYEMEZ) */}
      {mounted && typeof document !== 'undefined'
        ? createPortal(
            <div 
              style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999999 }} 
              className="flex flex-col gap-3 pointer-events-none"
            >
              {toasts.map((toast) => (
                <HarAlert
                  key={toast.id}
                  variant="surface-borderless"
                  status={toast.type === 'success' ? 'success' : 'danger'}
                  className="pointer-events-auto flex items-start gap-3 w-80 p-4 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#333] rounded-lg shadow-2xl"
                >
                  <span className={`material-symbols-outlined text-[24px] shrink-0 ${
                    toast.type === 'success' ? 'text-emerald-500' : 'text-[#E4032C]'
                  }`}>
                    {toast.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{toast.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">{toast.message}</p>
                  </div>
                  
                  <button 
                    onClick={() => removeToast(toast.id)}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </HarAlert>
              ))}
            </div>,
            document.body // Doğrudan body etiketine gönderildi
          )
        : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};