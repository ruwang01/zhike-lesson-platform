import { IntroHome } from './intro-home';
import { introLanguage, introMetadata, type IntroParams } from './language';

export async function generateMetadata({ searchParams }: { searchParams: Promise<IntroParams> }) {
  return introMetadata[introLanguage((await searchParams).lang)];
}

export default async function IntroPage({ searchParams }: { searchParams: Promise<IntroParams> }) {
  return <IntroHome params={await searchParams} path="/intro" />;
}
