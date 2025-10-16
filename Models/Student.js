import { Schema, model, models } from 'mongoose';

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

        branchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
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
