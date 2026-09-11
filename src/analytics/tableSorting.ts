export type SortDirection = 'asc' | 'desc';

export function sortRows<T>(rows: T[], value: (row: T) => string | number | null | undefined, direction: SortDirection): T[] {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = value(left); const b = value(right);
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    const comparison = typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      : a < b ? -1 : a > b ? 1 : 0;
    return comparison * multiplier;
  });
}
