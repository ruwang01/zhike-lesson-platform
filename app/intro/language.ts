export type IntroLanguage = 'zh' | 'en';
export type IntroParams = {
  lang?: string | string[];
  next?: string | string[];
};

export function introLanguage(lang: IntroParams['lang']): IntroLanguage {
  return lang === 'en' ? 'en' : 'zh';
}

export function introHref(path: string, language: IntroLanguage, next?: IntroParams['next']) {
  const params = new URLSearchParams();
  if (language === 'en') params.set('lang', 'en');
  if (typeof next === 'string') params.set('next', next);
  return params.size ? `${path}?${params}` : path;
}

export const introMetadata = {
  zh: {
    title: '国际中文教育智能备课平台 · 智课',
    description: '基于知识图谱，让每一堂中文课有据可依，让每一次备课都事半功倍。',
  },
  en: {
    title: 'ZHIKE · Lesson Planning for Chinese Language Teachers',
    description: 'Plan Chinese language lessons with a knowledge graph and a clear, step-by-step workflow.',
  },
};
