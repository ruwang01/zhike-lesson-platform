'use client';

import { useRef, useState } from 'react';
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

// Login presentation is scoped to this route. Authentication and guest entry stay unchanged.

async function api(path: string, data?: unknown) {
  const r = await fetch(path, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const d = await r.json() as any;
  if (!r.ok) throw Error(d.error?.message || d.message || d.error || '请求失败，请稍后重试。');
  return d;
}

export default function WelcomeClient({ next }: { next?: string }) {
  const router = useRouter();
  const scope = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    if (busy) return;
    setError('');
    setBusy(true);
    play('click');
    try {
      await api('/api/kg/login', { username, password });
      play('success');
      setPassword('');
      setLoggedIn();
      router.replace(safeNext(next));
    } catch (err) {
      play('error');
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  function enter() {
    setLoggedIn();
    router.replace(safeNext(next));
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
              <h1 id="login-heading">欢迎使用智课</h1>
              <p className={styles.subtitle}>连接你的国际中文教育知识图谱账号，让每一个教学环节都有据可依。</p>
            </div>
            <form onSubmit={submit}>
              <label className={styles.field}>
                图谱账号
                <input name="username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} placeholder="kg.chineseplus.net 账号"/>
              </label>
              <label className={styles.field}>
                密码
                <span className={styles.password}>
                  <input id="login-password" aria-label="密码" name="password" type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="请输入密码"/>
                  <button type="button" className={styles.passwordToggle} aria-controls="login-password" aria-label={showPassword?'隐藏密码':'显示密码'} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                </span>
              </label>
              {error&&<div className={styles.error} role="alert">{error}</div>}
              <button className={styles.submit} type="submit" disabled={busy}>{busy?'正在连接知识图谱…':'登录并进入工作台'}</button>
              <button className={styles.guest} type="button" onClick={enter} disabled={busy}>暂不登录，先进入工作台</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
