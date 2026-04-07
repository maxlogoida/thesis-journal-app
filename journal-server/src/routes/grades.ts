import { Router, Response } from 'express'
import { Grade } from '../models/Grade'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const fmt = (g: any) => ({
  id: g._id,
  student_id: g.student_id?._id ?? g.student_id,
  subject_id: g.subject_id?._id ?? g.subject_id,
  teacher_id: g.teacher_id,
  schedule_id: g.schedule_id,
  grade_type: g.grade_type,
  value: g.value,
  date: g.date,
  note: g.note,
  created_at: g.created_at,
  student: g.student_id?._id ? { id: g.student_id._id, full_name: g.student_id.full_name, email: g.student_id.email, role: g.student_id.role, created_at: g.student_id.created_at } : undefined,
  subject: g.subject_id?._id ? { id: g.subject_id._id, name: g.subject_id.name, teacher_id: g.subject_id.teacher_id, created_at: g.subject_id.created_at } : undefined,
})

// GET /api/grades/subject/:subjectId
router.get('/subject/:subjectId', async (req, res: Response) => {
  const grades = await Grade.find({ subject_id: req.params.subjectId })
    .populate('student_id', 'full_name email role created_at')
    .sort({ date: -1 })
  res.json(grades.map(fmt))
})

// GET /api/grades/student/:studentId
router.get('/student/:studentId', async (req, res: Response) => {
  const grades = await Grade.find({ student_id: req.params.studentId })
    .populate('subject_id', 'name teacher_id created_at')
    .sort({ date: -1 })
  res.json(grades.map(fmt))
})

// POST /api/grades
router.post('/', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const g = await Grade.create(req.body)
    const populated = await Grade.findById(g._id).populate('student_id', 'full_name email role created_at')
    res.status(201).json(fmt(populated))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// PATCH /api/grades/:id
router.patch('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const g = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('student_id', 'full_name email role created_at')
    if (!g) { res.status(404).json({ error: 'Not found' }); return }
    res.json(fmt(g))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// DELETE /api/grades/:id
router.delete('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    await Grade.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
