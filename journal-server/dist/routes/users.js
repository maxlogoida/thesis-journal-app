"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (u) => ({ id: u._id, full_name: u.full_name, email: u.email, role: u.role, created_at: u.created_at });
// GET /api/users/teachers
router.get('/teachers', async (_req, res) => {
    const users = await User_1.User.find({ role: 'teacher' }).sort({ full_name: 1 });
    res.json(users.map(fmt));
});
// GET /api/users/students
router.get('/students', async (_req, res) => {
    const users = await User_1.User.find({ role: 'student' }).sort({ full_name: 1 });
    res.json(users.map(fmt));
});
// POST /api/users — create teacher or student (admin only)
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;
        if (!full_name || !email || !password || !role) {
            res.status(400).json({ error: 'Missing fields' });
            return;
        }
        const existing = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existing) {
            res.status(400).json({ error: 'Користувач з таким email вже існує' });
            return;
        }
        const user = await User_1.User.create({ full_name, email, password, role });
        res.status(201).json(fmt(user));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PATCH /api/users/:id
router.patch('/:id', (0, auth_1.requireRole)('super_admin'), async (req, res) => {
    try {
        const { full_name, email } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { full_name, email }, { new: true });
        if (!user) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(fmt(user));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/users/:id
router.delete('/:id', (0, auth_1.requireRole)('super_admin'), async (req, res) => {
    try {
        await User_1.User.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
