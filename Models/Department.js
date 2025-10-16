import { Schema, model, models } from 'mongoose';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
};

const DepartmentSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, index: true },
    },
    schemaOptions
);

// virtuals 1–many: Department → Student[] / Teacher[] / Branch[]
DepartmentSchema.virtual('students', {
    ref: 'Student',
    localField: '_id',
    foreignField: 'departmentId',
    justOne: false,
});

DepartmentSchema.virtual('teachers', {
    ref: 'Teacher',
    localField: '_id',
    foreignField: 'departmentId',
    justOne: false,
});

DepartmentSchema.virtual('branches', {
    ref: 'Branch',
    localField: '_id',
    foreignField: 'departmentId',
    justOne: false,
});

export const Department = models.Department || model('Department', DepartmentSchema);
