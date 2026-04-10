"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("./models/User");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let isConnected = false;
const connectDB = async () => {
    if (isConnected)
        return;
    await mongoose_1.default.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
    const exists = await User_1.User.findOne({ role: "super_admin" });
    if (!exists) {
        await User_1.User.create({
            full_name: "Адміністратор",
            email: "admin@school.edu",
            password: "admin123",
            role: "super_admin",
        });
    }
};
app.use(async (req, res, next) => {
    await connectDB();
    next();
});
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
exports.default = app;
