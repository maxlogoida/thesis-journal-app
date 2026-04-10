"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Notification_1 = require("../models/Notification");
const StudentSubject_1 = require("../models/StudentSubject");
const auth_1 = require("../middleware/auth");
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (n) => ({
    id: n._id,
    subject_id: n.subject_id?._id ?? n.subject_id,
    teacher_id: n.teacher_id,
    message: n.message,
    recipient_count: n.recipient_count,
    sent_at: n.sent_at,
    subject: n.subject_id?._id ? { id: n.subject_id._id, name: n.subject_id.name } : undefined,
});
// GET /api/notifications/teacher/:teacherId
router.get('/teacher/:teacherId', async (req, res) => {
    const list = await Notification_1.Notification.find({ teacher_id: req.params.teacherId })
        .populate('subject_id', 'name')
        .sort({ sent_at: -1 });
    res.json(list.map(fmt));
});
// POST /api/notifications/send
router.post('/send', (0, auth_1.requireRole)('teacher', 'super_admin'), async (req, res) => {
    try {
        const { subject_id, teacher_id, message } = req.body;
        // Get enrolled students
        const enrollments = await StudentSubject_1.StudentSubject.find({ subject_id }).populate('student_id', 'email full_name');
        const students = enrollments.map((e) => e.student_id).filter(Boolean);
        // Send emails (fire and forget — just log errors)
        if (students.length > 0 && process.env.SMTP_HOST) {
            const transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT ?? 587),
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            const emails = students.map((s) => s.email).filter(Boolean).join(',');
            await transporter.sendMail({
                from: process.env.SMTP_FROM ?? 'journal@school.edu',
                to: emails,
                subject: 'Повідомлення від викладача',
                text: message,
            }).catch(console.error);
        }
        const notification = await Notification_1.Notification.create({ subject_id, teacher_id, message, recipient_count: students.length });
        const populated = await Notification_1.Notification.findById(notification._id).populate('subject_id', 'name');
        res.status(201).json(fmt(populated));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
