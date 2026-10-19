import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSelections,exampleChoices} from '../lib/evidence.ts';
const b={standard:'InternationalLevel'};
const node={id:'Word:1',name:'方便',kind:'Word',role:'核心',verified:true,detail:'⒈ 便利。⒉ 上厕所。',rawDetail:'⒈ 便利。⒉ 上厕所。',example:'交通很方便。││买东西很方便。',levels:['二级'],relations:[],evidence:{standard:'InternationalLevel',parameters:{terms:['方便']},queries:[]}};
const selection={id:'Word:1',name:'方便',kind:'Word',role:'核心',selectedMeaning:'⒈ 便利。',selectedExamples:['交通很方便。'],scopeConfirmed:true};
test('accepts only confirmed source excerpts and original whole examples',()=>assert.equal(validateSelections([selection],[node],b).problems.length,0));
test('rejects forged node id even when name matches',()=>assert.ok(validateSelections([{...selection,id:'Word:99'}],[node],b).problems.some(p=>p.includes('节点未匹配'))));
test('rejects rewritten meaning, invented examples, wrong standards and missing confirmation',()=>{for(const patch of [{selectedMeaning:'方便表示价格低。'},{selectedExamples:['这条路十分方便。']},{scopeConfirmed:false}])assert.ok(validateSelections([{...selection,...patch}],[node],b).problems.length);assert.ok(validateSelections([selection],[node],{standard:'HSKLevel'}).problems.length)});
test('same-name character cannot satisfy word identity',()=>assert.ok(validateSelections([{...selection,kind:'Character'}],[node],b).problems.length));
test('missing fields are never invented',()=>{const n={...node,rawDetail:'',detail:'',example:'',rawExample:''};assert.equal(validateSelections([{...selection,selectedMeaning:'',selectedExamples:[]}],[n],b).problems.length,0)});
test('splits source sentence separators without paraphrase',()=>assert.deepEqual(exampleChoices('甲。││乙。\n甲。'),['甲。','乙。']));

test('blocks grammar instruction without a grammar evidence node', async()=>{
 const {checkEvidenceBoundary}=await import('../lib/evidence.ts');
 assert.equal(checkEvidenceBoundary({board:'A比B句式'},[{kind:'Word'}]).length,1);
 assert.equal(checkEvidenceBoundary({board:'原文例句与交通情境任务'},[{kind:'Word'}]).length,0);
 assert.equal(checkEvidenceBoundary({board:'A比B句式'},[{kind:'Grammar'}]).length,0);
});
