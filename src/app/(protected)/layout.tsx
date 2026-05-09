import { BottomNav } from '@/components/dashboard/BottomNav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A]">
      {children}
      <BottomNav />
    </div>
  )
}
