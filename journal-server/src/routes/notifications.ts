import { Router, Response } from 'express'
import { Notification } from '../models/Notification'
import { StudentSubject } from '../models/StudentSubject'
import { User } from '../models/User'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import nodemailer from 'nodemailer'

const router = Router()
router.use(authenticate)

const fmt = (n: any) => ({
  id: n._id,
  subject_id: n.subject_id?._id ?? n.subject_id,
  teacher_id: n.teacher_id,
  message: n.message,
  recipient_count: n.recipient_count,
  sent_at: n.sent_at,
  subject: n.subject_id?._id ? { id: n.subject_id._id, name: n.subject_id.name } : undefined,
})

// GET /api/notifications/teacher/:teacherId
router.get('/teacher/:teacherId', async (req, res: Response) => {
  const list = await Notification.find({ teacher_id: req.params.teacherId })
    .populate('subject_id', 'name')
    .sort({ sent_at: -1 })
  res.json(list.map(fmt))
})

// POST /api/notifications/send
router.post('/send', requireRole('teacher', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { subject_id, teacher_id, message } = req.body

    // Get enrolled students
    const enrollments = await StudentSubject.find({ subject_id }).populate('student_id', 'email full_name')
    const students = enrollments.map((e: any) => e.student_id).filter(Boolean)

    // Send emails (fire and forget — just log errors)
    if (students.length > 0 && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      const emails = students.map((s: any) => s.email).filter(Boolean).join(',')
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'journal@school.edu',
        to: emails,
        subject: 'Повідомлення від викладача',
        text: message,
      }).catch(console.error)
    }

    const notification = await Notification.create({ subject_id, teacher_id, message, recipient_count: students.length })
    const populated = await Notification.findById(notification._id).populate('subject_id', 'name')
    res.status(201).json(fmt(populated))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
