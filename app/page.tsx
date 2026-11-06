import {AccountWorkspace} from '@/components/studio/account-workspace';
import {requireUser} from '@/lib/auth';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import IntroLayout from './intro/layout';
import IntroPage, {metadata as introMetadata} from './intro/page';
import {isWorkspaceModule} from '@/lib/modules';

type EntryParams = { [key: string]: string | string[] | undefined };
type PageProps = {searchParams: Promise<EntryParams>};

export async function generateMetadata({searchParams}:PageProps) {
  const params=await searchParams;
  return isWorkspaceModule(params.m)?{title:'智课 · 中文教案工作台'}:introMetadata;
}

export default async function Page({searchParams}:PageProps) {
  const params=await searchParams;
  if(!isWorkspaceModule(params.m)) {
    return <IntroLayout><IntroPage searchParams={searchParams}/></IntroLayout>;
  }
  const initialEntry=params.entry==='new'||params.entry==='resume'?params.entry:null;
  let user;try{user=await requireUser(new Request(process.env.AUTH_BASE_URL||'http://localhost',{headers:await headers()}))}catch{redirect('/login')}
  if(params.m==='admin'&&user.role!=='admin')redirect('/?m=dashboard');
  return <AccountWorkspace user={{id:user.id,username:user.username,role:user.role}} module={params.m} entry={initialEntry}/>;
}
