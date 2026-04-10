"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grade = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GradeSchema = new mongoose_1.Schema({
    student_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    schedule_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ScheduleEvent', default: null },
    grade_type: { type: String, enum: ['class', 'control', 'monthly', 'semester', 'annual'], required: true },
    value: { type: Number, required: true, min: 0, max: 100 },
    date: { type: String, required: true },
    note: { type: String },
    created_at: { type: Date, default: Date.now },
});
exports.Grade = mongoose_1.default.model('Grade', GradeSchema);
