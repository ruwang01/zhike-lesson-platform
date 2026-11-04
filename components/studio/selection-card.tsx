'use client';
import {useEffect,useId,useState,type ReactNode} from 'react';
/** Confirmation is persisted by the owner; opening a confirmed card never enters edit mode. */
export function SelectionCard({title,confirmed,onConfirm,onReselect,summary,children}:{title:string;confirmed:boolean;onConfirm:()=>void;onReselect:()=>void;summary:ReactNode;children:ReactNode}){
 const [open,setOpen]=useState(!confirmed);
 const bodyId=useId();
 useEffect(()=>{if(confirmed)setOpen(false)},[confirmed]);
 return <section className="selection-card lg-surface">
  <button type="button" className="selection-card-trigger" aria-expanded={open} aria-controls={bodyId} onClick={()=>setOpen(value=>!value)}><strong>{title}</strong><span>{confirmed?'已确认':'待确认'} · {open?'收起':'展开'}</span></button>
  {open&&<div id={bodyId} className="selection-card-body">{confirmed?<><div className="selection-summary">{summary}</div><button type="button" className="secondary" onClick={()=>{onReselect();setOpen(true)}}>重新选择</button></>:<>{children}<div className="selection-card-actions"><button type="button" className="primary" onClick={()=>{onConfirm();setOpen(false)}}>确认选择</button></div></>}</div>}
 </section>;
}
