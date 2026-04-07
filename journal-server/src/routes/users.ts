import { Router, Response } from 'express'
import { User } from '../models/User'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const fmt = (u: InstanceType<typeof User>) => ({ id: u._id, full_name: u.full_name, email: u.email, role: u.role, created_at: u.created_at })

// GET /api/users/teachers
router.get('/teachers', async (_req, res: Response) => {
  const users = await User.find({ role: 'teacher' }).sort({ full_name: 1 })
  res.json(users.map(fmt))
})

// GET /api/users/students
router.get('/students', async (_req, res: Response) => {
  const users = await User.find({ role: 'student' }).sort({ full_name: 1 })
  res.json(users.map(fmt))
})

// POST /api/users — create teacher or student (admin only)
router.post('/', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, email, password, role } = req.body
    if (!full_name || !email || !password || !role) { res.status(400).json({ error: 'Missing fields' }); return }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) { res.status(400).json({ error: 'Користувач з таким email вже існує' }); return }
    const user = await User.create({ full_name, email, password, role })
    res.status(201).json(fmt(user))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// PATCH /api/users/:id
router.patch('/:id', requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, email } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { full_name, email }, { new: true })
    if (!user) { res.status(404).json({ error: 'Not found' }); return }
    res.json(fmt(user))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// DELETE /api/users/:id
router.delete('/:id', requireRole('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
