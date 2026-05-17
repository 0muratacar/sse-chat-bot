import type { Metadata } from 'next';
import { StoreProvider } from '@/components/providers/StoreProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chat Bot',
  description: 'AI-powered chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
