import type { FamilyState } from '@/types/family';

export function exportFamilyJson(state: FamilyState): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function parseFamilyImportJson(text: string): FamilyState {
  const data = JSON.parse(text) as Record<string, unknown>;
  if (!data || !Array.isArray(data.members)) {
    throw new Error('Invalid family export file');
  }
  return { members: data.members as FamilyState['members'] };
}
