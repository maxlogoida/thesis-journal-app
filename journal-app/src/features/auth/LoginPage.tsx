import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { signIn, clearError, selectAuthError, selectProfile } from './authSlice'
import type { AppDispatch } from '@/app/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Loader2 } from 'lucide-react'

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const error = useSelector(selectAuthError)
  const profile = useSelector(selectProfile)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile) navigate('/dashboard', { replace: true })
  }, [profile, navigate])

  const handleClick = async () => {
    if (!email || !password) return
    setSubmitting(true)
    dispatch(clearError())
    await dispatch(signIn({ email, password }))
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Електронний журнал</h1>
            <p className="text-slate-400 text-sm mt-1">Облік педагогічного навантаження</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-white text-lg">Вхід до системи</CardTitle>
            <CardDescription className="text-slate-400">Введіть ваш email та пароль</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={handleClick}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Вхід...</>
                ) : 'Увійти'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-xs">
          Система обліку педагогічного навантаження © 2025
        </p>
      </div>
    </div>
  )
}
