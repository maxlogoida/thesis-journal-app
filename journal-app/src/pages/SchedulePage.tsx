import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProfile, selectRole } from '@/features/auth/authSlice'
import {
  useGetScheduleQuery,
  useGetScheduleByTeacherQuery,
  useGetSubjectsByTeacherQuery,
  useGetSubjectsByStudentQuery,
  useCreateScheduleEventMutation,
  useUpdateScheduleEventMutation,
  useDeleteScheduleEventMutation,
} from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Calendar, Trash2, Pencil } from 'lucide-react'
import { LESSON_TYPE_LABELS, LESSON_TYPE_COLORS } from '@/lib/constants'
import type { ScheduleEvent, LessonType } from '@/types/database'

const LESSON_TYPES: LessonType[] = ['lecture', 'lab', 'seminar', 'control', 'practice']
const DAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

interface EventForm {
  title: string
  subject_id: string
  type: LessonType
  room: string
  date: string
  start_time: string
  end_time: string
}

const emptyForm: EventForm = {
  title: '',
  subject_id: '',
  type: 'lecture',
  room: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '08:00',
  end_time: '09:30',
}

function EventCard({ event, canEdit, onEdit, onDelete }: {
  event: ScheduleEvent
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`rounded-lg p-2.5 text-xs border mb-1.5 ${LESSON_TYPE_COLORS[event.type]}`}>
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold leading-tight truncate flex-1">{event.title}</p>
        {canEdit && (
          <div className="flex gap-0.5 shrink-0">
            <button onClick={onEdit} className="hover:opacity-80 transition-opacity"><Pencil size={10} /></button>
            <button onClick={onDelete} className="hover:opacity-80 transition-opacity ml-0.5"><Trash2 size={10} /></button>
          </div>
        )}
      </div>
      <p className="opacity-70 mt-0.5">{event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}</p>
      <p className="opacity-70">Ауд. {event.room}</p>
    </div>
  )
}

export function SchedulePage() {
  const profile = useSelector(selectProfile)
  const role = useSelector(selectRole)
  const { toast } = useToast()
  const canEdit = role === 'teacher' || role === 'super_admin'

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ScheduleEvent | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  // null = всі типи показуються, інакше тільки вибраний
  const [activeType, setActiveType] = useState<LessonType | null>(null)

  const from = format(weekStart, 'yyyy-MM-dd')
  const to = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  const { data: allSchedule } = useGetScheduleQuery({ from, to }, { skip: role !== 'super_admin' })
  const { data: teacherSchedule } = useGetScheduleByTeacherQuery(
    { teacherId: profile?.id ?? '', from, to },
    { skip: role !== 'teacher' || !profile?.id }
  )
  const { data: studentAllSchedule } = useGetScheduleQuery({ from, to }, { skip: role !== 'student' })

  // Студент бачить тільки пари по своїх предметах
  const { data: studentSubjects } = useGetSubjectsByStudentQuery(profile?.id ?? '', { skip: role !== 'student' || !profile?.id })
  const studentSubjectIds = new Set(studentSubjects?.map((ss) => ss.subject_id) ?? [])

  const rawEvents =
    role === 'super_admin' ? allSchedule :
    role === 'teacher' ? teacherSchedule :
    (studentAllSchedule ?? []).filter((e) => studentSubjectIds.has(e.subject_id))

  // Фільтр по типу заняття
  const events = activeType ? (rawEvents ?? []).filter((e) => e.type === activeType) : (rawEvents ?? [])

  const { data: subjects } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: role !== 'teacher' || !profile?.id })

  const [createEvent] = useCreateScheduleEventMutation()
  const [updateEvent] = useUpdateScheduleEventMutation()
  const [deleteEvent] = useDeleteScheduleEventMutation()

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date), day))

  const handleSubmit = async () => {
    if (!form.title || !form.subject_id || !form.room) return
    setSubmitting(true)
    try {
      if (editTarget) {
        await updateEvent({ id: editTarget.id, ...form }).unwrap()
        toast({ title: 'Заняття оновлено' })
        setEditTarget(null)
      } else {
        await createEvent({ ...form, teacher_id: profile?.id ?? '' }).unwrap()
        toast({ title: 'Заняття додано до розкладу' })
      }
      setIsFormOpen(false)
      setForm(emptyForm)
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as { data?: { error?: string } }).data?.error ?? (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id).unwrap()
      toast({ title: 'Заняття видалено' })
    } catch {
      toast({ title: 'Помилка', variant: 'destructive' })
    }
  }

  const openEdit = (e: ScheduleEvent) => {
    setEditTarget(e)
    setForm({ title: e.title, subject_id: e.subject_id, type: e.type, room: e.room, date: e.date, start_time: e.start_time, end_time: e.end_time })
    setIsFormOpen(true)
  }

  const toggleType = (t: LessonType) => setActiveType((prev) => prev === t ? null : t)

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Розклад</h1>
          <p className="text-slate-400 text-sm mt-1">Тижневий календар занять</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditTarget(null); setForm(emptyForm); setIsFormOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" /> Додати заняття
          </Button>
        )}
      </div>

      {/* Week navigation */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart((w) => subWeeks(w, 1))} className="text-slate-300 hover:bg-slate-700">
              <ChevronLeft size={18} />
            </Button>
            <div className="flex items-center gap-2 text-white font-medium">
              <Calendar size={16} className="text-blue-400" />
              <span>{format(weekStart, 'd MMM', { locale: uk })} – {format(addDays(weekStart, 5), 'd MMM yyyy', { locale: uk })}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart((w) => addWeeks(w, 1))} className="text-slate-300 hover:bg-slate-700">
              <ChevronRight size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-slate-400 text-xs mr-1">Фільтр:</span>
        {LESSON_TYPES.map((t) => {
          const isActive = activeType === t
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                isActive
                  ? LESSON_TYPE_COLORS[t] + ' ring-2 ring-white/30 scale-105'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {LESSON_TYPE_LABELS[t]}
              {isActive && <span className="ml-1 opacity-70">✕</span>}
            </button>
          )
        })}
        {activeType && (
          <button onClick={() => setActiveType(null)} className="text-xs text-slate-500 hover:text-slate-300 ml-1">
            скинути
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-6 gap-3">
        {days.map((day, idx) => {
          const dayEvents = eventsOnDay(day)
          const isToday = isSameDay(day, new Date())
          return (
            <div key={idx} className={`rounded-xl border ${isToday ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700 bg-slate-800'}`}>
              <div className={`px-3 py-2.5 border-b ${isToday ? 'border-blue-500/30' : 'border-slate-700'}`}>
                <p className="text-slate-400 text-xs font-medium">{DAYS_UA[idx]}</p>
                <p className={`text-lg font-bold leading-tight ${isToday ? 'text-blue-400' : 'text-white'}`}>
                  {format(day, 'd')}
                </p>
                <p className="text-slate-500 text-xs">{format(day, 'MMM', { locale: uk })}</p>
              </div>
              <div className="p-2 min-h-[120px]">
                {dayEvents.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center mt-3">—</p>
                ) : (
                  dayEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      canEdit={canEdit}
                      onEdit={() => openEdit(e)}
                      onDelete={() => handleDelete(e.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) { setIsFormOpen(false); setEditTarget(null) } }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Редагувати заняття' : 'Нове заняття'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Назва заняття</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Вища математика – Лекція 1" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Предмет</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {subjects?.map((s) => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Тип заняття</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as LessonType }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {LESSON_TYPES.map((t) => <SelectItem key={t} value={t} className="text-white">{LESSON_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Дата</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Початок</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Кінець</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Аудиторія</Label>
              <Input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="101, A-203..." className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setIsFormOpen(false); setEditTarget(null) }} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? 'Збереження...' : editTarget ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
