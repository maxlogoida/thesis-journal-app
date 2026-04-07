import { Router, Response } from 'express'
import { Group } from '../models/Group'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const fmt = (g: any) => ({ id: g._id, name: g.name, created_at: g.created_at })

// GET /api/groups
router.get('/', async (_req, res: Response) => {
  const groups = await Group.find().sort({ name: 1 })
  res.json(groups.map(fmt))
})

// POST /api/groups
router.post('/', requireRole('super_admin', 'teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const g = await Group.create({ name: req.body.name })
    res.status(201).json(fmt(g))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router
