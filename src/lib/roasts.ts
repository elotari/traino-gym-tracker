import { DailyLog } from '@/types'
import { calcDayScore } from './compliance'

export interface RoastResult {
  message: string
  type: 'roast' | 'praise' | 'neutral'
  emoji: string
}

const ROASTS = [
  "جد؟ 3 أيام بدون جيم؟ البطن بدها تطلع لبرا! 🍺",
  "أبن عمك تمرن وانت قاعد تتفرج على التلفزيون؟ عيب عليك!",
  "شربت مي بس؟ الصبار بيشرب أكثر منك! 🌵",
  "10,000 خطوة مش صعبة، بس انت مخصوص صعّبتها! 🐢",
  "الكنبة مش معدات رياضية يا صاحبي! قوم تحرك!",
  "ابن عمك يتعرق في الجيم وانت تتعرق من الكسل! 😂",
]

const PRAISE = [
  "ماشي يا أسطورة! استمر، أنت على الطريق الصح! 🔥",
  "هذا هو الكلام! عضلة عضلة والجبل يتحرك! 💪",
  "أخيراً! جسمك بيشكرك - دماغك بعدين! 🏆",
  "يا بطل! اليوم كان مثالي، كمّل هيك! ⚡",
]

export function generateFeedback(log: DailyLog): RoastResult {
  const score = calcDayScore(log)
  if (score >= 80) {
    const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)]
    return { message: msg, type: 'praise', emoji: '🏆' }
  }
  const msg = ROASTS[Math.floor(Math.random() * ROASTS.length)]
  return { message: msg, type: 'roast', emoji: '🔥' }
}

export function getMorningMotivation(): string {
  const messages = [
    "صباح الجيم يا بطل! اليوم بدك تدمر التمرين! 💪",
    "الكنبة هي عدوك الأكبر! قوم وتحرك! 🔥",
    "يوم جديد، فرصة جديدة تسبق ابن عمك! ⚡",
    "أيام الكسل انتهت! اليوم بدك تتعب! 🏋️",
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}
