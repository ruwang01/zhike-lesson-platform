'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  CalendarDays,
  BookOpen,
  Trash2,
  Clock,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import {readLessonRecords,type LessonRecord} from '@/lib/lesson-records';
import { WorkspaceNav,ProfileMenu } from '@/components/studio/workspace-nav';
import {
  mondayKey,loadWeekSchedule,saveWeekSchedule,
  DAYS,
  PERIODS,
  CELL_HEIGHT,
  LESSON_TYPES,
  slotKey,
  slotLabel,
  loadSchedule,
  saveSchedule,
  loadLessonPool,
  formatMonth,
  countPlaced,
  type ScheduleData,
  type SlotKey,
  type LessonItem,
  type ScheduleEntry,
} from '@/lib/schedule';

/* ------------------------------------------------------------------ *
 * 课程表（排课系统）
 *
 * 视觉：周次与说明在上方，周课表置于居中的玻璃面板内。
 * 交互：点格子 → 排课表单弹窗（教案 / 课型 / 时间 / 地点，均可留空）
 *       → 保存后格子回显主标题 + 副信息；点标题移出。
 * 数据：课表存 'zhike-schedule'，教案池读 'zhike-workspace'（只读）。
 * ------------------------------------------------------------------ */

/** 弹窗表单的初始值。 */
type FormState = {
  title: string;
  poolId: string;
  lessonType: string;
  time: string;
  location: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  poolId: '',
  lessonType: '',
  time: '',
  location: '',
};

export default function ScheduleClient() {

  const [week,setWeek]=useState(()=>mondayKey());
  const [loadedWeek,setLoadedWeek]=useState('');
  const [saveFailed,setSaveFailed]=useState(false);
  const [records,setRecords]=useState<LessonRecord[]>([]);
  function changeWeek(offset:number){const date=new Date(week+'T12:00:00');date.setDate(date.getDate()+offset*7);setReady(false);const next=mondayKey(date);setWeek(next);window.history.pushState(null,'','/schedule?week='+next)}
  /* ---------- 状态 ---------- */
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [pool, setPool] = useState<LessonItem[]>([]);
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [ready, setReady] = useState(false);

  /* ---------- 挂载：恢复课表 + 载入教案池 ---------- */
  useEffect(() => {
    const requested=new URLSearchParams(window.location.search).get('week');if(requested&&/^\d{4}-\d{2}-\d{2}$/.test(requested)&&!Number.isNaN(Date.parse(requested))){setWeek(mondayKey(new Date(requested+'T12:00:00')))}
    setRecords(readLessonRecords());
    setSchedule(loadWeekSchedule(week));
    setPool([...readLessonRecords().map(r=>({id:'record-'+r.id,title:r.snapshot.draft?.lesson.title||r.snapshot.brief.topic||'未命名教案',meta:r.snapshot.draft?'已生成':'草稿',origin:'history' as const})),...loadLessonPool()]);
    setReady(true);
  }, []);

  useEffect(()=>{setSchedule(loadWeekSchedule(week));setLoadedWeek(week);setReady(true)},[week]);
  useEffect(()=>{const back=()=>{const key=new URLSearchParams(window.location.search).get('week');setWeek(key&&/^\d{4}-\d{2}-\d{2}$/.test(key)?mondayKey(new Date(key+'T12:00:00')):mondayKey())};window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back)},[]);
  /* ---------- 课表变化 → 持久化 ---------- */
  useEffect(() => {
    if (!ready||loadedWeek!==week) return;
    setSaveFailed(!saveWeekSchedule(week,schedule));
  }, [schedule, ready,week,loadedWeek]);

  /* ---------- Esc 关闭弹窗 ---------- */
  useEffect(() => {
    if (!activeSlot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSlot(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlot]);

  /* ---------- 操作 ---------- */

  /** 打开某个槽位的排课表单；已有记录则回显。 */
  const openSlot = (slot: SlotKey) => {
    const existing = schedule[slot];
    setForm(
      existing
        ? {
            title: existing.title,
            poolId: existing.poolId,
            lessonType: existing.lessonType,
            time: existing.time,
            location: existing.location,
          }
        : EMPTY_FORM,
    );
    setActiveSlot(slot);
  };

  /** 保存排课记录。所有字段均可为空。 */
  const save = () => {
    if (!activeSlot) return;
    const entry: ScheduleEntry = {
      title: form.title.trim(),
      poolId: form.poolId,
      placedAt: new Date().toISOString(),
      lessonType: form.lessonType.trim(),
      time: form.time.trim(),
      location: form.location.trim(),
    };
    setSchedule((prev) => {
      const next = { ...prev };
      // 全空 = 清空该节课
      if (!entry.title && !entry.lessonType && !entry.time && !entry.location) {
        delete next[activeSlot];
      } else {
        next[activeSlot] = entry;
      }
      return next;
    });
    setActiveSlot(null);
  };

  /** 把教案移出某个槽位。 */
  const remove = (slot: SlotKey) => {
    setSchedule((prev) => {
      if (!(slot in prev)) return prev;
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  /** 从教案池选择一份，填入表单的教案名。 */
  const pickLesson = (item: LessonItem) => {
    setForm((f) => ({
      ...f,
      title: item.title,
      poolId: item.id,
      // 若未指定课型，用「综合课」作为默认推断
      lessonType: f.lessonType || '综合课',
    }));
  };

  /* ---------- 派生数据 ---------- */
  const placedCount = useMemo(() => countPlaced(schedule), [schedule]);

  const lastUpdated = useMemo(() => {
    const times = Object.values(schedule)
      .map((e) => e.placedAt)
      .filter(Boolean)
      .sort();
    return times.at(-1);
  }, [schedule]);

  return (
    <div className="app-shell schedule-page">
      {/* ==================== 顶部导航（复用站内完整胶囊） ==================== */}
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-mark">
            <CalendarDays size={24} />
          </span>
          <span>
            智课<span className="brand-en">ZHIKE STUDIO</span>
          </span>
        </a>
        <WorkspaceNav active="schedule"/>
        <div className="sidebar-bottom">
          <ProfileMenu/>
        </div>
      </aside>

      <main className="schedule-stage">
        <header className="schedule-heading">
          <h1>课程表</h1>
          <div className="schedule-date-toolbar" role="group" aria-label="切换周次">
            <button className="secondary" onClick={()=>changeWeek(-1)}>上一周</button>
            <span><time dateTime={week}>{week}</time> 起</span>
            <button className="secondary" onClick={()=>changeWeek(1)}>下一周</button>
            <button className="text-button" onClick={()=>{if(week!==mondayKey())setReady(false);setWeek(mondayKey());window.history.pushState(null,'','/schedule')}}>返回今天</button>
          </div>
          <div className="schedule-meta">
            <span className="schedule-meta-count">已排 {placedCount} / {DAYS.length * PERIODS.length} 节</span>
            {lastUpdated && <span>最近安排于 {formatMonth(lastUpdated)}</span>}
            {ready && !saveFailed && <span className="save-status" role="status"><span className="green-dot" />排课已保存</span>}
          </div>
          <p className="schedule-hint">点击空格排课，点击课程编辑，点击垃圾桶移出。课表保存在当前浏览器。</p>
          {saveFailed && <p role="alert" className="message error">排课保存失败，当前输入已保留。<button onClick={()=>setSaveFailed(!saveWeekSchedule(week,schedule))}>重试保存</button></p>}
        </header>
        <div className="schedule-card lg-surface">
          {/* ---------- 课表网格 ---------- */}
          <div className="schedule-grid-wrap">
            <div
              className="schedule-grid"
              style={{ ['--cell-h' as string]: `${CELL_HEIGHT}px` }}
              role="table"
              aria-label="课程表"
            >
              {/* 表头：星期一 → 星期日 */}
              <div className="schedule-row schedule-row-head" role="row">
                <div className="schedule-corner" role="columnheader">
                  <span className="schedule-corner-label">节次</span>
                </div>
                {DAYS.map((day) => (
                  <div className="schedule-th" role="columnheader" key={day}>
                    {day}<small>{(()=>{const d=new Date(week+'T12:00:00');d.setDate(d.getDate()+DAYS.indexOf(day));return `${d.getMonth()+1}/${d.getDate()}`})()}</small>
                  </div>
                ))}
              </div>

              {/* 每一行 = 一节课 */}
              {PERIODS.map((period, p) => (
                <div className="schedule-row" role="row" key={period}>
                  <div className="schedule-td schedule-td-period" role="rowheader">
                    {period}
                  </div>
                  {DAYS.map((day, d) => {
                    const key = slotKey(d, p);
                    const entry = schedule[key];
                    const hasEntry =
                      !!entry &&
                      (!!entry.title ||
                        !!entry.lessonType ||
                        !!entry.time ||
                        !!entry.location);
                    return (
                      <div className="schedule-td" role="cell" key={key}>
                        {hasEntry ? (
                          /* 已排课：主标题 = 教案名（宋体）；副行 = 课型 / 时间 / 地点
                             点击整块 → 重新打开表单编辑；右上角垃圾桶 → 移出 */
                          <button
                            className="schedule-chip"
                            onClick={() => openSlot(key)}
                            title="点击编辑这节课"
                          >
                            <span className="schedule-chip-body">
                              {entry.title && (
                                <span className="schedule-chip-title">
                                  {entry.title}
                                </span>
                              )}
                              {(entry.lessonType || entry.time || entry.location) && (
                                <span className="schedule-chip-meta">
                                  {entry.lessonType && (
                                    <span className="schedule-chip-line">
                                      <GraduationCap size={10} />
                                      {entry.lessonType}
                                    </span>
                                  )}
                                  {entry.time && (
                                    <span className="schedule-chip-line">
                                      <Clock size={10} />
                                      {entry.time}
                                    </span>
                                  )}
                                  {entry.location && (
                                    <span className="schedule-chip-line">
                                      <MapPin size={10} />
                                      {entry.location}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                            <span
                              className="schedule-chip-del"
                              aria-label={`移出 ${entry.title || '该节课'}`}
                              title="移出"
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(key);
                              }}
                            >
                              <Trash2 size={12} />
                            </span>
                          </button>
                        ) : (
                          <button
                            className="schedule-cell-empty"
                            aria-label={`${day} ${period}，点击安排课程`}
                            onClick={() => openSlot(key)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* ==================== 排课表单弹窗 ==================== */}
      {activeSlot && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveSlot(null)}
        >
          <section
            className="modal schedule-picker lg-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="关闭"
              onClick={() => setActiveSlot(null)}
            >
              <X />
            </button>

            <div className="schedule-picker-eyebrow">
              <BookOpen size={13} />
              {slotLabel(activeSlot)}
            </div>
            <h2 id="schedule-picker-title">安排这一节课</h2>
            <p>
              教案与课型、时间、地点均可留空 —— 只填需要的信息即可保存。
            </p>

            {/* ---------- 选择历史教案 ---------- */}
            <div className="schedule-field">
              <label className="schedule-field-label">
                教案
                <span className="schedule-field-optional">选填</span>
              </label>
              <div className="schedule-picker-list">
                {pool.map((item) => {
                  const isCurrent = form.poolId === item.id;
                  return (
                    <button
                      key={item.id}
                      className={
                        'schedule-picker-item' +
                        (isCurrent ? ' is-current' : '') +
                        (form.title === item.title && !isCurrent
                          ? ' is-picked'
                          : '')
                      }
                      onClick={() => pickLesson(item)}
                    >
                      <span className="schedule-picker-item-title">
                        {item.title}
                      </span>
                      <span className="schedule-picker-item-meta">
                        {item.meta}
                      </span>
                      {isCurrent && (
                        <span className="schedule-picker-item-check">
                          <GraduationCap size={13} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {form.poolId&&(()=>{const record=records.find(r=>'record-'+r.id===form.poolId||r.snapshot.draft&&form.poolId.includes(r.snapshot.draft.createdAt));return record?<a className="text-button" href={'/?m=design&entry=resume&lesson='+encodeURIComponent(record.id)}>{record.snapshot.draft?'查看教案':'继续备课'}</a>:null})()}
              {form.title && !form.poolId && (
                <p className="schedule-hint">
                  当前教案名：{form.title}
                </p>
              )}

              {/* 教案名（可直接手填，覆盖上方所选） */}
              <input
                id="schedule-title"
                className="schedule-title-input"
                value={form.title}
                maxLength={150}
                placeholder="或直接输入教案名"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    // 手填教案名 → 不再关联教案池
                    poolId: '',
                  }))
                }
              />
            </div>

            {/* ---------- 课型（三选一 + 可自由输入） ---------- */}
            <div className="schedule-field">
              <span className="schedule-field-label">
                课型
                <span className="schedule-field-optional">选填</span>
              </span>
              <div
                className="schedule-quick"
                role="radiogroup"
                aria-label="课型"
              >
                {LESSON_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={form.lessonType === t}
                    className={
                      'schedule-quick-chip' +
                      (form.lessonType === t ? ' is-on' : '')
                    }
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        lessonType: f.lessonType === t ? '' : t,
                      }))
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                id="schedule-type"
                className="schedule-type-input"
                value={form.lessonType}
                maxLength={40}
                placeholder="或输入其他课型"
                onChange={(e) =>
                  setForm((f) => ({ ...f, lessonType: e.target.value }))
                }
              />
            </div>

            {/* ---------- 上课时间 ---------- */}
            <div className="schedule-field">
              <label className="schedule-field-label" htmlFor="schedule-time">
                上课时间
                <span className="schedule-field-optional">选填</span>
              </label>
              <input
                id="schedule-time"
                value={form.time}
                maxLength={60}
                placeholder="例如：08:00 - 09:40"
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
              />
            </div>

            {/* ---------- 上课地点 ---------- */}
            <div className="schedule-field">
              <label className="schedule-field-label" htmlFor="schedule-place">
                上课地点
                <span className="schedule-field-optional">选填</span>
              </label>
              <input
                id="schedule-place"
                value={form.location}
                maxLength={80}
                placeholder="例如：教二 302"
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>

            {/* ---------- 底部操作 ---------- */}
            <div className="schedule-picker-actions">
              {schedule[activeSlot] && (
                <button
                  className="schedule-danger"
                  onClick={() => {
                    remove(activeSlot);
                    setActiveSlot(null);
                  }}
                >
                  <Trash2 size={14} />
                  清空本节
                </button>
              )}
              <span className="schedule-picker-spacer" />
              <button
                className="schedule-cancel"
                onClick={() => setActiveSlot(null)}
              >
                取消
              </button>
              <button className="schedule-save" onClick={save}>
                保存排课
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
