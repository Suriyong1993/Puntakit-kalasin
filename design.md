# Puntakit Design System

เอกสารกำหนดการออกแบบ (source of truth) ของแอป Puntakit — ทุกหน้าและทุก component ต้องใช้ token เดียวกันนี้
อ้างอิงจาก `brand-spec.md` และ CSS custom properties ใน `client/src/index.css`

## 1. สีหลัก (Brand Colors)

| Token | ค่า | การใช้งาน |
|---|---|---|
| `--navy` | `#173B70` | สีหลักเข้ม — sidebar, ปุ่มสำคัญ, หัวข้อ banner |
| `--blue` | `#2F6FCC` | สีหลัก — ปุ่ม primary, ลิงก์, จุดเน้น (focus) |
| `--ink` | `#17324D` | สีตัวอักษรหลัก |
| `--muted` | `#6B7C93` | สีตัวอักษรองค์ประกอบรอง |
| `--line` | `#E4ECF4` | เส้นขอบการ์ดและแผง |
| `--surface` | `#FFFFFF` | พื้นผิวการ์ด |
| Canvas | `#F4F8FC` | พื้นหลังแอป |

## 2. สี Semantic (สถานะ)

| Token | ค่า | ความหมาย |
|---|---|---|
| `--success` | `#27AE72` | สำเร็จ / ใช้งานอยู่ / ยืนยันแล้ว (=`--growth-green`) |
| `--warning` | `#F3A23A` | คำเตือน / รอดำเนินการ (=`--activity-orange`) |
| `--error` | `#C23B4D` | ข้อผิดพลาด / ลบ / ยืนยันแล้ว |
| `--info` | `#2F6FCC` | ข้อมูลทั่วไป (=`--blue`) |

สี accent ทำกิจกรรมเฉพาะ (ใช้ได้ แต่ต้องมีความหมาย): `--care-purple: #7950D8`, `--relationship-pink: #E85D78`

**กติกาสี:** ห้ามไล่สี (gradient) ที่ไม่มีความหมาย, ห้ามใช้สีรุ้งพร่ามัวในหน้าเดียวเกิน 3 โทน,
สีตามสถานะ (success/warning/error/info) ห้ามเปลี่ยนความหมาย, ทุก stat/ badge ต้องอิง semantic สีนี้

## 3. Typography

- ฟอนต์: **Prompt** (thai-first) → `system-ui, sans-serif`
- น้ำหนัก: 400 (ปกติ), 500 (medium), 600 (semibold), 700 (bold), 800 (display)
- สเกล: `10px` (คำอธิบายเล็ก), `11px`, `12px` (body เล็ก/label), `13px`, `14px` (body), `16px`, `20px` (h3), `22px` (h2), `30px` (h1), `32px`+ (hero)
- หัวข้อหน้า: ตัวหนา 800 + `tracking-tight`, eyebrow: ตัวหนา 600 uppercase `tracking-wider` สี `--blue`

## 4. Radius Scale

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--radius-card` | `21px` | การ์ดขนาดใหญ่ (hero, panel) |
| `--radius-tile` | `18px` | การ์ดย่อย / tile |
| `--radius-panel` | `16px` | แผงใน, modal |
| Tailwind | `rounded-xl (12px)` | ปุ่ม, input, รายการ |

## 5. Shadow Scale

| ชื่อ | ค่า | ใช้กับ |
|---|---|---|
| `shadow-xs` | แทบไม่มี | hover lift เล็ก, chip |
| `shadow-sm` | เบา | การ์ดมาตรฐาน |
| `--shadow` | `0 10px 28px rgba(36,92,146,.08)` | การ์ดเด่น (hero) |
| `shadow-lg` | หนัก (ใช้เฉพาะ overlay: sidebar mobile, dropdown) | เมนูทับ |
| ~~shadow-xl/2xl~~ | ห้ามใช้โดยไม่จำเป็น | — |

## 6. Z-index Scale

| ชั้น | ค่า | ใช้กับ |
|---|---|---|
| base | 0 | เนื้อหาปกติ |
| sticky | 30 | topbar |
| overlay | 40 | backdrop |
| drawer/dropdown | 50 | sidebar mobile, dropdown, modal |

## 7. Spacing Scale (4px base)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48` px
- ระยะห่างในการ์ด: 16–24px, ระหว่างการ์ด: 16px, ระยะหน้า: py-6 (24px)

## 8. Component Rules

- **การ์ด**: พื้น `--surface` + เส้นขอบ `1px var(--line)` + radius-card + `shadow-sm` หรือ `--shadow` — ห้ามซ้อนเงาหลายชั้น
- **ปุ่มหลัก**: พื้น `--blue` หรือ `--navy`, ตัวอักษรขาว, rounded-xl, มี icon 1 ตัวเสมอ
- **ปุ่มอันตราย (ลบ)**: ใช้ `.danger-button` (`--error`)
- **สถานะ (badge/chip)**: ต้องอิงสี semantic ข้อ 2 เท่านั้น
- **Loading (กติกาบังคับ)**:
  - **Skeleton** = เนื้อหาหน้า (ตาราง, การ์ด, แบบฟอร์ม) → ใช้ `client/src/components/LoadingStates.tsx`
  - **Spinner** = ปุ่มหรือ action สั้น ๆ เท่านั้น (submit, refresh)
  - ห้ามใช้ข้อความ `"..."` หรือจุดไข่ปลาแทน loading
  - **Empty state / Error state ต้องแยกจาก loading** และห้ามแสดงพร้อมกัน
- **ข้อมูลจริง**: ตัวเลขสถิติ/ชื่อ/อีเมล ต้องมาจาก API เท่านั้น — ถ้าไม่มี API ให้แสดง empty state ห้าม hardcode
- **Legal**: ทุกหน้า login และ profile ต้องมีลิงก์ `/privacy` และ `/terms`
