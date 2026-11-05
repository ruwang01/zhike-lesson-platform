'use client';
import {useState} from 'react';
import {type LessonRecord} from '@/lib/lesson-records';
import {formatAudience} from '@/lib/evidence';
export function LessonRecordList({records,onOpen,compact=false}:{records:LessonRecord[];onOpen:(record:LessonRecord,version?:number)=>void;compact?:boolean}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
 const sorted=[...records].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const shown=compact?sorted.slice(0,3):sorted.filter(r=>(filter==='all'||(filter==='generated')===!!r.snapshot.draft)&&JSON.stringify([r.snapshot.brief.topic,r.snapshot.brief.outcome,r.snapshot.draft?.lesson.title]).toLowerCase().includes(query.toLowerCase()));
 return <section className="lesson-record-list">{!compact&&<div className="search-toolbar"><input aria-label="搜索历史教案" placeholder="搜索教案名称或关键词" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="教案状态" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">全部教案</option><option value="draft">草稿</option><option value="generated">已生成</option></select></div>}{shown.length?shown.map(r=><article className="lesson-record-row" key={r.id}><div><h3>{r.snapshot.draft?.lesson.title||r.snapshot.brief.topic||'未命名教案'}</h3><p className="helper">{formatAudience(r.snapshot.brief.audience)} · {r.updatedAt?new Date(r.updatedAt).toLocaleString('zh-CN'):'时间未知'} · {r.snapshot.draft?'已生成':'草稿'}</p>{!compact&&r.versions.length>0&&<details><summary>历史版本（{r.versions.length}）</summary>{r.versions.map((v,i)=><button key={i} className="text-button" onClick={()=>onOpen(r,i)}>{new Date(v.createdAt).toLocaleString('zh-CN')} · {v.lesson.title}</button>)}</details>}</div><button className="secondary" onClick={()=>onOpen(r)}>{r.snapshot.draft?'查看教案':'继续编辑'}</button></article>):<p className="helper">{records.length?'没有符合条件的教案。':'还没有教案，点击“新建教案”开始备课。'}</p>}</section>
}
