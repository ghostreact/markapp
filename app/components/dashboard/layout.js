export const dynamic = 'force-dynamic'; // เผื่อเรียก API บนหน้า child
export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            {children}
        </div>
    );
}
