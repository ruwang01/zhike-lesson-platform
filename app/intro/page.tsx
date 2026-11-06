import Image from 'next/image';
import { ArrowUpRight, BookOpen, CalendarDays, Files, Search } from 'lucide-react';
import styles from './intro.module.css';

export const metadata = {
  title: '国际中文教育智能备课平台 · 智课',
  description: '基于知识图谱，让每一堂中文课有据可依，让每一次备课都事半功倍。',
};

const features = [
  { title: '教案设计', description: '新建教案，组织本课的知识与活动。', Icon: BookOpen },
  { title: '知识检索', description: '查找汉字、词汇、语法和文化知识点。', Icon: Search },
  { title: '历史教案', description: '查看已保存的教案与草稿。', Icon: Files },
  { title: '课程表', description: '查看课程安排。', Icon: CalendarDays },
];

export default function IntroPage() {
  return (
    <main className={styles.main}>
      <section className={`${styles.container} ${styles.hero}`} aria-labelledby="intro-title">
        <div>
          <p className={styles.eyebrow}>国际中文教育智能备课平台</p>
          <h1 id="intro-title" className={styles.title}><span>智课有谱，</span><span>备课有路！</span></h1>
          <p className={styles.description}>开启你的教案智能生成之旅，基于知识图谱，让每一堂中文课有据可依，让每一次备课都事半功倍。</p>
          <div className={styles.actions}>
            <a className={styles.enter} href="/register">进入系统 <ArrowUpRight aria-hidden="true" size={17} /></a>
            <a className={styles.link} href="/intro/about">认识我们 <ArrowUpRight aria-hidden="true" size={17} /></a>
          </div>
        </div>
        <figure className={styles.artwork}>
          <Image src="/intro/muduo-illustration.svg" width={438} height={388} alt="木铎、图谱连线与展开的书页" unoptimized />
          <span className={`${styles.label} ${styles.language}`}>语言要素</span>
          <span className={`${styles.label} ${styles.graph}`}>知识图谱</span>
          <span className={`${styles.label} ${styles.schedule}`}>课程安排</span>
          <span className={`${styles.label} ${styles.custom}`}>个性定制</span>
          <figcaption className={styles.caption}>教学资源包</figcaption>
        </figure>
      </section>
      <section className={`${styles.container} ${styles.features}`} aria-label="平台功能">
        {features.map(({ title, description, Icon }) => (
          <article className={styles.feature} key={title}>
            <span className={styles.featureIcon}><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
