import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from './models/User'
import { Subject } from './models/Subject'
import { Group } from './models/Group'
import { StudentSubject } from './models/StudentSubject'
import { ScheduleEvent } from './models/ScheduleEvent'
import { Grade } from './models/Grade'
import { format, addDays, startOfWeek } from 'date-fns'

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log('Connected to MongoDB')

  // Clear existing data (except super_admin)
  await User.deleteMany({ role: { $ne: 'super_admin' } })
  await Subject.deleteMany({})
  await Group.deleteMany({})
  await StudentSubject.deleteMany({})
  await ScheduleEvent.deleteMany({})
  await Grade.deleteMany({})

  // Groups
  const groups = await Group.insertMany([
    { name: 'КН-21' },
    { name: 'КН-22' },
    { name: 'ІПЗ-31' },
  ])
  const [g1, g2, g3] = groups
  console.log('Groups created:', groups.length)

  // Teachers
  const teachers = await User.create([
    { full_name: 'Іваненко Іван Іванович', email: 'ivanov@school.edu', password: 'teacher123', role: 'teacher' },
    { full_name: 'Петренко Олена Василівна', email: 'petrenko@school.edu', password: 'teacher123', role: 'teacher' },
    { full_name: 'Коваленко Михайло Сергійович', email: 'kovalenko@school.edu', password: 'teacher123', role: 'teacher' },
  ])
  const [t1, t2, t3] = teachers
  console.log('Teachers created:', teachers.length)

  // Students
  const students = await User.create([
    { full_name: 'Бондаренко Олексій Петрович', email: 'bondarenko@student.edu', password: 'student123', role: 'student' },
    { full_name: 'Мороз Вікторія Андріївна', email: 'moroz@student.edu', password: 'student123', role: 'student' },
    { full_name: 'Ткаченко Дмитро Олегович', email: 'tkachenko@student.edu', password: 'student123', role: 'student' },
    { full_name: 'Савченко Ірина Миколаївна', email: 'savchenko@student.edu', password: 'student123', role: 'student' },
    { full_name: 'Лисенко Артем Вікторович', email: 'lysenko@student.edu', password: 'student123', role: 'student' },
    { full_name: 'Шевченко Анна Олексіївна', email: 'shevchenko@student.edu', password: 'student123', role: 'student' },
  ])
  const [s1, s2, s3, s4, s5, s6] = students
  console.log('Students created:', students.length)

  // Subjects
  const subjects = await Subject.create([
    { name: 'Вища математика', teacher_id: t1._id },
    { name: 'Програмування на Python', teacher_id: t1._id },
    { name: 'Лінійна алгебра', teacher_id: t1._id },
    { name: 'Дискретна математика', teacher_id: t1._id },
    { name: 'Бази даних', teacher_id: t2._id },
    { name: 'Операційні системи', teacher_id: t2._id },
    { name: 'Веб-програмування', teacher_id: t2._id },
    { name: 'Об\'єктно-орієнтоване програмування', teacher_id: t2._id },
    { name: 'Комп\'ютерні мережі', teacher_id: t3._id },
    { name: 'Алгоритми та структури даних', teacher_id: t3._id },
    { name: 'Штучний інтелект', teacher_id: t3._id },
    { name: 'Кібербезпека', teacher_id: t3._id },
  ])
  const [sub1, sub2, sub3, sub4, sub5, sub6, sub7, sub8, sub9, sub10, sub11, sub12] = subjects
  console.log('Subjects created:', subjects.length)

  // Student-Subject enrollments
  await StudentSubject.insertMany([
    // КН-21: s1, s2, s3 → Іваненко (sub1-sub4)
    { student_id: s1._id, subject_id: sub1._id, group_id: g1._id },
    { student_id: s2._id, subject_id: sub1._id, group_id: g1._id },
    { student_id: s3._id, subject_id: sub1._id, group_id: g1._id },
    { student_id: s1._id, subject_id: sub2._id, group_id: g1._id },
    { student_id: s2._id, subject_id: sub2._id, group_id: g1._id },
    { student_id: s3._id, subject_id: sub2._id, group_id: g1._id },
    { student_id: s1._id, subject_id: sub3._id, group_id: g1._id },
    { student_id: s2._id, subject_id: sub3._id, group_id: g1._id },
    { student_id: s1._id, subject_id: sub4._id, group_id: g1._id },
    // КН-22: s4, s5 → Петренко (sub5-sub8)
    { student_id: s4._id, subject_id: sub5._id, group_id: g2._id },
    { student_id: s5._id, subject_id: sub5._id, group_id: g2._id },
    { student_id: s4._id, subject_id: sub6._id, group_id: g2._id },
    { student_id: s5._id, subject_id: sub6._id, group_id: g2._id },
    { student_id: s4._id, subject_id: sub7._id, group_id: g2._id },
    { student_id: s5._id, subject_id: sub7._id, group_id: g2._id },
    { student_id: s4._id, subject_id: sub8._id, group_id: g2._id },
    // ІПЗ-31: s6 → Коваленко (sub9-sub12)
    { student_id: s6._id, subject_id: sub9._id, group_id: g3._id },
    { student_id: s6._id, subject_id: sub10._id, group_id: g3._id },
    { student_id: s6._id, subject_id: sub11._id, group_id: g3._id },
    { student_id: s6._id, subject_id: sub12._id, group_id: g3._id },
    { student_id: s3._id, subject_id: sub9._id, group_id: g1._id },
    { student_id: s3._id, subject_id: sub10._id, group_id: g1._id },
  ])
  console.log('Enrollments created')

  // Schedule events — поточний тиждень
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const day = (offset: number) => format(addDays(weekStart, offset), 'yyyy-MM-dd')

  // Розклад — кожен викладач в різний час, без перетинів
  await ScheduleEvent.insertMany([
    // Іваненко (t1) — пн, вт, ср
    { title: 'Вища математика – Лекція 1', subject_id: sub1._id, teacher_id: t1._id, type: 'lecture', room: '101', date: day(0), start_time: '08:00', end_time: '09:30' },
    { title: 'Вища математика – Практика', subject_id: sub1._id, teacher_id: t1._id, type: 'practice', room: '101', date: day(0), start_time: '10:00', end_time: '11:30' },
    { title: 'Python – Лабораторна 1', subject_id: sub2._id, teacher_id: t1._id, type: 'lab', room: '305', date: day(1), start_time: '08:00', end_time: '09:30' },
    { title: 'Лінійна алгебра – Лекція', subject_id: sub3._id, teacher_id: t1._id, type: 'lecture', room: '101', date: day(1), start_time: '10:00', end_time: '11:30' },
    { title: 'Дискретна математика – Семінар', subject_id: sub4._id, teacher_id: t1._id, type: 'seminar', room: '201', date: day(2), start_time: '08:00', end_time: '09:30' },
    { title: 'Python – Лекція', subject_id: sub2._id, teacher_id: t1._id, type: 'lecture', room: '305', date: day(3), start_time: '08:00', end_time: '09:30' },
    // Петренко (t2) — пн, вт, чт, пт
    { title: 'Бази даних – Лекція 1', subject_id: sub5._id, teacher_id: t2._id, type: 'lecture', room: '102', date: day(0), start_time: '12:00', end_time: '13:30' },
    { title: 'Бази даних – Семінар', subject_id: sub5._id, teacher_id: t2._id, type: 'seminar', room: '204', date: day(1), start_time: '12:00', end_time: '13:30' },
    { title: 'ОС – Лекція', subject_id: sub6._id, teacher_id: t2._id, type: 'lecture', room: '103', date: day(2), start_time: '10:00', end_time: '11:30' },
    { title: 'Веб-програмування – Лабораторна', subject_id: sub7._id, teacher_id: t2._id, type: 'lab', room: '306', date: day(3), start_time: '10:00', end_time: '11:30' },
    { title: 'ООП – Лекція', subject_id: sub8._id, teacher_id: t2._id, type: 'lecture', room: '102', date: day(4), start_time: '08:00', end_time: '09:30' },
    // Коваленко (t3) — вт, ср, чт, пт
    { title: 'Комп\'ютерні мережі – Лабораторна', subject_id: sub9._id, teacher_id: t3._id, type: 'lab', room: '401', date: day(1), start_time: '14:00', end_time: '15:30' },
    { title: 'Алгоритми – Лекція', subject_id: sub10._id, teacher_id: t3._id, type: 'lecture', room: '104', date: day(2), start_time: '12:00', end_time: '13:30' },
    { title: 'Штучний інтелект – Лекція', subject_id: sub11._id, teacher_id: t3._id, type: 'lecture', room: '104', date: day(3), start_time: '12:00', end_time: '13:30' },
    { title: 'Кібербезпека – Семінар', subject_id: sub12._id, teacher_id: t3._id, type: 'seminar', room: '402', date: day(4), start_time: '10:00', end_time: '11:30' },
    { title: 'Алгоритми – Контрольна', subject_id: sub10._id, teacher_id: t3._id, type: 'control', room: '104', date: day(4), start_time: '12:00', end_time: '13:30' },
  ])
  console.log('Schedule events created')

  // Grades
  const gradeDate = (daysAgo: number) => format(addDays(new Date(), -daysAgo), 'yyyy-MM-dd')

  await Grade.insertMany([
    // Вища математика (sub1) — t1
    { student_id: s1._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'class', value: 85, date: gradeDate(14), note: 'Активна участь' },
    { student_id: s1._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'control', value: 90, date: gradeDate(7) },
    { student_id: s1._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'monthly', value: 88, date: gradeDate(2) },
    { student_id: s2._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'class', value: 72, date: gradeDate(14) },
    { student_id: s2._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'control', value: 68, date: gradeDate(7), note: 'Потребує повторення' },
    { student_id: s2._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'monthly', value: 71, date: gradeDate(2) },
    { student_id: s3._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'class', value: 95, date: gradeDate(14) },
    { student_id: s3._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'control', value: 93, date: gradeDate(7) },
    { student_id: s3._id, subject_id: sub1._id, teacher_id: t1._id, grade_type: 'monthly', value: 94, date: gradeDate(2) },
    // Python (sub2) — t1
    { student_id: s1._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'class', value: 78, date: gradeDate(12) },
    { student_id: s1._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'class', value: 82, date: gradeDate(5) },
    { student_id: s1._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'semester', value: 80, date: gradeDate(1) },
    { student_id: s2._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'class', value: 91, date: gradeDate(12) },
    { student_id: s2._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'control', value: 87, date: gradeDate(5) },
    { student_id: s3._id, subject_id: sub2._id, teacher_id: t1._id, grade_type: 'class', value: 76, date: gradeDate(5) },
    // Лінійна алгебра (sub3) — t1
    { student_id: s1._id, subject_id: sub3._id, teacher_id: t1._id, grade_type: 'class', value: 83, date: gradeDate(10) },
    { student_id: s2._id, subject_id: sub3._id, teacher_id: t1._id, grade_type: 'class', value: 77, date: gradeDate(10) },
    // Бази даних (sub5) — t2
    { student_id: s4._id, subject_id: sub5._id, teacher_id: t2._id, grade_type: 'class', value: 88, date: gradeDate(11) },
    { student_id: s4._id, subject_id: sub5._id, teacher_id: t2._id, grade_type: 'control', value: 84, date: gradeDate(4) },
    { student_id: s4._id, subject_id: sub5._id, teacher_id: t2._id, grade_type: 'monthly', value: 86, date: gradeDate(1) },
    { student_id: s5._id, subject_id: sub5._id, teacher_id: t2._id, grade_type: 'class', value: 65, date: gradeDate(11) },
    { student_id: s5._id, subject_id: sub5._id, teacher_id: t2._id, grade_type: 'monthly', value: 70, date: gradeDate(1) },
    // ОС (sub6) — t2
    { student_id: s4._id, subject_id: sub6._id, teacher_id: t2._id, grade_type: 'class', value: 79, date: gradeDate(9) },
    { student_id: s5._id, subject_id: sub6._id, teacher_id: t2._id, grade_type: 'class', value: 74, date: gradeDate(9) },
    { student_id: s5._id, subject_id: sub6._id, teacher_id: t2._id, grade_type: 'control', value: 69, date: gradeDate(3) },
    // Веб (sub7) — t2
    { student_id: s4._id, subject_id: sub7._id, teacher_id: t2._id, grade_type: 'class', value: 92, date: gradeDate(8) },
    { student_id: s5._id, subject_id: sub7._id, teacher_id: t2._id, grade_type: 'class', value: 88, date: gradeDate(8) },
    // Комп. мережі (sub9) — t3
    { student_id: s6._id, subject_id: sub9._id, teacher_id: t3._id, grade_type: 'class', value: 92, date: gradeDate(13) },
    { student_id: s6._id, subject_id: sub9._id, teacher_id: t3._id, grade_type: 'control', value: 89, date: gradeDate(6) },
    { student_id: s3._id, subject_id: sub9._id, teacher_id: t3._id, grade_type: 'class', value: 80, date: gradeDate(13) },
    // Алгоритми (sub10) — t3
    { student_id: s6._id, subject_id: sub10._id, teacher_id: t3._id, grade_type: 'class', value: 96, date: gradeDate(10) },
    { student_id: s6._id, subject_id: sub10._id, teacher_id: t3._id, grade_type: 'control', value: 94, date: gradeDate(4) },
    { student_id: s6._id, subject_id: sub10._id, teacher_id: t3._id, grade_type: 'semester', value: 95, date: gradeDate(1) },
    { student_id: s3._id, subject_id: sub10._id, teacher_id: t3._id, grade_type: 'class', value: 78, date: gradeDate(10) },
    // ШІ (sub11) — t3
    { student_id: s6._id, subject_id: sub11._id, teacher_id: t3._id, grade_type: 'class', value: 87, date: gradeDate(7) },
    { student_id: s6._id, subject_id: sub11._id, teacher_id: t3._id, grade_type: 'monthly', value: 85, date: gradeDate(2) },
  ])
  console.log('Grades created')

  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────────')
  console.log('Admin:    admin@school.edu / admin123')
  console.log('Teacher1: ivanov@school.edu / teacher123')
  console.log('Teacher2: petrenko@school.edu / teacher123')
  console.log('Student:  bondarenko@student.edu / student123')
  console.log('─────────────────────────────────')

  await mongoose.disconnect()
}

seed().catch((e) => { console.error(e); process.exit(1) })
