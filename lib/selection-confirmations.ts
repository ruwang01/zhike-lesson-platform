export const selectionKeys=['audience','template','idioms','grammar','culture'] as const;
export type SelectionKey=typeof selectionKeys[number];
export type SelectionConfirmations=Partial<Record<SelectionKey,boolean>>;
export function restoreSelectionConfirmations(raw:unknown):SelectionConfirmations{
 if(!raw||typeof raw!=='object')return {};
 const source=raw as Record<string,unknown>;
 return Object.fromEntries(selectionKeys.filter(key=>typeof source[key]==='boolean').map(key=>[key,source[key]]));
}
