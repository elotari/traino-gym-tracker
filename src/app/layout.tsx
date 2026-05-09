import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'Traino | تحدى نفسك',
  description: 'تطبيق تتبع الجيم للمتحدين',
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${inter.variable} ${cairo.variable} font-cairo bg-[#0A0A0A] text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#111', border: '1px solid rgba(57,255,20,0.3)', color: 'white' }
          }}
        />
      </body>
    </html>
  )
}
