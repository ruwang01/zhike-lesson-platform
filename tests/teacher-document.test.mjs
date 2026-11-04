import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {initialBrief,manualKnowledge,templateLesson} from '../lib/lesson.ts';
import {docxMember} from './docx-xml-helper.mjs';
const result=await build({entryPoints:['lib/export.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {makeWord,teacherDocumentContext}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const knowledge=manualKnowledge(initialBrief).map((item,index)=>({...item,id:'Word:'+index,verified:true,scopeConfirmed:true,detail:'RAW_GRAPH_MEANING',rawDetail:'RAW_GRAPH_MEANING',selectedMeaning:'RAW_GRAPH_MEANING',example:'RAW_GRAPH_EXAMPLE',selectedExamples:['RAW_GRAPH_EXAMPLE']}));
function fixture(){return {brief:initialBrief,knowledge,lesson:templateLesson(initialBrief,knowledge),source:'model',createdAt:new Date().toISOString()}}
async function xml(draft,kind='teacher',options={author:'测试作者'}){return docxMember(await(await makeWord(draft,kind,options)).arrayBuffer())}
test('teacher lessons keep teaching tasks while graph originals move into the evidence package',async()=>{
 const draft=fixture();
 draft.lesson.materials.push({title:'核心词汇表',content:'RAW_GRAPH_MEANING'},{title:'图谱笔顺资料',content:'GRAPH_STROKE_RESOURCE'},{title:'词汇交际任务卡',content:'学生交换信息后选择一个旅行方案。'});
 draft.culturalEvidence=[{id:'Cultural:1',kind:'Cultural',name:'文化资料',sentence:'RAW_CULTURE_FACT',source:'图谱来源',stage:'',level1:'',level2:''}];
 draft.lesson.materials.push({title:'资料卡',content:'RAW_CULTURE_FACT'});
 const teacher=await xml(draft),evidence=await xml(draft,'evidence');
 for(const marker of ['RAW_GRAPH_MEANING','RAW_GRAPH_EXAMPLE','GRAPH_STROKE_RESOURCE','RAW_CULTURE_FACT']){assert.ok(!teacher.includes(marker),marker+' leaked into teacher lesson');assert.ok(evidence.includes(marker),marker+' missing from evidence package')}
 assert.ok(teacher.includes('词汇交际任务卡'));assert.ok(teacher.includes('学生交换信息后选择一个旅行方案。'));
 assert.ok(teacher.includes('附录一 教学资料')&&teacher.includes('附录二 待核验事项'));
 assert.deepEqual(teacherDocumentContext(draft).lesson.vocabulary,[]);assert.deepEqual(teacherDocumentContext(draft).lesson.grammar,[]);
});
test('teacher OOXML preserves typography and lets only teaching steps flow across pages',async()=>{
 const blob=await makeWord(fixture(),'teacher',{author:'测试作者'}),bytes=await blob.arrayBuffer(),teacher=docxMember(bytes),styles=docxMember(bytes,'word/styles.xml');
 assert.ok(styles.indexOf('</w:docDefaults>')<styles.indexOf('<w:style '),'Word defaults precede named styles');
 assert.ok(teacher.includes('w:eastAsia="KaiTi"'));assert.ok(teacher.includes('w:ascii="Times New Roman"'));
 assert.ok(teacher.includes('w:top="1440" w:right="1803" w:bottom="1440" w:left="1803"'));
 assert.ok(teacher.includes('w:sz w:val="44"'));assert.ok(teacher.includes('w:sz w:val="28"'));assert.ok(teacher.includes('w:sz w:val="24"'));
 assert.ok(teacher.includes('作者：测试作者'));assert.ok(!teacher.includes('<w:shd'));
 assert.ok([...teacher.matchAll(/w:color w:val="([^"]+)"/g)].every(match=>match[1]==='000000'));
 const firstTable=teacher.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)[0];
 assert.equal([...firstTable.matchAll(/<w:gridCol /g)].length,3);
 for(const name of ['环节含时间','教师语言/行为','教学说明'])assert.ok(firstTable.includes(name));
 const stepRows=[...firstTable.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)];
 assert.ok(stepRows[0][0].includes('<w:cantSplit/>'));
 for(const row of stepRows.slice(1)){assert.ok(row[0].includes('<w:cantSplit w:val="0"/>'));assert.ok(row[0].includes('<w:keepNext w:val="0"/><w:keepLines w:val="0"/><w:widowControl/>'))}
 for(const row of teacher.slice(teacher.indexOf(firstTable)+firstTable.length).matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g))assert.ok(row[0].includes('<w:cantSplit/>'));
 assert.ok(!firstTable.includes('<w:br w:type="page"/>'));
 assert.ok(firstTable.includes('<w:tblHeader/>'));
});
test('long activities stay in a flowing table with continuation labels and no lost text',async()=>{
 const draft=fixture();draft.lesson.activities[0].teacher='连续教师指令。'.repeat(160);draft.lesson.activities[0].students='学生共同完成任务。'.repeat(90);
 const teacher=await xml(draft);assert.ok(teacher.includes('复习与情境导入（续）'));
 const rows=[...teacher.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)];assert.ok(rows.length>draft.lesson.activities.length+1);
 assert.equal((teacher.match(/连续教师指令。/g)||[]).length,160);
 const table=teacher.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)[0];
 assert.equal((table.match(/<w:tblHeader\/>/g)||[]).length,1);
 for(const row of [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].slice(1))assert.ok(row[0].includes('<w:cantSplit w:val="0"/>'));
});
test('activities with many short instructions retain every instruction in bounded continuation rows',async()=>{
 const draft=fixture(),instructions=Array.from({length:70},(_,index)=>`动作${index+1}`);
 draft.lesson.activities[0].teacher=instructions.join('\n');
 const teacher=await xml(draft),rows=[...teacher.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)];
 assert.ok(rows.length>draft.lesson.activities.length+1);
 for(const row of rows){const cells=[...row[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)];for(const cell of cells)assert.ok((cell[0].match(/<w:p>/g)||[]).length<=10)}
 for(const instruction of instructions)assert.ok(teacher.includes(`>${instruction}</w:t>`));
});
test('teacher presentation removes internal labels and always names exercises with a number',async()=>{
 const draft=fixture();draft.lesson.exercises=[{...draft.lesson.exercises[0],question:'机械性·教师自编 选择恰当表达。',answer:'依据《课堂资料》9篇 回答问题。'}];
 const teacher=await xml(draft);assert.ok(teacher.includes('练习 1'));assert.ok(!teacher.includes('机械性·教师自编'));assert.ok(!teacher.includes('依据《课堂资料》9篇'));
 assert.ok(teacher.includes('选择恰当表达。'));
});
