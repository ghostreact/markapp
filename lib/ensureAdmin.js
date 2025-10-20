// src/lib/ensureAdmin.js

import { Role } from '@/Models';
import { User } from '@/Models/User';
import { hashPassword } from '@/tools/hashpassword.js';

let ran = false; // กันเรียกซ้ำใน dev/HMR

export async function ensureAdmin() {
    if (ran) return;
    ran = true;

    const hasAdmin = await User.exists({ role: Role.Admin });
    if (hasAdmin) return;

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.warn('[ensureAdmin] No admin exists but ADMIN_USERNAME/PASSWORD not set. Skip seeding.');
        return;
    }

    const dup = await User.findOne({ username }).lean();
    if (dup) {
        if (dup.role !== Role.Admin) {
            await User.updateOne({ _id: dup._id }, { $set: { role: Role.Admin } });
            console.log(`[ensureAdmin] Elevated "${username}" to Admin`);
        }
        return;
    }

    const passwordHash = await hashPassword(password);
    await User.create({ username, passwordHash, role: Role.Admin });
    console.log(`[ensureAdmin] Created initial admin "${username}"`);
}
