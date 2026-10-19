import {writeFile,mkdir} from 'node:fs/promises';
import {initialBrief,templateLesson,type Knowledge,type Draft} from '../lib/lesson';
import {makeWord} from '../lib/export';
const k:Knowledge[]=[{id:'Word:qa-only',kind:'Word',name:'方便',role:'核心',verified:true,scopeConfirmed:true,selectedMeaning:'便利。',selectedExamples:['交通很方便。'],detail:'便利。',example:'交通很方便。',rawDetail:'便利。',rawExample:'交通很方便。',levels:['二级'],relations:[],checkedAt:'2026-10-19T00:00:00Z',query:'MATCH (n) RETURN n',evidence:{standard:'InternationalLevel',parameters:{terms:['方便']},queries:[]}}];
const b={...initialBrief,terms:'方便'};const d:Draft={brief:b,knowledge:k,lesson:templateLesson(b,k),source:'template',createdAt:'2026-10-19T00:00:00Z',reviewed:false};
d.lesson.title='排版验证样例';
await mkdir('../docx-v2-qa',{recursive:true});for(const kind of ['teacher','student','evidence'] as const){const blob=await makeWord(d,kind);await writeFile('../docx-v2-qa/'+kind+'.docx',new Uint8Array(await blob.arrayBuffer()))}
console.log('Three Word layout fixtures created for QA only.');
