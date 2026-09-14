import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Heart,
  Home as HomeIcon,
  Leaf,
  Megaphone,
  Plus,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const metrics = [
  {
    label: "สมาชิกทั้งหมด",
    value: "344",
    suffix: "คน",
    trend: "↑ +12 คน",
    tone: "blue",
    icon: Users,
    detail: "สมาชิกที่ลงทะเบียนทั้งหมดในคริสตจักร",
    sub: "เพิ่มขึ้น 3.6% จากเดือนที่แล้ว",
    rows: [
      ["สมาชิกใหม่เดือนนี้", "12 คน"],
      ["สมาชิกที่ติดตามอยู่", "318 คน"],
      ["รอติดตาม", "14 คน"],
    ],
  },
  {
    label: "เข้าร่วมกลุ่ม",
    value: "210",
    suffix: "คน",
    trend: "61% ของทั้งหมด",
    tone: "green",
    icon: Leaf,
    detail: "สมาชิกที่มีส่วนร่วมในพันธกิจบ้านหรือกลุ่มย่อย",
    sub: "เป้าหมายไตรมาสนี้ 240 คน",
    rows: [
      ["กลุ่มที่กำลังดำเนินการ", "18 กลุ่ม"],
      ["เข้าร่วมครั้งแรก", "24 คน"],
      ["อัตราการกลับมา", "82%"],
    ],
  },
  {
    label: "มาคริสตจักร",
    value: "178",
    suffix: "คน",
    trend: "52% ของทั้งหมด",
    tone: "orange",
    icon: Building2,
    detail: "ผู้เข้าร่วมการนมัสการล่าสุด",
    sub: "ข้อมูลวันอาทิตย์ที่ 13 ก.ย. 2026",
    rows: [
      ["ผู้ใหญ่", "122 คน"],
      ["เยาวชน", "34 คน"],
      ["เด็ก", "22 คน"],
    ],
  },
  {
    label: "รับเชื่อใหม่",
    value: "28",
    suffix: "คน",
    trend: "↑ +6 คน เดือนนี้",
    tone: "purple",
    icon: Heart,
    detail: "ผู้รับเชื่อใหม่ที่อยู่ในกระบวนการติดตาม",
    sub: "เพิ่มขึ้น 27% จากเดือนที่แล้ว",
    rows: [
      ["ติดตามสัปดาห์แรก", "16 คน"],
      ["เข้ากลุ่มแล้ว", "9 คน"],
      ["ต้องการการดูแล", "3 คน"],
    ],
  },
];

const journey = [
  { n: "1", title: "พบคน", detail: "สร้างความสัมพันธ์", icon: Users, tone: "mint" },
  { n: "2", title: "ประกาศ", detail: "ข่าวประเสริฐ", icon: Megaphone, tone: "sky" },
  { n: "3", title: "นำมารับเชื่อ", detail: "และติดตาม", icon: Heart, tone: "lilac" },
  { n: "4", title: "มาคริสตจักร", detail: "(คริสตจักร)", icon: Building2, tone: "sun" },
  { n: "5", title: "เข้าสู่พันธกิจบ้าน", detail: "(พบปะ / กลุ่ม)", icon: Users, tone: "rose" },
  { n: "6", title: "เติบโต", detail: "เป็นสาวกและนำคนต่อไป", icon: Leaf, tone: "mint" },
];

const activities = [
  { title: "กลุ่มบ้าน เมือง 1", meta: "มีผู้เข้าร่วม 12 คน", time: "2 ชม. ที่แล้ว", icon: Users, tone: "blue" },
  { title: "ประกาศข่าวประเสริฐ ที่ตลาดสด", meta: "มีผู้ฟัง 28 คน", time: "5 ชม. ที่แล้ว", icon: Megaphone, tone: "orange" },
  { title: "ผู้รับเชื่อใหม่", meta: "3 คน", time: "1 วันที่แล้ว", icon: Heart, tone: "pink" },
  { title: "ประชุมทีมพันธกิจ", meta: "วางแผนเดือนกันยายน", time: "1 วันที่แล้ว", icon: Users, tone: "purple" },
];

const chart = [132, 134, 180, 46, 37, 40];
const chartLabels = ["เมือง 1", "เมือง 2", "สมเด็จ", "ท่าคันโท", "บัวขาว", "คำใหญ่"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="hero card-surface">
      <img
        src="/manus-storage/puntakit-hero_d9170436.png"
        alt="ครอบครัวและชุมชนคริสตจักร Puntakit"
      />
      <div className="hero-wash" />
      <div className="hero-copy">
        <span className="eyebrow">PUNTAKIT • CHURCH COMMUNITY</span>
        <h1>
          1 คน นำ 2 คน
          <br />
          <em>สู่พระคริสต์</em>
          <br />
          และคริสตจักร
        </h1>
        <p>เพราะคริสตจักร คือ บ้านของทุกคน</p>
        <small>มัทธิว 28:19–20</small>
      </div>
      <div className="hero-side-copy">
        <strong>
          มาร่วมกัน
          <br />
          สร้างสาวกว่า
          <br />
          ให้เติบโตในพระเจ้า
        </strong>
        <button aria-label="เริ่มต้นวันนี้">
          เริ่มต้นวันนี้ <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

function MetricCard({
  item,
  onClick,
}: {
  item: (typeof metrics)[number];
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      className={`metric-card ${item.tone}`}
      onClick={onClick}
      aria-label={`ดูรายละเอียด ${item.label}`}
    >
      <div className="metric-icon">
        <Icon size={25} />
      </div>
      <div className="metric-content">
        <span>{item.label}</span>
        <div>
          <strong>{item.value}</strong>
          <b>{item.suffix}</b>
        </div>
        <small className={item.trend.includes("↑") ? "up" : ""}>{item.trend}</small>
      </div>
      <ChevronRight className="metric-arrow" size={20} />
    </button>
  );
}

function Journey() {
  return (
    <section className="journey card-surface">
      <div className="section-heading">
        <div>
          <span className="mini-icon">
            <Sparkles size={16} />
          </span>
          <h2>6 ขั้นตอนสู่การสร้างสาวก</h2>
        </div>
        <button className="text-button">
          ดูรายละเอียด <ArrowRight size={15} />
        </button>
      </div>
      <div className="journey-track">
        {journey.map((step, i) => {
          const Icon = step.icon;
          return (
            <div className="journey-wrap" key={step.n}>
              <button className={`journey-step ${step.tone}`}>
                <span className="step-number">{step.n}</span>
                <div className="step-illustration">
                  <Icon size={31} />
                </div>
                <strong>{step.title}</strong>
                <small>{step.detail}</small>
              </button>
              {i < journey.length - 1 && (
                <ChevronRight className="journey-arrow" size={20} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GoalCard() {
  return (
    <section className="goal-card card-surface">
      <div className="section-heading">
        <div>
          <span className="mini-icon pink">
            <Target size={16} />
          </span>
          <h2>เป้าหมาย 2026</h2>
        </div>
        <button className="more-button" aria-label="เมนูเพิ่มเติม">
          •••
        </button>
      </div>
      <div
        className="goal-ring"
        role="img"
        aria-label="ทำได้ 54 เปอร์เซ็นต์ จากเป้าหมาย 1050 คน"
      >
        <div>
          <strong>1,050</strong>
          <span>คน</span>
          <small>พันธกิจบ้าน</small>
        </div>
      </div>
      <div className="goal-legend">
        <div>
          <span className="legend-dot green-dot" />
          <span>ปัจจุบัน</span>
          <b>
            569 คน <small>(54%)</small>
          </b>
        </div>
        <div>
          <span className="legend-dot pink-dot" />
          <span>ยังขาด</span>
          <b>
            481 คน <small>(46%)</small>
          </b>
        </div>
      </div>
    </section>
  );
}

function Activities() {
  return (
    <section className="activities card-surface">
      <div className="section-heading">
        <div>
          <span className="mini-icon blue">
            <Users size={16} />
          </span>
          <h2>กิจกรรมล่าสุด</h2>
        </div>
        <button className="text-button">
          ดูทั้งหมด <ArrowRight size={15} />
        </button>
      </div>
      <div>
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <button className="activity-item" key={item.title}>
              <span className={`activity-icon ${item.tone}`}>
                <Icon size={18} />
              </span>
              <span className="activity-copy">
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </span>
              <time>{item.time}</time>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChurchStatus() {
  return (
    <section className="status card-surface">
      <div className="section-heading">
        <div>
          <span className="mini-icon blue">
            <Building2 size={16} />
          </span>
          <h2>สรุปสถานะปัจจุบัน</h2>
          <small>(13 ก.ย. 2026)</small>
        </div>
      </div>
      <div className="status-grid">
        <div className="status-tile blue-tile">
          <Building2 />
          <span>มาคริสตจักร</span>
          <strong>
            300 <small>คน</small>
          </strong>
          <em>เป้าหมาย 1,350 คน</em>
        </div>
        <div className="status-tile green-tile">
          <HomeIcon />
          <span>พันธกิจบ้าน</span>
          <strong>
            1,050 <small>คน</small>
          </strong>
          <em>เป้าหมาย 1,350 คน</em>
        </div>
      </div>
      <div className="status-total">
        รวมทั้งหมด <strong>1,350</strong> คน
      </div>
    </section>
  );
}

function Analytics() {
  const max = useMemo(() => Math.max(...chart), []);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section className="analytics card-surface">
      <div className="section-heading">
        <div>
          <span className="mini-icon purple">
            <BarChart3 size={16} />
          </span>
          <h2>สมาชิกตามพื้นที่</h2>
        </div>
        <button className="select-button">
          ทั้งหมด <ChevronDown size={14} />
        </button>
      </div>
      <div className="chart" aria-label="กราฟสมาชิกตามพื้นที่">
        {chart.map((value, i) => (
          <div
            className="bar-col"
            key={chartLabels[i]}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          >
            <span>{value}</span>
            <div className="bar-track">
              <div
                className="bar"
                style={{
                  height: `${(value / max) * 100}%`,
                  background: `var(--chart-${i + 1})`,
                }}
              />
              {hover === i && (
                <div className="chart-tooltip">
                  <strong>{value} คน</strong>
                  <small>{chartLabels[i]}</small>
                  <em>
                    คิดเป็น{" "}
                    {Math.round(
                      (value / chart.reduce((a, b) => a + b, 0)) * 100
                    )}
                    % ของพื้นที่
                  </em>
                </div>
              )}
            </div>
            <small>{chartLabels[i]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function Inspiration() {
  return (
    <section className="inspiration card-surface">
      <img
        src="/manus-storage/puntakit-bible_6f94bd0e.png"
        alt="พระคัมภีร์ท่ามกลางแสงอาทิตย์"
      />
      <div className="inspiration-copy">
        <span>พันธกิจของเรา</span>
        <h2>
          ไปทั่วโลก
          <br />
          และประกาศข่าวประเสริฐ
          <br />
          แก่คนทั้งปวง
        </h2>
        <small>มัทธิว 28:19</small>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Modal components
// ---------------------------------------------------------------------------

function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal-card ${wide ? "modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="ปิด">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateActivityModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <Modal title="สร้างกิจกรรมใหม่" onClose={onClose}>
        <div className="success-state">
          <div>
            <Sparkles />
          </div>
          <h3>บันทึกกิจกรรมแล้ว</h3>
          <p>กิจกรรมใหม่ถูกเพิ่มลงในรายการกิจกรรมล่าสุดเรียบร้อย</p>
          <button className="blue-button" onClick={onClose}>
            เสร็จสิ้น
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="สร้างกิจกรรมใหม่" onClose={onClose}>
      <div className="form-grid">
        <label>
          ชื่อกิจกรรม
          <input placeholder="เช่น กลุ่มบ้าน เมือง 2" />
        </label>
        <label>
          ประเภทกิจกรรม
          <select defaultValue="กลุ่มบ้าน">
            <option>กลุ่มบ้าน</option>
            <option>การประกาศ</option>
            <option>การนมัสการ</option>
            <option>การประชุม</option>
          </select>
        </label>
        <label>
          วันที่และเวลา
          <input type="datetime-local" />
        </label>
        <label>
          สถานที่
          <input placeholder="เช่น บ้านคุณสมชาย" />
        </label>
        <label className="full-field">
          รายละเอียด
          <textarea
            placeholder="เขียนรายละเอียดสั้น ๆ ของกิจกรรม"
            rows={3}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="cancel-button" onClick={onClose}>
          ยกเลิก
        </button>
        <button className="blue-button" onClick={() => setSaved(true)}>
          <Plus size={15} /> สร้างกิจกรรม
        </button>
      </div>
    </Modal>
  );
}

function MetricDetailModal({
  item,
  onClose,
}: {
  item: (typeof metrics)[number];
  onClose: () => void;
}) {
  const Icon = item.icon;
  return (
    <Modal title={item.label} onClose={onClose}>
      <div className={`detail-hero ${item.tone}`}>
        <div className="detail-icon">
          <Icon size={25} />
        </div>
        <div>
          <strong>
            {item.value} {item.suffix}
          </strong>
          <span>{item.detail}</span>
          <small>{item.sub}</small>
        </div>
      </div>
      <div className="detail-rows">
        {item.rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <button className="blue-button modal-full-button" onClick={onClose}>
        เข้าใจแล้ว
      </button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const [activityOpen, setActivityOpen] = useState(false);
  const [metric, setMetric] = useState<(typeof metrics)[number] | null>(null);

  return (
    <AppLayout activeNav="หน้าหลัก">
      <div className="welcome-row">
        <div>
          <span className="eyebrow blue-eyebrow">วันจันทร์ที่ 14 กันยายน 2026</span>
          <h2>
            สวัสดีครับ ทีมพันธกิจ <span>👋</span>
          </h2>
        </div>
        <button className="primary-action" onClick={() => setActivityOpen(true)}>
          <Sparkles size={16} /> สร้างกิจกรรมใหม่
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Primary column */}
        <div className="primary-column">
          <Hero />
          <div className="metrics-grid">
            {metrics.map((item) => (
              <MetricCard
                item={item}
                key={item.label}
                onClick={() => setMetric(item)}
              />
            ))}
          </div>
          <Journey />
          <div className="lower-grid">
            <ChurchStatus />
            <Analytics />
          </div>
        </div>

        {/* Right column */}
        <aside className="right-column">
          <section className="mission-card card-surface">
            <div className="leaf-art">
              <Leaf size={57} />
            </div>
            <span>พันธกิจบ้าน</span>
            <h2>คือ ฐานสร้างคน</h2>
            <p>
              คริสตจักร คือ บ้านแห่งการผูกพัน
              <br />
              เติบโต และรับใช้
            </p>
            <button className="blue-button">
              อ่านเพิ่มเติม <ArrowRight size={15} />
            </button>
          </section>
          <GoalCard />
          <Activities />
          <Inspiration />
        </aside>
      </div>

      {activityOpen && (
        <CreateActivityModal onClose={() => setActivityOpen(false)} />
      )}
      {metric && (
        <MetricDetailModal item={metric} onClose={() => setMetric(null)} />
      )}
    </AppLayout>
  );
}
