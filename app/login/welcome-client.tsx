'use client';

import { useEffect,useRef, useState } from 'react';
import {Eye,EyeOff,Volume2,VolumeX} from 'lucide-react';
import LoginScene from './login-scene';
import {useLoginSounds} from './use-login-sounds';
import styles from './login.module.css';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TongueIcon } from '@/components/studio/tongue';
import { setLoggedIn, safeNext } from '@/lib/login-gate';

gsap.registerPlugin(useGSAP);

// Login presentation is scoped to this route. Site authentication uses server sessions; presentation stays scoped to this route.

async function api(path: string, data?: unknown,extraHeaders:Record<string,string>={}) {
  const r = await fetch(path, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json',...extraHeaders } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const d = await r.json() as any;
  if (!r.ok) throw Error(d.error?.message || d.message || d.error || '请求失败，请稍后重试。');
  return d;
}

export default function WelcomeClient({ next,register=false,setup=false }: { next?: string;register?:boolean;setup?:boolean }) {
  const router = useRouter();
  const scope = useRef<HTMLDivElement>(null);
  const pending=useRef(false);
  const [username, setUsername] = useState(setup?'admin':'');
  const [password, setPassword] = useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [setupKey,setSetupKey]=useState('');
  useEffect(()=>{if(setup){setSetupKey(new URLSearchParams(window.location.hash.slice(1)).get('key')||'');window.history.replaceState(null,'',window.location.pathname)}},[setup]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword,setShowPassword]=useState(false);
  const {enabled:soundEnabled,play,toggle:toggleSound}=useLoginSounds();

  // 表单柔和淡入（与地球入场并行）
  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const card = root.querySelector('[data-login-card]');
    const globe = root.querySelector('[data-login-globe]');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([card, globe], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.set(card, { opacity: 0, y: 26 });
    gsap.set(globe, { opacity: 0, scale: 0.94 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.15);
    tl.to(globe, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0.3);

    return () => { tl.kill(); };
  }, { scope });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    setError('');
    if((register||setup)&&password!==confirmPassword){setError('两次密码不一致。');return}
    pending.current=true;
    setBusy(true);
    play('click');
    try {
      if(setup){await api('/api/admin/setup',{username:'admin',name:'管理员',password},{'x-setup-secret':setupKey});await api('/api/account/login',{username:'admin',password})}else await api(register?'/api/account/register':'/api/account/login', { username, password,...(register?{confirmPassword}:{}) });
      play('success');
      setPassword('');
      setLoggedIn();
      router.replace(safeNext(next));
    } catch (err) {
      play('error');
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。');
    } finally {
      pending.current=false;
      setBusy(false);
    }
  }


  return (
    <main className={styles.page} ref={scope}>
      <button type="button" className={styles.sound} onClick={toggleSound} aria-label={soundEnabled?'关闭声音':'开启声音'} aria-pressed={soundEnabled} title={soundEnabled?'关闭声音':'开启声音'}>
        {soundEnabled?<Volume2 size={19}/>:<VolumeX size={19}/>}
      </button>
      <div className={styles.stage}>
        <LoginScene/>
        <section className={styles.formPane} aria-labelledby="login-heading">
          <div className={styles.card} data-login-card>
            <div className={styles.brand}>
              <span className={styles.brandMark}><TongueIcon size={22}/></span>
              <span className={styles.brandName}>智课<small>ZHÌKE STUDIO</small></span>
            </div>
            <div className={styles.heading}>
              <p className={styles.eyebrow}>WELCOME TO ZHÌKE</p>
              <h1 id="login-heading">{setup?'设置管理员账户':register?'注册智课账户':'欢迎使用智课'}</h1>
              <p className={styles.subtitle}>{setup?'请使用私有初始化凭据，为 admin 设置独立密码。':register?'只需用户名与密码，无需手机号或邮箱。':'登录本站账户，查看和管理自己的教案。'}</p>
            </div>
            <form onSubmit={submit}>
              <label className={styles.field}>
                用户名
                <input name="username" readOnly={setup} autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} placeholder="3–32位，字母开头" pattern="[a-zA-Z][a-zA-Z0-9_-]{2,31}" maxLength={32}/>
              </label>
              <label className={styles.field}>
                密码
                <span className={styles.password}>
                  <input id="login-password" aria-label="密码" name="password" type={showPassword?'text':'password'} autoComplete={(register||setup)?'new-password':'current-password'} minLength={(register||setup)?15:undefined} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="请输入密码"/>
                  <button type="button" className={styles.passwordToggle} aria-controls="login-password" aria-label={showPassword?'隐藏密码':'显示密码'} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                </span>
              </label>
              {(register||setup)&&<label className={styles.field}>确认密码<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={15} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="再次输入密码"/></label>}
              {(register||setup)&&<p className={styles.subtitle}>密码需15–128位，可使用长口令。</p>}
              {setup&&<label className={styles.field}>初始化凭据<input type="password" required autoComplete="off" value={setupKey} onChange={e=>setSetupKey(e.target.value)}/></label>}
              {error&&<div className={styles.error} role="alert">{error}</div>}
              <button className={styles.submit} type="submit" disabled={busy}>{busy?'正在验证账户…':setup?'创建管理员并登录':register?'注册并进入工作台':'登录并进入工作台'}</button>
              {!setup&&<a className={styles.guest} href={register?'/login':'/register'}>{register?'已有账户，返回登录':'没有账户？注册'}</a>}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
