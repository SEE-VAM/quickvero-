import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../src/data/tools.ts';
import { CATEGORIES } from '../src/data/categories.ts';
import { GUIDES } from '../src/data/guides.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('Template dist/index.html not found. Please run "vite build" first.');
  process.exit(1);
}

const baseTemplate = fs.readFileSync(templatePath, 'utf-8');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function writePage(subPath: string, htmlContent: string) {
  const targetDir = path.join(distDir, subPath);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, htmlContent, 'utf-8');
  console.log(`[SSG] Generated: /${subPath}/index.html`);
}

function replaceMeta(
  template: string,
  opts: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    jsonLd?: object[];
    rootContent: string;
  }
): string {
  let html = template;

  // 1. Replace Title
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(opts.title)}</title>`);

  // 2. Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(opts.description)}" />`
  );

  // 3. Replace Meta Keywords
  html = html.replace(
    /<meta name="keywords" content=".*?"\s*\/?>/i,
    `<meta name="keywords" content="${escapeHtml(opts.keywords)}" />`
  );

  // 4. Replace Canonical URL
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${opts.canonicalUrl}" />`
  );

  // 5. OpenGraph Tags
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="${opts.canonicalUrl}" />`);
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(opts.title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(opts.description)}" />`);

  // 6. Twitter Tags
  html = html.replace(/<meta property="twitter:url" content=".*?"\s*\/?>/i, `<meta property="twitter:url" content="${opts.canonicalUrl}" />`);
  html = html.replace(/<meta property="twitter:title" content=".*?"\s*\/?>/i, `<meta property="twitter:title" content="${escapeHtml(opts.title)}" />`);
  html = html.replace(/<meta property="twitter:description" content=".*?"\s*\/?>/i, `<meta property="twitter:description" content="${escapeHtml(opts.description)}" />`);

  // 7. Schema.org JSON-LD Replacement
  if (opts.jsonLd && opts.jsonLd.length > 0) {
    const jsonLdString = JSON.stringify(opts.jsonLd, null, 2);
    html = html.replace(
      /<script type="application\/ld\+json">.*?<\/script>/is,
      `<script type="application/ld+json">\n${jsonLdString}\n    </script>`
    );
  }

  // 8. Replace <div id="root">...</div> with rich semantic fallback content for Googlebot
  html = html.replace(
    /<div id="root">[\s\S]*?<\/body>/i,
    `<div id="root">\n${opts.rootContent}\n    </div>\n  </body>`
  );

  return html;
}

console.log('Starting QuickVero Static Pre-rendering (SSG)...');

// 1. Generate Individual Tool Pages
for (const tool of TOOLS) {
  const category = CATEGORIES.find(c => c.id === tool.category) || CATEGORIES[0];
  const canonicalUrl = `https://www.quickvero.in${tool.route}`;

  // Structured Data
  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'QuickVero',
      url: 'https://www.quickvero.in/',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${tool.name} — QuickVero`,
      url: canonicalUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All (Web, Android, iOS, Windows, macOS)',
      description: tool.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: tool.features,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.quickvero.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: `https://www.quickvero.in${category.route}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tool.name,
          item: canonicalUrl,
        },
      ],
    },
  ];

  if (tool.howToSteps && tool.howToSteps.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${tool.name} online`,
      description: `Step-by-step instructions to use ${tool.name} on QuickVero for free.`,
      step: tool.howToSteps.map(s => ({
        '@type': 'HowToStep',
        position: s.step,
        name: s.title,
        text: s.description,
      })),
    });
  }

  if (tool.faqs && tool.faqs.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  // Pre-rendered HTML Body for Googlebot / Instant initial paint
  const rootContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px 16px; color: #1e293b;">
      <nav style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &rarr; 
        <a href="${category.route}" style="color: #2563eb; text-decoration: none;">${category.name}</a> &rarr; 
        <span style="color: #0f172a; font-weight: 600;">${tool.name}</span>
      </nav>

      <header style="margin-bottom: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px;">
        <div style="display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">
          ${category.name} • 100% Free & In-Browser
        </div>
        <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0; line-height: 1.2;">
          ${escapeHtml(tool.name)} Online
        </h1>
        <p style="font-size: 17px; color: #475569; line-height: 1.6; margin: 0; max-width: 800px;">
          ${escapeHtml(tool.description)}
        </p>
      </header>

      <!-- Interactive Tool Container (Protected from Auto-Ads via google-anno-skip) -->
      <section class="google-anno-skip" style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 40px 20px; text-align: center; margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Upload Your File to Begin</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Fast, private, and secure. Your files never leave your device.</p>
        <div style="display: inline-block; background: #2563eb; color: white; font-weight: 700; padding: 12px 28px; border-radius: 12px; font-size: 15px;">
          Select File to Start
        </div>
      </section>

      <!-- Key Features Section -->
      ${tool.features && tool.features.length > 0 ? `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Key Features of ${escapeHtml(tool.name)}</h2>
        <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; list-style: none; padding: 0; margin: 0;">
          ${tool.features.map(f => `
            <li style="background: #f1f5f9; padding: 14px 18px; border-radius: 12px; font-size: 14px; font-weight: 600; color: #334155; border: 1px solid #e2e8f0;">
              ✓ ${escapeHtml(f)}
            </li>
          `).join('')}
        </ul>
      </section>
      ` : ''}

      <!-- How to Guide -->
      ${tool.howToSteps && tool.howToSteps.length > 0 ? `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">How to Use ${escapeHtml(tool.name)} Online</h2>
        <ol style="padding-left: 20px; margin: 0; display: flex; flex-direction: column; gap: 14px;">
          ${tool.howToSteps.map(s => `
            <li style="font-size: 15px; line-height: 1.6; color: #334155;">
              <strong style="color: #0f172a;">${escapeHtml(s.title)}:</strong> ${escapeHtml(s.description)}
            </li>
          `).join('')}
        </ol>
      </section>
      ` : ''}

      <!-- Comprehensive In-Depth Editorial Guide -->
      ${tool.editorial ? `
      <article style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px 24px; margin-bottom: 40px;">
        <h2 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
          ${escapeHtml(tool.editorial.title)}
        </h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.7; margin-bottom: 28px; font-weight: 500;">
          ${escapeHtml(tool.editorial.leadParagraph)}
        </p>

        ${tool.editorial.sections.map(sec => `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(sec.heading)}</h3>
            ${sec.subheading ? `<p style="font-size: 13px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin: 0 0 10px 0;">${escapeHtml(sec.subheading)}</p>` : ''}
            ${sec.paragraphs.map(p => `<p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 12px 0;">${escapeHtml(p)}</p>`).join('')}
            ${sec.bulletPoints && sec.bulletPoints.length > 0 ? `
              <ul style="padding-left: 20px; margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${sec.bulletPoints.map(bp => `<li style="margin-bottom: 6px;">${escapeHtml(bp)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}

        ${tool.editorial.comparisonTable ? `
          <div style="margin-top: 28px; overflow-x: auto;">
            <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">${escapeHtml(tool.editorial.comparisonTable.title)}</h3>
            <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 13px; background: white; border: 1px solid #e2e8f0; border-radius: 12px;">
              <thead>
                <tr style="background: #f1f5f9; color: #0f172a;">
                  ${tool.editorial.comparisonTable.headers.map(h => `<th style="padding: 10px 12px; border-bottom: 1px solid #cbd5e1;">${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tool.editorial.comparisonTable.rows.map(row => `
                  <tr>
                    ${row.map(cell => `<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${escapeHtml(String(cell))}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${tool.editorial.examSpecsTable ? `
          <div style="margin-top: 28px; overflow-x: auto;">
            <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">${escapeHtml(tool.editorial.examSpecsTable.title)}</h3>
            <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 13px; background: white; border: 1px solid #e2e8f0; border-radius: 12px;">
              <thead>
                <tr style="background: #ecfdf5; color: #065f46;">
                  ${tool.editorial.examSpecsTable.headers.map(h => `<th style="padding: 10px 12px; border-bottom: 1px solid #a7f3d0;">${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tool.editorial.examSpecsTable.rows.map(row => `
                  <tr>
                    ${row.map(cell => `<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${escapeHtml(cell)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </article>
      ` : ''}

      <!-- FAQs Section -->
      ${tool.faqs && tool.faqs.length > 0 ? `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Frequently Asked Questions (FAQ)</h2>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${tool.faqs.map(faq => `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
              <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(faq.question)}</h3>
              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">${escapeHtml(faq.answer)}</p>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <!-- Related Category Tools -->
      <section style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Explore More ${escapeHtml(category.name)}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${TOOLS.filter(t => t.category === tool.category && t.id !== tool.id).map(relTool => `
            <a href="${relTool.route}" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #2563eb; text-decoration: none;">
              ${escapeHtml(relTool.name)} &rarr;
            </a>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  const pageHtml = replaceMeta(baseTemplate, {
    title: tool.seoTitle || `${tool.name} Online — Free & Fast | QuickVero`,
    description: tool.seoDescription || tool.description,
    keywords: (tool.keywords || []).join(', '),
    canonicalUrl,
    jsonLd,
    rootContent,
  });

  const subPath = tool.route.replace(/^\//, '');
  writePage(subPath, pageHtml);
}

// 2. Generate Category Pages (e.g. /image-tools, /pdf-tools)
for (const cat of CATEGORIES) {
  const canonicalUrl = `https://www.quickvero.in${cat.route}`;
  const categoryTools = TOOLS.filter(t => t.category === cat.id);

  const rootContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px 16px; color: #1e293b;">
      <nav style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &rarr; 
        <span style="color: #0f172a; font-weight: 600;">${cat.name}</span>
      </nav>

      <header style="margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          ${escapeHtml(cat.name)} — Free Online Utilities
        </h1>
        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0;">
          ${escapeHtml(cat.description)}
        </p>
      </header>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px;">
        ${categoryTools.map(t => `
          <a href="${t.route}" style="display: block; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-decoration: none; color: inherit; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(t.name)}</h2>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 12px 0;">${escapeHtml(t.shortDescription)}</p>
            <span style="font-size: 13px; font-weight: 700; color: #2563eb;">Open Tool &rarr;</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;

  const pageHtml = replaceMeta(baseTemplate, {
    title: `${cat.name} Online — Free, Fast & Private | QuickVero`,
    description: cat.description,
    keywords: `${cat.name.toLowerCase()}, online tools, browser utilities, free file tools`,
    canonicalUrl,
    rootContent,
  });

  const subPath = cat.route.replace(/^\//, '');
  writePage(subPath, pageHtml);
}

// 3. Generate Guides Hub Index (/guides)
{
  const canonicalUrl = 'https://www.quickvero.in/guides';
  const rootContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 32px 16px; color: #1e293b;">
      <nav style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &rarr; 
        <span style="color: #0f172a; font-weight: 600;">Guides</span>
      </nav>

      <header style="margin-bottom: 36px; text-align: center;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0;">
          Guides, Tutorials &amp; Technical Manuals
        </h1>
        <p style="font-size: 17px; color: #475569; max-width: 750px; margin: 0 auto; line-height: 1.6;">
          In-depth technical guides, official recruitment exam specifications, and expert optimization strategies for images, documents, and digital workflows.
        </p>
      </header>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 40px;">
        ${GUIDES.map(g => `
          <article style="background: white; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-bottom: 12px;">
                ${escapeHtml(g.category)} • ${escapeHtml(g.readingTime)}
              </span>
              <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; line-height: 1.35;">
                <a href="/guides/${g.slug}" style="color: inherit; text-decoration: none;">${escapeHtml(g.title)}</a>
              </h2>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px 0;">
                ${escapeHtml(g.description)}
              </p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
              <span style="color: #94a3b8;">${escapeHtml(g.publishDate)}</span>
              <a href="/guides/${g.slug}" style="color: #2563eb; font-weight: 700; text-decoration: none;">Read Guide &rarr;</a>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;

  const pageHtml = replaceMeta(baseTemplate, {
    title: 'Guides, Tutorials & Technical Manuals — QuickVero',
    description: 'Expert guides and specifications for image compression, exam photo resizing, PDF optimization, and digital restaurant QR menus.',
    keywords: 'exam photo resize guide, pdf compression guide, image format comparison, digital qr menu, quickvero tutorials',
    canonicalUrl,
    rootContent,
  });

  writePage('guides', pageHtml);
}

// 4. Generate Individual Guide Article Pages (/guides/:slug)
for (const guide of GUIDES) {
  const canonicalUrl = `https://www.quickvero.in/guides/${guide.slug}`;

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.description,
      author: {
        '@type': 'Organization',
        name: 'QuickVero Editorial Team',
        url: 'https://www.quickvero.in/about',
      },
      publisher: {
        '@type': 'Organization',
        name: 'QuickVero',
        url: 'https://www.quickvero.in/',
      },
      datePublished: '2026-10-15',
      dateModified: '2026-10-19',
      mainEntityOfPage: canonicalUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.quickvero.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Guides',
          item: 'https://www.quickvero.in/guides',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: guide.title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  const rootContent = `
    <article style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 32px 16px; color: #1e293b; line-height: 1.7;">
      <nav style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &rarr; 
        <a href="/guides" style="color: #2563eb; text-decoration: none;">Guides</a> &rarr; 
        <span style="color: #0f172a; font-weight: 600;">${escapeHtml(guide.title)}</span>
      </nav>

      <header style="margin-bottom: 36px; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px;">
        <div style="display: flex; gap: 8px; align-items: center; font-size: 12px; margin-bottom: 12px;">
          <span style="background: #dbeafe; color: #1d4ed8; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
            ${escapeHtml(guide.category)}
          </span>
          <span style="color: #64748b;">• ${escapeHtml(guide.readingTime)}</span>
          <span style="color: #64748b;">• ${escapeHtml(guide.publishDate)}</span>
        </div>
        <h1 style="font-size: 34px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; line-height: 1.25;">
          ${escapeHtml(guide.title)}
        </h1>
        <p style="font-size: 18px; color: #334155; line-height: 1.6; margin: 0; font-weight: 500;">
          ${escapeHtml(guide.lead)}
        </p>
      </header>

      ${guide.tableOfContents && guide.tableOfContents.length > 0 ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 36px;">
        <strong style="display: block; font-size: 14px; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; letter-spacing: 0.5px;">Table of Contents</strong>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #2563eb;">
          ${guide.tableOfContents.map(toc => `<li style="margin-bottom: 6px;"><a href="#${toc.id}" style="color: inherit; text-decoration: none;">${escapeHtml(toc.title)}</a></li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <div style="font-size: 16px; color: #334155;">
        ${guide.sections.map(sec => `
          <section id="${sec.id}" style="margin-bottom: 36px;">
            <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">${escapeHtml(sec.title)}</h2>
            ${sec.paragraphs.map(p => `<p style="margin: 0 0 14px 0; line-height: 1.75;">${escapeHtml(p)}</p>`).join('')}

            ${sec.subsections ? sec.subsections.map(sub => `
              <div style="margin: 18px 0;">
                <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(sub.title)}</h3>
                ${sub.paragraphs.map(p => `<p style="margin: 0 0 10px 0;">${escapeHtml(p)}</p>`).join('')}
                ${sub.list ? `<ul style="padding-left: 20px; margin: 0 0 12px 0;">${sub.list.map(li => `<li style="margin-bottom: 4px;">${escapeHtml(li)}</li>`).join('')}</ul>` : ''}
              </div>
            `).join('') : ''}

            ${sec.table ? `
              <div style="margin: 20px 0; overflow-x: auto;">
                <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${escapeHtml(sec.table.title)}</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: white; border: 1px solid #e2e8f0; border-radius: 10px;">
                  <thead>
                    <tr style="background: #f1f5f9;">
                      ${sec.table.headers.map(h => `<th style="padding: 10px 12px; border-bottom: 1px solid #cbd5e1; text-align: left;">${escapeHtml(h)}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${sec.table.rows.map(row => `
                      <tr>
                        ${row.map(c => `<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(c)}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${sec.callout ? `
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 14px; color: #065f46;">
                <strong>${escapeHtml(sec.callout.title)}:</strong> ${escapeHtml(sec.callout.text)}
              </div>
            ` : ''}
          </section>
        `).join('')}
      </div>

      <!-- Related Recommended Tools -->
      ${guide.relatedToolRoutes && guide.relatedToolRoutes.length > 0 ? `
      <div style="margin-top: 48px; padding-top: 28px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Recommended Free QuickVero Tools:</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${guide.relatedToolRoutes.map(tr => `
            <a href="${tr.route}" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; color: #2563eb; text-decoration: none;">
              ${escapeHtml(tr.name)} &rarr;
            </a>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </article>
  `;

  const pageHtml = replaceMeta(baseTemplate, {
    title: guide.seoTitle,
    description: guide.seoDescription,
    keywords: 'quickvero guide, ' + guide.category.toLowerCase() + ', ' + guide.title.toLowerCase(),
    canonicalUrl,
    jsonLd,
    rootContent,
  });

  writePage(`guides/${guide.slug}`, pageHtml);
}

// 5. Generate Core Static Pages (/tools, /about, /privacy-policy, /terms, /contact, /disclaimer, /menu)
const corePages = [
  {
    path: 'tools',
    title: 'All Online Tools Catalog — 28+ Free Utilities | QuickVero',
    desc: 'Browse our complete catalog of 28+ free online tools for images, videos, audio, PDF, and file processing.',
    h1: 'All Online Tools Catalog',
  },
  {
    path: 'about',
    title: 'About QuickVero — Free, Private & High-Performance Online Tools',
    desc: 'Learn about QuickVero mission to provide client-side, privacy-focused online utility tools directly in your browser.',
    h1: 'About QuickVero',
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy — 100% In-Browser Privacy | QuickVero',
    desc: 'QuickVero is committed to your privacy. All file processing runs locally on your device with zero server uploads.',
    h1: 'QuickVero Privacy Policy',
  },
  {
    path: 'terms',
    title: 'Terms of Service — QuickVero',
    desc: 'Terms and conditions for using QuickVero free online utility tools.',
    h1: 'Terms of Service',
  },
  {
    path: 'contact',
    title: 'Contact QuickVero Support & Feedback',
    desc: 'Get in touch with the QuickVero team for tool requests, feedback, or technical assistance.',
    h1: 'Contact QuickVero',
  },
  {
    path: 'disclaimer',
    title: 'Disclaimer — QuickVero',
    desc: 'Legal disclaimer and usage policies for QuickVero utility tools suite.',
    h1: 'Legal Disclaimer',
  },
  {
    path: 'menu',
    title: 'Digital QR Food Menu — QuickVero',
    desc: 'Contactless digital restaurant and cafe food menu powered by QuickVero.',
    h1: 'Digital Restaurant Menu',
  },
];

for (const p of corePages) {
  const canonicalUrl = `https://www.quickvero.in/${p.path}`;
  const rootContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 32px 16px; color: #1e293b;">
      <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 16px;">${escapeHtml(p.h1)}</h1>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">${escapeHtml(p.desc)}</p>
    </div>
  `;

  const pageHtml = replaceMeta(baseTemplate, {
    title: p.title,
    description: p.desc,
    keywords: 'quickvero, online tools, free browser utilities, file tools',
    canonicalUrl,
    rootContent,
  });

  writePage(p.path, pageHtml);
}

console.log('✓ QuickVero SSG generation completed successfully! All 40+ static HTML files ready for Googlebot!');
