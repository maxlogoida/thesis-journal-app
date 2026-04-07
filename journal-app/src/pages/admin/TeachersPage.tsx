import { useState } from 'react'
import { useGetTeachersQuery, useCreateProfileMutation, useUpdateProfileMutation, useDeleteProfileMutation } from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import type { Profile } from '@/types/database'

export function TeachersPage() {
  const { data: teachers, isLoading } = useGetTeachersQuery()
  const [createProfile] = useCreateProfileMutation()
  const [updateProfile] = useUpdateProfileMutation()
  const [deleteProfile] = useDeleteProfileMutation()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = teachers?.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const resetForm = () => setForm({ full_name: '', email: '', password: '' })

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) return
    setSubmitting(true)
    try {
      await createProfile({ full_name: form.full_name, email: form.email, password: form.password, role: 'teacher' }).unwrap()
      toast({ title: 'Викладача додано', description: form.full_name })
      setIsCreateOpen(false)
      resetForm()
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as { data?: { error?: string } }).data?.error ?? (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    setSubmitting(true)
    try {
      await updateProfile({ id: editTarget.id, full_name: form.full_name, email: form.email }).unwrap()
      toast({ title: 'Дані оновлено' })
      setEditTarget(null)
      resetForm()
    } catch (e: unknown) {
      toast({ title: 'Помилка', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProfile(deleteTarget.id).unwrap()
      toast({ title: 'Викладача видалено' })
      setDeleteTarget(null)
    } catch {
      toast({ title: 'Помилка видалення', variant: 'destructive' })
    }
  }

  const openEdit = (teacher: Profile) => {
    setEditTarget(teacher)
    setForm({ full_name: teacher.full_name, email: teacher.email, password: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Викладачі</h1>
          <p className="text-slate-400 text-sm mt-1">Управління викладацьким складом</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Додати викладача
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Пошук за ім'ям або email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            {filtered.length} викладач{filtered.length === 1 ? '' : 'і/ів'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50">
                <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 bg-slate-700" />
                  <Skeleton className="h-3 w-56 bg-slate-700" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm px-6 py-8 text-center">Викладачів не знайдено</p>
          ) : (
            filtered.map((teacher) => {
              const initials = teacher.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
              return (
                <div key={teacher.id} className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-blue-700 text-white text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{teacher.full_name}</p>
                    <p className="text-slate-400 text-sm">{teacher.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(teacher)} className="text-slate-400 hover:text-white hover:bg-slate-700">
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(teacher)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Новий викладач</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Повне ім'я</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Іваненко Іван Іванович" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="teacher@school.edu" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Пароль</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Мінімум 6 символів" className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Додати'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Редагування викладача</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Повне ім'я</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="text-slate-300">Скасувати</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">{submitting ? 'Збереження...' : 'Зберегти'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Видалити викладача?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {deleteTarget?.full_name} буде видалено. Дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
