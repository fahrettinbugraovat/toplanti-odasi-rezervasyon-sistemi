'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  showToast: (options: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Portal'ın SSR'da hata vermemesi için component mount olduktan sonra render edeceğiz
  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback(({ type, title, message }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // 4 Saniye sonra bildirimi kaldır
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // BİLDİRİM EKRANI (REACT PORTAL İLE EN ÜSTE ÇIKARILIYOR)
  const toastContainer = (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
      
      {/* İÇE GÖMÜLÜ ANİMASYON */}
      <style>{`
        @keyframes toastSlideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .toast-item {
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: auto; /* Tıklanabilir olmasını sağlar */
        }
      `}</style>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-item flex items-start gap-3 w-[340px] md:w-[380px] p-4 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#333] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        >
          {/* İKON KISMI */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <span className="material-symbols-outlined text-[#10B981] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {toast.type === 'error' && (
              <span className="material-symbols-outlined text-[#EF4444] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            )}
            {toast.type === 'info' && (
              <span className="material-symbols-outlined text-[#3B82F6] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            )}
          </div>
          
          {/* İÇERİK KISMI */}
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{toast.title}</h4>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">{toast.message}</p>
          </div>
          
          {/* KAPATMA BUTONU */}
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 -mr-2 -mt-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && typeof document !== 'undefined' ? createPortal(toastContainer, document.body) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};