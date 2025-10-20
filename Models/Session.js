// models/Session.js
import mongoose, { Schema, models } from 'mongoose';

const SessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    // เก็บ refresh token แบบ "แฮช" เพื่อความปลอดภัย (ถ้าหลุดก็ใช้ไม่ได้)
    refreshTokenHash: { type: String, index: true, required: true },
    userAgent: String,
    ip: String,
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, index: true },
}, { timestamps: true });

export const Session = models.Session || mongoose.model('Session', SessionSchema);
