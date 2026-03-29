export function ageFromBirthDate(isoDate: string, ref = new Date()): number | null {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
  return age;
}

export function ageCategory(age: number | null): string[] {
  if (age == null) return [];
  const tags: string[] = [];
  if (age >= 19 && age <= 39) tags.push('청년');
  if (age >= 40 && age <= 64) tags.push('중장년');
  if (age >= 65) tags.push('노인');
  if (age >= 40) tags.push('40세이상');
  return tags;
}
