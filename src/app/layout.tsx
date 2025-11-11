import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'Academia',
  description: 'Gestão de academia (front)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <main className="max-w-6xl mx-auto p-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
