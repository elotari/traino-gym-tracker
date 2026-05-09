'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, ClipboardList, Trophy, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/log', icon: ClipboardList, label: 'سجل اليوم' },
  { href: '/competition', icon: Trophy, label: 'التحدي' },
  { href: '/profile', icon: User, label: 'حسابي' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
      <div className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${isActive ? 'text-[#39FF14]' : 'text-gray-500'}`}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-[#39FF14]/15 rounded-lg -m-2"
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-[0_0_6px_rgba(57,255,20,0.8)]' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-[#39FF14]' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
