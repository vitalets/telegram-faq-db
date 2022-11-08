
export function cutStr(s: string, length: number) {
  return s.length > length ? `${s.slice(0, length)}...` : s;
}

export function removeNewLines(s: string) {
  return s.replace(/\n+/g, ' ');
}

export function groupBy<T>(arr: T[], fn: (item: T) => unknown) {
  const res: Record<string, T[]> = {};
  arr.forEach(item => {
    const key = String(fn(item));
    res[key] = res[key] || [];
    res[key].push(item);
  });
  return res;
}
