import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  subject_id: mongoose.Types.ObjectId
  teacher_id: mongoose.Types.ObjectId
  message: string
  recipient_count: number
  sent_at: Date
}

const NotificationSchema = new Schema<INotification>({
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  recipient_count: { type: Number, default: 0 },
  sent_at: { type: Date, default: Date.now },
})

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
