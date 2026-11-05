import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const plugin={name:'route-components',setup(b){
 b.onResolve({filter:/account-workspace$/},()=>({path:'Home',namespace:'fixture'}));
 b.onResolve({filter:/login\/welcome-client$/},()=>({path:'Welcome',namespace:'fixture'}));
 b.onResolve({filter:/lib\/auth$/},()=>({path:'auth',namespace:'fixture'}));
 b.onResolve({filter:/^next\/(headers|navigation)$/},args=>({path:args.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='auth'?`export const requireUser=async()=>{if(globalThis.__denySite)throw Error('unauthenticated');return {id:'site-user',username:'teacher',role:'admin'}};`:args.path==='next/headers'?`export const headers=async()=>new Headers();`:args.path==='next/navigation'?`export const redirect=path=>{throw Error('Redirect:'+path)};`:args.path==='Home'?`export function AccountWorkspace(){return null}`:`export default function ${args.path}(){return null}`,loader:'js'}));
}};
const result=await build({stdin:{contents:"export {default as Page,generateMetadata} from './app/page.tsx';export {safeNext,LOGIN_KEY,setLoggedIn,clearLoggedIn} from './lib/login-gate.ts';export {WORKSPACE_URL,moduleTitles} from './lib/modules.ts';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',plugins:[plugin]});
const {Page,generateMetadata,safeNext,WORKSPACE_URL,moduleTitles,LOGIN_KEY,setLoggedIn,clearLoggedIn}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const props=searchParams=>({searchParams:Promise.resolve(searchParams)});
test('bare-domain and tracking-link visits show the globe login page',async()=>{
 for(const params of [{},{utm_source:'link'},{m:'unknown'},{m:'constructor'},{m:['design','knowledge']}]){
  const view=await Page(props(params));assert.equal(view.type.name,'Welcome');assert.equal((await generateMetadata(props(params))).title,'欢迎使用智课');
 }
});
test('existing module and draft-resume links still render the workspace',async()=>{
 for(const m of Object.keys(moduleTitles)){
  const view=await Page(props({m,entry:'resume'}));assert.equal(view.type.name,'AccountWorkspace');assert.equal(view.props.module,m);assert.equal(view.props.entry,'resume');
 }
 assert.equal((await Page(props({m:'design',entry:'invalid'}))).props.entry,null);
});
test('landing page passes only a single next target to the unchanged login form',async()=>{
 assert.equal((await Page(props({next:'/schedule'}))).props.next,'/schedule');
 assert.equal((await Page(props({next:['/schedule','/preview']}))).props.next,undefined);
});
test('login and guest entry default to the workspace and avoid landing-page loops',()=>{
 assert.equal(WORKSPACE_URL,'/?m=dashboard');
 for(const next of [null,undefined,[],['/schedule','/'], '', '/','/#section','/?utm_source=x','/?m=unknown','/?m=design&m=knowledge','/login','/login/','/login?next=/','/./login'])assert.equal(safeNext(next),WORKSPACE_URL,next);
});
test('valid workspace and lesson destinations are preserved while external redirects are rejected',()=>{
 for(const next of ['/?m=dashboard','/?m=design&entry=resume','/?m=materials','/schedule','/preview'])assert.equal(safeNext(next),next);
 for(const next of ['https://external.example','//external.example','/\\external.example','javascript:alert(1)'])assert.equal(safeNext(next),WORKSPACE_URL);
});
test('entry preference changes leave saved lesson drafts untouched',()=>{
 const previousWindow=globalThis.window,previousStorage=globalThis.localStorage,previousDocument=globalThis.document;
 const values=new Map([['zhike-workspace','preserved-draft']]);
 globalThis.window={};globalThis.localStorage={setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};globalThis.document={cookie:''};
 try{setLoggedIn();assert.equal(values.get(LOGIN_KEY),'1');clearLoggedIn();assert.equal(values.get('zhike-workspace'),'preserved-draft')}
 finally{globalThis.window=previousWindow;globalThis.localStorage=previousStorage;globalThis.document=previousDocument}
});

test('workspace deep links require a real server session',async()=>{globalThis.__denySite=true;try{await assert.rejects(Page(props({m:'design',entry:'resume'})),/Redirect:\/login/)}finally{globalThis.__denySite=false}});
