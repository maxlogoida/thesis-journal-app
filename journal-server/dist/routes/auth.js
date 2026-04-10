"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ error: 'Невірний email або пароль' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at },
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.userId).select('-password');
        if (!user) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json({ id: user._id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
