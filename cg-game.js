/* =========================================================
   カードゲーム プロトタイプ ロジック (cg-game.js)
   ========================================================= */

// ---------- 属性 ----------
const ELEMENTS = {
  fire:   { name: '火',  color: '#ff8f5c', icon: '🔥' },
  water:  { name: '水',  color: '#6ec8e8', icon: '💧' },
  nature: { name: '自然', color: '#9fd47a', icon: '🌿' },
  light:  { name: '光',  color: '#ffe08a', icon: '✨' },
  dark:   { name: '闇',  color: '#c9a8f0', icon: '🌙' },
};
// 相性サイクル: 火→自然→闇→光→水→火 (攻撃側が有利なら+2、不利なら-1)
const ELEMENT_ADVANTAGE = { fire: 'nature', nature: 'dark', dark: 'light', light: 'water', water: 'fire' };

const RARITY = {
  normal: { name: 'ノーマル', color: '#c9c2e0', glow: 'none' },
  rare:   { name: 'レア',    color: '#7ec8f0', glow: '0 0 10px #7ec8f099' },
  epic:   { name: 'エピック', color: '#c9a8f0', glow: '0 0 12px #c9a8f0aa' },
  legend: { name: 'レジェンド', color: '#ffd66b', glow: '0 0 16px #ffd66bcc' },
};

// ---------- カードマスターデータ ----------
// image: null の間はプレースホルダー（属性色グラデ+絵文字）を表示。
// 後で { image: "card-fire-dragon.png" } のように差し替えれば自動でその画像が使われる。
const CARD_DEFS = {
  fire_dragon:    { name: 'ファイアドラゴン', element: 'fire',   rarity: 'legend', cost: 5, atk: 6, hp: 10, skill: '攻撃時、敵全体に2ダメージ', image: null, emoji: '🐉' },
  fire_imp:       { name: 'フレイムインプ',   element: 'fire',   rarity: 'normal', cost: 1, atk: 2, hp: 1,  skill: '', image: null, emoji: '👹' },
  fire_phoenix:   { name: 'フェニックス',     element: 'fire',   rarity: 'epic',   cost: 4, atk: 4, hp: 5,  skill: '撃破された時、1/2のHPで復活', image: null, emoji: '🐦' },
  water_golem:    { name: 'アクアゴーレム',   element: 'water',  rarity: 'rare',   cost: 3, atk: 3, hp: 6,  skill: '場に出た時、自分のHPを2回復', image: null, emoji: '🌊' },
  water_slime:    { name: 'ブルースライム',   element: 'water',  rarity: 'normal', cost: 1, atk: 1, hp: 2,  skill: '', image: null, emoji: '🔵' },
  water_serpent:  { name: 'シーサーペント',   element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 4,  skill: '攻撃時、相手カード1体を1ターン行動不能', image: null, emoji: '🐍' },
  nature_treant:  { name: 'エンシェントツリー', element: 'nature', rarity: 'rare',  cost: 3, atk: 2, hp: 8,  skill: '毎ターン開始時、HPを1回復', image: null, emoji: '🌳' },
  nature_wolf:    { name: 'フォレストウルフ', element: 'nature', rarity: 'normal', cost: 2, atk: 3, hp: 2,  skill: '', image: null, emoji: '🐺' },
  nature_panda:   { name: 'ウォーパンダ',     element: 'nature', rarity: 'rare',   cost: 2, atk: 2, hp: 4,  skill: '', image: null, emoji: '🐼' },
  light_angel:    { name: 'ガーディアンエンジェル', element: 'light', rarity: 'epic', cost: 4, atk: 3, hp: 6, skill: '場に出た時、味方全体のHPを1回復', image: null, emoji: '👼' },
  light_unicorn:  { name: 'ホーリーユニコーン', element: 'light', rarity: 'rare',  cost: 3, atk: 3, hp: 5,  skill: '', image: null, emoji: '🦄' },
  light_cleric:   { name: 'クレリック',       element: 'light',  rarity: 'normal', cost: 2, atk: 1, hp: 3,  skill: '', image: null, emoji: '🕊️' },
  dark_wolf:      { name: 'シャドウウルフ',   element: 'dark',   rarity: 'rare',   cost: 3, atk: 4, hp: 3,  skill: '', image: null, emoji: '🐾' },
  dark_reaper:    { name: 'ソウルリーパー',   element: 'dark',   rarity: 'legend', cost: 5, atk: 5, hp: 7,  skill: '撃破時、相手のコストを1消費させる', image: null, emoji: '💀' },
  dark_ghost:     { name: 'ワンダリングゴースト', element: 'dark', rarity: 'normal', cost: 1, atk: 1, hp: 1, skill: '', image: null, emoji: '👻' },
  rock_giant:     { name: 'ロックジャイアント', element: 'nature', rarity: 'epic', cost: 5, atk: 4, hp: 9,  skill: '', image: null, emoji: '🗿' },
  storm_bird:     { name: 'サンダーホーク',   element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 3,  skill: '攻撃時、追加で1ダメージ', image: null, emoji: '🦅' },
  crystal_fox:    { name: 'クリスタルフォックス', element: 'light', rarity: 'legend', cost: 6, atk: 6, hp: 8, skill: '場に出た時、手札を1枚引く', image: null, emoji: '🦊' },

  // ---- スペルカード（即時効果・場には残らない） ----
  spell_fireball:   { name: 'ファイアボール',   element: 'fire',  rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 4 }, skill: '敵1体（または敵本体）に4ダメージ', image: null, emoji: '☄️' },
  spell_iceshard:   { name: 'アイスシャード',   element: 'water', rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 2 }, skill: '敵1体（または敵本体）に2ダメージ', image: null, emoji: '🧊' },
  spell_healing:    { name: 'ヒーリングライト', element: 'light', rarity: 'normal', cost: 2, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'heal', value: 5 }, skill: '自分のHPを5回復', image: null, emoji: '💫' },
  spell_mindsurge:  { name: 'マインドサージ',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 2 }, skill: 'カードを2枚引く', image: null, emoji: '📖' },

  // ---- 装備カード（味方モンスター1体に付与） ----
  equip_ironsword:  { name: 'アイアンソード',     element: 'fire',  rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 0 }, skill: '味方1体の攻撃力+2', image: null, emoji: '🗡️' },
  equip_shield:     { name: 'ガーディアンシールド', element: 'light', rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 0, hp: 4 }, skill: '味方1体のHP+4', image: null, emoji: '🛡️' },
  equip_dragonmail: { name: 'ドラゴンアーマー',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 3 }, skill: '味方1体の攻撃力+2・HP+3', image: null, emoji: '🎽' },
};

// ---------- 状態管理 ----------
const SAVE_KEY = 'cardgame_save_v1';

function defaultState() {
  const owned = {};
  Object.keys(CARD_DEFS).forEach(id => { owned[id] = { level: 1, exp: 0, count: 1 }; });
  return {
    playerName: 'プレイヤー',
    playerLevel: 20,
    gold: 25300,
    gems: 1250,
    trophy: 1250,
    dailyProgress: 3, dailyMax: 5,
    winProgress: 1, winMax: 3,
    totalWins: 0,
    totalPacksOpened: 0,
    totalUpgrades: 0,
    stageProgress: 1,
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
      }
    });
    return Object.assign(base, saved);
  } catch (e) {
    console.error('load failed', e);
    return defaultState();
  }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch (e) { console.error('save failed', e); }
}

let state = loadState();

// ---------- カード表示ヘルパー ----------
function cardArtStyle(def) {
  const el = ELEMENTS[def.element];
  return `background: radial-gradient(circle at 30% 20%, ${el.color}55, #14141d 75%);`;
}

function cardStatsLine(def) {
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
  return `<div class="cg-card-stats"><span class="cg-stat atk">⚔ ${def.atk}</span><span class="cg-stat hp">❤ ${def.hp}</span></div>`;
}

function renderCardFace(id, opts) {
  opts = opts || {};
  const def = CARD_DEFS[id];
  if (!def) return '';
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const small = opts.small ? ' cg-card-sm' : '';
  const img = def.image
    ? `<img src="${def.image}" alt="${def.name}" class="cg-card-img"/>`
    : `<div class="cg-card-placeholder" style="${cardArtStyle(def)}"><span>${def.emoji}</span></div>`;
  return `
    <div class="cg-card${small}" data-id="${id}" style="--rarity-color:${rarity.color}; box-shadow:${rarity.glow};">
      <div class="cg-card-cost">${def.cost}</div>
      <div class="cg-card-art">${img}</div>
      <div class="cg-card-name">${def.name}</div>
      ${cardStatsLine(def)}
      <div class="cg-card-el" style="color:${el.color}">${el.icon}</div>
    </div>`;
}

// ---------- 画面切り替え ----------
const IMMERSIVE_SCREENS = ['battle', 'card-detail', 'result']; // タブバーを隠す画面

function showScreen(name) {
  document.querySelectorAll('.cg-screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');

  const tabbar = document.getElementById('global-tabbar');
  if (tabbar) tabbar.classList.toggle('hidden', IMMERSIVE_SCREENS.includes(name));
}

// ---------- ホーム画面 ----------
function renderHome() {
  document.getElementById('home-gold').textContent = state.gold.toLocaleString();
  document.getElementById('home-gems').textContent = state.gems.toLocaleString();
  document.getElementById('home-trophy').textContent = state.trophy.toLocaleString();
  document.getElementById('home-level').textContent = 'Lv.' + state.playerLevel;
  document.getElementById('home-name').textContent = state.playerName;
  document.getElementById('daily-fill').style.width = (state.dailyProgress / state.dailyMax * 100) + '%';
  document.getElementById('daily-label').textContent = `${state.dailyProgress}/${state.dailyMax}`;
  document.getElementById('win-fill').style.width = (state.winProgress / state.winMax * 100) + '%';
  document.getElementById('win-label').textContent = `${state.winProgress}/${state.winMax}`;
}

// ---------- デッキ編成画面 ----------
function renderDeck() {
  const deckEl = document.getElementById('deck-slots');
  deckEl.innerHTML = state.deck.map(id => renderCardFace(id, { small: true })).join('') +
    (state.deck.length === 0 ? '<div class="cg-empty">デッキにカードがありません</div>' : '');
  document.getElementById('deck-count').textContent = `${state.deck.length}/30`;

  const avgCost = state.deck.length
    ? (state.deck.reduce((s, id) => s + CARD_DEFS[id].cost, 0) / state.deck.length).toFixed(1)
    : '0.0';
  document.getElementById('deck-avgcost').textContent = avgCost;

  const collEl = document.getElementById('collection-list');
  const owned = Object.keys(state.cards);
  collEl.innerHTML = owned.map(id => {
    const inDeck = state.deck.includes(id);
    return `<div class="cg-coll-item ${inDeck ? 'in-deck' : ''}" data-id="${id}">${renderCardFace(id, { small: true })}</div>`;
  }).join('');

  collEl.querySelectorAll('.cg-coll-item').forEach(node => {
    node.addEventListener('click', () => {
      const id = node.dataset.id;
      const idx = state.deck.indexOf(id);
      if (idx >= 0) state.deck.splice(idx, 1);
      else if (state.deck.length < 30) state.deck.push(id);
      saveState();
      renderDeck();
    });
  });
}

// ---------- カード一覧/詳細画面 ----------
let selectedCardId = null;

function renderCardList() {
  const listEl = document.getElementById('cardlist-grid');
  listEl.innerHTML = Object.keys(state.cards).map(id => renderCardFace(id, { small: true })).join('');
  listEl.querySelectorAll('.cg-card').forEach(node => {
    node.addEventListener('click', () => openCardDetail(node.dataset.id));
  });
}

function detailStatsBlock(def) {
  const type = def.type || 'monster';
  if (type === 'monster') {
    return `
      <div class="cg-detail-stat"><span>コスト</span><b>${def.cost}</b></div>
      <div class="cg-detail-stat"><span>攻撃力</span><b>${def.atk}</b></div>
      <div class="cg-detail-stat"><span>HP</span><b>${def.hp}</b></div>`;
  }
  return `
    <div class="cg-detail-stat"><span>コスト</span><b>${def.cost}</b></div>
    <div class="cg-detail-stat"><span>種別</span><b>${type === 'spell' ? 'スペル' : '装備'}</b></div>`;
}

function openCardDetail(id) {
  selectedCardId = id;
  const def = CARD_DEFS[id];
  const owned = state.cards[id];
  const el = ELEMENTS[def.element];
  const rarity = RARITY[def.rarity];
  document.getElementById('detail-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level">Lv.${owned.level} <span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span></div>
      <div class="cg-detail-bar"><div class="cg-detail-bar-fill" style="width:${Math.min(100, owned.exp)}%"></div></div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def)}
      </div>
      <button class="cg-btn cg-btn-main" id="detail-upgrade-btn">強化 (💰400)</button>
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
  showScreen('card-detail');
}

// ---------- バトルロジック ----------
let battle = null;

const STAGES = [
  { id: 1, name: '見習いのモンスター使い', portrait: '🧙', hp: 20,
    weights: { normal: 70, rare: 25, epic: 5, legend: 0 }, rewardGold: 80, rewardGems: 5, trophyDelta: 20 },
  { id: 2, name: '森の狩人', portrait: '🏹', hp: 24,
    weights: { normal: 50, rare: 35, epic: 13, legend: 2 }, rewardGold: 100, rewardGems: 8, trophyDelta: 25 },
  { id: 3, name: '深淵の魔導士', portrait: '🔮', hp: 28,
    weights: { normal: 30, rare: 40, epic: 25, legend: 5 }, rewardGold: 130, rewardGems: 10, trophyDelta: 28 },
  { id: 4, name: '竜の巫女', portrait: '🐲', hp: 32,
    weights: { normal: 15, rare: 35, epic: 35, legend: 15 }, rewardGold: 160, rewardGems: 14, trophyDelta: 32 },
  { id: 5, name: 'モンスター使いの女王', portrait: '👑', hp: 36,
    weights: { normal: 5, rare: 25, epic: 40, legend: 30 }, rewardGold: 220, rewardGems: 20, trophyDelta: 40 },
];

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
      startBattle(stage);
    });
  });
}

function newBattleUnit(id) {
  const def = CARD_DEFS[id];
  return { id, defId: id, def, curHp: def.hp, atkBonus: 0, hpBonus: 0, canAttack: false, justPlayed: true };
}

function buildWeightedMonsterDeck(weights, count) {
  const monsterIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') === 'monster');
  const deck = [];
  for (let i = 0; i < count; i++) {
    const id = pickWeightedCardId(weights);
    deck.push(monsterIds.includes(id) ? id : monsterIds[Math.floor(Math.random() * monsterIds.length)]);
  }
  return deck;
}

function startBattle(stage) {
  stage = stage || (battle && battle.stage) || STAGES[0];
  const playerDeck = shuffle(state.deck.length ? state.deck.slice() : Object.keys(CARD_DEFS).slice(0, 10));
  const enemyDeck = shuffle(buildWeightedMonsterDeck(stage.weights, 20));

  battle = {
    stage,
    turn: 1,
    activeSide: 'player',
    playerHp: 30, enemyHp: stage.hp,
    playerMaxCost: 1, enemyMaxCost: 1,
    playerCost: 1, enemyCost: 1,
    playerDeck, enemyDeck,
    playerHand: playerDeck.splice(0, 4),
    enemyHand: enemyDeck.splice(0, 4),
    playerField: [null, null, null, null, null],
    enemyField: [null, null, null, null, null],
    selectedHandIdx: null,
    selectedFieldIdx: null,
    log: '',
    over: false,
  };
  document.getElementById('battle-enemy-emoji').textContent = stage.portrait;
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
  setTimeout(() => showTurnBanner('YOUR TURN'), 1450);
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
}

function previewDamage(attackerUnit, defenderUnit) {
  const mult = defenderUnit ? elementMultiplier(attackerUnit.def.element, defenderUnit.def.element) : 0;
  return { dmg: Math.max(1, attackerUnit.def.atk + (attackerUnit.atkBonus || 0) + mult), mult };
}

function renderBattle() {
  if (!battle) return;
  document.getElementById('battle-turn-timer').textContent = 'ターン ' + battle.turn;
  document.getElementById('battle-player-hp').textContent = battle.playerHp;
  document.getElementById('battle-enemy-hp').textContent = battle.enemyHp;
  document.getElementById('battle-cost-fill').style.width = (battle.playerCost / 10 * 100) + '%';
  document.getElementById('battle-cost-label').textContent = `${battle.playerCost} / ${battle.playerMaxCost > 10 ? 10 : battle.playerMaxCost}`;

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
    ? `<div class="cg-field-slot filled ${battle.selectedFieldIdx === i ? 'selected' : ''}" data-side="player" data-idx="${i}">${renderCardFace(u.defId, { small: true })}<div class="cg-hp-badge">${u.curHp}</div>${u.canAttack ? '<div class="cg-ready-dot"></div>' : ''}</div>`
    : `<div class="cg-field-slot" data-side="player" data-idx="${i}"></div>`
  ).join('');

  const handEl = document.getElementById('battle-hand');
  handEl.innerHTML = battle.playerHand.map((id, i) => {
    const affordable = CARD_DEFS[id].cost <= battle.playerCost;
    return `<div class="cg-hand-card ${affordable ? '' : 'disabled'} ${battle.selectedHandIdx === i ? 'selected' : ''}" data-idx="${i}">${renderCardFace(id, { small: true })}</div>`;
  }).join('');

  const portraitPreviewEl = document.getElementById('battle-portrait-preview');
  if (previewingAttack) {
    portraitPreviewEl.textContent = `⚔${previewDamage(previewingAttack, null).dmg}`;
    portraitPreviewEl.classList.add('show');
  } else if (previewingSpell) {
    portraitPreviewEl.textContent = `✨${previewingSpell.effect.value}`;
    portraitPreviewEl.classList.add('show');
  } else {
    portraitPreviewEl.classList.remove('show');
  }

  bindBattleEvents();

  if (battle.playerHp <= 0 || battle.enemyHp <= 0) {
    battle.over = true;
    setTimeout(() => showResult(battle.playerHp > 0), 600);
  }
}

function bindBattleEvents() {
  document.querySelectorAll('#battle-hand .cg-hand-card').forEach(node => {
    node.onclick = () => {
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
      battle.selectedHandIdx = (battle.selectedHandIdx === idx) ? null : idx;
      renderBattle();
    };
  });
  document.querySelectorAll('#battle-player-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
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
  });
  document.querySelectorAll('#battle-enemy-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
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
  });
  document.getElementById('battle-enemy-portrait').onclick = () => {
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
}

function playCardFromHand(handIdx, fieldIdx) {
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost || battle.playerField[fieldIdx]) return;
  battle.playerCost -= def.cost;
  battle.playerField[fieldIdx] = newBattleUnit(id);
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
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
    battle.playerHp = Math.min(30, battle.playerHp + (eff.value || 0));
  } else if (eff.kind === 'draw') {
    for (let i = 0; i < (eff.value || 0); i++) {
      if (battle.playerDeck.length) battle.playerHand.push(battle.playerDeck.shift());
    }
  }
  if (def.skill) skillFlash(`${def.name}！\n${def.skill}`);
  battle.enemyField = battle.enemyField.map(u => (u && u.curHp <= 0) ? null : u);
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
  if (def.skill) skillFlash(`${def.name}を装備！\n${def.skill}`);
  renderBattle();
}

function attackTarget(attackerIdx, targetIdx) {
  const attacker = battle.playerField[attackerIdx];
  if (!attacker || !attacker.canAttack) return;
  const mult = targetIdx === null ? 0 : elementMultiplier(attacker.def.element, battle.enemyField[targetIdx].def.element);
  const dmg = Math.max(1, attacker.def.atk + (attacker.atkBonus || 0) + mult);
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

  // 簡易AI: 出せるモンスターカードを場が空いていれば出す（スペル/装備はAI側では未使用）
  battle.enemyHand.slice().forEach(id => {
    const def = CARD_DEFS[id];
    const emptyIdx = battle.enemyField.findIndex(s => s === null);
    if ((def.type || 'monster') === 'monster' && def.cost <= battle.enemyCost && emptyIdx !== -1) {
      battle.enemyCost -= def.cost;
      battle.enemyField[emptyIdx] = newBattleUnit(id);
      battle.enemyHand.splice(battle.enemyHand.indexOf(id), 1);
    }
  });
  // 攻撃可能な既存ユニットで攻撃
  battle.enemyField.forEach((u, i) => {
    if (u && u.canAttack) {
      const mult = elementMultiplier(u.def.element, 'none');
      const targetIdx = battle.playerField.findIndex(p => p !== null);
      impactEffect();
      if (targetIdx !== -1) {
        const target = battle.playerField[targetIdx];
        target.curHp -= Math.max(1, u.def.atk);
        if (target.curHp <= 0) battle.playerField[targetIdx] = null;
      } else {
        battle.playerHp -= u.def.atk;
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
  }
  saveState();
  document.getElementById('result-reward-gold').textContent = (goldReward > 0 ? '+' : '') + goldReward;
  document.getElementById('result-reward-gem').textContent = (gemReward > 0 ? '+' : '') + gemReward;
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
    desc: 'ノーマル〜レアが出やすい基本パック', weights: { normal: 60, rare: 30, epic: 8, legend: 2 } },
  { id: 'rare', name: 'レアパック', icon: '🎁', currency: 'gems', cost: 10,
    desc: 'レア以上が確定で出るパック', weights: { normal: 0, rare: 65, epic: 28, legend: 7 } },
  { id: 'premium', name: 'プレミアムパック', icon: '👑', currency: 'gems', cost: 30,
    desc: 'エピック以上が確定で出る豪華パック', weights: { normal: 0, rare: 0, epic: 70, legend: 30 } },
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
    return `
      <div class="cg-pack-card">
        <div class="cg-pack-icon">${pack.icon}</div>
        <div class="cg-pack-info">
          <div class="cg-pack-name">${pack.name}</div>
          <div class="cg-pack-desc">${pack.desc}</div>
        </div>
        <button class="cg-btn cg-btn-main cg-pack-buy" data-pack="${pack.id}" ${affordable ? '' : 'disabled'}>${currencyIcon} ${pack.cost}</button>
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

  const cardId = pickWeightedCardId(pack.weights);
  const owned = state.cards[cardId];
  owned.count = (owned.count || 1) + 1;
  owned.exp += 20;
  let leveledUp = false;
  if (owned.exp >= 100) { owned.exp -= 100; owned.level += 1; leveledUp = true; }
  state.totalPacksOpened = (state.totalPacksOpened || 0) + 1;
  saveState();

  showReveal(cardId, leveledUp);
  renderShop();
  renderHome();
}

function showReveal(cardId, leveledUp) {
  const def = CARD_DEFS[cardId];
  const rarity = RARITY[def.rarity];
  document.getElementById('shop-reveal-card').innerHTML = renderCardFace(cardId);
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
  document.getElementById('nav-battle').addEventListener('click', () => { renderStageSelect(); showScreen('stage'); });
  document.getElementById('nav-cards').addEventListener('click', () => openCollectionScreen('deck'));
  document.getElementById('nav-shop').addEventListener('click', () => { renderShop(); showScreen('shop'); });
  document.getElementById('nav-mission').addEventListener('click', () => { renderMissions(); showScreen('mission'); });
  document.getElementById('shop-reveal-close').addEventListener('click', hideReveal);
  document.getElementById('seg-deck').addEventListener('click', () => showCollectionSegment('deck'));
  document.getElementById('seg-list').addEventListener('click', () => showCollectionSegment('list'));
  document.querySelectorAll('.cg-back-btn:not(#battle-back-btn)').forEach(b => b.addEventListener('click', () => showScreen('home') || renderHome()));
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
  showScreen('home');
}

document.addEventListener('DOMContentLoaded', init);
