import { Cross } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
        <Cross size={22} strokeWidth={2.6} />
      </div>
      <div>
        <strong className="block text-base font-bold text-white tracking-tight leading-tight">
          Puntakit
        </strong>
        <span className="block text-[10px] font-semibold tracking-widest text-blue-400">
          KALASIN CHURCH
        </span>
      </div>
    </div>
  );
}
