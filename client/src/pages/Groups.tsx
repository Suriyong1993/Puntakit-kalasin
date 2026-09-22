import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ICON_SIZE } from "@/lib/icon-sizes";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { useLocation } from "wouter";
import type { GroupCategory, GroupMemberRole } from "@shared/schema";

interface GroupItem {
  id: string;
  name: string;
  leaderId: string | null;
  category: GroupCategory;
  meetingDay: string | null;
  meetingTime: string | null;
  meetingLocation: string | null;
  description: string | null;
  status: "active" | "inactive";
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  leaderName: string | null;
  leaderEmail: string | null;
  memberCount: number;
}

interface GroupMemberItem {
  id: string;
  groupId: string;
  memberId: string;
  role: GroupMemberRole;
  joinedAt: string;
  memberName: string;
  memberNickname: string | null;
  memberAvatarUrl: string | null;
  memberPhone: string | null;
  membershipStatus: string;
  pastoralStatus: string;
}

interface SimpleMember {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
}

const CATEGORY_LABELS: Record<GroupCategory, string> = {
  cell: "กลุ่มเซลล์ทั่วไป",
  youth: "กลุ่มแคร์วัยรุ่น/นักศึกษา",
  fellowship: "กลุ่มสามัคคีธรรม",
  family: "กลุ่มครอบครัว",
  general: "กลุ่มทั่วไป",
};

const CATEGORY_COLORS: Record<GroupCategory, string> = {
  cell: "blue",
  youth: "purple",
  fellowship: "orange",
  family: "green",
  general: "blue",
};

const ROLE_LABELS: Record<GroupMemberRole, string> = {
  leader: "หัวหน้ากลุ่ม",
  assistant_leader: "ผู้ช่วยหัวหน้า",
  host: "เจ้าบ้าน",
  member: "สมาชิก",
};

const EMPTY_FORM = {
  name: "",
  leaderId: "",
  category: "cell" as GroupCategory,
  meetingDay: "",
  meetingTime: "",
  meetingLocation: "",
  description: "",
  status: "active" as "active" | "inactive",
};

export default function Groups() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = isSuperAdmin || user?.role === "admin";

  const [groupsList, setGroupsList] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<GroupItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Group Members modal
  const [activeGroup, setActiveGroup] = useState<GroupItem | null>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState<GroupMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member to group form
  const [availableMembers, setAvailableMembers] = useState<SimpleMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<GroupMemberRole>("member");
  const [addingMember, setAddingMember] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await api.get<GroupItem[]>(`/api/groups?${params.toString()}`);
      setGroupsList(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลกลุ่มไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Load available members for adding
  const fetchAvailableMembers = async () => {
    try {
      const res = await api.get<{ items: SimpleMember[] }>("/api/members?limit=200");
      setAvailableMembers(res.items || []);
    } catch {
      // ignore
    }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (grp: GroupItem) => {
    setEditingGroup(grp);
    setForm({
      name: grp.name,
      leaderId: grp.leaderId || "",
      category: grp.category,
      meetingDay: grp.meetingDay || "",
      meetingTime: grp.meetingTime || "",
      meetingLocation: grp.meetingLocation || "",
      description: grp.description || "",
      status: grp.status,
    });
    setModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("กรุณากรอกชื่อกลุ่ม");
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        await api.put(`/api/groups/${editingGroup.id}`, form);
        toast.success("อัปเดตข้อมูลกลุ่มแคร์เรียบร้อยแล้ว");
      } else {
        await api.post("/api/groups", form);
        toast.success("สร้างกลุ่มแคร์ใหม่เรียบร้อยแล้ว");
      }
      setModalOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/groups/${deleteTarget.id}`);
      toast.success("ลบกลุ่มแคร์เรียบร้อยแล้ว");
      setDeleteTarget(null);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบกลุ่มไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  const openMembersModal = async (grp: GroupItem) => {
    setActiveGroup(grp);
    setMembersModalOpen(true);
    setLoadingMembers(true);
    setSelectedMemberId("");
    setSelectedRole("member");

    try {
      fetchAvailableMembers();
      const res = await api.get<{ members: GroupMemberItem[] }>(`/api/groups/${grp.id}`);
      setGroupMembersList(res.members || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "โหลดรายชื่อสมาชิกไม่สำเร็จ");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !selectedMemberId) {
      toast.error("กรุณาเลือกสมาชิกที่ต้องการเพิ่ม");
      return;
    }

    setAddingMember(true);
    try {
      await api.post(`/api/groups/${activeGroup.id}/members`, {
        memberId: selectedMemberId,
        role: selectedRole,
      });
      toast.success("เพิ่มสมาชิกเข้ากลุ่มเรียบร้อยแล้ว");
      setSelectedMemberId("");

      // Reload group members & group list
      const res = await api.get<{ members: GroupMemberItem[] }>(`/api/groups/${activeGroup.id}`);
      setGroupMembersList(res.members || []);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เพิ่มสมาชิกไม่สำเร็จ");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMemberFromGroup = async (memberId: string) => {
    if (!activeGroup) return;
    try {
      await api.delete(`/api/groups/${activeGroup.id}/members/${memberId}`);
      toast.success("นำสมาชิกออกจากกลุ่มแล้ว");
      setGroupMembersList((prev) => prev.filter((m) => m.memberId !== memberId));
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สามารถนำสมาชิกออกได้");
    }
  };

  // Metrics
  const totalGroups = groupsList.length;
  const activeGroupsCount = groupsList.filter((g) => g.status === "active").length;
  const totalMembersInGroups = groupsList.reduce((acc, g) => acc + (g.memberCount || 0), 0);

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">PUNTAKIT CARE GROUPS</span>
          <h1>กลุ่มแคร์และกลุ่มเซลล์</h1>
          <p>บริหารจัดการกลุ่มย่อย ชุมชนสาวก การนัดพบ และรายชื่อสมาชิกในแต่ละกลุ่ม</p>
        </div>
        {isAdmin && (
          <button className="primary-action" onClick={openCreateModal}>
            <Plus size={ICON_SIZE.sm} />
            <span>สร้างกลุ่มแคร์ใหม่</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="member-summary">
        <div className="summary-card blue">
          <div className="summary-icon">
            <UsersRound size={ICON_SIZE.md} />
          </div>
          <div>
            <small>กลุ่มทั้งหมด</small>
            <div>
              <strong>{totalGroups}</strong>
              <span>กลุ่ม</span>
            </div>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-icon">
            <CheckCircle2 size={ICON_SIZE.md} />
          </div>
          <div>
            <small>กลุ่มที่เปิดประจำ</small>
            <div>
              <strong>{activeGroupsCount}</strong>
              <span>กลุ่ม</span>
            </div>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="summary-icon">
            <Users size={ICON_SIZE.md} />
          </div>
          <div>
            <small>สมาชิกในกลุ่มทั้งหมด</small>
            <div>
              <strong>{totalMembersInGroups}</strong>
              <span>คน</span>
            </div>
          </div>
        </div>

        <div className="summary-card orange">
          <div className="summary-icon">
            <Heart size={ICON_SIZE.md} />
          </div>
          <div>
            <small>เฉลี่ยสมาชิกต่อกลุ่ม</small>
            <div>
              <strong>{totalGroups > 0 ? (totalMembersInGroups / totalGroups).toFixed(1) : 0}</strong>
              <span>คน/กลุ่ม</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="card-surface member-panel">
        <div className="member-toolbar">
          <div className="member-search">
            <Search size={ICON_SIZE.sm} />
            <input
              type="text"
              placeholder="ค้นหาชื่อกลุ่ม, สถานที่, หัวหน้ากลุ่ม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={ICON_SIZE.sm} />
              </button>
            )}
          </div>

          <div className="filter-label">ประเภท:</div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">ทั้งหมด</option>
            <option value="cell">กลุ่มเซลล์ทั่วไป</option>
            <option value="youth">กลุ่มวัยรุ่น/นักศึกษา</option>
            <option value="fellowship">กลุ่มสามัคคีธรรม</option>
            <option value="family">กลุ่มครอบครัว</option>
            <option value="general">กลุ่มทั่วไป</option>
          </select>

          <div className="filter-label">สถานะ:</div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">ทั้งหมด</option>
            <option value="active">เปิดใช้งาน (Active)</option>
            <option value="inactive">ปิดชั่วคราว (Inactive)</option>
          </select>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="state-panel">
            <div className="spinner" />
            <p style={{ marginTop: 12 }}>กำลังโหลดข้อมูลกลุ่มแคร์...</p>
          </div>
        ) : error ? (
          <div className="state-panel error-panel">
            <AlertCircle size={ICON_SIZE.lg} />
            <h3>เกิดข้อผิดพลาด</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchGroups}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : groupsList.length === 0 ? (
          <div className="state-panel">
            <UsersRound size={ICON_SIZE.lg} />
            <h3>ไม่พบข้อมูลกลุ่มแคร์</h3>
            <p>ยังไม่มีกลุ่มแคร์ที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "18px",
              padding: "20px 0",
            }}
          >
            {groupsList.map((grp) => {
              const catColor = CATEGORY_COLORS[grp.category] || "blue";
              const isGroupLeaderOfThis = user?.id === grp.leaderId;
              const canEditThis = isAdmin || isGroupLeaderOfThis;

              return (
                <div
                  key={grp.id}
                  className="card-surface"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: "1px solid rgba(220, 232, 244, 0.9)",
                    borderRadius: "18px",
                    boxShadow: "0 6px 16px rgba(35, 78, 120, 0.05)",
                  }}
                >
                  <div>
                    {/* Top Row: Category & Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className={`role-chip ${catColor}`}>
                        {CATEGORY_LABELS[grp.category] || grp.category}
                      </span>
                      <span className={`status-chip ${grp.status === "active" ? "good" : "attention"}`}>
                        {grp.status === "active" ? "เปิดใช้งาน" : "ปิดชั่วคราว"}
                      </span>
                    </div>

                    {/* Group Name & Description */}
                    <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: "var(--ink)", fontWeight: 700 }}>
                      {grp.name}
                    </h3>
                    {grp.description && (
                      <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                        {grp.description}
                      </p>
                    )}

                    {/* Meeting Schedule & Location */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#4f657d", marginBottom: "16px" }}>
                      {(grp.meetingDay || grp.meetingTime) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Clock size={ICON_SIZE.sm} style={{ color: "#397bc4", flexShrink: 0 }} />
                          <span>
                            {grp.meetingDay} {grp.meetingTime ? `(${grp.meetingTime})` : ""}
                          </span>
                        </div>
                      )}
                      {grp.meetingLocation && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MapPin size={ICON_SIZE.sm} style={{ color: "#e35b78", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {grp.meetingLocation}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={ICON_SIZE.sm} style={{ color: "#259a60", flexShrink: 0 }} />
                        <strong>สมาชิกในกลุ่ม {grp.memberCount} คน</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Leader info & Actions */}
                  <div style={{ borderTop: "1px solid #eef3f8", paddingTop: "14px", marginTop: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#74889e" }}>
                        หัวหน้ากลุ่ม: <strong style={{ color: "var(--ink)" }}>{grp.leaderName || "ยังไม่กำหนด"}</strong>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        className="blue-button"
                        style={{ flex: 1, justifyContent: "center", padding: "8px" }}
                        onClick={() => openMembersModal(grp)}
                      >
                        <Users size={ICON_SIZE.sm} />
                        <span>สมาชิก ({grp.memberCount})</span>
                      </button>

                      <button
                        className="primary-action"
                        style={{ flex: 1, justifyContent: "center", padding: "8px", background: "#228b5a" }}
                        onClick={() => navigate(`/attendance?groupId=${grp.id}`)}
                      >
                        <UserCheck size={ICON_SIZE.sm} />
                        <span>เช็คชื่อ</span>
                      </button>

                      {canEditThis && (
                        <button
                          style={{
                            background: "#f1f5f9",
                            color: "#546b82",
                            borderRadius: "10px",
                            padding: "8px 10px",
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => openEditModal(grp)}
                          title="แก้ไขข้อมูลกลุ่ม"
                        >
                          <Pencil size={ICON_SIZE.sm} />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          style={{
                            background: "#fff0f2",
                            color: "#d44359",
                            borderRadius: "10px",
                            padding: "8px 10px",
                            display: "grid",
                            placeItems: "center",
                          }}
                          onClick={() => setDeleteTarget(grp)}
                          title="ลบกลุ่ม"
                        >
                          <Trash2 size={ICON_SIZE.sm} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Group Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <h2>{editingGroup ? "แก้ไขกลุ่มแคร์" : "สร้างกลุ่มแคร์ใหม่"}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={ICON_SIZE.sm} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup}>
              <div className="form-grid">
                <label className="full-field">
                  <span>ชื่อกลุ่มแคร์ *</span>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กลุ่มแคร์เมือง 1, แคร์วัยรุ่นกาฬสินธุ์"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>

                <label>
                  <span>ประเภทกลุ่ม</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as GroupCategory })}
                  >
                    <option value="cell">กลุ่มเซลล์ทั่วไป</option>
                    <option value="youth">กลุ่มแคร์วัยรุ่น/นักศึกษา</option>
                    <option value="fellowship">กลุ่มสามัคคีธรรม</option>
                    <option value="family">กลุ่มครอบครัว</option>
                    <option value="general">กลุ่มทั่วไป</option>
                  </select>
                </label>

                <label>
                  <span>สถานะกลุ่ม</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="inactive">ปิดชั่วคราว (Inactive)</option>
                  </select>
                </label>

                <label>
                  <span>วันนัดพบ</span>
                  <input
                    type="text"
                    placeholder="เช่น ทุกวันศุกร์, วันพุธเว้นพุธ"
                    value={form.meetingDay}
                    onChange={(e) => setForm({ ...form, meetingDay: e.target.value })}
                  />
                </label>

                <label>
                  <span>เวลานัดพบ</span>
                  <input
                    type="text"
                    placeholder="เช่น 19:00 - 20:30 น."
                    value={form.meetingTime}
                    onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                  />
                </label>

                <label className="full-field">
                  <span>สถานที่นัดพบ</span>
                  <input
                    type="text"
                    placeholder="เช่น บ้านพี่สมชาย, ห้องนมัสการชั้น 2"
                    value={form.meetingLocation}
                    onChange={(e) => setForm({ ...form, meetingLocation: e.target.value })}
                  />
                </label>

                <label className="full-field">
                  <span>คำอธิบาย / เป้าหมายกลุ่ม</span>
                  <textarea
                    rows={3}
                    placeholder="รายละเอียดเพิ่มเติมของกลุ่มแคร์..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="primary-action" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : editingGroup ? "บันทึกการแก้ไข" : "สร้างกลุ่ม"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Members Modal */}
      {membersModalOpen && activeGroup && (
        <div className="modal-backdrop" onClick={() => setMembersModalOpen(false)}>
          <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px" }}>
            <div className="modal-heading">
              <div>
                <h2>สมาชิกในกลุ่ม: {activeGroup.name}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  {CATEGORY_LABELS[activeGroup.category]} • สมาชิก {groupMembersList.length} คน
                </p>
              </div>
              <button onClick={() => setMembersModalOpen(false)}>
                <X size={ICON_SIZE.sm} />
              </button>
            </div>

            {/* Add member section */}
            <div
              style={{
                background: "#f7fafd",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid #e2edf6",
                marginBottom: "18px",
              }}
            >
              <form onSubmit={handleAddMemberToGroup} style={{ display: "flex", gap: "10px", alignItems: "end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#54687e", marginBottom: "4px" }}>
                    เลือกสมาชิกจากทะเบียนโบสถ์
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #d7e4f0" }}
                  >
                    <option value="">-- เลือกสมาชิกเพื่อเพิ่มเข้ากลุ่ม --</option>
                    {availableMembers
                      .filter((m) => !groupMembersList.some((gm) => gm.memberId === m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.nickname ? `(${m.nickname})` : ""} {m.phone ? `- ${m.phone}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ width: "140px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#54687e", marginBottom: "4px" }}>
                    บทบาทในกลุ่ม
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as GroupMemberRole)}
                    style={{ width: "100%", height: "38px", padding: "0 10px", borderRadius: "10px", border: "1px solid #d7e4f0" }}
                  >
                    <option value="member">สมาชิก</option>
                    <option value="leader">หัวหน้ากลุ่ม</option>
                    <option value="assistant_leader">ผู้ช่วยหัวหน้า</option>
                    <option value="host">เจ้าบ้าน</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={addingMember || !selectedMemberId}
                  style={{ height: "38px", padding: "0 16px" }}
                >
                  <UserPlus size={ICON_SIZE.sm} />
                  <span>{addingMember ? "กำลังเพิ่ม..." : "เพิ่มเข้ากลุ่ม"}</span>
                </button>
              </form>
            </div>

            {/* Members List Table */}
            {loadingMembers ? (
              <div className="state-panel">
                <div className="spinner" />
                <p style={{ marginTop: 10 }}>กำลังโหลดรายชื่อสมาชิกในกลุ่ม...</p>
              </div>
            ) : groupMembersList.length === 0 ? (
              <div className="state-panel">
                <Users size={ICON_SIZE.lg} />
                <h3>ยังไม่มีสมาชิกในกลุ่มนี้</h3>
                <p>เลือกเพิ่มสมาชิกเข้ากลุ่มจากฟอร์มด้านบน</p>
              </div>
            ) : (
              <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                <table className="member-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>ชื่อ-นามสกุล</th>
                      <th>บทบาท</th>
                      <th>เบอร์โทร</th>
                      <th>วันที่เข้าร่วม</th>
                      <th style={{ textAlign: "right" }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembersList.map((gm) => (
                      <tr key={gm.id}>
                        <td>
                          <div className="member-name">
                            <div className="member-avatar blue">
                              {gm.memberName.slice(0, 1)}
                            </div>
                            <div>
                              <strong>{gm.memberName}</strong>
                              {gm.memberNickname && <small>ชื่อเล่น: {gm.memberNickname}</small>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-chip ${gm.role === "leader" ? "purple" : gm.role === "assistant_leader" ? "blue" : gm.role === "host" ? "orange" : ""}`}>
                            {ROLE_LABELS[gm.role] || gm.role}
                          </span>
                        </td>
                        <td>{gm.memberPhone || "-"}</td>
                        <td>{new Date(gm.joinedAt).toLocaleDateString("th-TH")}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="danger-button"
                            style={{ padding: "5px 9px", fontSize: "10px" }}
                            onClick={() => handleRemoveMemberFromGroup(gm.memberId)}
                            title="นำออกจากกลุ่ม"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button className="cancel-button" onClick={() => setMembersModalOpen(false)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบกลุ่มแคร์"
          description={`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม "${deleteTarget.name}"? ข้อมูลสมาชิกเดิมจะไม่ถูกลบออกจากคริสตจักร`}
          confirmLabel={deleting ? "กำลังลบ..." : "ลบกลุ่มแคร์"}
          isSubmitting={deleting}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
