import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: "dialog" | "alertdialog";
}

/**
 * Shared shell for the app's `.modal-backdrop` / `.modal-card` dialogs.
 * Radix supplies Escape-to-close, focus trap and scroll lock; focus returns to the trigger on close.
 * Outside-press uses pointerdown, so a text selection that ends on the
 * backdrop no longer closes a half-filled form.
 * Render conditionally (`{open && <Modal …>}`); every modal needs a <ModalTitle>.
 */
export function Modal({
  onClose,
  children,
  className,
  style,
  role = "dialog",
}: ModalProps) {
  // Callers unmount the whole Root to close, so Radix cannot restore focus itself.
  // Capture during the first render, before Radix moves focus into the dialog.
  const [trigger] = useState(
    () => document.activeElement as HTMLElement | null
  );
  useEffect(() => () => trigger?.focus?.(), [trigger]);

  return (
    <DialogPrimitive.Root open onOpenChange={open => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop">
          <DialogPrimitive.Content
            className={cn("modal-card", className)}
            style={style}
            role={role}
            aria-describedby={undefined}
          >
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const ModalTitle = DialogPrimitive.Title;
