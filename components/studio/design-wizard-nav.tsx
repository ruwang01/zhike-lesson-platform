'use client';
import {Check} from 'lucide-react';
import {designSteps} from '@/lib/design-wizard';
export function DesignWizardNav({active,completed,busy,onSelect}:{active:number;completed:number[];busy:boolean;onSelect:(step:number)=>void}){
 const canVisit=(index:number)=>index===active||completed.includes(index)||index===Math.max(-1,...completed)+1;
 return <nav className="design-wizard-nav" aria-label="教案设计步骤，共 7 步">
  <ol className="design-wizard-desktop">{designSteps.map((step,index)=>{
   const current=index===active,done=completed.includes(index);
   return <li key={step.title} className={current?'is-current':done?'is-complete':'is-pending'}><button type="button" disabled={busy||!canVisit(index)} aria-current={current?'step':undefined} aria-label={`${index+1}. ${step.title}，${current?'当前步骤':done?'已完成':'未开始'}`} onClick={()=>onSelect(index)}><span className="design-step-number" aria-hidden="true">{done&&!current?<Check size={16}/>:index+1}</span><span className="design-step-name">{step.title}</span></button></li>;
  })}</ol>
  <div className="design-wizard-mobile"><div className="design-wizard-mobile-line"><span>步骤 <strong>{active+1}</strong> / {designSteps.length}</span><select aria-label="切换教案设计步骤" disabled={busy} value={active} onChange={event=>onSelect(Number(event.target.value))}>{designSteps.map((step,index)=><option key={step.title} value={index} disabled={!canVisit(index)}>{completed.includes(index)&&index!==active?'✓ ':''}{index+1}. {step.title}</option>)}</select></div><div className="design-progress-track" aria-hidden="true">{designSteps.map((step,index)=><span key={step.title} className={index===active?'is-current':completed.includes(index)?'is-complete':''}/>)}</div></div>
 </nav>;
}
