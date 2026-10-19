'use client';
import { LayoutDashboard,Network,BookOpen,Files,History,Settings2 } from 'lucide-react';
export type Module='dashboard'|'knowledge'|'design'|'materials'|'history'|'account'|'admin';
export const moduleTitles:Record<Module,string>={dashboard:'我的工作台',knowledge:'知识检索与确认',design:'教案设计',materials:'教学材料',history:'历史会话与版本',account:'账号与设置',admin:'管理员窗口'};
export function ModuleNav({active,onNavigate,onSettings}:{active:Module;onNavigate:(m:Module)=>void;onSettings:()=>void}){return <nav className="module-nav" aria-label="网站功能模块">{([['dashboard',LayoutDashboard],['knowledge',Network],['design',BookOpen],['materials',Files],['history',History]] as const).map(([id,Icon])=><button key={id} className={'nav-item '+(active===id?'active':'')} onClick={()=>onNavigate(id)}><Icon size={18}/>{moduleTitles[id]}</button>)}<button className="nav-item" onClick={onSettings}><Settings2 size={18}/>账号与连接</button></nav>}
