import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProfile } from '@/features/auth/authSlice'
import {
  useGetSubjectsByTeacherQuery,
  useGetStudentsBySubjectQuery,
  useGetNotificationsQuery,
  useSendNotificationMutation,
} from '@/app/apiSlice'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Send, Mail, Users, CheckCircle2 } from 'lucide-react'

export function NotificationsPage() {
  const profile = useSelector(selectProfile)
  const { toast } = useToast()

  const [selectedSubject, setSelectedSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const { data: subjects } = useGetSubjectsByTeacherQuery(profile?.id ?? '', { skip: !profile?.id })
  const { data: students } = useGetStudentsBySubjectQuery(selectedSubject, { skip: !selectedSubject })
  const { data: history, isLoading: loadingHistory } = useGetNotificationsQuery(profile?.id ?? '', { skip: !profile?.id })
  const [sendNotification] = useSendNotificationMutation()

  const handleSend = async () => {
    if (!selectedSubject || !message.trim()) return
    setSending(true)
    setSent(false)
    try {
      await sendNotification({
        subject_id: selectedSubject,
        teacher_id: profile?.id ?? '',
        message,
      }).unwrap()
      toast({ title: 'Розсилку надіслано!', description: `${students?.length ?? 0} студентів отримали повідомлення.` })
      setSent(true)
      setMessage('')
    } catch (e: unknown) {
      toast({ title: 'Помилка розсилки', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const charCount = message.length
  const isReady = selectedSubject && message.trim().length >= 10

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Email-розсилка</h1>
        <p className="text-slate-400 text-sm mt-1">Надсилання повідомлень студентам предмету</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Mail size={16} className="text-blue-400" />
                Нове повідомлення
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Предмет (отримувачі)</Label>
                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSent(false) }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Оберіть предмет..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {subjects?.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSubject && students && (
                  <div className="flex items-center gap-2 mt-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-slate-400 text-sm">
                      {students.length} студент{students.length === 1 ? '' : 'і/ів'} отримають повідомлення
                    </span>
                    <div className="flex flex-wrap gap-1 ml-1">
                      {students.slice(0, 3).map((ss) => (
                        <Badge key={ss.id} className="bg-slate-700 text-slate-300 text-xs">{ss.student?.full_name.split(' ')[0]}</Badge>
                      ))}
                      {students.length > 3 && <Badge className="bg-slate-700 text-slate-300 text-xs">+{students.length - 3}</Badge>}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Текст повідомлення</Label>
                  <span className="text-slate-500 text-xs">{charCount} / 1000</span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => { if (e.target.value.length <= 1000) setMessage(e.target.value) }}
                  placeholder="Шановні студенти! Нагадую, що наступне заняття..."
                  rows={6}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
                <p className="text-slate-500 text-xs">Мінімум 10 символів</p>
              </div>

              {sent && (
                <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <p className="text-emerald-300 text-sm">Повідомлення успішно надіслано!</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSend}
                  disabled={!isReady || sending}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Надсилання...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={16} />
                      Надіслати
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Історія розсилок</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 border-b border-slate-700/50">
                    <Skeleton className="h-3 w-32 bg-slate-700 mb-2" />
                    <Skeleton className="h-4 w-full bg-slate-700" />
                  </div>
                ))
              ) : !history?.length ? (
                <p className="text-slate-500 text-sm px-5 py-6 text-center">Розсилок ще не було</p>
              ) : (
                history.map((n) => (
                  <div key={n.id} className="px-5 py-4 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-400 text-xs">{format(parseISO(n.sent_at), 'd MMM, HH:mm', { locale: uk })}</p>
                      <Badge className="bg-slate-700 text-slate-300 text-xs">{n.recipient_count} студ.</Badge>
                    </div>
                    <p className="text-white text-sm truncate">{n.subject?.name}</p>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
