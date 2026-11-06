'use client';
import {AdminPanel} from './admin';
import type {SiteUser} from './account-workspace';
import { useState,useEffect,useRef } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';
import { Network,ArrowRight,ArrowLeft,Check,Download,Plus,X,Clock,Users,FileText,Sparkles,ShieldCheck,ChevronDown,Link2,CheckCircle2,AlertCircle,RotateCcw,Trash2,ClipboardList,GraduationCap,LoaderCircle,ExternalLink,LayoutTemplate } from 'lucide-react';
import { initialBrief,standardNames,manualKnowledge,splitTerms,templateLesson,checkLesson,placeholderIssues,withBriefDefaults,lessonSchema,briefSchema,objectiveDomains,courseTypes,defaultTemplateConfig,graphTermsFromGroups,getKnowledgeGroups,pruneKnowledgeToBrief,knowledgeInBriefScope,freshBriefForNewLesson,augmentBriefWithStepTerms,graphSearchStandard,type Brief,type Knowledge,type Draft,type Lesson,type TemplateConfig,type KnowledgeGroups } from '@/lib/lesson';
import {exampleChoices,formatAudience,formatTeachingContext,knowledgeSelection} from '@/lib/evidence';
import {draftSchema} from '@/lib/workspace';
import {emptyWorkspaceForNewLesson,parseStoredHistory,parseStoredKnowledge,readWorkspaceSnapshot,restoreBriefFromStorage,parseStoredDraft,hasWorkspaceProgress,workspaceResumeStep,type WorkspaceFlow} from '@/lib/workspace-storage';
import {emptyKnowledgeWizard,restoreKnowledgeWizard,hasKnowledgeWizardProgress} from '@/lib/knowledge-wizard';
import {restoreSelectionConfirmations,type SelectionConfirmations,type SelectionKey} from '@/lib/selection-confirmations';
import {confirmKnowledge} from '@/lib/confirm-knowledge';
import {useWorkspaceAutosave} from '@/lib/use-workspace-autosave';
import {TeacherDocumentPreview} from '@/components/studio/teacher-document-preview';
import { exportWord,download,teacherExportIssues } from '@/lib/export';
import {KnowledgeItem} from '@/components/studio/knowledge-item';
import {LessonDesignStep} from '@/components/studio/lesson-editor/lesson-design-step';
import {mergeGrammarMatches} from '@/lib/grammar-recommendations';
import AudiencePicker from '@/components/studio/audience-picker';
import KnowledgeFields from '@/components/studio/knowledge-fields';
import TemplateConfigPanel from '@/components/studio/template-config';
import { ModuleNav } from '@/components/studio/navigation';
import { moduleTitles, type Module } from '@/lib/modules';
import LessonEntry from '@/components/studio/lesson-entry';
import { TongueIcon } from '@/components/studio/tongue';
import {DesignWizardNav} from '@/components/studio/design-wizard-nav';
import {designSteps,emptyDesignWizard,restoreDesignWizard,legacyDesignStep,initialBriefIssues,type DesignWizardProgress} from '@/lib/design-wizard';
import {WorkspaceNav,ProfileMenu} from './workspace-nav';
import {IndependentSearch} from './independent-search';
import {searchKind,searchKinds,type SearchKind} from '@/lib/independent-search';
import {readLessonRecords,saveLessonRecord,type LessonRecord} from '@/lib/lesson-records';
import {LessonRecordList} from './lesson-record-list';
import {DataUsageDialog} from './data-usage-dialog';
import {loadSchedule,slotLabel} from '@/lib/schedule';
async function api(path:string,data?:unknown){let r:Response;try{r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined})}catch{throw Error('网络连接失败，请检查网络后重试。现有草稿已保留。')}let d:any;try{d=await r.json()}catch{throw Error('服务未返回有效数据，请稍后重试。现有草稿已保留。')}if(!r.ok)throw Error(d.error||'请求失败，请稍后重试。');return d}
export default function Home({initialModule,initialEntry,siteUser}:{initialModule:Module;initialEntry:'new'|'resume'|null;siteUser?:SiteUser}){
 const router=useRouter();const params=useSearchParams();
 const [recordId,setRecordId]=useState(''),[records,setRecords]=useState<LessonRecord[]>([]);
 const [searchType,setSearchType]=useState<SearchKind>('characters');
 const [nextClass,setNextClass]=useState('');
 const lastModulePages=useRef({design:0,knowledge:'characters' as SearchKind});
 function route(m:string,sub?:number|string,id=recordId){const url=m==='design'?`/?m=design&entry=resume&ds=${sub??designStep}`:m==='knowledge'?`/?m=knowledge&k=${sub??searchType}`:`/?m=${m}`;window.history.pushState(null,'',url+(m==='design'&&id?'&lesson='+encodeURIComponent(id):''))}

 const [step,setStep]=useState(0),[brief,setBrief]=useState<Brief>(initialBrief),[knowledge,setKnowledge]=useState<Knowledge[]>([]),[draft,setDraft]=useState<Draft|null>(null),[tab,setTab]=useState(0),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[settings,setSettings]=useState(false),[info,setInfo]=useState(false),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[status,setStatus]=useState({connected:false,username:'',modelConfigured:false}),[revision,setRevision]=useState(''),[newTerm,setNewTerm]=useState(''),[ready,setReady]=useState(false),[history,setHistory]=useState<Draft[]>([]);
 const [cloudId,setCloudId]=useState<string|null>(null),[accountRevision,setAccountRevision]=useState(0);
 /** 窄屏（侧栏隐藏）时用弹窗承载「教案结构偏好」。宽屏侧栏里已有同一个面板。 */
 const [templateOpen,setTemplateOpen]=useState(false);
 /** 确认知识：下半区「图谱核验」是否已展开（有指定内容或已完成向导） */
 const [knowledgeVerifyVisible,setKnowledgeVerifyVisible]=useState(false);
 const [pendingKnowledgeSearch,setPendingKnowledgeSearch]=useState(false);
 const [wizardEpoch,setWizardEpoch]=useState(0);
 const [knowledgeWizard,setKnowledgeWizard]=useState(emptyKnowledgeWizard);
 const [exportAuthor,setExportAuthor]=useState('');
 const [selectionConfirmations,setSelectionConfirmations]=useState<SelectionConfirmations>({});
 function confirmSelection(key:SelectionKey,confirmed:boolean){setSelectionConfirmations(current=>({...current,[key]:confirmed}))}
 /** 教案设计模块的入口态：null = 展示入口选择页；'new'/'resume' = 已进入流程。 */
 const [entryChoice,setEntryChoice]=useState<'new'|'resume'|null>(initialEntry);
 const [module,setModule]=useState<Module>(initialModule);
 const inDesignFlow=module==='design'&&!!entryChoice;
 const [designWizard,setDesignWizard]=useState<DesignWizardProgress>(emptyDesignWizard);
 const designStep=designWizard.step;
 const contentStep=module==='knowledge'?1:module==='materials'?2:inDesignFlow?legacyDesignStep(designStep):step;
 useEffect(()=>{if(inDesignFlow)document.querySelector('.design-wizard-nav')?.scrollIntoView?.({block:'start'})},[inDesignFlow,designStep]);
 const requestPending=useRef(false);
 const lastDesignData=useRef<{brief:Brief;knowledge:Knowledge[];draft:Draft|null}|null>(null);
 useEffect(()=>{if(!ready)return;const previous=lastDesignData.current;if(previous&&(previous.brief!==brief||previous.knowledge!==knowledge||(previous.draft?.lesson!==draft?.lesson||previous.draft?.brief!==draft?.brief||previous.draft?.knowledge!==draft?.knowledge)))setDesignWizard(current=>({...current,outputReady:false,completed:current.completed.filter(i=>i!==6)}));lastDesignData.current={brief,knowledge,draft}},[ready,brief,knowledge,draft]);
 const [workspaceActive,setWorkspaceActive]=useState(false);
 const active=workspaceActive||!!draft||knowledge.length>0||hasKnowledgeWizardProgress(knowledgeWizard);
 const currentWorkspace={recordId,brief,knowledge,draft,history,flow:workspaceFlow(),active,step:inDesignFlow?legacyDesignStep(designStep):step,tab,knowledgeVerifyVisible,knowledgeWizard,selectionConfirmations,designWizard,exportAuthor};
 const {saved,saveState,flush:flushWorkspace}=useWorkspaceAutosave(currentWorkspace,ready&&module!=='knowledge');
 function navigate(m:Module){flushWorkspace();setRecords(readLessonRecords());setModule(m);if(m==='materials')setTab(1);if(m==='design'){setEntryChoice('resume');const target=active?lastModulePages.current.design:0;setDesignWizard(current=>({...current,step:target}));route(m,target)}else if(m==='knowledge'){setSearchType(lastModulePages.current.knowledge);route(m,lastModulePages.current.knowledge)}else route(m)}
 function changeSearchKind(kind:SearchKind){flushWorkspace();setModule('knowledge');setSearchType(kind);lastModulePages.current.knowledge=kind;route('knowledge',kind)}
 function openRecord(record:LessonRecord,version?:number,fromHistory=false){if(!flushWorkspace()){setError('保存失败，请重试后再切换教案。');return}const versionDraft=version===undefined?null:record.versions[version];const snap=versionDraft?{...record.snapshot,brief:versionDraft.brief,knowledge:versionDraft.knowledge,draft:versionDraft,designWizard:{version:1 as const,step:6,completed:[0,1,2,3,4,5,6],outputReady:true}}:record.snapshot;lastDesignData.current=null;setRecordId(record.id);setWorkspaceActive(true);setBrief(snap.brief);setKnowledge(snap.knowledge);setDraft(version===undefined?snap.draft:record.versions[version]);setHistory(snap.history);setKnowledgeWizard(restoreKnowledgeWizard(snap.knowledgeWizard));setSelectionConfirmations(restoreSelectionConfirmations(snap.selectionConfirmations));const progress=restoreDesignWizard(snap);setDesignWizard(progress);setStep(workspaceResumeStep(snap));setTab(snap.tab||0);setExportAuthor(snap.exportAuthor||'');setKnowledgeVerifyVisible(!!snap.knowledgeVerifyVisible);setEntryChoice('resume');setModule('design');setWizardEpoch(n=>n+1);setError('');if(!fromHistory)route('design',progress.step,record.id)}
 function workspaceFlow():WorkspaceFlow{return entryChoice==='new'&&step===0&&!draft?'new':'working'}
 function beginNewLesson(noticeText='已开始新的教案。'){if(!flushWorkspace()){setError('保存失败，请重试后再新建教案。');return}const id=crypto.randomUUID();setRecordId(id);const snap={...emptyWorkspaceForNewLesson(history),active:true,exportAuthor,recordId:id};setWorkspaceActive(true);setDesignWizard(emptyDesignWizard());setKnowledgeWizard(emptyKnowledgeWizard());setSelectionConfirmations({});setBrief(snap.brief);setKnowledge([]);setDraft(null);setStep(0);setCloudId(null);setEntryChoice('new');setModule('design');setError('');setNotice(noticeText);setKnowledgeVerifyVisible(false);setPendingKnowledgeSearch(false);setNewTerm('');setRevision('');setWizardEpoch(n=>n+1);flushWorkspace(snap);route('design',0,id)}
 function startNewLesson(){beginNewLesson()}
 /** 进入教案设计：默认先展示入口选择页。 */
 function openDesignEntry(){flushWorkspace();setEntryChoice(null);setModule('design');setError('');}
 /** 直接进入教案设计流程（跳过入口页），用于历史记录 / 材料页的深链。 */
 function openDesignFlow(at?:number){if(at!==undefined)setDesignWizard({version:1,step:at===3?6:at===2?5:at===1?1:0,completed:Array.from({length:at===3?6:at===2?5:at===1?1:0},(_,i)=>i),outputReady:at===3});setEntryChoice('resume');setModule('design');if(at!==undefined)setStep(at);router.replace('/?m=design&entry=resume');}
 const importRef=useRef<HTMLInputElement>(null);
 const refresh=()=>api('/api/status').then(setStatus).catch(()=>{});
 useEffect(()=>{
  refresh();
  const day=(new Date().getDay()+6)%7;const upcoming=Object.entries(loadSchedule()).sort(([a],[b])=>((Number(a.split('-')[0])-day+7)%7)-((Number(b.split('-')[0])-day+7)%7)||a.localeCompare(b)).find(([,v])=>v.title||v.lessonType);if(upcoming)setNextClass(`${slotLabel(upcoming[0])} · ${upcoming[1].time} · ${upcoming[1].title||upcoming[1].lessonType}`);
  const stored=readWorkspaceSnapshot();
  setRecordId(stored?.recordId||crypto.randomUUID());
  if(stored){
   setHistory(parseStoredHistory(stored.history));
   setExportAuthor(typeof stored.exportAuthor==='string'?stored.exportAuthor.slice(0,80):'');
   let restoredBrief=restoreBriefFromStorage(stored.brief);
   const restoredWizard=restoreKnowledgeWizard(stored.knowledgeWizard);
   if(initialModule==='design'&&restoredBrief&&restoredWizard.inputs.other.trim()){const groups=getKnowledgeGroups(restoredBrief);const pending=restoredWizard.inputs.other.trim();restoredBrief={...restoredBrief,knowledgeGroups:{...groups,other:[...new Set([groups.other,pending].filter(Boolean))].join('\n')}};restoredWizard.inputs.other=''}
   const restoredDraft=parseStoredDraft(stored.draft);
   if(restoredBrief){setBrief(restoredBrief);setKnowledge(parseStoredKnowledge(stored.knowledge,restoredBrief))}
   setDraft(restoredDraft);
   setWorkspaceActive(hasWorkspaceProgress(stored));
   setTab(Number.isInteger(stored.tab)?Math.max(0,Math.min(4,stored.tab!)):0);
   setKnowledgeVerifyVisible(!!stored.knowledgeVerifyVisible);
   setKnowledgeWizard(restoredWizard);
   setSelectionConfirmations(restoreSelectionConfirmations(stored.selectionConfirmations));
   if(initialModule==='design'&&!initialEntry&&hasWorkspaceProgress(stored))setEntryChoice('resume');
   setStep(workspaceResumeStep({...stored,draft:restoredDraft}));
   setDesignWizard(restoreDesignWizard({...stored,draft:restoredDraft}));
  }
  if(initialModule==='materials')setTab(1);
  try{for(const h of initialModule==='knowledge'?[]:parseStoredHistory(stored?.history)){const id='legacy-'+h.createdAt;if(!readLessonRecords().some(r=>r.id===id))saveLessonRecord({version:2,recordId:id,brief:h.brief,knowledge:h.knowledge,draft:h,history:[],active:true,step:2})}}catch{}
  setRecords(readLessonRecords());
  setReady(true);
 },[]);
 useEffect(()=>{if(!ready)return;const m=params.get('m');if(m&&Object.hasOwn(moduleTitles,m)){setModule(m as Module);if(m==='design'){const requestedId=params.get('lesson');if(requestedId&&requestedId!==recordId){const record=readLessonRecords().find(r=>r.id===requestedId);if(record){openRecord(record,undefined,true);return}}setEntryChoice('resume');const raw=params.get('ds');if(raw!==null){const target=Number(raw);if(Number.isInteger(target)&&target>=0&&target<=6&&(target<6||draft))setDesignWizard(current=>({...current,step:target}));}}if(m==='knowledge')setSearchType(searchKind(params.get('k')))}},[params,ready]);
 useEffect(()=>{lastModulePages.current.design=designStep},[designStep]);
 useEffect(()=>{if(saved)setRecords(readLessonRecords())},[saved,module]);
 function briefHasSpecifiedKnowledge(b:Brief){const g=b.knowledgeGroups;return !!(g&&Object.values(g).some(v=>typeof v==='string'&&v.trim()))}
 useEffect(()=>{if(module==='knowledge'||contentStep!==1)return;if(briefHasSpecifiedKnowledge(brief))setKnowledgeVerifyVisible(true)},[contentStep,brief.knowledgeGroups]);
 useEffect(()=>{if(module==='knowledge'||!pendingKnowledgeSearch||contentStep!==1)return;setPendingKnowledgeSearch(false);if(!splitTerms(brief.terms).length)return;void search()},[pendingKnowledgeSearch,brief.terms,contentStep]);
 function revealKnowledgeVerify(autoSearch=false){setKnowledgeVerifyVisible(true);if(autoSearch)setPendingKnowledgeSearch(true)}
 function update<K extends keyof Brief>(key:K,value:Brief[K]){setWorkspaceActive(true);setBrief(b=>{const next={...b,[key]:value};
  // 等级体系（standard）改了，图谱等级就不再匹配，必须重新核验。
  // 学习者等级现在藏在教学对象里（audience.level），单独变化时同样需要重新核验。
  const levelChanged=key==='audience'&&(b.audience?.level??'')!==(value as Brief['audience'])?.level;
  if(knowledge.some(k=>k.verified)&&(key==='standard'||levelChanged))setKnowledge(k=>k.map(x=>({...x,verified:false,levels:[],detail:'等级体系已修改，请重新核验。'})));
  return next;});}
 function updateKnowledgeGroups(patch:Partial<KnowledgeGroups>){
  const merged={...getKnowledgeGroups(brief),...patch};
  for(const k of ['characters','vocabulary','grammar','culture','other'] as const){const v=merged[k]?.trim();if(v)merged[k]=v;else delete merged[k]}
  const knowledgeGroups=Object.keys(merged).length?merged:undefined;
  const nextBrief={...brief,knowledgeGroups,terms:graphTermsFromGroups({...getKnowledgeGroups(brief),...patch})};
  setBrief(nextBrief);
  setWorkspaceActive(true);
  setKnowledge(old=>pruneKnowledgeToBrief(old,nextBrief));
 }
 function absorbStepGraphSearch(filtered:Knowledge[],terms:string[],stepKey:'characters'|'vocabulary'|'grammar'|'culture'|'other'){
  if(stepKey!=='characters'&&stepKey!=='vocabulary'&&stepKey!=='grammar')return;
  const kindMap={characters:'Character' as const,vocabulary:'Word' as const,grammar:'Grammar' as const};
  const kind=kindMap[stepKey];
  const foundNames=new Set(filtered.map(k=>k.name));
  const termSet=new Set(terms);
  setKnowledge(old=>{
   let next=old.filter(k=>!(k.kind===kind&&(termSet.has(k.name)||k.id.startsWith(`pending-${stepKey}-`))));
   if(stepKey==='vocabulary')next=next.filter(k=>!(k.kind==='Idiom'&&termSet.has(k.name)));
   for(const item of filtered){
    const node={...item,role:'核心' as const,scopeConfirmed:false};
    const i=next.findIndex(k=>k.id===node.id||(k.name===node.name&&k.kind===node.kind));
    if(i>=0)next[i]={...next[i],...node,role:next[i].role==='排除'?'核心':next[i].role};
    else next.push(node);
   }
   terms.filter(t=>!foundNames.has(t)).forEach((name,i)=>{
    if(next.some(k=>k.name===name&&k.kind===kind))return;
    next.push({id:`pending-${stepKey}-${i}-${name}`,kind,name,role:'核心',verified:false,scopeConfirmed:false,detail:'本次查询未返回对应类别的精确匹配；可更换名称，或先使用已找到的条目生成。',example:'',levels:[],relations:[],checkedAt:new Date().toISOString()});
   });
   return pruneKnowledgeToBrief(next,augmentBriefWithStepTerms(brief,stepKey,terms));
  });
  setKnowledgeVerifyVisible(true);
 }
 const confirmedKnowledge=knowledge.filter(k=>k.scopeConfirmed&&k.role!=='排除'&&knowledgeInBriefScope(k,brief));
 /** 教案结构偏好只写进 brief，不清空知识核验状态（不影响已有图谱匹配）。 */
 function updateTemplateConfig(config:TemplateConfig){setBrief(b=>({...b,templateConfig:config}));}
 async function run(label:string,f:()=>Promise<void>){setBusy(label);setError('');setNotice('');try{await f();return true}catch(e){setError(e instanceof Error?e.message:'操作失败。');return false}finally{setBusy('')}}
 function confirmBrief(){const p=briefSchema.safeParse(brief);if(!p.success){setError('请填写主题、预期成果，并检查课时（15–180分钟）与人数（1–100人）。');return}setError('');setKnowledge(k=>pruneKnowledgeToBrief(k.length?k:manualKnowledge(brief),brief));setKnowledgeVerifyVisible(false);setStep(1);setModule('design');if(entryChoice==='new')router.replace('/?m=design')}
 async function search(){await run('正在核验知识与关系',async()=>{const terms=splitTerms(brief.terms);if(!terms.length)throw Error('请先输入知识点。');const standard=graphSearchStandard(withBriefDefaults(brief));const d=await api('/api/kg/search',{terms,standard});const requested=manualKnowledge(brief);const found=(d.knowledge as Knowledge[]).filter(k=>!brief.knowledgeGroups||requested.some(r=>r.name===k.name&&r.kind===r.kind)).map(k=>({...k,role:brief.knowledgeGroups?'核心' as const:k.role}));const rest=requested.filter(r=>!found.some(k=>k.name===r.name&&k.kind===r.kind)).map((r,i)=>({...r,id:`pending-${i}-${r.kind}-${r.name}`,detail:'本次查询未返回对应类别的精确匹配；可更换名称，或先使用已找到的条目生成。',checkedAt:new Date().toISOString()}));const retained=knowledge.filter(node=>(node.kind==='Grammar'||node.kind==='Idiom')&&node.verified&&knowledgeInBriefScope(node,brief)&&!found.some(item=>item.id===node.id));const merged=[...found,...retained,...rest.filter(item=>!retained.some(node=>node.name===item.name&&node.kind===item.kind))].map(x=>({...x,role:knowledge.find(k=>k.name===x.name&&k.kind===x.kind)?.role||x.role}));setKnowledge(pruneKnowledgeToBrief(merged,brief));setNotice(`核验完成：匹配 ${found.length} 个节点，${rest.length} 个词条待核验。`)});}
 function template(){if(!knowledge.some(k=>k.role==='核心')){setError('请至少选择一个核心知识点。');return}const d:Draft={brief:{...brief},knowledge:structuredClone(knowledge),lesson:templateLesson(brief,knowledge),source:'template',createdAt:new Date().toISOString(),reviewed:false};if(draft)setHistory(h=>[draft,...h].slice(0,8));setDraft(d);setStep(2);setDesignWizard(current=>({...current,step:5,outputReady:false}));setModule('design');setTab(0);setNotice('已生成规则模板草稿，请补充具体材料并审核。')}
 async function generate(revise=false){if(requestPending.current)return false;requestPending.current=true;try{return await run(revise?'正在修订教案，保留现有草稿':'正在核验知识并生成教案',async()=>{if(!status.connected){setSettings(true);throw Error('请先连接自己的图谱账号。')}const matched=knowledge.filter(k=>k.verified);const skipped=knowledge.filter(k=>k.role!=='排除'&&!k.verified);const d=await api('/api/lesson',{brief,knowledge:matched.map(knowledgeSelection),revision:revise?revision:'',previous:revise?draft?.lesson:undefined});if(draft)setHistory(h=>[draft,...h].slice(0,8));setDraft({brief:{...brief},...d,messages:[...(revise?(draft?.messages||[]):[]),{role:'user',content:revise?revision:'根据已确认的知识与教学需求生成教案',at:new Date().toISOString()},{role:'assistant',content:revise?'已按要求修订教案。':'已生成教案；教学设计需教师审核。',at:new Date().toISOString()}]});setKnowledge(d.knowledge);setStep(2);setDesignWizard(current=>({...current,step:5,outputReady:false}));setModule('design');setTab(0);setRevision('');setNotice((d.validationWarnings?.length?'教案草稿已生成，有'+d.validationWarnings.length+'项待审核问题，可直接查看、编辑或修订。':'教案已生成，请审核教学内容。')+(skipped.length?'本次未使用未匹配条目：'+skipped.map(k=>k.name).join('、')+'。':''))})}finally{requestPending.current=false}}
 function editLesson(f:(l:Lesson)=>Lesson){setDraft(d=>d?{...d,lesson:f(d.lesson),reviewed:false}:d)}
 function editActivity(index:number,key:string,value:string|number){editLesson(l=>({...l,activities:l.activities.map((a,i)=>i===index?{...a,[key]:value}:a)}))}
 async function importDraft(file:File){await run('正在导入',async()=>{if(file.size>250000)throw Error('文件过大，请选择本工具导出的 JSON。');const parsed=draftSchema.safeParse(JSON.parse(await file.text()));if(!parsed.success)throw Error('教案文件格式无效。');const d=parsed.data;const clean=d.knowledge.map((k:Knowledge)=>({...k,scopeConfirmed:false,verified:false,checkedAt:undefined,query:undefined,detail:'从文件导入，需重新核验。'}));setBrief(withBriefDefaults(d.brief));setKnowledgeWizard(emptyKnowledgeWizard());setSelectionConfirmations({});setKnowledge(clean);setDraft({...d,knowledge:clean,source:d.source});setStep(2);setDesignWizard({version:1,step:5,completed:[0,1,2,3,4],outputReady:false});setNotice('导入成功，知识来源需重新核验。')})}
 const issues=draft?[...checkLesson(draft.lesson,draft.brief,draft.knowledge),...(draft.validationWarnings||[]).filter(text=>!checkLesson(draft.lesson,draft.brief,draft.knowledge).some(x=>x.text===text)).map(text=>({text,severity:'warning' as const}))]:[],total=draft?.lesson.activities.reduce((s,a)=>s+a.minutes,0)||0;
 const placeholders=draft?placeholderIssues(draft.lesson):[];
 const teacherPlaceholders=draft?teacherExportIssues(draft):[];
 /**
  * 结构偏好（templateConfig）目前不参与生成，因此它变化时不该把已有教案标记为过期。
  * 比较时剔除该字段，其余需求与知识范围变化仍然提示重新生成。
  */
 const briefComparable=(b:Brief)=>{const {templateConfig: _ignored,...rest}=b;return JSON.stringify(rest)};
 const currentMismatch=!!draft&&(briefComparable(brief)!==briefComparable(draft.brief)||JSON.stringify(knowledge)!==JSON.stringify(draft.knowledge));
 const scopedKnowledge=knowledge.filter(k=>knowledgeInBriefScope(k,brief));
 const core=scopedKnowledge.filter(k=>k.role==='核心').length;
 const paperMode=module==='design'&&((inDesignFlow&&(designStep===5||designStep===6))||(!inDesignFlow&&(step===2||step===3)))&&!!draft;
 const durationSlices=draft?draft.lesson.activities.map(a=>({name:a.title,minutes:a.minutes})):[];
 function visitDesignStep(target:number){
  if(busy||target<0||target>6)return;
  if(target>designStep){const problems=initialBriefIssues(brief);if(problems.length){setError(problems.join(' '));return}}
  const maxUnlocked=Math.max(-1,...designWizard.completed)+1;
  if(target!==designStep&&!designWizard.completed.includes(target)&&target>maxUnlocked)return;
  if(target===6&&!draft){setError('请先完成课堂活动设计，取得可编辑的教案草稿。');return}
  flushWorkspace();route('design',target);setError('');setNotice('');setStep(legacyDesignStep(target));setDesignWizard(current=>({...current,step:target}));
  if(target>=1&&target<=4)setKnowledgeWizard(current=>({...current,step:target-1}));
 }
 async function nextDesignStep(){
  if(busy||requestPending.current)return;
  const problems=initialBriefIssues(brief);if(problems.length){setError(problems.join(' '));return}
  if(designStep===6){
   if(!draft){setError('请返回课堂活动设计，先生成草稿。');return}
   if(currentMismatch){setError('教学需求或知识选择已变化，请返回课堂活动设计重新设计。');return}
   if(teacherPlaceholders.length){setError('请返回课堂活动设计补全内容：'+teacherPlaceholders.slice(0,3).join('；'));return}
   flushWorkspace();setError('');setDesignWizard(current=>({...current,outputReady:true,completed:[...new Set([...current.completed,6])]}));setNotice('教案包已生成，已保留当前手工编辑，可检查并导出。');return;
  }
  if(designStep===5&&(!draft||currentMismatch)){const ok=await generate();if(!ok)return}
  flushWorkspace();route('design',Math.min(6,designStep+1));setError('');setStep(legacyDesignStep(Math.min(6,designStep+1)));setDesignWizard(current=>({...current,step:Math.min(6,designStep+1),completed:[...new Set([...current.completed,designStep])]}));
  if(designStep+1>=1&&designStep+1<=4)setKnowledgeWizard(current=>({...current,step:designStep}));
 }
 function briefAdvanceButton(){return <button type="button" className="primary" onClick={confirmBrief}>确认需求，选择知识点<ArrowRight size={17}/></button>}
 function knowledgeGenerateActions(){return <div className="button-group"><button type="button" className="secondary" disabled={!!busy} onClick={template}>生成模板草稿</button><button type="button" className="primary" disabled={!!busy} onClick={()=>generate()}><Sparkles size={16}/>AI 生成教案</button></div>}
 function openEditorStep(next:number){if(module==='materials')openDesignFlow(next===3?3:1);else setStep(next)}
 function designAdvanceButton(){return <button type="button" className={designStep===6&&designWizard.outputReady?'secondary':'primary'} disabled={!!busy||(designStep===6&&designWizard.outputReady)} onClick={()=>void nextDesignStep()}>{busy?<><LoaderCircle size={17} className="spin"/>处理中…</>:designStep===6?'生成教案':<>下一步<ArrowRight size={17}/></>}</button>}
 return <div className={'app-shell'+(paperMode?' paper-mode':'')+(module==='dashboard'?' dashboard-celadon-theme':'')+(inDesignFlow?' lesson-wizard':'')}><aside className="sidebar"><a href="/" className="brand"><span className="brand-mark"><TongueIcon size={26}/></span><span>智课<span className="brand-en">ZHIKE STUDIO</span></span></a><WorkspaceNav admin={siteUser?.role==='admin'} active={module} step={designStep} kind={searchType} completed={designWizard.completed} busy={!!busy} onModule={m=>navigate(m as Module)} onStep={visitDesignStep} onKind={changeSearchKind}/><div className="sidebar-bottom"><ProfileMenu name={siteUser?.username||'我的备课空间'} onAccount={()=>navigate('account')} onLogout={()=>void run('正在退出',async()=>{if(active){flushWorkspace();await api('/api/workspaces',{id:recordId,snapshot:currentWorkspace})}await api('/api/auth/sign-out',{});window.sessionStorage.removeItem('zhike-owner');window.location.assign('/')})}/></div></aside>
 <div className="main-shell"><header className="topbar"><div>工作空间 <span>/</span> <strong>{moduleTitles[module]}{module==='design'?' / '+designSteps[designStep].title:module==='knowledge'?' / '+searchKinds[searchType]:''}</strong></div><button className="template-mobile-trigger" onClick={()=>setTemplateOpen(true)}><LayoutTemplate size={15}/>教案结构偏好</button></header>
 <main>{module==='design'&&<div className="workspace-save-status" role="status">{saveState==='saved'?'已保存':saveState==='saving'?'保存中…':<button className="text-button" onClick={()=>flushWorkspace()}>保存失败，请重试</button>}</div>}<div className={'page-heading'+(module==='dashboard'?' hero':'')+(module==='design'&&!entryChoice?' entry-hero':'')}><div><div className="eyebrow">LESSON DESIGN WORKSPACE</div><h1>{module==='dashboard'?'把知识，变成一堂好课。':moduleTitles[module]}</h1><p>从教学需求出发，让每一个目标、活动与评价都有据可循。</p>{module==='design'&&!entryChoice&&<button className="connection-pill entry-pill" onClick={()=>setSettings(true)}><span className={status.connected?'green-dot':'amber-dot'}/>{status.connected?'图谱已连接 · '+status.username:'连接知识图谱'}<ChevronDown size={14}/></button>}</div>{module!=='dashboard'&&!(module==='design'&&!entryChoice)&&<button className="connection-pill" onClick={()=>setSettings(true)}><span className={status.connected?'green-dot':'amber-dot'}/>{status.connected?'图谱已连接 · '+status.username:'连接知识图谱'}<ChevronDown size={14}/></button>}</div>
 {module==='design'&&!entryChoice&&<LessonEntry hasDraft={active} lastDraftTitle={draft?.lesson.title||brief.topic} onNew={()=>beginNewLesson()} onResume={()=>{if(!active){setError('暂无未完成的草稿，请先新建一份教案。');return}flushWorkspace();setEntryChoice('resume');setStep(workspaceResumeStep({draft,step}));router.replace('/?m=design&entry=resume')}} onHistory={()=>{setModule('history');router.push('/?m=history')}}/>}
 {inDesignFlow&&<><div className="design-step-heading has-top-action" aria-live="polite"><div><span className="design-step-eyebrow">步骤 {designStep+1} / 7</span><h2>{designSteps[designStep].title}</h2></div><div className="step-top-actions" aria-label="当前步骤顶部操作">{designAdvanceButton()}</div><p>{designSteps[designStep].description}</p></div></>}

 {error&&<div className="message error" role="alert"><AlertCircle size={18}/><span>{error}</span>{inDesignFlow&&designStep===5&&<button className="text-button" disabled={!!busy} onClick={()=>void generate(!!revision.trim())}>重试</button>}<button aria-label="关闭错误" onClick={()=>setError('')}><X size={16}/></button></div>}{notice&&<div className="message success" role="status"><CheckCircle2 size={18}/>{notice}</div>}{busy&&<div className="message progress" role="status"><LoaderCircle className="spin" size={18}/>{busy}，请稍候…</div>}
 {module==='dashboard'&&<section className="workspace-home"><h1>欢迎回到工作台</h1><p>从一份教案开始，安排下一堂课。</p><button className="primary" onClick={startNewLesson}>新建教案<Plus size={17}/></button><div className="section-title"><h2>最近编辑</h2><button className="text-button" onClick={()=>navigate('history')}>查看全部<ArrowRight size={15}/></button></div><LessonRecordList records={records} onOpen={openRecord} compact/><div className="section-title"><h2>下一堂课</h2></div>{nextClass?<p>{nextClass}</p>:<p className="helper">还没有安排课程。<a href="/schedule">前往课程表排课</a></p>}</section>}
 <div hidden={module!=='knowledge'}><IndependentSearch kind={searchType} onConnect={()=>setSettings(true)}/></div>
 {module==='admin'&&siteUser?.role==='admin'&&<AdminPanel/>}
 {module==='account'&&<section className="workspace-card connection-settings"><div className="form-content"><h3>连接国际中文教育知识图谱</h3><p>使用你获批的图谱账号即可搜索知识和生成教案，无需另注册智课账号。</p><button className="primary" onClick={()=>setSettings(true)}>管理图谱连接</button></div></section>}
 {module==='history'&&<section className="history-page"><h2>历史教案</h2><p className="helper">草稿、生成内容和历史版本保存在当前浏览器，可继续编辑或导出备份。</p><LessonRecordList records={records} onOpen={openRecord}/></section>}
 <div className={inDesignFlow?'content-layout design-wizard-layout':paperMode?'content-layout paper-layout':'content-layout'} style={{display:module==='knowledge'||module==='dashboard'||module==='history'||module==='account'||module==='admin'||(module==='design'&&!entryChoice)?'none':undefined}}><section className={inDesignFlow?'workspace-card design-wizard-card':paperMode?'paper-stage':'workspace-card lg-surface'}>
 {!draft&&module==='materials'&&<div className="empty-state"><FileText size={36}/><h3>还没有本课材料</h3><p>先完成一份教案，即可查看角色卡、练习和图谱原文，并导出例句图片。</p><button className="primary" onClick={()=>openDesignFlow(0)}>开始设计教案</button></div>}
 {contentStep===0&&<>{!inDesignFlow&&<div className="card-heading has-top-action"><span className="section-icon"><GraduationCap size={22}/></span><div><h2>这是一堂怎样的课？</h2><p>告诉我们学生的起点，以及这堂课要到达的地方。</p></div><span className="step-counter">01 / 04</span><div className="step-top-actions">{briefAdvanceButton()}</div></div>}<div className="form-content narrow"><div className="form-group"><div className="group-head"><span className="group-index">01</span><h3>基本信息</h3></div><label className="field">课程主题 <span>*</span><input value={brief.topic||''} maxLength={120} onChange={e=>update('topic',e.target.value)} placeholder="例如：比较周末出游方案并提出建议"/>{error&&!brief.topic.trim()&&<small className="field-error">请填写课程主题。</small>}</label><div className="form-grid"><label className="field">课型<select value={brief.courseType||initialBrief.courseType} onChange={e=>update('courseType',e.target.value as Brief['courseType'])}>{courseTypes.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="field">参考教材<input value={brief.referenceMaterial||''} maxLength={200} onChange={e=>update('referenceMaterial',e.target.value)} placeholder="例如：《HSK标准教程》3"/></label></div><div className="form-grid"><label className="field">课时长度（分钟）<div className="input-icon"><Clock size={17}/><input type="number" min={15} max={180} value={brief.minutes??initialBrief.minutes} onChange={e=>update('minutes',Number(e.target.value))}/></div>{error&&(brief.minutes<15||brief.minutes>180)&&<small className="field-error">课时须为 15–180 分钟。</small>}</label><label className="field">班级人数<div className="input-icon"><Users size={17}/><input type="number" min={1} max={100} value={brief.students??initialBrief.students} onChange={e=>update('students',Number(e.target.value))}/></div>{error&&(brief.students<1||brief.students>100)&&<small className="field-error">人数须为 1–100 人。</small>}</label></div><label className="field">汉语等级体系<select value={brief.standard} onChange={e=>update('standard',e.target.value as Brief['standard'])}>{Object.entries(standardNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><div className="field">教学对象<AudiencePicker confirmed={!!selectionConfirmations.audience} onConfirmed={()=>confirmSelection('audience',true)} onReselect={()=>confirmSelection('audience',false)} standard={brief.standard} value={brief.audience??initialBrief.audience} onChange={next=>update('audience',next)}/></div><div className="form-grid"><label className="field">授课地点<select value={brief.teachingLocation||''} onChange={e=>update('teachingLocation',e.target.value as Brief['teachingLocation'])}><option value="">未指定</option><option value="中国">中国</option><option value="海外">海外（中国以外）</option></select></label><label className="field">课堂形式<select value={brief.mode} onChange={e=>update('mode',e.target.value as Brief['mode'])}><option>线下课堂</option><option>线上课堂</option></select></label></div><p className="helper">线上课的授课地点按学生主要所在环境选择。这些信息将用于调整课堂活动、语言支架和文化情境。</p></div><div className="form-group"><div className="group-head"><span className="group-index">02</span><h3>教学要求</h3></div><label className="field">预期学习成果 <span>*</span><textarea rows={3} maxLength={600} value={brief.outcome||''} onChange={e=>update('outcome',e.target.value)} placeholder="下课时，学生能够完成什么具体任务？"/>{error&&!brief.outcome.trim()&&<small className="field-error">请填写预期学习成果。</small>}<small>写一个可观察的成果，比“掌握某个知识点”更有助于设计课堂。</small></label></div><div className="form-group"><div className="group-head"><span className="group-index">03</span><h3>情境材料</h3></div><details className="passage"><summary><Plus size={16}/>补充课文或教材内容 <span>选填</span></summary><label className="field">教学材料<textarea rows={6} maxLength={8000} value={brief.passage||''} onChange={e=>update('passage',e.target.value)} placeholder="粘贴本课材料，用于设计情境。知识点仍由教师指定并确认。"/></label></details></div></div><div className="wizard-preferences">{inDesignFlow&&<TemplateConfigPanel confirmed={!!selectionConfirmations.template} onConfirmed={()=>confirmSelection('template',true)} onReselect={()=>confirmSelection('template',false)} value={brief.templateConfig??defaultTemplateConfig} onChange={updateTemplateConfig}/>}</div><div className="card-footer"><button className="text-button" onClick={()=>{setBrief({...initialBrief});setKnowledge([]);setNotice('已填入案例：中级班比较周末出游方案。')}}><RotateCcw size={15}/>使用示例需求</button>{inDesignFlow&&<button type="button" className="text-button" onClick={()=>importRef.current?.click()}>导入教案备份</button>}{!inDesignFlow&&<>{briefAdvanceButton()}</>}</div></>}
 {contentStep===1&&<>{!inDesignFlow&&<div className="card-heading has-top-action"><span className="section-icon"><Network size={22}/></span><div><h2>确认本课的知识范围</h2></div><span className="step-counter">02 / 04</span>{knowledgeVerifyVisible&&<div className="step-top-actions">{knowledgeGenerateActions()}</div>}</div>}<div className={'form-content knowledge-fused'+(knowledgeVerifyVisible&&!inDesignFlow?' has-verify':'')}><section className="knowledge-upper" aria-label="指定知识点"><KnowledgeFields key={wizardEpoch} embeddedWizard={inDesignFlow} columnKey={inDesignFlow&&designStep>=1&&designStep<=4?(['characters','vocabulary','grammar','culture'] as const)[designStep-1]:undefined} wizard={knowledgeWizard} confirmations={selectionConfirmations} onConfirmationChange={confirmSelection} onWizardChange={updater=>{setKnowledgeWizard(updater);if(module==='knowledge')setStep(1)}} brief={brief} standard={brief.standard} knowledge={knowledge} connected={status.connected} username={status.username} onChange={updateKnowledgeGroups} onKnowledgeChange={updater=>setKnowledge(updater)} onCulturalTopicsChange={topics=>setBrief(current=>({...current,culturalTopics:topics}))} onStepSearch={absorbStepGraphSearch} onGrammarMatched={items=>setKnowledge(old=>mergeGrammarMatches(old,items))} onNeedConnect={()=>setSettings(true)} onSpecifyActivity={()=>setKnowledgeVerifyVisible(true)} onWizardComplete={()=>revealKnowledgeVerify(true)}/></section>{knowledgeVerifyVisible&&!inDesignFlow&&<section className="knowledge-lower" aria-label="图谱核验与确认"><p className="knowledge-verify-lead">已为您匹配图谱相关内容，可在此核对义项与例句。</p><div className="knowledge-toolbar"><span>{confirmedKnowledge.length} 个已确认 · {scopedKnowledge.length} 个候选 · <strong>{core} 个核心</strong></span><button type="button" className="secondary" disabled={!!busy} onClick={status.connected?search:()=>setSettings(true)}><ShieldCheck size={16}/>{status.connected?'重新搜索图谱':'连接图谱并搜索'}</button><button type="button" className="text-button" disabled={!!busy||!knowledge.some(k=>k.verified&&k.role!=='排除')} onClick={()=>{setKnowledge(old=>old.map(k=>k.verified&&k.role!=='排除'?confirmKnowledge({...k,selectedExamples:k.selectedExamples?.length?k.selectedExamples:exampleChoices(k.rawExample??k.example).slice(0,3),selectedQuestionIds:k.selectedQuestionIds??(k.grammarQuestions||[]).slice(0,3).map(question=>question.id)}):k));setNotice('已选用当前匹配条目的图谱原文。')}}>使用全部已匹配原文</button></div><div className="knowledge-list-block"><div className="add-term"><input aria-label="追加知识点" value={newTerm} onChange={e=>setNewTerm(e.target.value)} maxLength={80} placeholder="追加一个词项"/><button type="button" className="secondary" onClick={()=>{if(newTerm.trim()&&!knowledge.some(k=>k.name===newTerm.trim()))setKnowledge(k=>[...k,...manualKnowledge({...brief,knowledgeGroups:undefined,terms:newTerm.trim()}).map(x=>({...x,id:'manual-'+Date.now()}))]);setBrief(b=>{const groups=getKnowledgeGroups(b);const next={...groups,vocabulary:[...new Set([...splitTerms(groups.vocabulary),newTerm.trim()])].filter(Boolean).join('、')};return {...b,knowledgeGroups:next,terms:graphTermsFromGroups(next)}});setNewTerm('')}}><Plus size={16}/>添加</button></div>{confirmedKnowledge.length===0&&<div className="empty-state compact"><Network size={28}/><p>在上方向导卡片中勾选义项、例句并点击「确认此词义」后，会显示在这里。</p></div>}{confirmedKnowledge.map(item=><KnowledgeItem key={item.id} item={item} standard={brief.standard} onChange={changed=>setKnowledge(old=>old.map(k=>k.id===changed.id?changed:k))}/>)}</div></section>}</div>{knowledgeVerifyVisible&&!inDesignFlow&&<div className="card-footer knowledge-sticky-footer"><button type="button" className="text-button" onClick={()=>setStep(0)}><ArrowLeft size={16}/>返回需求</button>{knowledgeGenerateActions()}</div>}</>}
 {inDesignFlow&&designStep===5&&<div className="form-content activity-design-intro"><label className="field">课堂活动要求（选填）<textarea rows={3} maxLength={1200} value={getKnowledgeGroups(brief).other} onChange={event=>updateKnowledgeGroups({other:event.target.value})} placeholder="例如：两人合作，安排信息差任务，最后进行同伴评价"/></label><p className="helper">{draft?'已有活动草稿，可继续编辑。修改需求或知识后，下一步会重新调用模型。':'点击下一步将调用已配置的 DeepSeek 服务。现有接口返回完整草稿，包含可编辑的课堂活动。'}</p><div className="wizard-secondary-actions"><button type="button" className="text-button" disabled={!!busy} onClick={template}>使用规则模板（不调用 AI）</button>{draft&&<button type="button" className="secondary" disabled={!!busy} onClick={()=>void generate()}>重新设计活动</button>}</div></div>}
 {inDesignFlow&&designStep===6&&!designWizard.outputReady&&draft&&<div className="form-content generation-summary"><div className="generation-topic"><FileText size={28}/><div><h3>{draft.lesson.title}</h3><p>{formatTeachingContext(draft.brief)}</p></div></div><dl><div><dt>课堂时长</dt><dd>{total} 分钟</dd></div><div><dt>课堂活动</dt><dd>{draft.lesson.activities.length} 个环节</dd></div><div><dt>知识依据</dt><dd>{draft.knowledge.filter(item=>item.verified&&item.role!=='排除').length} 项</dd></div></dl><p className="helper">点击“生成教案”将整理当前草稿并保留手工修改，随后可检查与导出 Word。此步骤不重复调用模型。</p>{currentMismatch&&<p className="message warn">需求或知识已改变，请返回课堂活动设计重新生成。</p>}</div>}
 {contentStep===2&&draft&&<LessonDesignStep embeddedWizard={inDesignFlow} draft={draft} tab={tab} setTab={setTab} total={total} durationSlices={durationSlices} currentMismatch={currentMismatch} busy={busy} revision={revision} setRevision={setRevision} editLesson={editLesson} editActivity={editActivity} generate={generate} setStep={inDesignFlow?(next=>visitDesignStep(next===1?4:6)):openEditorStep}/>}{contentStep===3&&draft&&(!inDesignFlow||designWizard.outputReady)&&<div className="teacher-output">
  <div className="teacher-output-tools">
   <label className="field teacher-author-input">作者署名（选填）<input value={exportAuthor} maxLength={80} onChange={event=>setExportAuthor(event.target.value)} placeholder="填写作者姓名"/></label>
   <div className="button-group teacher-export-actions"><button className="primary" disabled={!!busy||!!teacherPlaceholders.length} onClick={()=>run('正在导出教师教案',()=>exportWord(draft,'teacher',{author:exportAuthor}))}><Download size={17}/>导出教师教案</button><button className="secondary" disabled={!!busy} onClick={()=>run('正在导出知识材料包',()=>exportWord(draft,'evidence',{author:exportAuthor}))}>导出知识依据</button><button className="text-button" disabled={!!busy||!!placeholders.length} onClick={()=>run('正在导出学生材料',()=>exportWord(draft,'student',{author:exportAuthor}))}>导出学生材料</button></div>
   <p className="helper">教师教案保留教学活动与配套任务；图谱释义、例句、关联例题和查询记录请在“导出知识依据”中查看。</p>
  </div>
  <details className="teacher-quality-check" open={!!teacherPlaceholders.length||currentMismatch}><summary>检查与审核 · {teacherPlaceholders.length?`${teacherPlaceholders.length} 项需补全`:issues.some(item=>item.severity==='error')?'有待核验事项':'可导出'}</summary><div>
   {currentMismatch&&<p className="check-item issue">需求或知识选择已改变，请返回课堂活动设计重新生成。</p>}
   {teacherPlaceholders.map((text,index)=><p key={index} className="check-item issue">{text}</p>)}
   {issues.map((item,index)=><p key={index} className={'check-item '+(item.severity==='error'?'issue':'warn')}>{item.text}</p>)}
   <label className="scope-confirm"><input type="checkbox" checked={!!draft.reviewed} onChange={event=>{const checked=event.target.checked;setDraft(current=>current?{...current,reviewed:checked}:current)}}/><span>我已人工核对教学内容、例句适切性、练习答案和活动安排。</span></label>
   <div className="button-group"><button className="text-button" onClick={()=>download(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),draft.lesson.title+'.json')}>备份教案 JSON</button><button className="text-button" onClick={()=>importRef.current?.click()}>导入教案备份</button><button className="text-button" onClick={()=>inDesignFlow?visitDesignStep(5):setStep(2)}>继续编辑</button></div>
  </div></details>
  <TeacherDocumentPreview draft={draft} author={exportAuthor}/>
 </div>}

 {inDesignFlow&&<footer className="design-wizard-footer"><button type="button" className="secondary" disabled={designStep===0||!!busy} onClick={()=>visitDesignStep(designStep-1)}><ArrowLeft size={16}/>上一步</button><div className="design-wizard-next"><small>{designWizard.outputReady&&designStep===6?'教案包已生成':designStep===5&&!draft?'下一步将调用 DeepSeek':designStep<6?'下一步：'+designSteps[designStep+1].title:'保留当前编辑，形成教案包'}</small>{designAdvanceButton()}</div></footer>}</section>{!inDesignFlow&&<aside className="context-panel"><div className="context-card lg-surface"><div className="eyebrow">A LITTLE GUIDANCE</div><h3>{['好教案，始于清晰的目标。','先选对，再教好。','活动，要让学习发生。','检查，是为了更好地上课。'][contentStep]}</h3><p>{['试着写出学生下课时能够完成的具体任务。它会成为课堂活动和评价设计的共同起点。','每个知识点都可以指定为复习、核心或拓展。知识量宜少而精，把时间留给真实表达。','一项交际任务应有学生需要交换的信息、共同解决的问题，以及可观察的产出。','程序可以核对时间和引用关系，课堂是否适合你的学生，仍由你作出判断。'][contentStep]}</p><div className="guide-rule"/><span className="guide-label">本课概览</span><h4>{brief.topic||'课程主题'}</h4><div className="brief-tags"><span>{brief.minutes} 分钟</span><span>{brief.students} 人</span><span>{brief.mode}</span></div><p className="context-level">{brief.courseType} · {formatAudience(brief.audience)||'教学对象未填写'}</p></div><TemplateConfigPanel confirmed={!!selectionConfirmations.template} onConfirmed={()=>confirmSelection('template',true)} onReselect={()=>confirmSelection('template',false)} value={brief.templateConfig??defaultTemplateConfig} onChange={updateTemplateConfig}/><div className="workflow-note"><span className="mini-icon"><Network size={20}/></span><div><strong>知识图谱 × 教学设计模型</strong><p>图谱提供知识依据<br/>模型组织教学设计<br/>教师掌握最终决定</p></div></div><button className="import-link" onClick={()=>importRef.current?.click()}><FileText size={16}/>已有教案？导入 JSON 备份<ArrowRight size={14}/></button></aside>}</div><footer className="page-bottom"><span className="footer-bnu"><TongueIcon size={12}/>北京师范大学</span><span>智课 · 让备课更有依据</span><button onClick={()=>setInfo(true)}>数据来源与使用说明</button></footer></main></div>
 <input hidden ref={importRef} type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(f)importDraft(f);e.target.value=''}}/>
 {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><section className="modal" role="dialog" aria-modal="true" aria-label="知识图谱服务"><h2>知识图谱服务</h2><p>{status.connected?'已由本站服务端连接，可直接检索和生成教案。':'服务暂未连接，请重试或联系管理员。'}</p><button className="secondary" onClick={()=>{void refresh();setSettings(false)}}>关闭并刷新状态</button></section></div>}

 {templateOpen&&<div className="modal-backdrop" onClick={()=>setTemplateOpen(false)}><section className="modal template-modal" role="dialog" aria-modal="true" aria-labelledby="template-modal-title" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="关闭教案结构偏好" onClick={()=>setTemplateOpen(false)}><X/></button><span className="section-icon"><LayoutTemplate size={22}/></span><h2 id="template-modal-title">教案结构偏好</h2><p>选择预设模板、决定教案包含哪些模块，并写下排版与行文上的特别要求。这些偏好会随教学需求一起提交。</p><TemplateConfigPanel confirmed={!!selectionConfirmations.template} onConfirmed={()=>{confirmSelection('template',true);setTemplateOpen(false)}} onReselect={()=>confirmSelection('template',false)} defaultOpen value={brief.templateConfig??defaultTemplateConfig} onChange={updateTemplateConfig}/><div className="audience-panel-actions"><button type="button" className="primary" onClick={()=>{confirmSelection('template',true);setTemplateOpen(false)}}><Check size={15}/>完成</button></div></section></div>}
 {info&&<DataUsageDialog onClose={()=>setInfo(false)} onResetLocal={()=>{if(confirm('重置本浏览器当前编辑？请先备份需要保留的内容。')){const snap=emptyWorkspaceForNewLesson([]);flushWorkspace(snap);setWorkspaceActive(false);setExportAuthor('');setDesignWizard(emptyDesignWizard());setKnowledgeWizard(emptyKnowledgeWizard());setSelectionConfirmations({});setHistory([]);setDraft(null);setKnowledge([]);setBrief(snap.brief);setStep(0);setEntryChoice(null);setKnowledgeVerifyVisible(false);setWizardEpoch(n=>n+1);setInfo(false)}}}/>}
 </div>
}
