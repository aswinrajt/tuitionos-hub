export const inr = (value: number, opts?: { compact?: boolean }) => {
  if (opts?.compact && Math.abs(value) >= 100000)
    return `₹${(value / 100000).toFixed(1)}L`;
  if (opts?.compact && Math.abs(value) >= 1000)
    return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
};

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateShort = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export const formatMonth = (month: string) =>
  new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const formatTime = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number) as number[];
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const pct = (value: number) => `${Math.round(value)}%`;
