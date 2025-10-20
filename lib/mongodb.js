import mongoose from "mongoose";
import { ensureAdmin } from "./ensureAdmin";


// (แนะนำ) ตรวจ ENV ก่อน
const MONGODB_URI = process.env.MONGO_URL;
const MONGODB_DB = process.env.MONGODB_DB; // ถ้ามีแยกชื่อ DB

if (!MONGODB_URI) {
    throw new Error('Please set MONGO_URL in environment variables');
}

// ใช้ global cache กัน connect ซ้ำ ๆ ใน dev/HMR และแต่ละ API call
let cached = global._mongoose;
if (!cached) {
    cached = global._mongoose = { conn: null, promise: null, synced: false };
}

export default async function mongoConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        // ตั้งค่าบางอย่างเพิ่มเติมได้ถ้าต้องการ
        // mongoose.set('strictQuery', true); // ถ้าคุณอยากบังคับ query validators

        cached.promise = mongoose
            .connect(MONGODB_URI, {
                dbName: MONGODB_DB || undefined, // เว้นไว้จะใช้จาก connection string
                // bufferCommands: false,        // เปิดใช้ถ้าต้องการ fail-fast เวลา DB ล่ม
                // maxPoolSize: 10,              // ปรับตามโหลด
            })
            .then((m) => m)
            .catch((err) => {
                // ใน serverless/Next.js อย่าทำ process.exit(1) เพราะจะ kill runtime
                console.error('MongoDB connection error:', err);
                throw err;
            });
    }

    cached.conn = await cached.promise;

    // ⚠️ อย่า syncIndexes ทุกครั้ง — ทำเฉพาะตอนที่เราตั้งใจ
    // เปิดด้วย flag/ENV หรือเฉพาะ dev เท่านั้น
    if (process.env.MONGODB_SYNC_INDEXES === 'true' && !cached.synced) {
        // สำคัญ: ต้อง import โมเดลทั้งหมดก่อนถึงจะ sync ได้ครบ
        // เช่น: import '@/models/index.js'
        await mongoose.connection.syncIndexes();
        cached.synced = true;
        console.log('[MongoDB] Indexes synced');
    }

    // ✅ เรียก seed เฉพาะเมื่อเปิด flag
    if (process.env.SEED_ON_BOOT === 'true') {
        await ensureAdmin();     // สร้าง Admin ถ้ายังไม่มี
      //  await runInitialSeed();  // (ตัวเลือก) สร้าง Department/Branch เริ่มต้น
    }

    // Log (optional)
    if (process.env.NODE_ENV !== 'production') {
        mongoose.connection.on('connected', () => console.log('[MongoDB] connected'));
        mongoose.connection.on('error', (e) => console.error('[MongoDB] error', e));
        mongoose.connection.on('disconnected', () => console.warn('[MongoDB] disconnected'));
    }

    return cached.conn;
}


// export default async function mongoConnect() {
//     try {
//         await mongoose.connect(process.env.MONGO_URL);
//         await mongoose.connection.syncIndexes();
//         console.log("MongoDB connected");
//     } catch (error) {
//         console.error("MongoDB connection error:", error);
//         process.exit(1);
//     }
// }