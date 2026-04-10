"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Subject_1 = require("../models/Subject");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const populate = (q) => q.populate('teacher_id', 'full_name email role created_at');
const fmt = (s) => ({
    id: s._id,
    name: s.name,
    teacher_id: s.teacher_id?._id ?? s.teacher_id,
    teacher: s.teacher_id?._id ? { id: s.teacher_id._id, full_name: s.teacher_id.full_name, email: s.teacher_id.email, role: s.teacher_id.role, created_at: s.teacher_id.created_at } : undefined,
    created_at: s.created_at,
});
// GET /api/subjects
router.get('/', async (_req, res) => {
    const subjects = await populate(Subject_1.Subject.find().sort({ name: 1 }));
    res.json(subjects.map(fmt));
});
// GET /api/subjects/teacher/:teacherId
router.get('/teacher/:teacherId', async (req, res) => {
    const subjects = await populate(Subject_1.Subject.find({ teacher_id: req.params.teacherId }).sort({ name: 1 }));
    res.json(subjects.map(fmt));
});
// POST /api/subjects
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const { name, teacher_id } = req.body;
        const s = await Subject_1.Subject.create({ name, teacher_id });
        const populated = await populate(Subject_1.Subject.findById(s._id));
        res.status(201).json(fmt(populated));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PATCH /api/subjects/:id
router.patch('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const { name, teacher_id } = req.body;
        const s = await populate(Subject_1.Subject.findByIdAndUpdate(req.params.id, { name, teacher_id }, { new: true }));
        if (!s) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(fmt(s));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/subjects/:id
router.delete('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        await Subject_1.Subject.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
