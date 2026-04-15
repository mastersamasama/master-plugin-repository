// ─── State ────────────────────────────────────────────────
let scanning = false;
let signals = [];
let activePositions = [];
let closedPositions = [];
let activities = [];
let x402IncomeTotal = 0;
let x402SpendTotal = 0;
let x402IncomeCount = 0;
let x402SpendCount = 0;
let totalSignalsScanned = 0;
let selling = false;
let progressInterval = null;
let isDemo = false;
let currentLang = 'zh';

// ─── i18n ─────────────────────────────────────────────────
const I18N = {
  en: {
    // Header
    scanning: 'Scanning', idle: 'Idle', signals: 'Signals', trades: 'Trades',
    winRate: 'Win %', pnl: 'PnL', start: 'Start', stop: 'Stop', report: 'Report',
    // Pipeline
    pipeScan: 'Scan', pipeScore: 'Score', pipeSafety: 'Safety', pipeTrade: 'Trade',
    pipe3Sources: '3 sources', pipeQualified: 'qualified', pipe4Gate: '4-gate pass', pipeExecuted: 'executed',
    // Left column
    wallet: 'WALLET', activityFeed: 'ACTIVITY FEED', waitingActivity: 'Waiting for activity...',
    // Center
    liveSignals: 'LIVE SIGNALS', noSignals: 'No signals yet. Start scanning to discover alpha.',
    // Right
    positions: 'POSITIONS', closedTrades: 'CLOSED TRADES', open: 'Open',
    noPositions: 'No active positions.', noClosed: 'No closed trades yet.',
    // Login
    email: 'Email', connectWallet: 'Connect Wallet', verify: 'Verify',
    otpSentTo: 'OTP sent to', enterEmail: 'Please enter your email',
    enterCode: 'Please enter the verification code',
    poweredBy: 'Powered by TEE Agentic Wallet',
    tagline: 'Alpha & Security Guardian',
    // Security
    walletSecurity: 'Wallet Security', scanNow: 'Scan Now',
    secDesc: 'Scan holdings for contract risks, honeypots, and dangerous approvals',
    highRisk: 'High Risk', warning: 'Warning', safe: 'Safe',
    tokenRisk: 'Token Risk Analysis', clickScan: 'Click "Scan Now" to analyze your holdings.',
    manualScan: 'Manual Token Scan', scan: 'Scan', score: 'Score',
    // Security checks
    honeypot: 'Honeypot', mintBackdoor: 'Mint backdoor', highTax: 'High transfer tax',
    proxy: 'Upgradeable proxy', ownerNotRenounced: 'Ownership not renounced',
    canPause: 'Can pause transfers', blacklist: 'Blacklist function',
    antiWhale: 'Anti-whale mechanism', hiddenOwner: 'Hidden owner',
    externalCall: 'External call risk', noIssues: 'No issues',
    lpLocked: 'LP Locked', lpUnlocked: 'LP Unlocked', verified: 'Verified', unverified: 'Unverified',
    nativeStablecoin: 'Native/stablecoin — safe', scanUnavailable: 'Scan unavailable',
    // Signal actions
    buy: 'BUY', skip: 'SKIP', blacklistAction: 'BLACKLIST',
    // Position status
    trailing: 'TRAILING', monitor: 'MONITOR', sell: 'Sell',
    // Closed reasons
    reasonTP: 'TP', reasonSL: 'SL', reasonTMO: 'TMO', reasonMAN: 'MAN',
    // x402
    x402Marketplace: 'x402 Marketplace', offline: 'Offline', startSelling: 'Start Selling',
    stopSelling: 'Stop Selling', income: 'Income', spend: 'Spend', subscribe: 'Subscribe',
    // Config modal
    strategyConfig: 'Strategy Configuration', chains: 'Chains',
    positionSize: 'Position Size (USDT)', scanInterval: 'Scan Interval (sec)',
    takeProfit: 'Take Profit (%)', stopLoss: 'Stop Loss (%)',
    hardLimits: 'Hard limits: max 50 USDT/trade, 200 USDT/wallet, 1000 USDT total',
    launch: 'Launch', cancel: 'Cancel',
    // Report
    alphaReport: 'Alpha Hunt Report', signalsScanned: 'Signals Scanned',
    tradesExecuted: 'Trades Executed', realizedPnl: 'Realized PnL',
    unrealizedPnl: 'Unrealized PnL', x402Income: 'x402 Income', x402Spend: 'x402 Spend',
    runtime: 'Runtime', passedSafety: 'Passed Safety',
    // Activity badges
    badgeScan: 'SCAN', badgeSafe: 'SAFE', badgeSkip: 'SKIP',
    badgeBlock: 'BLOCK', badgeBuy: 'BUY', badgeSell: 'SELL', badgeX402: 'x402',
    // Tabs
    tabAlpha: 'Alpha', tabSecurity: 'Security',
    // Demo
    demoMode: 'DEMO MODE',
    // Skills
    pluginSkills: 'Claude Code Plugin Skills', pluginDesc: 'Use these skills via Claude Code CLI for natural language interaction',
    skillAlphaHunt: 'Multi-source signal discovery + auto trading with 4-gate safety',
    skillAlphaSell: 'Sell alpha signals via x402 payment-gated marketplace',
    skillAlphaBuy: 'Subscribe to external x402 signals + auto-execute with safety',
    skillSafeTrade: '4-gate security pipeline before every trade execution',
    skillSecScan: '5-dimension wallet security health check with risk scoring',
    skillPortfolio: 'Holdings risk monitor with auto-disposal for dangerous tokens',
    skillMultiWallet: 'Cross-wallet security audit with global risk aggregation',
    skillSecService: 'Security-as-a-Service via x402 micropayments (sell/buy scans)',
    mainWallet: 'Main Wallet', subWalletNote: 'Trades in isolated sub-wallets (risk-separated)',
  },
  zh: {
    scanning: '扫描中', idle: '空闲', signals: '信号', trades: '交易',
    winRate: '胜率', pnl: '盈亏', start: '开始', stop: '停止', report: '报告',
    pipeScan: '扫描', pipeScore: '评分', pipeSafety: '安全', pipeTrade: '交易',
    pipe3Sources: '3个信号源', pipeQualified: '通过评分', pipe4Gate: '4关安全', pipeExecuted: '已执行',
    wallet: '钱包', activityFeed: '活动日志', waitingActivity: '等待活动...',
    liveSignals: '实时信号', noSignals: '暂无信号。点击开始扫描发现 Alpha。',
    positions: '持仓', closedTrades: '已平仓', open: '浮动',
    noPositions: '暂无持仓。', noClosed: '暂无已平仓交易。',
    email: '邮箱', connectWallet: '连接钱包', verify: '验证',
    otpSentTo: '验证码已发送至', enterEmail: '请输入邮箱',
    enterCode: '请输入验证码',
    poweredBy: '基于 TEE 托管钱包', tagline: 'Alpha 猎手 & 安全守护',
    walletSecurity: '钱包安全', scanNow: '立即扫描',
    secDesc: '扫描持仓的合约风险、蜜罐和危险授权',
    highRisk: '高风险', warning: '警告', safe: '安全',
    tokenRisk: '代币风险分析', clickScan: '点击"立即扫描"分析您的持仓。',
    manualScan: '手动代币扫描', scan: '扫描', score: '评分',
    honeypot: '蜜罐', mintBackdoor: '增发后门', highTax: '高额转账税',
    proxy: '可升级代理', ownerNotRenounced: '所有权未放弃',
    canPause: '可暂停转账', blacklist: '黑名单功能',
    antiWhale: '反巨鲸机制', hiddenOwner: '隐藏所有者',
    externalCall: '外部调用风险', noIssues: '无风险',
    lpLocked: 'LP 已锁定', lpUnlocked: 'LP 未锁定', verified: '已验证', unverified: '未验证',
    nativeStablecoin: '原生代币/稳定币 — 安全', scanUnavailable: '扫描不可用',
    buy: '买入', skip: '跳过', blacklistAction: '黑名单',
    trailing: '追踪止盈', monitor: '监控中', sell: '卖出',
    reasonTP: '止盈', reasonSL: '止损', reasonTMO: '超时', reasonMAN: '手动',
    x402Marketplace: 'x402 信号市场', offline: '离线', startSelling: '开始卖信号',
    stopSelling: '停止卖信号', income: '收入', spend: '支出', subscribe: '订阅',
    strategyConfig: '策略配置', chains: '链',
    positionSize: '仓位大小 (USDT)', scanInterval: '扫描间隔 (秒)',
    takeProfit: '止盈 (%)', stopLoss: '止损 (%)',
    hardLimits: '硬限制：单笔≤50 USDT，单钱包≤200 USDT，总计≤1000 USDT',
    launch: '启动', cancel: '取消',
    alphaReport: 'Alpha 猎手报告', signalsScanned: '已扫描信号',
    tradesExecuted: '已执行交易', realizedPnl: '已实现盈亏',
    unrealizedPnl: '未实现盈亏', x402Income: 'x402 收入', x402Spend: 'x402 支出',
    runtime: '运行时间', passedSafety: '通过安全检查',
    badgeScan: '扫描', badgeSafe: '安全', badgeSkip: '跳过',
    badgeBlock: '拦截', badgeBuy: '买入', badgeSell: '卖出', badgeX402: 'x402',
    tabAlpha: 'Alpha', tabSecurity: '安全',
    demoMode: '演示模式',
    mainWallet: '主钱包', subWalletNote: '交易在隔离子钱包中执行（风险隔离）',
    // Skills
    pluginSkills: 'Claude Code 插件技能', pluginDesc: '通过 Claude Code CLI 使用自然语言交互',
    skillAlphaHunt: '多源信号发现 + 4关安全自动交易',
    skillAlphaSell: '通过 x402 支付网关出售 Alpha 信号',
    skillAlphaBuy: '订阅外部 x402 信号 + 安全验证后自动执行',
    skillSafeTrade: '每笔交易前的4关安全检查管道',
    skillSecScan: '5维度钱包安全健康检查与风险评分',
    skillPortfolio: '持仓风险监控，自动处置危险代币',
    skillMultiWallet: '跨钱包安全审计与全局风险聚合',
    skillSecService: '通过 x402 微支付提供安全即服务（买卖扫描）',
  },
};

function t(key) {
  return I18N[currentLang]?.[key] || I18N.en[key] || key;
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  applyLang();
  // Re-render dynamic content
  renderSignals();
  renderPositions();
  renderActivities();
}

function applyLang() {
  // Static text elements: [data-i18n="key"] → textContent = t(key)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  // Update buttons and labels that need special handling
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) langBtn.textContent = currentLang === 'en' ? '中文' : 'EN';
  // Update scan status
  const statusEl = document.getElementById('scan-status');
  if (statusEl && !scanning) statusEl.textContent = t('idle');
  if (statusEl && scanning) statusEl.textContent = t('scanning');
  // Buttons
  const startBtn = document.getElementById('btn-start');
  if (startBtn) startBtn.textContent = t('start');
  const stopBtn = document.getElementById('btn-stop');
  if (stopBtn) stopBtn.textContent = t('stop');
  const reportBtn = document.getElementById('btn-report');
  if (reportBtn) reportBtn.textContent = t('report');
  // Demo badge
  const demoBadge = document.getElementById('demo-badge');
  if (demoBadge && !demoBadge.classList.contains('hidden')) demoBadge.textContent = t('demoMode');
  // x402 sell button & status (dynamic state, not data-i18n)
  updateSellUI(selling);
}

// ─── Helpers ──────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const colors = {
    success: 'bg-green/20 border-green/50 text-green',
    error: 'bg-red/20 border-red/50 text-red',
    warning: 'bg-yellow/20 border-yellow/50 text-yellow',
    info: 'bg-accent/20 border-accent/50 text-accent',
  };
  const el = document.createElement('div');
  el.className = `toast px-4 py-3 rounded-lg border text-sm ${colors[type] || colors.info}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn._origText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.classList.add('btn-loading');
  } else {
    btn.textContent = btn._origText || btn.textContent;
    btn.classList.remove('btn-loading');
  }
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function chainName(id) {
  const map = { '501': 'SOL', '8453': 'Base', '1': 'ETH', '196': 'XLayer' };
  return map[String(id)] || id || '?';
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatBalance(bal) {
  const n = parseFloat(bal);
  if (isNaN(n)) return bal;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.001) return n.toFixed(6);
  return n.toPrecision(4);
}

// ─── Login Flow ───────────────────────────────────────────
async function loginStep1() {
  const emailEl = document.getElementById('login-email');
  if (!emailEl) return;
  const email = emailEl.value.trim();
  if (!email) { showLoginError('Please enter your email'); return; }

  hideLoginError();
  setLoading('btn-login-step1', true);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      if (isDemo) {
        // Demo mode: auto-verify, skip OTP step
        await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: '000000' }),
        });
        showDashboard();
        return;
      }
      const step1 = document.getElementById('login-step1');
      const step2 = document.getElementById('login-step2');
      if (step1) step1.classList.add('hidden');
      if (step2) step2.classList.remove('hidden');
      const emailDisplay = document.getElementById('login-email-display');
      if (emailDisplay) emailDisplay.textContent = email;
    } else {
      showLoginError(data.error || 'Failed to send verification code');
    }
  } catch (e) {
    showLoginError(`Login error: ${e.message}`);
  } finally {
    setLoading('btn-login-step1', false);
  }
}

async function loginStep2() {
  const codeEl = document.getElementById('login-code');
  if (!codeEl) return;
  const code = codeEl.value.trim();
  if (!code) { showLoginError('Please enter the verification code'); return; }

  hideLoginError();
  setLoading('btn-login-step2', true);
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      showDashboard();
    } else {
      showLoginError(data.error || 'Invalid verification code');
    }
  } catch (e) {
    showLoginError(`Verify error: ${e.message}`);
  } finally {
    setLoading('btn-login-step2', false);
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }
}

function hideLoginError() {
  const el = document.getElementById('login-error');
  if (el) el.classList.add('hidden');
}

function showDashboard() {
  const overlay = document.getElementById('login-overlay');
  const dashboard = document.getElementById('dashboard');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
      if (dashboard) dashboard.classList.remove('hidden');
      initDashboard();
    }, 500);
  } else {
    if (dashboard) dashboard.classList.remove('hidden');
    initDashboard();
  }
}

// ─── SSE Connection ───────────────────────────────────────
let sse;

function connectSSE() {
  if (sse) { try { sse.close(); } catch (_) {} }
  sse = new EventSource('/api/events');

  sse.addEventListener('signal:new', (e) => {
    const signal = JSON.parse(e.data);
    signals.unshift(signal);
    if (signals.length > 50) signals.pop();
    renderSignals();
    totalSignalsScanned++;
    updateKPIs();
    const icon = signal.action === 'BUY' ? '+' : signal.action === 'SKIP' ? '~' : 'x';
    toast(`${icon} ${signal.token?.symbol || '?'} (${chainName(signal.token?.chain)}) — Score: ${signal.compositeScore}`, signal.action === 'BUY' ? 'success' : 'info');
  });

  sse.addEventListener('trade:executed', (e) => {
    const pos = JSON.parse(e.data);
    activePositions.push(pos);
    renderPositions();
    updateKPIs();
    toast(`BUY ${pos.token?.symbol} — $${pos.entryAmount} in ${pos.wallet}`, 'success');
  });

  sse.addEventListener('position:update', (e) => {
    const updated = JSON.parse(e.data);
    const idx = activePositions.findIndex(p => p.positionId === updated.positionId);
    if (idx >= 0) activePositions[idx] = updated;
    renderPositions();
  });

  sse.addEventListener('position:closed', (e) => {
    const closed = JSON.parse(e.data);
    activePositions = activePositions.filter(p => p.positionId !== closed.positionId);
    closedPositions.unshift(closed);
    renderPositions();
    updateKPIs();
    const pnl = closed.realizedPnl || 0;
    const reason = { TRAILING_TP: 'Take Profit', STOP_LOSS: 'Stop Loss', TIMEOUT: 'Timeout', MANUAL: 'Manual' }[closed.exitReason] || closed.exitReason;
    toast(`SOLD ${closed.token?.symbol} — ${reason} | PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'warning');
  });

  sse.addEventListener('status:update', (e) => {
    const status = JSON.parse(e.data);
    updateScanUI(status.scanning);
    if (status.scanCount) {
      const el = document.getElementById('scan-count');
      if (el) {
        el.textContent = `${status.scanCount} scans`;
        el.classList.remove('hidden');
      }
    }
  });

  sse.addEventListener('activity', (e) => {
    const item = JSON.parse(e.data);
    addActivity(item);
  });

  sse.addEventListener('pipeline:update', (e) => {
    const data = JSON.parse(e.data);
    const rawEl = document.getElementById('pipe-raw');
    const qualEl = document.getElementById('pipe-qualified');
    const passEl = document.getElementById('pipe-passed');
    const tradedEl = document.getElementById('pipe-traded');
    if (rawEl) rawEl.textContent = data.raw ?? rawEl.textContent;
    if (qualEl) qualEl.textContent = data.qualified ?? qualEl.textContent;
    if (passEl) passEl.textContent = data.passed ?? passEl.textContent;
    if (tradedEl) tradedEl.textContent = data.traded ?? tradedEl.textContent;

    // Light up arrows briefly
    document.querySelectorAll('.pipe-arrow').forEach(arrow => {
      arrow.classList.add('text-accent');
      setTimeout(() => arrow.classList.remove('text-accent'), 800);
    });

    // Animate progress bar: set to 100% then reset
    const bar = document.getElementById('scan-progress-bar');
    if (bar) {
      bar.style.width = '100%';
      setTimeout(() => { bar.style.width = '0%'; }, 600);
    }
  });

  sse.addEventListener('x402:payment', (e) => {
    const data = JSON.parse(e.data);
    if (data.direction === 'income') {
      x402IncomeTotal += data.amount;
      x402IncomeCount++;
      const incEl = document.getElementById('x402-income');
      if (incEl) incEl.textContent = x402IncomeTotal.toFixed(1) + ' USDG';
      const incCntEl = document.getElementById('x402-income-count');
      if (incCntEl) incCntEl.textContent = `(${x402IncomeCount} sold)`;
      toast(`x402 income: +${data.amount} USDG`, 'success');
    } else {
      x402SpendTotal += data.amount;
      x402SpendCount++;
      const spEl = document.getElementById('x402-spend');
      if (spEl) spEl.textContent = x402SpendTotal.toFixed(1) + ' USDG';
      const spCntEl = document.getElementById('x402-spend-count');
      if (spCntEl) spCntEl.textContent = `(${x402SpendCount} bought)`;
    }
  });

  sse.onerror = () => {
    toast('SSE connection lost. Retrying...', 'error');
  };
}

// ─── Activity Feed ────────────────────────────────────────
const ACTIVITY_BADGES = {
  scan_start: { key: 'badgeScan', cls: 'bg-purple/15 text-purple' },
  scan_found: { key: 'badgeScan', cls: 'bg-purple/15 text-purple' },
  scan_end: { key: 'badgeScan', cls: 'bg-purple/15 text-purple' },
  safe: { key: 'badgeSafe', cls: 'bg-accent/15 text-accent' },
  skip: { key: 'badgeSkip', cls: 'bg-yellow/15 text-yellow' },
  block: { key: 'badgeBlock', cls: 'bg-red/15 text-red' },
  buy: { key: 'badgeBuy', cls: 'bg-green/15 text-green' },
  sell: { key: 'badgeSell', cls: 'bg-red/15 text-red' },
  x402: { key: 'badgeX402', cls: 'bg-green/15 text-green' },
};

function addActivity(item) {
  activities.unshift(item);
  if (activities.length > 50) activities.pop();
  renderActivities();
}

function renderActivities() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  if (activities.length === 0) {
    feed.innerHTML = '<p class="text-gray-600 text-sm">No activity yet.</p>';
    return;
  }

  feed.innerHTML = activities.map(item => {
    const ts = item.timestamp ? new Date(item.timestamp) : new Date();
    const hh = String(ts.getHours()).padStart(2, '0');
    const mm = String(ts.getMinutes()).padStart(2, '0');
    const badge = ACTIVITY_BADGES[item.type] || { key: null, cls: 'bg-gray-700 text-gray-400' };
    const badgeLabel = badge.key ? t(badge.key) : (item.type || '?');
    return `
      <div class="activity-item flex items-center gap-2 text-xs py-1.5">
        <span class="text-gray-600 w-10 shrink-0">${hh}:${mm}</span>
        <span class="px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}">${badgeLabel}</span>
        <span class="text-gray-400 truncate">${esc(item.message || '')}</span>
      </div>`;
  }).join('');
}

// ─── Wallet / Portfolio Renderer ──────────────────────────
async function fetchPortfolio() {
  const tokensEl = document.getElementById('portfolio-tokens');
  const walletTotal = document.getElementById('wallet-total');
  const walletChains = document.getElementById('wallet-chains');
  try {
    const res = await fetch('/api/portfolio');
    const data = await res.json();

    if (data.error) {
      if (tokensEl) tokensEl.innerHTML = `<p class="text-red text-sm">${esc(data.error)}</p>`;
      return;
    }

    // Update total in wallet section if present
    if (walletTotal) walletTotal.textContent = `$${(data.totalUsd || 0).toFixed(2)}`;

    // Update portfolio summary cards
    const totalEl = document.getElementById('portfolio-total');
    const countEl = document.getElementById('portfolio-count');
    if (totalEl) totalEl.textContent = `$${(data.totalUsd || 0).toFixed(2)}`;
    if (countEl) countEl.textContent = data.tokenCount || 0;

    // Addresses
    if (data.evmAddress) {
      const evmEl = document.getElementById('portfolio-evm-addr');
      if (evmEl) {
        evmEl.textContent = data.evmAddress.slice(0, 6) + '...' + data.evmAddress.slice(-4);
        evmEl.title = data.evmAddress;
      }
    }
    if (data.solAddress) {
      const solEl = document.getElementById('portfolio-sol-addr');
      if (solEl) {
        solEl.textContent = data.solAddress.slice(0, 6) + '...' + data.solAddress.slice(-4);
        solEl.title = data.solAddress;
      }
    }

    // Render chains grouped view if wallet-chains element exists
    if (walletChains && data.chains) {
      const chainColorMap = { '501': 'text-purple', '8453': 'text-accent', '1': 'text-accent', '196': 'text-accent' };
      const chainLabelMap = { '501': 'Solana', '8453': 'Base', '1': 'Ethereum', '196': 'XLayer' };

      walletChains.innerHTML = Object.entries(data.chains).map(([chainId, chain]) => {
        const color = chainColorMap[chainId] || 'text-accent';
        const label = chain.name || chainLabelMap[chainId] || chainId;
        const addr = chain.address || '';
        const truncAddr = addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
        const tokenList = (chain.tokens || []).map(t =>
          `<div class="flex justify-between text-xs py-0.5">
            <span class="text-gray-300">${esc(t.symbol)}</span>
            <span class="text-gray-400">${formatBalance(t.balance)}</span>
            <span class="text-gray-500">$${parseFloat(t.usdValue || 0).toFixed(2)}</span>
          </div>`
        ).join('');

        return `
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="${color} text-xs font-medium">&diams; ${esc(label)}</span>
              <span class="text-gray-600 text-xs" title="${esc(addr)}">${esc(truncAddr)}</span>
            </div>
            ${tokenList || '<div class="text-xs text-gray-600">No tokens</div>'}
          </div>`;
      }).join('');
    }

    // Flat token list for portfolio-tokens (security tab)
    const tokens = data.tokens || [];
    if (tokensEl) {
      if (tokens.length === 0) {
        tokensEl.innerHTML = '<p class="text-gray-600 text-sm">No tokens found.</p>';
      } else {
        tokensEl.innerHTML = `
          <div class="flex items-center text-xs text-gray-500 px-2 pb-1 border-b border-border/50 font-medium">
            <span class="w-20">Token</span>
            <span class="w-16 text-right">Chain</span>
            <span class="flex-1 text-right">Balance</span>
            <span class="w-24 text-right">USD Value</span>
          </div>` +
          tokens.map(t => {
            const pctOfTotal = data.totalUsd > 0 ? ((t.usdValue / data.totalUsd) * 100).toFixed(1) : '0';
            const barWidth = Math.min(100, Math.max(2, parseFloat(pctOfTotal)));
            return `
            <div class="flex items-center text-sm px-2 py-1.5 hover:bg-bg/50 rounded transition">
              <span class="w-20 font-medium text-white">${esc(t.symbol)}</span>
              <span class="w-16 text-right text-xs text-gray-500">${chainName(t.chain)}</span>
              <span class="flex-1 text-right text-gray-400">${formatBalance(t.balance)}</span>
              <span class="w-24 text-right">
                <span class="text-gray-300">$${t.usdValue.toFixed(2)}</span>
                <div class="w-full bg-border rounded-full h-1 mt-1"><div class="bg-accent h-1 rounded-full" style="width:${barWidth}%"></div></div>
              </span>
            </div>`;
          }).join('');
      }
    }
  } catch (e) {
    if (tokensEl) tokensEl.innerHTML = `<p class="text-red text-sm">${esc(e.message)}</p>`;
  }
}

// ─── Signal Renderer ──────────────────────────────────────
function renderSmartMoneyAddresses(signal) {
  const sm = signal.sources?.smartMoney;
  if (!sm || !sm.details?.buyers || sm.details.buyers.length === 0) return '';
  const buyers = sm.details.buyers;
  const volume = sm.details?.totalBuyUsd;
  const volumeStr = volume ? `$${Number(volume).toLocaleString(undefined, {maximumFractionDigits: 0})}` : '';
  const label = currentLang === 'zh' ? '触发地址' : 'Trigger Wallets';

  return `<div class="mb-1.5 p-2 rounded bg-card border border-border/50">
    <div class="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
      <span class="text-accent">&#x1F433;</span>
      <span class="font-medium">${label}</span>
      <span class="text-gray-600">(${buyers.length})</span>
      ${volumeStr ? `<span class="ml-auto text-green font-medium">${currentLang === 'zh' ? '总买入' : 'Total'} ${volumeStr}</span>` : ''}
    </div>
    <div class="space-y-1">
    ${buyers.slice(0, 5).map(b => {
      // Support both old format (string) and new format (object with address/amount/tag)
      const addr = typeof b === 'string' ? b : b.address;
      const amt = typeof b === 'object' && b.amount ? b.amount : 0;
      const tag = typeof b === 'object' && b.tag ? b.tag : '';
      const short = addr && addr.length > 20 ? addr.slice(0, 6) + '...' + addr.slice(-4) : (addr || '?');
      const amtStr = amt > 0 ? `$${Number(amt).toLocaleString(undefined, {maximumFractionDigits: 0})}` : '';
      return `<div class="flex items-center justify-between text-xs" title="${esc(addr)}">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0"></span>
          <span class="font-mono text-gray-400 truncate">${short}</span>
          ${tag ? `<span class="text-sm text-accent/70 flex-shrink-0">${esc(tag)}</span>` : ''}
        </div>
        ${amtStr ? `<span class="text-green flex-shrink-0 ml-2">${amtStr}</span>` : ''}
      </div>`;
    }).join('')}
    </div>
    ${buyers.length > 5 ? `<div class="text-sm text-gray-600 mt-1">+${buyers.length - 5} more</div>` : ''}
  </div>`;
}

function renderSignals() {
  const container = document.getElementById('signals-list');
  const countEl = document.getElementById('signal-count');
  if (countEl) countEl.textContent = `${signals.length} ${t('signals').toLowerCase()}`;

  if (!container) return;

  if (signals.length === 0) {
    container.innerHTML = `<p class="text-gray-600 text-sm">${t('noSignals')}</p>`;
    return;
  }

  container.innerHTML = signals.slice(0, 30).map((s, idx) => {
    const sources = Object.entries(s.sources || {}).map(([k, v]) => {
      const icons = { smartMoney: 'SM', newToken: 'NT', priceAnomaly: 'PA' };
      const color = v.score >= 70 ? 'text-green' : v.score >= 50 ? 'text-yellow' : 'text-gray-400';
      return `<span class="text-xs px-1.5 py-0.5 rounded bg-bg ${color}">${icons[k] || k}:${v.score}</span>`;
    }).join(' ');

    const borderColor = s.action === 'BUY' ? 'border-green' : s.action === 'SKIP' ? 'border-yellow' : 'border-red';
    const actionColor = s.action === 'BUY' ? 'text-green' : s.action === 'SKIP' ? 'text-yellow' : 'text-red';
    const actionBgColor = s.action === 'BUY' ? 'bg-green/15' : s.action === 'SKIP' ? 'bg-yellow/15' : 'bg-red/15';
    const actionLabel = s.action === 'BUY' ? t('buy') : s.action === 'SKIP' ? t('skip') : t('blacklistAction');
    const safetyColor = s.safetyScore >= 70 ? 'text-green' : s.safetyScore >= 40 ? 'text-yellow' : 'text-red';

    // Safety gate dots
    let safetyDots = '';
    if (s.safetyScore !== undefined && s.safetyScore !== null) {
      let dotColors;
      if (s.safetyScore >= 70) dotColors = ['bg-green', 'bg-green', 'bg-green', 'bg-green'];
      else if (s.safetyScore >= 40) dotColors = ['bg-green', 'bg-green', 'bg-yellow', 'bg-yellow'];
      else dotColors = ['bg-red', 'bg-red', 'bg-yellow', 'bg-gray-600'];
      safetyDots = `<div class="flex gap-0.5 mt-1">${dotColors.map(c => `<div class="w-5 h-1 rounded-full ${c}"></div>`).join('')}</div>`;
    }

    // Expandable details
    const detailId = `sig-detail-${idx}`;
    const gateLabels = ['Contract', 'Market', 'DApp', 'TxSim'];
    const gateLabelsCn = ['合约安全', '市场健康', 'DApp', '交易模拟'];
    const gateScores = s.safetyScore != null ? (
      s.safetyScore >= 70 ? [35, 30, 15, 20] :
      s.safetyScore >= 40 ? [20, 18, 15, 12] :
      [0, 0, 15, 0]
    ) : [];
    const gateMax = [35, 30, 15, 20];

    const sourceDetails = Object.entries(s.sources || {}).map(([k, v]) => {
      const names = { smartMoney: 'Smart Money', newToken: 'New Token', priceAnomaly: 'Price Anomaly' };
      const namesCn = { smartMoney: '聪明钱', newToken: '新币', priceAnomaly: '价格异常' };
      const name = currentLang === 'zh' ? (namesCn[k] || k) : (names[k] || k);
      const d = v.details || {};
      let meta = '';
      if (k === 'smartMoney') meta = `${d.buyerCount || 0} ${currentLang === 'zh' ? '地址' : 'wallets'}, $${Number(d.totalBuyUsd || 0).toLocaleString(undefined, {maximumFractionDigits:0})}`;
      if (k === 'newToken') meta = `bundler: ${((d.bundlerRatio || 0) * 100).toFixed(0)}%, bonding: ${((d.bondingCurveProgress || 0) * 100).toFixed(0)}%`;
      if (k === 'priceAnomaly') meta = `vol: ${(d.volumeMultiplier || 0).toFixed(1)}x, ${d.priceBreakout ? '↑ breakout' : ''}`;
      return `<div class="flex justify-between text-xs"><span class="text-gray-300">${name}</span><span class="text-gray-500">${v.score}/100 — ${meta}</span></div>`;
    }).join('');

    const gatesHtml = gateScores.length > 0 ? gateScores.map((gs, i) => {
      const label = currentLang === 'zh' ? gateLabelsCn[i] : gateLabels[i];
      const color = gs >= gateMax[i] * 0.8 ? 'text-green' : gs > 0 ? 'text-yellow' : 'text-red';
      const icon = gs >= gateMax[i] * 0.8 ? '✓' : gs > 0 ? '⚠' : '✗';
      return `<div class="flex justify-between text-xs"><span class="text-gray-400">${icon} ${label}</span><span class="${color}">${gs}/${gateMax[i]}</span></div>`;
    }).join('') : '';

    const tokenAddr = s.token?.address || '';
    const shortAddr = tokenAddr.length > 20 ? tokenAddr.slice(0, 10) + '...' + tokenAddr.slice(-6) : tokenAddr;

    return `
      <div class="signal-card bg-bg rounded-lg border border-border border-l-[3px] ${borderColor}">
        <div class="p-3 cursor-pointer" onclick="document.getElementById('${detailId}').classList.toggle('hidden')">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-white">${esc(s.token?.symbol || '?')} <span class="text-xs text-gray-500">${chainName(s.token?.chain)}</span></span>
            <div class="flex items-center gap-2">
              <span class="text-xs px-1.5 py-0.5 rounded font-bold ${actionColor} ${actionBgColor}">${actionLabel}</span>
              <span class="text-xs text-gray-600">▼</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mb-1.5">${sources}</div>
          <div class="flex justify-between text-xs text-gray-500">
            <span>Composite: <span class="text-gray-300">${s.compositeScore}</span>/100</span>
            <span>Safety: <span class="${safetyColor}">${s.safetyScore}</span>/100</span>
            <span>${timeAgo(s.timestamp)}</span>
          </div>
          ${safetyDots}
        </div>
        <div id="${detailId}" class="hidden border-t border-border/50 p-3 space-y-2 bg-card/50">
          ${renderSmartMoneyAddresses(s)}
          <div>
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">${currentLang === 'zh' ? '信号来源' : 'Signal Sources'}</div>
            ${sourceDetails}
          </div>
          ${gatesHtml ? `<div>
            <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">${currentLang === 'zh' ? '安全检查' : 'Safety Gates'}</div>
            ${gatesHtml}
          </div>` : ''}
          <div class="text-xs text-gray-600 font-mono" title="${esc(tokenAddr)}">${currentLang === 'zh' ? '合约' : 'Contract'}: ${shortAddr}</div>
          ${s.signalId ? `<div class="text-xs text-gray-600">ID: ${esc(s.signalId)}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Position Renderer ────────────────────────────────────
function renderPositions() {
  const activeEl = document.getElementById('positions-active');
  const closedEl = document.getElementById('positions-closed');
  const aggSection = document.getElementById('aggregate-section');

  // Show aggregate button if there are positions
  if (aggSection) {
    if (activePositions.length > 0 || closedPositions.length > 0) {
      aggSection.classList.remove('hidden');
    } else {
      aggSection.classList.add('hidden');
    }
  }

  // Active positions
  if (activeEl) {
    if (activePositions.length === 0) {
      activeEl.innerHTML = `<p class="text-gray-600 text-sm">${t('noPositions')}</p>`;
    } else {
      activeEl.innerHTML = activePositions.map((p, idx) => {
        const pnlPct = ((p.unrealizedPnl || 0) * 100).toFixed(1);
        const pnlColor = p.unrealizedPnl >= 0 ? 'text-green' : 'text-red';
        const statusBadge = p.status === 'TRAILING'
          ? `<span class="text-xs px-1.5 py-0.5 bg-green/20 text-green rounded ml-1">${t('trailing')}</span>`
          : `<span class="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded ml-1">${t('monitor')}</span>`;

        const pnlVal = parseFloat(pnlPct);
        const barPct = Math.min(100, Math.abs(pnlVal));
        const barColor = pnlVal >= 0 ? 'from-green/50 to-green' : 'from-red/50 to-red';
        const elapsed = p.entryTime ? timeAgo(p.entryTime) : '';

        const matchedSignal = signals.find(s =>
          s.token?.address === p.token?.address && s.token?.chain === p.token?.chain && s.action === 'BUY'
        );

        const posDetailId = `pos-detail-${idx}`;
        const sourceNames = { smartMoney: currentLang === 'zh' ? '聪明钱' : 'Smart Money', newToken: currentLang === 'zh' ? '新币' : 'New Token', priceAnomaly: currentLang === 'zh' ? '价格异常' : 'Price Anomaly' };
        const sourceName = sourceNames[p.source] || p.source || '?';
        const tokenAddr = p.token?.address || '';
        const shortAddr = tokenAddr.length > 20 ? tokenAddr.slice(0, 10) + '...' + tokenAddr.slice(-6) : tokenAddr;
        const highPct = p.highestPrice && p.entryPrice ? (((p.highestPrice - p.entryPrice) / p.entryPrice) * 100).toFixed(1) : '0.0';

        return `
          <div class="bg-bg rounded-lg border border-border">
            <div class="px-3 py-2.5 cursor-pointer" onclick="document.getElementById('${posDetailId}').classList.toggle('hidden')">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center">
                  <span class="font-medium text-white">${esc(p.token?.symbol)}</span>
                  <span class="text-xs text-gray-500 ml-2">${esc(p.wallet)}</span>
                  ${statusBadge}
                </div>
                <div class="flex items-center gap-2">
                  <span class="${pnlColor} font-bold text-sm">${pnlVal > 0 ? '+' : ''}${pnlPct}%</span>
                  <span class="text-xs text-gray-600">▼</span>
                </div>
              </div>
              <div class="w-full bg-border rounded-full h-1 mb-1.5">
                <div class="h-1 rounded-full bg-gradient-to-r ${barColor}" style="width:${barPct}%"></div>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>$${p.entryAmount} entry</span>
                <span>${elapsed}</span>
                <button onclick="event.stopPropagation();sellPosition('${p.positionId}')" class="px-2 py-1 bg-red/20 text-red rounded hover:bg-red/30 transition">${t('sell')}</button>
              </div>
            </div>
            <div id="${posDetailId}" class="hidden border-t border-border/50 px-3 py-2 space-y-1.5 bg-card/50">
              ${matchedSignal ? renderSmartMoneyAddresses(matchedSignal) : ''}
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '信号来源' : 'Source'}</span><span class="text-accent">${sourceName}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '信号评分' : 'Signal Score'}</span><span class="text-gray-300">${p.signalScore || '—'}/100</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '安全评分' : 'Safety Score'}</span><span class="text-gray-300">${p.safetyScore || '—'}/100</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '入场价格' : 'Entry Price'}</span><span class="text-gray-300">$${p.entryPrice ? Number(p.entryPrice).toPrecision(4) : '—'}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '当前价格' : 'Current Price'}</span><span class="text-gray-300">$${p.currentPrice ? Number(p.currentPrice).toPrecision(4) : '—'}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '最高涨幅' : 'Peak'}</span><span class="text-green">+${highPct}%</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '止盈触发' : 'TP Trigger'}</span><span class="text-gray-300">+${((p.takeProfit?.trigger || 0) * 100).toFixed(0)}%</span></div>
                <div class="flex justify-between"><span class="text-gray-500">${currentLang === 'zh' ? '止损' : 'Stop Loss'}</span><span class="text-gray-300">${((p.stopLoss || 0) * 100).toFixed(0)}%</span></div>
              </div>
              <div class="text-xs text-gray-600 font-mono" title="${esc(tokenAddr)}">${currentLang === 'zh' ? '合约' : 'Contract'}: ${shortAddr}</div>
              ${p.entryTxHash ? `<div class="text-xs text-gray-600 font-mono truncate">TX: ${esc(p.entryTxHash)}</div>` : ''}
            </div>
          </div>`;
      }).join('');
    }
  }

  // PnL summary
  const realizedSum = closedPositions.reduce((s, p) => s + (p.realizedPnl || 0), 0);
  const unrealizedSum = activePositions.reduce((s, p) => s + (p.unrealizedPnl || 0) * (p.entryAmount || 0), 0);
  const rEl = document.getElementById('realized-pnl');
  if (rEl) {
    rEl.textContent = `${realizedSum >= 0 ? '+' : ''}$${realizedSum.toFixed(2)}`;
    rEl.className = realizedSum >= 0 ? 'text-green font-medium' : 'text-red font-medium';
  }
  const uEl = document.getElementById('unrealized-pnl');
  if (uEl) {
    uEl.textContent = `${unrealizedSum >= 0 ? '+' : ''}$${unrealizedSum.toFixed(2)}`;
    uEl.className = unrealizedSum >= 0 ? 'text-green' : 'text-red';
  }

  // Closed trades
  if (closedEl) {
    if (closedPositions.length === 0) {
      closedEl.innerHTML = `<p class="text-gray-600 text-sm">${t('noClosed')}</p>`;
    } else {
      closedEl.innerHTML = closedPositions.slice(0, 30).map(p => {
        const pnlPct = p.entryPrice > 0 ? (((p.exitPrice - p.entryPrice) / p.entryPrice) * 100).toFixed(1) : '0.0';
        const pnlColor = parseFloat(pnlPct) >= 0 ? 'text-green' : 'text-red';
        const pnlUsd = (p.realizedPnl || 0).toFixed(2);
        const reasonMap = { TRAILING_TP: t('reasonTP'), STOP_LOSS: t('reasonSL'), TIMEOUT: t('reasonTMO'), MANUAL: t('reasonMAN') };
        const reasonColor = { TRAILING_TP: 'text-green', STOP_LOSS: 'text-red', TIMEOUT: 'text-yellow', MANUAL: 'text-gray-400' };
        return `
          <div class="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
            <span class="text-gray-300 w-16 font-medium">${esc(p.token?.symbol)}</span>
            <span class="text-gray-500 w-20">${esc(p.wallet)}</span>
            <span class="${pnlColor} w-16 text-right font-medium">${parseFloat(pnlPct) > 0 ? '+' : ''}${pnlPct}%</span>
            <span class="${pnlColor} w-14 text-right">${parseFloat(pnlUsd) >= 0 ? '+' : ''}$${pnlUsd}</span>
            <span class="${reasonColor[p.exitReason] || 'text-gray-500'} w-10 text-right">${reasonMap[p.exitReason] || p.exitReason}</span>
            <span class="text-gray-600 w-14 text-right">${timeAgo(p.exitTime)}</span>
          </div>`;
      }).join('');
    }
  }

  updateKPIs();
}

async function sellPosition(id) {
  if (!confirm('Sell this position now?')) return;
  try {
    const res = await fetch(`/api/sell/${id}`, { method: 'POST' });
    if (res.ok) {
      toast('Position sold', 'success');
    } else {
      const data = await res.json();
      toast(data.error || 'Sell failed', 'error');
    }
  } catch (e) {
    toast(`Sell error: ${e.message}`, 'error');
  }
}

// ─── Strategy Controls ────────────────────────────────────
function startStrategy() {
  const modal = document.getElementById('config-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    applyLang();
  }
}

function closeModal() {
  const modal = document.getElementById('config-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function confirmStart() {
  const chains = [];
  if (document.getElementById('chain-501')?.checked) chains.push('501');
  if (document.getElementById('chain-8453')?.checked) chains.push('8453');
  if (document.getElementById('chain-1')?.checked) chains.push('1');

  if (chains.length === 0) {
    toast('Select at least one chain', 'warning');
    return;
  }

  const positionSize = parseFloat(document.getElementById('cfg-position')?.value || '5');
  if (positionSize > 50) {
    toast('Position size cannot exceed 50 USDT (hard limit)', 'warning');
    return;
  }

  closeModal();
  setLoading('btn-start', true);

  const config = {
    chains,
    positionSize,
    scanIntervalSec: parseInt(document.getElementById('cfg-interval')?.value || '30'),
    tpTrigger: parseInt(document.getElementById('cfg-tp')?.value || '50') / 100,
    tpTrailing: 0.1,
    slThreshold: -parseInt(document.getElementById('cfg-sl')?.value || '20') / 100,
  };

  try {
    const res = await fetch('/api/strategy/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (res.ok) {
      scanning = true;
      updateScanUI(true);
      startProgressAnimation();
      toast('Alpha Hunt started', 'success');
    } else {
      toast(data.error || 'Failed to start', 'error');
    }
  } catch (e) {
    toast(`Start failed: ${e.message}`, 'error');
  } finally {
    setLoading('btn-start', false);
  }
}

async function stopStrategy() {
  setLoading('btn-stop', true);
  try {
    await fetch('/api/strategy/stop', { method: 'POST' });
    scanning = false;
    updateScanUI(false);
    stopProgressAnimation();
    toast('Alpha Hunt stopped', 'info');
  } catch (e) {
    toast(`Stop failed: ${e.message}`, 'error');
  } finally {
    setLoading('btn-stop', false);
  }
}

function updateScanUI(isScanning) {
  scanning = isScanning;
  const indicator = document.getElementById('scan-indicator');
  const status = document.getElementById('scan-status');
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');

  if (isScanning) {
    if (indicator) indicator.className = 'w-3 h-3 rounded-full bg-green inline-block pulse';
    if (status) {
      status.textContent = 'Scanning...';
      status.className = 'text-sm text-green';
    }
    if (btnStart) btnStart.classList.add('hidden');
    if (btnStop) btnStop.classList.remove('hidden');
  } else {
    if (indicator) indicator.className = 'w-3 h-3 rounded-full bg-gray-600 inline-block';
    if (status) {
      status.textContent = 'Idle';
      status.className = 'text-sm text-gray-500';
    }
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnStop) btnStop.classList.add('hidden');
  }
}

function startProgressAnimation() {
  stopProgressAnimation();
  let width = 0;
  progressInterval = setInterval(() => {
    width += 2;
    if (width > 100) width = 0;
    const bar = document.getElementById('scan-progress-bar');
    if (bar) bar.style.width = width + '%';
  }, 200);
}

function stopProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  const bar = document.getElementById('scan-progress-bar');
  if (bar) bar.style.width = '0%';
}

// ─── Report Modal ─────────────────────────────────────────
async function showReport() {
  const modal = document.getElementById('report-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    applyLang();
  }
  const content = document.getElementById('report-content');
  if (content) content.innerHTML = '<p class="text-gray-500">Loading...</p>';

  try {
    const res = await fetch('/api/report');
    const r = await res.json();
    if (content) {
      content.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('signalsScanned')}</div>
            <div class="text-lg font-bold text-white">${r.signalsScanned || 0}</div>
          </div>
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('tradesExecuted')}</div>
            <div class="text-lg font-bold text-white">${r.tradesExecuted || 0}</div>
          </div>
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('realizedPnl')}</div>
            <div class="text-lg font-bold ${(r.realizedPnl || 0) >= 0 ? 'text-green' : 'text-red'}">$${(r.realizedPnl || 0).toFixed(2)}</div>
          </div>
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('unrealizedPnl')}</div>
            <div class="text-lg font-bold ${(r.unrealizedPnl || 0) >= 0 ? 'text-green' : 'text-red'}">$${(r.unrealizedPnl || 0).toFixed(2)}</div>
          </div>
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('x402Income')}</div>
            <div class="text-lg font-bold text-green">${(r.x402Income || x402IncomeTotal).toFixed(1)} USDG</div>
          </div>
          <div class="bg-bg rounded-lg p-3 border border-border">
            <div class="text-xs text-gray-500">${t('x402Spend')}</div>
            <div class="text-lg font-bold text-yellow">${(r.x402Spend || x402SpendTotal).toFixed(1)} USDG</div>
          </div>
        </div>
        <div class="text-xs text-gray-600 mt-3 text-center">Runtime: ${r.runtime || '\u2014'} | Passed Safety: ${r.passedSafety || 0}</div>
      `;
    }
  } catch {
    if (content) content.innerHTML = '<p class="text-red text-sm">Failed to load report</p>';
  }
}

function closeReport() {
  const modal = document.getElementById('report-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ─── x402 Controls ────────────────────────────────────────
function updateSellUI(isSelling) {
  selling = isSelling;
  const indicator = document.getElementById('sell-indicator');
  const status = document.getElementById('sell-status');
  const btn = document.getElementById('btn-sell');
  if (isSelling) {
    if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-green inline-block pulse';
    if (status) {
      status.textContent = 'LIVE on :8402 (0.1 USDG/signal)';
      status.className = 'text-sm text-green';
    }
    if (btn) btn.textContent = t('stopSelling');
  } else {
    if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-gray-600 inline-block';
    if (status) {
      status.textContent = t('offline');
      status.className = 'text-sm text-gray-500';
    }
    if (btn) btn.textContent = t('startSelling');
  }
}

async function toggleSell() {
  setLoading('btn-sell', true);
  try {
    if (selling) {
      await fetch('/api/x402/sell/stop', { method: 'POST' });
      selling = false;
      toast('Signal server stopped', 'info');
    } else {
      const res = await fetch('/api/x402/sell/start', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        selling = true;
        toast('Signal server started on :8402', 'success');
      } else {
        toast(data.error || 'Failed to start', 'error');
      }
    }
  } catch (e) {
    toast(`Toggle sell error: ${e.message}`, 'error');
  } finally {
    setLoading('btn-sell', false);
    updateSellUI(selling);
  }
}

async function subscribe() {
  const urlEl = document.getElementById('sub-url');
  const url = urlEl ? urlEl.value.trim() : '';
  if (!url) {
    toast('Enter a signal source URL', 'warning');
    return;
  }
  const resultEl = document.getElementById('sub-result');
  if (resultEl) resultEl.textContent = '';
  setLoading('btn-subscribe', true);

  try {
    const res = await fetch('/api/x402/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (data.traded) {
      if (resultEl) {
        resultEl.textContent = `Signal received and traded: ${data.signal?.token?.symbol || 'token'}`;
        resultEl.className = 'mt-2 text-xs text-green';
      }
      toast(`Subscribed & traded: ${data.signal?.token?.symbol}`, 'success');
    } else if (data.signal) {
      if (resultEl) {
        resultEl.textContent = `Signal received but not traded: ${data.error || 'safety check failed'}`;
        resultEl.className = 'mt-2 text-xs text-yellow';
      }
      toast('Signal received, safety check blocked trade', 'warning');
    } else {
      if (resultEl) {
        resultEl.textContent = `Failed: ${data.error || 'unknown error'}`;
        resultEl.className = 'mt-2 text-xs text-red';
      }
      toast(data.error || 'Subscription failed', 'error');
    }
  } catch (e) {
    if (resultEl) {
      resultEl.textContent = `Error: ${e.message}`;
      resultEl.className = 'mt-2 text-xs text-red';
    }
    toast(`Subscribe error: ${e.message}`, 'error');
  } finally {
    setLoading('btn-subscribe', false);
  }
}

// ─── Security Tab ─────────────────────────────────────────
async function runSecurityScan() {
  setLoading('btn-scan', true);
  const tokensEl = document.getElementById('security-tokens');
  if (tokensEl) tokensEl.innerHTML = '<p class="text-gray-500 text-sm pulse">Scanning your holdings...</p>';

  try {
    const res = await fetch('/api/security/scan');
    const data = await res.json();

    if (data.error) {
      if (tokensEl) tokensEl.innerHTML = `<p class="text-red text-sm">${esc(data.error)}</p>`;
      toast('Security scan failed', 'error');
      return;
    }

    // Update score
    const scoreEl = document.getElementById('security-score');
    const score = data.overallScore || 0;
    if (scoreEl) {
      scoreEl.textContent = score;
      if (score >= 80) scoreEl.className = 'text-3xl font-bold text-green';
      else if (score >= 50) scoreEl.className = 'text-3xl font-bold text-yellow';
      else scoreEl.className = 'text-3xl font-bold text-red';
    }

    // Count risks
    const tokens = data.tokens || [];
    const dangerCount = tokens.filter(t => t.risk === 'danger').length;
    const warningCount = tokens.filter(t => t.risk === 'warning').length;
    const safeCount = tokens.filter(t => t.risk === 'safe').length;

    const dangerEl = document.getElementById('risk-danger-count');
    const warnEl = document.getElementById('risk-warning-count');
    const safeEl = document.getElementById('risk-safe-count');
    if (dangerEl) dangerEl.textContent = dangerCount;
    if (warnEl) warnEl.textContent = warningCount;
    if (safeEl) safeEl.textContent = safeCount;

    // Render tokens
    if (tokensEl) {
      if (tokens.length === 0) {
        tokensEl.innerHTML = '<p class="text-gray-600 text-sm">No tokens found in wallet.</p>';
      } else {
        tokensEl.innerHTML = tokens.map(t => {
          const riskColors = { danger: 'border-red/50 bg-red/5', warning: 'border-yellow/50 bg-yellow/5', safe: 'border-border bg-bg' };
          const riskBadge = { danger: '<span class="text-xs px-1.5 py-0.5 bg-red/20 text-red rounded">HIGH RISK</span>', warning: '<span class="text-xs px-1.5 py-0.5 bg-yellow/20 text-yellow rounded">WARNING</span>', safe: '<span class="text-xs px-1.5 py-0.5 bg-green/20 text-green rounded">SAFE</span>' };
          const scoreColor = t.score >= 80 ? 'text-green' : t.score >= 50 ? 'text-yellow' : 'text-red';

          // Render per-check items if available
          let checksHtml = '';
          if (t.checks && t.checks.length > 0) {
            checksHtml = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">` +
              t.checks.map(c => {
                const icon = c.passed ? '<span class="text-green">✓</span>' : (c.danger ? '<span class="text-red">✗</span>' : '<span class="text-yellow">⚠</span>');
                const color = c.passed ? 'text-gray-400' : (c.danger ? 'text-red' : 'text-yellow');
                return `<div class="flex items-center gap-1"><span>${icon}</span><span class="${color}">${esc(c.label)}</span></div>`;
              }).join('') +
              `</div>`;
          }

          // Render extra metadata row
          let metaHtml = '';
          const metaParts = [];
          if (t.buyTax != null) metaParts.push(`Buy Tax: ${t.buyTax}%`);
          if (t.sellTax != null) metaParts.push(`Sell Tax: ${t.sellTax}%`);
          if (t.holderCount != null) metaParts.push(`Holders: ${Number(t.holderCount).toLocaleString()}`);
          if (t.lpLocked != null) metaParts.push(t.lpLocked ? '<span class="text-green">LP Locked</span>' : '<span class="text-yellow">LP Unlocked</span>');
          if (t.contractVerified != null) metaParts.push(t.contractVerified ? '<span class="text-green">Verified</span>' : '<span class="text-yellow">Unverified</span>');
          if (metaParts.length > 0) {
            metaHtml = `<div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">${metaParts.join('<span class="text-border">|</span>')}</div>`;
          }

          return `
            <div class="rounded-lg p-3 border ${riskColors[t.risk] || riskColors.safe}">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-white">${esc(t.symbol)}</span>
                  <span class="text-xs text-gray-500">(${chainName(t.chain)})</span>
                  ${riskBadge[t.risk] || ''}
                </div>
                <div class="flex items-center gap-3">
                  <span class="${scoreColor} font-medium text-sm">${t.score}/100</span>
                  <span class="text-xs text-gray-500">$${parseFloat(t.usdValue || 0).toFixed(2)}</span>
                </div>
              </div>
              ${checksHtml}
              ${metaHtml}
              ${t.address && t.address !== 'native' ? `<div class="text-xs text-gray-600 mt-2">${esc(t.address.slice(0, 10))}...${esc(t.address.slice(-6))}</div>` : ''}
            </div>`;
        }).join('');
      }
    }

    toast(`Security scan complete: score ${score}/100`, score >= 70 ? 'success' : score >= 40 ? 'warning' : 'error');
  } catch (e) {
    if (tokensEl) tokensEl.innerHTML = `<p class="text-red text-sm">Scan error: ${esc(e.message)}</p>`;
    toast('Security scan error', 'error');
  } finally {
    setLoading('btn-scan', false);
  }
}

async function manualTokenScan() {
  const chain = document.getElementById('scan-chain')?.value;
  const address = document.getElementById('scan-address')?.value.trim();
  if (!address) { toast('Enter a token address', 'warning'); return; }

  setLoading('btn-manual-scan', true);
  const resultEl = document.getElementById('manual-scan-result');
  if (resultEl) resultEl.innerHTML = '<span class="text-gray-500 pulse">Scanning...</span>';

  try {
    const res = await fetch('/api/security/token-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, address }),
    });
    const data = await res.json();

    if (data.error) {
      if (resultEl) resultEl.innerHTML = `<span class="text-red">${esc(data.error)}</span>`;
    } else {
      const d = data.riskList || data;
      const isZh = currentLang === 'zh';
      const checks = [
        { key: 'isHoneypot',        alt: 'honeypot',        label: isZh ? '蜜罐检测' : 'Honeypot',              danger: true },
        { key: 'canMint',           alt: 'mintBackdoor',    label: isZh ? '增发后门' : 'Mint Backdoor',          danger: true },
        { key: 'highTax',           alt: null,              label: isZh ? '高额转账税' : 'High Transfer Tax',    danger: true },
        { key: 'hasHiddenOwner',    alt: null,              label: isZh ? '隐藏所有者' : 'Hidden Owner',         danger: true },
        { key: 'isProxy',           alt: null,              label: isZh ? '可升级代理' : 'Upgradeable Proxy',    danger: false },
        { key: 'ownerNotRenounced', alt: null,              label: isZh ? '未放弃所有权' : 'Owner Not Renounced', danger: false },
        { key: 'canPause',          alt: null,              label: isZh ? '可暂停转账' : 'Can Pause Transfers',  danger: false },
        { key: 'canBlacklist',      alt: null,              label: isZh ? '黑名单功能' : 'Blacklist Function',   danger: false },
        { key: 'isAntiWhale',       alt: null,              label: isZh ? '反鲸鱼机制' : 'Anti-Whale',           danger: false },
        { key: 'externalCall',      alt: null,              label: isZh ? '外部调用风险' : 'External Call Risk', danger: false },
      ];

      let dangerCount = 0;
      let warnCount = 0;
      const rows = checks.map(c => {
        const flagged = d?.[c.key] === true || d?.[c.key] === '1' || d?.[c.key] === 'true'
          || (c.alt && (d?.[c.alt] === true || d?.[c.alt] === '1' || d?.[c.alt] === 'true'))
          || data?.[c.key] === true || data?.[c.key] === '1';
        if (flagged && c.danger) dangerCount++;
        if (flagged && !c.danger) warnCount++;
        const icon = flagged ? (c.danger ? '&#x2716;' : '&#x26A0;') : '&#x2714;';
        const bg = flagged ? (c.danger ? 'bg-red/10 border-red/30 text-red' : 'bg-yellow/10 border-yellow/30 text-yellow') : 'bg-green/10 border-green/30 text-green';
        return `<div class="flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${bg}"><span>${icon}</span><span>${c.label}</span></div>`;
      }).join('');

      // Extra metadata
      const meta = [];
      const buyTax = data.buyTax ?? d?.buyTax;
      const sellTax = data.sellTax ?? d?.sellTax;
      if (buyTax != null) meta.push(`<span class="text-gray-500">${isZh ? '买入税' : 'Buy Tax'}:</span> <span class="${parseFloat(buyTax) > 5 ? 'text-yellow' : 'text-gray-300'}">${buyTax}%</span>`);
      if (sellTax != null) meta.push(`<span class="text-gray-500">${isZh ? '卖出税' : 'Sell Tax'}:</span> <span class="${parseFloat(sellTax) > 5 ? 'text-yellow' : 'text-gray-300'}">${sellTax}%</span>`);
      const holderCount = data.holderCount ?? d?.holderCount;
      if (holderCount != null) meta.push(`<span class="text-gray-500">${isZh ? '持有人数' : 'Holders'}:</span> <span class="text-gray-300">${Number(holderCount).toLocaleString()}</span>`);
      const lpLocked = data.lpLocked ?? d?.lpLocked;
      if (lpLocked != null) meta.push(`<span class="text-gray-500">LP ${isZh ? '锁定' : 'Locked'}:</span> ${lpLocked ? '<span class="text-green">&#x2714;</span>' : '<span class="text-red">&#x2716;</span>'}`);
      const verified = data.contractVerified ?? d?.contractVerified;
      if (verified != null) meta.push(`<span class="text-gray-500">${isZh ? '合约已验证' : 'Verified'}:</span> ${verified ? '<span class="text-green">&#x2714;</span>' : '<span class="text-red">&#x2716;</span>'}`);

      // Overall verdict
      let score = 100 - dangerCount * 40 - warnCount * 15;
      score = Math.max(0, score);
      const color = score >= 80 ? 'text-green' : score >= 50 ? 'text-yellow' : 'text-red';
      const verdict = score >= 80 ? (isZh ? '安全' : 'Safe') : score >= 50 ? (isZh ? '警告' : 'Warning') : (isZh ? '高风险' : 'Danger');

      if (resultEl) {
        resultEl.innerHTML = `
          <div class="bg-bg rounded-lg border border-border p-3 mt-2 max-w-2xl">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-white">${isZh ? '扫描结果' : 'Scan Result'}</span>
              <div class="flex items-center gap-2">
                <span class="${color} text-lg font-bold">${score}</span>
                <span class="${color} text-xs font-medium">${verdict}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-3">${rows}</div>
            ${meta.length > 0 ? `<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs pt-2 border-t border-border/50">${meta.join('')}</div>` : ''}
          </div>`;
        toast(isZh ? `代币扫描: ${verdict} (${score}/100)` : `Token scan: ${verdict} (${score}/100)`, score >= 80 ? 'success' : 'error');
      }
    }
  } catch (e) {
    if (resultEl) resultEl.innerHTML = `<span class="text-red">${esc(e.message)}</span>`;
  } finally {
    setLoading('btn-manual-scan', false);
  }
}

// ─── Tab Switching ────────────────────────────────────────
let securityTabLoaded = false;

function switchTab(tab) {
  const tabs = ['alpha', 'security'];
  for (const t of tabs) {
    const panel = document.getElementById(`panel-${t}`);
    const tabBtn = document.getElementById(`tab-${t}`);
    if (!panel || !tabBtn) continue;
    if (t === tab) {
      panel.classList.remove('hidden');
      if (t === 'alpha') panel.classList.add('grid');
      tabBtn.className = 'px-4 py-2.5 text-sm font-medium text-accent border-b-2 border-accent transition';
    } else {
      panel.classList.add('hidden');
      if (t === 'alpha') panel.classList.remove('grid');
      tabBtn.className = 'px-4 py-2.5 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-300 transition';
    }
  }

  // Show/hide pipeline-bar (only on alpha tab)
  const pipelineBar = document.getElementById('pipeline-bar');
  if (pipelineBar) {
    if (tab === 'alpha') pipelineBar.classList.remove('hidden');
    else pipelineBar.classList.add('hidden');
  }

  // Auto-fetch security data on first switch to security tab
  if (tab === 'security' && !securityTabLoaded) {
    securityTabLoaded = true;
    fetchPortfolio();
  }
}

// ─── KPI Updater ──────────────────────────────────────────
function updateKPIs() {
  const totalTrades = closedPositions.length;
  const wins = closedPositions.filter(p => (p.realizedPnl || 0) > 0).length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const realizedPnl = closedPositions.reduce((s, p) => s + (p.realizedPnl || 0), 0);

  const sigEl = document.getElementById('kpi-signals');
  const tradeEl = document.getElementById('kpi-trades');
  const wrEl = document.getElementById('kpi-winrate');
  const pnlEl = document.getElementById('kpi-pnl');

  if (sigEl) sigEl.textContent = totalSignalsScanned;
  if (tradeEl) tradeEl.textContent = totalTrades + activePositions.length;
  if (wrEl) wrEl.textContent = winRate + '%';
  if (pnlEl) {
    pnlEl.textContent = `${realizedPnl >= 0 ? '+' : ''}$${realizedPnl.toFixed(2)}`;
    pnlEl.className = realizedPnl >= 0 ? 'text-2xl font-bold text-green' : 'text-2xl font-bold text-red';
  }
}

// ─── Aggregate Funds ──────────────────────────────────────
async function aggregateFunds() {
  if (!confirm('Aggregate all sub-wallet funds back to main wallet?')) return;
  setLoading('btn-aggregate', true);
  try {
    const res = await fetch('/api/aggregate', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast('Funds aggregated successfully', 'success');
    } else {
      toast(data.error || 'Aggregation failed', 'error');
    }
  } catch (e) {
    toast(`Aggregation error: ${e.message}`, 'error');
  } finally {
    setLoading('btn-aggregate', false);
  }
}

// ─── Data Fetchers ────────────────────────────────────────
async function fetchPositions() {
  try {
    const res = await fetch('/api/positions');
    const data = await res.json();
    activePositions = data.active || [];
    closedPositions = data.closed || [];
    renderPositions();
  } catch { /* silent */ }
}

async function fetchSignals() {
  try {
    const res = await fetch('/api/signals');
    signals = await res.json();
    renderSignals();
  } catch { /* silent */ }
}

// ─── Init ─────────────────────────────────────────────────
async function initDashboard() {
  applyLang();
  connectSSE();
  fetchPortfolio();
  fetchPositions();
  fetchSignals();
  setInterval(fetchPositions, 10000);
  setInterval(fetchSignals, 30000);
  setInterval(fetchPortfolio, 30000);
}

async function checkAuth() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    // Demo mode badge
    if (data.demo) {
      isDemo = true;
      const badge = document.getElementById('demo-badge');
      if (badge) badge.classList.remove('hidden');
    }

    if (data.wallet?.loggedIn) {
      // Already logged in, go straight to dashboard
      const walletEl = document.getElementById('wallet-info');
      if (walletEl) walletEl.textContent = data.wallet.email || 'Logged in';

      showDashboard();

      // Restore scan state
      if (data.scanning) {
        scanning = true;
        updateScanUI(true);
        startProgressAnimation();
      }

      if (data.scanCount) {
        const el = document.getElementById('scan-count');
        if (el) {
          el.textContent = `${data.scanCount} scans`;
          el.classList.remove('hidden');
        }
        totalSignalsScanned = data.scanCount;
      }

      // Restore config into modal form
      if (data.config) {
        const cfg = data.config;
        if (cfg.chains) {
          const c501 = document.getElementById('chain-501');
          const c8453 = document.getElementById('chain-8453');
          const c1 = document.getElementById('chain-1');
          if (c501) c501.checked = cfg.chains.includes('501');
          if (c8453) c8453.checked = cfg.chains.includes('8453');
          if (c1) c1.checked = cfg.chains.includes('1');
        }
        if (cfg.positionSize) {
          const el = document.getElementById('cfg-position');
          if (el) el.value = cfg.positionSize;
        }
        if (cfg.scanIntervalSec) {
          const el = document.getElementById('cfg-interval');
          if (el) el.value = cfg.scanIntervalSec;
        }
        if (cfg.tpTrigger) {
          const el = document.getElementById('cfg-tp');
          if (el) el.value = Math.round(cfg.tpTrigger * 100);
        }
        if (cfg.slThreshold) {
          const el = document.getElementById('cfg-sl');
          if (el) el.value = Math.abs(Math.round(cfg.slThreshold * 100));
        }
      }

      // x402 selling status
      if (data.x402Selling) {
        selling = true;
        updateSellUI(true);
      }
    } else {
      // Not logged in — login overlay stays visible (default state)
      const walletEl = document.getElementById('wallet-info');
      if (walletEl) {
        walletEl.textContent = 'Not logged in';
        walletEl.className = 'text-red';
      }

      // If no login overlay exists, show dashboard directly (backward compat)
      const overlay = document.getElementById('login-overlay');
      if (!overlay) {
        initDashboard();
      }
    }
  } catch {
    toast('Failed to check auth status', 'error');
    // If login overlay doesn't exist, init dashboard anyway
    const overlay = document.getElementById('login-overlay');
    if (!overlay) {
      initDashboard();
    }
  }
}

checkAuth();

// ─── Resizable Columns ───────────────────────────────────
(function initResize() {
  function makeDraggable(handleId, colId, minW, maxW, direction) {
    const handle = document.getElementById(handleId);
    const col = document.getElementById(colId);
    if (!handle || !col) return;

    let dragging = false;
    let startX = 0;
    let startW = 0;

    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startW = col.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      // Left column: drag right = wider. Right column: drag left = wider.
      const newW = Math.min(maxW, Math.max(minW, startW + dx * direction));
      col.style.width = newW + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // Left column: drag handle is on the right side, so dragging right = wider (direction: +1)
  makeDraggable('resize-handle', 'left-col', 200, 500, 1);
  // Right column: drag handle is on the left side, so dragging left = wider (direction: -1)
  makeDraggable('resize-handle-right', 'right-col', 240, 550, -1);
})();
