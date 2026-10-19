import {requireUser} from '@/lib/auth';
import {tracked} from '@/lib/usage';
import { body,json,failure,session,config,quota,AppError } from '@/lib/server';
import { searchGraph } from '@/lib/graph';
import { briefSchema,lessonSchema,templateLesson,checkLesson,type Knowledge } from '@/lib/lesson';
import {modelRequest,modelInfo} from '@/lib/model';
import { z } from 'zod';
import { selectionSchema,validateSelections,lessonPrompt,groundedBlocks,checkEvidenceBoundary,PROMPT_VERSION } from '@/lib/evidence';
const selection=z.array(selectionSchema).min(1).max(25);
export async function POST(req:Request){try{const b=await body(req);const user=await requireUser(req);const parsed=briefSchema.safeParse(b.brief),sel=selection.safeParse(b.knowledge);if(!parsed.success||!sel.success)throw new AppError('教学需求或知识清单格式有误。');const brief=parsed.data;if(!modelInfo().configured)throw new AppError('模型服务尚未配置，可先使用模板生成。',503);const s=(await session())!;
 const verified=await searchGraph(s.token,[...new Set(sel.data.map(x=>x.name))],brief.standard);
 const checked=validateSelections(sel.data,verified,brief);
 if(checked.problems.length)throw new AppError(checked.problems.join(' '),422);
 const knowledge=checked.knowledge;
 const revision=typeof b.revision==='string'?b.revision.slice(0,1000):'';
 const previous=b.previous?lessonSchema.safeParse(b.previous):null;
 if(b.previous&&!previous?.success)throw new AppError('待修订教案格式无效。');
 const example={title:'课程标题',goals:[{id:'g1',text:'可观察的学习成果',knowledgeIds:['输入中的知识id']}],activities:[{id:'a1',title:'环节标题',minutes:5,goalIds:['g1'],knowledgeIds:['输入中的知识id'],teacher:'具体教师指令与示范语言',students:'具体学生行动',grouping:'分组方式',output:'可观察成果',assessment:'评价方法'}],materials:[{title:'角色卡A',content:'可直接发给学生的完整信息，与B卡不同'}],exercises:[{question:'完整题目',answer:'参考答案或具体评分标准',goalIds:['g1'],knowledgeIds:['输入中的知识id']}],board:'具体板书内容',homework:'基础与拓展任务',notes:'待教师核验事项'};
 const prompt=lessonPrompt(brief,knowledge,example);
 const messages:{role:string;content:string}[]=[{role:'system',content:prompt},{role:'user',content:JSON.stringify({brief:{...brief,terms:knowledge.map(k=>k.name).join('、')},knowledge:groundedBlocks(knowledge),previous:previous?.success?previous.data:null,revision})}];
 for(let attempt=0;attempt<2;attempt++){
 await quota(s.id);
 const raw=await tracked(user.id,'lesson',modelInfo().name,()=>modelRequest(messages));const l=lessonSchema.safeParse(raw);if(!l.success)throw new AppError('模型输出结构不完整，未覆盖现有草稿。',502);
 const errors=[...checkLesson(l.data,brief,knowledge).filter(x=>x.severity==='error'),...checkEvidenceBoundary(l.data,knowledge).map(text=>({text,severity:'error' as const}))];if(errors.length){if(attempt===0){messages.push({role:'assistant',content:JSON.stringify(l.data)},{role:'user',content:'修复以下程序检查错误后返回完整 JSON。不要只返回局部。注意同名但不同类型的知识是不同节点，必须使用各自id。'+errors.map(x=>x.text).join(' ')});continue}throw new AppError('生成教案未通过一致性检查：'+errors.slice(0,3).map(x=>x.text).join(' '),502)}
 return json({lesson:l.data,knowledge,source:'model',createdAt:new Date().toISOString(),promptVersion:PROMPT_VERSION,model:modelInfo().name,reviewed:false});
 }
 throw new AppError('生成教案失败，请重试。',502);
 }catch(e){return failure(e)}}
