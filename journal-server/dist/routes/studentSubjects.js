"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StudentSubject_1 = require("../models/StudentSubject");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (ss) => ({
    id: ss._id,
    student_id: ss.student_id?._id ?? ss.student_id,
    subject_id: ss.subject_id?._id ?? ss.subject_id,
    group_id: ss.group_id?._id ?? ss.group_id,
    student: ss.student_id?._id ? { id: ss.student_id._id, full_name: ss.student_id.full_name, email: ss.student_id.email, role: ss.student_id.role, created_at: ss.student_id.created_at } : undefined,
    subject: ss.subject_id?._id ? { id: ss.subject_id._id, name: ss.subject_id.name, teacher_id: ss.subject_id.teacher_id, created_at: ss.subject_id.created_at } : undefined,
    group: ss.group_id?._id ? { id: ss.group_id._id, name: ss.group_id.name, created_at: ss.group_id.created_at } : undefined,
});
// GET /api/student-subjects/by-subject/:subjectId
router.get('/by-subject/:subjectId', async (req, res) => {
    const list = await StudentSubject_1.StudentSubject.find({ subject_id: req.params.subjectId })
        .populate('student_id', 'full_name email role created_at')
        .populate('group_id');
    res.json(list.map(fmt));
});
// GET /api/student-subjects/by-student/:studentId
router.get('/by-student/:studentId', async (req, res) => {
    const list = await StudentSubject_1.StudentSubject.find({ student_id: req.params.studentId })
        .populate({ path: 'subject_id', populate: { path: 'teacher_id', select: 'full_name email' } })
        .populate('group_id');
    res.json(list.map(fmt));
});
// POST /api/student-subjects
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const { student_id, subject_id, group_id } = req.body;
        const ss = await StudentSubject_1.StudentSubject.create({ student_id, subject_id, group_id });
        const populated = await StudentSubject_1.StudentSubject.findById(ss._id)
            .populate('student_id', 'full_name email role created_at')
            .populate('subject_id', 'name teacher_id created_at')
            .populate('group_id');
        res.status(201).json(fmt(populated));
    }
    catch (e) {
        if (e.code === 11000) {
            res.status(400).json({ error: 'Студент вже записаний на цей предмет' });
            return;
        }
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/student-subjects/:id
router.delete('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (_req, res) => {
    try {
        await StudentSubject_1.StudentSubject.findByIdAndDelete(_req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
