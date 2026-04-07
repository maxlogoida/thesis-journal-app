import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProfile, selectRole } from '@/features/auth/authSlice'
import {
  useGetSubjectsQuery,
  useGetSubjectsByTeacherQuery,
  useGetTeachersQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react'
import type { Subject } from '@/types/database'

export function SubjectsPage() {
  const profile = useSelector(selectProfile)
  const role = useSelector(selectRole)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Subject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [form, setForm] = useState({ name: '', teacher_id: '' })
  const [submitting, setSubmitting] = useState(false)

  const { data: allSubjects, isLoading } = useGetSubjectsQuery(undefined, { skip: role !== 'super_admin' })
  const { data: teacherSubjects, isLoading: loadingT } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: role !== 'teacher' })
  const { data: teachers } = useGetTeachersQuery(undefined, { skip: role !== 'super_admin' })

  const [createSubject] = useCreateSubjectMutation()
  const [updateSubject] = useUpdateSubjectMutation()
  const [deleteSubject] = useDeleteSubjectMutation()

  const subjects = role === 'super_admin' ? allSubjects : teacherSubjects
  const isLoadingSubj = role === 'super_admin' ? isLoading : loadingT

  const filtered = subjects?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.teacher?.full_name.toLowerCase().includes(search.toLowerCase() ?? '')
  ) ?? []

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createSubject({
        name: form.name,
        teacher_id: role === 'teacher' ? profile!.id : form.teacher_id,
      }).unwrap()
      toast({ title: 'Предмет створено', description: form.name })
      setIsCreateOpen(false)
      setForm({ name: '', teacher_id: '' })
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget || !form.name.trim()) return
    setSubmitting(true)
    try {
      await updateSubject({ id: editTarget.id, name: form.name, teacher_id: form.teacher_id || editTarget.teacher_id }).unwrap()
      toast({ title: 'Предмет оновлено' })
      setEditTarget(null)
      setForm({ name: '', teacher_id: '' })
    } catch {
      toast({ title: 'Помилка', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSubject(deleteTarget.id).unwrap()
      toast({ title: 'Предмет видалено' })
      setDeleteTarget(null)
    } catch {
      toast({ title: 'Помилка видалення', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Предмети</h1>
          <p className="text-slate-400 text-sm mt-1">Управління навчальними предметами</p>
        </div>
        <Button onClick={() => { setForm({ name: '', teacher_id: '' }); setIsCreateOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Новий предмет
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук предмету..." className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BookOpen size={16} className="text-blue-400" />
            {filtered.length} предмет{filtered.length === 1 ? '' : 'и/ів'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingSubj ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50">
                <Skeleton className="w-10 h-10 rounded-lg bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-slate-700" />
                  <Skeleton className="h-3 w-32 bg-slate-700" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm px-6 py-8 text-center">Предметів не знайдено</p>
          ) : (
            filtered.map((subject) => (
              <div key={subject.id} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 shrink-0">
                  <BookOpen size={18} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{subject.name}</p>
                  {role === 'super_admin' && (
                    <p className="text-slate-400 text-sm">{subject.teacher?.full_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEditTarget(subject); setForm({ name: subject.name, teacher_id: subject.teacher_id }) }} className="text-slate-400 hover:text-white hover:bg-slate-700">
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(subject)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Новий предмет</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Назва предмету</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Вища математика" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            {role === 'super_admin' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Викладач</Label>
                <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть викладача..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {teachers?.map((t) => <SelectItem key={t.id} value={t.id} className="text-white">{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Створити'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Редагувати предмет</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Назва предмету</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            {role === 'super_admin' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Викладач</Label>
                <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Оберіть викладача..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {teachers?.map((t) => <SelectItem key={t.id} value={t.id} className="text-white">{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Зберегти'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Видалити предмет?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">«{deleteTarget?.name}» буде видалено разом з оцінками. Дію не можна скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
