let currentNewsFilter = 'all';
let currentToolsFilter = 'all';
let currentUsecasesFilter = 'all';
let allNewsItems = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  setupNav(); setupFilters(); setupSearch(); setupModal(); setupCompare();
  renderTools(); renderUseCases(); renderVersionDiffs(); loadNews(); setLastUpdated();
  document.getElementById('refreshBtn').addEventListener('click', () => loadNews(true));
  setInterval(() => loadNews(true), 15 * 60 * 1000);
});

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

function setupFilters() {
  document.querySelectorAll('#tab-news .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-news .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentNewsFilter = btn.dataset.filter; renderNews();
    });
  });
  document.querySelectorAll('#tab-tools .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-tools .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentToolsFilter = btn.dataset.filter; renderTools();
    });
  });
  document.querySelectorAll('.industry-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.industry-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentUsecasesFilter = btn.dataset.filter; renderUseCases();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('globalSearch');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { searchQuery = input.value.toLowerCase().trim(); renderNews(); renderTools(); renderUseCases(); }, 300);
  });
}

// ── News Loading ──────────────────────────────────────────────────────────────

// Tech publisher RSS feeds — supported by rss2json.com free tier
// (Google News RSS is blocked by rss2json; these publisher feeds work reliably)
const LIVE_FEEDS = [
  { url: 'https://techcrunch.com/tag/artificial-intelligence/feed/', label: 'TechCrunch' },
  { url: 'https://venturebeat.com/category/ai/feed/', label: 'VentureBeat' },
  { url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', label: 'The Verge' },
  { url: 'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss', label: 'Wired' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', label: 'Ars Technica' },
  { url: 'https://www.technologyreview.com/feed/', label: 'MIT Tech Review' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', label: 'The Hacker News' },
];

async function loadNews(force = false) {
  const grid = document.getElementById('newsGrid');
  if (allNewsItems.length === 0 || force) {
    grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Fetching latest AI news…</p></div>';
  }
  try {
    const liveItems = await fetchLiveNews();
    if (liveItems.length > 0) {
      allNewsItems = mergeNews(liveItems, STATIC_NEWS);
    } else {
      allNewsItems = [...STATIC_NEWS];
    }
  } catch (e) {
    console.warn('Live news fetch failed:', e);
    allNewsItems = [...STATIC_NEWS];
  }
  renderNews(); setLastUpdated();
}

async function fetchLiveNews() {
  const results = await Promise.allSettled(LIVE_FEEDS.map(f => fetchOneFeed(f.url, f.label)));
  const items = [];
  results.forEach(r => { if (r.status === 'fulfilled' && r.value.length) items.push(...r.value); });
  // Only keep articles that mention AI/ML topics
  return items.filter(item => isAIRelated(item.title + ' ' + item.description));
}

async function fetchOneFeed(feedUrl, feedLabel) {
  // Primary: rss2json.com — supports major tech publisher RSS feeds
  try {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feedUrl) + '&count=8';
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.status !== 'ok' || !data.items?.length) throw new Error('No items from rss2json');
    return data.items.map((item, i) => buildItem(feedUrl + i, item.title, item.description || item.content || '', item.pubDate?.slice(0, 10) || today(), item.link || '#', feedLabel));
  } catch (e) { console.warn('rss2json failed for', feedLabel, e.message); }

  // Fallback: allorigins raw proxy
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(feedUrl);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const items = [...xml.querySelectorAll('item')].slice(0, 8);
    if (!items.length) throw new Error('No XML items');
    return items.map((item, i) => buildItem(feedUrl + i,
      item.querySelector('title')?.textContent || '',
      item.querySelector('description')?.textContent || '',
      parseDate(item.querySelector('pubDate')?.textContent),
      item.querySelector('link')?.textContent || '#', feedLabel));
  } catch (e) { console.warn('allorigins failed for', feedLabel, e.message); }

  // Last resort: corsproxy.io
  try {
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(feedUrl);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const items = [...xml.querySelectorAll('item')].slice(0, 8);
    if (!items.length) throw new Error('No XML items');
    return items.map((item, i) => buildItem(feedUrl + i,
      item.querySelector('title')?.textContent || '',
      item.querySelector('description')?.textContent || '',
      parseDate(item.querySelector('pubDate')?.textContent),
      item.querySelector('link')?.textContent || '#', feedLabel));
  } catch (e) { console.warn('corsproxy failed for', feedLabel, e.message); }

  return [];
}

function buildItem(id, rawTitle, rawDesc, date, url, feedLabel) {
  const title = cleanText(rawTitle);
  const description = stripHTML(rawDesc).slice(0, 280);
  const text = title + ' ' + description;
  const { source, sourceLabel } = detectSource(text);
  return { id: 'live-' + id, title, description, source, sourceLabel, date, url, live: true, tags: detectTags(text), category: detectCategory(title), feedLabel };
}

function detectSource(text) {
  const t = text.toLowerCase();
  if (/openai|chatgpt|gpt-?[3-9o]|\bsora\b|\bdall-?e\b/.test(t)) return { source: 'openai', sourceLabel: 'OpenAI' };
  if (/anthropic|\bclaude\b/.test(t)) return { source: 'anthropic', sourceLabel: 'Anthropic' };
  if (/\bgemini\b|deepmind|\bgoogle ai\b|google.*\bai\b/.test(t)) return { source: 'google', sourceLabel: 'Google' };
  if (/\bllama\b|\bmeta ai\b|meta.*model/.test(t)) return { source: 'meta', sourceLabel: 'Meta AI' };
  if (/microsoft|\bcopilot\b|azure.*ai|bing.*ai/.test(t)) return { source: 'microsoft', sourceLabel: 'Microsoft' };
  if (/midjourney|stable diffusion|\bflux\b|runway|suno|udio|elevenlabs|cursor\b|perplexity/.test(t)) return { source: 'tools', sourceLabel: 'AI Tools' };
  return { source: 'general', sourceLabel: 'AI News' };
}

function isAIRelated(text) {
  return /\b(ai|artificial intelligence|machine learning|llm|gpt|claude|gemini|llama|copilot|chatgpt|openai|anthropic|deepmind|neural|chatbot|generative|transformer|diffusion)\b/i.test(text);
}

function cleanText(s) { return (s || '').replace(/\s+/g, ' ').replace(/<[^>]+>/g, '').trim(); }
function stripHTML(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || d.innerText || ''; }
function today() { return new Date().toISOString().slice(0, 10); }
function parseDate(d) { if (!d) return today(); try { const p = new Date(d); return isNaN(p) ? today() : p.toISOString().slice(0, 10); } catch { return today(); } }

function detectTags(text) {
  const lower = (text || '').toLowerCase();
  const tagMap = { 'gpt': 'GPT', 'chatgpt': 'ChatGPT', 'claude': 'Claude', 'gemini': 'Gemini', 'llama': 'Llama', 'copilot': 'Copilot', 'midjourney': 'Midjourney', 'sora': 'Sora', 'agent': 'Agents', 'reasoning': 'Reasoning', 'multimodal': 'Multimodal', 'benchmark': 'Benchmark', 'open source': 'Open Source', 'openai': 'OpenAI', 'anthropic': 'Anthropic', 'deepmind': 'DeepMind', 'vision': 'Vision', 'coding': 'Coding', 'research': 'Research', 'safety': 'Safety' };
  return Object.entries(tagMap).filter(([k]) => lower.includes(k)).map(([, v]) => v).slice(0, 4);
}

function detectCategory(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('launch') || t.includes('release') || t.includes('introduce') || t.includes('unveil') || t.includes('announce')) return 'Product Launch';
  if (t.includes('update') || t.includes('new feature') || t.includes('version')) return 'Feature Update';
  if (t.includes('research') || t.includes('study') || t.includes('paper') || t.includes('benchmark')) return 'Research';
  if (t.includes('fund') || t.includes('invest') || t.includes('billion') || t.includes('valuat') || t.includes('deal')) return 'Business';
  if (t.includes('warn') || t.includes('risk') || t.includes('danger') || t.includes('regulat') || t.includes('ban')) return 'Safety & Policy';
  return 'AI News';
}

function mergeNews(live, curated) {
  const all = [...live, ...curated];
  const seen = new Set();
  return all.filter(item => {
    const k = (item.title || '').slice(0, 60).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── Render News ───────────────────────────────────────────────────────────────
function renderNews() {
  const grid = document.getElementById('newsGrid');
  let items = allNewsItems;
  if (currentNewsFilter !== 'all') items = items.filter(n => n.source === currentNewsFilter);
  if (searchQuery) items = items.filter(n =>
    (n.title || '').toLowerCase().includes(searchQuery) ||
    (n.description || '').toLowerCase().includes(searchQuery) ||
    (n.tags || []).some(t => t.toLowerCase().includes(searchQuery))
  );
  if (!items.length) { grid.innerHTML = '<div class="error-state"><h3>No results found</h3><p>Try a different filter.</p></div>'; return; }

  grid.innerHTML = items.map(n => `<div class="news-card" onclick="window.open('${esc(n.url)}','_blank')">
    <div class="news-card-header">
      <span class="news-source-badge badge-${n.source}">${esc(n.sourceLabel)}</span>
      <div style="display:flex;align-items:center;gap:6px;">
        ${n.live ? '<span style="font-size:10px;color:var(--green);font-weight:600;">● LIVE</span>' : ''}
        <span class="news-date">${fmtDate(n.date)}</span>
      </div>
    </div>
    <div class="news-title">${esc(n.title)}</div>
    <div class="news-desc">${esc(n.description)}</div>
    <div class="news-tags">
      ${(n.tags || []).map(t => '<span class="tag">' + esc(t) + '</span>').join('')}
      <span class="tag" style="background:rgba(99,102,241,.1);color:var(--accent);">${esc(n.category)}</span>
    </div>
    <div class="news-footer">
      <span style="font-size:11px;color:var(--text3);">${n.live ? '🌐 ' + esc(n.feedLabel || 'Live') : '📌 Curated'}</span>
      <a class="read-more" href="${esc(n.url)}" target="_blank" onclick="event.stopPropagation()">Read more →</a>
    </div>
  </div>`).join('');
}

// ── Render Tools ──────────────────────────────────────────────────────────────
function renderTools() {
  const grid = document.getElementById('toolsGrid');
  let tools = AI_TOOLS;
  if (currentToolsFilter !== 'all') tools = tools.filter(t => t.category === currentToolsFilter);
  if (searchQuery) tools = tools.filter(t =>
    t.name.toLowerCase().includes(searchQuery) ||
    t.company.toLowerCase().includes(searchQuery) ||
    t.features.some(f => f.toLowerCase().includes(searchQuery))
  );
  if (!tools.length) { grid.innerHTML = '<div class="error-state"><h3>No tools found</h3></div>'; return; }
  grid.innerHTML = tools.map(tool => `<div class="tool-card" onclick="openToolModal('${tool.id}')">
    <div class="tool-header">
      <div class="tool-icon">${tool.icon}</div>
      <div class="tool-meta">
        <div class="tool-name">${esc(tool.name)}</div>
        <div class="tool-tagline">${esc(tool.company)} · ${esc(tool.tagline)}</div>
      </div>
      <div class="tool-version-badge">v ${esc(tool.currentVersion)}</div>
    </div>
    <div class="tool-features">${tool.features.slice(0, 4).map(f => '<div class="feature-item">' + esc(f) + '</div>').join('')}</div>
    <div class="tool-pricing">${tool.pricing.slice(0, 3).map(p => '<div class="pricing-tier"><div class="tier-name">' + esc(p.tier) + '</div><div class="tier-price">' + esc(p.price) + '</div><div class="tier-desc">' + esc(p.period) + '</div></div>').join('')}</div>
    <div class="new-features-bar">
      <div class="new-features-title">🆕 What's New in ${esc(tool.currentVersion)}</div>
      <div class="new-features-list">${tool.newFeatures.slice(0, 3).map(f => '• ' + esc(f)).join('<br>')}</div>
    </div>
    <div class="tool-footer">
      <span class="tool-category-badge cat-${tool.category}">${catLabel(tool.category)}</span>
      <button class="details-btn" onclick="event.stopPropagation();openToolModal('${tool.id}')">Full Details →</button>
    </div>
  </div>`).join('');
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('toolModal').addEventListener('click', e => { if (e.target.id === 'toolModal') closeModal(); });
}

function openToolModal(id) {
  const tool = AI_TOOLS.find(t => t.id === id);
  if (!tool) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="modal-tool-header"><div class="modal-tool-icon">${tool.icon}</div><div>
      <div class="modal-tool-name">${esc(tool.name)} <span class="winner-badge">${esc(tool.currentVersion)}</span></div>
      <div class="modal-tool-tagline">${esc(tool.company)} · ${esc(tool.tagline)}</div>
    </div></div>
    <div class="modal-section"><div class="modal-section-title">✅ All Features</div>
      <div class="modal-features-grid">${tool.features.map(f => '<div class="modal-feature-item">' + esc(f) + '</div>').join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">🆕 New in ${esc(tool.currentVersion)} vs ${esc(tool.previousVersion)}</div>
      <div class="modal-features-grid">${tool.newFeatures.map(f => '<div class="modal-feature-item" style="border-left:2px solid var(--green);">' + esc(f) + '</div>').join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">💰 Pricing Plans</div>
      <div class="modal-pricing-table">${tool.pricing.map((p, i) => '<div class="modal-pricing-card ' + (i === 1 ? 'popular' : '') + '"><div class="modal-tier-name">' + (i === 1 ? '⭐ ' : '') + esc(p.tier) + '</div><div class="modal-tier-price">' + esc(p.price) + '</div><div class="modal-tier-period">' + esc(p.period) + '</div><div class="modal-tier-features">' + p.features.map(f => '<div class="modal-tier-feature">' + esc(f) + '</div>').join('') + '</div></div>').join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">📋 Version Diff: ${esc(tool.previousVersion)} → ${esc(tool.currentVersion)}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${tool.versionDiff.added.map(a => '<div class="diff-added">+ ' + esc(a) + '</div>').join('')}
        ${tool.versionDiff.changed.map(c => '<div class="diff-changed">~ ' + esc(c) + '</div>').join('')}
        ${tool.versionDiff.removed.map(r => '<div class="diff-removed">- ' + esc(r) + '</div>').join('')}
      </div></div>
    <div class="modal-section"><div class="modal-section-title">🎯 Key Benefits</div>
      <div style="display:flex;flex-direction:column;gap:5px;">${tool.benefits.map(b => '<div class="benefit-item">' + esc(b) + '</div>').join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">📊 Performance Scores</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:6px;">
        ${Object.entries(tool.score).map(([k, v]) => '<div style="text-align:center;background:var(--surface2);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:' + (v >= 9 ? 'var(--green)' : v >= 7 ? 'var(--orange)' : 'var(--red)') + ';">' + v + '/10</div><div style="font-size:11px;color:var(--text3);text-transform:capitalize;">' + k + '</div></div>').join('')}
      </div></div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${esc(tool.website)}" target="_blank" class="cta-btn" style="display:inline-block;text-decoration:none;">Visit ${esc(tool.name)} →</a>
    </div>`;
  document.getElementById('toolModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() { document.getElementById('toolModal').classList.add('hidden'); document.body.style.overflow = ''; }

// ── Compare ───────────────────────────────────────────────────────────────────
function setupCompare() {
  const selA = document.getElementById('compareA'), selB = document.getElementById('compareB');
  AI_TOOLS.forEach(t => {
    selA.innerHTML += '<option value="' + t.id + '">' + t.name + ' (' + t.company + ')</option>';
    selB.innerHTML += '<option value="' + t.id + '">' + t.name + ' (' + t.company + ')</option>';
  });
  selB.value = AI_TOOLS[1]?.id || '';
  document.getElementById('compareBtn').addEventListener('click', () => {
    const a = AI_TOOLS.find(t => t.id === selA.value), b = AI_TOOLS.find(t => t.id === selB.value);
    if (!a || !b || a.id === b.id) { alert('Please select two different tools.'); return; }
    const result = document.getElementById('compareResult');
    const sA = Object.values(a.score).reduce((s, v) => s + v, 0);
    const sB = Object.values(b.score).reduce((s, v) => s + v, 0);
    result.classList.remove('hidden');
    result.innerHTML = compareCol(a, sA >= sB) + compareCol(b, sB > sA);
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function compareCol(tool, isWinner) {
  const paid = tool.pricing.find(p => p.price !== '$0' && p.price !== 'Free' && p.price !== 'Custom') || tool.pricing[0];
  return '<div class="compare-col"><div class="compare-col-header"><div class="compare-col-icon">' + tool.icon + '</div><div><div class="compare-col-name">' + esc(tool.name) + (isWinner ? ' <span class="winner-badge">🏆 Winner</span>' : '') + '</div><div style="font-size:12px;color:var(--text2);">' + esc(tool.company) + '</div></div></div>' +
    '<div class="compare-section-title">Latest Version</div><div class="compare-item neutral">' + esc(tool.currentVersion) + '</div>' +
    '<div class="compare-section-title">Starting Price</div><div class="compare-item pro">' + (paid ? esc(paid.price) + esc(paid.period) : 'Free') + '</div>' +
    '<div class="compare-section-title">Top Features</div>' + tool.features.slice(0, 5).map(f => '<div class="compare-item pro">' + esc(f) + '</div>').join('') +
    '<div class="compare-section-title">New Features</div>' + tool.newFeatures.slice(0, 3).map(f => '<div class="compare-item pro">' + esc(f) + '</div>').join('') +
    '<div class="compare-section-title">Performance</div>' + Object.entries(tool.score).map(([k, v]) => '<div class="compare-item ' + (v >= 8 ? 'pro' : v >= 6 ? 'neutral' : 'con') + '">' + k.charAt(0).toUpperCase() + k.slice(1) + ': ' + v + '/10</div>').join('') +
    '<div style="margin-top:12px;text-align:center;"><a href="' + esc(tool.website) + '" target="_blank" class="cta-btn" style="display:inline-block;text-decoration:none;font-size:12px;padding:8px 16px;">Try ' + esc(tool.name) + ' →</a></div></div>';
}

// ── Version Diffs ─────────────────────────────────────────────────────────────
function renderVersionDiffs() {
  document.getElementById('versionDiffs').innerHTML = AI_TOOLS.map(tool =>
    '<div class="diff-card"><div class="diff-header"><span style="font-size:20px;">' + tool.icon + '</span><span class="diff-tool-name">' + esc(tool.name) + '</span><div class="diff-versions"><span class="version-old">' + esc(tool.previousVersion) + '</span><span class="arrow">→</span><span class="version-new">' + esc(tool.currentVersion) + '</span></div></div><div class="diff-body">' +
    (tool.versionDiff.added.length ? '<div class="diff-section"><div class="diff-label">Added</div>' + tool.versionDiff.added.map(a => '<div class="diff-added">+ ' + esc(a) + '</div>').join('') + '</div>' : '') +
    (tool.versionDiff.changed.length ? '<div class="diff-section"><div class="diff-label">Changed</div>' + tool.versionDiff.changed.map(c => '<div class="diff-changed">~ ' + esc(c) + '</div>').join('') + '</div>' : '') +
    (tool.versionDiff.removed.length ? '<div class="diff-section"><div class="diff-label">Removed</div>' + tool.versionDiff.removed.map(r => '<div class="diff-removed">- ' + esc(r) + '</div>').join('') + '</div>' : '') +
    '</div></div>'
  ).join('');
}

// ── Use Cases ─────────────────────────────────────────────────────────────────
function renderUseCases() {
  const grid = document.getElementById('usecasesGrid');
  let cases = USE_CASES;
  if (currentUsecasesFilter !== 'all') cases = cases.filter(c => c.industry === currentUsecasesFilter);
  if (searchQuery) cases = cases.filter(c =>
    c.industryLabel.toLowerCase().includes(searchQuery) ||
    c.department.toLowerCase().includes(searchQuery) ||
    c.tool.toLowerCase().includes(searchQuery)
  );
  if (!cases.length) { grid.innerHTML = '<div class="error-state"><h3>No use cases found</h3></div>'; return; }
  grid.innerHTML = cases.map(uc =>
    '<div class="usecase-card"><div class="usecase-header"><div class="usecase-industry-icon">' + uc.icon + '</div><div><div class="usecase-industry">' + esc(uc.industryLabel) + '</div><div style="font-size:12px;color:var(--text2);">Real-world AI application</div></div><div class="usecase-dept">' + esc(uc.department) + '</div></div>' +
    '<div class="usecase-body"><div class="usecase-tool"><span class="usecase-tool-icon">' + uc.toolIcon + '</span><span class="usecase-tool-name">' + esc(uc.tool) + '</span></div>' +
    '<div class="usecase-scenario">' + esc(uc.scenario) + '</div>' +
    '<div class="usecase-example"><div class="usecase-example-label">📌 Real Example</div><div class="usecase-example-text">' + esc(uc.realExample) + '</div></div>' +
    '<div class="usecase-benefits">' + uc.benefits.map(b => '<div class="benefit-item">' + esc(b) + '</div>').join('') + '</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;padding:8px;background:var(--surface2);border-radius:6px;">📊 <strong style="color:var(--text2);">vs. Traditional:</strong> ' + esc(uc.comparedTo) + '</div>' +
    '<div class="usecase-footer"><span class="roi-badge">🚀 ' + esc(uc.roi) + '</span><span class="time-badge">⏱️ Saves ' + esc(uc.timeSaved) + '</span></div></div></div>'
  ).join('');
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
}
function catLabel(c) {
  return { llm: '🧠 LLM', image: '🎨 Image Gen', code: '👨‍💻 Coding', video: '🎬 Video', voice: '🔊 Voice', productivity: '📋 Productivity' }[c] || c;
}
function setLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}
