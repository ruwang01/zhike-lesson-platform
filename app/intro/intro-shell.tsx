import type { ReactNode } from 'react';
import Image from 'next/image';
import { ChevronDown, Languages } from 'lucide-react';
import { introHref, type IntroLanguage, type IntroParams } from './language';
import styles from './intro.module.css';

export default function IntroShell({ children, language, path, next }: {
  children: ReactNode;
  language: IntroLanguage;
  path: '/' | '/intro' | '/intro/about';
  next?: IntroParams['next'];
}) {
  const english = language === 'en';
  const isHome = path !== '/intro/about';
  const home = introHref('/', language);
  const homeLabel = english ? 'Back to the platform introduction' : '返回平台说明';
  const universityLogo = <Image src="/intro/bnu-logo.png" width={556} height={146} alt={english ? 'Beijing Normal University' : '北京师范大学'} className={styles.universityLogo} unoptimized />;
  const tagline = english ? 'Knowledge graphs for smarter lesson planning' : '知识图谱为基·教案智能生成';
  const collegeLink = isHome
    ? { href: 'https://gjzw.bnu.edu.cn/', target: '_blank', rel: 'noreferrer' }
    : { href: home, 'aria-label': homeLabel };

  return (
    <div className={styles.page} lang={english ? 'en' : 'zh-CN'}>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.masthead}`}>
          {isHome ? (
            <div className={styles.identity}>
              <a className={styles.universityLink} href="https://www.bnu.edu.cn/" target="_blank" rel="noreferrer">{universityLogo}</a>
              <a className={styles.tagline} href="https://kg.chineseplus.net/" target="_blank" rel="noreferrer">{tagline}</a>
            </div>
          ) : (
            <a className={styles.identity} href={home} aria-label={homeLabel}>
              {universityLogo}
              <p className={styles.tagline}>{tagline}</p>
            </a>
          )}
          <details className={styles.languageMenu}>
            <summary><Languages aria-hidden="true" size={17} />{english ? 'Language' : '语言切换'}<ChevronDown aria-hidden="true" size={14} /></summary>
            <ul className={styles.languageOptions}>
              <li><a href={introHref(path, 'zh', next)} lang="zh-CN" hrefLang="zh-CN" aria-current={english ? undefined : 'page'}>中文</a></li>
              <li><a href={introHref(path, 'en', next)} lang="en" hrefLang="en" aria-current={english ? 'page' : undefined}>English</a></li>
            </ul>
          </details>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>©</span>
        <a {...collegeLink}>
          <Image src="/intro/sicle-logo.png" width={1200} height={200} alt={english ? 'School of International Chinese Language Education, Beijing Normal University' : '北京师范大学国际中文教育学院'} className={styles.collegeLogo} unoptimized />
        </a>
      </footer>
    </div>
  );
}
