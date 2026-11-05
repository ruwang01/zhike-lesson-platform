'use client';
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {scopedStorageKey} from './owner-storage';
import {hasWorkspaceProgress} from './workspace-storage';
import {saveLessonRecord} from './lesson-records';
import {writeWorkspaceSnapshot, type WorkspaceSnapshot} from './workspace-storage';
type Snapshot = Omit<WorkspaceSnapshot, 'version'>;
export function useWorkspaceAutosave(snapshot: Snapshot, ready: boolean) {
  const latest = useRef<Snapshot | null>(null);
  const cloudQueue=useRef(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveState,setSaveState]=useState<'saving'|'saved'|'error'>('saving');
  const flush = useCallback((replacement?: Snapshot) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (replacement) latest.current = replacement;
    if (latest.current) {
      let ok=false;
      try{saveLessonRecord({version:2,...latest.current});ok=writeWorkspaceSnapshot(latest.current)}catch{}
      if(ok&&latest.current&&hasWorkspaceProgress(latest.current)&&window.sessionStorage.getItem('zhike-owner')){
       const writing=latest.current;const pendingKey=scopedStorageKey('zhike-pending:'+writing.recordId),pendingValue=JSON.stringify(writing);window.localStorage.setItem(pendingKey,pendingValue);setSaveState('saving');cloudQueue.current=cloudQueue.current.catch(()=>{}).then(async()=>{const response=await fetch('/api/workspaces',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:writing.recordId,snapshot:writing}),keepalive:JSON.stringify(writing).length<50000});if(!response.ok)throw Error('保存失败');if(window.localStorage.getItem(pendingKey)===pendingValue)window.localStorage.removeItem(pendingKey)}).then(()=>{if(latest.current===writing)setSaveState('saved')}).catch(()=>{if(latest.current===writing)setSaveState('error')});
      }else setSaveState(ok?'saved':'error');
      setSaved(ok);
      return ok;
    }
    return false;
  }, []);
  useLayoutEffect(() => {
    if (!ready) return;
    latest.current = snapshot;
    setSaved(false);
    setSaveState('saving');
    timer.current = setTimeout(() => flush(), 350);
    return () => {if (timer.current !== null) clearTimeout(timer.current)};
  }, [ready, snapshot.recordId, snapshot.brief, snapshot.knowledge, snapshot.draft, snapshot.history,
      snapshot.flow, snapshot.active, snapshot.step, snapshot.tab, snapshot.knowledgeVerifyVisible, snapshot.knowledgeWizard, snapshot.selectionConfirmations, snapshot.designWizard, snapshot.exportAuthor, flush]);
  useEffect(() => {
    if (!ready) return;
    const save = () => {flush()};
    const visibility = () => {if (document.visibilityState === 'hidden') save()};
    const navigation = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href], [role="tab"], .tabbar button, .steps button, .knowledge-wizard-nav button')) save();
    };
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('click', navigation, true);
    return () => {
      save();
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('click', navigation, true);
    };
  }, [ready, flush]);
  return {saved, saveState, flush};
}
