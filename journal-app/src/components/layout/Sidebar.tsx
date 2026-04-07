import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { signOut, selectProfile } from '@/features/auth/authSlice'
import type { AppDispatch } from '@/app/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  BarChart3,
  Mail,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import type { Role } from '@/types/database'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: Role[]
}

const navItems: NavItem[] = [
  { label: 'Дашборд', to: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['super_admin', 'teacher', 'student'] },
  { label: 'Викладачі', to: '/teachers', icon: <Users size={18} />, roles: ['super_admin'] },
  { label: 'Студенти', to: '/students', icon: <GraduationCap size={18} />, roles: ['super_admin', 'teacher'] },
  { label: 'Предмети', to: '/subjects', icon: <BookOpen size={18} />, roles: ['super_admin', 'teacher'] },
  { label: 'Журнал оцінок', to: '/grades', icon: <BarChart3 size={18} />, roles: ['teacher', 'student'] },
  { label: 'Розклад', to: '/schedule', icon: <Calendar size={18} />, roles: ['super_admin', 'teacher', 'student'] },
  { label: 'Розсилка', to: '/notifications', icon: <Mail size={18} />, roles: ['teacher'] },
]

const roleLabel: Record<Role, string> = {
  super_admin: 'Адміністратор',
  teacher: 'Викладач',
  student: 'Студент',
}

export function Sidebar() {
  const dispatch = useDispatch<AppDispatch>()
  const profile = useSelector(selectProfile)
  const role = profile?.role

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))

  const initials = profile?.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-700/60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
          <BookOpen size={18} className="text-white" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-white font-semibold text-sm truncate">Журнал обліку</p>
          <p className="text-slate-400 text-xs">педнавантаження</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <ChevronRight size={14} className="shrink-0 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 space-y-2">
        <Separator className="bg-slate-700/60 mb-3" />
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-slate-400 text-xs">{role ? roleLabel[role] : ''}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(signOut())}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={16} />
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  )
}
