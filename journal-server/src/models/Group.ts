import mongoose, { Schema, Document } from 'mongoose'

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  created_at: Date
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
})

export const Group = mongoose.model<IGroup>('Group', GroupSchema)
