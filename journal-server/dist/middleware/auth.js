"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = payload.id;
        req.userRole = payload.role;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.userRole ?? '')) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
}
