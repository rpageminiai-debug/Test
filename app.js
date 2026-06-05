// ─── State ───────────────────────────────────────────────────────────────────
let currentNewsFilter = 'all';
let currentToolsFilter = 'all';
let currentUsecasesFilter = 'all';
let allNewsItems = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupFilters();
  setupSearch();
  setupModal();
  setupCompare();
  renderTools();
  renderUseCases();
  renderVersionDiffs();
  loadNews();
  setLastUpdated();
  document.getElementById('refreshBtn').addEventListener('click', () => loadNews(true));
  setInterval(() => loadNews(true), 30 * 60 * 1000);
});

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

function setupFilters() {
  document.querySelectorAll('#tab-news .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-news .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNewsFilter = btn.dataset.filter;
      renderNews();
    });
  });
  document.querySelectorAll('#tab-tools .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-tools .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentToolsFilter = btn.dataset.filter;
      renderTools();
    });
  });
  document.querySelectorAll('.industry-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.industry-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUsecasesFilter = btn.dataset.filter;
      renderUseCases();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('globalSearch');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = input.value.toLowerCase().trim();
      renderNews();
      renderTools();
      renderUseCases();
    }, 300);
  });
}

async function loadNews(force = false) {
  const grid = document.getElementById('newsGrid');
  if (allNewsItems.length === 0 || force) {
    grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Fetching latest AI news...</p></div>`;
  }
  try {
    const liveItems = await fetchLiveNews();
    allNewsItems = mergeNews(liveItems, STATIC_NEWS);
  } catch (e) {
    console.warn('Live news fetch failed, using curated data:', e);
    allNewsItems = [...STATIC_NEWS];
  }
  renderNews();
  setLastUpdated();
}

async function fetchLiveNews() {
  const feeds = [
    { url: 'https://openai.com/news/rss/', source: 'openai', label: 'OpenAI' },
    { url: 'https://www.anthropic.com/rss.xml', source: 'anthropic', label: 'Anthropic' },
    { url: 'https://blog.google/technology/ai/rss/', source: 'google', label: 'Google' },
    { url: 'https://venturebeat.com/category/ai/feed/', source: 'general', label: 'VentureBeat AI' },
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'general', label: 'TechCrunch AI' },
  ];
  const results = await Promise.allSettled(feeds.map(f => fetchRSS(f.url, f.source, f.label)));
  const items = [];
  results.forEach(r => { if (r.status === 'fulfilled') items.push(...r.value); });
  return items;
}

async function fetchRSS(feedUrl, source, label) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=8`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error('RSS parse error');
  return data.items.map((item, i) => ({
    id: `live-${source}-${i}`,
    title: item.title,
    description: stripHTML(item.description || item.content || '').slice(0, 300),
    source,
    sourceLabel: label,
    date: item.pubDate ? item.pubDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    tags: detectTags(item.title + ' ' + (item.description || '')),
    url: item.link || '#',
    category: detectCategory(item.title),
    live: true,
  }));
}

function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function detectTags(text) {
  const lower = text.toLowerCase();
  const tagMap = { 'gpt': 'GPT', 'claude': 'Claude', 'gemini': 'Gemini', 'llama': 'Llama', 'copilot': 'Copilot', 'midjourney': 'Midjourney', 'sora': 'Sora', 'agent': 'Agents', 'reasoning': 'Reasoning', 'multimodal': 'Multimodal', 'benchmark': 'Benchmark', 'open source': 'Open Source', 'api': 'API', 'vision': 'Vision', 'coding': 'Coding', 'research': 'Research' };
  return Object.entries(tagMap).filter(([k]) => lower.includes(k)).map(([, v]) => v).slice(0, 4);
}

function detectCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('launch') || t.includes('release') || t.includes('introduce')) return 'Product Launch';
  if (t.includes('update') || t.includes('new feature')) return 'Feature Update';
  if (t.includes('research') || t.includes('study')) return 'Research';
  if (t.includes('fund') || t.includes('invest') || t.includes('valuat')) return 'Business';
  return 'AI News';
}

function mergeNews(live, curated) {
  const all = [...live, ...curated];
  const seen = new Set();
  return all.filter(item => {
    const key = item.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderNews() {
  const grid = document.getElementById('newsGrid');
  let items = allNewsItems;
  if (currentNewsFilter !== 'all') items = items.filter(n => n.source === currentNewsFilter);
  if (searchQuery) items = items.filter(n => n.title.toLowerCase().includes(searchQuery) || n.description.toLowerCase().includes(searchQuery) || (n.tags || []).some(t => t.toLowerCase().includes(searchQuery)));
  if (items.length === 0) { grid.innerHTML = `<div class="error-state"><h3>No results found</h3><p>Try a different filter or search term.</p></div>`; return; }
  grid.innerHTML = items.map(news => `
    <div class="news-card" onclick="window.open('${escHtml(news.url)}', '_blank')">
      <div class="news-card-header">
        <span class="news-source-badge badge-${news.source}">${escHtml(news.sourceLabel)}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          ${news.live ? '<span style="font-size:10px;color:var(--green);font-weight:600;">● LIVE</span>' : ''}
          <span class="news-date">${formatDate(news.date)}</span>
        </div>
      </div>
      <div class="news-title">${escHtml(news.title)}</div>
      <div class="news-desc">${escHtml(news.description)}</div>
      <div class="news-tags">
        ${(news.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
        <span class="tag" style="background:rgba(99,102,241,.1);color:var(--accent);">${escHtml(news.category)}</span>
      </div>
      <div class="news-footer">
        <span style="font-size:11px;color:var(--text3);">${news.live ? '🌐 Live Feed' : '📌 Curated'}</span>
        <a class="read-more" href="${escHtml(news.url)}" target="_blank" onclick="event.stopPropagation()">Read more →</a>
      </div>
    </div>
  `).join('');
}

function renderTools() {
  const grid = document.getElementById('toolsGrid');
  let tools = AI_TOOLS;
  if (currentToolsFilter !== 'all') tools = tools.filter(t => t.category === currentToolsFilter);
  if (searchQuery) tools = tools.filter(t => t.name.toLowerCase().includes(searchQuery) || t.company.toLowerCase().includes(searchQuery) || t.tagline.toLowerCase().includes(searchQuery) || t.features.some(f => f.toLowerCase().includes(searchQuery)));
  if (tools.length === 0) { grid.innerHTML = `<div class="error-state"><h3>No tools found</h3><p>Try a different filter.</p></div>`; return; }
  grid.innerHTML = tools.map(tool => `
    <div class="tool-card" onclick="openToolModal('${tool.id}')">
      <div class="tool-header">
        <div class="tool-icon">${tool.icon}</div>
        <div class="tool-meta">
          <div class="tool-name">${escHtml(tool.name)}</div>
          <div class="tool-tagline">${escHtml(tool.company)} · ${escHtml(tool.tagline)}</div>
        </div>
        <div class="tool-version-badge">v ${escHtml(tool.currentVersion)}</div>
      </div>
      <div class="tool-features">${tool.features.slice(0, 4).map(f => `<div class="feature-item">${escHtml(f)}</div>`).join('')}</div>
      <div class="tool-pricing">${tool.pricing.slice(0, 3).map(p => `<div class="pricing-tier"><div class="tier-name">${escHtml(p.tier)}</div><div class="tier-price">${escHtml(p.price)}</div><div class="tier-desc">${escHtml(p.period)}</div></div>`).join('')}</div>
      <div class="new-features-bar">
        <div class="new-features-title">🆕 What's New in ${escHtml(tool.currentVersion)}</div>
        <div class="new-features-list">${tool.newFeatures.slice(0, 3).map(f => `• ${escHtml(f)}`).join('<br>')}</div>
      </div>
      <div class="tool-footer">
        <span class="tool-category-badge cat-${tool.category}">${categoryLabel(tool.category)}</span>
        <button class="details-btn" onclick="event.stopPropagation(); openToolModal('${tool.id}')">Full Details →</button>
      </div>
    </div>
  `).join('');
}

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('toolModal').addEventListener('click', e => { if (e.target.id === 'toolModal') closeModal(); });
}

function openToolModal(id) {
  const tool = AI_TOOLS.find(t => t.id === id);
  if (!tool) return;
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-tool-header">
      <div class="modal-tool-icon">${tool.icon}</div>
      <div>
        <div class="modal-tool-name">${escHtml(tool.name)} <span class="winner-badge">${escHtml(tool.currentVersion)}</span></div>
        <div class="modal-tool-tagline">${escHtml(tool.company)} · ${escHtml(tool.tagline)}</div>
      </div>
    </div>
    <div class="modal-section"><div class="modal-section-title">✅ All Features</div><div class="modal-features-grid">${tool.features.map(f => `<div class="modal-feature-item">${escHtml(f)}</div>`).join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">🆕 New in ${escHtml(tool.currentVersion)} (vs ${escHtml(tool.previousVersion)})</div><div class="modal-features-grid">${tool.newFeatures.map(f => `<div class="modal-feature-item" style="border-left:2px solid var(--green);">${escHtml(f)}</div>`).join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">💰 Pricing Plans</div><div class="modal-pricing-table">${tool.pricing.map((p, i) => `<div class="modal-pricing-card ${i === 1 ? 'popular' : ''}"><div class="modal-tier-name">${i === 1 ? '⭐ ' : ''}${escHtml(p.tier)}</div><div class="modal-tier-price">${escHtml(p.price)}</div><div class="modal-tier-period">${escHtml(p.period)}</div><div class="modal-tier-features">${p.features.map(f => `<div class="modal-tier-feature">${escHtml(f)}</div>`).join('')}</div></div>`).join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">📋 Version Diff: ${escHtml(tool.previousVersion)} → ${escHtml(tool.currentVersion)}</div><div style="display:flex;flex-direction:column;gap:4px;">${tool.versionDiff.added.map(a => `<div class="diff-added">+ ${escHtml(a)}</div>`).join('')}${tool.versionDiff.changed.map(c => `<div class="diff-changed">~ ${escHtml(c)}</div>`).join('')}${tool.versionDiff.removed.map(r => `<div class="diff-removed">- ${escHtml(r)}</div>`).join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">🎯 Key Benefits</div><div style="display:flex;flex-direction:column;gap:5px;">${tool.benefits.map(b => `<div class="benefit-item">${escHtml(b)}</div>`).join('')}</div></div>
    <div class="modal-section"><div class="modal-section-title">📊 Performance Scores</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:6px;">${Object.entries(tool.score).map(([k, v]) => `<div style="text-align:center;background:var(--surface2);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:${v >= 9 ? 'var(--green)' : v >= 7 ? 'var(--orange)' : 'var(--red)'}">${v}/10</div><div style="font-size:11px;color:var(--text3);margin-top:2px;text-transform:capitalize;">${k}</div></div>`).join('')}</div></div>
    <div style="text-align:center;margin-top:16px;"><a href="${escHtml(tool.website)}" target="_blank" class="cta-btn" style="display:inline-block;text-decoration:none;">Visit ${escHtml(tool.name)} →</a></div>
  `;
  document.getElementById('toolModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('toolModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function setupCompare() {
  const selectA = document.getElementById('compareA');
  const selectB = document.getElementById('compareB');
  AI_TOOLS.forEach(t => {
    selectA.innerHTML += `<option value="${t.id}">${t.name} (${t.company})</option>`;
    selectB.innerHTML += `<option value="${t.id}">${t.name} (${t.company})</option>`;
  });
  selectB.value = AI_TOOLS[1]?.id || '';
  document.getElementById('compareBtn').addEventListener('click', () => {
    const a = AI_TOOLS.find(t => t.id === selectA.value);
    const b = AI_TOOLS.find(t => t.id === selectB.value);
    if (!a || !b || a.id === b.id) { alert('Please select two different tools to compare.'); return; }
    renderCompare(a, b);
  });
}

function renderCompare(a, b) {
  const result = document.getElementById('compareResult');
  result.classList.remove('hidden');
  const scoreA = Object.values(a.score).reduce((s, v) => s + v, 0);
  const scoreB = Object.values(b.score).reduce((s, v) => s + v, 0);
  const winnerA = scoreA >= scoreB;
  result.innerHTML = renderCompareCol(a, winnerA) + renderCompareCol(b, !winnerA);
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderCompareCol(tool, isWinner) {
  const cheapestPaid = tool.pricing.find(p => p.price !== '$0' && p.price !== 'Free' && p.price !== 'Custom') || tool.pricing[1] || tool.pricing[0];
  return `<div class="compare-col">
    <div class="compare-col-header"><div class="compare-col-icon">${tool.icon}</div><div><div class="compare-col-name">${escHtml(tool.name)} ${isWinner ? '<span class="winner-badge">🏆 Winner</span>' : ''}</div><div style="font-size:12px;color:var(--text2);">${escHtml(tool.company)}</div></div></div>
    <div class="compare-section-title">Latest Version</div><div class="compare-item neutral">${escHtml(tool.currentVersion)} (was ${escHtml(tool.previousVersion)})</div>
    <div class="compare-section-title">Starting Price</div><div class="compare-item pro">${cheapestPaid ? escHtml(cheapestPaid.price) + escHtml(cheapestPaid.period) : 'Free'}</div>
    <div class="compare-section-title">Top Features</div>${tool.features.slice(0, 5).map(f => `<div class="compare-item pro">${escHtml(f)}</div>`).join('')}
    <div class="compare-section-title">New in Latest Version</div>${tool.newFeatures.slice(0, 3).map(f => `<div class="compare-item pro">${escHtml(f)}</div>`).join('')}
    <div class="compare-section-title">Key Benefits</div>${tool.benefits.map(b => `<div class="compare-item neutral">${escHtml(b)}</div>`).join('')}
    <div class="compare-section-title">Performance</div>${Object.entries(tool.score).map(([k, v]) => `<div class="compare-item ${v >= 8 ? 'pro' : v >= 6 ? 'neutral' : 'con'}">${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}/10</div>`).join('')}
    <div style="margin-top:12px;text-align:center;"><a href="${escHtml(tool.website)}" target="_blank" class="cta-btn" style="display:inline-block;text-decoration:none;font-size:12px;padding:8px 16px;">Try ${escHtml(tool.name)} →</a></div>
  </div>`;
}

function renderVersionDiffs() {
  const container = document.getElementById('versionDiffs');
  container.innerHTML = AI_TOOLS.map(tool => `
    <div class="diff-card">
      <div class="diff-header"><span style="font-size:20px;">${tool.icon}</span><span class="diff-tool-name">${escHtml(tool.name)}</span><div class="diff-versions"><span class="version-old">${escHtml(tool.previousVersion)}</span><span class="arrow">→</span><span class="version-new">${escHtml(tool.currentVersion)}</span></div></div>
      <div class="diff-body">
        ${tool.versionDiff.added.length ? `<div class="diff-section"><div class="diff-label">Added</div>${tool.versionDiff.added.map(a => `<div class="diff-added">+ ${escHtml(a)}</div>`).join('')}</div>` : ''}
        ${tool.versionDiff.changed.length ? `<div class="diff-section"><div class="diff-label">Changed / Improved</div>${tool.versionDiff.changed.map(c => `<div class="diff-changed">~ ${escHtml(c)}</div>`).join('')}</div>` : ''}
        ${tool.versionDiff.removed.length ? `<div class="diff-section"><div class="diff-label">Removed</div>${tool.versionDiff.removed.map(r => `<div class="diff-removed">- ${escHtml(r)}</div>`).join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderUseCases() {
  const grid = document.getElementById('usecasesGrid');
  let cases = USE_CASES;
  if (currentUsecasesFilter !== 'all') cases = cases.filter(c => c.industry === currentUsecasesFilter);
  if (searchQuery) cases = cases.filter(c => c.industryLabel.toLowerCase().includes(searchQuery) || c.department.toLowerCase().includes(searchQuery) || c.tool.toLowerCase().includes(searchQuery) || c.scenario.toLowerCase().includes(searchQuery));
  if (cases.length === 0) { grid.innerHTML = `<div class="error-state"><h3>No use cases found</h3><p>Try a different filter.</p></div>`; return; }
  grid.innerHTML = cases.map(uc => `
    <div class="usecase-card">
      <div class="usecase-header"><div class="usecase-industry-icon">${uc.icon}</div><div><div class="usecase-industry">${escHtml(uc.industryLabel)}</div><div style="font-size:12px;color:var(--text2);">Real-world AI application</div></div><div class="usecase-dept">${escHtml(uc.department)}</div></div>
      <div class="usecase-body">
        <div class="usecase-tool"><span class="usecase-tool-icon">${uc.toolIcon}</span><span class="usecase-tool-name">${escHtml(uc.tool)}</span><span style="font-size:11px;color:var(--text3);margin-left:4px;">→ ${escHtml(uc.department)}</span></div>
        <div class="usecase-scenario">${escHtml(uc.scenario)}</div>
        <div class="usecase-example"><div class="usecase-example-label">📌 Real Example</div><div class="usecase-example-text">${escHtml(uc.realExample)}</div></div>
        <div class="usecase-benefits">${uc.benefits.map(b => `<div class="benefit-item">${escHtml(b)}</div>`).join('')}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px;padding:8px;background:var(--surface2);border-radius:6px;">📊 <strong style="color:var(--text2);">vs. Traditional:</strong> ${escHtml(uc.comparedTo)}</div>
        <div class="usecase-footer"><span class="roi-badge">🚀 ${escHtml(uc.roi)}</span><span class="time-badge">⏱️ Saves ${escHtml(uc.timeSaved)}</span></div>
      </div>
    </div>
  `).join('');
}

function escHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return dateStr; }
}

function categoryLabel(cat) {
  const map = { llm: '🧠 LLM', image: '🎨 Image Gen', code: '👨‍💻 Coding', video: '🎬 Video', voice: '🔊 Voice', productivity: '📋 Productivity' };
  return map[cat] || cat;
}

function setLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}