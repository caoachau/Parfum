export function getSlidingPages(currentPage: number, totalPages: number, windowSize: number) {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeSize = Math.max(1, Math.floor(windowSize));
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage)), safeTotal);
  const start = Math.min(safeCurrent, Math.max(1, safeTotal - safeSize + 1));
  const count = Math.min(safeSize, safeTotal);

  return Array.from({ length: count }, (_, index) => start + index);
}
