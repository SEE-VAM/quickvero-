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
  if (subPath === '404') {
    const targetFile = path.join(distDir, '404.html');
    fs.writeFileSync(targetFile, htmlContent, 'utf-8');
    console.log(`[SSG] Generated: /404.html`);
    return;
  }
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
    keywords?: string;
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

  // 3. Remove Meta Keywords completely from all pages (Google policy recommendation against tag stuffing)
  html = html.replace(/<meta name="keywords" content=".*?"\s*\/?>\s*/gi, '');

  // 4. Ensure AdSense meta verification tag is present in <head>
  if (!html.includes('google-adsense-account')) {
    html = html.replace('</head>', '    <meta name="google-adsense-account" content="ca-pub-8043431725904194" />\n  </head>');
  }

  // 5. Replace Canonical URL
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${opts.canonicalUrl}" />`
  );

  // 6. OpenGraph Tags
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="${opts.canonicalUrl}" />`);
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(opts.title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(opts.description)}" />`);

  // 7. Twitter Tags
  html = html.replace(/<meta property="twitter:url" content=".*?"\s*\/?>/i, `<meta property="twitter:url" content="${opts.canonicalUrl}" />`);
  html = html.replace(/<meta property="twitter:title" content=".*?"\s*\/?>/i, `<meta property="twitter:title" content="${escapeHtml(opts.title)}" />`);
  html = html.replace(/<meta property="twitter:description" content=".*?"\s*\/?>/i, `<meta property="twitter:description" content="${escapeHtml(opts.description)}" />`);

  // 8. Schema.org JSON-LD Replacement
  if (opts.jsonLd && opts.jsonLd.length > 0) {
    const jsonLdString = JSON.stringify(opts.jsonLd, null, 2);
    html = html.replace(
      /<script type="application\/ld\+json">.*?<\/script>/is,
      `<script type="application/ld+json">\n${jsonLdString}\n    </script>`
    );
  }

  // 9. Replace <div id="root">...</div> with rich semantic fallback content for Googlebot
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

      <!-- Privacy, Performance & Security Highlights -->
      <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
          Why Use QuickVero's ${escapeHtml(tool.name)}?
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 15px;">🔒 100% Client-Side Privacy</strong>
            <span>All processing executes strictly in your device local volatile memory using HTML5 Canvas and modern WebAssembly. Your photos, certificates, videos, and confidential documents are never uploaded to remote servers, completely eliminating data leaks.</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 15px;">⚡ Instant Hardware Acceleration</strong>
            <span>By leveraging your computer or smartphone local GPU and multi-core CPU, QuickVero bypasses cloud queue waiting times, delivering instantaneous conversions and exports with zero network transfer lag.</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 15px;">📱 Universal Device Compatibility</strong>
            <span>QuickVero works seamlessly across all platforms—Windows, macOS, iOS (iPhone &amp; iPad), Android, and Linux. No software installations, browser extensions, or account signups are ever required.</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 15px;">🛡️ Zero Watermarks &amp; Restrictions</strong>
            <span>QuickVero utilities produce completely clean, unwatermarked files with no daily quotas, hidden paywalls, or feature locks. Enjoy fast, professional utility conversions without restrictive usage barriers.</span>
          </div>
        </div>
      </section>

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
        '@type': 'Person',
        name: guide.author?.name || 'QuickVero Editorial Team',
        jobTitle: guide.author?.role || 'Technical Editor',
      },
      publisher: {
        '@type': 'Organization',
        name: 'QuickVero',
        url: 'https://www.quickvero.in/',
      },
      datePublished: guide.publishDate || '2026-10-15',
      dateModified: guide.lastUpdated || '2026-10-19',
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

  if (guide.faqs && guide.faqs.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  const rootContent = `
    <article style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 32px 16px; color: #1e293b; line-height: 1.7;">
      <nav style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
        <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &rarr; 
        <a href="/guides" style="color: #2563eb; text-decoration: none;">Guides</a> &rarr; 
        <span style="color: #0f172a; font-weight: 600;">${escapeHtml(guide.title)}</span>
      </nav>

      <header style="margin-bottom: 36px; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; margin-bottom: 14px; color: #64748b;">
          <span style="background: #dbeafe; color: #1d4ed8; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
            ${escapeHtml(guide.category)}
          </span>
          <span>• By <strong>${escapeHtml(guide.author?.name || 'QuickVero Editorial Team')}</strong> (${escapeHtml(guide.author?.role || 'Technical Editor')})</span>
          <span>• Published: ${escapeHtml(guide.publishDate)}</span>
          <span style="color: #16a34a; font-weight: 600;">• Last Verified &amp; Updated: ${escapeHtml(guide.lastUpdated || guide.publishDate)}</span>
          <span>• ${escapeHtml(guide.readingTime)}</span>
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

      <!-- Worked Example -->
      ${guide.workedExample ? `
      <section style="margin: 40px 0; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px;">
        <h2 style="font-size: 22px; font-weight: 800; color: #166534; margin: 0 0 10px 0;">
          ${escapeHtml(guide.workedExample.title)}
        </h2>
        <p style="font-size: 14px; color: #15803d; margin: 0 0 18px 0; line-height: 1.6;">
          ${escapeHtml(guide.workedExample.description)}
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
          ${guide.workedExample.steps.map(s => `
            <div style="background: white; border: 1px solid #dcfce7; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div>
                <strong style="display: block; font-size: 14px; color: #14532d;">${escapeHtml(s.step)}</strong>
                <span style="font-size: 13px; color: #475569;">${escapeHtml(s.detail)}</span>
              </div>
              ${s.resultSize ? `<span style="background: #dcfce7; color: #166534; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 9999px; white-space: nowrap;">${escapeHtml(s.resultSize)}</span>` : ''}
            </div>
          `).join('')}
        </div>
        <p style="font-size: 13px; font-weight: 600; color: #14532d; margin: 0; line-height: 1.6;">
          ${escapeHtml(guide.workedExample.conclusion)}
        </p>
      </section>
      ` : ''}

      <!-- Common Mistakes -->
      ${guide.commonMistakes ? `
      <section style="margin: 40px 0;">
        <h2 style="font-size: 22px; font-weight: 800; color: #991b1b; margin: 0 0 8px 0;">
          ${escapeHtml(guide.commonMistakes.title)}
        </h2>
        <p style="font-size: 14px; color: #64748b; margin: 0 0 20px 0;">
          ${escapeHtml(guide.commonMistakes.description)}
        </p>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${guide.commonMistakes.mistakes.map(m => `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: #991b1b; margin: 0 0 6px 0;">${escapeHtml(m.mistake)}</h3>
              <p style="font-size: 13px; color: #7f1d1d; margin: 0 0 8px 0; line-height: 1.5;">${escapeHtml(m.impact)}</p>
              <div style="font-size: 13px; color: #166534; background: white; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px;">
                <strong>Correct Solution:</strong> ${escapeHtml(m.solution)}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <!-- Step-by-Step Tool Walkthrough -->
      ${guide.toolWalkthrough ? `
      <section style="margin: 40px 0; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #1e40af; margin: 0;">
            ${escapeHtml(guide.toolWalkthrough.title)}
          </h2>
          <a href="${guide.toolWalkthrough.toolRoute}" style="background: #2563eb; color: white; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none;">
            Open ${escapeHtml(guide.toolWalkthrough.toolName)} &rarr;
          </a>
        </div>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e3a8a; line-height: 1.7;">
          ${guide.toolWalkthrough.instructions.map(ins => `<li style="margin-bottom: 8px;">${escapeHtml(ins)}</li>`).join('')}
        </ol>
      </section>
      ` : ''}

      <!-- Frequently Asked Questions (FAQ) -->
      ${guide.faqs && guide.faqs.length > 0 ? `
      <section style="margin: 40px 0;">
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 20px 0;">
          Frequently Asked Questions
        </h2>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${guide.faqs.map(faq => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
              <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(faq.question)}</h3>
              <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0;">${escapeHtml(faq.answer)}</p>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

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
    canonicalUrl,
    jsonLd,
    rootContent,
  });

  writePage(`guides/${guide.slug}`, pageHtml);
}

// 5. Generate Core Static Pages with Rich Prerendered HTML
const corePages = [
  {
    path: 'about',
    title: 'About QuickVero — Free, Private & Fast Online Tools',
    desc: 'Learn about QuickVero, who runs it, how files are processed 100% in-browser, and our mission to provide private, high-speed utilities for everyone.',
    h1: 'About QuickVero',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b; line-height: 1.7;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 16px;">About QuickVero</h1>
        <p style="font-size: 18px; color: #475569; margin-bottom: 32px; font-weight: 500;">
          Building the next generation of web utilities: fast, private, accessible, and completely free of spam.
        </p>

        <section style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Our Mission &amp; Philosophy</h2>
          <p style="margin: 0 0 14px 0; color: #334155;">
            Most online converters and utility websites today are bogged down by intrusive pop-up ads, slow server queues, forced email registrations, and sketchy privacy practices that harvest personal files.
          </p>
          <p style="margin: 0; color: #334155;">
            <strong>QuickVero</strong> was founded to provide a clean, dignified alternative. By leveraging modern browser APIs (such as HTML5 Canvas, Web Audio, and WebAssembly), we process images, audio, documents, and media directly on your device. Your confidential files never touch our servers, guaranteeing 100% privacy, zero data leaks, and instantaneous conversion speed.
          </p>
        </section>

        <section style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Who Runs QuickVero?</h2>
          <p style="margin: 0 0 14px 0; color: #334155;">
            QuickVero is developed and maintained by a dedicated independent engineering team specializing in web performance, browser cryptography, and digital utility architecture based in India.
          </p>
          <p style="margin: 0 0 14px 0; color: #334155;">
            Our team creates specialized tool suites for students preparing for national recruitment exams (such as SSC, UPSC, and IBPS), digital creators compressing media for social platforms, and restaurant owners transitioning to modern contactless digital QR menus.
          </p>
          <p style="margin: 0; color: #334155;">
            Have questions or suggestions? Reach out directly to our engineering desk at: 
            <a href="mailto:contact@quickvero.in" style="color: #2563eb; font-weight: 600; text-decoration: underline;">contact@quickvero.in</a>
          </p>
        </section>

        <section style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Why In-Browser Processing Matters</h2>
          <p style="margin: 0 0 14px 0; color: #334155;">
            When you compress an image or convert a PDF on QuickVero, the work is performed entirely inside your device&apos;s volatile RAM. Your documents, photos, resumes, and signatures never leave your device and are never transmitted across our network.
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            <li style="margin-bottom: 6px;"><strong>Instant Speed:</strong> Zero network transfer bottlenecks or server queues.</li>
            <li style="margin-bottom: 6px;"><strong>Maximum Privacy:</strong> Confidential tax records, exam photos, and personal IDs stay in your browser.</li>
            <li style="margin-bottom: 6px;"><strong>No Registration:</strong> Free access without requiring signups, phone numbers, or credit cards.</li>
          </ul>
        </section>
      </div>
    `,
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy — QuickVero Security & Data Protection',
    desc: 'Review the QuickVero privacy policy. Learn how in-browser processing protects your files, and how cookies and Google AdSense are managed.',
    h1: 'QuickVero Privacy Policy',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b; line-height: 1.7;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Privacy Policy</h1>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Last Updated: October 2026 &bull; Effective Immediately</p>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 32px; color: #065f46;">
          <strong style="font-size: 16px; display: block; margin-bottom: 6px;">100% In-Browser Zero-Retention Architecture</strong>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">
            QuickVero processes your images, documents, and media directly inside your web browser using HTML5 Canvas, Web Audio, and WebAssembly. Your files are never uploaded to, stored on, or harvested by any remote server.
          </p>
        </div>

        <section style="margin-bottom: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">1. How Files Are Handled (Client-Side In-Browser Execution)</h2>
          <p style="margin: 0 0 12px 0; color: #334155;">
            Unlike legacy conversion websites that require uploading your private files to cloud servers, QuickVero is engineered with a strict <strong>client-side architecture</strong>.
          </p>
          <p style="margin: 0; color: #334155;">
            When you use tools such as the Image Compressor, Compress Image to 20KB/50KB, PDF Compressor, JPG to PDF, Video Trimmer, MP4 to MP3, or Digital QR Menu Maker, the computations are executed directly inside your computer or mobile device&apos;s volatile RAM. Your documents, photos, resumes, and signatures never leave your device and are never transmitted across our network.
          </p>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">2. Data Retention Policy</h2>
          <p style="margin: 0; color: #334155;">
            Because processing takes place locally in your web browser, <strong>QuickVero maintains zero server retention of your uploaded or generated files</strong>. Once you close your browser tab or navigate away, the file buffers in memory are automatically cleared by your operating system. We do not operate databases storing user files, personal identities, or document history.
          </p>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">3. Cookies, Local Storage &amp; Web Beacons</h2>
          <p style="margin: 0 0 12px 0; color: #334155;">
            QuickVero uses cookies and browser <code>localStorage</code> for essential website operations, including remembering your dark/light mode preference, preserving your recent tool history, and recording your cookie consent preferences.
          </p>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">4. Google AdSense &amp; DoubleClick Advertising Cookies</h2>
          <p style="margin: 0 0 12px 0; color: #334155;">
            We partner with third-party advertising networks, specifically <strong>Google AdSense</strong>, to serve advertisements on content pages across QuickVero to support free tool availability.
          </p>
          <p style="margin: 0 0 12px 0; color: #334155;">
            Google and its certified advertising partners use cookies, including the DoubleClick cookie, to serve ads based on a user&apos;s prior visits to this website or other websites on the internet.
          </p>
          <p style="margin: 0 0 12px 0; color: #334155;">
            Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Google Ads Settings</a>. For more information on how Google manages data in its advertising products, please review <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">How Google uses information from sites or apps that use our services</a>.
          </p>
        </section>

        <section style="margin-bottom: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">5. Contacting QuickVero About Privacy</h2>
          <p style="margin: 0; color: #334155;">
            If you have questions about this privacy statement, data safety, or technical architecture, you can contact our privacy officer directly at: 
            <a href="mailto:contact@quickvero.in" style="color: #2563eb; font-weight: 600; text-decoration: underline;">contact@quickvero.in</a>
          </p>
        </section>
      </div>
    `,
  },
  {
    path: 'contact',
    title: 'Contact QuickVero — Support & Feedback',
    desc: 'Have a suggestion for a new tool or need help? Contact the QuickVero engineering and support team.',
    h1: 'Contact QuickVero',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b; line-height: 1.7;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Contact QuickVero</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 32px;">
          Have questions, feedback, or a feature request for a new online utility? We would love to hear from you.
        </p>

        <section style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">Support Helpdesk</h2>
          <p style="margin: 0 0 10px 0; color: #334155;">
            <strong>Operating Hours:</strong> Monday – Saturday (9:00 AM – 7:00 PM IST)
          </p>
          <p style="margin: 0; color: #334155;">
            <strong>Average Response Time:</strong> 24–48 Hours for general feedback and support requests.
          </p>
        </section>

        <section style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 28px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Submit Feedback &amp; Suggestions</h2>
          <p style="color: #475569; margin-bottom: 16px; font-size: 14px;">
            Please visit the interactive <a href="/contact" style="color: #2563eb; font-weight: 600;">Contact Form</a> to send an inquiry directly to our engineering desk.
          </p>
        </section>
      </div>
    `,
  },
  {
    path: 'terms',
    title: 'Terms of Service — QuickVero Online Utilities',
    desc: 'Terms and conditions governing the use of QuickVero online conversion and utility services.',
    h1: 'Terms of Service',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b; line-height: 1.7;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Terms of Service</h1>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 32px;">Last Updated: October 2026</p>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">1. Acceptance of Terms</h2>
          <p style="margin: 0; color: #334155;">
            By accessing and using QuickVero (&ldquo;the Website&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service.
          </p>
        </section>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">2. Acceptable Use</h2>
          <p style="margin: 0; color: #334155;">
            You agree to use QuickVero only for legitimate file conversion, editing, and utility purposes. You agree not to use the platform to transmit malicious code, copyright-infringing materials, or unlawful content.
          </p>
        </section>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">3. Intellectual Property Rights</h2>
          <p style="margin: 0; color: #334155;">
            You retain 100% full and unconditional ownership of all files and media you process using QuickVero. QuickVero claims zero ownership, license, or distribution rights over your content.
          </p>
        </section>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">4. Availability &amp; Modifications</h2>
          <p style="margin: 0; color: #334155;">
            QuickVero reserves the right to enhance, modify, or update tool features without prior notice. The service is provided &ldquo;as is&rdquo; without warranties of any kind.
          </p>
        </section>
      </div>
    `,
  },
  {
    path: 'disclaimer',
    title: 'Disclaimer — QuickVero File Utilities',
    desc: 'Legal disclaimer and limitation of liability regarding file operations on QuickVero.',
    h1: 'Legal Disclaimer',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b; line-height: 1.7;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Legal Disclaimer</h1>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 32px;">Last Updated: October 2026</p>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">1. General Information</h2>
          <p style="margin: 0; color: #334155;">
            The tools and information provided on QuickVero are intended solely for general productivity, personal, academic, and business utility purposes. While we strive for maximum accuracy, fidelity, and reliability, we make no guarantees that processed outputs will meet all specific compliance standards or device constraints.
          </p>
        </section>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">2. Backup Recommendation</h2>
          <p style="margin: 0; color: #334155;">
            Always maintain independent backup copies of critical documents, media, or archives before performing destructive compression or format transformations. QuickVero shall not be held liable for any accidental loss of original source files.
          </p>
        </section>

        <section style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">3. Third-Party Trademarks</h2>
          <p style="margin: 0; color: #334155;">
            All referenced file formats, extensions, and standard identifiers (such as MP4, MP3, PDF, JPEG, WebP, Apple QuickTime, Discord, etc.) are trademarks or registered trademarks of their respective copyright holders. Reference to them does not imply endorsement or affiliation.
          </p>
        </section>
      </div>
    `,
  },
  {
    path: 'tools',
    title: 'All Online Tools Catalog — 28+ Free Utilities | QuickVero',
    desc: 'Browse our complete catalog of 28+ free online tools for images, videos, audio, PDF, and file processing.',
    h1: 'All Online Tools Catalog',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 36px 16px; color: #1e293b;">
        <h1 style="font-size: 34px; font-weight: 900; color: #0f172a; margin-bottom: 12px;">All Online Tools Catalog</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 36px;">
          Browse our complete catalog of 28+ free client-side online tools for images, documents, videos, and media.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          ${TOOLS.map(t => `
            <a href="${t.route}" style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; text-decoration: none; color: inherit; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">${escapeHtml(t.name)}</h2>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 10px 0;">${escapeHtml(t.shortDescription)}</p>
              <span style="font-size: 13px; font-weight: 700; color: #2563eb;">Open Tool &rarr;</span>
            </a>
          `).join('')}
        </div>
      </div>
    `,
  },
  {
    path: 'menu',
    title: 'Digital QR Food Menu — QuickVero',
    desc: 'Contactless digital restaurant and cafe food menu powered by QuickVero.',
    h1: 'Digital Restaurant Menu',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 36px 16px; color: #1e293b;">
        <h1 style="font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 12px;">Digital Restaurant Menu</h1>
        <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
          Interactive contactless digital restaurant menu preview powered by QuickVero.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center;">
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            Want to create a free digital QR menu for your restaurant or cafe with zero monthly fees?
          </p>
          <a href="/tools/qr-menu-maker" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block;">
            Launch QR Menu Maker &rarr;
          </a>
        </div>
      </div>
    `,
  },
  {
    path: '404',
    title: '404 - Page Not Found | QuickVero',
    desc: 'The requested utility or page could not be located on QuickVero.',
    h1: 'Page Not Found',
    content: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 60px auto; padding: 36px 16px; text-align: center; color: #1e293b;">
        <div style="font-size: 64px; font-weight: 900; color: #2563eb; font-family: monospace; margin-bottom: 16px;">404</div>
        <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Page Not Found</h1>
        <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
          The page or utility you are looking for might have been moved, or the link may be mistyped.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="/" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; text-decoration: none;">Return Home</a>
          <a href="/tools" style="background: #f1f5f9; color: #0f172a; padding: 10px 20px; border-radius: 10px; font-weight: 700; text-decoration: none; border: 1px solid #cbd5e1;">Browse All Tools</a>
        </div>
      </div>
    `,
  },
];

for (const p of corePages) {
  const canonicalUrl = p.path === '404' ? 'https://www.quickvero.in/404' : `https://www.quickvero.in/${p.path}`;
  const pageHtml = replaceMeta(baseTemplate, {
    title: p.title,
    description: p.desc,
    canonicalUrl,
    rootContent: p.content,
  });

  writePage(p.path, pageHtml);
}

// 5. Generate Rich Pre-rendered Homepage (/index.html)
const popularToolList = TOOLS.filter(t => t.popular || ['image-compressor', 'pdf-compressor', 'compress-image-to-20kb', 'compress-image-to-50kb', 'merge-pdf', 'jpg-to-pdf', 'mp4-to-mp3', 'qr-menu-maker'].includes(t.id));

const homepageContent = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 32px 16px; color: #1e293b; line-height: 1.6;">
    
    <!-- Hero Section -->
    <header style="text-align: center; margin-bottom: 48px; padding: 32px 16px;">
      <div style="display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 9999px; margin-bottom: 16px;">
        100% Free &bull; Browser-First Utilities &bull; Zero Server Uploads
      </div>
      <h1 style="font-size: 38px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -0.02em;">
        Powerful Online Tools. Simple, Fast &amp; 100% Private.
      </h1>
      <p style="font-size: 18px; color: #475569; max-width: 780px; margin: 0 auto 28px auto; line-height: 1.6;">
        Compress images, edit PDFs, convert audio, and optimize documents directly inside your web browser. 
        Your files never leave your device &mdash; zero cloud queues, zero privacy risks.
      </p>
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
        <a href="/tools" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
          Browse All 28+ Tools &rarr;
        </a>
        <a href="/image-tools" style="background: #f1f5f9; color: #0f172a; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; border: 1px solid #cbd5e1;">
          Image Tools
        </a>
        <a href="/pdf-tools" style="background: #f1f5f9; color: #0f172a; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; border: 1px solid #cbd5e1;">
          PDF Tools
        </a>
      </div>
    </header>

    <!-- Tool Categories Grid -->
    <section style="margin-bottom: 56px;">
      <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-align: center;">
        Explore Utility Suites by Category
      </h2>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 28px;">
        High-performance client-side tools tailored for web developers, designers, students, and businesses.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        ${CATEGORIES.map(c => `
          <a href="${c.route}" style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-decoration: none; color: inherit; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 6px;">Suite</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(c.name)}</h3>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0; line-height: 1.5;">${escapeHtml(c.description)}</p>
            <span style="font-size: 13px; font-weight: 700; color: #2563eb;">Explore Tools &rarr;</span>
          </a>
        `).join('')}
      </div>
    </section>

    <!-- Popular Featured Tools Grid -->
    <section style="margin-bottom: 56px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
            Most Popular Online Utilities
          </h2>
          <p style="font-size: 15px; color: #64748b; margin: 0;">
            Fast, free, and secure processing executed entirely in local browser RAM.
          </p>
        </div>
        <a href="/tools" style="font-size: 14px; font-weight: 700; color: #2563eb; text-decoration: none;">
          View All Tools (${TOOLS.length}) &rarr;
        </a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 16px;">
        ${popularToolList.map(t => `
          <a href="${t.route}" style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; text-decoration: none; color: inherit; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div>
              <div style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 10px; text-transform: uppercase;">
                ${t.category}
              </div>
              <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(t.name)}</h3>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">${escapeHtml(t.shortDescription)}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; font-size: 13px; font-weight: 700; color: #2563eb;">
              <span>Open Tool</span>
              <span>&rarr;</span>
            </div>
          </a>
        `).join('')}
      </div>
    </section>

    <!-- Deep-Dive Editorial: The Technology Behind QuickVero -->
    <section style="margin-bottom: 56px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 24px; padding: 36px 28px;">
      <div style="max-width: 800px; margin-bottom: 32px;">
        <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
          The Technology Behind QuickVero
        </h2>
        <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">
          Explore how client-side computing, next-generation image encoding, and secure memory pipelines deliver professional-grade file optimization directly in your browser without third-party servers.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
        <article style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
            1. Why Client-Side Privacy Matters for File Processing
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0;">
            Most traditional online converters upload your personal photos, official documents, and sensitive spreadsheets to third-party cloud servers. This exposes you to data leaks, unauthorized storage, and slow upload speeds. QuickVero uses modern HTML5 File API and client-side processing, meaning your files stay strictly within your browser. Once you close the tab, all temporary data is instantly cleared from RAM.
          </p>
        </article>

        <article style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
            2. Understanding Lossy vs. Lossless Image Compression
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0;">
            Lossless compression reduces file sizes by identifying and removing redundant metadata (like EXIF camera data) without modifying a single pixel of the image. In contrast, intelligent lossy compression slightly modifies color patterns that the human eye cannot discern, reducing image weight by up to 80%. This drastic reduction dramatically improves website loading speeds and Core Web Vitals (LCP &amp; CLS).
          </p>
        </article>

        <article style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
            3. Modern Image Formats: Why WebP Outperforms JPG &amp; PNG
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0;">
            WebP is a modern image format developed by Google that provides superior lossless and lossy compression for images on the web. WebP images are typically 26% to 34% smaller than comparable PNGs and JPEGs while retaining identical visual fidelity. QuickVero allows you to seamlessly convert legacy JPG and PNG images to WebP with a single click.
          </p>
        </article>

        <article style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
            4. Best Practices for Merging and Compressing PDF Documents
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0;">
            Whether preparing legal contracts, academic coursework, or official government applications, managing PDF file sizes is critical. QuickVero combines client-side stream compression with precision page re-ordering. Documents can be merged, split, or compressed down to email-friendly thresholds (under 2MB) without blurring critical text or legal signatures.
          </p>
        </article>
      </div>
    </section>

    <!-- Platform FAQ Section -->
    <section style="margin-bottom: 56px; max-width: 900px; margin-left: auto; margin-right: auto;">
      <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 8px;">
        Frequently Asked Questions
      </h2>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 28px;">
        Clear answers about our file privacy, technical limits, and zero-cost structure.
      </p>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
            Are my files or images uploaded to any remote server?
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
            No. QuickVero is designed as a browser-first utility suite. All image compression, PDF manipulation, audio extraction, and format conversions happen locally inside your browser using HTML5 Canvas, WebAssembly, and local JavaScript workers. Your files never leave your device.
          </p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
            Is QuickVero free for personal, commercial, and student projects?
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
            Yes, QuickVero is 100% free to use for personal, academic, and commercial purposes. There are no subscriptions, limits on basic usage, or forced watermarks added to your exported files.
          </p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
            Will compressing my photos ruin their visual clarity?
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
            Not at all. QuickVero uses perceptual quality algorithms that target redundant color data that human eyes cannot perceive. You can preview and fine-tune your compression quality slider from 1% to 100% to find the perfect balance between file size and crystal-clear clarity.
          </p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
            Which browsers and operating systems are supported?
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
            QuickVero operates smoothly across all modern web browsers, including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, Opera, and Brave on Android, iOS, Windows, macOS, Linux, and ChromeOS.
          </p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
            How can I contact the QuickVero engineering team?
          </h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
            You can reach our team anytime via email at <a href="mailto:contact@quickvero.in" style="color: #2563eb; font-weight: 600;">contact@quickvero.in</a> or through our interactive feedback form on our <a href="/contact" style="color: #2563eb; font-weight: 600;">Contact Page</a>.
          </p>
        </div>
      </div>
    </section>

    <!-- Platform Footer Navigation -->
    <footer style="margin-top: 60px; padding-top: 36px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px;">
        <div>
          <strong style="color: #0f172a; font-size: 15px; display: block; margin-bottom: 12px;">QuickVero</strong>
          <p style="line-height: 1.6; margin: 0;">
            Free, fast, and private client-side utilities. Compress, convert, and edit files without cloud servers.
          </p>
        </div>
        <div>
          <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 12px;">Tool Suites</strong>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li><a href="/image-tools" style="color: inherit; text-decoration: none;">Image Tools</a></li>
            <li><a href="/pdf-tools" style="color: inherit; text-decoration: none;">PDF Tools</a></li>
            <li><a href="/audio-tools" style="color: inherit; text-decoration: none;">Audio Tools</a></li>
            <li><a href="/video-tools" style="color: inherit; text-decoration: none;">Video Tools</a></li>
            <li><a href="/file-tools" style="color: inherit; text-decoration: none;">File Tools</a></li>
          </ul>
        </div>
        <div>
          <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 12px;">Popular Tools</strong>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li><a href="/tools/image-compressor" style="color: inherit; text-decoration: none;">Image Compressor</a></li>
            <li><a href="/tools/compress-image-to-20kb" style="color: inherit; text-decoration: none;">Compress to 20KB</a></li>
            <li><a href="/tools/pdf-compressor" style="color: inherit; text-decoration: none;">PDF Compressor</a></li>
            <li><a href="/tools/merge-pdf" style="color: inherit; text-decoration: none;">Merge PDF</a></li>
            <li><a href="/tools/qr-menu-maker" style="color: inherit; text-decoration: none;">QR Menu Maker</a></li>
          </ul>
        </div>
        <div>
          <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 12px;">Company &amp; Legal</strong>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li><a href="/about" style="color: inherit; text-decoration: none;">About QuickVero</a></li>
            <li><a href="/contact" style="color: inherit; text-decoration: none;">Contact &amp; Support</a></li>
            <li><a href="/privacy-policy" style="color: inherit; text-decoration: none;">Privacy Policy</a></li>
            <li><a href="/terms" style="color: inherit; text-decoration: none;">Terms of Service</a></li>
            <li><a href="/disclaimer" style="color: inherit; text-decoration: none;">Disclaimer</a></li>
          </ul>
        </div>
      </div>
      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        &copy; ${new Date().getFullYear()} QuickVero. All rights reserved. 100% In-Browser Execution.
      </div>
    </footer>
  </div>
`;

// Overwrite root dist/index.html with pre-rendered homepage!
const homepageHtml = replaceMeta(baseTemplate, {
  title: 'QuickVero — Powerful Online Tools. Simple & Fast.',
  description: 'Free online image compressor, PDF tools, audio converters, and file utilities directly in your browser with QuickVero. 100% private, zero server uploads.',
  canonicalUrl: 'https://www.quickvero.in/',
  rootContent: homepageContent,
});
fs.writeFileSync(path.join(distDir, 'index.html'), homepageHtml, 'utf-8');
console.log('[SSG] Generated: /index.html (HOMEPAGE)');

console.log('✓ QuickVero SSG generation completed successfully! All static HTML files ready for Googlebot!');

