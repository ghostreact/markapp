import { Schema, model, models } from 'mongoose';

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
    },
    schemaOptions
);

export const Teacher = models.Teacher || model('Teacher', TeacherSchema);
