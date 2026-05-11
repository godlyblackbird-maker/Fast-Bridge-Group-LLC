const baseUrl = 'https://cursify.ui-layouts.com';

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cursify',
    description:
      'A comprehensive library of stunning cursor animations and interactive effects for React and Next.js applications',
    url: baseUrl,
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/components/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getSoftwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cursify',
    description:
      'React cursor animation library with 38+ interactive components and production-ready examples.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    url: baseUrl,
    image: `${baseUrl}/og.jpg`,
    author: {
      '@type': 'Organization',
      name: 'Ui Layouts',
      url: 'https://www.ui-layouts.com',
    },
    sameAs: ['https://github.com/ui-layouts/cursify'],
  };
}

export function getFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What frameworks are supported by Cursify components?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cursify components are built for React and Next.js projects.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are Cursify cursor animations free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The component collection is free to browse, copy, and use in your projects.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I copy production-ready code snippets?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Every component page includes implementation code you can copy into your application.',
        },
      },
    ],
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; item: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}
