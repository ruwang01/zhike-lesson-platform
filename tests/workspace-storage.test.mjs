import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {initialBrief,manualKnowledge,templateLesson,freshBriefForNewLesson} from '../lib/lesson.ts';
const compiled=await build({entryPoints:['lib/workspace-storage.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const storage=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const knowledge=manualKnowledge(initialBrief);
const draft={brief:initialBrief,knowledge,lesson:templateLesson(initialBrief,knowledge),source:'template',createdAt:new Date().toISOString()};
test('unfinished requirements and knowledge are resumable without a generated lesson',()=>{
 const snap={...storage.emptyWorkspaceForNewLesson(),active:true,step:1,brief:{...freshBriefForNewLesson(),topic:'',outcome:'',minutes:0,students:0},knowledge};
 assert.equal(storage.hasWorkspaceProgress(snap),true);
 assert.equal(storage.workspaceResumeStep(snap),1);
 assert.deepEqual(JSON.parse(JSON.stringify(storage.restoreBriefFromStorage(snap.brief))),JSON.parse(JSON.stringify(snap.brief)));
 assert.equal(storage.hasWorkspaceProgress(storage.emptyWorkspaceForNewLesson()),false);
 assert.equal(storage.hasWorkspaceProgress({brief:initialBrief,knowledge,draft:null}),true);
});
test('recovery keeps temporary blank lesson fields and edited text',()=>{
 const edited=structuredClone(draft);
 edited.lesson.title='';edited.lesson.goals[0].text='';edited.lesson.activities[0].minutes=0;
 edited.lesson.activities[0].teacher='';edited.lesson.exercises[0].answer='';
 edited.lesson.board='导出前修改的板书';edited.reviewed=true;
 assert.deepEqual(storage.parseStoredDraft(JSON.parse(JSON.stringify(edited))),edited);
 assert.equal(storage.workspaceResumeStep({draft:edited,step:3}),3);
 assert.equal(storage.parseStoredHistory([edited]).length,1);
 assert.equal(storage.parseStoredDraft({...edited,lesson:{activities:'corrupt'}}),null);
});
test('recovering graph selections does not prune nodes while wizard is mid-edit',()=>{
 const selected={...knowledge[0],verified:true,scopeConfirmed:true,selectedMeaning:'保留已选择的义项'};
 assert.deepEqual(storage.parseStoredKnowledge([selected],freshBriefForNewLesson()),[selected]);
 assert.deepEqual(storage.parseStoredKnowledge([{id:'corrupt'}],initialBrief),[]);
});
test('snapshot round-trip retains progress and reports quota errors truthfully',()=>{
 const values=new Map();
 globalThis.window={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}};
 try{
  const snap={...storage.emptyWorkspaceForNewLesson(),active:true,step:3,tab:2,draft};
  assert.equal(storage.writeWorkspaceSnapshot(snap),true);
  assert.deepEqual(storage.readWorkspaceSnapshot(),JSON.parse(JSON.stringify(snap)));
  window.localStorage.setItem=()=>{throw Error('Quota exceeded')};
  assert.equal(storage.writeWorkspaceSnapshot(snap),false);
  assert.deepEqual(storage.readWorkspaceSnapshot(),JSON.parse(JSON.stringify(snap)));
 }finally{delete globalThis.window}
});
