import { Router, Response } from 'express'
import { ScheduleEvent } from '../models/ScheduleEvent'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const fmt = (e: any) => ({
  id: e._id,
  title: e.title,
  subject_id: e.subject_id?._id ?? e.subject_id,
  teacher_id: e.teacher_id?._id ?? e.teacher_id,
  type: e.type,
  room: e.room,
  date: e.date,
  start_time: e.start_time,
  end_time: e.end_time,
  created_at: e.created_at,
  subject: e.subject_id?._id ? { id: e.subject_id._id, name: e.subject_id.name, teacher_id: e.subject_id.teacher_id, created_at: e.subject_id.created_at } : undefined,
  teacher: e.teacher_id?._id ? { id: e.teacher_id._id, full_name: e.teacher_id.full_name, email: e.teacher_id.email, role: e.teacher_id.role } : undefined,
})

const populate = (q: any) => q
  .populate('subject_id', 'name teacher_id created_at')
  .populate('teacher_id', 'full_name email role')

// GET /api/schedule?from=&to=
router.get('/', async (req, res: Response) => {
  const filter: any = {}
  if (req.query.from) filter.date = { $gte: req.query.from }
  if (req.query.to) filter.date = { ...filter.date, $lte: req.query.to }
  const events = await populate(ScheduleEvent.find(filter).sort({ date: 1, start_time: 1 }))
  res.json(events.map(fmt))
})

// GET /api/schedule/teacher/:teacherId?from=&to=
router.get('/teacher/:teacherId', async (req, res: Response) => {
  const filter: any = { teacher_id: req.params.teacherId }
  if (req.query.from) filter.date = { $gte: req.query.from }
  if (req.query.to) filter.date = { ...filter.date, $lte: req.query.to }
  const events = await populate(ScheduleEvent.find(filter).sort({ date: 1, start_time: 1 }))
  res.json(events.map(fmt))
})

// POST /api/schedule
router.post('/', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, subject_id, teacher_id, type, room, date, start_time, end_time } = req.body

    // Conflict check: same teacher same day overlapping time
    const teacherConflict = await ScheduleEvent.findOne({
      teacher_id, date,
      $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
    })
    if (teacherConflict) { res.status(409).json({ error: 'Конфлікт: викладач вже має заняття в цей час' }); return }

    // Room conflict
    const roomConflict = await ScheduleEvent.findOne({
      room, date,
      $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
    })
    if (roomConflict) { res.status(409).json({ error: 'Конфлікт: аудиторія вже зайнята в цей час' }); return }

    const e = await ScheduleEvent.create({ title, subject_id, teacher_id, type, room, date, start_time, end_time })
    const populated = await populate(ScheduleEvent.findById(e._id))
    res.status(201).json(fmt(populated))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PATCH /api/schedule/:id
router.patch('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const e = await populate(ScheduleEvent.findByIdAndUpdate(req.params.id, req.body, { new: true }))
    if (!e) { res.status(404).json({ error: 'Not found' }); return }
    res.json(fmt(e))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// DELETE /api/schedule/:id
router.delete('/:id', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    await ScheduleEvent.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
