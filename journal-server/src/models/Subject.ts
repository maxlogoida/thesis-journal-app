import mongoose, { Schema, Document } from 'mongoose'

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  teacher_id: mongoose.Types.ObjectId
  created_at: Date
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
})

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema)
