import { Modal, ModalTitle } from "@/components/Modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "ลบ",
  isSubmitting,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel} role="alertdialog">
      <ModalTitle asChild>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{title}</h3>
      </ModalTitle>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        {description}
      </p>
      <div className="modal-actions">
        <button
          className="cancel-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ยกเลิก
        </button>
        <button
          className="danger-button"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "กำลังลบ..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
