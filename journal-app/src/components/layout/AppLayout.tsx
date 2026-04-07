import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
