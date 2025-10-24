import { Schema, model, models } from 'mongoose';
import { DEFAULT_STUDENT_LEVEL, STUDENT_LEVEL_VALUES } from './enums.js';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
};

const StudentSchema = new Schema(
    {
        studentCode: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },

        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

        // branch ถูกเลิกใช้จาก UI แล้ว คง field ไว้เพื่อความเข้ากันได้ย้อนหลัง
        branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
        level: {
            type: String,
            enum: STUDENT_LEVEL_VALUES,
            default: DEFAULT_STUDENT_LEVEL,
            index: true,
        },
        // เพิ่มปี/ห้อง สำหรับกำหนดชั้นเรียนจริง
        year: { type: Number, min: 1, max: 3, default: 1, index: true },
        room: { type: Number, min: 1, max: 20, default: 1, index: true },
    },
    schemaOptions
);

// virtual 1–many: Student → Attendance[]
StudentSchema.virtual('attendances', {
    ref: 'Attendance',
    localField: '_id',
    foreignField: 'studentId',
    justOne: false,
});

export const Student = models.Student || model('Student', StudentSchema);
