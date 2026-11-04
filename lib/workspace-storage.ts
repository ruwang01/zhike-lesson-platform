import { z } from 'zod';
import { draftSchema, knowledgeSchema } from './workspace';
import { freshBriefForNewLesson, normalizeBrief, lessonSchema, type Draft, type Brief, type Knowledge } from './lesson';
import {emptyKnowledgeWizard, hasKnowledgeWizardProgress, type KnowledgeWizardState} from './knowledge-wizard';
export const WORKSPACE_KEY = 'zhike-workspace';

export type WorkspaceFlow = 'new' | 'working';

type StoredDraft = Draft;

export type WorkspaceSnapshot = {
  version: 2;
  brief: Brief;
  knowledge: Knowledge[];
  draft: StoredDraft | null;
  history: StoredDraft[];
  flow?: WorkspaceFlow;
  active?: boolean;
  step?: number;
  tab?: number;
  knowledgeVerifyVisible?: boolean;
  knowledgeWizard?: KnowledgeWizardState;
};

export function readWorkspaceSnapshot(): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSnapshot>;
    if (parsed.version !== 2) return null;
    return parsed as WorkspaceSnapshot;
  } catch {
    return null;
  }
}

export function writeWorkspaceSnapshot(snap: Omit<WorkspaceSnapshot, 'version'>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({ version: 2, ...snap } satisfies WorkspaceSnapshot),
    );
    return true;
  } catch {
    return false;
  }
}

/** 新建教案：清空知识指定与核验，保留历史版本列表（可选）。 */
export function emptyWorkspaceForNewLesson(history: WorkspaceSnapshot['history'] = []): WorkspaceSnapshot {
  const brief = freshBriefForNewLesson();
  return { version: 2, brief, knowledge: [], draft: null, history, flow: 'new', active: false, step: 0, tab: 0, knowledgeVerifyVisible: false, knowledgeWizard: emptyKnowledgeWizard() };
}

// Local editing snapshots accept unfinished fields. API/import validation stays strict.
const editableText = z.string();
const editingLessonSchema = lessonSchema.extend({
  title: editableText,
  goals: z.array(lessonSchema.shape.goals.element.extend({text: editableText})),
  difficulties: z.array(lessonSchema.shape.difficulties.element.extend({text: editableText})),
  activities: z.array(lessonSchema.shape.activities.element.extend({
    title: editableText, minutes: z.number().finite(), teacher: editableText,
    students: editableText, output: editableText, assessment: editableText,
  })).min(2).max(12),
  materials: z.array(lessonSchema.shape.materials.element.extend({title: editableText, content: editableText})),
  exercises: z.array(lessonSchema.shape.exercises.element.extend({question: editableText, answer: editableText})),
  board: editableText, homework: editableText, notes: editableText,
});
const editingDraftSchema = draftSchema.extend({
  brief: z.unknown().transform(restoreBriefFromStorage).refine((b): b is Brief => b !== null),
  lesson: editingLessonSchema,
});
export function parseStoredDraft(raw: unknown): Draft | null {
  const parsed = editingDraftSchema.safeParse(raw);
  return parsed.success ? parsed.data as Draft : null;
}
export function parseStoredHistory(raw: unknown): WorkspaceSnapshot['history'] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseStoredDraft).filter((d): d is Draft => d !== null).slice(0, 8);
}

export function parseStoredKnowledge(raw: unknown, _brief: Brief): Knowledge[] {
  if (!Array.isArray(raw)) return [];
  // Scope filtering belongs to explicit knowledge edits, not storage recovery.
  return raw.filter((k: unknown) => knowledgeSchema.safeParse(k).success) as Knowledge[];
}

export function restoreBriefFromStorage(raw: unknown): Brief | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const b = raw as Brief;
  const editable = {topic: b.topic, outcome: b.outcome, minutes: b.minutes, students: b.students};
  if (typeof editable.topic !== 'string' || typeof editable.outcome !== 'string' ||
      !Number.isFinite(editable.minutes) || !Number.isFinite(editable.students)) return null;
  const parsed = normalizeBrief({...b, topic: b.topic || ' ', outcome: b.outcome || ' ', minutes: 45, students: 20});
  return parsed ? {...parsed, ...editable} : null;
}

export function hasWorkspaceProgress(snap: Partial<WorkspaceSnapshot> | null): boolean {
  if (!snap) return false;
  if (snap.active !== undefined) return snap.active;
  return !!snap.draft || !!snap.knowledge?.length || hasKnowledgeWizardProgress(snap.knowledgeWizard) ||
    (!!snap.brief && JSON.stringify(snap.brief) !== JSON.stringify(freshBriefForNewLesson()));
}
export function workspaceResumeStep(snap: Partial<WorkspaceSnapshot>): number {
  const fallback = snap.draft ? 2 : snap.knowledge?.length ? 1 : 0;
  const step = Number.isInteger(snap.step) ? snap.step! : fallback;
  return Math.max(0, Math.min(snap.draft ? 3 : 1, step));
}
