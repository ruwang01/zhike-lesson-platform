'use client';
import {useMemo,type ReactNode} from 'react';
import type {Draft} from '@/lib/lesson';
import {teacherDocumentContext} from '@/lib/export';
import {teacherObjectiveGroups,teacherStageRows} from '@/lib/lib/exporter/docbuild.js';
function Numbered({items}:{items:string[]}){
 if(!items.length)return null;
 return items.length===1?<p>{items[0]}</p>:<ol>{items.map((item,index)=><li key={index}>{item}</li>)}</ol>;
}
function Section({title,children,highlight=false}:{title:string;children:ReactNode;highlight?:boolean}){return <section className={'teacher-document-section'+(highlight?' teacher-document-highlight':'')}><h2>{title}</h2>{children}</section>}
export function TeacherDocumentPreview({draft,author=''}:{draft:Draft;author?:string}){
 const ctx=useMemo(()=>teacherDocumentContext(draft,{author}),[draft,author]);
 const lesson=ctx.lesson,groups=teacherObjectiveGroups(lesson.objectives),rows=teacherStageRows(lesson.stages);
 return <div className="teacher-document-frame"><article className="teacher-document-preview" aria-label="教师教案预览">
  <header><h1>{lesson.title}</h1><p className="teacher-document-author">作者：{lesson.author||'________'}</p></header>
  <Section title="一、教学对象"><p>{ctx.brief?.audience}</p></Section>
  <Section title="二、参考教材"><p>{lesson.referenceMaterial||'未指定参考教材'}</p></Section>
  <Section title="三、课型"><p>{ctx.courseType?.name}</p></Section>
  <Section title="四、课时"><p>{ctx.brief?.minutes} 分钟</p></Section>
  <Section title="五、教学目标">{groups.map((group:{domain:string;items:{text:string;criteria?:string}[]},index:number)=><div key={group.domain}><h3>（{['一','二','三'][index]}）{group.domain}</h3>{group.items.length?<Numbered items={group.items.map(item=>item.text+(item.criteria?`（${item.criteria}）`:''))}/>:<p>本课未单列此领域目标。</p>}</div>)}</Section>
  <Section title="六、教学重难点" highlight>{!!lesson.keyPoints.length&&<><h3>（一）教学重点</h3><Numbered items={lesson.keyPoints}/></>}{!!lesson.difficulties.length&&<><h3>{lesson.keyPoints.length?'（二）':'（一）'}教学难点</h3><Numbered items={lesson.difficulties}/></>}</Section>
  <Section title="七、教学步骤"><table className="teacher-document-steps"><colgroup><col style={{width:'17%'}}/><col style={{width:'52%'}}/><col style={{width:'31%'}}/></colgroup><thead><tr><th>环节含时间</th><th>教师语言/行为</th><th>教学说明</th></tr></thead><tbody>{rows.map((row:string[],index:number)=><tr key={index}>{row.map((cell,column)=><td key={column} data-label={['环节含时间','教师语言/行为','教学说明'][column]}>{cell}</td>)}</tr>)}</tbody></table><p className="teacher-document-total">环节时长合计：{lesson.stages.reduce((sum,stage)=>sum+stage.minutes,0)} 分钟</p></Section>
  <section className="teacher-document-appendix"><h2>附录一 教学资料</h2>
   {lesson.materials.map((material,index)=><div key={index}><h3>{lesson.materials.length>1?`${index+1}. `:''}{material.title}</h3><p>{material.content}</p></div>)}
   {lesson.board&&<><h3>板书设计</h3><p>{lesson.board}</p></>}
   {!!lesson.exercises.length&&<><h3>课堂练习与参考答案</h3>{lesson.exercises.map((exercise,index)=><div key={index}><h3>练习 {index+1}</h3><p>{exercise.question}</p><p>参考答案 / 评分标准：{exercise.answer}</p></div>)}</>}
   {!!lesson.homework.length&&<><h3>作业设计</h3><Numbered items={lesson.homework.map(item=>`${item.level}：${item.task}`)}/></>}
   {!!lesson.assessment.length&&<><h3>评价量表</h3><Numbered items={lesson.assessment.map(item=>`${item.item}：${item.criteria}`)}/></>}
   {!!lesson.errors.length&&<><h3>偏误预判与应对</h3><Numbered items={lesson.errors.map(item=>`${item.error}；${item.analysis}；${item.strategy}`)}/></>}
  </section>
  <section className="teacher-document-appendix"><h2>附录二 待核验事项</h2><p>{lesson.notes||'未记录其他待核验事项。'}</p></section>
 </article></div>;
}
