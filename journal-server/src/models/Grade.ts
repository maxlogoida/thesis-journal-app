import mongoose, { Schema, Document } from 'mongoose'

export type GradeType = 'class' | 'control' | 'monthly' | 'semester' | 'annual'

export interface IGrade extends Document {
  _id: mongoose.Types.ObjectId
  student_id: mongoose.Types.ObjectId
  subject_id: mongoose.Types.ObjectId
  teacher_id: mongoose.Types.ObjectId
  schedule_id: mongoose.Types.ObjectId | null
  grade_type: GradeType
  value: number
  date: string
  note?: string
  created_at: Date
}

const GradeSchema = new Schema<IGrade>({
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schedule_id: { type: Schema.Types.ObjectId, ref: 'ScheduleEvent', default: null },
  grade_type: { type: String, enum: ['class', 'control', 'monthly', 'semester', 'annual'], required: true },
  value: { type: Number, required: true, min: 0, max: 100 },
  date: { type: String, required: true },
  note: { type: String },
  created_at: { type: Date, default: Date.now },
})

export const Grade = mongoose.model<IGrade>('Grade', GradeSchema)
