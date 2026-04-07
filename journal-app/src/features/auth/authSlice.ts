import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { API_URL, setToken, removeToken, getToken } from '@/lib/api'
import type { Profile, Role } from '@/types/database'

interface AuthState {
  profile: Profile | null
  initialized: boolean
  error: string | null
}

const initialState: AuthState = {
  profile: null,
  initialized: false,
  error: null,
}

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return rejectWithValue(data.error ?? 'Помилка входу')
    setToken(data.token)
    return data.user as Profile
  }
)

export const loadSession = createAsyncThunk(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    const token = getToken()
    if (!token) return null
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { removeToken(); return null }
    const user = await res.json()
    return user as Profile
  }
)

export const signOut = createAsyncThunk('auth/signOut', async () => {
  removeToken()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload
      state.initialized = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.fulfilled, (state, action) => {
        state.profile = action.payload
        state.initialized = true
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.error = action.payload as string
        state.initialized = true
      })
      .addCase(signOut.fulfilled, (state) => {
        state.profile = null
        state.initialized = true
      })
      .addCase(loadSession.pending, (state) => {
        state.initialized = false
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.profile = action.payload
        state.initialized = true
      })
      .addCase(loadSession.rejected, (state) => {
        state.initialized = true
      })
  },
})

export const { clearError, setProfile } = authSlice.actions
export default authSlice.reducer

export const selectProfile = (state: { auth: AuthState }) => state.auth.profile
export const selectRole = (state: { auth: AuthState }): Role | null => state.auth.profile?.role ?? null
export const selectAuthLoading = (state: { auth: AuthState }) => !state.auth.initialized
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
