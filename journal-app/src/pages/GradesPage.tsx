import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProfile, selectRole } from '@/features/auth/authSlice'
import {
  useGetSubjectsByTeacherQuery,
  useGetSubjectsByStudentQuery,
  useGetStudentsBySubjectQuery,
  useGetGradesBySubjectQuery,
  useGetGradesByStudentQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
} from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Plus, Pencil, Trash2, Download, BarChart3 } from 'lucide-react'
import { GRADE_TYPE_LABELS, GRADE_TYPE_COLORS } from '@/lib/constants'
import type { Grade, GradeType } from '@/types/database'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const GRADE_TYPES: GradeType[] = ['class', 'control', 'monthly', 'semester', 'annual']

function GradeValue({ value }: { value: number }) {
  const color = value >= 90 ? 'text-emerald-400' : value >= 75 ? 'text-blue-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'
  return <span className={`text-lg font-bold ${color}`}>{value}</span>
}

function AverageCard({ label, grades }: { label: string; grades: Grade[] }) {
  const avg = grades.length ? (grades.reduce((a, g) => a + g.value, 0) / grades.length).toFixed(1) : '—'
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${typeof avg === 'string' && avg !== '—' ? (parseFloat(avg) >= 75 ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-400'}`}>{avg}</p>
    </div>
  )
}

export function GradesPage() {
  const profile = useSelector(selectProfile)
  const role = useSelector(selectRole)
  const { toast } = useToast()

  const [selectedSubject, setSelectedSubject] = useState('__all__')
  const [selectedStudent, setSelectedStudent] = useState('__all__')
  const [activeTab, setActiveTab] = useState<GradeType | 'all'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Grade | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [gradeForm, setGradeForm] = useState({ student_id: '', grade_type: 'class' as GradeType, value: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })

  const [createGrade] = useCreateGradeMutation()
  const [updateGrade] = useUpdateGradeMutation()
  const [deleteGrade] = useDeleteGradeMutation()

  const { data: teacherSubjects } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: role !== 'teacher' || !profile?.id })
  const { data: studentSubjects } = useGetSubjectsByStudentQuery(profile?.id ?? '', { skip: role !== 'student' || !profile?.id })
  const activeSubject = selectedSubject === '__all__' ? '' : selectedSubject
  const activeStudentFilter = selectedStudent === '__all__' ? '' : selectedStudent

  const { data: enrolledStudents } = useGetStudentsBySubjectQuery(activeSubject, { skip: !activeSubject || role !== 'teacher' })
  const { data: subjectGrades, isLoading: loadingSG } = useGetGradesBySubjectQuery(activeSubject, { skip: !activeSubject || role !== 'teacher' })
  const { data: studentGrades, isLoading: loadingStudG } = useGetGradesByStudentQuery(profile?.id ?? '', { skip: role !== 'student' || !profile?.id })

  const subjects = role === 'teacher' ? teacherSubjects : studentSubjects?.map((ss) => ss.subject).filter(Boolean)

  const displayGrades = role === 'teacher'
    ? (subjectGrades ?? []).filter((g) => !activeStudentFilter || g.student_id === activeStudentFilter)
    : (studentGrades ?? []).filter((g) => !activeSubject || g.subject_id === activeSubject)

  const filteredGrades = activeTab === 'all' ? displayGrades : displayGrades.filter((g) => g.grade_type === activeTab)

  // Stats
  const now = new Date()
  const monthGrades = displayGrades.filter((g) => {
    const d = parseISO(g.date)
    return getMonth(d) === getMonth(now) && getYear(d) === getYear(now)
  })

  const handleCreate = async () => {
    if (!gradeForm.student_id || !gradeForm.value || !selectedSubject) return
    setSubmitting(true)
    try {
      await createGrade({
        student_id: gradeForm.student_id,
        subject_id: selectedSubject,
        schedule_id: null,
        grade_type: gradeForm.grade_type,
        value: Number(gradeForm.value),
        date: gradeForm.date,
        teacher_id: profile?.id ?? '',
        note: gradeForm.note,
      }).unwrap()
      toast({ title: 'Оцінку виставлено' })
      setIsCreateOpen(false)
      setGradeForm({ student_id: '', grade_type: 'class', value: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    setSubmitting(true)
    try {
      await updateGrade({ id: editTarget.id, value: Number(gradeForm.value), note: gradeForm.note }).unwrap()
      toast({ title: 'Оцінку оновлено' })
      setEditTarget(null)
    } catch {
      toast({ title: 'Помилка', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGrade(id).unwrap()
      toast({ title: 'Оцінку видалено' })
    } catch {
      toast({ title: 'Помилка', variant: 'destructive' })
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Журнал оцінок', 14, 20)
    autoTable(doc, {
      startY: 30,
      head: [['Студент', 'Тип', 'Оцінка', 'Дата', 'Нотатка']],
      body: filteredGrades.map((g) => [
        g.student?.full_name ?? '',
        GRADE_TYPE_LABELS[g.grade_type],
        g.value.toString(),
        format(parseISO(g.date), 'dd.MM.yyyy'),
        g.note ?? '',
      ]),
    })
    doc.save('grades.pdf')
  }

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filteredGrades.map((g) => ({
      Студент: g.student?.full_name ?? '',
      Тип: GRADE_TYPE_LABELS[g.grade_type],
      Оцінка: g.value,
      Дата: format(parseISO(g.date), 'dd.MM.yyyy'),
      Нотатка: g.note ?? '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Оцінки')
    XLSX.writeFile(wb, 'grades.xlsx')
  }

  const isLoading = loadingSG || loadingStudG

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Журнал оцінок</h1>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'teacher' ? 'Виставлення та перегляд оцінок' : 'Мої оцінки'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportXLSX} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Download size={14} className="mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Download size={14} className="mr-2" /> PDF
          </Button>
          {role === 'teacher' && (
            <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedSubject} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" /> Виставити оцінку
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-xs mb-2 block">Предмет</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Всі предмети" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {role === 'teacher' && <SelectItem value="__all__" className="text-white">Всі предмети</SelectItem>}
                  {subjects?.map((s) => s && <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {role === 'teacher' && (
              <div>
                <Label className="text-slate-400 text-xs mb-2 block">Студент</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Всі студенти" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="__all__" className="text-white">Всі студенти</SelectItem>
                    {enrolledStudents?.map((ss) => ss.student && (
                      <SelectItem key={ss.student.id} value={ss.student.id} className="text-white">{ss.student.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AverageCard label="За місяць" grades={monthGrades} />
        <AverageCard label="Контрольні" grades={displayGrades.filter((g) => g.grade_type === 'control')} />
        <AverageCard label="Семестрова" grades={displayGrades.filter((g) => g.grade_type === 'semester')} />
        <AverageCard label="Річна" grades={displayGrades.filter((g) => g.grade_type === 'annual')} />
      </div>

      {/* Tabs + Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" />
              {filteredGrades.length} записів
            </CardTitle>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GradeType | 'all')}>
              <TabsList className="bg-slate-700 border-slate-600">
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">Всі</TabsTrigger>
                {GRADE_TYPES.map((t) => (
                  <TabsTrigger key={t} value={t} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                    {GRADE_TYPE_LABELS[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50">
                <Skeleton className="h-4 w-40 bg-slate-700" />
                <Skeleton className="h-4 w-24 bg-slate-700 ml-auto" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </div>
            ))
          ) : filteredGrades.length === 0 ? (
            <p className="text-slate-500 text-sm px-6 py-8 text-center">Оцінок не знайдено</p>
          ) : (
            filteredGrades.map((g) => (
              <div key={g.id} className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                <div className="flex-1 min-w-0">
                  {role === 'teacher' && <p className="text-white font-medium text-sm truncate">{g.student?.full_name}</p>}
                  {role === 'student' && <p className="text-white font-medium text-sm truncate">{g.subject?.name}</p>}
                  <p className="text-slate-400 text-xs">{format(parseISO(g.date), 'd MMMM yyyy', { locale: uk })}{g.note ? ` · ${g.note}` : ''}</p>
                </div>
                <Badge className={`text-xs shrink-0 ${GRADE_TYPE_COLORS[g.grade_type]}`}>{GRADE_TYPE_LABELS[g.grade_type]}</Badge>
                <GradeValue value={g.value} />
                {role === 'teacher' && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { setEditTarget(g); setGradeForm((f) => ({ ...f, value: g.value.toString(), note: g.note ?? '' })) }} className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0">
                      <Pencil size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(g.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Grade Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Нова оцінка</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Студент</Label>
              <Select value={gradeForm.student_id} onValueChange={(v) => setGradeForm((f) => ({ ...f, student_id: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть студента..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {enrolledStudents?.map((ss) => ss.student && <SelectItem key={ss.student.id} value={ss.student.id} className="text-white">{ss.student.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Тип оцінки</Label>
                <Select value={gradeForm.grade_type} onValueChange={(v) => setGradeForm((f) => ({ ...f, grade_type: v as GradeType }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {GRADE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-white">{GRADE_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Оцінка (0–100)</Label>
                <Input type="number" min={0} max={100} value={gradeForm.value} onChange={(e) => setGradeForm((f) => ({ ...f, value: e.target.value }))} placeholder="85" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Дата</Label>
              <Input type="date" value={gradeForm.date} onChange={(e) => setGradeForm((f) => ({ ...f, date: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Нотатка (необов'язково)</Label>
              <Textarea value={gradeForm.note} onChange={(e) => setGradeForm((f) => ({ ...f, note: e.target.value }))} placeholder="Додаткова інформація..." className="bg-slate-700 border-slate-600 text-white resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Виставити'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Grade Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Редагувати оцінку</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Оцінка (0–100)</Label>
              <Input type="number" min={0} max={100} value={gradeForm.value} onChange={(e) => setGradeForm((f) => ({ ...f, value: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Нотатка</Label>
              <Textarea value={gradeForm.note} onChange={(e) => setGradeForm((f) => ({ ...f, note: e.target.value }))} className="bg-slate-700 border-slate-600 text-white resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Зберегти'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
