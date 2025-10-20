import { Schema, model, models } from 'mongoose';
import { Role } from './enums';

const schemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Teacher','Admin'], default: 'Student', required: true },
}, schemaOptions);

// virtual 1–1: User → Student
UserSchema.virtual('studentProfile', {
    ref: 'Student',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
})

// virtual 1–1: User → Teacher
UserSchema.virtual('teacherProfile', {
    ref: 'Teacher',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});

export const User = models.User || model('User', UserSchema);