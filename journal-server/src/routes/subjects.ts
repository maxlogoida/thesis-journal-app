import { Router, Response } from 'express'
import { Subject } from '../models/Subject'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const populate = (q: any) =>
  q.populate('teacher_id', 'full_name email role created_at')

const fmt = (s: any) => ({
  id: s._id,
  name: s.name,
  teacher_id: s.teacher_id?._id ?? s.teacher_id,
  teacher: s.teacher_id?._id ? { id: s.teacher_id._id, full_name: s.teacher_id.full_name, email: s.teacher_id.email, role: s.teacher_id.role, created_at: s.teacher_id.created_at } : undefined,
  created_at: s.created_at,
})

// GET /api/subjects
router.get('/', async (_req, res: Response) => {
  const subjects = await populate(Subject.find().sort({ name: 1 }))
  res.json(subjects.map(fmt))
})

// GET /api/subjects/teacher/:teacherId
router.get('/teacher/:teacherId', async (req, res: Response) => {
  const subjects = await populate(Subject.find({ teacher_id: req.params.teacherId }).sort({ name: 1 }))
  res.json(subjects.map(fmt))
})

// POST /api/subjects
router.post('/', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, teacher_id } = req.body
    const s = await Subject.create({ name, teacher_id })
    const populated = await populate(Subject.findById(s._id))
    res.status(201).json(fmt(populated))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// PATCH /api/subjects/:id
router.patch('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, teacher_id } = req.body
    const s = await populate(Subject.findByIdAndUpdate(req.params.id, { name, teacher_id }, { new: true }))
    if (!s) { res.status(404).json({ error: 'Not found' }); return }
    res.json(fmt(s))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// DELETE /api/subjects/:id
router.delete('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    await Subject.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
