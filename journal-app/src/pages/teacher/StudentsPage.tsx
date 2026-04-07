import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProfile } from '@/features/auth/authSlice'
import {
  useGetSubjectsByTeacherQuery,
  useGetStudentsBySubjectQuery,
  useGetStudentsQuery,
  useGetGroupsQuery,
  useAddStudentToSubjectMutation,
  useRemoveStudentFromSubjectMutation,
  useCreateProfileMutation,
} from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, UserMinus, Search, GraduationCap } from 'lucide-react'

export function StudentsPage() {
  const profile = useSelector(selectProfile)
  const { data: subjects } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: !profile })
  const { data: groups } = useGetGroupsQuery()
  const [createProfile] = useCreateProfileMutation()
  const [addStudent] = useAddStudentToSubjectMutation()
  const [removeStudent] = useRemoveStudentFromSubjectMutation()
  const { toast } = useToast()

  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newForm, setNewForm] = useState({ full_name: '', email: '', password: '', group_id: '' })
  const [addForm, setAddForm] = useState({ student_id: '', group_id: '' })

  const { data: enrolledStudents, isLoading } = useGetStudentsBySubjectQuery(selectedSubject, { skip: !selectedSubject })
  const { data: allStudents } = useGetStudentsQuery()

  const filtered = enrolledStudents?.filter((ss) =>
    ss.student?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    ss.student?.email.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const enrolledIds = new Set(enrolledStudents?.map((ss) => ss.student_id) ?? [])
  const availableStudents = allStudents?.filter((s) => !enrolledIds.has(s.id)) ?? []

  const handleCreateStudent = async () => {
    if (!newForm.full_name || !newForm.email || !newForm.password || !selectedSubject || !newForm.group_id) return
    setSubmitting(true)
    try {
      const created = await createProfile({ full_name: newForm.full_name, email: newForm.email, password: newForm.password, role: 'student' }).unwrap()
      await addStudent({ student_id: created.id, subject_id: selectedSubject, group_id: newForm.group_id }).unwrap()
      toast({ title: 'Студента додано', description: newForm.full_name })
      setIsCreateOpen(false)
      setNewForm({ full_name: '', email: '', password: '', group_id: '' })
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as { data?: { error?: string } }).data?.error ?? (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddExisting = async () => {
    if (!addForm.student_id || !selectedSubject || !addForm.group_id) return
    setSubmitting(true)
    try {
      await addStudent({ student_id: addForm.student_id, subject_id: selectedSubject, group_id: addForm.group_id }).unwrap()
      toast({ title: 'Студента додано до предмету' })
      setIsAddOpen(false)
      setAddForm({ student_id: '', group_id: '' })
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as { data?: { error?: string } }).data?.error ?? (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeStudent(id).unwrap()
      toast({ title: 'Студента відраховано', description: name })
    } catch {
      toast({ title: 'Помилка', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Студенти</h1>
          <p className="text-slate-400 text-sm mt-1">Управління студентами за предметом</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddOpen(true)} disabled={!selectedSubject} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Plus size={16} className="mr-2" /> Додати існуючого
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedSubject} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" /> Новий студент
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-slate-400 text-xs mb-2 block">Предмет</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Оберіть предмет..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white hover:bg-slate-700">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-slate-400 text-xs mb-2 block">Пошук</Label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ім'я або email..." className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedSubject ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400">Оберіть предмет для перегляду студентів</p>
        </div>
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <GraduationCap size={16} className="text-blue-400" />
              {filtered.length} студент{filtered.length === 1 ? '' : 'і/ів'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50">
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 bg-slate-700" />
                    <Skeleton className="h-3 w-32 bg-slate-700" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <p className="text-slate-500 text-sm px-6 py-8 text-center">Студентів не знайдено</p>
            ) : (
              filtered.map((ss) => {
                const name = ss.student?.full_name ?? ''
                const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                return (
                  <div key={ss.id} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-emerald-700 text-white text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{name}</p>
                      <p className="text-slate-400 text-sm">{ss.student?.email}</p>
                    </div>
                    <Badge className="bg-slate-700 text-slate-300 text-xs shrink-0">{ss.group?.name}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(ss.id, name)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 shrink-0">
                      <UserMinus size={14} />
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Новий студент</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Повне ім'я</Label>
              <Input value={newForm.full_name} onChange={(e) => setNewForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Петренко Петро Петрович" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="student@school.edu" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Пароль</Label>
              <Input type="password" value={newForm.password} onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))} placeholder="Мінімум 6 символів" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Група</Label>
              <Select value={newForm.group_id} onValueChange={(v) => setNewForm((f) => ({ ...f, group_id: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть групу..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {groups?.map((g) => <SelectItem key={g.id} value={g.id} className="text-white">{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleCreateStudent} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Додати'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Додати існуючого студента</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Студент</Label>
              <Select value={addForm.student_id} onValueChange={(v) => setAddForm((f) => ({ ...f, student_id: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть студента..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableStudents.map((s) => <SelectItem key={s.id} value={s.id} className="text-white">{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Група</Label>
              <Select value={addForm.group_id} onValueChange={(v) => setAddForm((f) => ({ ...f, group_id: v }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть групу..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {groups?.map((g) => <SelectItem key={g.id} value={g.id} className="text-white">{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleAddExisting} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Додавання...' : 'Додати'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
