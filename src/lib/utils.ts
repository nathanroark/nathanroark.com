import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Who gets a film's byline. Entries spell it three ways: a single `director`,
 * a `directors` array on the co-directed ones, or only a `studio`.
 */
export function movieCredit(data: { director?: string; directors?: string[]; studio?: string }) {
  return data.director ?? data.directors?.join(", ") ?? data.studio;
}
