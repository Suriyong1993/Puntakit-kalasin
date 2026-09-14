import { Cross } from "lucide-react";

export function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Cross size={29} strokeWidth={3.4} />
        <span />
      </div>
      <div>
        <strong>Puntakit</strong>
        <small>CHURCH</small>
      </div>
    </div>
  );
}
