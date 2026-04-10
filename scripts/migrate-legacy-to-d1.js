#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA_JSON_PATH = path.join(ROOT, 'data.json');
const LEGACY_NEWS_DIR = path.join(ROOT, 'public', 'news');
const OUT_DIR = path.join(ROOT, 'scripts', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'legacy-import.sql');
const WRANGLER_PATH = path.join(ROOT, 'wrangler.toml');

function parseArgs(argv) {
    const args = {
        executeMode: null,
        outFile: OUT_FILE,
        dbName: null
    };

    for (let i = 0; i < argv.length; i += 1) {
        const value = argv[i];
        if (value === '--remote') {
            args.executeMode = 'remote';
            continue;
        }
        if (value === '--local') {
            args.executeMode = 'local';
            continue;
        }
        if (value.startsWith('--out=')) {
            args.outFile = path.resolve(ROOT, value.slice('--out='.length));
            continue;
        }
        if (value === '--out' && argv[i + 1]) {
            args.outFile = path.resolve(ROOT, argv[i + 1]);
            i += 1;
            continue;
        }
        if (value.startsWith('--db=')) {
            args.dbName = value.slice('--db='.length).trim();
            continue;
        }
        if (value === '--db' && argv[i + 1]) {
            args.dbName = argv[i + 1].trim();
            i += 1;
            continue;
        }
        if (value === '--help' || value === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    return args;
}

function printHelp() {
    console.log('Legacy data migration utility');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/migrate-legacy-to-d1.js');
    console.log('  node scripts/migrate-legacy-to-d1.js --local');
    console.log('  node scripts/migrate-legacy-to-d1.js --remote');
    console.log('');
    console.log('Options:');
    console.log('  --local           Generate SQL and execute against local D1.');
    console.log('  --remote          Generate SQL and execute against remote D1.');
    console.log('  --db <name>       Override D1 database name (default from wrangler.toml).');
    console.log('  --out <path>      Override SQL output file path.');
}

function parseWranglerDatabaseName() {
    if (!fs.existsSync(WRANGLER_PATH)) {
        return 'rsag-db';
    }
    const content = fs.readFileSync(WRANGLER_PATH, 'utf8');
    const match = content.match(/database_name\s*=\s*"([^"]+)"/);
    return match ? match[1] : 'rsag-db';
}

function sqlEscape(value) {
    return String(value).replace(/'/g, "''");
}

function sqlValue(value, options = {}) {
    const { emptyAsNull = true } = options;

    if (value === null || value === undefined) {
        return 'NULL';
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return 'NULL';
        return String(value);
    }

    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }

    const text = String(value).trim();
    if (!text && emptyAsNull) {
        return 'NULL';
    }

    return `'${sqlEscape(text)}'`;
}

function normalizeStatus(raw, fallback = 'published') {
    const value = String(raw || '').trim().toLowerCase();
    if (!value) return fallback;
    if (value === 'submitted') return 'pending_review';
    if (value === 'accepted') return 'published';
    if (value === 'draft' || value === 'pending_review' || value === 'published' || value === 'scheduled') {
        return value;
    }
    return fallback;
}

function parseDateString(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;

    let match = text.match(/(\d{4})\s*[年\/-]\s*(\d{1,2})\s*[月\/-]\s*(\d{1,2})/);
    if (!match) {
        match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    }
    if (!match) return null;

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return null;
    }
    const mm = String(Math.max(1, Math.min(month, 12))).padStart(2, '0');
    const dd = String(Math.max(1, Math.min(day, 31))).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function stripHtml(html) {
    return String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function compactText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

function pickEnglishText(values) {
    for (const value of values) {
        if (!value) continue;
        const asciiCount = (value.match(/[A-Za-z]/g) || []).length;
        if (asciiCount >= 8) {
            return value;
        }
    }
    return '';
}

function isLikelyEnglish(text) {
    const value = compactText(text);
    if (!value) return false;
    const latinCount = (value.match(/[A-Za-z]/g) || []).length;
    const cjkCount = (value.match(/[\u4e00-\u9fff]/g) || []).length;
    return latinCount >= 12 && latinCount >= cjkCount * 2;
}

function extractProseInnerHtml(html) {
    const marker = 'class="prose';
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0) return '';

    const openStart = html.lastIndexOf('<div', markerIndex);
    if (openStart < 0) return '';

    const firstTagEnd = html.indexOf('>', openStart);
    if (firstTagEnd < 0) return '';

    const divTagRegex = /<\/?div\b[^>]*>/gi;
    divTagRegex.lastIndex = openStart;

    let depth = 0;
    let firstEnd = -1;
    let closeStart = -1;
    let match;

    while ((match = divTagRegex.exec(html))) {
        const token = match[0];
        const isClosing = token.startsWith('</');

        if (!isClosing) {
            depth += 1;
            if (depth === 1) {
                firstEnd = match.index + token.length;
            }
        } else {
            depth -= 1;
            if (depth === 0) {
                closeStart = match.index;
                break;
            }
        }
    }

    if (firstEnd < 0 || closeStart < 0 || closeStart <= firstEnd) {
        return '';
    }

    return html.slice(firstEnd, closeStart).trim();
}

function extractLegacyNewsItems() {
    if (!fs.existsSync(LEGACY_NEWS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(LEGACY_NEWS_DIR)
        .filter((name) => /^item\d+\.html$/i.test(name))
        .sort((a, b) => {
            const an = Number.parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const bn = Number.parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return an - bn;
        });

    const items = [];
    for (const fileName of files) {
        const filePath = path.join(LEGACY_NEWS_DIR, fileName);
        const raw = fs.readFileSync(filePath, 'utf8');

        const h1Matches = [...raw.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
            .map((m) => compactText(stripHtml(m[1])))
            .filter(Boolean);

        const title = h1Matches[0] || fileName.replace('.html', '');
        const titleEn = h1Matches.find((item) => isLikelyEnglish(item)) || pickEnglishText(h1Matches) || null;

        const proseHtml = extractProseInnerHtml(raw);
        const paragraphBlocks = [...proseHtml.matchAll(/<p[^>]*>[\s\S]*?<\/p>/gi)]
            .map((m) => ({
                html: m[0].trim(),
                text: compactText(stripHtml(m[0]))
            }))
            .filter((item) => item.text);

        const paragraphMatches = paragraphBlocks
            .map((item) => item.text)
            .filter(Boolean);

        const englishParagraphs = paragraphBlocks.filter((item) => isLikelyEnglish(item.text));
        const chineseParagraphs = paragraphBlocks.filter((item) => !isLikelyEnglish(item.text));

        const summary = paragraphMatches[0] || compactText(stripHtml(proseHtml));
        const summaryEn = englishParagraphs[0]?.text || null;

        let contentEn = englishParagraphs.length
            ? englishParagraphs.map((item) => item.html).join('\n\n')
            : null;

        let contentZh = chineseParagraphs.length
            ? chineseParagraphs.map((item) => item.html).join('\n\n')
            : proseHtml;

        const dateMatch = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        let publishDate = null;
        if (dateMatch) {
            publishDate = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`;
        }

        const imageMatch = raw.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        const featuredImage = imageMatch ? imageMatch[1].trim() : null;

        if (!contentZh) {
            contentZh = `<p>${summary || title}</p>`;
        }

        if (!contentEn && summaryEn) {
            contentEn = `<p>${summaryEn}</p>`;
        }

        items.push({
            source: `public/news/${fileName}`,
            title,
            title_en: titleEn,
            summary: summary || null,
            summary_en: summaryEn,
            content: contentZh,
            content_en: contentEn,
            author: 'legacy-import',
            publish_date: publishDate || '2025-01-01',
            featured_image: featuredImage,
            category: 'general',
            tags: 'legacy-static-news',
            status: 'published'
        });
    }

    return items;
}

function loadLegacyData() {
    if (!fs.existsSync(DATA_JSON_PATH)) {
        throw new Error(`Missing data file: ${DATA_JSON_PATH}`);
    }

    const content = fs.readFileSync(DATA_JSON_PATH, 'utf8');
    const parsed = JSON.parse(content);

    const publications = Array.isArray(parsed.publications) ? parsed.publications : [];
    const news = Array.isArray(parsed.news) ? parsed.news : [];
    const team = Array.isArray(parsed.team) ? parsed.team : [];

    return { publications, news, team };
}

function buildPublicationRows(publications) {
    return publications.map((item) => {
        const year = Number.parseInt(item.year, 10);
        const month = String(item.month || '').trim();
        const volume = String(item.volume || '').trim() || (month ? `month:${month}` : null);

        return {
            title: item.title,
            authors: item.authors,
            journal: item.journal,
            year: Number.isInteger(year) ? year : null,
            volume,
            doi: item.doi || null,
            url: item.url || null,
            abstract: item.abstract || null,
            keywords: item.keywords || null,
            type: item.type || null,
            types: Array.isArray(item.types) ? JSON.stringify(item.types) : null,
            status: normalizeStatus(item.status, 'published'),
            created_by: 'legacy-import',
            created_at: item.created_at || null
        };
    }).filter((item) => item.title && item.authors && item.journal && item.year);
}

function buildNewsRows(jsonNews, staticNews) {
    const rows = [];
    const seenKeys = new Set();

    const pushRow = (row) => {
        const date = parseDateString(row.publish_date) || '2025-01-01';
        const key = `${String(row.title || '').trim()}|${date}`;
        if (!row.title || !row.content || !row.author) return;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        rows.push({
            title: row.title,
            title_en: compactText(row.title_en || '') || null,
            summary: row.summary || null,
            summary_en: compactText(row.summary_en || '') || null,
            content: row.content,
            content_en: compactText(row.content_en || '') || null,
            author: row.author,
            publish_date: date,
            featured_image: row.featured_image || null,
            category: row.category || 'general',
            tags: row.tags || null,
            status: normalizeStatus(row.status, 'published'),
            created_by: 'legacy-import',
            created_at: row.created_at || null
        });
    };

    for (const item of jsonNews) {
        pushRow(item);
    }

    for (const item of staticNews) {
        pushRow(item);
    }

    return rows;
}

function buildTeamRows(team) {
    return team.map((item) => ({
        name: item.name,
        title: item.title,
        bio: item.bio || null,
        research_area: item.research_area || null,
        photo_url: item.photo_url || null,
        email: item.email || null,
        phone: item.phone || null,
        order_index: Number.parseInt(item.order_index, 10) || 0,
        status: item.status || 'active',
        created_by: 'legacy-import',
        created_at: item.created_at || null
    })).filter((item) => item.name && item.title);
}

function buildInsertSql() {
    const { publications, news, team } = loadLegacyData();
    const staticNews = extractLegacyNewsItems();

    const publicationRows = buildPublicationRows(publications);
    const newsRows = buildNewsRows(news, staticNews);
    const teamRows = buildTeamRows(team);

    const sqlParts = [];
    sqlParts.push('-- Generated by scripts/migrate-legacy-to-d1.js');
    sqlParts.push(`-- Generated at ${new Date().toISOString()}`);
    sqlParts.push(`-- publications=${publicationRows.length}, news=${newsRows.length}, team=${teamRows.length}`);
    sqlParts.push(`
CREATE TABLE IF NOT EXISTS publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    journal TEXT NOT NULL,
    year INTEGER NOT NULL,
    volume TEXT,
    doi TEXT,
    url TEXT,
    type TEXT,
    types TEXT,
    pdf_url TEXT,
    abstract TEXT,
    keywords TEXT,
    status TEXT DEFAULT 'published',
    scheduled_publish_at DATETIME,
    submitted_at DATETIME,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    title_en TEXT,
    summary TEXT,
    summary_en TEXT,
    content TEXT NOT NULL,
    content_en TEXT,
    author TEXT NOT NULL,
    publish_date DATE NOT NULL,
    featured_image TEXT,
    category TEXT DEFAULT 'general',
    tags TEXT,
    status TEXT DEFAULT 'published',
    scheduled_publish_at DATETIME,
    submitted_at DATETIME,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    research_area TEXT,
    photo_url TEXT,
    email TEXT,
    phone TEXT,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

    for (const row of publicationRows) {
        sqlParts.push(`
INSERT INTO publications (
    title, authors, journal, year, volume, doi, url, abstract, keywords,
    type, types, status, created_by, created_at
)
SELECT
    ${sqlValue(row.title)}, ${sqlValue(row.authors)}, ${sqlValue(row.journal)}, ${sqlValue(row.year)},
    ${sqlValue(row.volume)}, ${sqlValue(row.doi)}, ${sqlValue(row.url)}, ${sqlValue(row.abstract)}, ${sqlValue(row.keywords)},
    ${sqlValue(row.type)}, ${sqlValue(row.types)}, ${sqlValue(row.status)}, ${sqlValue(row.created_by)}, ${sqlValue(row.created_at)}
WHERE NOT EXISTS (
    SELECT 1 FROM publications
    WHERE title = ${sqlValue(row.title)}
      AND journal = ${sqlValue(row.journal)}
      AND year = ${sqlValue(row.year)}
);
`);
    }

    for (const row of newsRows) {
        sqlParts.push(`
INSERT INTO news (
    title, title_en, summary, summary_en, content, content_en, author, publish_date,
    featured_image, category, tags, status, created_by, created_at
)
SELECT
    ${sqlValue(row.title)}, ${sqlValue(row.title_en)}, ${sqlValue(row.summary)}, ${sqlValue(row.summary_en)},
    ${sqlValue(row.content, { emptyAsNull: false })}, ${sqlValue(row.content_en)},
    ${sqlValue(row.author)}, ${sqlValue(row.publish_date)}, ${sqlValue(row.featured_image)},
    ${sqlValue(row.category)}, ${sqlValue(row.tags)}, ${sqlValue(row.status)},
    ${sqlValue(row.created_by)}, ${sqlValue(row.created_at)}
WHERE NOT EXISTS (
    SELECT 1 FROM news
    WHERE title = ${sqlValue(row.title)}
      AND publish_date = ${sqlValue(row.publish_date)}
);

UPDATE news
SET
    title_en = CASE
        WHEN ${sqlValue(row.title_en)} IS NOT NULL
         AND (
             title_en IS NULL
             OR title_en = ''
             OR title_en = title
             OR title_en GLOB '*[一-龥]*'
         )
        THEN ${sqlValue(row.title_en)}
        ELSE title_en
    END,
    summary_en = CASE
        WHEN ${sqlValue(row.summary_en)} IS NOT NULL
         AND (
             summary_en IS NULL
             OR summary_en = ''
             OR summary_en GLOB '*[一-龥]*'
         )
        THEN ${sqlValue(row.summary_en)}
        ELSE summary_en
    END,
    content_en = CASE
        WHEN ${sqlValue(row.content_en)} IS NOT NULL
         AND (
             content_en IS NULL
             OR content_en = ''
             OR content_en = content
             OR content_en GLOB '*[一-龥]*'
         )
        THEN ${sqlValue(row.content_en)}
        ELSE content_en
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE title = ${sqlValue(row.title)}
  AND publish_date = ${sqlValue(row.publish_date)};
`);
    }

    sqlParts.push(`
UPDATE news
SET
    title_en = CASE
        WHEN (title_en IS NULL OR title_en = '' OR title_en = title) THEN (
            SELECT src.title_en
            FROM news AS src
            WHERE src.title = news.title
              AND src.title_en IS NOT NULL
              AND src.title_en != ''
              AND src.title_en != src.title
            ORDER BY src.id DESC
            LIMIT 1
        )
        ELSE title_en
    END,
    summary_en = CASE
        WHEN (summary_en IS NULL OR summary_en = '') THEN (
            SELECT src.summary_en
            FROM news AS src
            WHERE src.title = news.title
              AND src.summary_en IS NOT NULL
              AND src.summary_en != ''
            ORDER BY src.id DESC
            LIMIT 1
        )
        ELSE summary_en
    END,
    content_en = CASE
        WHEN (content_en IS NULL OR content_en = '' OR content_en = content) THEN (
            SELECT src.content_en
            FROM news AS src
            WHERE src.title = news.title
              AND src.content_en IS NOT NULL
              AND src.content_en != ''
              AND src.content_en != src.content
            ORDER BY src.id DESC
            LIMIT 1
        )
        ELSE content_en
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM news AS src
    WHERE src.title = news.title
      AND (
          (src.title_en IS NOT NULL AND src.title_en != '' AND src.title_en != src.title)
          OR (src.content_en IS NOT NULL AND src.content_en != '' AND src.content_en != src.content)
      )
);
`);

    for (const row of teamRows) {
        sqlParts.push(`
INSERT INTO team_members (
    name, title, bio, research_area, photo_url, email, phone,
    order_index, status, created_by, created_at
)
SELECT
    ${sqlValue(row.name)}, ${sqlValue(row.title)}, ${sqlValue(row.bio)}, ${sqlValue(row.research_area)},
    ${sqlValue(row.photo_url)}, ${sqlValue(row.email)}, ${sqlValue(row.phone)},
    ${sqlValue(row.order_index)}, ${sqlValue(row.status)}, ${sqlValue(row.created_by)}, ${sqlValue(row.created_at)}
WHERE NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE name = ${sqlValue(row.name)}
      AND title = ${sqlValue(row.title)}
);
`);
    }

    // Collapse duplicate news rows by title and keep the richest bilingual record.
    sqlParts.push(`
WITH ranked_news AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY title
            ORDER BY
                CASE WHEN content_en IS NOT NULL AND content_en != '' AND content_en != content THEN 1 ELSE 0 END DESC,
                CASE WHEN title_en IS NOT NULL AND title_en != '' AND title_en != title THEN 1 ELSE 0 END DESC,
                LENGTH(content) DESC,
                id DESC
        ) AS rn
    FROM news
)
DELETE FROM news
WHERE id IN (SELECT id FROM ranked_news WHERE rn > 1);
`);

    // Collapse duplicate members by photo identity first, then exact-name duplicates.
    sqlParts.push(`
WITH ranked_member_photo AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(NULLIF(photo_url, ''), name)
            ORDER BY
                LENGTH(name) DESC,
                LENGTH(COALESCE(title, '')) DESC,
                CASE WHEN photo_url IS NULL OR photo_url = '' THEN 0 ELSE 1 END DESC,
                CASE WHEN status = 'active' THEN 1 ELSE 0 END DESC,
                id DESC
        ) AS rn
    FROM team_members
)
DELETE FROM team_members
WHERE id IN (SELECT id FROM ranked_member_photo WHERE rn > 1);

WITH ranked_member_name AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY name
            ORDER BY
                CASE WHEN photo_url IS NULL OR photo_url = '' THEN 0 ELSE 1 END DESC,
                LENGTH(COALESCE(title, '')) DESC,
                CASE WHEN status = 'active' THEN 1 ELSE 0 END DESC,
                order_index ASC,
                id DESC
        ) AS rn
    FROM team_members
)
DELETE FROM team_members
WHERE id IN (SELECT id FROM ranked_member_name WHERE rn > 1);
`);

    return {
        sql: `${sqlParts.join('\n')}\n`,
        counts: {
            publications: publicationRows.length,
            news: newsRows.length,
            team: teamRows.length,
            staticNews: staticNews.length
        }
    };
}

function runWranglerExecute(dbName, filePath, mode) {
    const modeFlag = mode === 'remote' ? '--remote' : '--local';
    const command = `npx wrangler d1 execute ${dbName} ${modeFlag} --file=${JSON.stringify(filePath)}`;

    console.log(`Executing migration SQL on D1 (${mode})...`);
    console.log(`Command: ${command}`);

    execSync(command, {
        cwd: ROOT,
        stdio: 'inherit'
    });
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    const { sql, counts } = buildInsertSql();

    const outDir = path.dirname(args.outFile);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(args.outFile, sql, 'utf8');

    console.log(`SQL file generated: ${path.relative(ROOT, args.outFile)}`);
    console.log(`Rows prepared -> publications: ${counts.publications}, news: ${counts.news}, team: ${counts.team}`);
    console.log(`Legacy static news pages parsed: ${counts.staticNews}`);

    if (!args.executeMode) {
        console.log('No D1 execution mode provided. SQL generation only.');
        console.log('Use --local or --remote to execute immediately.');
        return;
    }

    const dbName = args.dbName || parseWranglerDatabaseName();
    runWranglerExecute(dbName, args.outFile, args.executeMode);
    console.log('Migration completed.');
}

try {
    main();
} catch (error) {
    console.error('Migration failed:', error.message || error);
    process.exit(1);
}
