import {briefSchema,type Brief} from './lesson';
import type {WorkspaceSnapshot} from './workspace-storage';
export const designSteps=[
 {title:'教案初始信息',description:'填写课程主题、教学对象与预期成果，明确本课的起点。'},
 {title:'汉字图谱选取',description:'检索本课汉字，选择需要的释义与例句；没有汉字要求可以直接继续。',knowledgeKey:'characters'},
 {title:'词汇图谱选取',description:'选择本课词汇、例句和扩展信息，也可补充相关成语。',knowledgeKey:'vocabulary'},
 {title:'语法图谱选取',description:'核对语法内容，选取补充例句和关联例题。',knowledgeKey:'grammar'},
 {title:'文化图谱选取',description:'选择适合本课的文化主题，作为活动设计的依据。',knowledgeKey:'culture'},
 {title:'课堂活动设计',description:'补充活动要求，使用 DeepSeek 设计草稿，再检查与调整课堂活动。'},
 {title:'教案生成',description:'核对本课信息，保留已编辑的活动内容，生成可检查与导出的教案包。'},
] as const;
export type DesignWizardProgress={version:1;step:number;completed:number[];outputReady:boolean};
export const emptyDesignWizard=():DesignWizardProgress=>({version:1,step:0,completed:[],outputReady:false});
export function legacyDesignStep(step:number):number{return step===0?0:step<=4?1:step===5?2:3}
export function restoreDesignWizard(snapshot:Partial<WorkspaceSnapshot>):DesignWizardProgress{
 const raw=snapshot.designWizard;
 if(raw?.version===1&&Number.isInteger(raw.step)){
  const step=Math.max(0,Math.min(snapshot.draft?6:5,raw.step));
  const completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<=6&&(!!snapshot.draft||i<5)))]:[];
  return {version:1,step,completed,outputReady:!!snapshot.draft&&raw.outputReady===true};
 }
 const old=snapshot.step??(snapshot.draft?2:0);
 const step=old===3&&snapshot.draft?6:old===2&&snapshot.draft?5:old===1?Math.min(5,Math.max(1,(snapshot.knowledgeWizard?.step??0)+1)):0;
 return {version:1,step,completed:Array.from({length:step},(_,i)=>i),outputReady:old===3&&!!snapshot.draft};
}
export function initialBriefIssues(brief:Brief):string[]{
 const missing:string[]=[];if(!brief.topic?.trim())missing.push('请填写课程主题。');if(!brief.outcome?.trim())missing.push('请填写预期学习成果。');if(missing.length)return missing;
 const parsed=briefSchema.safeParse(brief);
 if(parsed.success)return [];
 const labels:Record<string,string>={topic:'课程主题',outcome:'预期学习成果',minutes:'课时长度（15–180 分钟）',students:'班级人数（1–100 人）',audience:'教学对象',referenceMaterial:'参考教材',passage:'教学材料'};
 return [...new Set(parsed.error.issues.map(issue=>{const key=String(issue.path[0]);return '请检查'+(labels[key]||'教学需求')+'。'}))];
}
