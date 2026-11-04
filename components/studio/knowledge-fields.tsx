'use client';
import {useCallback,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,LoaderCircle,Search,X} from 'lucide-react';
import {knowledgeColumns,getKnowledgeGroups,splitTerms,graphSearchStandard,withBriefDefaults,type Brief,type Knowledge,type KnowledgeGroups} from '@/lib/lesson';
import {KnowledgeItem} from '@/components/studio/knowledge-item';
import {IdiomMatches} from '@/components/studio/idiom-matches';
import {GrammarRecommendations} from '@/components/studio/grammar-recommendations';
import {CulturalRecommendations} from '@/components/studio/cultural-recommendations';
import {SelectionCard} from '@/components/studio/selection-card';
import type {SelectionConfirmations,SelectionKey} from '@/lib/selection-confirmations';
import type {KnowledgeWizardState} from '@/lib/knowledge-wizard';
import {chooseIdiom} from '@/lib/idioms';

type ColumnKey=(typeof knowledgeColumns)[number]['key'];
const graphKeys=new Set<ColumnKey>(['characters','vocabulary','grammar']);
const kindForKey:Partial<Record<ColumnKey,Knowledge['kind']>>={characters:'Character',vocabulary:'Word',grammar:'Grammar'};

function tagsFromGroups(groups:KnowledgeGroups):Record<ColumnKey,string[]>{
 const out={} as Record<ColumnKey,string[]>;
 for(const {key} of knowledgeColumns)out[key]=splitTerms(groups[key]||'');
 return out;
}
function groupsFromTags(tags:Record<ColumnKey,string[]>):Partial<KnowledgeGroups>{
 const groups:Partial<KnowledgeGroups>={};
 for(const {key} of knowledgeColumns){
  const joined=[...new Set(tags[key]||[])].filter(Boolean).join('、');
  groups[key]=joined;
 }
 return groups;
}

async function searchGraphApi(terms:string[],standard:string){
 const payload={terms,standard};
 console.log('[kg/search] request',payload);
 let r:Response;
 try{
  r=await fetch('/api/kg/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 }catch(e){
  console.error('[kg/search] network error',e instanceof Error?{name:e.name,message:e.message,cause:e.cause}:e);
  throw e instanceof Error?e:Error('网络异常，无法连接图谱服务。');
 }
 const d=await r.json() as {error?:string;knowledge?:Knowledge[]};
 if(!r.ok){
  console.error('[kg/search] HTTP error',{status:r.status,error:d.error,terms});
  throw Error(d.error||'图谱搜索失败，请稍后重试。');
 }
 console.log('[kg/search] response',{status:r.status,termCount:terms.length,knowledgeCount:(d.knowledge||[]).length,kinds:[...new Set((d.knowledge||[]).map(k=>k.kind))]});
 return d.knowledge||[];
}

export type KnowledgeFieldsProps={
 confirmations:SelectionConfirmations;
 onConfirmationChange:(key:SelectionKey,confirmed:boolean)=>void;
 wizard:KnowledgeWizardState;
 onWizardChange:(updater:(previous:KnowledgeWizardState)=>KnowledgeWizardState)=>void;
 brief:Brief;
 standard:string;
 knowledge:Knowledge[];
 connected:boolean;
 username:string;
 onChange:(groups:Partial<KnowledgeGroups>)=>void;
 onKnowledgeChange:(updater:(prev:Knowledge[])=>Knowledge[])=>void;
 onCulturalTopicsChange:(topics:NonNullable<Brief['culturalTopics']>)=>void;
 onStepSearch:(filtered:Knowledge[],terms:string[],stepKey:ColumnKey)=>void;
 onGrammarMatched:(items:Knowledge[])=>void;
 onNeedConnect:()=>void;
 onSpecifyActivity?:()=>void;
 onWizardComplete?:()=>void;
};

export default function KnowledgeFields({confirmations,onConfirmationChange,wizard,onWizardChange,brief,standard,knowledge,connected,username,onChange,onKnowledgeChange,onCulturalTopicsChange,onStepSearch,onGrammarMatched,onNeedConnect,onSpecifyActivity,onWizardComplete}:KnowledgeFieldsProps){
 const step=wizard.step;
 const tags=useMemo(()=>tagsFromGroups(getKnowledgeGroups(brief)),[brief.knowledgeGroups,brief.terms]);
 const activeKey=knowledgeColumns[step].key;
 const draft=wizard.inputs[activeKey];
 const stepCandidateIds=wizard.candidateIds[activeKey];
 const setDraft=(value:string)=>onWizardChange(previous=>({...previous,inputs:{...previous.inputs,[activeKey]:value}}));
 const setStep=(value:number)=>onWizardChange(previous=>({...previous,step:value}));
 const setStepCandidateIds=(value:string[]|((ids:string[])=>string[]))=>onWizardChange(previous=>({...previous,candidateIds:{...previous.candidateIds,[activeKey]:typeof value==='function'?value(previous.candidateIds[activeKey]):value}}));
 const [searching,setSearching]=useState(false);
 const [searchError,setSearchError]=useState('');

 const column=knowledgeColumns[step];
 const key=column.key;
 const isGraph=graphKeys.has(key);
 const expectedKind=kindForKey[key];
 const totalSteps=knowledgeColumns.length;

 const persistTags=useCallback((next:Record<ColumnKey,string[]>)=>{
  onChange(groupsFromTags(next));
  if(knowledgeColumns.some(c=>(next[c.key]||[]).length))onSpecifyActivity?.();
 },[onChange,onSpecifyActivity]);

 const removeTag=(columnKey:ColumnKey,name:string)=>persistTags({...tags,[columnKey]:(tags[columnKey]||[]).filter(t=>t!==name)});

 const flushDraftToTags=()=>{const names=splitTerms(draft);if(!names.length)return;const merged=[...new Set([...(tags[key]||[]),...names])].slice(0,20);persistTags({...tags,[key]:merged});setDraft('')};

 const runSearch=async()=>{
  setSearchError('');
  if(!isGraph){flushDraftToTags();return}
  if(!connected){onNeedConnect();return}
  const terms=splitTerms(draft);
  if(!terms.length){setSearchError('请先输入要检索的名称。');return}
  setSearching(true);
  try{
   const standard=graphSearchStandard(withBriefDefaults(brief));
   const mergedTags={...tags,[key]:[...new Set([...(tags[key]||[]),...terms])]};
   onChange(groupsFromTags(mergedTags));
   const all=await searchGraphApi(terms,standard);
   const filtered=expectedKind?all.filter(n=>n.kind===expectedKind):all;
   onStepSearch(filtered,terms,key);
   setStepCandidateIds(filtered.map(n=>n.id));
   if(!filtered.length){if(all.length&&expectedKind)console.warn('[kg/search] kind mismatch',{step:key,expectedKind,returnedKinds:[...new Set(all.map(n=>n.kind))],terms});setSearchError('未找到匹配节点，可调整名称后重试，或跳过本步。');}
   else onSpecifyActivity?.();
  }catch(e){setSearchError(e instanceof Error?e.message:'搜索失败。')}
  finally{setSearching(false)}
 };

 const syncStepGroups=()=>{
  if(key==='culture'||key==='other'){flushDraftToTags();return}
  const kind=expectedKind;
  if(!kind)return;
  const names=[...new Set([
   ...(tags[key]||[]),
   ...knowledge.filter(k=>(k.kind===kind||(key==='vocabulary'&&k.kind==='Idiom'))&&k.role!=='排除').map(k=>k.name),
  ])].filter(Boolean).slice(0,20);
  persistTags({...tags,[key]:names});
 };

 const finishWizard=()=>{setSearchError('');onWizardComplete?.()};

 const goNext=(skip:boolean)=>{
  if(!skip)syncStepGroups();
  setSearchError('');
  if(step<totalSteps-1)setStep(step+1);
  else finishWizard();
 };

 const goPrev=()=>{
  if(step===0)return;
  setSearchError('');
  setStep(step-1);
 };

 const stepItems=useMemo(()=>{
  const ids=new Set(stepCandidateIds);
  const names=new Set(tags[key]||[]);
  if(key==='vocabulary'){
   return knowledge.filter(k=>k.kind==='Word'&&(ids.has(k.id)||names.has(k.name)));
  }
  if(!expectedKind)return [];
  return knowledge.filter(k=>k.kind===expectedKind&&(ids.has(k.id)||names.has(k.name)));
 },[knowledge,stepCandidateIds,expectedKind,key,tags]);
 const idiomStepItems=useMemo(()=>{
  if(key!=='vocabulary')return [];
  const ids=new Set(stepCandidateIds);
  return knowledge.filter(k=>k.kind==='Idiom'&&k.role!=='排除'&&(ids.has(k.id)||(tags.vocabulary||[]).includes(k.name)));
 },[knowledge,stepCandidateIds,key,tags.vocabulary]);

 const updateItem=(item:Knowledge)=>onKnowledgeChange(prev=>prev.map(k=>k.id===item.id?item:k));

 return <div className="knowledge-fields knowledge-wizard">
  <div className="knowledge-wizard-head"><span className="knowledge-wizard-step">步骤 {step+1} / {totalSteps}</span><h3 className="knowledge-wizard-title">{column.label}</h3><p className="helper knowledge-wizard-hint">{isGraph?'Enter 搜索图谱 · Shift+Enter 换行 · 在卡片内勾选并确认':'Enter 或按钮写入本课需求标签'}</p></div>
  <label className="field knowledge-wizard-input"><span className="sr-only">{column.label}</span><textarea className="knowledge-wizard-textarea" rows={4} maxLength={1200} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void runSearch()}}} placeholder={'例如：'+column.example}/></label>
  <div className="knowledge-wizard-actions"><button type="button" className="secondary" disabled={searching} onClick={()=>void runSearch()}>{searching?<><LoaderCircle className="spin" size={16}/>搜索中…</>:isGraph?<><Search size={16}/>搜索图谱</>:<><Check size={16}/>确认加入标签</>}</button></div>
  {searchError&&<p className="helper knowledge-wizard-error" role="alert">{searchError}</p>}

  {(key==='characters'||key==='vocabulary')&&stepItems.length>0&&<div className="knowledge-wizard-cards">{stepItems.map(item=><KnowledgeItem key={item.id} item={item} standard={standard} defaultOpen={!item.scopeConfirmed} searchHint="请先在本步点击「搜索图谱」。" onChange={updateItem}/>)}</div>}

  {key==='vocabulary'&&<div className="wizard-step-extra wizard-idiom-panel"><h4 className="wizard-step-extra-title">成语匹配</h4><SelectionCard title="成语匹配" confirmed={!!confirmations.idioms} onConfirm={()=>onConfirmationChange('idioms',true)} onReselect={()=>onConfirmationChange('idioms',false)} summary={<ul>{knowledge.filter(item=>item.kind==='Idiom'&&item.role!=='排除').map(item=><li key={item.id}>{item.name}</li>)}</ul>}><IdiomMatches embedded brief={brief} connected={connected} username={username} knowledge={knowledge} onChoose={(item,checked)=>{if(checked)persistTags({...tags,vocabulary:[...new Set([...tags.vocabulary,item.name])]});onKnowledgeChange(old=>chooseIdiom(old,item,checked));if(checked)setStepCandidateIds(ids=>[...new Set([...ids,item.id])])}}/></SelectionCard></div>}

  {idiomStepItems.length>0&&<div className="knowledge-wizard-cards">{idiomStepItems.map(item=><KnowledgeItem key={item.id} item={item} standard={standard} defaultOpen={!item.scopeConfirmed} searchHint="请先勾选上方成语。" onChange={updateItem}/>)}</div>}

  {key==='grammar'&&<div className="wizard-step-extra"><h4 className="wizard-step-extra-title">语法匹配与相关推荐</h4><SelectionCard title="语法匹配与相关推荐" confirmed={!!confirmations.grammar} onConfirm={()=>onConfirmationChange('grammar',true)} onReselect={()=>onConfirmationChange('grammar',false)} summary={<ul>{knowledge.filter(item=>item.kind==='Grammar'&&item.role!=='排除').map(item=><li key={item.id}>{item.name}</li>)}</ul>}><GrammarRecommendations embedded brief={brief} connected={connected} username={username} knowledge={knowledge} onMatched={items=>{onGrammarMatched(items);setStepCandidateIds(ids=>[...new Set([...ids,...items.map(i=>i.id)])]);const names=[...new Set([...(tags.grammar||[]),...items.map(i=>i.name)])].slice(0,20);onChange(groupsFromTags({...tags,grammar:names}))}} onChoose={(item,checked)=>{onKnowledgeChange(old=>old.some(node=>node.id===item.id)?old.map(node=>node.id===item.id?{...node,role:checked?'拓展':'排除'}:node):checked?[...old,item]:old);if(checked)setStepCandidateIds(ids=>[...new Set([...ids,item.id])])}}/></SelectionCard></div>}

  {key==='grammar'&&stepItems.length>0&&<div className="knowledge-wizard-cards">{stepItems.map(item=><KnowledgeItem key={item.id} item={item} standard={standard} defaultOpen={!item.scopeConfirmed} searchHint="请先在本步搜索或等待语法匹配。" onChange={updateItem}/>)}</div>}

  {key==='culture'&&<div className="wizard-step-extra"><h4 className="wizard-step-extra-title">相关文化主题词</h4><SelectionCard title="文化主题" confirmed={!!confirmations.culture} onConfirm={()=>onConfirmationChange('culture',true)} onReselect={()=>onConfirmationChange('culture',false)} summary={<ul>{(brief.culturalTopics||[]).map(item=><li key={item.id}>{item.name}</li>)}</ul>}><CulturalRecommendations embedded brief={brief} connected={connected} username={username} onChange={onCulturalTopicsChange}/></SelectionCard></div>}

  {(tags[key]||[]).length>0&&!isGraph&&<div className="knowledge-tag-row knowledge-tag-row-step">{(tags[key]||[]).map(name=><span className="knowledge-tag" key={name}>{name}<button type="button" aria-label={'移除'+name} onClick={()=>removeTag(key,name)}><X size={14}/></button></span>)}</div>}

  <div className="knowledge-wizard-nav">
   <button type="button" className="text-button" disabled={step===0} onClick={goPrev}><ArrowLeft size={16}/>上一步</button>
   <div className="button-group">
    <button type="button" className="secondary" onClick={()=>goNext(true)}>跳过</button>
    {step<totalSteps-1?<button type="button" className="primary" onClick={()=>goNext(false)}>下一步<ArrowRight size={16}/></button>:<button type="button" className="primary" onClick={()=>goNext(false)}><Check size={16}/>完成知识指定</button>}
   </div>
  </div>
 </div>;
}
