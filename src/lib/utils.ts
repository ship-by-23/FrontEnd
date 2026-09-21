import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Menggabungkan class conditionals tanpa menghasilkan konflik utility Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mengubah tanggal API menjadi format Indonesia yang ringkas dan aman.
export function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}
