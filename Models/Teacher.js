import { Schema, model, models } from 'mongoose';
import { DEFAULT_STUDENT_LEVEL, STUDENT_LEVEL_VALUES } from './enums.js';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
};

const TeacherSchema = new Schema(
    {
        employeeCode: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },

        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
        level: {
            type: String,
            enum: STUDENT_LEVEL_VALUES,
            default: DEFAULT_STUDENT_LEVEL,
            index: true,
        },
    },
    schemaOptions
);

export const Teacher = models.Teacher || model('Teacher', TeacherSchema);
