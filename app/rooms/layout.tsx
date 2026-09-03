import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tüm Odalar',
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}