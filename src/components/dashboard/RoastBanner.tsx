'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Star } from 'lucide-react'
import { RoastResult } from '@/lib/roasts'

interface RoastBannerProps {
  roast: RoastResult
}

export function RoastBanner({ roast }: RoastBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative rounded-2xl p-4 mb-4 ${roast.type === 'praise'
            ? 'bg-[#39FF14]/10 border border-[#39FF14]/30'
            : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 left-3 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-1">
            <motion.div
              animate={roast.type === 'roast' ? { rotate: [0, -10, 10, -10, 0] } : { scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${roast.type === 'praise' ? 'bg-[#39FF14]/20' : 'bg-red-500/20'}`}
            >
              {roast.type === 'praise' ? (
                <Star className="w-5 h-5 text-[#39FF14]" />
              ) : (
                <Flame className="w-5 h-5 text-red-400" />
              )}
            </motion.div>
            <p className={`text-sm font-medium leading-relaxed ${roast.type === 'praise' ? 'text-[#39FF14]' : 'text-red-300'}`}>
              {roast.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
