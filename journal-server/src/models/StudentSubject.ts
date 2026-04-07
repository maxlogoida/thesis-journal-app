import mongoose, { Schema, Document } from 'mongoose'

export interface IStudentSubject extends Document {
  _id: mongoose.Types.ObjectId
  student_id: mongoose.Types.ObjectId
  subject_id: mongoose.Types.ObjectId
  group_id: mongoose.Types.ObjectId
}

const StudentSubjectSchema = new Schema<IStudentSubject>({
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  group_id: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
})

StudentSubjectSchema.index({ student_id: 1, subject_id: 1 }, { unique: true })

export const StudentSubject = mongoose.model<IStudentSubject>('StudentSubject', StudentSubjectSchema)
