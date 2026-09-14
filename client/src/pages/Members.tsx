import { useMemo, useState } from "react";
import {
  CalendarDays,
  Heart,
  MapPin,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ICON_SIZE } from "@/lib/icon-sizes";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const members = [
  {
    name: "สมชาย ใจดี",
    role: "ผู้นำกลุ่มบ้าน",
    area: "เมือง 1",
    group: "กลุ่มบ้าน เมือง 1",
    status: "ติดตามแล้ว",
    joined: "12 ม.ค. 2024",
    tone: "blue",
  },
  {
    name: "นภัสสร แสงทอง",
    role: "สมาชิก",
    area: "สมเด็จ",
    group: "กลุ่มบ้านสมเด็จ",
    status: "ติดตามแล้ว",
    joined: "4 มี.ค. 2024",
    tone: "pink",
  },
  {
    name: "กิตติพงษ์ ศรีสุข",
    role: "ผู้รับเชื่อใหม่",
    area: "เมือง 2",
    group: "ยังไม่เข้ากลุ่ม",
    status: "ต้องติดตาม",
    joined: "9 ก.ย. 2026",
    tone: "orange",
  },
  {
    name: "พรทิพย์ รุ่งเรือง",
    role: "สมาชิก",
    area: "ท่าคันโท",
    group: "กลุ่มบ้านท่าคันโท",
    status: "ติดตามแล้ว",
    joined: "18 ส.ค. 2024",
    tone: "purple",
  },
  {
    name: "ธนกร มั่นคง",
    role: "อาสาสมัคร",
    area: "บัวขาว",
    group: "ทีมต้อนรับ",
    status: "ติดตามแล้ว",
    joined: "22 มิ.ย. 2025",
    tone: "green",
  },
  {
    name: "ศิริพร แก้วใส",
    role: "ผู้รับเชื่อใหม่",
    area: "คำใหญ่",
    group: "กำลังจัดกลุ่ม",
    status: "ต้องติดตาม",
    joined: "1 ก.ย. 2026",
    tone: "pink",
  },
  {
    name: "ปรีชา วัฒนกิจ",
    role: "สมาชิก",
    area: "เมือง 1",
    group: "กลุ่มบ้าน เมือง 1",
    status: "ติดตามแล้ว",
    joined: "14 ก.พ. 2023",
    tone: "blue",
  },
  {
    name: "อรอนงค์ บุญช่วย",
    role: "สมาชิก",
    area: "เมือง 2",
    group: "กลุ่มบ้าน เมือง 2",
    status: "ติดตามแล้ว",
    joined: "29 ต.ค. 2024",
    tone: "orange",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Members() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const [role, setRole] = useState("ทั้งหมด");

  const filtered = useMemo(
    () =>
      members.filter((m) => {
        const hay = `${m.name} ${m.role} ${m.area} ${m.group}`.toLowerCase();
        return (
          (!query || hay.includes(query.toLowerCase())) &&
          (area === "ทั้งหมด" || m.area === area) &&
          (status === "ทั้งหมด" || m.status === status) &&
          (role === "ทั้งหมด" || m.role === role)
        );
      }),
    [query, area, status, role]
  );

  const uniqueAreas = Array.from(new Set(members.map((m) => m.area)));

  const hasFilter =
    query || area !== "ทั้งหมด" || status !== "ทั้งหมด" || role !== "ทั้งหมด";

  const clearFilters = () => {
    setQuery("");
    setArea("ทั้งหมด");
    setStatus("ทั้งหมด");
    setRole("ทั้งหมด");
  };

  return (
    <AppLayout activeNav="สมาชิก">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow blue-eyebrow">PEOPLE &amp; COMMUNITY</span>
          <h1>สมาชิก</h1>
          <p>จัดการข้อมูลสมาชิกและติดตามการเติบโตของคนในคริสตจักร</p>
        </div>
        <button className="primary-action">
          <UserPlus size={ICON_SIZE.sm} /> เพิ่มสมาชิก
        </button>
      </div>

      {/* Summary cards */}
      <div className="member-summary">
        <div className="summary-card blue">
          <span className="summary-icon">
            <Users size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>สมาชิกทั้งหมด</small>
            <strong>344</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card green">
          <span className="summary-icon">
            <Heart size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>เข้าร่วมกลุ่ม</small>
            <strong>210</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card orange">
          <span className="summary-icon">
            <CalendarDays size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>เพิ่มในเดือนนี้</small>
            <strong>12</strong>
            <span>คน</span>
          </div>
        </div>
        <div className="summary-card purple">
          <span className="summary-icon">
            <MapPin size={ICON_SIZE.lg} />
          </span>
          <div>
            <small>พื้นที่ทั้งหมด</small>
            <strong>6</strong>
            <span>พื้นที่</span>
          </div>
        </div>
      </div>

      {/* Member table panel */}
      <section className="member-panel card-surface">
        {/* Toolbar */}
        <div className="member-toolbar">
          <label className="member-search">
            <Search size={ICON_SIZE.md} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อสมาชิก กลุ่ม หรือพื้นที่..."
              aria-label="ค้นหาสมาชิก"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="ล้างการค้นหา">
                <X size={ICON_SIZE.xs} />
              </button>
            )}
          </label>

          <div className="filter-label">
            <SlidersHorizontal size={ICON_SIZE.sm} /> ตัวกรอง
          </div>

          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            aria-label="กรองพื้นที่"
          >
            <option value="ทั้งหมด">ทุกพื้นที่</option>
            {uniqueAreas.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="กรองสถานะ"
          >
            <option value="ทั้งหมด">ทุกสถานะ</option>
            <option>ติดตามแล้ว</option>
            <option>ต้องติดตาม</option>
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="กรองบทบาท"
          >
            <option value="ทั้งหมด">ทุกบทบาท</option>
            <option>สมาชิก</option>
            <option>ผู้นำกลุ่มบ้าน</option>
            <option>ผู้รับเชื่อใหม่</option>
            <option>อาสาสมัคร</option>
          </select>
        </div>

        {/* Active filter info */}
        <div className="active-filter-row">
          <span>
            แสดง {filtered.length} จาก {members.length} รายการ
          </span>
          {hasFilter && (
            <button onClick={clearFilters}>ล้างตัวกรองทั้งหมด</button>
          )}
        </div>

        {/* Table */}
        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>บทบาท</th>
                <th>พื้นที่</th>
                <th>กลุ่ม</th>
                <th>สถานะ</th>
                <th>เข้าร่วมเมื่อ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.name}>
                  <td>
                    <div className="member-name">
                      <span className={`member-avatar ${member.tone}`}>
                        {member.name.slice(0, 1)}
                      </span>
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.role}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-chip ${member.tone}`}>{member.role}</span>
                  </td>
                  <td>{member.area}</td>
                  <td>{member.group}</td>
                  <td>
                    <span
                      className={`status-chip ${
                        member.status === "ติดตามแล้ว" ? "good" : "attention"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td>{member.joined}</td>
                  <td>
                    <button
                      className="row-menu"
                      aria-label={`เมนู ${member.name}`}
                    >
                      <MoreHorizontal size={ICON_SIZE.md} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-members">
              <Users size={ICON_SIZE["2xl"]} />
              <h3>ไม่พบสมาชิก</h3>
              <p>ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
