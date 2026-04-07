import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getToken } from '@/lib/api'
import type {
  Profile,
  Subject,
  Group,
  StudentSubject,
  ScheduleEvent,
  Grade,
  Notification,
} from '@/types/database'

const API_URL = import.meta.env.VITE_API_URL as string

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = getToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Profile', 'Subject', 'Group', 'StudentSubject', 'Schedule', 'Grade', 'Notification'],
  endpoints: (builder) => ({

    // ─── USERS ───────────────────────────────────────────────────
    getTeachers: builder.query<Profile[], void>({
      query: () => '/users/teachers',
      providesTags: ['Profile'],
    }),

    getStudents: builder.query<Profile[], void>({
      query: () => '/users/students',
      providesTags: ['Profile'],
    }),

    createProfile: builder.mutation<Profile, { full_name: string; email: string; password: string; role: string }>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<Profile, { id: string; full_name?: string; email?: string }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),

    deleteProfile: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Profile'],
    }),

    // ─── SUBJECTS ────────────────────────────────────────────────
    getSubjects: builder.query<Subject[], void>({
      query: () => '/subjects',
      providesTags: ['Subject'],
    }),

    getSubjectsByTeacher: builder.query<Subject[], string>({
      query: (teacherId) => `/subjects/teacher/${teacherId}`,
      providesTags: ['Subject'],
    }),

    createSubject: builder.mutation<Subject, { name: string; teacher_id: string }>({
      query: (body) => ({ url: '/subjects', method: 'POST', body }),
      invalidatesTags: ['Subject'],
    }),

    updateSubject: builder.mutation<Subject, { id: string; name?: string; teacher_id?: string }>({
      query: ({ id, ...body }) => ({ url: `/subjects/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Subject'],
    }),

    deleteSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subject'],
    }),

    // ─── GROUPS ──────────────────────────────────────────────────
    getGroups: builder.query<Group[], void>({
      query: () => '/groups',
      providesTags: ['Group'],
    }),

    createGroup: builder.mutation<Group, { name: string }>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),

    // ─── STUDENT ↔ SUBJECT ───────────────────────────────────────
    getStudentsBySubject: builder.query<StudentSubject[], string>({
      query: (subjectId) => `/student-subjects/by-subject/${subjectId}`,
      providesTags: ['StudentSubject'],
    }),

    getSubjectsByStudent: builder.query<StudentSubject[], string>({
      query: (studentId) => `/student-subjects/by-student/${studentId}`,
      providesTags: ['StudentSubject'],
    }),

    addStudentToSubject: builder.mutation<StudentSubject, { student_id: string; subject_id: string; group_id: string }>({
      query: (body) => ({ url: '/student-subjects', method: 'POST', body }),
      invalidatesTags: ['StudentSubject'],
    }),

    removeStudentFromSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/student-subjects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StudentSubject'],
    }),

    // ─── SCHEDULE ────────────────────────────────────────────────
    getSchedule: builder.query<ScheduleEvent[], { from?: string; to?: string }>({
      query: ({ from, to } = {}) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        return `/schedule?${params}`
      },
      providesTags: ['Schedule'],
    }),

    getScheduleByTeacher: builder.query<ScheduleEvent[], { teacherId: string; from?: string; to?: string }>({
      query: ({ teacherId, from, to }) => {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        return `/schedule/teacher/${teacherId}?${params}`
      },
      providesTags: ['Schedule'],
    }),

    createScheduleEvent: builder.mutation<ScheduleEvent, Omit<ScheduleEvent, 'id' | 'created_at' | 'subject' | 'teacher'>>({
      query: (body) => ({ url: '/schedule', method: 'POST', body }),
      invalidatesTags: ['Schedule'],
    }),

    updateScheduleEvent: builder.mutation<ScheduleEvent, { id: string } & Partial<ScheduleEvent>>({
      query: ({ id, ...body }) => ({ url: `/schedule/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Schedule'],
    }),

    deleteScheduleEvent: builder.mutation<void, string>({
      query: (id) => ({ url: `/schedule/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Schedule'],
    }),

    // ─── GRADES ──────────────────────────────────────────────────
    getGradesBySubject: builder.query<Grade[], string>({
      query: (subjectId) => `/grades/subject/${subjectId}`,
      providesTags: ['Grade'],
    }),

    getGradesByStudent: builder.query<Grade[], string>({
      query: (studentId) => `/grades/student/${studentId}`,
      providesTags: ['Grade'],
    }),

    createGrade: builder.mutation<Grade, Omit<Grade, 'id' | 'created_at' | 'student' | 'subject'>>({
      query: (body) => ({ url: '/grades', method: 'POST', body }),
      invalidatesTags: ['Grade'],
    }),

    updateGrade: builder.mutation<Grade, { id: string; value: number; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/grades/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Grade'],
    }),

    deleteGrade: builder.mutation<void, string>({
      query: (id) => ({ url: `/grades/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Grade'],
    }),

    // ─── NOTIFICATIONS ───────────────────────────────────────────
    getNotifications: builder.query<Notification[], string>({
      query: (teacherId) => `/notifications/teacher/${teacherId}`,
      providesTags: ['Notification'],
    }),

    sendNotification: builder.mutation<void, { subject_id: string; teacher_id: string; message: string }>({
      query: (body) => ({ url: '/notifications/send', method: 'POST', body }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetTeachersQuery,
  useGetStudentsQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useGetSubjectsQuery,
  useGetSubjectsByTeacherQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useGetStudentsBySubjectQuery,
  useGetSubjectsByStudentQuery,
  useAddStudentToSubjectMutation,
  useRemoveStudentFromSubjectMutation,
  useGetScheduleQuery,
  useGetScheduleByTeacherQuery,
  useCreateScheduleEventMutation,
  useUpdateScheduleEventMutation,
  useDeleteScheduleEventMutation,
  useGetGradesBySubjectQuery,
  useGetGradesByStudentQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetNotificationsQuery,
  useSendNotificationMutation,
} = apiSlice
