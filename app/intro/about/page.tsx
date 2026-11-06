import { ArrowLeft } from 'lucide-react';
import styles from '../intro.module.css';

export const metadata = { title: '认识我们 · 智课' };

const capabilities = [
  { title: '知识图谱备课', description: '按课堂需要选取汉字、词汇、语法和文化知识点，生成并导出教学资源包。' },
  { title: '课程表', description: '按教学进度自行添加上课安排。' },
  { title: '历史教案', description: '回看此前生成的教案，为下一次备课查找参考。' },
];

export default function AboutPage() {
  return (
    <main className={styles.about}>
      <div className={styles.container}>
        <a className={styles.link} href="/intro"><ArrowLeft aria-hidden="true" size={17} /> 返回首页</a>
        <p className={styles.aboutEyebrow}>平台简介</p>
        <h1>认识我们</h1>
        <p className={styles.aboutDescription}>这是一个面向国际中文教师的备课平台，依托国际中文教育知识图谱，把选取知识点、准备教学资源和安排上课放在同一个工作流程里。</p>
        <section className={styles.capabilities} aria-label="平台功能">
          {capabilities.map(({ title, description }) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
