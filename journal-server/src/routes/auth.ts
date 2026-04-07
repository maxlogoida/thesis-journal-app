import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Невірний email або пароль' })
      return
    }
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.json({
      token,
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at },
    })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) { res.status(404).json({ error: 'Not found' }); return }
    res.json({ id: user._id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
