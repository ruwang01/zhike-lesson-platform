'use client';
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {writeWorkspaceSnapshot, type WorkspaceSnapshot} from './workspace-storage';
type Snapshot = Omit<WorkspaceSnapshot, 'version'>;
export function useWorkspaceAutosave(snapshot: Snapshot, ready: boolean) {
  const latest = useRef<Snapshot | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(false);
  const flush = useCallback((replacement?: Snapshot) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (replacement) latest.current = replacement;
    if (latest.current) {
      const ok = writeWorkspaceSnapshot(latest.current);
      setSaved(ok);
      return ok;
    }
    return false;
  }, []);
  useLayoutEffect(() => {
    if (!ready) return;
    latest.current = snapshot;
    setSaved(false);
    timer.current = setTimeout(() => flush(), 350);
    return () => {if (timer.current !== null) clearTimeout(timer.current)};
  }, [ready, snapshot.brief, snapshot.knowledge, snapshot.draft, snapshot.history,
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
  return {saved, flush};
}
