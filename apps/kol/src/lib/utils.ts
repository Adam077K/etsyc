import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duping Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Capitalise the first letter (leaves the rest untouched). */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
