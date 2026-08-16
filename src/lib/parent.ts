/** Calendar cells (with leading blanks) for one month, marked from attendance. */
export const attendanceCalendar = (
  rows: { date: string; mark: string }[],
  month: string,
) => {
  const [year, m] = month.split("-").map(Number) as [number, number];
  const first = new Date(year, m - 1, 1);
  const daysInMonth = new Date(year, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: ({ date: string; mark: string | null } | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    cells.push({ date, mark: rows.find((r) => r.date === date)?.mark ?? null });
  }
  return cells;
};
