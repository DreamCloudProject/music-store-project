import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(
  padStart: string,
  trimStart: string,
  str: string,
  trimEnd: string,
  padEnd: string,
): string {
  let result = str.trim();

  let start = 0;
  while (trimStart && result.startsWith(trimStart, start)) {
    start += trimStart.length;
  }
  result = result.slice(start);

  let end = result.length;
  const trimEndLen = trimEnd.length;
  while (trimEnd && end >= trimEndLen && result.endsWith(trimEnd, end)) {
    end -= trimEndLen;
  }
  result = result.slice(0, end);

  if (padStart && !result.startsWith(padStart)) result = `${padStart}${result}`;
  if (padEnd && !result.endsWith(padEnd)) result = `${result}${padEnd}`;

  return result;
}
