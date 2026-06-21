export function getStartDateForPeriod(period: string, customStart?: string): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case "Today":
      return today;
    case "Last 7 Days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return d;
    }
    case "Last 30 Days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return d;
    }
    case "Last 3 Months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case "Last 6 Months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case "Last 12 Months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 12);
      return d;
    }
    case "Custom Date Range":
    case "Custom":
      if (customStart) {
        return new Date(customStart);
      }
      return today;
    default:
      // Default to last 7 days
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return d;
  }
}

export function getEndDateForPeriod(period: string, customEnd?: string): Date {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  if ((period === "Custom Date Range" || period === "Custom") && customEnd) {
    const end = new Date(customEnd);
    return new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  }
  return todayEnd;
}

export function parseToLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

export function isWithinPeriod(dateVal: string | Date, startDate: Date, endDate: Date): boolean {
  const date = typeof dateVal === "string" ? parseToLocalDate(dateVal) : dateVal;
  return date >= startDate && date <= endDate;
}
