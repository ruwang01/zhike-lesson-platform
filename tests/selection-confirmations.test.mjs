import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const b=await build({stdin:{contents:"export {confirmKnowledge} from './lib/confirm-knowledge.ts';export {restoreSelectionConfirmations} from './lib/selection-confirmations.ts';export {parseStoredKnowledge,emptyWorkspaceForNewLesson,writeWorkspaceSnapshot,readWorkspaceSnapshot} from './lib/workspace-storage.ts';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const lib=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const item={id:'Word:1',kind:'Word',name:'方便',role:'核心',verified:true,detail:'1. 便利。2. 适宜。',rawDetail:'1. 便利。2. 适宜。',example:'例句一。\n例句二。',levels:[],relations:[],selectedMeanings:['1. 便利。'],selectedMeaning:'1. 便利。',selectedExamples:['例句一。'],selectedFeatureIds:['f1'],selectedQuestionIds:[]};
test('confirmation preserves exactly the selected meanings, examples, extras and question IDs',()=>{
 const confirmed=lib.confirmKnowledge(item);
 assert.equal(confirmed.scopeConfirmed,true);
 assert.equal(confirmed.selectedMeaning,'1. 便利。');
 assert.deepEqual(confirmed.selectedExamples,['例句一。']);
 assert.deepEqual(confirmed.selectedFeatureIds,['f1']);
 assert.deepEqual(confirmed.selectedQuestionIds,[]);
 assert.equal(item.scopeConfirmed,undefined);
 assert.equal(lib.confirmKnowledge({...item,selectedMeaning:undefined}).selectedMeaning,'1. 便利。');
 assert.deepEqual(lib.parseStoredKnowledge([confirmed],lib.emptyWorkspaceForNewLesson().brief),[confirmed]);
});
test('confirmation materializes the existing fallback meaning and keeps explicit empty examples',()=>{
 const {selectedMeaning,selectedMeanings,...raw}=item;
 const confirmed=lib.confirmKnowledge({...raw,kind:'Grammar',selectedExamples:[]});
 assert.equal(confirmed.selectedMeaning,item.rawDetail);
 assert.deepEqual(confirmed.selectedExamples,[]);
});
test('confirmed and reselect states survive workspace round-trips; new lessons reset all panels',()=>{
 const map=new Map();globalThis.window={localStorage:{setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null}};
 try{
  const snap={...lib.emptyWorkspaceForNewLesson(),selectionConfirmations:{audience:true,template:true,idioms:true,grammar:false,culture:true}};
  assert.ok(lib.writeWorkspaceSnapshot(snap));
  assert.deepEqual(lib.restoreSelectionConfirmations(lib.readWorkspaceSnapshot().selectionConfirmations),snap.selectionConfirmations);
  assert.deepEqual(lib.restoreSelectionConfirmations({audience:'true',culture:true,unexpected:true}),{culture:true});
  assert.deepEqual(lib.emptyWorkspaceForNewLesson().selectionConfirmations,{});
 }finally{delete globalThis.window}
});
