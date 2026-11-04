import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {initialBrief} from '../lib/lesson.ts';
const result=await build({entryPoints:['lib/design-wizard.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const lib=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('seven design steps follow the required order and expose one instruction each',()=>{
 assert.deepEqual(lib.designSteps.map(s=>s.title),['教案初始信息','汉字图谱选取','词汇图谱选取','语法图谱选取','文化图谱选取','课堂活动设计','教案生成']);
 assert.ok(lib.designSteps.every(s=>s.description));
 assert.deepEqual(lib.designSteps.slice(1,5).map(s=>s.knowledgeKey),['characters','vocabulary','grammar','culture']);
});
test('legacy four-stage drafts map to the matching new stage without touching draft data',()=>{
 const draft={lesson:{title:'旧草稿'}};
 for(let step=0;step<4;step++)assert.equal(lib.restoreDesignWizard({step:1,knowledgeWizard:{step}}).step,step+1);
 assert.equal(lib.restoreDesignWizard({step:1,knowledgeWizard:{step:4}}).step,5);
 assert.equal(lib.restoreDesignWizard({step:2,draft}).step,5);
 assert.equal(lib.restoreDesignWizard({step:3,draft}).step,6);
 assert.equal(lib.restoreDesignWizard({step:3,draft}).outputReady,true);
 assert.deepEqual(draft,{lesson:{title:'旧草稿'}});
});
test('new progress restores completions and keeps generation unavailable without a draft',()=>{
 const progress={version:1,step:6,completed:[0,1,2,3,4,5,6,6,99],outputReady:true};
 assert.deepEqual(lib.restoreDesignWizard({designWizard:progress}),{version:1,step:5,completed:[0,1,2,3,4],outputReady:false});
 assert.deepEqual(lib.restoreDesignWizard({draft:{},designWizard:progress}),{...progress,completed:[0,1,2,3,4,5,6]});
});
test('initial requirements report named fields rather than silently blocking progress',()=>{
 assert.deepEqual(lib.initialBriefIssues(initialBrief),[]);
 assert.ok(lib.initialBriefIssues({...initialBrief,topic:'   ',outcome:''}).some(s=>s.includes('课程主题')));
 assert.ok(lib.initialBriefIssues({...initialBrief,minutes:0}).some(s=>s.includes('课时长度')));
 assert.ok(lib.initialBriefIssues({...initialBrief,students:0}).some(s=>s.includes('班级人数')));
});
