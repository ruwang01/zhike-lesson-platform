import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['lib/knowledge-wizard.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {emptyKnowledgeWizard,restoreKnowledgeWizard,hasKnowledgeWizardProgress}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('all five steps retain pending input and candidate cards across storage recovery',()=>{
 const wizard=emptyKnowledgeWizard();
 for(const key of Object.keys(wizard.inputs)){
  wizard.inputs[key]=key+' 尚未搜索或提交的内容';
  wizard.candidateIds[key]=[key+':first',key+':confirmed'];
 }
 wizard.step=3;
 assert.deepEqual(restoreKnowledgeWizard(JSON.parse(JSON.stringify(wizard))),wizard);
 assert.equal(hasKnowledgeWizardProgress(wizard),true);
 assert.equal(hasKnowledgeWizardProgress(emptyKnowledgeWizard()),false);
});
test('legacy snapshots start empty and invalid fields do not discard valid work',()=>{
 assert.deepEqual(restoreKnowledgeWizard(undefined),emptyKnowledgeWizard());
 const wizard=restoreKnowledgeWizard({step:50,inputs:{characters:'保留汉字输入',grammar:123},candidateIds:{vocabulary:['Idiom:1',null]}});
 assert.equal(wizard.step,4);assert.equal(wizard.inputs.characters,'保留汉字输入');
 assert.equal(wizard.inputs.grammar,'');assert.deepEqual(wizard.candidateIds.vocabulary,['Idiom:1']);
 assert.equal(restoreKnowledgeWizard({step:-3}).step,0);
});
