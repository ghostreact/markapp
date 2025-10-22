"use client";

import Link from "next/link";

const features = [
  {
    title: "บันทึกการเข้าเรียนแบบเรียลไทม์",
    description:
      "ครูสามารถเช็คชื่อและบันทึกสถานะการมาเรียนได้อย่างรวดเร็วบนทุกอุปกรณ์ พร้อมสรุปสถิติให้ทันที",
  },
  {
    title: "แดชบอร์ดนักเรียนส่วนตัว",
    description:
      "นักเรียนตรวจสอบสถานะการเข้าเรียนและตารางวิชาได้ด้วยตัวเอง ช่วยให้การติดตามผลเป็นเรื่องง่าย",
  },
  {
    title: "จัดการข้อมูลครบในที่เดียว",
    description:
      "บริหารจัดการผู้ใช้ ครู นักเรียน สาขา และแผนกได้ในระบบเดียว ลดงานเอกสารและการทำงานซ้ำซ้อน",
  },
];

const steps = [
  {
    number: "01",
    title: "เข้าสู่ระบบ",
    description:
      "สร้างบัญชีผู้ดูแลระบบครั้งเดียว จากนั้นเชิญครูและนักเรียนเข้ามาใช้งานได้ในไม่กี่นาที",
  },
  {
    number: "02",
    title: "ตั้งค่าห้องเรียน",
    description:
      "เพิ่มแผนก สาขา และรายชื่อนักเรียน พร้อมกำหนดครูประจำวิชาเพื่อให้การเช็คชื่อเชื่อมโยงกัน",
  },
  {
    number: "03",
    title: "เริ่มติดตามการมาเรียน",
    description:
      "ครูสามารถเช็คชื่อและดูประวัติย้อนหลังได้ทันที ขณะที่นักเรียนเห็นความคืบหน้าของตัวเองแบบเรียลไทม์",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100/80 backdrop-blur supports-[backdrop-filter]:bg-base-100/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            MarkApp
          </Link>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a className="hover:text-primary" href="#features">
              จุดเด่น
            </a>
            <a className="hover:text-primary" href="#workflow">
              วิธีเริ่มต้น
            </a>
            <a className="hover:text-primary" href="#cta">
              เริ่มใช้งาน
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost btn-sm">
              เข้าสู่ระบบ
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm">
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
              Student Attendance Platform
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              ระบบจัดการการเข้าเรียนสำหรับ{" "}
              <span className="text-primary">โรงเรียนและสถาบันสมัยใหม่</span>
            </h1>
            <p className="text-base text-base-content/70">
              MarkApp ช่วยให้ครูและเจ้าหน้าที่สามารถบันทึกการมาเรียน ตรวจสอบ
              และสรุปผลได้อย่างรวดเร็ว ส่วนนักเรียนเห็นข้อมูลของตัวเองได้ทุกที่ทุกเวลา
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="btn btn-primary btn-lg">
                เริ่มใช้งานทันที
              </Link>
              <a href="#features" className="btn btn-ghost btn-lg">
                ดูจุดเด่นของระบบ
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-center">
                <p className="text-2xl font-semibold text-primary">100%</p>
                <p className="text-xs text-base-content/60">
                  เก็บข้อมูลการมาเรียนครบถ้วนแบบเรียลไทม์
                </p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-center">
                <p className="text-2xl font-semibold text-primary">0</p>
                <p className="text-xs text-base-content/60">
                  ไม่ต้องใช้กระดาษเช็คชื่ออีกต่อไป
                </p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4 text-center">
                <p className="text-2xl font-semibold text-primary">24/7</p>
                <p className="text-xs text-base-content/60">
                  เข้าถึงข้อมูลนักเรียนได้ทุกที่ทุกเวลา
                </p>
              </div>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="w-full max-w-md rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    ภาพรวม
                  </p>
                  <h3 className="text-lg font-semibold">แดชบอร์ดนักเรียน</h3>
                </div>
                <span className="badge badge-primary badge-outline">Live</span>
              </div>
              <div className="space-y-4 text-sm text-base-content/70">
                <div className="rounded-xl bg-base-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-base-content/60">
                    การเข้าเรียนล่าสุด
                  </p>
                  <p className="text-base font-semibold text-base-content">
                    92% การเข้าเรียนรวมของภาคเรียนนี้
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-base-200 px-4 py-3">
                    <p className="text-xs uppercase text-base-content/60">
                      มาเรียน
                    </p>
                    <p className="text-xl font-semibold text-success">48 ครั้ง</p>
                  </div>
                  <div className="rounded-xl bg-base-200 px-4 py-3">
                    <p className="text-xs uppercase text-base-content/60">
                      ขาดเรียน
                    </p>
                    <p className="text-xl font-semibold text-error">4 ครั้ง</p>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed border-primary/40 px-4 py-3">
                  <p className="text-xs uppercase text-primary">พร้อมใช้งานทันที</p>
                  <p className="mt-1 text-base text-base-content">
                    เข้าสู่ระบบด้วยบัญชีครูหรือนักเรียนเพื่อดูข้อมูลจริงทันที
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                จุดเด่นของ MarkApp
              </p>
              <h2 className="text-3xl font-semibold text-base-content">
                ครบจบในระบบเดียวสำหรับการติดตามการมาเรียน
              </h2>
            </div>
            <p className="max-w-xl text-sm text-base-content/70">
              ระบบถูกออกแบบให้ใช้งานง่ายทั้งบนคอมพิวเตอร์และมือถือ
              เพื่อให้การจัดการข้อมูลการมาเรียนแม่นยำและตรวจสอบย้อนหลังได้ตลอดเวลา
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-base-content">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-base-content/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mt-24 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                วิธีเริ่มต้น
              </p>
              <h2 className="text-3xl font-semibold text-base-content">
                ตั้งค่าเพียงไม่กี่ขั้นตอนก็พร้อมใช้งาน
              </h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm transition hover:shadow-md"
              >
                <span className="text-2xl font-semibold text-primary">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-base-content">
                  {step.title}
                </h3>
                <p className="text-sm text-base-content/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="cta"
          className="mt-24 rounded-3xl bg-primary text-primary-content shadow-lg"
        >
          <div className="grid gap-6 p-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                เริ่มต้นได้ฟรี
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                เชื่อมต่อครูและนักเรียนด้วยข้อมูลที่เชื่อถือได้
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-primary-content/80">
                ลงชื่อเข้าใช้ด้วยบัญชีที่ได้รับอนุมัติและเริ่มบันทึกการมาเรียนได้ทันที
                ไม่มีค่าใช้จ่ายเพิ่มเติม
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Link href="/login" className="btn btn-secondary btn-wide">
                เข้าสู่ระบบ
              </Link>
              <p className="text-xs text-primary-content/80">
                ยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบเพื่อรับสิทธิ์เข้าถึง
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300 bg-base-100/80 py-6 text-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-base-content/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} MarkApp. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-primary" href="/login">
              เข้าสู่ระบบ
            </a>
            <a className="hover:text-primary" href="#features">
              จุดเด่น
            </a>
            <a className="hover:text-primary" href="#cta">
              ติดต่อเรา
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
