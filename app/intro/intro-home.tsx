import Image from 'next/image';
import { ArrowUpRight, BookOpen, CalendarDays, Files, Search } from 'lucide-react';
import IntroShell from './intro-shell';
import { introHref, introLanguage, type IntroParams } from './language';
import styles from './intro.module.css';

const copy = {
  zh: {
    name: '国际中文教育智能备课平台',
    title: ['智课有谱，', '备课有路！'],
    description: '“智”在高效，“谱”在专业，“路”在教学。智慧赋能、知识有据、备课有序。开启你的教案智能生成之旅，让每一次备课都事半功倍。',
    enter: '进入系统',
    about: '认识我们',
    image: '木铎、图谱连线与展开的书页',
    labels: ['语言要素', '知识图谱', '课程安排', '个性定制'],
    caption: '教学资源包',
    features: '平台功能',
  },
  en: {
    name: 'Chinese Language Lesson Planning',
    title: ['Smarter lessons,', 'clearer plans.'],
    description: 'Plan Chinese lessons more efficiently with a professional knowledge graph and a clear teaching workflow.',
    enter: 'Enter the platform',
    about: 'About us',
    image: 'A muduo bell, knowledge graph connections, and an open book',
    labels: ['Language', 'Knowledge Graph', 'Scheduling', 'Tailored Plans'],
    caption: 'Teaching Resource Pack',
    features: 'Platform features',
  },
} as const;

const features = [
  { Icon: BookOpen, zh: ['教案设计', '新建教案，组织本课的知识与活动。'], en: ['Lesson Design', 'Plan a lesson and its activities.'] },
  { Icon: Search, zh: ['知识检索', '查找汉字、词汇、语法和文化知识点。'], en: ['Knowledge Search', 'Find characters, words, grammar, and culture.'] },
  { Icon: Files, zh: ['历史教案', '查看已保存的教案与草稿。'], en: ['Lesson History', 'Open saved plans and drafts.'] },
  { Icon: CalendarDays, zh: ['课程表', '查看课程安排。'], en: ['Schedule', 'View your teaching schedule.'] },
];

export function IntroHome({ params, path }: { params: IntroParams; path: '/' | '/intro' }) {
  const language = introLanguage(params.lang);
  const content = copy[language];
  const loginHref = introHref('/login', 'zh', params.next);
  const aboutHref = introHref('/intro/about', language);

  return (
    <IntroShell language={language} path={path} next={params.next}>
      <main className={styles.main}>
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="intro-title">
          <div>
            <a className={styles.eyebrow} href={introHref('/', language)}>{content.name}</a>
            <h1 id="intro-title" className={styles.title}>{content.title.map(line => <span key={line}>{line}</span>)}</h1>
            <p className={styles.description}>{content.description}</p>
            <div className={styles.actions}>
              <a className={styles.enter} href={loginHref}>{content.enter} <ArrowUpRight aria-hidden="true" size={17} /></a>
              <a className={styles.link} href={aboutHref}>{content.about} <ArrowUpRight aria-hidden="true" size={17} /></a>
            </div>
          </div>
          <figure className={styles.artwork}>
            <Image src="/intro/muduo-illustration.svg" width={438} height={388} alt={content.image} unoptimized />
            <span className={`${styles.label} ${styles.language}`}>{content.labels[0]}</span>
            <span className={`${styles.label} ${styles.graph}`}>{content.labels[1]}</span>
            <span className={`${styles.label} ${styles.schedule}`}>{content.labels[2]}</span>
            <span className={`${styles.label} ${styles.custom}`}>{content.labels[3]}</span>
            <figcaption className={styles.caption}>{content.caption}</figcaption>
          </figure>
        </section>
        <section className={`${styles.container} ${styles.features}`} aria-label={content.features}>
          {features.map(({ Icon, [language]: [title, description] }) => (
            <article className={styles.feature} key={title}>
              <span className={styles.featureIcon}><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </main>
    </IntroShell>
  );
}
