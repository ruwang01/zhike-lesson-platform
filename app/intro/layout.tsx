import type { ReactNode } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import styles from './intro.module.css';

export default function IntroLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.masthead}`}>
          <a className={styles.identity} href="/" aria-label="返回平台说明">
            <Image src="/intro/bnu-logo.png" width={556} height={146} alt="北京师范大学" className={styles.universityLogo} unoptimized />
            <p className={styles.tagline}>知识图谱为基·教案智能生成</p>
          </a>
          <a className={styles.link} href="/intro/about">认识我们 <ArrowUpRight aria-hidden="true" size={16} /></a>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>©</span>
        <a href="/" aria-label="返回平台说明">
          <Image src="/intro/sicle-logo.png" width={1200} height={200} alt="北京师范大学国际中文教育学院" className={styles.collegeLogo} unoptimized />
        </a>
      </footer>
    </div>
  );
}
