"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Group_1 = require("../models/Group");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const fmt = (g) => ({ id: g._id, name: g.name, created_at: g.created_at });
// GET /api/groups
router.get('/', async (_req, res) => {
    const groups = await Group_1.Group.find().sort({ name: 1 });
    res.json(groups.map(fmt));
});
// POST /api/groups
router.post('/', (0, auth_1.requireRole)('super_admin', 'teacher'), async (req, res) => {
    try {
        const g = await Group_1.Group.create({ name: req.body.name });
        res.status(201).json(fmt(g));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
