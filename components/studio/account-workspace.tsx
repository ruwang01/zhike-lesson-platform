'use client';
import {useEffect,useState} from 'react';
import Home from './home-client';
import Schedule from './schedule';
import {scopedStorageKey} from '@/lib/owner-storage';
import type {Module} from '@/lib/modules';
export type SiteUser={id:string;username:string;role:string};
export function AccountWorkspace({user,module='dashboard',entry=null,schedule=false}:{user:SiteUser;module?:Module;entry?:'new'|'resume'|null;schedule?:boolean}){
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let stopped=false;window.sessionStorage.setItem('zhike-owner',user.id);async function load(){try{const suffix=':'+user.id;const pendingKeys=Object.keys(localStorage).filter(key=>key.startsWith('zhike-pending:')&&key.endsWith(suffix));for(const key of pendingKeys){const value=localStorage.getItem(key);if(!value)continue;const snapshot=JSON.parse(value);const saved=await fetch('/api/workspaces',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:snapshot.recordId,snapshot})});if(!saved.ok)throw Error('上次编辑尚未同步，请重试；本机草稿仍保留。');if(localStorage.getItem(key)===value)localStorage.removeItem(key)}const response=await fetch('/api/workspaces');const data=await response.json();if(!response.ok)throw Error(data.error||'读取教案失败');if(stopped)return;const records=data.records;localStorage.setItem(scopedStorageKey('zhike-lesson-records-v1'),JSON.stringify(records));const latest=records[0]?.snapshot;if(latest)localStorage.setItem(scopedStorageKey('zhike-workspace'),JSON.stringify(latest));else localStorage.removeItem(scopedStorageKey('zhike-workspace'));setReady(true);setError('')}catch(e){if(!stopped)setError(e instanceof Error?e.message:'读取失败')}}void load();return()=>{stopped=true}},[user.id,retry]);
 if(!ready)return <main><p role={error?'alert':'status'}>{error||'正在读取你的教案…'}</p>{error&&<button onClick={()=>setRetry(x=>x+1)}>重试</button>}</main>;
 return schedule?<Schedule/>:<Home initialModule={module} initialEntry={entry} siteUser={user}/>;
}
