import type { Metadata } from 'next';
import Script from 'next/script';
import Background from '@/components/website/background';
import Header from '@/components/website/header';
import HeroSec from '@/components/website/hero-sec';
import { getBreadcrumbSchema, getFaqSchema } from '@/app/schema';
import { siteConfig } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'React Cursor Animation Library',
  description:
    'Explore interactive cursor animations and reusable UI patterns for React and Next.js projects.',
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function Home() {
  return (
    <>
      <Script
        id='home-faq-schema'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqSchema()) }}
      />
      <Script
        id='home-breadcrumb-schema'
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            getBreadcrumbSchema([
              { name: 'Home', item: siteConfig.url },
              { name: 'Components', item: `${siteConfig.url}/components` },
            ])
          ),
        }}
      />
      <Background>
        <Header />
        <HeroSec />
      </Background>
    </>
  );
}
