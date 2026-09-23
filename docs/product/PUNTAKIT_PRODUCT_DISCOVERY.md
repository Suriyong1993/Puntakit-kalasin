# Puntakit — Product Discovery (Phase 0 + Phase 1)

- สถานะ: ร่าง (Draft) รอการตรวจและอนุมัติ
- วันที่: 2026-09-23
- ฐานโค้ดที่วิเคราะห์: branch `claude/peaceful-cannon-5z8bbt` ที่ commit `b77341f` (เท่ากับ `origin/main`)
- ขอบเขต: Phase 0 (Understand) และ Phase 1 (Product Discovery) เท่านั้น
- เอกสารนี้ไม่มี Product Strategy, feature definition หรือ UI design

## วิธีอ่านเอกสาร

เอกสารนี้แยกข้อมูลเป็น 4 ระดับ:

| ระดับ | ความหมาย | รหัส |
|---|---|---|
| Evidence | สิ่งที่พบในโค้ดหรือเอกสารใน repo จริง มีตำแหน่งไฟล์อ้างอิง | `E-xx` |
| Inference | ข้อสรุปที่ได้จาก Evidence โดยตรง | `I-xx` |
| Hypothesis | สิ่งที่คาดการณ์ ยังไม่มีหลักฐานยืนยัน ต้อง validate | `H-xx` |
| Unknown | สิ่งที่ยังไม่รู้ และโค้ดตอบไม่ได้ | `U-xx` |

ข้อจำกัดของการวิเคราะห์:

- ส่วนใหญ่ของเอกสารมาจากการอ่านโค้ด ผมไม่ได้รัน test และไม่ได้เชื่อมต่อฐานข้อมูล production
- ผมรันแอปในเครื่องเพื่อยืนยันเฉพาะ E-30 และ E-31 ดูหัวข้อ 6.8
- repo ไม่มีข้อมูลการใช้งานจริง (analytics, log, ข้อมูลสมาชิก, บทสัมภาษณ์ผู้ใช้) ดังนั้นทุกข้อความเกี่ยวกับพฤติกรรมผู้ใช้จริงเป็น Hypothesis หรือ Unknown
- งาน Modal และ accessibility P0/P1 อยู่ใน branch `origin/claude/affectionate-mayer-47gfd7` (commit `879d113`, `9963e56`) งานนี้ยังไม่ merge เข้า `main` เอกสารนี้จึงไม่รวมการเปลี่ยนแปลงนั้น

---

## 1. Executive Summary

Puntakit เป็นระบบบริหารคริสตจักรพันธกิจกาฬสินธุ์ ระบบมี 2 ส่วน:

1. Admin dashboard สำหรับเจ้าหน้าที่ (สมาชิก, กลุ่มแคร์, เช็คชื่อ, กิจกรรม, ประกาศ, พันธกิจ)
2. Member PWA ที่ `/app` สำหรับสมาชิก (หน้าแรก, กิจกรรม, กลุ่มของฉัน, ประวัติเข้าร่วม, โปรไฟล์)

ข้อค้นพบหลัก:

1. **ระบบมี backend จริงแล้ว** Express + Drizzle ORM + PostgreSQL มี 14 ตาราง และ API ประมาณ 60 endpoint ข้อความใน `CLAUDE.md` ที่บอกว่า "server ไม่มี API และข้อมูลเป็น mock" ล้าสมัยแล้ว (E-01)
2. **ผู้ใช้ที่ login ได้จริงตอนนี้มีเพียง admin** ระบบสร้าง user ได้ทางเดียวคือ script `seed-admin` ไม่มี API หรือ UI สำหรับสร้างบัญชีให้ผู้นำกลุ่มหรือสมาชิก (E-10) ดังนั้น Member PWA และ role `group_leader` ยังใช้งานจริงไม่ได้ (I-01)
3. **มีความเสี่ยงด้านความเป็นส่วนตัวระดับสูง** ผู้ใช้ที่ login แล้วทุก role (รวม `member`) อ่านเบอร์โทรเต็มของสมาชิกในทุกกลุ่มได้ รวมกลุ่ม `confidential` และบันทึกการเข้าร่วมของทุกคนได้ และเช็คชื่อแทนคนอื่นได้ (E-20 ถึง E-24)
4. **หน้าเช็คชื่อแบบรายชื่อ (Live roster) และการเพิ่มสมาชิกเข้ากลุ่มมีข้อบกพร่องในโค้ด** client ขอ `limit` เกินค่าที่ server อนุญาต และอ่าน field ที่ server ไม่ส่งกลับ (E-30, E-31) ผลคือรายชื่อว่าง ผมยืนยันด้วยการรันแอปในเบราว์เซอร์แล้ว (หัวข้อ 6.8)
5. **ระบบยังไม่มีข้อมูลที่ตอบคำถาม "กลุ่มกำลังเป็นอย่างไร"** ไม่มีรายงานกลุ่ม ไม่มีแนวโน้มการเข้าร่วม ไม่มีบันทึกการติดตามสมาชิก dashboard แสดงเฉพาะจำนวนสมาชิก (E-40 ถึง E-44)
6. **ยังไม่มีหลักฐานว่าต้องการ Map หรือ Feed** component `Map.tsx` มีอยู่ แต่ไม่มีหน้าใดใช้ (E-50) Feed อยู่ใน branch ที่ไม่ได้ merge (E-51) ไม่มีปัญหาผู้ใช้ที่บันทึกไว้ซึ่งชี้ว่าต้องมี 2 ฟีเจอร์นี้

ข้อเสนอขั้นต่อไป: ตรวจและอนุมัติเอกสารนี้ แล้วทำ validation กับผู้ใช้จริง 3 กลุ่มก่อน (ผู้ดูแลคริสตจักร, ผู้นำกลุ่ม, สมาชิก) ดูหัวข้อ 16

---

## 2. Current Product Mental Model

### 2.1 Product

Puntakit เก็บข้อมูลสมาชิกคริสตจักร จัดสมาชิกเข้ากลุ่มแคร์ บันทึกการเข้าร่วม และแจ้งข่าว/กิจกรรมให้สมาชิก ข้อความหลักของแบรนด์คือ "อบอุ่นเหมือนบ้าน ชัดเจนเหมือนระบบ มีชีวิตเหมือนชุมชน" (`puntakit-dashboard-ops.skill`)

ระบบใช้กับคริสตจักรเดียว ตาราง `church_profile` มีแถวเดียว (`id = "main"`) (`shared/schema.ts`) ระบบไม่ใช่ multi-tenant

### 2.2 Architecture

| ส่วน | เทคโนโลยี | ตำแหน่ง |
|---|---|---|
| Client | React 19 SPA, wouter, Tailwind v4, shadcn/ui, Recharts, sonner | `client/src` |
| API | Express 4, cookie JWT, Zod validation | `server/app.ts`, `server/routes/*` |
| Database | PostgreSQL ผ่าน Drizzle ORM; driver `neon`, `postgres`, `pglite` (dev) | `server/db/*`, `shared/schema.ts` |
| Shared | Drizzle schema และ Zod schema ใช้ร่วมกัน client/server | `shared/` |
| Deploy แบบ A | Vercel: static client + serverless function `api/[...path].ts` | `vercel.json`, `api/` |
| Deploy แบบ B | Node: `pnpm build` แล้ว `pnpm start` (Express เสิร์ฟทั้ง API และ static) | `server/index.ts`, `DEPLOYMENT.md` |
| CI | GitHub Actions: `pnpm check` และ `pnpm test` ทุก push/PR | `.github/workflows/ci.yml` |

### 2.3 Database schema (14 ตาราง)

| กลุ่ม | ตาราง |
|---|---|
| Identity | `users`, `user_sessions`, `audit_logs` |
| People | `members` |
| Groups | `groups`, `group_members` |
| Attendance | `attendance_records` |
| Content | `announcements`, `events`, `event_registrations`, `ministries`, `church_profile` |
| Care | `prayer_requests` |
| Notification | `push_subscriptions` |

จุดสำคัญของ schema:

- `members` มีทั้งคอลัมน์ข้อความ `group` และความสัมพันธ์ผ่าน `group_members` มีแหล่งข้อมูลกลุ่ม 2 แหล่ง (E-60)
- `members.status` มี 2 ค่า: `ติดตามแล้ว` / `ต้องติดตาม` ไม่มีตารางประวัติการติดตาม (E-43)
- `groups` มี `privacy` (`public` / `private` / `confidential`), `latitude`, `longitude`, `maxMembers`, `isOpen`
- `attendance_records` เก็บ 1 แถวต่อสมาชิกต่อครั้ง มี `serviceType`, `groupId`, `status` (`present` / `absent` / `leave` / `online`), `checkInMethod`

### 2.4 API (ย่อ)

| Prefix | สิทธิ์ขั้นต่ำ | หน้าที่ |
|---|---|---|
| `/api/auth` | public (login) | login, logout, me, change-password |
| `/api/dashboard/summary` | login | จำนวนสมาชิกและประกาศล่าสุด |
| `/api/members` | login (สร้าง/แก้/ลบมีการจำกัด role) | CRUD, ค้นหา, CSV export, restore |
| `/api/groups` | login (สร้าง/ลบ: admin; แก้: admin, ministry_leader, ผู้นำกลุ่มนั้น) | CRUD กลุ่ม, จัดการสมาชิกในกลุ่ม |
| `/api/attendance` | login (ลบ: admin) | list, check-in, bulk, qr-scan, absentees, summary, export |
| `/api/me/*` | login | ข้อมูลของสมาชิกเอง (portal, profile, group, attendance, events, prayer, push) |
| `/api/announcements`, `/api/events`, `/api/ministries`, `/api/church-profile` | login (เขียน: admin) | CRUD เนื้อหา |
| `/api/health`, `/api/ready` | public | liveness / readiness |

### 2.5 Frontend routes

| Route | หน้า | แหล่งข้อมูล |
|---|---|---|
| `/login` | Login | API |
| `/` | Home dashboard (role `member` ถูก redirect ไป `/app`) | API + journey steps แบบ hardcoded |
| `/members` | Members | API |
| `/groups` | Groups | API |
| `/attendance` | Attendance (4 แท็บ: live, QR, absentees, reports) | API |
| `/events`, `/worship` | Events (2 route ใช้หน้าเดียวกัน) | API |
| `/announcements`, `/ministries`, `/church`, `/profile` | CRUD / profile | API |
| `/reports`, `/media`, `/settings` | ComingSoon | ไม่มี |
| `/app`, `/app/events`, `/app/group`, `/app/attendance`, `/app/profile` | Member PWA | API `/api/me/*` |
| `/privacy`, `/terms` | เอกสารกฎหมาย | ข้อความ hardcoded |

### 2.6 Authentication

- Login ด้วย email + password (bcrypt cost 12) ได้ JWT อายุ 7 วัน ใน cookie `puntakit_session` (`httpOnly`, `sameSite=lax`, `secure` เมื่อ production)
- Server ตรวจ session ในตาราง `user_sessions` ตรวจสถานะ `suspended` ทุก request
- Login มี rate limiter แบบ in-memory (`server/middleware/rateLimit.ts`)
- Client ใช้ `ProtectedRoute` ตรวจเพียงว่า login แล้ว ไม่ตรวจ role (E-12)
- ไม่มี OAuth, ไม่มี self-registration, ไม่มีการลืมรหัสผ่าน, ไม่มีการเชิญผู้ใช้ (E-10, E-11)

### 2.7 PWA

- `client/public/manifest.json` (`start_url: /app`, `lang: th`) และ `client/public/sw.js` (cache shell, API แบบ network-first, ตอบ `OFFLINE` เมื่อไม่มีเครือข่าย)
- Service worker ลงทะเบียนเฉพาะ production (`client/src/lib/pwa.ts`)
- Push: เก็บ subscription ได้ (`POST /api/me/push/subscribe`) แต่การส่งเป็นแบบจำลอง (`/push/send-test`) ไม่มี library web-push ใน `package.json` (E-45)
- ข้อมูลออฟไลน์: ไม่มีคิวบันทึกออฟไลน์ การเช็คชื่อขณะออฟไลน์จะล้มเหลว (E-46)

### 2.8 Group system

- Admin สร้าง/ลบกลุ่ม ผู้นำกลุ่ม (leaderId, coLeaderId หรือ role `leader`/`assistant_leader` ใน `group_members`) แก้ไขกลุ่มของตนเองได้
- สมาชิกในกลุ่มมี role: `leader`, `assistant_leader`, `host`, `member`
- ตำแหน่งของกลุ่ม `private`/`confidential` ถูกปิดบังสำหรับคนนอก (เฉพาะ location และพิกัด)
- ข้อมูล `lastAttendedAt` คำนวณจาก `attendance_records` ต่อสมาชิกต่อกลุ่ม
- ไม่มี: รายงานกลุ่ม, การขอเข้าร่วมกลุ่ม, การค้นหากลุ่มฝั่งสมาชิก, ช่องทางสื่อสารในกลุ่ม, ตัวชี้วัดสุขภาพกลุ่ม

### 2.9 Attendance system

- บันทึกได้ 3 วิธีจาก API: check-in ทีละคน, bulk, และ qr-scan
- QR ส่วนตัวของสมาชิกคือข้อความคงที่ `PK-MEM-{member uuid}` (E-25)
- หน้า Attendance รับ QR จากช่องข้อความ (สำหรับเครื่องยิงบาร์โค้ด) ไม่มีการเปิดกล้อง
- หน้า Attendance สร้าง "Session QR" แต่ไม่มี endpoint ให้สมาชิกสแกนเพื่อเช็คชื่อตนเอง (E-26)
- ตรวจหาผู้ขาดต่อเนื่อง N ครั้ง (`/absentees`) และปุ่มตั้งสถานะสมาชิกเป็น `ต้องติดตาม`
- UI ไม่ได้เรียก `/api/attendance/bulk` (E-32)

### 2.10 UI / design system

- Tailwind v4 + shadcn/ui 53 component + CSS ที่เขียนเองใน `client/src/index.css` (2,452 บรรทัด)
- Token หลักอยู่ใน `brand-spec.md` และ `design.md` (สีฟ้า/navy, ฟอนต์ Prompt, sidebar 240px, topbar 76px)
- Wireframe ใน `referend/` ใช้ palette อื่น (Warm Ivory `#FFF9EF`, ข้อความ `#332820`) และใช้ bottom nav 4 แท็บ "วันนี้ / พันธกิจ / คน / เมนู" ซึ่งไม่ตรงกับ PWA ปัจจุบัน (E-70)

---

## 3. Users and Roles

### 3.1 Role ในระบบ (Evidence)

`USER_ROLES` ใน `shared/schema.ts`: `super_admin`, `admin`, `ministry_leader`, `group_leader`, `staff`, `member`, `viewer`

| Role ในระบบ | สิทธิ์ที่โค้ดให้จริง |
|---|---|
| `super_admin` | ผ่านทุก `requireRole` |
| `admin` | CRUD ทุกอย่าง, ลบสมาชิก/กลุ่ม/บันทึกเข้าร่วม, ดูข้อมูลไม่ถูกปิดบัง |
| `staff` | สร้าง/แก้สมาชิก, ดูข้อมูลสมาชิกไม่ถูกปิดบัง |
| `ministry_leader` | แก้ไขทุกกลุ่ม, แก้ไขสมาชิก, export CSV |
| `group_leader` | แก้ไขกลุ่มของตนเอง, แก้ไขสมาชิก (ทุกคน ไม่จำกัดเฉพาะกลุ่มตน) (E-27) |
| `member` | ถูก redirect ไป `/app` แต่ API ส่วนใหญ่ยังเปิดให้ (E-20 ถึง E-24) |
| `viewer` | ไม่มีการจัดการพิเศษในโค้ด ได้สิทธิ์เท่า role ที่ login แล้วทั่วไป |

### 3.2 การจับคู่ role กับผู้ใช้ในโจทย์

| ผู้ใช้ในโจทย์ | Role ในระบบที่ใกล้ที่สุด | สถานะ |
|---|---|---|
| ผู้ดูแลคริสตจักร (ศิษยาภิบาล/ผู้บริหาร) | `admin`, `super_admin` | ใช้งานได้ (สร้างบัญชีได้ผ่าน seed เท่านั้น) |
| ผู้ดูแลกลุ่ม (ดูแลหลายกลุ่ม/หลายพื้นที่) | ไม่มี role ตรง ใกล้ `ministry_leader` | ไม่มี scope ตามพื้นที่ (I-03) |
| ผู้นำกลุ่ม | `group_leader` | สร้างบัญชีไม่ได้ (I-01) |
| สมาชิก | `member` | สร้างบัญชีไม่ได้ (I-01) |
| สมาชิกใหม่ / ผู้มาเยี่ยม | ไม่มีบัญชี เป็นแถว `members` ที่ `membershipStatus = visitor` | ไม่มีช่องทางเข้าระบบ |
| ผู้ดูแลพันธกิจ | `ministry_leader` | ตาราง `ministries` ไม่เชื่อมกับสมาชิกหรือกลุ่ม (E-61) |

---

## 4. Current Workflows

ขั้นตอนเรียงตามลำดับที่เกิดจริงในโค้ด

### W1 — เริ่มต้นระบบ

1. ผู้ติดตั้งตั้งค่า `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
2. ผู้ติดตั้งรัน `pnpm db:migrate` และ `pnpm db:seed-admin`
3. ระบบมีบัญชี `admin` 1 บัญชี ไม่มีวิธีสร้างบัญชีอื่นผ่าน UI

### W2 — บันทึกสมาชิก

1. เจ้าหน้าที่เปิด `/members` แล้วกดเพิ่ม
2. ระบบตรวจเบอร์/อีเมลซ้ำ (`/check-duplicate`)
3. เจ้าหน้าที่กรอกข้อมูล และเลือก checkbox consent
4. ระบบบันทึก และเขียน audit log

### W3 — จัดกลุ่ม

1. Admin สร้างกลุ่มที่ `/groups`
2. Admin เปิดกลุ่ม แล้วเลือกสมาชิกเพื่อเพิ่ม
3. รายชื่อสมาชิกให้เลือกมาจาก `GET /api/members?limit=200` ซึ่ง server ปฏิเสธ (สูงสุด 100) และ client อ่าน `.items` ซึ่ง server ไม่ส่ง (E-31) ผลที่ยืนยันด้วยการรันแอป: รายชื่อให้เลือกว่าง (E-31R)

### W4 — เช็คชื่อ

1. เจ้าหน้าที่เปิด `/attendance` เลือกประเภท, วันที่, กลุ่ม
2. แท็บ Live roster โหลด `GET /api/members?limit=300` และ `GET /api/attendance?limit=300` ทั้งสองค่าเกินขีดจำกัดของ server (100 และ 200) (E-30) ผลที่ยืนยันด้วยการรันแอป: หน้าแสดง "แสดงสมาชิก 0 คน" และ toast error (E-30R)
3. ทางเลือก: แท็บ QR รับรหัส `PK-MEM-…` จากเครื่องยิงบาร์โค้ด แล้วบันทึกทีละคน
4. ระบบบันทึก `checkedInBy` เป็นผู้ที่ login

### W5 — ติดตามผู้ขาด

1. เจ้าหน้าที่เปิดแท็บ absentees ตั้งค่า threshold
2. ระบบแสดงสมาชิกที่ขาด N ครั้งล่าสุดต่อเนื่อง
3. เจ้าหน้าที่กดตั้งสถานะ `ต้องติดตาม`
4. ไม่มีขั้นตอนต่อ: ไม่มีการมอบหมายผู้ติดตาม ไม่มีบันทึกผลการติดตาม ไม่มีการแจ้งเตือน (E-43)

### W6 — สมาชิกใช้ PWA (ทำได้เฉพาะเมื่อมีบัญชี)

1. สมาชิก login แล้วระบบ redirect ไป `/app`
2. ระบบผูกบัญชีกับแถว `members` ด้วย `userId` หรือจับคู่ email อัตโนมัติ (E-28)
3. สมาชิกดู QR ส่วนตัว, กิจกรรม, ลงทะเบียนกิจกรรม, ดูกลุ่มของตน (1 กลุ่ม), ดูประวัติเข้าร่วม, ส่งคำขออธิษฐาน

### W7 — คำขออธิษฐาน

1. สมาชิกส่งคำขอ และเลือก `isConfidential`
2. ระบบบันทึกลง `prayer_requests`
3. ไม่มี endpoint หรือหน้าสำหรับเจ้าหน้าที่อ่านหรือตอบคำขอ (E-47) คำขอไปไม่ถึงผู้ดูแล

---

## 5. Existing Capabilities

### 5.1 ทำงานแล้ว (จากโค้ด; ยังไม่ได้รันยืนยัน)

- Login/logout, session revoke, change password, audit log ของการกระทำหลัก
- CRUD สมาชิก, ค้นหา, filter, sort, pagination, soft delete, restore, CSV export (มีการจำกัด role)
- ปิดบังเบอร์/อีเมล/ที่อยู่ใน `GET /api/members` สำหรับ role ที่ไม่ใช่ admin/staff/ผู้นำที่ได้รับมอบหมาย
- CRUD กลุ่ม, สิทธิ์แก้ไขกลุ่มตาม ownership, ปิดบังตำแหน่งกลุ่ม private/confidential
- API เช็คชื่อ (single, bulk, QR), ป้องกันบันทึกซ้ำ, หา absentees, summary, CSV export
- CRUD ประกาศ, กิจกรรม, พันธกิจ, ข้อมูลคริสตจักร
- Member PWA: portal, profile (แก้ข้อมูลส่วนตัว), กลุ่ม, ประวัติเข้าร่วม, ลงทะเบียนกิจกรรม, ส่งคำขออธิษฐาน
- Health/readiness endpoint, graceful shutdown, fail-fast config ของฐานข้อมูล
- CI: type check และ vitest (109 test case)

### 5.2 ยังไม่เสร็จ

| รายการ | หลักฐาน |
|---|---|
| สร้าง/เชิญผู้ใช้, จัดการ role | E-10 |
| ลืมรหัสผ่าน | E-11 |
| หน้า `/reports`, `/media`, `/settings` | `client/src/App.tsx` ใช้ `ComingSoon` |
| ส่ง push notification จริง | E-45 |
| อ่าน/ตอบคำขออธิษฐานฝั่งเจ้าหน้าที่ | E-47 |
| สมาชิกเช็คชื่อตนเองด้วย Session QR | E-26 |
| สแกน QR ด้วยกล้อง | `client/src/pages/Attendance.tsx` ใช้ช่องข้อความ |
| แผนที่กลุ่ม | E-50 |
| การแจ้งเตือนใน Topbar | `Topbar.tsx` แสดง toast "ไม่มีการแจ้งเตือนใหม่" เสมอ |
| เมนูตาม role ใน Sidebar | `Sidebar.tsx` ไม่ตรวจ role |

### 5.3 Hardcoded / mock data

| รายการ | ตำแหน่ง |
|---|---|
| Discipleship journey 6 ขั้น (ข้อความเท่านั้น ไม่มีจำนวนคนต่อขั้น) | `client/src/pages/Home.tsx` (`journeySteps`) |
| Session QR payload มีชื่อ "Puntakit Kalasin" แบบคงที่ | `client/src/pages/Attendance.tsx` |
| เนื้อหา Privacy / Terms | `client/src/pages/Privacy.tsx`, `Terms.tsx` |
| ป้ายวิธีเช็คชื่อฝั่งสมาชิก (`qr_self`, `officer_scan`, `bulk_import`) ไม่ตรงกับค่าใน schema (`manual`, `qr_scan`, `self_qr`, `kiosk`) | `client/src/pages/member/MemberAttendance.tsx` |
| Dev JWT secret คงที่เมื่อไม่ได้ตั้งค่า (นอก production) | `server/lib/auth.ts` |

### 5.4 Technical debt

| รายการ | ผล |
|---|---|
| `CLAUDE.md` บอกว่า server ไม่มี API และข้อมูลเป็น mock | agent/นักพัฒนาได้ข้อมูลผิด (E-01) |
| ข้อมูลกลุ่มมี 2 แหล่ง: `members.group` (ข้อความ) และ `group_members` | ตัวเลขกลุ่มไม่ตรงกันได้ (E-60) |
| Dashboard ใช้ชื่อตัวแปร `inGroupResult` แต่นับ `membershipStatus = active` | ตัวชี้วัดสื่อความหมายผิด (E-42) |
| Test สิทธิ์เขียนฟังก์ชันจำลองใน test เอง ไม่ได้เรียก route จริง | test ผ่านได้แม้ route ไม่มีการตรวจสิทธิ์ (E-29) |
| `groupQuerySchema` มี `page`/`limit` แต่ route ไม่ใช้ | ส่งทุกกลุ่มทุกครั้ง |
| Rate limiter เก็บใน memory ของ process | บน Vercel serverless แต่ละ instance นับแยกกัน (I-07) |
| มี 2 วิธี deploy (Vercel และ Node) | ต้องดูแล 2 เส้นทาง |
| Branch ค้างที่ไม่ merge: `feat/mission-feed-design-system`, `manus/production-core` (Supabase), `manus/puntakit-auth-bulk-edit`, `claude/affectionate-mayer-47gfd7` | ทิศทางผลิตภัณฑ์ซ้อนกัน (E-51, E-52) |
| palette ใน wireframe ไม่ตรงกับ `brand-spec.md` | E-70 |

---

## 6. Evidence

### 6.1 เอกสารและโครงสร้าง

- **E-01** `CLAUDE.md` บอกว่า `server/index.ts` "has no routes, database, or business logic" แต่ `server/app.ts` ลงทะเบียน 10 router และ `shared/schema.ts` มี 14 ตาราง
- **E-02** Git history มี commit ที่ตั้งชื่อตาม phase: `feat(phase-1): enterprise RBAC…`, `feat(phase-2): groups management, attendance tracking, qr check-in…`, `feat(pwa): complete mobile-first member portal…`

### 6.2 Identity และสิทธิ์

- **E-10** `createUser()` ใน `server/routes/auth.ts` มี comment "Exposed only for the seed script" และมีผู้เรียกเพียง `server/scripts/seed-admin.ts` ซึ่งสร้าง role `admin` เท่านั้น ไม่มี endpoint `POST /api/users` หรือ `/register`
- **E-11** `server/routes/auth.ts` มีเพียง `login`, `logout`, `me`, `change-password`
- **E-12** `client/src/components/ProtectedRoute.tsx` ตรวจเพียง `user` มีค่า ไม่ตรวจ role
- **E-13** `client/src/pages/Home.tsx` redirect role `member` ไป `/app` แต่ route admin อื่น (`/members`, `/groups`, `/attendance`) ไม่ redirect

### 6.3 ความเป็นส่วนตัวและการเข้าถึงข้อมูล

- **E-20** `GET /api/groups/:id` และ `GET /api/groups/:id/members` (`server/routes/groups.ts`) ส่ง `memberPhone` เต็ม, `pastoralStatus` และ `lastAttendedAt` ของสมาชิกทุกคน ให้ผู้ใช้ที่ login ทุกคน ไม่ตรวจ role ไม่ตรวจการเป็นสมาชิกกลุ่ม และไม่ตรวจ `privacy` ของกลุ่ม
- **E-21** `GET /api/groups` แสดงชื่อและ `leaderEmail` ของทุกกลุ่ม รวมกลุ่ม `confidential` ต่อผู้ใช้ทุกคน (ปิดบังเฉพาะตำแหน่ง)
- **E-22** `GET /api/attendance` และ `GET /api/attendance/export` (`server/routes/attendance.ts`) ไม่มี `requireRole` ส่งชื่อ เบอร์โทร กลุ่ม และสถานะเข้าร่วมของทุกคน
- **E-23** `POST /api/attendance/check-in`, `/bulk`, `/qr-scan` ไม่มี `requireRole` และไม่ตรวจว่าผู้เรียกดูแลกลุ่มนั้น ผู้ใช้ role `member` บันทึกการเข้าร่วมแทนสมาชิกคนใดก็ได้
- **E-24** `GET /api/members` เปิดให้ทุก role ที่ login ฟังก์ชัน `maskSensitiveData` ปิดบังเบอร์/อีเมล/ที่อยู่/ผู้ติดต่อฉุกเฉิน/notes แต่ไม่ปิดบัง `birthDate`, `lineId`, `gender`, `status` (ต้องติดตาม) การค้นหา `search` เทียบกับเบอร์โทรจริงด้วย `ilike` ผู้ใช้จึงทดสอบเบอร์โทรทีละส่วนได้ `GET /api/members/check-duplicate` เปิดให้ทุก role
- **E-25** QR ส่วนตัวคือ `PK-MEM-{member.id}` (`server/routes/portal.ts`, `client/src/pages/Members.tsx`) ไม่มีวันหมดอายุ ไม่มีลายเซ็น
- **E-26** Session QR ใน `Attendance.tsx` สร้างจาก `JSON.stringify({church, service, date, groupId})` ไม่มี endpoint ฝั่งสมาชิกที่รับ payload นี้
- **E-27** `PUT /api/members/:id` อนุญาต `group_leader` และ `ministry_leader` โดยไม่ตรวจว่าสมาชิกอยู่ในกลุ่มของผู้แก้ไข
- **E-28** `getLinkedMember()` ใน `server/routes/portal.ts` ผูก `members.userId` อัตโนมัติเมื่อ email ของ user ตรงกับ email ของ member
- **E-29** `server/routes/groups.test.ts` และ `attendance.test.ts` ทดสอบสิทธิ์ด้วยฟังก์ชันที่เขียนใน test (`canManage`) หรือเรียก `requireRole` ตรง ไม่ได้ส่ง request ที่มี token ของ role ต่าง ๆ ไปยัง route
- **E-2A** `consentGiven` ถูกบันทึกเป็นค่า boolean และวันที่ ไม่มีโค้ดใดใช้ค่านี้เพื่อจำกัดการแสดงผล การ export หรือการติดต่อ

### 6.4 ข้อบกพร่องใน workflow หลัก

- **E-30** `client/src/pages/Attendance.tsx` เรียก `/api/members?limit=300` (server สูงสุด 100 ใน `memberQuerySchema`) และ `/api/attendance?…limit=300` (server สูงสุด 200 ใน `attendanceQuerySchema`) server ตอบ 400 เมื่อ Zod ไม่ผ่าน
- **E-31** `Attendance.tsx` และ `Groups.tsx` อ่าน `res.items` แต่ `GET /api/members` ส่ง `data` เป็น array และ `client/src/lib/api.ts` คืนค่า `res.data` โดยตรง `Groups.tsx` เรียก `/api/members?limit=200` ซึ่งเกินขีดจำกัดเช่นกัน
- **E-32** ไม่มีไฟล์ใน `client/src` เรียก `/api/attendance/bulk`

### 6.5 ข้อมูลเพื่อการดูแล

- **E-40** `GET /api/dashboard/summary` คืนค่า: `totalMembers`, `newThisMonth`, `needFollowUp`, `followedUp`, `activeMembers`, สมาชิกล่าสุด 5 คน, ประกาศ 3 รายการ ไม่มีข้อมูลการเข้าร่วม ไม่มีข้อมูลกลุ่ม
- **E-41** กราฟใน `Home.tsx` แสดงจำนวนสมาชิก 5 แท่ง ไม่มีแกนเวลา
- **E-42** `server/routes/dashboard.ts` ตัวแปร `inGroupResult` นับ `membershipStatus = "active"` ไม่ได้นับ `group_members`
- **E-43** การติดตามสมาชิกเก็บเป็นค่าเดียว `members.status` ไม่มีตารางบันทึกว่าใครติดตาม เมื่อไร ผลเป็นอย่างไร
- **E-44** `GET /api/attendance/summary` นับจำนวนแถว `present`/`online` ของสัปดาห์นี้และทั้งหมด ไม่แยกตามกลุ่ม
- **E-45** `package.json` ไม่มี library `web-push` และ endpoint `/push/send-test` มี comment "Simulates sending push"
- **E-46** `client/public/sw.js` ไม่ intercept request ที่ไม่ใช่ GET ไม่มี background sync
- **E-47** `prayer_requests` ถูกอ่านเฉพาะใน `GET /api/me/prayer-requests/my` (เฉพาะของผู้ส่งเอง)
- **E-48** `GET /api/me/group` ใช้ `.limit(1)` และไม่กรอง `groupMembers.status = active` สมาชิกที่อยู่หลายกลุ่มเห็นเพียง 1 กลุ่ม และอาจเห็นกลุ่มที่ออกไปแล้ว

### 6.6 Map, Feed และทิศทางที่ค้าง

- **E-50** `client/src/components/Map.tsx` (Google Maps ผ่าน Manus proxy) ไม่มีไฟล์ใด import ตาราง `groups` มี `latitude`/`longitude` เป็นข้อความ
- **E-51** Branch `origin/feat/mission-feed-design-system` มี 5 commit (FaithMap mission feed, `MissionFeed.tsx`) ยังไม่ merge
- **E-52** Branch `origin/manus/production-core` มี 3 commit ที่เชื่อม Supabase ซึ่งเป็นสถาปัตยกรรมอื่นจาก `main` (Neon/Drizzle/Express)
- **E-53** Wireframe (`referend/…Wireframe…md`) มีการ์ด "มีเรื่องราวจากสัปดาห์นี้ไหม? ใช้เวลาเพียง 2 นาที [เริ่มรายงาน]" และปุ่ม "รายงานพันธกิจ" ไม่มีโค้ดที่ implement การรายงานนี้

### 6.7 ข้อมูลอื่น

- **E-60** `members.group` เป็น `text` และ `group_members` เป็นตารางความสัมพันธ์ `GET /api/members?group=` กรองด้วยคอลัมน์ข้อความ
- **E-61** ตาราง `ministries` มี `leader` เป็นข้อความ ไม่มี foreign key ไปยัง `users` หรือ `members`
- **E-70** `brand-spec.md` ใช้ Canvas `#F4F8FC` และสีฟ้า; wireframe ใช้ `#FFF9EF` และสีน้ำตาล

### 6.8 การยืนยันด้วยการรันแอป (2026-09-23)

สภาพแวดล้อมที่ใช้:

1. รัน API server (`server/index.ts`) กับ PGlite ในเครื่อง โดยเก็บฐานข้อมูลไว้นอก repo
2. สร้างบัญชี admin ด้วย `server/scripts/seed-admin.ts`
3. สร้างสมาชิก 3 คนและกลุ่ม 1 กลุ่มผ่าน API
4. Build client ด้วย `vite build` แล้วใช้ Chromium (Playwright) login และเปิดหน้า `/attendance` และ `/groups`
5. ไม่แก้ source code

- **E-30R** สาเหตุที่ 1 (ค่า `limit`) ยืนยันแล้ว:
  - `GET /api/members?limit=300` ตอบ `400 VALIDATION_ERROR` "Too big: expected number to be <=100"
  - `GET /api/attendance?…&limit=300` ตอบ `400` "Too big: expected number to be <=200"
  - `GET /api/members?limit=200` (จาก `Groups.tsx`) ตอบ `400` "Too big: expected number to be <=100"
  - หน้า `/attendance` แสดง "แสดงสมาชิก 0 คน" ตัวนับทุกช่องเป็น 0 และแสดง toast "โหลดข้อมูลเช็คชื่อไม่สำเร็จ" ขณะที่ฐานข้อมูลมีสมาชิก 3 คน
- **E-31R** สาเหตุที่ 2 (อ่าน `.items`) ยืนยันแล้วแยกจากสาเหตุที่ 1:
  - ผมแก้ค่า `limit` ใน request ของเบราว์เซอร์เป็น 100 และ 200 โดยไม่แก้ source code
  - server ตอบ `200` พร้อม `data` เป็น array ของสมาชิก 3 คน และไม่มี field `items`
  - หน้า `/attendance` ยังแสดง "แสดงสมาชิก 0 คน" (ไม่มี toast error)
  - ช่องเลือกสมาชิกในหน้าต่าง "สมาชิกในกลุ่ม" ของ `/groups` มีเพียงตัวเลือก "-- เลือกสมาชิกเพื่อเพิ่มเข้ากลุ่ม --"
  - สรุป: ถ้าแก้เพียงสาเหตุเดียว ปัญหายังไม่หาย
- **E-34** Service worker ลงทะเบียนใน build ที่รันในเครื่องด้วย แม้ server ไม่ได้ตั้ง `NODE_ENV=production` สาเหตุคือ Vite แทนค่า `process.env.NODE_ENV` ใน `client/src/lib/pwa.ts` เป็น `"production"` ตอน build ผลคือ request `/api/*` ผ่าน service worker และเครื่องมือดักจับ request ในเบราว์เซอร์ (เช่น Playwright `page.route`) ไม่เห็น request เหล่านี้ ถ้าไม่ปิด service worker

---

## 7. Inferences

- **I-01** จาก E-10: ตอนนี้ผู้นำกลุ่มและสมาชิก login ไม่ได้ ยกเว้นมีคนแก้ฐานข้อมูลโดยตรง ผู้ใช้จริงของระบบตอนนี้คือ admin เท่านั้น ดังนั้น Member PWA และสิทธิ์ของ `group_leader` ยังไม่เคยถูกใช้จริงในงานประจำ
- **I-02** จาก I-01: งาน attendance ทั้งหมดต้องทำโดย admin หรือเจ้าหน้าที่ที่มีบัญชี admin คนกลุ่มเล็กจำนวนน้อยต้องรับภาระบันทึกข้อมูลของทุกกลุ่ม
- **I-03** จาก 3.1: ไม่มี role ที่จำกัดสิทธิ์ตามพื้นที่หรือตามชุดกลุ่ม "ผู้ดูแลกลุ่ม" ที่ดูแลหลายกลุ่มต้องได้ `ministry_leader` ซึ่งแก้ไขทุกกลุ่มได้
- **I-04** จาก E-20 ถึง E-24: ถ้าเปิดบัญชีให้สมาชิกโดยไม่แก้สิทธิ์ API ก่อน สมาชิกทุกคนจะเข้าถึงเบอร์โทรของสมาชิกทั้งคริสตจักรและสถานะการติดตามดูแลได้ ความเสี่ยงนี้จะเกิดขึ้นทันทีที่ปัญหา I-01 ถูกแก้
- **I-05** จาก E-30R, E-31R: หน้า Live roster และตัวเลือกสมาชิกในหน้ากลุ่มแสดงรายชื่อว่าง (ยืนยันแล้ว) ดังนั้นข้อมูล `group_members` และ `attendance_records` ใน production (ถ้ามี) น่าจะมาจากช่องทาง QR หรือการแก้ฐานข้อมูลโดยตรงเท่านั้น
- **I-06** จาก E-40 ถึง E-44: ระบบตอบได้ว่า "มีสมาชิกกี่คน" แต่ตอบไม่ได้ว่า "กลุ่มไหนกำลังอ่อนแรง" "ใครหายไป 3 สัปดาห์" "ผู้นำกลุ่มส่งรายงานหรือยัง"
- **I-07** จาก rate limiter ใน memory และ deploy แบบ Vercel serverless: การจำกัดการ login ผิดซ้ำไม่มีผลที่เชื่อถือได้บน Vercel
- **I-08** จาก E-25: ผู้ที่ได้ภาพ QR ของสมาชิก (เช่น ภาพหน้าจอที่ส่งใน LINE) ใช้ภาพนั้นเช็คชื่อแทนได้ตลอดไป ตัวเลขการเข้าร่วมจึงถูกบิดได้
- **I-09** จาก E-47: สมาชิกที่ส่งคำขออธิษฐานคาดว่าจะมีคนอ่าน แต่ไม่มีคนอ่าน ความเชื่อมั่นต่อระบบลดลงเมื่อสมาชิกรู้
- **I-10** จาก E-50, E-51, E-53: ทีมเคยเริ่มทิศทาง Map และ Feed แล้ว แต่ไม่มีเอกสารใดบันทึกปัญหาผู้ใช้ที่ทำให้ต้องมี 2 ฟีเจอร์นี้ ทิศทางเหล่านี้มาจากไอเดีย ไม่ใช่จากหลักฐาน
- **I-11** จาก E-29: CI ที่ผ่านไม่ได้พิสูจน์ว่าการควบคุมสิทธิ์ของ API ถูกต้อง

---

## 8. Hypotheses

ทุกข้อต้อง validate ก่อนใช้ตัดสินใจ

| รหัส | Hypothesis | วิธี validate ที่เสนอ |
|---|---|---|
| H-01 | ผู้นำกลุ่มบันทึกการเข้าร่วมและรายงานกลุ่มผ่านช่องทางอื่นอยู่แล้ว (เช่น LINE group, กระดาษ, Google Sheet) | สัมภาษณ์ผู้นำกลุ่ม 5 คน ขอดูตัวอย่างรายงานจริง |
| H-02 | ผู้ดูแลคริสตจักรต้องการรู้ "กลุ่มไหนต้องการความช่วยเหลือ" มากกว่า "จำนวนสมาชิกรวม" | สัมภาษณ์ศิษยาภิบาล/ผู้ดูแล 2–3 คน ถามการตัดสินใจล่าสุดที่ใช้ข้อมูลกลุ่ม |
| H-03 | สมาชิกที่ขาด 2–3 ครั้งติดต่อกันมีความเสี่ยงหายจากคริสตจักร และการติดตามภายใน 1–2 สัปดาห์ช่วยได้ | ดูข้อมูลการเข้าร่วมย้อนหลัง (ถ้ามี) และถามผู้นำกลุ่มเรื่องกรณีจริง |
| H-04 | ผู้นำกลุ่มส่วนใหญ่ใช้โทรศัพท์มือถือ ไม่ใช้คอมพิวเตอร์ | ถามโดยตรง และดูอุปกรณ์ขณะประชุมกลุ่ม |
| H-05 | การเช็คชื่อในกลุ่มแคร์ (5–15 คน) ทำได้เร็วกว่าด้วยรายชื่อ + แตะ มากกว่า QR | ทดลองจับเวลาใน 1–2 กลุ่ม |
| H-06 | สมาชิกใหม่หากลุ่มผ่านการแนะนำจากคน ไม่ใช่การค้นหาเอง | ถามสมาชิกใหม่ 5 คนว่าเข้ากลุ่มได้อย่างไร |
| H-07 | Map ไม่จำเป็นสำหรับคริสตจักรเดียวในจังหวัดเดียว รายชื่อพื้นที่ (อำเภอ/ตำบล) พอ | ถามจำนวนกลุ่ม การกระจายพื้นที่ และวิธีที่คนใหม่ถามทางปัจจุบัน |
| H-08 | กลุ่มสื่อสารกันใน LINE อยู่แล้ว Feed ในแอปจะแข่งกับ LINE และมีผู้ใช้น้อย | ถามว่าแต่ละกลุ่มใช้ช่องทางใด ใช้บ่อยแค่ไหน |
| H-09 | สมาชิกกังวลเรื่องการเปิดเผยเบอร์โทร ที่อยู่ และคำขออธิษฐาน | ถามสมาชิก และตรวจกับข้อกำหนด PDPA กับผู้รู้ด้านกฎหมาย |
| H-10 | admin ที่ใช้งานมีเพียง 1–2 คน และเป็นคอขวดของการบันทึกข้อมูล | ถามผู้ดูแลระบบปัจจุบัน |

---

## 9. Unknowns

- **U-01** ระบบ deploy ใช้งานจริงแล้วหรือไม่ ใช้ Vercel หรือ Node และมีข้อมูลจริงกี่แถว
- **U-02** จำนวนสมาชิก จำนวนกลุ่ม จำนวนผู้นำกลุ่ม ขนาดกลุ่มเฉลี่ย
- **U-03** ใครใช้ระบบตอนนี้ ใช้บ่อยแค่ไหน ใช้หน้าใด (ไม่มี analytics ใน repo)
- **U-04** กลุ่มประชุมบ่อยแค่ไหน (ทุกสัปดาห์? ทุก 2 สัปดาห์?) และประชุมที่ใด (บ้าน, คริสตจักร, ออนไลน์)
- **U-05** โครงสร้างการดูแลจริง: มีระดับ "ผู้ดูแลกลุ่ม/ผู้ดูแลพื้นที่" ระหว่างศิษยาภิบาลกับผู้นำกลุ่มหรือไม่
- **U-06** คริสตจักรต้องการรายงานใด ส่งให้ใคร ความถี่เท่าใด
- **U-07** ความหมายของ "สุขภาพกลุ่ม" ในมุมของคริสตจักรนี้ (การเข้าร่วม? คนใหม่? การอธิษฐาน? การแบ่งกลุ่ม?)
- **U-08** นโยบายความเป็นส่วนตัวที่คริสตจักรใช้จริง และใครมีสิทธิ์เห็นข้อมูลใด
- **U-09** Branch ใดเป็นทิศทางที่ทีมเลือก (`main` Neon/Express หรือ `manus/production-core` Supabase) และ Feed/Map branch ยังอยู่ในแผนหรือไม่
- **U-10** เนื้อหาของ "PUNTAKIT PRODUCT + DESIGN ENGINEERING WORKFLOW" ไม่อยู่ใน repo ผมใช้เฉพาะข้อกำหนดของ Phase 0 และ Phase 1 ที่อยู่ในคำสั่ง
- **U-11** ~~ข้อบกพร่อง E-30/E-31 เกิดจริงในเบราว์เซอร์หรือไม่~~ ปิดแล้ว: ยืนยันว่าเกิดจริง (E-30R, E-31R)

---

## 10. User Jobs

รูปแบบ: เมื่อ [สถานการณ์] ฉันต้องการ [การกระทำ] เพื่อ [ผลลัพธ์] ทุกข้อเป็น Hypothesis จนกว่าจะสัมภาษณ์ผู้ใช้

| รหัส | User | Job |
|---|---|---|
| J-01 | ผู้ดูแลคริสตจักร | เมื่อเริ่มสัปดาห์ ฉันต้องการเห็นว่ากลุ่มใดและสมาชิกคนใดต้องการความช่วยเหลือ เพื่อจัดคนไปดูแลได้ทันเวลา |
| J-02 | ผู้ดูแลคริสตจักร | เมื่อประชุมผู้นำ ฉันต้องการตัวเลขการเข้าร่วมและการเติบโตที่เชื่อถือได้ เพื่อตัดสินใจเรื่องการเปิด/แบ่ง/รวมกลุ่ม |
| J-03 | ผู้ดูแลกลุ่ม | เมื่อดูแลหลายกลุ่ม ฉันต้องการรู้ว่ากลุ่มใดไม่ได้ประชุมหรือไม่ได้รายงาน เพื่อติดต่อผู้นำกลุ่มนั้น |
| J-04 | ผู้นำกลุ่ม | เมื่อประชุมกลุ่มเสร็จ ฉันต้องการบันทึกว่าใครมาและเรื่องสำคัญ ภายในเวลาสั้น เพื่อไม่เพิ่มภาระและให้ผู้ดูแลรู้ |
| J-05 | ผู้นำกลุ่ม | เมื่อสมาชิกขาด ฉันต้องการได้รับการเตือนและบันทึกว่าติดตามแล้ว เพื่อไม่ให้ใครหายไปโดยไม่มีคนรู้ |
| J-06 | สมาชิก | เมื่อต้องการรู้กำหนดการ ฉันต้องการเห็นเวลาและสถานที่ของกลุ่มและกิจกรรม เพื่อไปร่วมได้ |
| J-07 | สมาชิก | เมื่อมีเรื่องส่วนตัว ฉันต้องการส่งคำขออธิษฐานถึงคนที่ไว้ใจ เพื่อได้รับการดูแลโดยไม่ถูกเปิดเผย |
| J-08 | สมาชิกใหม่ | เมื่อเริ่มมาคริสตจักร ฉันต้องการหากลุ่มที่ใกล้บ้านหรือเหมาะกับวัย เพื่อมีเพื่อนและได้รับการดูแล |
| J-09 | ผู้ดูแลพันธกิจ | เมื่อจัดทีมรับใช้ ฉันต้องการรู้ว่าใครอยู่ในพันธกิจใดและว่างหรือไม่ เพื่อจัดคนได้ครบ |

---

## 11. User Problems

โครงสร้าง: User → Job → Problem → Evidence → ระดับความมั่นใจ

| รหัส | User | Job | Problem | Evidence ในระบบ | ระดับ |
|---|---|---|---|---|---|
| P-01 | ผู้ดูแลคริสตจักร | J-01, J-02 | ระบบไม่แสดงสถานะรายกลุ่ม ไม่มีแนวโน้มการเข้าร่วม ไม่มีรายงานกลุ่ม | E-40, E-41, E-44, `/reports` เป็น ComingSoon | Evidence (ระบบขาด) + Hypothesis (ผู้ใช้ต้องการ: H-02) |
| P-02 | ผู้นำกลุ่ม | J-04 | ผู้นำกลุ่มเข้าระบบไม่ได้ จึงบันทึกเองไม่ได้ | E-10 | Evidence |
| P-03 | เจ้าหน้าที่ | J-04 | หน้าเช็คชื่อแบบรายชื่อไม่โหลดรายชื่อ และเพิ่มสมาชิกเข้ากลุ่มผ่าน UI ไม่ได้ | E-30, E-31, E-30R, E-31R | Evidence (ยืนยันด้วยการรันแอป) |
| P-04 | ผู้นำกลุ่ม / ผู้ดูแล | J-05 | การติดตามผู้ขาดหยุดที่ป้าย `ต้องติดตาม` ไม่มีผู้รับผิดชอบ ไม่มีบันทึกผล | E-43, W5 | Evidence (ระบบขาด) + Hypothesis (ผลกระทบ: H-03) |
| P-05 | สมาชิก | J-07 | คำขออธิษฐานไม่ถึงผู้ดูแล | E-47 | Evidence |
| P-06 | สมาชิก | J-07 | ข้อมูลส่วนตัวรั่วไปยังผู้ใช้ทุก role เมื่อเปิดบัญชีให้สมาชิก | E-20 ถึง E-24, I-04 | Evidence |
| P-07 | ผู้ดูแลคริสตจักร | J-02 | ตัวเลขการเข้าร่วมถูกบิดได้ (QR คงที่, ทุกคนเช็คชื่อแทนได้) | E-23, E-25, I-08 | Evidence |
| P-08 | ผู้ดูแลกลุ่ม | J-03 | ไม่มี role ที่ดูแลเฉพาะชุดกลุ่ม | I-03 | Evidence |
| P-09 | สมาชิกใหม่ | J-08 | ไม่มีทางหากลุ่มหรือขอเข้ากลุ่มในระบบ | ไม่มี endpoint/หน้า | Evidence (ระบบขาด) + Hypothesis (ผู้ใช้ต้องการ: H-06) |
| P-10 | สมาชิก | J-06 | สมาชิกหลายกลุ่มเห็นเพียง 1 กลุ่ม และอาจเห็นกลุ่มที่ออกแล้ว | E-48 | Evidence |
| P-11 | ผู้ดูแลพันธกิจ | J-09 | ตารางพันธกิจไม่เชื่อมกับคน | E-61 | Evidence (ระบบขาด) + Unknown (ความต้องการ) |
| P-12 | ผู้ดูแลคริสตจักร | J-02 | ตัวชี้วัดบน dashboard สื่อความหมายไม่ตรง (activeMembers ไม่ใช่ "อยู่ในกลุ่ม") และข้อมูลกลุ่มมี 2 แหล่ง | E-42, E-60 | Evidence |

หมายเหตุ: ไม่มีปัญหาใดในตารางที่มีหลักฐานว่าต้องแก้ด้วย Map หรือ Feed

---

## 12. Opportunity Areas

Opportunity คือพื้นที่ที่ควรลงทุนถ้า validation ยืนยัน ยังไม่ใช่ฟีเจอร์

| รหัส | Opportunity | ปัญหาที่เกี่ยวข้อง | เงื่อนไขก่อนเริ่ม |
|---|---|---|---|
| O-01 | ทำให้ข้อมูลส่วนตัวปลอดภัยก่อนเปิดบัญชีให้ผู้ใช้เพิ่ม | P-06, P-07 | ไม่ต้องรอ validation เพราะเป็นความเสี่ยงที่มีหลักฐานในโค้ด |
| O-02 | ให้ผู้นำกลุ่มเข้าระบบและบันทึกการเข้าร่วมของกลุ่มตนเองได้ | P-02, P-03 | ยืนยัน H-01, H-04, H-05 และทำ O-01 ก่อน |
| O-03 | เปลี่ยนการติดตามผู้ขาดจาก "ป้าย" เป็น "งานที่มีเจ้าของและผลลัพธ์" | P-04 | ยืนยัน H-03 และ U-05 |
| O-04 | ให้ผู้ดูแลเห็นสถานะรายกลุ่มจากข้อมูลการเข้าร่วมจริง | P-01, P-12 | ต้องมีข้อมูลการเข้าร่วมที่เชื่อถือได้ก่อน (O-02) และนิยาม U-07 |
| O-05 | ปิดวงจรคำขออธิษฐาน | P-05 | ตัดสินใจว่าใครควรเห็นคำขอ (U-08) |
| O-06 | ช่วยสมาชิกใหม่เข้ากลุ่ม | P-09 | ยืนยัน H-06, H-07 |
| O-07 | แก้ความถูกต้องของข้อมูลพื้นฐาน (แหล่งข้อมูลกลุ่มเดียว, ตัวชี้วัดที่ถูกชื่อ, สมาชิกหลายกลุ่ม) | P-10, P-12 | ไม่ต้องรอ validation |

ลำดับที่มีเหตุผล: O-01 และ O-07 เป็นฐาน → O-02 ให้เกิดข้อมูล → O-03 และ O-04 ใช้ข้อมูล → O-05, O-06 ตามผล validation

---

## 13. Potential Solutions

ตัวเลือกด้านล่างเป็นแนวทางเพื่อใช้ในการ validate เท่านั้น ไม่ใช่ feature definition ไม่มีการเลือก

| Opportunity | แนวทางที่เป็นไปได้ | ข้อพิจารณา |
|---|---|---|
| O-01 | จำกัด API attendance/group members ตาม role และความเป็นผู้นำกลุ่ม; ปิดบัง field ตาม role; เปลี่ยน QR เป็นแบบมีลายเซ็นหรือหมดอายุ; เพิ่ม test ที่เรียก route จริงด้วย token หลาย role | ต้องนิยาม "ใครเห็นอะไร" ให้ชัดก่อน (คำถาม Q-08) |
| O-02 | (ก) admin สร้างบัญชี/ส่งคำเชิญ (ข) login ด้วย LINE (ค) ลิงก์เฉพาะกลุ่มสำหรับเช็คชื่อโดยไม่ต้องมีบัญชี | ขึ้นกับ H-01, H-04 และระดับความปลอดภัยที่คริสตจักรยอมรับ |
| O-03 | มอบหมายผู้ติดตาม + บันทึกผลสั้น ๆ + สถานะปิดงาน | ต้องรู้โครงสร้างการดูแล (U-05) |
| O-04 | สรุปรายกลุ่ม: อัตราเข้าร่วม 4–8 สัปดาห์, คนขาดต่อเนื่อง, คนใหม่, วันที่รายงานล่าสุด | นิยามตัวชี้วัดกับผู้ดูแลก่อน (U-07) |
| O-05 | ส่งคำขอไปยังผู้นำกลุ่มหรือศิษยาภิบาลตามการเลือกของสมาชิก | ข้อมูลอ่อนไหวสูง ต้องมีนโยบายก่อน |
| O-06 | รายชื่อกลุ่มที่เปิดรับตามพื้นที่/วัน/กลุ่มอายุ + ปุ่มติดต่อผู้นำ; Map เป็นทางเลือกหลังพิสูจน์ว่ารายชื่อไม่พอ | Map มีต้นทุน (API key, พิกัด, ความเป็นส่วนตัวของบ้านที่ใช้ประชุม) |
| O-07 | ใช้ `group_members` เป็นแหล่งเดียว; ตั้งชื่อตัวชี้วัดตามสิ่งที่นับจริง; ให้ portal แสดงทุกกลุ่มที่ active | งาน data migration ต้องวางแผน |

---

## 14. Risks

### 14.1 Security / privacy risk

| รหัส | ความเสี่ยง | ระดับ | หลักฐาน |
|---|---|---|---|
| R-S1 | ผู้ใช้ทุก role อ่านเบอร์โทรเต็มและสถานะการติดตามของสมาชิกทุกกลุ่ม รวมกลุ่ม confidential | สูง | E-20 |
| R-S2 | ผู้ใช้ทุก role อ่านและ export บันทึกการเข้าร่วมพร้อมเบอร์โทรของทุกคน | สูง | E-22 |
| R-S3 | ผู้ใช้ทุก role บันทึกการเข้าร่วมแทนคนอื่น | สูง | E-23 |
| R-S4 | QR ส่วนตัวไม่มีวันหมดอายุ | กลาง | E-25 |
| R-S5 | ค้นหาสมาชิกด้วยเบอร์โทรจริงได้แม้ผลถูกปิดบัง; `birthDate` และ `lineId` ไม่ถูกปิดบัง | กลาง | E-24 |
| R-S6 | ผูกบัญชีกับสมาชิกด้วย email อัตโนมัติ ถ้า email ใน `members` ผิด บัญชีอื่นจะเห็นข้อมูลของสมาชิกนั้น | กลาง | E-28 |
| R-S7 | `group_leader` แก้ไขข้อมูลสมาชิกนอกกลุ่มตนได้ | กลาง | E-27 |
| R-S8 | Consent ถูกเก็บแต่ไม่มีผลกับการใช้ข้อมูล (ประเด็น PDPA) | กลาง | E-2A |
| R-S9 | Login rate limit ไม่มีผลบน serverless | กลาง | I-07 |
| R-S10 | Test ไม่ครอบคลุมการตรวจสิทธิ์ของ route จริง | กลาง | E-29 |

### 14.2 Product risk

- **R-P1** สร้างฟีเจอร์ (Map, Feed, Group Health) ก่อนที่ผู้นำกลุ่มจะเข้าระบบได้ ฟีเจอร์จะไม่มีข้อมูลและไม่มีผู้ใช้ (I-01)
- **R-P2** Feed ในแอปแข่งกับ LINE ที่สมาชิกใช้อยู่แล้ว (H-08)
- **R-P3** ตัวชี้วัดที่ผิดความหมายทำให้ผู้ดูแลตัดสินใจผิด (E-42)
- **R-P4** ทิศทางสถาปัตยกรรมซ้อนกันหลาย branch (Supabase vs Neon) ทำให้งานซ้ำ (E-52, U-09)
- **R-P5** เอกสาร `CLAUDE.md` ล้าสมัย ทำให้ agent ตัดสินใจจากข้อมูลผิด (E-01)

### 14.3 UX / accessibility risk

- **R-U1** Admin dashboard ออกแบบสำหรับจอคอมพิวเตอร์ ถ้าผู้นำกลุ่มใช้มือถือ (H-04) หน้าเช็คชื่อ 991 บรรทัดที่มี 4 แท็บจะใช้ยาก งาน mobile P2 ยังเหลือ
- **R-U2** Sidebar แสดงเมนูเดียวกันทุก role รวมหน้า ComingSoon 3 หน้า
- **R-U3** ป้ายวิธีเช็คชื่อฝั่งสมาชิกไม่ตรงค่าจริง ทำให้แสดงผลผิด (5.3)
- **R-U4** wireframe และ brand-spec ใช้ palette ต่างกัน ยังไม่มีการตัดสินใจ (E-70)
- **R-U5** งาน Modal/accessibility P0/P1 ยังอยู่นอก `main` ถ้า branch อื่นแก้ไฟล์เดียวกันจะเกิด conflict

---

## 15. Questions Requiring Validation

### 15.1 คำถามถึงเจ้าของผลิตภัณฑ์ / ผู้ดูแลคริสตจักร

- **Q-01** ระบบใช้งานจริงแล้วหรือยัง มีผู้ใช้กี่คน role ใด (U-01, U-03)
- **Q-02** มีสมาชิก กลุ่ม และผู้นำกลุ่มกี่คน (U-02)
- **Q-03** โครงสร้างการดูแลเป็นอย่างไร มีผู้ดูแลพื้นที่หรือไม่ (U-05)
- **Q-04** ต้องการรายงานใด ส่งให้ใคร บ่อยแค่ไหน ขอตัวอย่างรายงานปัจจุบัน (U-06)
- **Q-05** "กลุ่มที่แข็งแรง" หมายถึงอะไรสำหรับคริสตจักรนี้ (U-07)
- **Q-06** Branch ใดเป็นทิศทางหลัก และ Feed/Map/Supabase ยังอยู่ในแผนหรือไม่ (U-09)

### 15.2 คำถามถึงผู้นำกลุ่ม (สัมภาษณ์ 5 คน)

- **Q-07** ตอนนี้บันทึกการเข้าร่วมอย่างไร ใช้เวลาเท่าไร ส่งให้ใคร (H-01, H-05)
- **Q-08** เมื่อสมาชิกขาด ทำอะไร ใครรู้บ้าง (H-03)
- **Q-09** ใช้อุปกรณ์อะไร กลุ่มสื่อสารกันทางใด (H-04, H-08)

### 15.3 คำถามถึงสมาชิกและสมาชิกใหม่ (สัมภาษณ์ 5 คนต่อกลุ่ม)

- **Q-10** เข้ากลุ่มปัจจุบันได้อย่างไร หากลุ่มอย่างไร (H-06, H-07)
- **Q-11** ข้อมูลใดของตนที่ไม่ต้องการให้สมาชิกคนอื่นหรือผู้นำกลุ่มเห็น (H-09)

### 15.4 คำถามด้านนโยบาย

- **Q-12** ใครมีสิทธิ์เห็นเบอร์โทร ที่อยู่ วันเกิด สถานะการติดตาม คำขออธิษฐาน (U-08)
- **Q-13** คริสตจักรมีนโยบาย PDPA หรือผู้รับผิดชอบข้อมูลส่วนบุคคลหรือไม่

### 15.5 ความพร้อมของเอกสารในการตอบ 9 คำถามตรวจรับ

| คำถามตรวจรับ | คำตอบจากเอกสารนี้ | ระดับ |
|---|---|---|
| 1. ใครคือผู้ใช้หลักที่สุด | ในระบบปัจจุบัน: admin เท่านั้นที่ login ได้ (I-01) ผู้ใช้หลักในอนาคตน่าจะเป็นผู้นำกลุ่ม เพราะเป็นแหล่งข้อมูลการเข้าร่วม | Evidence (ปัจจุบัน) / Hypothesis (อนาคต) |
| 2. ปัญหาไหนเกิดขึ้นจริง | P-02, P-03, P-05, P-06, P-07, P-10, P-12 มีหลักฐานในโค้ด | Evidence (ในระบบ) — ยังไม่มีหลักฐานจากผู้ใช้ |
| 3. ปัญหาไหนมีผลกระทบสูงสุด | ความเป็นส่วนตัว (P-06) และผู้นำกลุ่มเข้าระบบไม่ได้ (P-02) เพราะบล็อกทุกอย่างที่ตามมา | Inference |
| 4. มีหลักฐานจากระบบปัจจุบันหรือยัง | มีจากโค้ด ไม่มีจากข้อมูลการใช้งาน (U-03) | — |
| 5. Map จำเป็นจริงหรือ | ไม่มีหลักฐานว่าจำเป็น (I-10, H-07) | ยังตอบไม่ได้ ต้อง validate |
| 6. Group Feed ช่วยแก้ปัญหาอะไร | ไม่มีปัญหาที่บันทึกไว้ซึ่ง Feed แก้ (I-10, H-08) | ยังตอบไม่ได้ ต้อง validate |
| 7. Attendance ใช้โดยใคร บ่อยแค่ไหน | โค้ด: เจ้าหน้าที่/admin ความถี่จริงไม่ทราบ (U-04) | Evidence บางส่วน / Unknown |
| 8. ข้อมูลใดเป็นข้อมูลส่วนตัว | จากโค้ด: เบอร์โทร, อีเมล, ที่อยู่, วันเกิด, LINE ID, ผู้ติดต่อฉุกเฉิน, notes, สถานะการติดตาม, ประวัติเข้าร่วม, คำขออธิษฐาน, ตำแหน่งกลุ่ม private/confidential นโยบายการเข้าถึงยังไม่ได้กำหนด (Q-12) | Evidence / Unknown |
| 9. ความสำเร็จวัดจากอะไร | ยังไม่ได้กำหนด ตัวเลือกที่ต้อง validate: % กลุ่มที่บันทึกการเข้าร่วมทุกสัปดาห์, เวลาตั้งแต่สมาชิกขาดถึงมีคนติดต่อ, จำนวนสมาชิกที่กลับมาหลังการติดตาม | Hypothesis |

สรุป: คำถาม 5, 6, 7, 9 ยังเป็นการเดา ต้อง validate ก่อนเข้า Phase 2

---

## 16. Recommended Next Step

1. **ตรวจและอนุมัติเอกสารนี้** แก้ข้อที่ผิดจากความรู้ของทีม โดยเฉพาะ U-01, U-02, U-09
2. **ทำ validation แบบเบา ก่อน Phase 2:**
   - สัมภาษณ์ผู้ดูแลคริสตจักร 2–3 คน (Q-01 ถึง Q-06, Q-12, Q-13)
   - สัมภาษณ์ผู้นำกลุ่ม 5 คน และขอตัวอย่างรายงาน/รายชื่อที่ใช้จริง (Q-07 ถึง Q-09)
   - สัมภาษณ์สมาชิก 5 คน และสมาชิกใหม่ 3–5 คน (Q-10, Q-11)
   - ถ้าระบบ deploy แล้ว: นับจำนวนแถวใน `users`, `members`, `groups`, `group_members`, `attendance_records`, `prayer_requests` (อ่านอย่างเดียว)
3. ~~ยืนยันข้อบกพร่อง E-30, E-31 ด้วยการรันแอป~~ ทำแล้ว (หัวข้อ 6.8) ข้อบกพร่องทั้งสองเกิดจริง การแก้ต้องแก้ทั้ง 2 สาเหตุ (ค่า `limit` และการอ่าน `.items`)
4. **บันทึกความเสี่ยง R-S1 ถึง R-S3 ให้เจ้าของผลิตภัณฑ์รับทราบ** ความเสี่ยงเหล่านี้ต้องแก้ก่อนเปิดบัญชีให้ผู้นำกลุ่มหรือสมาชิก ไม่ว่า Phase 2 จะเลือกทิศทางใด
5. **ไม่เริ่ม Map, Feed หรือ Group Health** จนกว่า Phase 2 จะเลือก opportunity จากผล validation

สิ่งที่เอกสารนี้ไม่ได้ทำ: Product Strategy, การจัดลำดับ roadmap, feature definition, UI design, การแก้โค้ด
