import mongoose, { Schema, Document } from 'mongoose'

export type LessonType = 'lecture' | 'lab' | 'seminar' | 'control' | 'practice'

export interface IScheduleEvent extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  subject_id: mongoose.Types.ObjectId
  teacher_id: mongoose.Types.ObjectId
  type: LessonType
  room: string
  date: string
  start_time: string
  end_time: string
  created_at: Date
}

const ScheduleEventSchema = new Schema<IScheduleEvent>({
  title: { type: String, required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['lecture', 'lab', 'seminar', 'control', 'practice'], required: true },
  room: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
})

export const ScheduleEvent = mongoose.model<IScheduleEvent>('ScheduleEvent', ScheduleEventSchema)
