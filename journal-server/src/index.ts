import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { User } from './models/User'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import subjectRoutes from './routes/subjects'
import groupRoutes from './routes/groups'
import studentSubjectRoutes from './routes/studentSubjects'
import scheduleRoutes from './routes/schedule'
import gradeRoutes from './routes/grades'
import notificationRoutes from './routes/notifications'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/subjects', subjectRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/student-subjects', studentSubjectRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/notifications', notificationRoutes)

async function start() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log('MongoDB connected')

  // Seed super_admin if not exists
  const exists = await User.findOne({ role: 'super_admin' })
  if (!exists) {
    await User.create({ full_name: 'Адміністратор', email: 'admin@school.edu', password: 'admin123', role: 'super_admin' })
    console.log('Super admin created: admin@school.edu / admin123')
  }

  const PORT = process.env.PORT ?? 4000
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch(console.error)
