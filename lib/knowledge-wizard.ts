import {knowledgeColumns} from './lesson';
export type KnowledgeColumnKey = (typeof knowledgeColumns)[number]['key'];
export type KnowledgeWizardState = {
  step: number;
  inputs: Record<KnowledgeColumnKey, string>;
  candidateIds: Record<KnowledgeColumnKey, string[]>;
};
export function emptyKnowledgeWizard(): KnowledgeWizardState {
  return {
    step: 0,
    inputs: {characters:'', vocabulary:'', grammar:'', culture:'', other:''},
    candidateIds: {characters:[], vocabulary:[], grammar:[], culture:[], other:[]},
  };
}
export function restoreKnowledgeWizard(raw: unknown): KnowledgeWizardState {
  const restored = emptyKnowledgeWizard();
  if (!raw || typeof raw !== 'object') return restored;
  const saved = raw as Partial<KnowledgeWizardState>;
  if (Number.isInteger(saved.step)) restored.step = Math.max(0, Math.min(knowledgeColumns.length-1, saved.step!));
  for (const {key} of knowledgeColumns) {
    if (typeof saved.inputs?.[key] === 'string') restored.inputs[key] = saved.inputs[key].slice(0, 1200);
    const ids = saved.candidateIds?.[key];
    if (Array.isArray(ids)) restored.candidateIds[key] = ids.filter((id): id is string => typeof id === 'string').slice(0, 1000);
  }
  return restored;
}
export function hasKnowledgeWizardProgress(wizard?: KnowledgeWizardState): boolean {
  return !!wizard && (wizard.step > 0 || knowledgeColumns.some(({key}) => !!wizard.inputs[key] || wizard.candidateIds[key].length > 0));
}
