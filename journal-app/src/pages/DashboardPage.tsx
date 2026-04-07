import { useSelector } from 'react-redux'
import { selectProfile, selectRole } from '@/features/auth/authSlice'
import { useGetSubjectsByTeacherQuery, useGetGradesByStudentQuery, useGetScheduleByTeacherQuery, useGetSubjectsByStudentQuery, useGetTeachersQuery, useGetStudentsQuery, useGetSubjectsQuery } from '@/app/apiSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'
import { BookOpen, Users, GraduationCap, Calendar, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import { LESSON_TYPE_LABELS, LESSON_TYPE_COLORS } from '@/lib/constants'
import type { ScheduleEvent } from '@/types/database'

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingLesson({ event }: { event: ScheduleEvent }) {
  const date = parseISO(event.date)
  const dateLabel = isToday(date) ? 'Сьогодні' : isTomorrow(date) ? 'Завтра' : format(date, 'd MMM', { locale: uk })

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-700/50 last:border-0">
      <div className="text-center w-16 shrink-0">
        <p className="text-xs text-slate-400">{dateLabel}</p>
        <p className="text-white text-sm font-medium">{event.start_time.slice(0, 5)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{event.title}</p>
        <p className="text-slate-400 text-xs">Ауд. {event.room}</p>
      </div>
      <Badge className={`text-xs shrink-0 ${LESSON_TYPE_COLORS[event.type]}`}>
        {LESSON_TYPE_LABELS[event.type]}
      </Badge>
    </div>
  )
}

export function DashboardPage() {
  const profile = useSelector(selectProfile)
  const role = useSelector(selectRole)

  const today = format(new Date(), 'yyyy-MM-dd')
  const nextWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')

  const { data: teacherSubjects, isLoading: loadingTSubj } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: role !== 'teacher' || !profile?.id })
  const { data: teacherSchedule, isLoading: loadingTSched } = useGetScheduleByTeacherQuery({ teacherId: profile?.id ?? '', from: today, to: nextWeek }, { skip: role !== 'teacher' || !profile?.id })
  const { data: studentSubjects, isLoading: loadingSSubj } = useGetSubjectsByStudentQuery(profile?.id ?? '', { skip: role !== 'student' || !profile?.id })
  const { data: studentGrades } = useGetGradesByStudentQuery(profile?.id ?? '', { skip: role !== 'student' || !profile?.id })
  const { data: allTeachers } = useGetTeachersQuery(undefined, { skip: role !== 'super_admin' })
  const { data: allStudents } = useGetStudentsQuery(undefined, { skip: role !== 'super_admin' })
  const { data: allSubjects } = useGetSubjectsQuery(undefined, { skip: role !== 'super_admin' })

  const isLoading = loadingTSubj || loadingTSched || loadingSSubj

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Доброго ранку' : greetingHour < 18 ? 'Добрий день' : 'Добрий вечір'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}, {profile?.full_name.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: uk })}</p>
      </div>

      {/* SUPER ADMIN */}
      {role === 'super_admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Викладачів" value={allTeachers?.length ?? 0} icon={<Users size={22} className="text-white" />} color="bg-blue-600" />
            <StatCard title="Студентів" value={allStudents?.length ?? 0} icon={<GraduationCap size={22} className="text-white" />} color="bg-emerald-600" />
            <StatCard title="Предметів" value={allSubjects?.length ?? 0} icon={<BookOpen size={22} className="text-white" />} color="bg-violet-600" />
          </div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Останні предмети</CardTitle>
            </CardHeader>
            <CardContent>
              {allSubjects?.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                  <p className="text-white text-sm">{s.name}</p>
                  <p className="text-slate-400 text-xs">{s.teacher?.full_name}</p>
                </div>
              ))}
              {!allSubjects?.length && <p className="text-slate-500 text-sm">Немає предметів</p>}
            </CardContent>
          </Card>
        </>
      )}

      {/* TEACHER */}
      {role === 'teacher' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <Skeleton className="h-12 w-full bg-slate-700" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard title="Мої предмети" value={teacherSubjects?.length ?? 0} icon={<BookOpen size={22} className="text-white" />} color="bg-blue-600" />
                <StatCard title="Занять цього тижня" value={teacherSchedule?.length ?? 0} icon={<Calendar size={22} className="text-white" />} color="bg-emerald-600" />
                <StatCard title="Годин навантаження" value={(teacherSchedule ?? []).reduce((acc) => acc + 1.5, 0)} icon={<Clock size={22} className="text-white" />} color="bg-amber-600" />
              </>
            )}
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                Найближчі заняття
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacherSchedule?.slice(0, 6).map((e) => <UpcomingLesson key={e.id} event={e} />) ?? (
                <p className="text-slate-500 text-sm">Немає запланованих занять</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* STUDENT */}
      {role === 'student' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6"><Skeleton className="h-12 w-full bg-slate-700" /></CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard title="Мої предмети" value={studentSubjects?.length ?? 0} icon={<BookOpen size={22} className="text-white" />} color="bg-blue-600" />
                <StatCard title="Всього оцінок" value={studentGrades?.length ?? 0} icon={<TrendingUp size={22} className="text-white" />} color="bg-emerald-600" />
                <StatCard
                  title="Середній бал"
                  value={
                    studentGrades?.length
                      ? (studentGrades.reduce((acc, g) => acc + g.value, 0) / studentGrades.length).toFixed(1)
                      : '—'
                  }
                  icon={<BarChart3Icon size={22} className="text-white" />}
                  color="bg-violet-600"
                />
              </>
            )}
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Останні оцінки</CardTitle>
            </CardHeader>
            <CardContent>
              {studentGrades?.slice(0, 6).map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white text-sm">{g.subject?.name}</p>
                    <p className="text-slate-400 text-xs">{format(parseISO(g.date), 'd MMM', { locale: uk })}</p>
                  </div>
                  <span className={`text-lg font-bold ${g.value >= 75 ? 'text-emerald-400' : g.value >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {g.value}
                  </span>
                </div>
              )) ?? <p className="text-slate-500 text-sm">Немає оцінок</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function BarChart3Icon({ size, className }: { size: number; className?: string }) {
  return <BarChart3 size={size} className={className} />
}
