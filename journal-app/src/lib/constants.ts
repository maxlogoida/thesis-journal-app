import type { LessonType, GradeType } from '@/types/database'

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  lecture: 'Лекція',
  lab: 'Лаб. робота',
  seminar: 'Семінар',
  control: 'Контрольна',
  practice: 'Практика',
}

export const LESSON_TYPE_COLORS: Record<LessonType, string> = {
  lecture: 'bg-blue-600/20 text-blue-300 border-blue-700',
  lab: 'bg-emerald-600/20 text-emerald-300 border-emerald-700',
  seminar: 'bg-violet-600/20 text-violet-300 border-violet-700',
  control: 'bg-red-600/20 text-red-300 border-red-700',
  practice: 'bg-amber-600/20 text-amber-300 border-amber-700',
}

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  class: 'За пару',
  control: 'Контрольна',
  monthly: 'Місячна',
  semester: 'Семестрова',
  annual: 'Річна',
}

export const GRADE_TYPE_COLORS: Record<GradeType, string> = {
  class: 'bg-slate-700 text-slate-300',
  control: 'bg-red-900/40 text-red-300',
  monthly: 'bg-amber-900/40 text-amber-300',
  semester: 'bg-blue-900/40 text-blue-300',
  annual: 'bg-violet-900/40 text-violet-300',
}
