"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Grade_1 = require("../models/Grade");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (g) => ({
    id: g._id,
    student_id: g.student_id?._id ?? g.student_id,
    subject_id: g.subject_id?._id ?? g.subject_id,
    teacher_id: g.teacher_id,
    schedule_id: g.schedule_id,
    grade_type: g.grade_type,
    value: g.value,
    date: g.date,
    note: g.note,
    created_at: g.created_at,
    student: g.student_id?._id ? { id: g.student_id._id, full_name: g.student_id.full_name, email: g.student_id.email, role: g.student_id.role, created_at: g.student_id.created_at } : undefined,
    subject: g.subject_id?._id ? { id: g.subject_id._id, name: g.subject_id.name, teacher_id: g.subject_id.teacher_id, created_at: g.subject_id.created_at } : undefined,
});
// GET /api/grades/subject/:subjectId
router.get('/subject/:subjectId', async (req, res) => {
    const grades = await Grade_1.Grade.find({ subject_id: req.params.subjectId })
        .populate('student_id', 'full_name email role created_at')
        .sort({ date: -1 });
    res.json(grades.map(fmt));
});
// GET /api/grades/student/:studentId
router.get('/student/:studentId', async (req, res) => {
    const grades = await Grade_1.Grade.find({ student_id: req.params.studentId })
        .populate('subject_id', 'name teacher_id created_at')
        .sort({ date: -1 });
    res.json(grades.map(fmt));
});
// POST /api/grades
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const g = await Grade_1.Grade.create(req.body);
        const populated = await Grade_1.Grade.findById(g._id).populate('student_id', 'full_name email role created_at');
        res.status(201).json(fmt(populated));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PATCH /api/grades/:id
router.patch('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const g = await Grade_1.Grade.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('student_id', 'full_name email role created_at');
        if (!g) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(fmt(g));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/grades/:id
router.delete('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        await Grade_1.Grade.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
