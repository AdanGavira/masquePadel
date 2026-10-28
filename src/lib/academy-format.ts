import type { Group } from "./academy";
import type { Dictionary, Locale } from "./i18n";
import { slotEnd } from "./slots";

/** "Lunes y miércoles · 17:00–18:30" */
export function scheduleLabel(dict: Dictionary, group: Group) {
  const names = group.days.map((d) => dict.common.weekdaysLong[d]);
  const days = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${dict.common.and} ${names.at(-1)}` : names[0];
  return `${days.charAt(0).toUpperCase()}${days.slice(1)} · ${group.slot}–${slotEnd(group.slot)}`;
}

export function groupName(dict: Dictionary, group: Group) {
  return `${dict.academy.levels[group.level]} · ${scheduleLabel(dict, group)}`;
}

export const euros = (locale: Locale, n: number) => (locale === "es" ? `${n} €` : `€${n}`);
