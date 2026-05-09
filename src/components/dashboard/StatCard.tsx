'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  color?: string
  progress?: number
  delay?: number
}

export function StatCard({ icon: Icon, label, value, unit, color = '#39FF14', progress, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card-dark rounded-2xl p-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {progress !== undefined && (
          <span className="text-xs font-bold" style={{ color }}>{progress}%</span>
        )}
      </div>
      <div className="mt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white">{value}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      )}
    </motion.div>
  )
}
