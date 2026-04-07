import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject_id, teacher_id, message } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get all students enrolled in this subject
    const { data: enrollments, error: enrollErr } = await supabase
      .from('student_subjects')
      .select('student:profiles!student_subjects_student_id_fkey(id, full_name, email)')
      .eq('subject_id', subject_id)

    if (enrollErr) throw enrollErr

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .single()

    const subjectName = subjectData?.name ?? 'Предмет'
    const students = enrollments?.map((e: { student: { id: string; full_name: string; email: string } }) => e.student) ?? []

    // Send emails via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailPromises = students.map(async (student: { id: string; full_name: string; email: string }) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Журнал навантаження <noreply@yourschool.edu>',
          to: student.email,
          subject: `Повідомлення від викладача — ${subjectName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 8px;">
              <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px;">📚 Електронний журнал</h1>
              </div>
              <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin-top: 0;">Привіт, <strong style="color: #1e293b;">${student.full_name}</strong>!</p>
                <p style="color: #64748b;">Ви отримали повідомлення від викладача з предмету <strong style="color: #1e40af;">${subjectName}</strong>:</p>
                <div style="background: #f1f5f9; border-left: 4px solid #1e40af; padding: 16px; border-radius: 4px; margin: 16px 0;">
                  <p style="color: #1e293b; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
                  Це автоматичне повідомлення з системи обліку педагогічного навантаження.
                </p>
              </div>
            </div>
          `,
        }),
      })
      return res.ok
    })

    await Promise.all(emailPromises)

    // Log notification to DB
    await supabase.from('notifications').insert({
      subject_id,
      teacher_id,
      message,
      recipient_count: students.length,
    })

    return new Response(
      JSON.stringify({ success: true, sent: students.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
