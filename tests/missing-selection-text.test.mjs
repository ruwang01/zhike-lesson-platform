import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {splitTerms} from '../lib/lesson.ts';
import {exampleChoices} from '../lib/evidence.ts';
const result=await build({entryPoints:['lib/grammar-recommendations.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {allGrammarTerms}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('optional term and example text can be absent during selection confirmation',()=>{
 for(const value of [undefined,null,0,{},[],false]){
  assert.deepEqual(splitTerms(value),[]);
  assert.deepEqual(allGrammarTerms(value),[]);
  assert.deepEqual(exampleChoices(value),[]);
 }
 assert.deepEqual(splitTerms('爱、爱，学习'),['爱','学习']);
 assert.deepEqual(allGrammarTerms('比字句；把字句\n比字句'),['比字句','把字句']);
 assert.deepEqual(exampleChoices('例句一。\n例句二。││例句一。'),['例句一。','例句二。']);
});
