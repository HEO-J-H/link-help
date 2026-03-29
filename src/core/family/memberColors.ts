/** Preset palette for member accent (recommend tab, lists). */
export const MEMBER_COLOR_PRESETS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#4d7c0f',
  '#ea580c',
  '#475569',
] as const;

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidMemberColor(value: string): boolean {
  return HEX.test(value.trim());
}

export function memberColorFromPaletteIndex(index: number): string {
  const i = Math.abs(Math.floor(index)) % MEMBER_COLOR_PRESETS.length;
  return MEMBER_COLOR_PRESETS[i];
}

/** Normalize stored color from JSON import; fall back to palette by member index. */
export function normalizeMemberColor(raw: unknown, memberIndex: number): string {
  if (typeof raw === 'string' && isValidMemberColor(raw)) {
    return raw.trim();
  }
  return memberColorFromPaletteIndex(memberIndex);
}

/** `#rgb` / invalid → `#rrggbb` for `<input type="color">`. */
export function memberColorForInput(hex: string): string {
  const t = hex.trim();
  const m3 = /^#([0-9A-Fa-f]{3})$/.exec(t);
  if (m3) {
    const s = m3[1];
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  return MEMBER_COLOR_PRESETS[0];
}
