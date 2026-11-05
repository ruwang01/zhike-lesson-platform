import type { Metadata } from 'next';
import ScheduleClient from '@/components/studio/schedule';

export const metadata: Metadata = {
  title: '课程表 · 智课',
  description: '排课系统：把生成的教案排入周课表，管理一学期的教学安排。',
};

export default async function SchedulePage(){const {headers}=await import('next/headers');const {redirect}=await import('next/navigation');let user;try{user=await (await import('@/lib/auth')).requireUser(new Request(process.env.AUTH_BASE_URL||'http://localhost',{headers:await headers()}))}catch{return redirect('/login')}const {AccountWorkspace}=await import('@/components/studio/account-workspace');return <AccountWorkspace schedule user={{id:user.id,username:user.username,role:user.role}}/>}
