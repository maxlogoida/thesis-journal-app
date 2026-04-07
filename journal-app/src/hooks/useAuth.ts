import { useSelector } from 'react-redux'
import { selectProfile, selectRole, selectAuthLoading } from '@/features/auth/authSlice'

export function useAuth() {
  const profile = useSelector(selectProfile)
  const role = useSelector(selectRole)
  const loading = useSelector(selectAuthLoading)
  return { profile, role, loading, isAuthenticated: !!profile }
}
