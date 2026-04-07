import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loadSession } from '@/features/auth/authSlice'
import type { AppDispatch } from '@/app/store'
import { LoginPage } from '@/features/auth/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { TeachersPage } from '@/pages/admin/TeachersPage'
import { StudentsPage } from '@/pages/teacher/StudentsPage'
import { SubjectsPage } from '@/pages/SubjectsPage'
import { GradesPage } from '@/pages/GradesPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { NotificationsPage } from '@/pages/NotificationsPage'

export default function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(loadSession())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="teachers"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="subjects"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'teacher']}>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="grades"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                <GradesPage />
              </ProtectedRoute>
            }
          />
          <Route path="schedule" element={<SchedulePage />} />
          <Route
            path="notifications"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
