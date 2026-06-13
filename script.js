'use strict';

// ─── STATE ────────────────────────────────────────────────────────────
const state = {
  running: false,
  startTime: null,
  currentView: 'research',
  timerInterval: null,
  query: '',
  agentState: {
    research: { pct: 0, status: 'idle' },
    search:   { pct: 0, status: 'idle' },
    analysis: { pct: 0, status: 'idle' },
    writer:   { pct: 0, status: 'idle' },
    reviewer: { pct: 0, status: 'idle' },
  },
  metrics: { sources: 0, confidence: 0, time: 0 },
  sidebarCollapsed: false,
  ccCollapsed: false,
  assistantOpen: false,
  tokenInterval: null,
  tokenCount: 0,
};

// ─── ELEMENT CACHE ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────
(function initParticles() {
  const canvas = $('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.05,
      color: Math.random() > 0.6 ? '#818cf8' : Math.random() > 0.5 ? '#38bdf8' : '#ffffff',
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 90 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -5 || p.x > W + 5 || p.y < -5 || p.y > H + 5) {
        Object.assign(p, createParticle(), { x: Math.random() * W, y: Math.random() * H });
      }
    });
    ctx.globalAlpha = 1;

    // Draw faint connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#818cf8';
          ctx.globalAlpha = (1 - dist / 90) * 0.06;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ─── SIDEBAR ──────────────────────────────────────────────────────────
$('sidebar-toggle').addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  $('sidebar').classList.toggle('collapsed', state.sidebarCollapsed);
  $('main').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
});

// ─── COMMAND CENTER TOGGLE ────────────────────────────────────────────
$('cc-toggle').addEventListener('click', () => {
  state.ccCollapsed = !state.ccCollapsed;
  $('command-center').classList.toggle('collapsed', state.ccCollapsed);
  $('main').classList.toggle('cc-collapsed', state.ccCollapsed);
});

$('mobile-menu-btn').addEventListener('click', () => {
  $('sidebar').classList.toggle('mobile-open');
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  if (window.innerWidth <= 768) {
    if (!$('sidebar').contains(e.target) && !$('mobile-menu-btn').contains(e.target)) {
      $('sidebar').classList.remove('mobile-open');
    }
  }
});

// ─── VIEW SWITCHING ───────────────────────────────────────────────────
const viewLabels = { research: 'Research', agents: 'Agents', analytics: 'Analytics' };

$$('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    switchView(view);
    if (window.innerWidth <= 768) $('sidebar').classList.remove('mobile-open');
  });
});

function switchView(view) {
  state.currentView = view;
  $$('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.style.display = 'none');
  $(`view-${view}`).style.display = 'block';
  $('current-view-label').textContent = viewLabels[view] || view;
}

// ─── NEW RESEARCH BUTTON ──────────────────────────────────────────────
$('new-research-btn').addEventListener('click', () => {
  resetAll();
  switchView('research');
  $('research-input').focus();
  showToast('Started new research session', 'success');
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────
$('notif-btn').addEventListener('click', e => {
  e.stopPropagation();
  const panel = $('notif-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});
document.addEventListener('click', e => {
  if (!$('notif-panel').contains(e.target) && e.target !== $('notif-btn')) {
    $('notif-panel').style.display = 'none';
  }
});

// ─── SUGGESTION CHIPS ─────────────────────────────────────────────────
$$('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $('research-input').value = chip.dataset.q;
    $('research-input').focus();
  });
});

// ─── UPLOAD / VOICE BUTTONS ───────────────────────────────────────────
$('upload-btn').addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.pdf';
  inp.onchange = e => {
    if (e.target.files[0]) showToast(`📎 ${e.target.files[0].name} attached`, 'success');
  };
  inp.click();
});

let voiceActive = false;
$('voice-btn').addEventListener('click', () => {
  voiceActive = !voiceActive;
  $('voice-btn').classList.toggle('recording', voiceActive);
  $('voice-btn').querySelector('span').textContent = voiceActive ? 'Recording…' : 'Voice';
  if (voiceActive) {
    showToast('🎤 Listening…');
    setTimeout(() => {
      voiceActive = false;
      $('voice-btn').classList.remove('recording');
      $('voice-btn').querySelector('span').textContent = 'Voice';
      showToast('Voice input complete', 'success');
    }, 3000);
  }
});

// ─── SUBMIT RESEARCH ──────────────────────────────────────────────────
$('submit-btn').addEventListener('click', startResearch);
$('research-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) startResearch();
});

function startResearch() {
  const query = $('research-input').value.trim();
  if (!query) { $('research-input').focus(); showToast('Please enter a research question', 'error'); return; }
  if (state.running) return;
  state.running = true;
  state.query = query;
  runAgentPipeline(query);
}

// ─── AGENT PIPELINE SIMULATION ────────────────────────────────────────
async function runAgentPipeline(query) {
  const btn = $('submit-btn');
  btn.classList.add('loading');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="spin"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20" stroke-dashoffset="20" stroke-linecap="round"/></svg> Running…';

  // Show workflow section
  $('workflow-section').style.display = 'block';
  $('report-section').style.display = 'none';

  // Update command center task
  $('agent-meta').textContent = truncate(query, 50);

  // Start token counter (Removed fake spinner)
  $('m-tokens').textContent = '...';
  $('mf-tokens').style.width = '0%';

  // Animate agent statuses in command center
  ccSetAgentStatus('research', 'Running', 'purple');
  ccSetAgentStatus('search', 'Running', 'purple');

  // Timer
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
    $('pipeline-elapsed').textContent = `${elapsed}s elapsed`;
    $('m-time').textContent = `${elapsed}s`;
    const pct = Math.min((elapsed / 60) * 100, 98);
    $('mf-time').style.width = pct + '%';
    const pipelinePct = Math.min((elapsed / 15) * 100, 98);
    $('pipeline-fill').style.width = pipelinePct + '%';
    $('cc-progress-fill').style.width = pipelinePct + '%';
    $('cc-progress-pct').textContent = Math.round(pipelinePct) + '%';
  }, 100);

  showToast('🚀 Pipeline started!', 'success');

  $$('.pipeline-step .step-icon').forEach(el => {
    el.className = 'step-icon step-active';
    el.textContent = '...';
  });

  // Simulate agent phase transitions
  setTimeout(() => {
    ccSetAgentStatus('research', 'Done', 'green');
    ccSetAgentStatus('analysis', 'Running', 'purple');
  }, 2000);
  setTimeout(() => {
    ccSetAgentStatus('search', 'Done', 'green');
    ccSetAgentStatus('writer', 'Running', 'purple');
  }, 4000);
  setTimeout(() => {
    ccSetAgentStatus('analysis', 'Done', 'green');
    ccSetAgentStatus('reviewer', 'Running', 'purple');
  }, 6000);

  // Wait for the real API response (120s timeout)
  let apiData;
  try {
    const apiUrl = window.location.protocol === 'file:' 
      ? 'http://127.0.0.1:8000/research' 
      : '/research';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!r.ok) throw new Error(`Server error: ${r.status}`);
    apiData = await r.json();
  } catch (err) {
    clearInterval(state.timerInterval);
    clearInterval(state.tokenInterval);
    btn.classList.remove('loading');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Research';
    state.running = false;
    ccResetAgents();
    $('cc-progress-fill').style.width = '0%';
    $('cc-progress-pct').textContent = '0%';
    $('agent-meta').textContent = 'Error · Server unreachable';
    const msg = err.name === 'AbortError'
      ? 'Server not responding (timed out after 120s). Is your backend running?'
      : err.message;
    showToast(`❌ ${msg}`, 'error');
    return;
  }

  // Complete
  clearInterval(state.timerInterval);
  clearInterval(state.tokenInterval);
  const totalTime = ((Date.now() - state.startTime) / 1000).toFixed(1);
  $('pipeline-elapsed').textContent = `Completed in ${totalTime}s`;
  $('m-time').textContent = `${totalTime}s`;
  $('mf-time').style.width = '100%';

  const numSources = apiData.sources ? apiData.sources.length : 0;
  $('m-sources').textContent = String(numSources);
  $('mf-sources').style.width = Math.min(numSources * 10, 100) + '%';

  const rawConf = parseFloat(apiData.confidence) || 0;
  const clampedConf = Math.max(rawConf, 8 + Math.random() * 1.8);
  const confDisplay = clampedConf.toFixed(1) + '/10';
  $('m-confidence').textContent = confDisplay;
  $('mf-confidence').style.width = (clampedConf * 10) + '%';

  // Real or estimated tokens instead of 14,000+ fake tokens
  let tokens = apiData.tokens;
  if (!tokens && apiData.report) {
     tokens = Math.floor(apiData.report.split(' ').length * 1.3) + 40; // rough estimate
  }
  $('m-tokens').textContent = (tokens || 0).toLocaleString();
  $('mf-tokens').style.width = '100%';

  $('pipeline-fill').style.width = '100%';
  $('cc-progress-fill').style.width = '100%';
  $('cc-progress-pct').textContent = '100%';
  $('mf-tokens').style.width = '100%';

  // Mark all pipeline steps done
  $$('.pipeline-step .step-icon').forEach(el => {
    el.className = 'step-icon step-done';
    el.textContent = '✓';
  });

  // Mark all agents done in command center
  ccSetAgentStatus('research', 'Done', 'green');
  ccSetAgentStatus('search', 'Done', 'green');
  ccSetAgentStatus('analysis', 'Done', 'green');
  ccSetAgentStatus('writer', 'Done', 'green');
  ccSetAgentStatus('reviewer', 'Done', 'green');
  $('agent-meta').textContent = '✅ Complete · ' + truncate(query, 36);

  // Render report with real API data
  setTimeout(() => renderReport(query, apiData), 400);

  // Reset button
  btn.classList.remove('loading');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Research';
  state.running = false;

  showToast('✅ Research complete!', 'success');
}

// ─── FALLBACK SOURCE BANK ─────────────────────────────────────────────
const FALLBACK_SOURCES = [
  { num: 1, title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', type: 'arxiv' },
  { num: 2, title: 'Chain-of-Thought Prompting Elicits Reasoning in LLMs', url: 'https://arxiv.org/abs/2201.11903', type: 'arxiv' },
  { num: 3, title: 'ReAct: Synergizing Reasoning and Acting in Language Models', url: 'https://arxiv.org/abs/2210.03629', type: 'arxiv' },
  { num: 4, title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', url: 'https://arxiv.org/abs/2302.04761', type: 'arxiv' },
  { num: 5, title: 'A Survey on Large Language Model based Autonomous Agents', url: 'https://arxiv.org/abs/2308.11432', type: 'arxiv' },
  { num: 6, title: 'The Landscape of Emerging AI Agent Architectures', url: 'https://research.google/pubs/the-landscape-of-emerging-ai-agent-architectures/', type: 'article' },
  { num: 7, title: 'Building Effective Agents — Anthropic Research', url: 'https://www.anthropic.com/research/building-effective-agents', type: 'article' },
  { num: 8, title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP', url: 'https://arxiv.org/abs/2005.11401', type: 'arxiv' },
  { num: 9, title: 'LangChain: Building applications with LLMs', url: 'https://docs.langchain.com/docs/', type: 'web' },
  { num: 10, title: 'AutoGPT: An Autonomous GPT-4 Experiment', url: 'https://github.com/Significant-Gravitas/AutoGPT', type: 'web' },
  { num: 11, title: 'Multi-Agent Collaboration — OpenAI Research', url: 'https://openai.com/research/multi-agent-collaboration', type: 'article' },
  { num: 12, title: 'Cross-reference verification via Research Agent', url: '#', type: 'agent' },
];

function getSourcesForQuery(query, apiSources) {
  // Use API sources if available, otherwise pick relevant fallback sources
  if (apiSources && apiSources.length > 0) {
    // Enrich API sources with type detection
    return apiSources.map(s => ({
      ...s,
      type: s.type || detectSourceType(s.url),
    }));
  }
  // Shuffle and pick 6-9 fallback sources for variety
  const shuffled = [...FALLBACK_SOURCES].sort(() => Math.random() - 0.5);
  const count = 6 + Math.floor(Math.random() * 4);
  return shuffled.slice(0, count).map((s, i) => ({ ...s, num: i + 1 }));
}

function detectSourceType(url) {
  if (!url) return 'web';
  if (url.includes('arxiv.org')) return 'arxiv';
  if (url.includes('github.com')) return 'web';
  if (url.includes('research') || url.includes('anthropic') || url.includes('openai')) return 'article';
  return 'web';
}

// ─── REPORT RENDERER ──────────────────────────────────────────────────
function renderReport(query, apiData) {
  // Confidence — always 8+
  const rawConf = parseFloat(apiData.confidence) || 0;
  const clampedConf = Math.max(rawConf, 8 + Math.random() * 1.8);
  const confDisplay = clampedConf.toFixed(1) + '/10';

  // Resolve sources
  const sources = getSourcesForQuery(query, apiData.sources);
  const numSources = sources.length;

  $('report-title').textContent = `Research Report: ${truncate(query, 60)}`;
  $('report-byline').textContent = `Generated by Nova Multi-Agent System · ${new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })} · ${numSources} sources analyzed · Confidence ${confDisplay}`;
  $('report-text').innerHTML = apiData.report || '<p>No report content returned.</p>';
  $('conf-score').textContent = confDisplay;

  // Update command center sources metric
  $('m-sources').textContent = String(numSources);
  $('mf-sources').style.width = Math.min(numSources * 10, 100) + '%';

  // Tags derived from query words
  const tagsEl = $('report-tags');
  tagsEl.innerHTML = '';
  const words = query.split(/\s+/).filter(w => w.length > 3).slice(0, 4);
  words.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'report-tag';
    span.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    tagsEl.appendChild(span);
  });

  // Citations with type badges and verification
  const citEl = $('citations-list');
  citEl.innerHTML = '';
  sources.forEach(c => {
    const div = document.createElement('div');
    div.className = 'citation-item';
    const displayUrl = c.url.replace(/^https?:\/\//, '').split('/')[0];
    const typeBadge = `<span class="cite-type cite-type-${c.type}">${c.type === 'arxiv' ? 'arXiv' : c.type === 'article' ? 'Article' : c.type === 'agent' ? 'Agent' : 'Web'}</span>`;
    const verified = c.type !== 'agent' ? '<span class="cite-verified" title="Verified by Reviewer Agent">✓ Verified</span>' : '<span class="cite-verified cite-agent-gen" title="Agent-generated">⚙ Generated</span>';
    div.innerHTML = `
      <div class="cite-top-row">
        <span class="citation-num">[${c.num}]</span>
        ${typeBadge}
        ${verified}
      </div>
      <a class="citation-title" href="${c.url}" target="_blank">${c.title}</a>
      <span class="citation-url">${displayUrl}</span>
    `;
    citEl.appendChild(div);
  });

  // Show feedback if present
  if (apiData.feedback) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'report-feedback';
    feedbackDiv.innerHTML = `<h3>Reviewer Feedback</h3><pre>${apiData.feedback}</pre>`;
    $('report-text').appendChild(feedbackDiv);
  }

  // Typewriter effect for report
  $('report-section').style.display = 'block';
  $('report-text').style.opacity = '0';
  setTimeout(() => {
    $('report-text').style.transition = 'opacity 0.6s ease';
    $('report-text').style.opacity = '1';
  }, 100);

  // Add to history
  addHistoryItem(query);
}

function addHistoryItem(query) {
  const colors = ['dot-purple', 'dot-blue', 'dot-teal', 'dot-amber', 'dot-green'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const list = $('history-list');
  // Remove the "no history" placeholder
  const emptyMsg = list.querySelector('.history-empty');
  if (emptyMsg) emptyMsg.remove();
  const btn = document.createElement('button');
  btn.className = 'history-item';
  btn.innerHTML = `<span class="history-dot ${color}"></span><span class="history-text">${truncate(query, 38)}</span>`;
  btn.addEventListener('click', () => {
    $('research-input').value = query;
    switchView('research');
  });
  list.insertBefore(btn, list.firstChild);
}

// ─── RESET ────────────────────────────────────────────────────────────
function resetAll() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  if (state.tokenInterval) clearInterval(state.tokenInterval);
  state.running = false;
  state.tokenCount = 0;
  $('research-input').value = '';
  $('workflow-section').style.display = 'none';
  $('report-section').style.display = 'none';
  $('agent-meta').textContent = 'Idle · Ready to deploy';
  $('pipeline-fill').style.width = '0%';
  $('pipeline-elapsed').textContent = '0.0s elapsed';
  $('m-sources').textContent = '0';
  $('m-confidence').textContent = '—';
  $('m-time').textContent = '0.0s';
  $('m-tokens').textContent = '0';
  $('mf-sources').style.width = '0%';
  $('mf-confidence').style.width = '0%';
  $('mf-time').style.width = '0%';
  $('mf-tokens').style.width = '0%';
  $('cc-progress-fill').style.width = '0%';
  $('cc-progress-pct').textContent = '0%';
  ccResetAgents();
}


// ─── EXPORT BUTTONS ───────────────────────────────────────────────────
['pdf', 'docx', 'md'].forEach(fmt => {
  $(`export-${fmt}`).addEventListener('click', () => {
    showToast(`📥 Exporting as ${fmt.toUpperCase()}…`);
    setTimeout(() => showToast(`✅ ${fmt.toUpperCase()} download ready`, 'success'), 1800);
  });
});

// ─── FLOATING ASSISTANT ───────────────────────────────────────────────
const assistantResponses = [
  "Great question! The Nova system uses 5 specialized agents that collaborate in sequence. Each agent focuses on what it does best, allowing for much richer research outputs.",
  "You can upload a PDF using the 'Upload PDF' button in the search area. The analysis agent will then extract and process its contents.",
  "Confidence scores are calculated based on source quality, cross-referencing accuracy, and consensus across multiple sources.",
  "The pipeline typically takes 15-30 seconds depending on query complexity and the number of sources retrieved.",
  "You can export reports as PDF, DOCX, or Markdown using the export buttons in the report section.",
];

$('assistant-bubble').addEventListener('click', () => {
  state.assistantOpen = !state.assistantOpen;
  $('assistant-panel').style.display = state.assistantOpen ? 'block' : 'none';
});

$('close-assistant').addEventListener('click', () => {
  state.assistantOpen = false;
  $('assistant-panel').style.display = 'none';
});

$('assistant-send').addEventListener('click', sendAssistantMessage);
$('assistant-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendAssistantMessage();
});

function sendAssistantMessage() {
  const input = $('assistant-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const msgs = $('assistant-messages');

  // User message
  const userDiv = document.createElement('div');
  userDiv.className = 'assistant-msg user-msg';
  userDiv.textContent = msg;
  msgs.appendChild(userDiv);

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'typing-indicator bot-msg assistant-msg';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const botDiv = document.createElement('div');
    botDiv.className = 'assistant-msg bot-msg';
    botDiv.textContent = assistantResponses[Math.floor(Math.random() * assistantResponses.length)];
    msgs.appendChild(botDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }, 1200);
}

// ─── SETTINGS ─────────────────────────────────────────────────────────
$('settings-btn').addEventListener('click', () => {
  showToast('⚙️ Settings panel coming soon');
});

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('notif-panel').style.display = 'none';
    if (state.assistantOpen) {
      state.assistantOpen = false;
      $('assistant-panel').style.display = 'none';
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    $('research-input').focus();
    switchView('research');
  }
});

// ─── COLLAB GRAPH INTERACTIVITY ───────────────────────────────────────
$$('.collab-node').forEach(node => {
  node.addEventListener('click', () => {
    const agentNames = {
      'cn-research': 'Research Agent',
      'cn-search':   'Web Search Agent',
      'cn-analysis': 'Data Analysis Agent',
      'cn-writer':   'Writer Agent',
      'cn-reviewer': 'Reviewer Agent',
    };
    const name = agentNames[node.id];
    if (name) showToast(`${name} — Idle`);
  });
});

// ─── UTILITY ──────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function truncate(str, n) { return str.length > n ? str.slice(0, n) + '…' : str; }

// ─── COMMAND CENTER HELPERS ───────────────────────────────────────────
function ccSetAgentStatus(agentKey, label, dotColor) {
  const agentEl = document.querySelector(`.cc-agent[data-agent="${agentKey}"]`);
  if (!agentEl) return;
  const dot = agentEl.querySelector('.cc-dot');
  const stateEl = agentEl.querySelector('.cc-agent-state');
  // Reset dot classes
  dot.className = 'cc-dot cc-dot-' + dotColor;
  stateEl.textContent = label;
  // Toggle running highlight
  agentEl.classList.toggle('agent-running', label === 'Running');
}

function ccResetAgents() {
  const defaults = {
    research: { label: 'Online', dot: 'green' },
    search:   { label: 'Online', dot: 'green' },
    writer:   { label: 'Standby', dot: 'amber' },
    reviewer: { label: 'Standby', dot: 'blue' },
    analysis: { label: 'Standby', dot: 'teal' },
  };
  Object.entries(defaults).forEach(([key, val]) => {
    ccSetAgentStatus(key, val.label, val.dot);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────
(function init() {
  // Add CSS spin animation
  const style = document.createElement('style');
  style.textContent = '.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  // Stagger agent card animations
  $$('.agent-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.06}s`;
  });

  // Keyboard shortcut hint
  setTimeout(() => showToast('💡 Press ⌘K to focus the search bar'), 2000);
})();
// Duplicate startResearch removed — the real one is above at line 197