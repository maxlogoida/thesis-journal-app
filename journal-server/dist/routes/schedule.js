"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ScheduleEvent_1 = require("../models/ScheduleEvent");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (e) => ({
    id: e._id,
    title: e.title,
    subject_id: e.subject_id?._id ?? e.subject_id,
    teacher_id: e.teacher_id?._id ?? e.teacher_id,
    type: e.type,
    room: e.room,
    date: e.date,
    start_time: e.start_time,
    end_time: e.end_time,
    created_at: e.created_at,
    subject: e.subject_id?._id ? { id: e.subject_id._id, name: e.subject_id.name, teacher_id: e.subject_id.teacher_id, created_at: e.subject_id.created_at } : undefined,
    teacher: e.teacher_id?._id ? { id: e.teacher_id._id, full_name: e.teacher_id.full_name, email: e.teacher_id.email, role: e.teacher_id.role } : undefined,
});
const populate = (q) => q
    .populate('subject_id', 'name teacher_id created_at')
    .populate('teacher_id', 'full_name email role');
// GET /api/schedule?from=&to=
router.get('/', async (req, res) => {
    const filter = {};
    if (req.query.from)
        filter.date = { $gte: req.query.from };
    if (req.query.to)
        filter.date = { ...filter.date, $lte: req.query.to };
    const events = await populate(ScheduleEvent_1.ScheduleEvent.find(filter).sort({ date: 1, start_time: 1 }));
    res.json(events.map(fmt));
});
// GET /api/schedule/teacher/:teacherId?from=&to=
router.get('/teacher/:teacherId', async (req, res) => {
    const filter = { teacher_id: req.params.teacherId };
    if (req.query.from)
        filter.date = { $gte: req.query.from };
    if (req.query.to)
        filter.date = { ...filter.date, $lte: req.query.to };
    const events = await populate(ScheduleEvent_1.ScheduleEvent.find(filter).sort({ date: 1, start_time: 1 }));
    res.json(events.map(fmt));
});
// POST /api/schedule
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const { title, subject_id, teacher_id, type, room, date, start_time, end_time } = req.body;
        // Conflict check: same teacher same day overlapping time
        const teacherConflict = await ScheduleEvent_1.ScheduleEvent.findOne({
            teacher_id, date,
            $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
        });
        if (teacherConflict) {
            res.status(409).json({ error: 'Конфлікт: викладач вже має заняття в цей час' });
            return;
        }
        // Room conflict
        const roomConflict = await ScheduleEvent_1.ScheduleEvent.findOne({
            room, date,
            $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
        });
        if (roomConflict) {
            res.status(409).json({ error: 'Конфлікт: аудиторія вже зайнята в цей час' });
            return;
        }
        const e = await ScheduleEvent_1.ScheduleEvent.create({ title, subject_id, teacher_id, type, room, date, start_time, end_time });
        const populated = await populate(ScheduleEvent_1.ScheduleEvent.findById(e._id));
        res.status(201).json(fmt(populated));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/schedule/:id
router.patch('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const e = await populate(ScheduleEvent_1.ScheduleEvent.findByIdAndUpdate(req.params.id, req.body, { new: true }));
        if (!e) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(fmt(e));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE /api/schedule/:id
router.delete('/:id', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        await ScheduleEvent_1.ScheduleEvent.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
