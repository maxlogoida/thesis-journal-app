import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export type Role = 'super_admin' | 'teacher' | 'student'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  full_name: string
  email: string
  password: string
  role: Role
  created_at: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'teacher', 'student'], required: true },
  created_at: { type: Date, default: Date.now },
})

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password)
}

export const User = mongoose.model<IUser>('User', UserSchema)
