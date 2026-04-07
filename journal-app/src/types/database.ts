export type Role = 'super_admin' | 'teacher' | 'student'
export type GradeType = 'class' | 'control' | 'monthly' | 'semester' | 'annual'
export type LessonType = 'lecture' | 'lab' | 'seminar' | 'control' | 'practice'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  created_at: string
}

export interface Subject {
  id: string
  name: string
  teacher_id: string
  teacher?: Profile
  created_at: string
}

export interface Group {
  id: string
  name: string
  created_at: string
}

export interface StudentSubject {
  id: string
  student_id: string
  subject_id: string
  group_id: string
  student?: Profile
  subject?: Subject
  group?: Group
}

export interface ScheduleEvent {
  id: string
  subject_id: string
  teacher_id: string
  type: LessonType
  room: string
  date: string
  start_time: string
  end_time: string
  title: string
  subject?: Subject
  teacher?: Profile
  created_at: string
}

export interface Grade {
  id: string
  student_id: string
  subject_id: string
  schedule_id: string | null
  grade_type: GradeType
  value: number
  date: string
  teacher_id: string
  note?: string
  student?: Profile
  subject?: Subject
  created_at: string
}

export interface Notification {
  id: string
  subject_id: string
  teacher_id: string
  message: string
  sent_at: string
  recipient_count: number
  subject?: Subject
}

// Supabase Database type for RTK Query
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      subjects: { Row: Subject; Insert: Omit<Subject, 'created_at' | 'teacher'>; Update: Partial<Subject> }
      groups: { Row: Group; Insert: Omit<Group, 'created_at'>; Update: Partial<Group> }
      student_subjects: { Row: StudentSubject; Insert: Omit<StudentSubject, 'id' | 'student' | 'subject' | 'group'>; Update: Partial<StudentSubject> }
      schedule_events: { Row: ScheduleEvent; Insert: Omit<ScheduleEvent, 'created_at' | 'subject' | 'teacher'>; Update: Partial<ScheduleEvent> }
      grades: { Row: Grade; Insert: Omit<Grade, 'id' | 'created_at' | 'student' | 'subject'>; Update: Partial<Grade> }
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'sent_at' | 'subject'>; Update: Partial<Notification> }
    }
  }
}
