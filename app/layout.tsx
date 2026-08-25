import './globals.css';
import type { Metadata } from 'next';
import AppLayout from './components/layout/AppLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ReservationProvider } from './context/ReservationContext';
import { ToastProvider } from './context/ToastContext'; 
import { UserProvider } from './context/UserContext'; // EKLENDİ

export const metadata: Metadata = {
  title: 'RoomReserve',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <UserProvider> {/* EKLENDİ */}
            <ReservationProvider>
              <ToastProvider> 
                <AppLayout>
                  {children}
                </AppLayout>
              </ToastProvider>
            </ReservationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}