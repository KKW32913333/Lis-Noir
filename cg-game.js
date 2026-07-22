/* =========================================================
   カードゲーム プロトタイプ ロジック (cg-game.js)
   ========================================================= */

// ---------- 属性 ----------
const ELEMENTS = {
  fire:   { name: '火',  color: '#a8532a', icon: '🔥' },
  water:  { name: '水',  color: '#3f6f8f', icon: '💧' },
  nature: { name: '自然', color: '#5f7a3f', icon: '🌿' },
  light:  { name: '光',  color: '#a9822f', icon: '✨' },
  dark:   { name: '闇',  color: '#5A2D91', icon: '🌙' },
};
// 相性サイクル: 火→自然→闇→光→水→火 (攻撃側が有利なら+2、不利なら-1)
const ELEMENT_ADVANTAGE = { fire: 'nature', nature: 'dark', dark: 'light', light: 'water', water: 'fire' };

const RARITY = {
  normal: { name: 'ノーマル', color: '#8a8c96', glow: 'none' },
  rare:   { name: 'レア',    color: '#3d6a91', glow: '0 0 10px #6f93b855' },
  epic:   { name: 'エピック', color: '#5A2D91', glow: '0 0 14px #C7B6FFaa' },
  legend: { name: 'レジェンド', color: '#B8892E', glow: '0 0 18px #D9B45Bcc' },
};

// ---------- カードマスターデータ ----------
// image: null の間はプレースホルダー（属性色グラデ+絵文字）を表示。
// 後で { image: "card-fire-dragon.png" } のように差し替えれば自動でその画像が使われる。
const CARD_DEFS = {
  fire_dragon:    { name: 'ファイアドラゴン', element: 'fire',   rarity: 'legend', cost: 5, atk: 6, hp: 10, skill: '攻撃時、敵全体に2ダメージ', image: 'card-fire-dragon.png', emoji: '🐉' },
  fire_imp:       { name: 'フレイムインプ',   element: 'fire',   rarity: 'normal', cost: 1, atk: 2, hp: 1,  skill: '', image: 'card-fire-imp.png', emoji: '👹' },
  fire_phoenix:   { name: 'フェニックス',     element: 'fire',   rarity: 'epic',   cost: 4, atk: 4, hp: 5,  skill: '撃破された時、1/2のHPで復活', image: 'card-fire-phoenix.png', emoji: '🐦' },
  water_golem:    { name: 'アクアゴーレム',   element: 'water',  rarity: 'rare',   cost: 3, atk: 3, hp: 6,  skill: '場に出た時、自分のHPを2回復', image: 'card-water-golem.png', emoji: '🌊' },
  water_slime:    { name: 'ブルースライム',   element: 'water',  rarity: 'normal', cost: 1, atk: 1, hp: 2,  skill: '', image: 'card-water-slime.png', emoji: '🔵' },
  water_serpent:  { name: 'シーサーペント',   element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 4,  skill: '攻撃時、相手カード1体を1ターン行動不能', image: 'card-water-serpent.png', emoji: '🐍' },
  nature_treant:  { name: 'エンシェントツリー', element: 'nature', rarity: 'rare',  cost: 3, atk: 2, hp: 8,  skill: '毎ターン開始時、HPを1回復', image: 'card-nature-treant.png', emoji: '🌳' },
  nature_wolf:    { name: 'フォレストウルフ', element: 'nature', rarity: 'normal', cost: 2, atk: 3, hp: 2,  skill: '', image: 'card-nature-wolf.png', emoji: '🐺' },
  nature_panda:   { name: 'ウォーパンダ',     element: 'nature', rarity: 'rare',   cost: 2, atk: 2, hp: 4,  skill: '', image: 'card-nature-panda.png', emoji: '🐼' },
  light_angel:    { name: 'ガーディアンエンジェル', element: 'light', rarity: 'epic', cost: 4, atk: 3, hp: 6, skill: '場に出た時、味方全体のHPを1回復', image: 'card-light-angel.png', emoji: '👼' },
  light_unicorn:  { name: 'ホーリーユニコーン', element: 'light', rarity: 'rare',  cost: 3, atk: 3, hp: 5,  skill: '', image: 'card-light-unicorn.png', emoji: '🦄' },
  light_cleric:   { name: 'クレリック',       element: 'light',  rarity: 'normal', cost: 2, atk: 1, hp: 3,  skill: '', image: 'card-light-cleric.png', emoji: '🕊️' },
  dark_wolf:      { name: 'シャドウウルフ',   element: 'dark',   rarity: 'rare',   cost: 3, atk: 4, hp: 3,  skill: '', image: 'card-dark-wolf.png', emoji: '🐾' },
  dark_reaper:    { name: 'ソウルリーパー',   element: 'dark',   rarity: 'legend', cost: 5, atk: 5, hp: 7,  skill: '撃破時、相手のコストを1消費させる', image: 'card-dark-reaper.png', emoji: '💀' },
  dark_ghost:     { name: 'ワンダリングゴースト', element: 'dark', rarity: 'normal', cost: 1, atk: 1, hp: 1, skill: '', image: 'card-dark-ghost.png', emoji: '👻' },
  rock_giant:     { name: 'ロックジャイアント', element: 'nature', rarity: 'epic', cost: 5, atk: 4, hp: 9,  skill: '', image: 'card-rock-giant.png', emoji: '🗿' },
  storm_bird:     { name: 'サンダーホーク',   element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 3,  skill: '攻撃時、追加で1ダメージ', image: 'card-storm-bird.png', emoji: '🦅' },
  crystal_fox:    { name: 'クリスタルフォックス', element: 'light', rarity: 'legend', cost: 6, atk: 6, hp: 8, skill: '場に出た時、手札を1枚引く', image: 'card-crystal-fox.png', emoji: '🦊' },

  // ---- スペルカード（即時効果・場には残らない） ----
  spell_fireball:   { name: 'ファイアボール',   element: 'fire',  rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 4 }, skill: '敵1体（または敵本体）に4ダメージ', image: 'card-spell-fireball.png', emoji: '☄️' },
  spell_iceshard:   { name: 'アイスシャード',   element: 'water', rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 2 }, skill: '敵1体（または敵本体）に2ダメージ', image: 'card-spell-iceshard.png', emoji: '🧊' },
  spell_healing:    { name: 'ヒーリングライト', element: 'light', rarity: 'normal', cost: 2, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'heal', value: 5 }, skill: '自分のHPを5回復', image: 'card-spell-healing.png', emoji: '💫' },
  spell_mindsurge:  { name: 'マインドサージ',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 2 }, skill: 'カードを2枚引く', image: 'card-spell-mindsurge.png', emoji: '📖' },

  // ---- 装備カード（味方モンスター1体に付与） ----
  equip_ironsword:  { name: 'アイアンソード',     element: 'fire',  rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 0 }, skill: '味方1体の攻撃力+2', image: 'card-equip-ironsword.png', emoji: '🗡️' },
  equip_shield:     { name: 'ガーディアンシールド', element: 'light', rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 0, hp: 4 }, skill: '味方1体のHP+4', image: 'card-equip-shield.png', emoji: '🛡️' },
  equip_dragonmail: { name: 'ドラゴンアーマー',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 3 }, skill: '味方1体の攻撃力+2・HP+3', image: 'card-equip-dragonmail.png', emoji: '🎽' },

  // ---- フィールドカード（場に出ている間、対応属性のモンスター全体（両陣営）に継続効果） ----
  field_inferno:   { name: 'インフェルノフィールド', element: 'fire',  rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none', effect: { boostElement: 'fire', atk: 1 }, skill: '場に出ている間、火属性モンスターの攻撃力+1（両陣営）', image: 'card-field-inferno.png', emoji: '🌋' },
  field_sanctuary: { name: 'ホーリーサンクチュアリ', element: 'light', rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none', effect: { boostElement: 'light', atk: 1 }, skill: '場に出ている間、光属性モンスターの攻撃力+1（両陣営）', image: null, emoji: '⛩️' },
  field_abyss:     { name: 'アビスの深淵',       element: 'dark',  rarity: 'epic', cost: 3, atk: 0, hp: 0, type: 'field', target: 'none', effect: { boostElement: 'dark', atk: 2 }, skill: '場に出ている間、闇属性モンスターの攻撃力+2（両陣営）', image: null, emoji: '🕳️' },
};

// ---------- 状態管理 ----------
const SAVE_KEY = 'cardgame_save_v1';
const EVOLVE_LEVEL_REQ = 5;
const EVOLVE_COST = 800;
const EVOLVE_BONUS_ATK = 2;
const EVOLVE_BONUS_HP = 3;

function defaultState() {
  const owned = {};
  Object.keys(CARD_DEFS).forEach(id => { owned[id] = { level: 1, exp: 0, count: 1, evolved: false }; });
  return {
    playerName: 'プレイヤー',
    playerLevel: 1,
    gold: 25300,
    gems: 1250,
    trophy: 1250,
    dailyDate: '', dailyProgress: 0, dailyMax: 5, dailyClaimed: false,
    winProgress: 1, winMax: 3,
    totalWins: 0,
    totalPacksOpened: 0,
    totalUpgrades: 0,
    stageProgress: 1,
    hasSeenBattleHelp: false,
    sfxMuted: false,
    dragon: { level: 1, exp: 0 },
    missionsClaimed: {},
    cards: owned,
    deck: Object.keys(CARD_DEFS).slice(0, 12),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const base = defaultState();
    // バージョンアップ時のマージ漏れ対策: 新カードが旧セーブに無い場合は補完
    Object.keys(base.cards).forEach(id => {
      if (!saved.cards || !saved.cards[id]) {
        saved.cards = saved.cards || {};
        saved.cards[id] = base.cards[id];
      } else if (saved.cards[id].evolved === undefined) {
        saved.cards[id].evolved = false;
      }
    });
    // 旧仕様の初期値バグ対策: playerLevelは表示のみで実際のレベリング処理が無かったため、
    // 旧セーブが初期値のまま(Lv.20)残っている場合は正しい初期値(Lv.1)に補正する
    if (saved.playerLevel === 20) saved.playerLevel = 1;
    return Object.assign(base, saved);
  } catch (e) {
    console.error('load failed', e);
    return defaultState();
  }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch (e) { console.error('save failed', e); }
  scheduleCloudSync();
}

let state = loadState();

// ---------- クラウド保存（Firebase） ----------
let cloudSyncTimer = null;
function scheduleCloudSync() {
  if (!window.LisNoirCloud || !window.LisNoirCloud.getUser()) return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    window.LisNoirCloud.saveCloud(state)
      .then(() => setCloudSyncStatus('✅ 同期済み（' + new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + '）'))
      .catch((err) => { console.error('cloud save failed', err); setCloudSyncStatus('⚠️ 同期に失敗しました'); });
    window.LisNoirCloud.updateLeaderboard(state.playerName, state.trophy).catch((err) => console.error('leaderboard update failed', err));
  }, 1500);
}

function setCloudSyncStatus(text) {
  const el = document.getElementById('cloud-sync-status');
  if (el) el.textContent = text;
}

function refreshCloudAuthUI(user) {
  const loggedOut = document.getElementById('cloud-section-loggedout');
  const loggedIn = document.getElementById('cloud-section-loggedin');
  if (!loggedOut || !loggedIn) return;
  if (user) {
    loggedOut.classList.add('hidden');
    loggedIn.classList.remove('hidden');
    document.getElementById('cloud-user-email').textContent = user.email || '';
  } else {
    loggedOut.classList.remove('hidden');
    loggedIn.classList.add('hidden');
  }
}

async function handleSignUp() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const status = document.getElementById('auth-status');
  if (!email || !password) { status.textContent = 'メールアドレスとパスワードを入力してください。'; return; }
  status.textContent = '登録中…';
  try {
    await window.LisNoirCloud.signUp(email, password);
    await window.LisNoirCloud.saveCloud(state); // 新規登録時は今の進行状況をそのままクラウドへ
    status.textContent = '登録が完了しました！';
  } catch (e) {
    status.textContent = e.message || '登録に失敗しました。';
  }
}

async function handleLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const status = document.getElementById('auth-status');
  if (!email || !password) { status.textContent = 'メールアドレスとパスワードを入力してください。'; return; }
  status.textContent = 'ログイン中…';
  try {
    await window.LisNoirCloud.signIn(email, password);
    status.textContent = 'ログインしました。クラウドのデータを確認しています…';
    const cloudData = await window.LisNoirCloud.loadCloud();
    if (cloudData) {
      const useCloud = confirm('クラウドにセーブデータが見つかりました。読み込みますか？\n\nOK：クラウドのデータを読み込む（この端末のデータは上書きされます）\nキャンセル：この端末のデータのままクラウドに保存する');
      if (useCloud) {
        const base = defaultState();
        Object.keys(base.cards).forEach((id) => {
          if (!cloudData.cards || !cloudData.cards[id]) {
            cloudData.cards = cloudData.cards || {};
            cloudData.cards[id] = base.cards[id];
          } else if (cloudData.cards[id].evolved === undefined) {
            cloudData.cards[id].evolved = false;
          }
        });
        state = Object.assign(base, cloudData);
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        renderHome();
        status.textContent = 'クラウドのデータを読み込みました！';
      } else {
        await window.LisNoirCloud.saveCloud(state);
        status.textContent = 'この端末のデータをクラウドに保存しました。';
      }
    } else {
      await window.LisNoirCloud.saveCloud(state);
      status.textContent = 'ログインしました。クラウド保存を開始しました。';
    }
  } catch (e) {
    status.textContent = e.message || 'ログインに失敗しました。';
  }
}

async function handleLogout() {
  if (!confirm('ログアウトしますか？（このアカウントで再ログインすれば、いつでも続きから再開できます）')) return;
  await window.LisNoirCloud.signOutUser();
}

// ---------- バックアップコード（設定画面） ----------
function encodeSaveData(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeSaveData(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
}

function openSettings() {
  document.getElementById('backup-code-out').value = encodeSaveData(state);
  document.getElementById('backup-code-in').value = '';
  document.getElementById('backup-copy-status').textContent = '';
  document.getElementById('backup-restore-status').textContent = '';
  document.getElementById('auth-status').textContent = '';
  updateSfxToggleLabel();
  if (window.LisNoirCloud && window.LisNoirCloud.getUser()) {
    setCloudSyncStatus('同期状態を確認中…');
  }
  document.getElementById('settings-overlay').classList.remove('hidden');
}

function updateSfxToggleLabel() {
  const btn = document.getElementById('sfx-toggle-btn');
  if (btn) btn.textContent = state.sfxMuted ? '効果音: OFF' : '効果音: ON';
}

function toggleSfx() {
  state.sfxMuted = !state.sfxMuted;
  saveState();
  updateSfxToggleLabel();
  if (!state.sfxMuted) sfxTap();
}

function copyBackupCode() {
  const textarea = document.getElementById('backup-code-out');
  const status = document.getElementById('backup-copy-status');
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const finish = (ok) => { status.textContent = ok ? 'コピーしました。安全な場所に保存してください。' : 'コピーできませんでした。手動で選択してコピーしてください。'; };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textarea.value).then(() => finish(true)).catch(() => {
      try { finish(document.execCommand('copy')); } catch (e) { finish(false); }
    });
  } else {
    try { finish(document.execCommand('copy')); } catch (e) { finish(false); }
  }
}

function restoreBackupCode() {
  const code = document.getElementById('backup-code-in').value;
  const status = document.getElementById('backup-restore-status');
  if (!code.trim()) { status.textContent = 'コードを貼り付けてください。'; return; }
  if (!confirm('現在のセーブデータを上書きして復元します。よろしいですか？')) return;
  try {
    const restored = decodeSaveData(code);
    const base = defaultState();
    Object.keys(base.cards).forEach(id => {
      if (!restored.cards || !restored.cards[id]) {
        restored.cards = restored.cards || {};
        restored.cards[id] = base.cards[id];
      } else if (restored.cards[id].evolved === undefined) {
        restored.cards[id].evolved = false;
      }
    });
    state = Object.assign(base, restored);
    saveState();
    status.textContent = '復元しました！';
    renderHome();
  } catch (e) {
    status.textContent = 'コードが正しくありません。コピーし直してもう一度お試しください。';
  }
}

// ---------- カード表示ヘルパー ----------
function cardArtStyle(def) {
  const el = ELEMENTS[def.element];
  return `background: radial-gradient(circle at 30% 20%, ${el.color}55, #14141d 75%);`;
}

function cardStatsLine(def, evolved) {
  const type = def.type || 'monster';
  if (type === 'spell') {
    const eff = def.effect || {};
    let label = '効果';
    if (eff.kind === 'damage') label = `⚡${eff.value}`;
    else if (eff.kind === 'heal') label = `➕${eff.value}`;
    else if (eff.kind === 'draw') label = `🃏${eff.value}`;
    return `<div class="cg-card-stats"><span class="cg-stat spell">スペル</span><span class="cg-stat spell-val">${label}</span></div>`;
  }
  if (type === 'equipment') {
    const eff = def.effect || {};
    const parts = [];
    if (eff.atk) parts.push(`⚔+${eff.atk}`);
    if (eff.hp) parts.push(`❤+${eff.hp}`);
    return `<div class="cg-card-stats"><span class="cg-stat equip">装備</span><span class="cg-stat equip-val">${parts.join(' ')}</span></div>`;
  }
  if (type === 'field') {
    const eff = def.effect || {};
    const elIcon = ELEMENTS[eff.boostElement] ? ELEMENTS[eff.boostElement].icon : '🌐';
    return `<div class="cg-card-stats"><span class="cg-stat field">フィールド</span><span class="cg-stat field-val">${elIcon}+${eff.atk}</span></div>`;
  }
  const atk = def.atk + (evolved ? EVOLVE_BONUS_ATK : 0);
  const hp = def.hp + (evolved ? EVOLVE_BONUS_HP : 0);
  return `<div class="cg-card-stats"><span class="cg-stat atk">⚔ ${atk}</span><span class="cg-stat hp">❤ ${hp}</span></div>`;
}

function renderCardFace(id, opts) {
  opts = opts || {};
  const def = CARD_DEFS[id];
  if (!def) return '';
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const small = opts.small ? ' cg-card-sm' : '';
  const evolvedClass = opts.evolved ? ' evolved-glow' : '';
  const img = def.image
    ? `<img src="${def.image}" alt="${def.name}" class="cg-card-img"/>`
    : `<div class="cg-card-placeholder" style="${cardArtStyle(def)}"><span>${def.emoji}</span></div>`;
  return `
    <div class="cg-card${small}${evolvedClass}" data-id="${id}" style="--rarity-color:${rarity.color}; box-shadow:${rarity.glow};">
      <div class="cg-card-cost">${def.cost}</div>
      <div class="cg-card-art">${img}${opts.evolved ? '<span class="cg-card-evolved-badge">★</span>' : ''}</div>
      <div class="cg-card-name">${def.name}</div>
      ${cardStatsLine(def, opts.evolved)}
      <div class="cg-card-el" style="color:${el.color}">${el.icon}</div>
    </div>`;
}

// ---------- 画面切り替え ----------
const IMMERSIVE_SCREENS = ['battle', 'card-detail', 'result']; // タブバーを隠す画面

const SCREEN_TAB_MAP = { home: 'nav-home', collection: 'nav-cards', stage: 'nav-battle', shop: 'nav-shop', mission: 'nav-mission' };

function showScreen(name) {
  document.querySelectorAll('.cg-screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');

  const tabbar = document.getElementById('global-tabbar');
  if (tabbar) tabbar.classList.toggle('hidden', IMMERSIVE_SCREENS.includes(name));

  document.querySelectorAll('.cg-tab').forEach(t => t.classList.remove('active'));
  const activeTabId = SCREEN_TAB_MAP[name];
  if (activeTabId) {
    const tab = document.getElementById(activeTabId);
    if (tab) tab.classList.add('active');
  }
}

// ---------- ホーム画面 ----------
const RANK_TIERS = [
  { name: 'ブロンズ', min: 0 },
  { name: 'シルバー', min: 500 },
  { name: 'ゴールド', min: 1000 },
  { name: 'プラチナ', min: 2000 },
  { name: 'ダイヤモンド', min: 3500 },
];

const DAILY_REWARD_GOLD = 300;
const DAILY_REWARD_GEMS = 10;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function checkDailyReset() {
  const today = todayStr();
  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyProgress = 0;
    state.dailyClaimed = false;
    saveState();
  }
}

function gainDailyProgress() {
  checkDailyReset();
  if (state.dailyProgress < state.dailyMax) {
    state.dailyProgress = Math.min(state.dailyMax, state.dailyProgress + 1);
    saveState();
  }
}

function claimDailyReward() {
  checkDailyReset();
  if (state.dailyProgress < state.dailyMax || state.dailyClaimed) return;
  state.gold += DAILY_REWARD_GOLD;
  state.gems += DAILY_REWARD_GEMS;
  state.dailyClaimed = true;
  saveState();
  renderHome();
}

function renderHome() {
  checkDailyReset();
  document.getElementById('home-gold').textContent = state.gold.toLocaleString();
  document.getElementById('home-gems').textContent = state.gems.toLocaleString();
  document.getElementById('home-trophy').textContent = state.trophy.toLocaleString();
  document.getElementById('home-level').textContent = 'Lv.' + state.playerLevel;
  document.getElementById('home-name').textContent = state.playerName;
  document.getElementById('daily-fill').style.width = (state.dailyProgress / state.dailyMax * 100) + '%';
  document.getElementById('daily-label').textContent = `${state.dailyProgress}/${state.dailyMax}`;
  const dailyDone = state.dailyProgress >= state.dailyMax;
  const dailyBtn = document.getElementById('daily-claim-btn');
  if (dailyBtn) {
    dailyBtn.classList.toggle('hidden', !dailyDone || state.dailyClaimed);
    dailyBtn.textContent = state.dailyClaimed ? '受取済み' : `受け取る（💰${DAILY_REWARD_GOLD} 💎${DAILY_REWARD_GEMS}）`;
  }
  document.getElementById('win-fill').style.width = (state.winProgress / state.winMax * 100) + '%';
  document.getElementById('win-label').textContent = `${state.winProgress}/${state.winMax}`;

  // ランクカード
  let tierIdx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) { if (state.trophy >= RANK_TIERS[i].min) tierIdx = i; }
  const tier = RANK_TIERS[tierIdx];
  const next = RANK_TIERS[tierIdx + 1];
  document.getElementById('rank-name').textContent = state.playerName;
  document.getElementById('rank-tier').textContent = `${tier.name}ランク`;
  if (next) {
    const pct = Math.min(100, Math.round((state.trophy - tier.min) / (next.min - tier.min) * 100));
    document.getElementById('rank-fill').style.width = pct + '%';
    document.getElementById('rank-sub').textContent = `🏆 ${state.trophy.toLocaleString()} / ${next.min.toLocaleString()}`;
  } else {
    document.getElementById('rank-fill').style.width = '100%';
    document.getElementById('rank-sub').textContent = `🏆 ${state.trophy.toLocaleString()}（最高ランク）`;
  }

  // 注目ミッション（未達成のうち一番進捗が近いもの／全達成なら受け取り可能なものを優先）
  renderFeaturedMission();
  renderDragonSummary();
}

function renderFeaturedMission() {
  const wrap = document.getElementById('featured-mission');
  const claimable = MISSIONS.find(m => m.check(state) >= m.target && !state.missionsClaimed[m.id]);
  const target = claimable || MISSIONS
    .filter(m => !state.missionsClaimed[m.id])
    .sort((a, b) => (b.check(state) / b.target) - (a.check(state) / a.target))[0];

  if (!target) { wrap.innerHTML = ''; wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const progress = Math.min(target.target, target.check(state));
  const done = progress >= target.target;
  wrap.innerHTML = `
    <div class="cg-featured-mission-label">${done ? '受け取り可能なミッション' : '注目のミッション'}</div>
    <div class="cg-featured-mission-row">
      <div>
        <div class="cg-featured-mission-title">${target.title}</div>
        <div class="cg-featured-mission-desc">${target.desc}（${progress}/${target.target}）</div>
      </div>
      <div class="cg-featured-mission-cta">${done ? '受け取る' : '確認する'}</div>
    </div>`;
  wrap.onclick = () => { renderMissions(); showScreen('mission'); };
}

// ---------- ドラゴン育成 ----------
const DRAGON_STAGES = [
  { minLevel: 1,  name: '卵',       emoji: '🥚' },
  { minLevel: 3,  name: '幼竜',     emoji: '🐣' },
  { minLevel: 7,  name: '若竜',     emoji: '🐲' },
  { minLevel: 13, name: '成竜',     emoji: '🐉' },
  { minLevel: 20, name: '古代竜',   emoji: '✨🐉' },
];
const DRAGON_EXP_PER_LEVEL = 100;
const DRAGON_FEED_EXP = 25;

function getDragonStageInfo(level) {
  let stage = DRAGON_STAGES[0];
  for (const s of DRAGON_STAGES) { if (level >= s.minLevel) stage = s; }
  return stage;
}

function getDragonBonusHp() {
  return Math.floor((state.dragon.level || 1) / 2);
}

function dragonFeedCost() {
  return 100 + (state.dragon.level - 1) * 20;
}

function gainDragonExp(amount) {
  const d = state.dragon;
  d.exp += amount;
  while (d.exp >= DRAGON_EXP_PER_LEVEL) {
    d.exp -= DRAGON_EXP_PER_LEVEL;
    d.level += 1;
  }
  saveState();
}

function feedDragon() {
  const cost = dragonFeedCost();
  if (state.gold < cost) return;
  state.gold -= cost;
  gainDragonExp(DRAGON_FEED_EXP);
  renderDragon();
  renderHome();
}

function renderDragonSummary() {
  const stage = getDragonStageInfo(state.dragon.level);
  document.getElementById('dragon-summary-emoji').textContent = stage.emoji;
  document.getElementById('dragon-summary-stage').textContent = `${stage.name}・Lv.${state.dragon.level}`;
  document.getElementById('dragon-summary-fill').style.width = Math.min(100, (state.dragon.exp / DRAGON_EXP_PER_LEVEL) * 100) + '%';
}

function renderDragon() {
  const d = state.dragon;
  const stage = getDragonStageInfo(d.level);
  document.getElementById('dragon-emoji').textContent = stage.emoji;
  document.getElementById('dragon-stage-name').textContent = stage.name;
  document.getElementById('dragon-level').textContent = `Lv.${d.level}`;
  document.getElementById('dragon-exp-fill').style.width = Math.min(100, (d.exp / DRAGON_EXP_PER_LEVEL) * 100) + '%';
  document.getElementById('dragon-exp-label').textContent = `${d.exp}/${DRAGON_EXP_PER_LEVEL}`;
  document.getElementById('dragon-bonus-desc').textContent = `バトル開始時の自分のHPが +${getDragonBonusHp()}（現在 ${30 + getDragonBonusHp()}）`;
  document.getElementById('dragon-feed-btn').textContent = `🍖 エサをあげる（💰${dragonFeedCost()}）`;

  const listEl = document.getElementById('dragon-stages-list');
  listEl.innerHTML = DRAGON_STAGES.map(s => {
    const current = stage.name === s.name;
    return `<div class="cg-dragon-stage-row ${current ? 'current' : ''}">
      <span class="em">${s.emoji}</span><span>${s.name}</span><span class="lv">Lv.${s.minLevel}〜</span>
    </div>`;
  }).join('');
}

// ---------- ランキング ----------
async function renderRanking() {
  const wrap = document.getElementById('ranking-body');
  const user = window.LisNoirCloud && window.LisNoirCloud.getUser();
  if (!user) {
    wrap.innerHTML = `
      <div class="cg-rank-empty">
        ランキングを見るには、ログインが必要です。<br>ログインすると、あなたのトロフィー数も他のプレイヤーと比較されるようになります。
      </div>
      <button class="cg-btn cg-btn-main cg-rank-login-btn" id="rank-goto-settings-btn">ログインする</button>`;
    document.getElementById('rank-goto-settings-btn').addEventListener('click', () => {
      showScreen('home');
      openSettings();
    });
    return;
  }
  wrap.innerHTML = '<div class="cg-rank-empty">読み込み中…</div>';
  try {
    const list = await window.LisNoirCloud.getLeaderboard(50);
    if (!list.length) { wrap.innerHTML = '<div class="cg-rank-empty">まだランキングデータがありません。</div>'; return; }
    wrap.innerHTML = `<div class="cg-rank-list">${list.map((entry, i) => `
      <div class="cg-rank-row ${entry.uid === user.uid ? 'me' : ''}">
        <div class="cg-rank-pos">${i + 1}</div>
        <div class="cg-rank-name">${entry.displayName || 'プレイヤー'}${entry.uid === user.uid ? '（あなた）' : ''}</div>
        <div class="cg-rank-trophy">🏆 ${(entry.trophy || 0).toLocaleString()}</div>
      </div>`).join('')}</div>`;
  } catch (e) {
    console.error('leaderboard fetch failed', e);
    wrap.innerHTML = '<div class="cg-rank-empty">ランキングの取得に失敗しました。時間をおいて再度お試しください。</div>';
  }
}


let collectionFilter = 'all';

function maxCopiesFor(id) {
  const def = CARD_DEFS[id];
  return (def.type || 'monster') === 'equipment' ? 1 : 3;
}

function countInDeck(id) {
  return state.deck.filter(x => x === id).length;
}

function renderDeck() {
  const deckEl = document.getElementById('deck-slots');
  deckEl.innerHTML = state.deck.map((id, i) =>
    `<div class="cg-deck-slot-item" data-index="${i}">
       ${renderCardFace(id, { small: true, evolved: state.cards[id] && state.cards[id].evolved })}
       <button class="cg-deck-remove-btn" data-index="${i}" aria-label="デッキから外す">✕</button>
     </div>`
  ).join('') + (state.deck.length === 0 ? '<div class="cg-empty">デッキにカードがありません</div>' : '');
  document.getElementById('deck-count').textContent = `${state.deck.length}/30`;

  deckEl.querySelectorAll('.cg-deck-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(btn.dataset.index);
      state.deck.splice(i, 1);
      saveState();
      renderDeck();
    });
  });

  const avgCost = state.deck.length
    ? (state.deck.reduce((s, id) => s + CARD_DEFS[id].cost, 0) / state.deck.length).toFixed(1)
    : '0.0';
  document.getElementById('deck-avgcost').textContent = avgCost;

  const collEl = document.getElementById('collection-list');
  const owned = Object.keys(state.cards).filter(id => {
    if (collectionFilter === 'all') return true;
    return (CARD_DEFS[id].type || 'monster') === collectionFilter;
  });
  collEl.innerHTML = owned.map(id => {
    const count = countInDeck(id);
    const max = maxCopiesFor(id);
    const atMax = count >= max;
    return `<div class="cg-coll-item ${count > 0 ? 'in-deck' : ''} ${atMax ? 'at-max' : ''}" data-id="${id}">
      ${renderCardFace(id, { small: true, evolved: state.cards[id].evolved })}
      ${count > 0 ? `<span class="cg-coll-count">×${count}</span>` : ''}
    </div>`;
  }).join('');

  collEl.querySelectorAll('.cg-coll-item').forEach(node => {
    node.addEventListener('click', () => {
      const id = node.dataset.id;
      const max = maxCopiesFor(id);
      if (countInDeck(id) >= max) {
        node.classList.remove('cg-shake'); void node.offsetWidth; node.classList.add('cg-shake');
        return;
      }
      if (state.deck.length >= 30) return;
      state.deck.push(id);
      saveState();
      renderDeck();
    });
  });
}

function setCollectionFilter(filter) {
  collectionFilter = filter;
  document.querySelectorAll('.cg-filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderDeck();
}

function autoBuildDeck() {
  const rarityRank = { legend: 4, epic: 3, rare: 2, normal: 1 };
  const ids = Object.keys(state.cards);
  const monsters = ids.filter(id => (CARD_DEFS[id].type || 'monster') === 'monster')
    .sort((a, b) => (rarityRank[CARD_DEFS[b].rarity] - rarityRank[CARD_DEFS[a].rarity]) || (state.cards[b].level - state.cards[a].level));
  const others = ids.filter(id => (CARD_DEFS[id].type || 'monster') !== 'monster')
    .sort((a, b) => rarityRank[CARD_DEFS[b].rarity] - rarityRank[CARD_DEFS[a].rarity]);

  const deck = [];
  const addUpTo = (list, limit) => {
    for (const id of list) {
      const max = maxCopiesFor(id);
      for (let n = 0; n < max && deck.length < limit; n++) deck.push(id);
      if (deck.length >= limit) break;
    }
  };
  addUpTo(monsters, 24);
  addUpTo(others, 30);
  state.deck = deck.slice(0, 30);
  saveState();
  renderDeck();
}

// ---------- カード一覧/詳細画面 ----------
let selectedCardId = null;

function renderCardList() {
  const listEl = document.getElementById('cardlist-grid');
  listEl.innerHTML = Object.keys(state.cards).map(id => renderCardFace(id, { small: true, evolved: state.cards[id].evolved })).join('');
  listEl.querySelectorAll('.cg-card').forEach(node => {
    node.addEventListener('click', () => openCardDetail(node.dataset.id));
  });
}

function detailStatsBlock(def, evolved) {
  const type = def.type || 'monster';
  if (type === 'monster') {
    const atk = def.atk + (evolved ? EVOLVE_BONUS_ATK : 0);
    const hp = def.hp + (evolved ? EVOLVE_BONUS_HP : 0);
    return `
      <div class="cg-detail-stat"><span>コスト</span><b>${def.cost}</b></div>
      <div class="cg-detail-stat"><span>攻撃力</span><b>${atk}${evolved ? ' ↑' : ''}</b></div>
      <div class="cg-detail-stat"><span>HP</span><b>${hp}${evolved ? ' ↑' : ''}</b></div>`;
  }
  const typeLabel = type === 'spell' ? 'スペル' : type === 'equipment' ? '装備' : 'フィールド';
  return `
    <div class="cg-detail-stat"><span>コスト</span><b>${def.cost}</b></div>
    <div class="cg-detail-stat"><span>種別</span><b>${typeLabel}</b></div>`;
}

function openCardDetail(id) {
  selectedCardId = id;
  const def = CARD_DEFS[id];
  const owned = state.cards[id];
  const el = ELEMENTS[def.element];
  const rarity = RARITY[def.rarity];
  const isMonster = (def.type || 'monster') === 'monster';
  document.getElementById('detail-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${owned.evolved ? '<span class="cg-card-evolved-badge lg">★</span>' : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level">Lv.${owned.level} <span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${owned.evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      <div class="cg-detail-bar"><div class="cg-detail-bar-fill" style="width:${Math.min(100, owned.exp)}%"></div></div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def, owned.evolved)}
      </div>
      <button class="cg-btn cg-btn-main" id="detail-upgrade-btn">強化 (💰400)</button>
      ${isMonster ? `
        <div class="cg-evolve-row">
          ${owned.evolved
            ? `<div class="cg-evolve-done">★ 進化済み（⚔+${EVOLVE_BONUS_ATK} ❤+${EVOLVE_BONUS_HP} 適用中）</div>`
            : `<button class="cg-btn cg-evolve-btn" id="detail-evolve-btn" ${owned.level < EVOLVE_LEVEL_REQ ? 'disabled' : ''}>
                 ${owned.level < EVOLVE_LEVEL_REQ ? `進化はLv.${EVOLVE_LEVEL_REQ}で解放` : `進化 (💰${EVOLVE_COST})`}
               </button>`}
        </div>` : ''}
    </div>`;
  document.getElementById('detail-upgrade-btn').addEventListener('click', () => {
    if (state.gold >= 400) {
      state.gold -= 400;
      state.cards[id].exp += 20;
      if (state.cards[id].exp >= 100) { state.cards[id].exp = 0; state.cards[id].level += 1; }
      state.totalUpgrades = (state.totalUpgrades || 0) + 1;
      saveState();
      openCardDetail(id);
      renderHome();
    }
  });
  const evolveBtn = document.getElementById('detail-evolve-btn');
  if (evolveBtn) evolveBtn.addEventListener('click', () => evolveCard(id));
  showScreen('card-detail');
}

function evolveCard(id) {
  const owned = state.cards[id];
  const def = CARD_DEFS[id];
  if (!owned || owned.evolved) return;
  if ((def.type || 'monster') !== 'monster') return;
  if (owned.level < EVOLVE_LEVEL_REQ || state.gold < EVOLVE_COST) return;
  state.gold -= EVOLVE_COST;
  owned.evolved = true;
  saveState();
  openCardDetail(id);
  renderHome();
}

// ---------- バトルロジック ----------
let battle = null;

const STAGES = [
  { id: 1, name: '見習いのモンスター使い', portrait: '🧙', hp: 16, spellChance: 0.05, bgTheme: 'forest',
    weights: { normal: 95, rare: 5, epic: 0, legend: 0 }, rewardGold: 80, rewardGems: 5, trophyDelta: 20,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '霧深い森の入り口。若きモンスター使いが行く手を阻む。' },
      { speaker: '見習いのモンスター使い', portrait: '🧙', text: 'ふふ…僕の練習相手になってもらうよ！' },
    ],
    storyVictory: { speaker: '見習いのモンスター使い', portrait: '🧙', text: 'く…まだまだ僕は未熟だったようだ…' } },
  { id: 2, name: '森の狩人', portrait: '🏹', hp: 18, spellChance: 0.08, bgTheme: 'snow',
    weights: { normal: 80, rare: 17, epic: 3, legend: 0 }, rewardGold: 100, rewardGems: 8, trophyDelta: 25,
    storyIntro: [
      { speaker: '森の狩人', portrait: '🏹', text: 'この森は我が縄張りだ。侵入者には容赦しない。' },
    ],
    storyVictory: { speaker: '森の狩人', portrait: '🏹', text: 'まさか…この森で敗れる日が来るとはな。' } },
  { id: 3, name: '深淵の魔導士', portrait: '🔮', hp: 22, spellChance: 0.13, bgTheme: 'cave',
    weights: { normal: 55, rare: 32, epic: 11, legend: 2 }, rewardGold: 130, rewardGems: 10, trophyDelta: 28,
    storyIntro: [
      { speaker: '深淵の魔導士', portrait: '🔮', text: 'ほう…なかなかやるようだね。だが、闇の力の前には無力さ。' },
    ],
    storyVictory: { speaker: '深淵の魔導士', portrait: '🔮', text: '……面白い。この程度で終わるとはな。' } },
  { id: 4, name: '竜の巫女', portrait: '🐲', hp: 28, spellChance: 0.19, bgTheme: 'volcano',
    weights: { normal: 32, rare: 35, epic: 26, legend: 7 }, rewardGold: 160, rewardGems: 14, trophyDelta: 32,
    storyIntro: [
      { speaker: '竜の巫女', portrait: '🐲', text: '我が竜の力、その身に刻んでみせよ。' },
    ],
    storyVictory: { speaker: '竜の巫女', portrait: '🐲', text: '……負けたか。だが、それも巫女としての試練。' } },
  { id: 5, name: 'モンスター使いの女王', portrait: '👑', hp: 34, spellChance: 0.26, bgTheme: 'castle',
    weights: { normal: 12, rare: 28, epic: 38, legend: 22 }, rewardGold: 220, rewardGems: 20, trophyDelta: 40,
    storyIntro: [
      { speaker: 'モンスター使いの女王', portrait: '👑', text: 'ここまで来たか。ならば、我が真の力を見せてやろう。' },
    ],
    storyVictory: { speaker: 'モンスター使いの女王', portrait: '👑', text: '見事…お前こそ、真のLis Noirの継承者にふさわしい。' } },
];

// ---------- ストーリー会話 ----------
let storyQueue = [];
let storyOnDone = null;

function showStory(lines, onDone) {
  if (!lines || !lines.length) { if (onDone) onDone(); return; }
  storyQueue = lines.slice();
  storyOnDone = onDone;
  document.getElementById('story-overlay').classList.remove('hidden');
  advanceStory();
}

function advanceStory() {
  if (!storyQueue.length) {
    document.getElementById('story-overlay').classList.add('hidden');
    const done = storyOnDone;
    storyOnDone = null;
    if (done) done();
    return;
  }
  const line = storyQueue.shift();
  document.getElementById('story-portrait').textContent = line.portrait || '💬';
  document.getElementById('story-speaker').textContent = line.speaker || '';
  document.getElementById('story-text').textContent = line.text || '';
}

function renderStageSelect() {
  const wrap = document.getElementById('stage-list');
  wrap.innerHTML = STAGES.map(stage => {
    const unlocked = stage.id <= state.stageProgress;
    const cleared = stage.id < state.stageProgress;
    return `
      <div class="cg-stage-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" data-stage="${stage.id}">
        <div class="cg-stage-portrait">${unlocked ? stage.portrait : '🔒'}</div>
        <div class="cg-stage-info">
          <div class="cg-stage-name">ステージ${stage.id}　${unlocked ? stage.name : '？？？'}</div>
          <div class="cg-stage-desc">${unlocked ? `敵HP ${stage.hp}　報酬 💰${stage.rewardGold} 💎${stage.rewardGems}` : '前のステージをクリアすると解放'}</div>
        </div>
        <div class="cg-stage-go">${unlocked ? '⚔️' : ''}</div>
      </div>`;
  }).join('');
  wrap.querySelectorAll('.cg-stage-card:not(.locked)').forEach(node => {
    node.addEventListener('click', () => {
      const stage = STAGES.find(s => s.id === Number(node.dataset.stage));
      showStory(stage.storyIntro, () => startBattle(stage));
    });
  });
}

function newBattleUnit(id, isPlayerCard) {
  const def = CARD_DEFS[id];
  const owned = isPlayerCard ? state.cards[id] : null;
  const evolved = !!(owned && owned.evolved);
  const bonusAtk = evolved ? EVOLVE_BONUS_ATK : 0;
  const bonusHp = evolved ? EVOLVE_BONUS_HP : 0;
  return { id, defId: id, def, curHp: def.hp + bonusHp, atkBonus: bonusAtk, hpBonus: bonusHp, evolved, canAttack: false, justPlayed: true };
}

function buildWeightedMonsterDeck(weights, count, spellChance) {
  const monsterIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') === 'monster');
  const otherIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') !== 'monster');
  const chance = spellChance || 0;
  const deck = [];
  for (let i = 0; i < count; i++) {
    if (otherIds.length && Math.random() < chance) {
      deck.push(otherIds[Math.floor(Math.random() * otherIds.length)]);
      continue;
    }
    const id = pickWeightedCardId(weights);
    deck.push(monsterIds.includes(id) ? id : monsterIds[Math.floor(Math.random() * monsterIds.length)]);
  }
  return deck;
}

const BATTLE_BG_THEMES = {
  forest:  'battle-bg-forest.jpg',
  snow:    'battle-bg-snow.jpg',
  cave:    'battle-bg-cave.jpg',
  volcano: 'battle-bg-volcano.jpg',
  castle:  'battle-bg-castle.jpg',
};

function applyBattleBgTheme(theme) {
  const board = document.querySelector('.cg-battle-board');
  if (!board) return;
  const img = BATTLE_BG_THEMES[theme] || BATTLE_BG_THEMES.forest;
  board.style.backgroundImage =
    `linear-gradient(180deg, #1A1725b8 0%, #1A1725d9 50%, #1A1725b8 100%), url('${img}')`;
  board.style.backgroundSize = 'cover';
  board.style.backgroundPosition = 'center';
  board.style.backgroundRepeat = 'no-repeat';
}

function startBattle(stage) {
  stage = stage || (battle && battle.stage) || STAGES[0];
  const playerDeck = shuffle(state.deck.length ? state.deck.slice() : Object.keys(CARD_DEFS).slice(0, 10));
  const enemyDeck = shuffle(buildWeightedMonsterDeck(stage.weights, 20, stage.spellChance || 0));
  const dragonHpBonus = getDragonBonusHp();

  battle = {
    stage,
    turn: 1,
    activeSide: 'player',
    playerHp: 30 + dragonHpBonus, playerMaxHp: 30 + dragonHpBonus, enemyHp: stage.hp,
    playerMaxCost: 1, enemyMaxCost: 1,
    playerCost: 1, enemyCost: 1,
    playerDeck, enemyDeck,
    playerHand: playerDeck.splice(0, 4),
    enemyHand: enemyDeck.splice(0, 4),
    playerField: [null, null, null, null, null],
    enemyField: [null, null, null, null, null],
    fieldCard: null,
    selectedHandIdx: null,
    selectedFieldIdx: null,
    log: '',
    over: false,
  };
  document.getElementById('battle-enemy-emoji').textContent = stage.portrait;
  applyBattleBgTheme(stage.bgTheme);
  renderBattle();
  showScreen('battle');
  showVsIntro(stage);
}

function showVsIntro(stage) {
  document.getElementById('vs-enemy-portrait').textContent = stage.portrait;
  document.getElementById('vs-enemy-name').textContent = stage.name;
  const overlay = document.getElementById('battle-vs-intro');
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 1400);
  setTimeout(() => {
    showTurnBanner('YOUR TURN');
    if (!state.hasSeenBattleHelp) {
      document.getElementById('battle-help-overlay').classList.remove('hidden');
    }
  }, 1450);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function elementMultiplier(atkEl, defEl) {
  if (ELEMENT_ADVANTAGE[atkEl] === defEl) return 2;   // 有利
  if (ELEMENT_ADVANTAGE[defEl] === atkEl) return -1;  // 不利
  return 0;
}

function skillFlash(text) {
  const flash = document.getElementById('battle-skill-flash');
  flash.textContent = text;
  flash.classList.remove('show');
  void flash.offsetWidth; // reflow でアニメ再トリガー
  flash.classList.add('show');
}

function showTurnBanner(text) {
  const el = document.getElementById('turn-banner');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function impactEffect() {
  const app = document.getElementById('app');
  const flash = document.getElementById('battle-impact-flash');
  app.classList.remove('shake');
  void app.offsetWidth;
  app.classList.add('shake');
  if (flash) {
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
  }
  sfxAttack();
}

function summonEffect() {
  const flash = document.getElementById('battle-impact-flash');
  if (!flash) return;
  flash.classList.remove('show-summon');
  void flash.offsetWidth;
  flash.classList.add('show-summon');
}

// ---------- サウンド（合成音） ----------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  return audioCtx;
}

function playTone(freq, duration, type, volume, delay) {
  if (state.sfxMuted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume || 0.15, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function sfxTap() { playTone(600, 0.06, 'triangle', 0.07); }
function sfxCardPlay() { playTone(440, 0.09, 'sine', 0.11); playTone(660, 0.09, 'sine', 0.09, 0.05); }
function sfxAttack() { playTone(120, 0.15, 'sawtooth', 0.13); }
function sfxWin() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.25, 'triangle', 0.13, i * 0.12)); }
function sfxLose() { [400, 300, 220].forEach((f, i) => playTone(f, 0.35, 'sine', 0.11, i * 0.18)); }
function sfxReveal() { playTone(880, 0.12, 'triangle', 0.13); playTone(1108, 0.15, 'triangle', 0.11, 0.08); }

function fieldBonusFor(unit) {
  if (!battle || !battle.fieldCard) return 0;
  const fdef = CARD_DEFS[battle.fieldCard];
  if (!fdef || !fdef.effect) return 0;
  return unit.def.element === fdef.effect.boostElement ? (fdef.effect.atk || 0) : 0;
}

function previewDamage(attackerUnit, defenderUnit) {
  const mult = defenderUnit ? elementMultiplier(attackerUnit.def.element, defenderUnit.def.element) : 0;
  return { dmg: Math.max(1, attackerUnit.def.atk + (attackerUnit.atkBonus || 0) + fieldBonusFor(attackerUnit) + mult), mult };
}

function renderBattle() {
  if (!battle) return;
  document.getElementById('battle-turn-timer').textContent = 'ターン ' + battle.turn;
  document.getElementById('battle-player-hp').textContent = battle.playerHp;
  document.getElementById('battle-enemy-hp').textContent = battle.enemyHp;
  document.getElementById('battle-cost-fill').style.width = (battle.playerCost / 10 * 100) + '%';
  document.getElementById('battle-cost-label').textContent = `${battle.playerCost} / ${battle.playerMaxCost > 10 ? 10 : battle.playerMaxCost}`;
  document.getElementById('battle-deck-remaining').textContent = battle.playerDeck.length;

  const fieldIndicatorEl = document.getElementById('battle-field-indicator');
  if (battle.fieldCard) {
    const fdef = CARD_DEFS[battle.fieldCard];
    const fel = ELEMENTS[fdef.effect.boostElement];
    fieldIndicatorEl.innerHTML = `${fdef.emoji} ${fdef.name}（${fel.icon}+${fdef.effect.atk}）`;
    fieldIndicatorEl.style.display = '';
    fieldIndicatorEl.style.borderColor = fel.color;
  } else {
    fieldIndicatorEl.style.display = 'none';
  }

  const enemyFieldEl = document.getElementById('battle-enemy-field');
  const previewingAttack = battle.selectedFieldIdx !== null ? battle.playerField[battle.selectedFieldIdx] : null;
  const selectedSpell = battle.selectedHandIdx !== null ? CARD_DEFS[battle.playerHand[battle.selectedHandIdx]] : null;
  const previewingSpell = selectedSpell && (selectedSpell.type || 'monster') === 'spell' && selectedSpell.target === 'enemy' ? selectedSpell : null;

  enemyFieldEl.innerHTML = battle.enemyField.map((u, i) => {
    let preview = '';
    if (u && previewingAttack) {
      const p = previewDamage(previewingAttack, u);
      const cls = p.mult > 0 ? 'adv' : p.mult < 0 ? 'dis' : '';
      preview = `<div class="cg-preview-badge ${cls}">⚔${p.dmg}</div>`;
    } else if (u && previewingSpell) {
      preview = `<div class="cg-preview-badge spell">✨${previewingSpell.effect.value}</div>`;
    }
    return u
      ? `<div class="cg-field-slot filled" data-side="enemy" data-idx="${i}">${renderCardFace(u.defId, { small: true })}<div class="cg-hp-badge">${u.curHp}</div>${preview}</div>`
      : `<div class="cg-field-slot" data-side="enemy" data-idx="${i}"></div>`;
  }).join('');

  const playerFieldEl = document.getElementById('battle-player-field');
  playerFieldEl.innerHTML = battle.playerField.map((u, i) => u
    ? `<div class="cg-field-slot filled ${battle.selectedFieldIdx === i ? 'selected' : ''}" data-side="player" data-idx="${i}">${renderCardFace(u.defId, { small: true, evolved: u.evolved })}<div class="cg-hp-badge">${u.curHp}</div>${u.canAttack ? '<div class="cg-ready-dot"></div>' : ''}</div>`
    : `<div class="cg-field-slot" data-side="player" data-idx="${i}"></div>`
  ).join('');

  const handEl = document.getElementById('battle-hand');
  handEl.innerHTML = battle.playerHand.map((id, i) => {
    const affordable = CARD_DEFS[id].cost <= battle.playerCost;
    return `<div class="cg-hand-card ${affordable ? '' : 'disabled'} ${battle.selectedHandIdx === i ? 'selected' : ''}" data-idx="${i}">${renderCardFace(id, { small: true, evolved: state.cards[id] && state.cards[id].evolved })}</div>`;
  }).join('');

  const portraitPreviewEl = document.getElementById('battle-portrait-preview');
  const directAttackReady = !!(previewingAttack || previewingSpell);
  if (previewingAttack) {
    portraitPreviewEl.textContent = `⚔${previewDamage(previewingAttack, null).dmg}`;
    portraitPreviewEl.classList.add('show');
  } else if (previewingSpell) {
    portraitPreviewEl.textContent = `✨${previewingSpell.effect.value}`;
    portraitPreviewEl.classList.add('show');
  } else {
    portraitPreviewEl.classList.remove('show');
  }
  document.getElementById('battle-enemy-portrait').classList.toggle('attackable', directAttackReady);
  document.getElementById('battle-enemy-hp-chip').classList.toggle('attackable', directAttackReady);
  document.getElementById('battle-direct-attack-label').classList.toggle('show', directAttackReady);

  bindBattleEvents();

  if (battle.playerHp <= 0 || battle.enemyHp <= 0) {
    battle.over = true;
    setTimeout(() => showResult(battle.playerHp > 0), 600);
  }
}

function bindBattleEvents() {
  document.querySelectorAll('#battle-hand .cg-hand-card').forEach(node => {
    node.onclick = () => {
      if (longPressFired) { longPressFired = false; return; }
      const idx = Number(node.dataset.idx);
      const id = battle.playerHand[idx];
      const def = CARD_DEFS[id];
      if (!def || def.cost > battle.playerCost) return;
      const type = def.type || 'monster';
      battle.selectedFieldIdx = null;
      if (type === 'spell' && (def.target || 'none') === 'none') {
        castSpell(idx, null);
        return;
      }
      if (type === 'field') {
        playFieldCard(idx);
        return;
      }
      battle.selectedHandIdx = (battle.selectedHandIdx === idx) ? null : idx;
      renderBattle();
    };
    bindLongPress(node, () => {
      const idx = Number(node.dataset.idx);
      const id = battle.playerHand[idx];
      if (id) showHandCardInfo(id);
    });
  });
  document.querySelectorAll('#battle-player-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
      if (longPressFired) { longPressFired = false; return; }
      const idx = Number(node.dataset.idx);
      if (battle.selectedHandIdx !== null) {
        const id = battle.playerHand[battle.selectedHandIdx];
        const def = CARD_DEFS[id];
        const type = def.type || 'monster';
        if (type === 'monster') {
          playCardFromHand(battle.selectedHandIdx, idx);
        } else if (type === 'equipment' && def.target === 'friendly' && battle.playerField[idx]) {
          equipCardFromHand(battle.selectedHandIdx, idx);
        }
        return;
      }
      if (battle.playerField[idx] && battle.playerField[idx].canAttack) {
        battle.selectedHandIdx = null;
        battle.selectedFieldIdx = (battle.selectedFieldIdx === idx) ? null : idx;
        renderBattle();
      }
    };
    bindLongPress(node, () => {
      const idx = Number(node.dataset.idx);
      if (battle.playerField[idx]) showCardInfo(battle.playerField[idx]);
    });
  });
  document.querySelectorAll('#battle-enemy-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
      if (longPressFired) { longPressFired = false; return; }
      const idx = Number(node.dataset.idx);
      if (battle.selectedHandIdx !== null) {
        const id = battle.playerHand[battle.selectedHandIdx];
        const def = CARD_DEFS[id];
        if ((def.type || 'monster') === 'spell' && def.target === 'enemy' && battle.enemyField[idx]) {
          castSpell(battle.selectedHandIdx, idx);
        }
        return;
      }
      if (battle.selectedFieldIdx !== null) attackTarget(battle.selectedFieldIdx, idx);
    };
    bindLongPress(node, () => {
      const idx = Number(node.dataset.idx);
      if (battle.enemyField[idx]) showCardInfo(battle.enemyField[idx]);
    });
  });
  const handleDirectAttackTap = () => {
    if (battle.selectedHandIdx !== null) {
      const id = battle.playerHand[battle.selectedHandIdx];
      const def = CARD_DEFS[id];
      if ((def.type || 'monster') === 'spell' && def.target === 'enemy') {
        castSpell(battle.selectedHandIdx, null);
      }
      return;
    }
    if (battle.selectedFieldIdx !== null) attackTarget(battle.selectedFieldIdx, null);
  };
  document.getElementById('battle-enemy-portrait').onclick = handleDirectAttackTap;
  document.getElementById('battle-enemy-hp-chip').onclick = handleDirectAttackTap;
}

// ---------- 長押し検知（フィールドのモンスターをタップ操作と区別して詳細表示） ----------
let longPressFired = false;
function bindLongPress(node, onLongPress) {
  let timer = null;
  const start = (e) => {
    longPressFired = false;
    timer = setTimeout(() => { longPressFired = true; onLongPress(); }, 450);
  };
  const cancel = () => { if (timer) clearTimeout(timer); };
  node.addEventListener('pointerdown', start);
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointercancel', cancel);
  node.addEventListener('contextmenu', (e) => e.preventDefault());
}

function showCardInfo(unit) {
  const def = unit.def;
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const atk = def.atk + (unit.atkBonus || 0) + fieldBonusFor(unit);
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span></div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        <div class="cg-detail-stat"><span>攻撃力</span><b>${atk}</b></div>
        <div class="cg-detail-stat"><span>現在HP</span><b>${unit.curHp}</b></div>
      </div>
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
}

function showHandCardInfo(id) {
  const def = CARD_DEFS[id];
  if (!def) return;
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const owned = state.cards[id];
  const evolved = !!(owned && owned.evolved);
  const type = def.type || 'monster';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def, evolved)}
      </div>
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
}

function playCardFromHand(handIdx, fieldIdx) {
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost || battle.playerField[fieldIdx]) return;
  battle.playerCost -= def.cost;
  battle.playerField[fieldIdx] = newBattleUnit(id, true);
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  sfxCardPlay();
  summonEffect();
  if (def.skill) skillFlash(`${def.name}のスキル！\n${def.skill}`);
  renderBattle();
}

function castSpell(handIdx, targetIdx) {
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost) return;
  battle.playerCost -= def.cost;
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  sfxCardPlay();

  const eff = def.effect || {};
  if (eff.kind === 'damage') {
    const dmg = eff.value || 0;
    impactEffect();
    if (targetIdx === null) {
      battle.enemyHp -= dmg;
    } else {
      const target = battle.enemyField[targetIdx];
      if (target) {
        target.curHp -= dmg;
        if (target.curHp <= 0) battle.enemyField[targetIdx] = null;
      }
    }
  } else if (eff.kind === 'heal') {
    battle.playerHp = Math.min(battle.playerMaxHp || 30, battle.playerHp + (eff.value || 0));
  } else if (eff.kind === 'draw') {
    for (let i = 0; i < (eff.value || 0); i++) {
      if (battle.playerDeck.length) battle.playerHand.push(battle.playerDeck.shift());
    }
  }
  if (def.skill) skillFlash(`${def.name}！\n${def.skill}`);
  battle.enemyField = battle.enemyField.map(u => (u && u.curHp <= 0) ? null : u);
  renderBattle();
}

function playFieldCard(handIdx) {
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost) return;
  battle.playerCost -= def.cost;
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  battle.fieldCard = id;
  sfxCardPlay();
  if (def.skill) skillFlash(`${def.name}発動！\n${def.skill}`);
  renderBattle();
}

function equipCardFromHand(handIdx, fieldIdx) {
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  const unit = battle.playerField[fieldIdx];
  if (!def || !unit || def.cost > battle.playerCost) return;
  battle.playerCost -= def.cost;
  const eff = def.effect || {};
  unit.atkBonus = (unit.atkBonus || 0) + (eff.atk || 0);
  unit.hpBonus = (unit.hpBonus || 0) + (eff.hp || 0);
  unit.curHp += (eff.hp || 0);
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  sfxCardPlay();
  if (def.skill) skillFlash(`${def.name}を装備！\n${def.skill}`);
  renderBattle();
}

function attackTarget(attackerIdx, targetIdx) {
  const attacker = battle.playerField[attackerIdx];
  if (!attacker || !attacker.canAttack) return;
  const mult = targetIdx === null ? 0 : elementMultiplier(attacker.def.element, battle.enemyField[targetIdx].def.element);
  const dmg = Math.max(1, attacker.def.atk + (attacker.atkBonus || 0) + fieldBonusFor(attacker) + mult);
  impactEffect();

  if (targetIdx === null) {
    battle.enemyHp -= dmg;
  } else {
    const target = battle.enemyField[targetIdx];
    target.curHp -= dmg;
    if (attacker.def.skill && attacker.def.skill.includes('全体')) {
      battle.enemyField.forEach(u => { if (u) u.curHp -= 2; });
      skillFlash(`${attacker.def.name}のスキル！\n全ての敵に2ダメージ`);
    }
    if (target.curHp <= 0) battle.enemyField[targetIdx] = null;
  }
  attacker.canAttack = false;
  battle.selectedFieldIdx = null;
  battle.enemyField = battle.enemyField.map(u => (u && u.curHp <= 0) ? null : u);
  renderBattle();
}

function endTurn() {
  if (!battle || battle.over) return;
  // 自分の場のユニットは次ターンから攻撃可能に
  battle.playerField.forEach(u => { if (u) u.canAttack = true; });
  showTurnBanner('ENEMY TURN');
  setTimeout(() => {
    enemyTurn();
    if (!battle.over) showTurnBanner('YOUR TURN');
  }, 700);
}

function enemyTurn() {
  battle.activeSide = 'enemy';
  battle.enemyMaxCost = Math.min(10, battle.enemyMaxCost + 1);
  battle.enemyCost = battle.enemyMaxCost;
  if (battle.enemyDeck.length) battle.enemyHand.push(battle.enemyDeck.shift());

  // AI: モンスター配置 → 装備 → フィールド → スペルの優先順で、出せるカードを出し続ける
  let progressed = true;
  let guard = 0;
  while (progressed && guard < 30) {
    progressed = false;
    guard++;
    for (let i = 0; i < battle.enemyHand.length; i++) {
      const id = battle.enemyHand[i];
      const def = CARD_DEFS[id];
      const type = def.type || 'monster';
      if (def.cost > battle.enemyCost) continue;

      if (type === 'monster') {
        const emptyIdx = battle.enemyField.findIndex(s => s === null);
        if (emptyIdx === -1) continue;
        battle.enemyCost -= def.cost;
        battle.enemyField[emptyIdx] = newBattleUnit(id);
        battle.enemyHand.splice(i, 1);
        progressed = true;
        break;
      }

      if (type === 'equipment' && def.target === 'friendly') {
        const targetIdx = battle.enemyField.findIndex(u => u !== null);
        if (targetIdx === -1) continue;
        const eff = def.effect || {};
        const unit = battle.enemyField[targetIdx];
        unit.atkBonus = (unit.atkBonus || 0) + (eff.atk || 0);
        unit.hpBonus = (unit.hpBonus || 0) + (eff.hp || 0);
        unit.curHp += (eff.hp || 0);
        battle.enemyCost -= def.cost;
        battle.enemyHand.splice(i, 1);
        progressed = true;
        skillFlash(`${def.name}を装備！\n${def.skill}`);
        break;
      }

      if (type === 'field') {
        if (battle.fieldCard) continue; // 既にフィールドが出ているなら他を優先
        battle.fieldCard = id;
        battle.enemyCost -= def.cost;
        battle.enemyHand.splice(i, 1);
        progressed = true;
        skillFlash(`${def.name}発動！\n${def.skill}`);
        break;
      }

      if (type === 'spell') {
        const eff = def.effect || {};
        if (def.target === 'enemy') {
          // AI視点の「敵」＝プレイヤー側
          battle.enemyCost -= def.cost;
          battle.enemyHand.splice(i, 1);
          if (eff.kind === 'damage') {
            impactEffect();
            const targetIdx = battle.playerField.findIndex(u => u !== null);
            if (targetIdx !== -1) {
              battle.playerField[targetIdx].curHp -= eff.value;
              if (battle.playerField[targetIdx].curHp <= 0) battle.playerField[targetIdx] = null;
            } else {
              battle.playerHp -= eff.value;
            }
          }
          skillFlash(`${def.name}！\n${def.skill}`);
          progressed = true;
          break;
        }
        if ((def.target || 'none') === 'none') {
          battle.enemyCost -= def.cost;
          battle.enemyHand.splice(i, 1);
          if (eff.kind === 'heal') {
            battle.enemyHp = Math.min(battle.stage.hp, battle.enemyHp + (eff.value || 0));
          } else if (eff.kind === 'draw') {
            for (let k = 0; k < (eff.value || 0); k++) {
              if (battle.enemyDeck.length) battle.enemyHand.push(battle.enemyDeck.shift());
            }
          }
          skillFlash(`${def.name}！\n${def.skill}`);
          progressed = true;
          break;
        }
      }
    }
  }
  battle.playerField = battle.playerField.map(u => (u && u.curHp <= 0) ? null : u);

  // 攻撃可能な既存ユニットで攻撃
  battle.enemyField.forEach((u, i) => {
    if (u && u.canAttack) {
      const targetIdx = battle.playerField.findIndex(p => p !== null);
      impactEffect();
      if (targetIdx !== -1) {
        const target = battle.playerField[targetIdx];
        target.curHp -= Math.max(1, u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u));
        if (target.curHp <= 0) battle.playerField[targetIdx] = null;
      } else {
        battle.playerHp -= Math.max(1, u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u));
      }
    }
  });
  battle.enemyField.forEach(u => { if (u) u.canAttack = true; });
  battle.playerField = battle.playerField.map(u => (u && u.curHp <= 0) ? null : u);

  // 次は自分のターン
  battle.turn += 1;
  battle.activeSide = 'player';
  battle.playerMaxCost = Math.min(10, battle.playerMaxCost + 1);
  battle.playerCost = battle.playerMaxCost;
  if (battle.playerDeck.length) battle.playerHand.push(battle.playerDeck.shift());
  renderBattle();
}

function showResult(won) {
  const stage = battle.stage || STAGES[0];
  gainDailyProgress();
  if (won) sfxWin(); else sfxLose();
  const el = document.getElementById('result-title');
  el.textContent = won ? 'WIN' : 'LOSE';
  el.className = won ? 'cg-result-title win' : 'cg-result-title lose';
  document.getElementById('result-stage-name').textContent = `ステージ${stage.id}　${stage.name}`;
  const delta = won ? stage.trophyDelta : -20;
  state.trophy = Math.max(0, state.trophy + delta);
  document.getElementById('result-trophy-delta').textContent = (delta > 0 ? '+' : '') + delta;
  document.getElementById('result-trophy').textContent = state.trophy.toLocaleString();
  const goldReward = won ? stage.rewardGold : 0;
  const gemReward = won ? stage.rewardGems : 0;
  if (won) {
    state.gold += goldReward; state.gems += gemReward;
    state.totalWins = (state.totalWins || 0) + 1;
    state.winProgress = Math.min(state.winMax, state.winProgress + 1);
    if (stage.id === state.stageProgress) {
      state.stageProgress = Math.min(STAGES.length, state.stageProgress + 1);
    }
    gainDragonExp(15);
  }
  saveState();
  document.getElementById('result-reward-gold').textContent = (goldReward > 0 ? '+' : '') + goldReward;
  document.getElementById('result-reward-gem').textContent = (gemReward > 0 ? '+' : '') + gemReward;

  if (won && stage.storyVictory) {
    showStory([stage.storyVictory], () => revealResultScreen(won));
  } else {
    revealResultScreen(won);
  }
}

function revealResultScreen(won) {
  const fx = document.getElementById('result-victory-fx');
  if (fx) {
    fx.classList.toggle('hidden', !won);
    if (won) {
      fx.querySelectorAll('span').forEach(s => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; });
    }
  }
  showScreen('result');
}

// ---------- カード画面（デッキ編成／カード一覧）セグメント切替 ----------
function showCollectionSegment(seg) {
  const isDeck = seg === 'deck';
  document.getElementById('seg-deck').classList.toggle('active', isDeck);
  document.getElementById('seg-list').classList.toggle('active', !isDeck);
  document.getElementById('collection-deck-view').style.display = isDeck ? '' : 'none';
  document.getElementById('collection-list-view').style.display = isDeck ? 'none' : '';
  if (isDeck) renderDeck(); else renderCardList();
}

function openCollectionScreen(seg) {
  showCollectionSegment(seg || 'deck');
  showScreen('collection');
}

// ---------- ショップ ----------
const SHOP_PACKS = [
  { id: 'normal', name: 'ノーマルパック', icon: '📦', currency: 'gold', cost: 300,
    desc: 'ノーマル〜レアが出やすい基本パック', weights: { normal: 60, rare: 30, epic: 8, legend: 2 },
    preview: ['water_slime', 'nature_wolf', 'water_golem'] },
  { id: 'rare', name: 'レアパック', icon: '🎁', currency: 'gems', cost: 10,
    desc: 'レア以上が確定で出るパック', weights: { normal: 0, rare: 65, epic: 28, legend: 7 },
    preview: ['nature_treant', 'dark_wolf', 'light_angel'] },
  { id: 'premium', name: 'プレミアムパック', icon: '👑', currency: 'gems', cost: 30,
    desc: 'エピック以上が確定で出る豪華パック', weights: { normal: 0, rare: 0, epic: 70, legend: 30 },
    preview: ['fire_dragon', 'crystal_fox', 'dark_reaper'] },
];

function pickWeightedCardId(weights) {
  const pool = [];
  Object.keys(weights).forEach(rarity => {
    const w = weights[rarity];
    if (w <= 0) return;
    Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === rarity).forEach(id => pool.push({ id, w }));
  });
  if (!pool.length) return Object.keys(CARD_DEFS)[0];
  const total = pool.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
  return pool[pool.length - 1].id;
}

function renderShop() {
  document.getElementById('shop-gold').textContent = state.gold.toLocaleString();
  document.getElementById('shop-gems').textContent = state.gems.toLocaleString();
  const wrap = document.getElementById('shop-packs');
  wrap.innerHTML = SHOP_PACKS.map(pack => {
    const currencyIcon = pack.currency === 'gold' ? '💰' : '💎';
    const affordable = state[pack.currency] >= pack.cost;
    const previewHtml = (pack.preview || []).map(id => {
      const def = CARD_DEFS[id];
      if (!def) return '';
      const rarity = RARITY[def.rarity];
      const img = def.image
        ? `<img src="${def.image}" alt="${def.name}"/>`
        : `<span>${def.emoji}</span>`;
      return `<div class="cg-pack-preview-thumb" style="border-color:${rarity.color}" title="${def.name}">${img}</div>`;
    }).join('');
    return `
      <div class="cg-pack-card">
        <div class="cg-pack-top">
          <div class="cg-pack-icon">${pack.icon}</div>
          <div class="cg-pack-info">
            <div class="cg-pack-name">${pack.name}</div>
            <div class="cg-pack-desc">${pack.desc}</div>
          </div>
          <button class="cg-btn cg-btn-main cg-pack-buy" data-pack="${pack.id}" ${affordable ? '' : 'disabled'}>${currencyIcon} ${pack.cost}</button>
        </div>
        <div class="cg-pack-preview-row">
          <span class="cg-pack-preview-label">収録例</span>
          ${previewHtml}
        </div>
      </div>`;
  }).join('');
  wrap.querySelectorAll('.cg-pack-buy').forEach(btn => {
    btn.addEventListener('click', () => buyPack(btn.dataset.pack));
  });
}

function buyPack(packId) {
  const pack = SHOP_PACKS.find(p => p.id === packId);
  if (!pack || state[pack.currency] < pack.cost) return;
  state[pack.currency] -= pack.cost;
  state.totalPacksOpened = (state.totalPacksOpened || 0) + 1;
  saveState();
  renderShop();
  renderHome();

  const cardId = pickWeightedCardId(pack.weights);
  showOpeningAnimation(pack, cardId);
}

function showOpeningAnimation(pack, cardId) {
  const overlay = document.getElementById('shop-opening-overlay');
  const inner = document.getElementById('opening-tap-zone');
  const iconEl = document.getElementById('opening-pack-icon');
  inner.classList.remove('bursting');
  iconEl.textContent = pack.icon;
  overlay.classList.remove('hidden');
  sfxTap();

  const openNow = () => {
    inner.removeEventListener('click', openNow);
    inner.classList.add('bursting');
    sfxReveal();
    setTimeout(() => {
      overlay.classList.add('hidden');
      applyPackReward(cardId);
    }, 480);
  };
  inner.addEventListener('click', openNow);
}

function applyPackReward(cardId) {
  const owned = state.cards[cardId];
  owned.count = (owned.count || 1) + 1;
  owned.exp += 20;
  let leveledUp = false;
  if (owned.exp >= 100) { owned.exp -= 100; owned.level += 1; leveledUp = true; }
  saveState();

  showReveal(cardId, leveledUp);
  renderShop();
  renderHome();
}

function showReveal(cardId, leveledUp) {
  const def = CARD_DEFS[cardId];
  const rarity = RARITY[def.rarity];
  sfxReveal();
  document.getElementById('shop-reveal-card').innerHTML = renderCardFace(cardId, { evolved: state.cards[cardId].evolved });
  document.getElementById('shop-reveal-caption').innerHTML =
    `<span style="color:${rarity.color}; font-weight:700;">${rarity.name}</span> ${def.name} を獲得！` +
    (leveledUp ? `<br>Lv.${state.cards[cardId].level} にレベルアップ！` : '<br>強化経験値+20');
  document.getElementById('shop-reveal-overlay').classList.remove('hidden');
}

function hideReveal() {
  document.getElementById('shop-reveal-overlay').classList.add('hidden');
}

// ---------- ミッション ----------
const MISSIONS = [
  { id: 'win1', title: 'はじめての勝利', desc: 'バトルに1回勝利する', target: 1, check: s => s.totalWins || 0, reward: { gold: 200 } },
  { id: 'win3', title: '勝利を重ねる', desc: 'バトルに3回勝利する', target: 3, check: s => s.totalWins || 0, reward: { gold: 500 } },
  { id: 'win10', title: '歴戦の証', desc: 'バトルに10回勝利する', target: 10, check: s => s.totalWins || 0, reward: { gems: 20 } },
  { id: 'pack1', title: '初めてのパック', desc: 'カードパックを1回開封する', target: 1, check: s => s.totalPacksOpened || 0, reward: { gems: 5 } },
  { id: 'pack5', title: 'パックコレクター', desc: 'カードパックを5回開封する', target: 5, check: s => s.totalPacksOpened || 0, reward: { gems: 15 } },
  { id: 'upgrade3', title: 'カードを鍛える', desc: 'カードを3回強化する', target: 3, check: s => s.totalUpgrades || 0, reward: { gold: 400 } },
  { id: 'deck20', title: 'デッキを整える', desc: 'デッキを20枚以上編成する', target: 20, check: s => s.deck.length, reward: { gold: 300 } },
];

function formatReward(reward) {
  const parts = [];
  if (reward.gold) parts.push(`💰${reward.gold}`);
  if (reward.gems) parts.push(`💎${reward.gems}`);
  return parts.join(' ');
}

function renderMissions() {
  const wrap = document.getElementById('mission-list');
  wrap.innerHTML = MISSIONS.map(m => {
    const progress = Math.min(m.target, m.check(state));
    const done = progress >= m.target;
    const claimed = !!state.missionsClaimed[m.id];
    const pct = Math.round((progress / m.target) * 100);
    let btnLabel = '未達成';
    let btnClass = 'cg-mission-claim';
    let disabled = 'disabled';
    if (done && !claimed) { btnLabel = '受け取る'; disabled = ''; }
    if (claimed) { btnLabel = '受取済み'; btnClass += ' claimed'; disabled = 'disabled'; }
    return `
      <div class="cg-mission-card ${done ? 'done' : ''}">
        <div class="cg-mission-top">
          <div>
            <div class="cg-mission-title">${m.title}</div>
            <div class="cg-mission-desc">${m.desc}</div>
          </div>
          <div class="cg-mission-reward">${formatReward(m.reward)}</div>
        </div>
        <div class="cg-mission-bottom">
          <div class="cg-mission-progress-track"><div class="cg-mission-progress-fill" style="width:${pct}%"></div></div>
          <div class="cg-mission-progress-label">${progress}/${m.target}</div>
          <button class="${btnClass}" data-mission="${m.id}" ${disabled}>${btnLabel}</button>
        </div>
      </div>`;
  }).join('');
  wrap.querySelectorAll('.cg-mission-claim:not(.claimed):not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => claimMission(btn.dataset.mission));
  });
}

function claimMission(missionId) {
  const m = MISSIONS.find(x => x.id === missionId);
  if (!m || state.missionsClaimed[missionId]) return;
  if (m.check(state) < m.target) return;
  state.gold += m.reward.gold || 0;
  state.gems += m.reward.gems || 0;
  state.missionsClaimed[missionId] = true;
  saveState();
  renderMissions();
  renderHome();
}

// ---------- 初期化 ----------
function init() {
  renderHome();
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cg-tab, .cg-quick-btn, .cg-btn, .cg-stage-card, .cg-help-btn')) sfxTap();
  });
  document.getElementById('nav-home').addEventListener('click', () => { renderHome(); showScreen('home'); });
  document.getElementById('nav-battle').addEventListener('click', () => { renderStageSelect(); showScreen('stage'); });
  document.getElementById('nav-cards').addEventListener('click', () => openCollectionScreen('deck'));
  document.getElementById('nav-shop').addEventListener('click', () => { renderShop(); showScreen('shop'); });
  document.getElementById('nav-mission').addEventListener('click', () => { renderMissions(); showScreen('mission'); });
  document.getElementById('quick-stage').addEventListener('click', () => { renderStageSelect(); showScreen('stage'); });
  document.getElementById('quick-cards').addEventListener('click', () => openCollectionScreen('deck'));
  document.getElementById('quick-shop').addEventListener('click', () => { renderShop(); showScreen('shop'); });
  document.getElementById('quick-mission').addEventListener('click', () => { renderMissions(); showScreen('mission'); });
  document.getElementById('quick-dragon').addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('dragon-summary').addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('dragon-feed-btn').addEventListener('click', feedDragon);
  document.getElementById('story-overlay').addEventListener('click', advanceStory);
  document.getElementById('shop-reveal-close').addEventListener('click', hideReveal);
  document.getElementById('seg-deck').addEventListener('click', () => showCollectionSegment('deck'));
  document.getElementById('seg-list').addEventListener('click', () => showCollectionSegment('list'));
  document.getElementById('auto-build-btn').addEventListener('click', autoBuildDeck);
  document.querySelectorAll('.cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setCollectionFilter(btn.dataset.filter));
  });
  document.querySelectorAll('.cg-back-btn:not(#battle-back-btn):not(.cg-back-btn-detail)').forEach(b => b.addEventListener('click', () => showScreen('home') || renderHome()));
  document.querySelectorAll('.cg-back-btn-detail').forEach(b => b.addEventListener('click', () => openCollectionScreen('list')));
  document.getElementById('battle-end-turn').addEventListener('click', endTurn);
  document.getElementById('battle-back-btn').addEventListener('click', () => {
    if (battle && !battle.over) {
      if (!confirm('対戦中です。バトルを中断してホームに戻りますか？（勝敗はつきません）')) return;
    }
    battle = null;
    showScreen('home');
    renderHome();
  });
  document.getElementById('result-rematch').addEventListener('click', () => startBattle(battle.stage));
  document.getElementById('result-home').addEventListener('click', () => { renderHome(); showScreen('home'); });
  document.getElementById('battle-help-btn').addEventListener('click', () => {
    document.getElementById('battle-help-overlay').classList.remove('hidden');
  });
  document.getElementById('battle-help-close').addEventListener('click', () => {
    document.getElementById('battle-help-overlay').classList.add('hidden');
    state.hasSeenBattleHelp = true;
    saveState();
  });
  document.getElementById('card-info-close').addEventListener('click', () => {
    document.getElementById('card-info-overlay').classList.add('hidden');
  });
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('sfx-toggle-btn').addEventListener('click', toggleSfx);
  document.getElementById('settings-close').addEventListener('click', () => {
    document.getElementById('settings-overlay').classList.add('hidden');
  });
  document.getElementById('backup-copy-btn').addEventListener('click', copyBackupCode);
  document.getElementById('backup-restore-btn').addEventListener('click', restoreBackupCode);
  document.getElementById('auth-signup-btn').addEventListener('click', handleSignUp);
  document.getElementById('auth-login-btn').addEventListener('click', handleLogin);
  document.getElementById('cloud-logout-btn').addEventListener('click', handleLogout);
  document.getElementById('cloud-sync-now-btn').addEventListener('click', () => {
    if (!window.LisNoirCloud || !window.LisNoirCloud.getUser()) return;
    setCloudSyncStatus('同期中…');
    window.LisNoirCloud.saveCloud(state)
      .then(() => setCloudSyncStatus('✅ 同期済み（' + new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + '）'))
      .catch(() => setCloudSyncStatus('⚠️ 同期に失敗しました'));
  });
  document.getElementById('daily-claim-btn').addEventListener('click', claimDailyReward);
  document.getElementById('rank-card-btn').addEventListener('click', () => { renderRanking(); showScreen('ranking'); });
  if (window.LisNoirCloud) {
    window.LisNoirCloud.onAuthChange((user) => {
      refreshCloudAuthUI(user);
      if (user) setCloudSyncStatus('☁️ ログイン中（' + user.email + '）');
    });
  }
  showScreen('home');
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hidden');
  }, 1900);
}

document.addEventListener('DOMContentLoaded', init);
