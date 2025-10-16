import { Schema, model, models } from 'mongoose';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
};

const BranchSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, index: true },
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    },
    schemaOptions
);

// virtual 1–many: Branch → Student[]
BranchSchema.virtual('students', {
    ref: 'Student',
    localField: '_id',
    foreignField: 'branchId',
    justOne: false,
});

export const Branch = models.Branch || model('Branch', BranchSchema);
