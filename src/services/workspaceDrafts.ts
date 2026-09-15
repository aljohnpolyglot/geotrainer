import { trainerDb } from '../data/trainerDb';

type DraftKind = 'clue' | 'note';
type ScopedDraft = { panoId: string };

export const workspaceDraftKey = (kind: DraftKind, panoId: string) => `workspace.${kind}Draft:${encodeURIComponent(panoId)}`;

export async function readWorkspaceDraft<T extends ScopedDraft>(kind: DraftKind, panoId: string) {
  const scoped = await trainerDb.setting<T>(workspaceDraftKey(kind, panoId));
  if (scoped) return scoped;
  const legacy = await trainerDb.setting<T>(`workspace.${kind}Draft`);
  if (legacy?.panoId === panoId) {
    await trainerDb.setSetting(workspaceDraftKey(kind, panoId), legacy);
    return legacy;
  }
}

export const writeWorkspaceDraft = <T extends ScopedDraft>(kind: DraftKind, draft: T) => trainerDb.setSetting(workspaceDraftKey(kind, draft.panoId), draft);

export async function clearWorkspaceDraft(kind: DraftKind, panoId: string) {
  await trainerDb.setSetting(workspaceDraftKey(kind, panoId), null);
  const legacy = await trainerDb.setting<ScopedDraft>(`workspace.${kind}Draft`);
  if (legacy?.panoId === panoId) await trainerDb.setSetting(`workspace.${kind}Draft`, null);
}
