import {scopedStorageKey} from './owner-storage';
import {type WorkspaceSnapshot,hasWorkspaceProgress,restoreBriefFromStorage,parseStoredDraft,parseStoredKnowledge,parseStoredHistory} from './workspace-storage';
export const RECORDS_KEY='zhike-lesson-records-v1';
export type LessonRecord={id:string;updatedAt:string;snapshot:WorkspaceSnapshot;versions:NonNullable<WorkspaceSnapshot['draft']>[]};
export function readLessonRecords():LessonRecord[]{
 if(typeof window==='undefined')return [];
 try{const records=JSON.parse(window.localStorage.getItem(scopedStorageKey(RECORDS_KEY))||'[]');if(!Array.isArray(records))return [];return records.flatMap((r:any)=>{const brief=restoreBriefFromStorage(r?.snapshot?.brief);if(typeof r?.id!=='string'||!brief)return [];return [{id:r.id,updatedAt:typeof r.updatedAt==='string'?r.updatedAt:'',snapshot:{...r.snapshot,brief,knowledge:parseStoredKnowledge(r.snapshot.knowledge,brief),draft:parseStoredDraft(r.snapshot.draft),history:parseStoredHistory(r.snapshot.history)},versions:Array.isArray(r.versions)?r.versions.map(parseStoredDraft).filter((v:any)=>v!==null):[]}]})}catch{return []}
}
export function saveLessonRecord(snapshot:WorkspaceSnapshot):void{
 if(!snapshot.recordId||!hasWorkspaceProgress(snapshot))return;
 const all=readLessonRecords(),index=all.findIndex(r=>r.id===snapshot.recordId),previous=all[index];
 const versions=previous?.versions||[];const generated=snapshot.draft;
 if(generated&&!versions.some(v=>v.createdAt===generated.createdAt))versions.unshift(generated);
 const comparable=(s:WorkspaceSnapshot)=>JSON.stringify({...s,updatedAt:undefined});
 const updatedAt=previous&&comparable(previous.snapshot)===comparable(snapshot)?previous.updatedAt:new Date().toISOString();
 const record:LessonRecord={id:snapshot.recordId,updatedAt,snapshot:{...snapshot,updatedAt},versions};
 if(index<0)all.push(record);else all[index]=record;
 window.localStorage.setItem(scopedStorageKey(RECORDS_KEY),JSON.stringify(all));
}
