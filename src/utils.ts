
export function cutStr(s: string, length: number) {
  return s.length > length ? `${s.slice(0, length)}...` : s;
}

export function removeNewLines(s: string) {
  return s.replace(/\n+/g, ' ');
}
