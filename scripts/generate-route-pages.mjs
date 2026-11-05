import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const templatePath = path.join(distDir, 'index.html');

const publicPages = [
    {
        route: 'products',
        title: 'Dairy Products | Indigenous Cow & Buffalo Milk | Srivari Milk Farms',
        description:
            "Explore Srivari Milk Farms' dairy range, including cow milk, buffalo milk, Vedic Bilona ghee, fresh paneer and curd.",
    },
    {
        route: 'quality',
        title: 'Dairy Quality & Milk Handling Process | Srivari Milk Farms',
        description:
            "Discover Srivari Milk Farms' dairy quality practices, including hygienic milking, rapid milk chilling, safe packaging and fresh milk delivery.",
    },
    {
        route: 'about',
        title: 'About Srivari Milk Farms | Our Farm & Dairy Practices',
        description:
            'Discover Srivari Milk Farms, our indigenous cows and buffaloes, traditional Bilona ghee preparation, hygienic dairy practices and reusable glass bottle programme.',
    },
    {
        route: 'contact',
        title: 'Contact Srivari Milk Farms | Dairy Farm in D.Hirehal, Andhra Pradesh',
        description:
            'Contact Srivari Milk Farms in D.Hirehal, Anantapur district, Andhra Pradesh, for fresh cow milk, buffalo milk, Bilona ghee, dairy subscriptions and farm visits.',
    },
];

const privatePages = [
    { route: 'login', title: 'Login | Srivari Milk Farms' },
    { route: 'reset-password', title: 'Reset Password | Srivari Milk Farms' },
    { route: 'dashboard', title: 'Customer Dashboard | Srivari Milk Farms' },
    { route: 'admin', title: 'Admin Dashboard | Srivari Milk Farms' },
];

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function replaceMeta(html, attribute, value) {
    const escaped = escapeHtml(value);
    const pattern = new RegExp(
        `<meta\\s+${attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+content="[^"]*"\\s*\\/?>`,
        'i'
    );

    if (!pattern.test(html)) {
        throw new Error(`Could not find metadata tag: ${attribute}`);
    }

    return html.replace(
        pattern,
        `<meta ${attribute} content="${escaped}" />`
    );
}

function createPageHtml(template, page) {
    let html = template;

    html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(page.title)}</title>`
    );

    html = replaceMeta(html, 'name="description"', page.description);
    html = replaceMeta(html, 'name="robots"', page.robots);

    if (page.canonical) {
        html = html.replace(
            /<link\s+rel="canonical"[^>]*\/?>/i,
            `<link rel="canonical" href="${page.canonical}" />`
        );
    } else {
        html = html.replace(/<link\s+rel="canonical"[^>]*\/?>/i, '');
    }

    html = replaceMeta(html, 'property="og:title"', page.title);
    html = replaceMeta(html, 'property="og:description"', page.description);

    if (page.canonical) {
        html = replaceMeta(html, 'property="og:url"', page.canonical);
    } else {
        html = html.replace(
            /<meta\s+property="og:url"[^>]*\/?>/i,
            ''
        );
    }

    return html;
}

async function writePage(template, page) {
    const outputDir = path.join(distDir, page.route);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'index.html');
    const html = createPageHtml(template, page);

    await fs.writeFile(outputPath, html, 'utf8');
    console.log(`Generated: ${page.route}/index.html`);
}

async function main() {
    const template = await fs.readFile(templatePath, 'utf8');

    for (const page of publicPages) {
        await writePage(template, {
            ...page,
            robots: 'index, follow',
            canonical: `https://srivarimilkfarms.com/${page.route}/`,
        });
    }

    for (const page of privatePages) {
        await writePage(template, {
            ...page,
            description: 'Private account page for Srivari Milk Farms.',
            robots: 'noindex, nofollow',
            canonical: null,
        });
    }

    console.log('Page-specific SEO HTML generation completed.');
}

main().catch((error) => {
    console.error('SEO page generation failed:', error);
    process.exitCode = 1;
});