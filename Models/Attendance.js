import { Schema, model, models } from 'mongoose';
import { AttendanceStatus } from './enums.js';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
};

const AttendanceSchema = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
        date: { type: Date, required: true },
        status: { type: String, enum: Object.values(AttendanceStatus), required: true },
    },
    schemaOptions
);

// Prisma: @@unique([studentId, date])
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model('Attendance', AttendanceSchema);
