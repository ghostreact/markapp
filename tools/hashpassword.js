import bcrypt from 'bcryptjs';

export async function hashPassword(password, saltRounds = 12) {
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}