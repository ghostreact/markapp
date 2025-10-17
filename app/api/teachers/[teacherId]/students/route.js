import mongoConnect from "@/lib/mongodb";
import { Teacher } from "@/Models";

export async function POST(request, { params }) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    //ดึง id ครูจาก params
    const { teacherId } = await params;

    try {
        // เช็ดครูมีตัวตนอยู่ในระบบหรือไม่
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return new Response(JSON.stringify({ message: 'Teacher not found' }), { status: 404 });
        }

        // ดึงข้อมูลจาก body
         const { studentCode, name, username, password, branchId, departmentId } = await request.json();
    } catch (error) {
        
    }
}