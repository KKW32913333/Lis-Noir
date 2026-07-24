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
  fire_dragon:    { name: 'フレイムドレイク', element: 'fire',   rarity: 'legend', cost: 5, atk: 6, hp: 10, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamage', value: 2 }, skill: '攻撃時、敵全体に2ダメージ', image: 'card-fire-dragon.png', emoji: '🐉' },
  fire_imp:       { name: 'フレイムインプ',   element: 'fire',   rarity: 'normal', cost: 1, atk: 2, hp: 1,  role: 'attacker', skill: '', image: 'card-fire-imp.png', emoji: '👹' },
  fire_phoenix:   { name: 'サンフェニックス', element: 'fire',   rarity: 'epic',   cost: 4, atk: 4, hp: 5,  role: 'attacker', skillTag: { trigger: 'onDeath', effect: 'reviveHalfHp' }, skill: '撃破された時、1度だけ1/2のHPで復活', image: 'card-fire-phoenix.png', emoji: '🔥' },
  water_golem:    { name: 'アクアゴーレム',   element: 'water',  rarity: 'rare',   cost: 3, atk: 3, hp: 6,  role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healSelf', value: 2 }, skill: '場に出た時、自分のHPを2回復', image: 'card-water-golem.png', emoji: '🌊' },
  water_slime:    { name: 'ブルースライム',   element: 'water',  rarity: 'normal', cost: 1, atk: 1, hp: 3,  role: 'defender', skill: '', image: 'card-water-slime.png', emoji: '🔵' },
  water_serpent:  { name: 'リヴァイアサン',   element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 4,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'stunTarget' }, skill: '攻撃時、攻撃した相手モンスターを1ターン行動不能', image: 'card-water-serpent.png', emoji: '🐍' },
  nature_treant:  { name: 'ウッドエント',     element: 'nature', rarity: 'rare',  cost: 3, atk: 2, hp: 8,  role: 'defender', skillTag: { trigger: 'turnStart', effect: 'healSelf', value: 1 }, skill: '毎ターン開始時、HPを1回復', image: 'card-nature-treant.png', emoji: '🌳' },
  nature_wolf:    { name: 'シャドウアサシン', element: 'dark', rarity: 'normal', cost: 2, atk: 3, hp: 2,  role: 'attacker', skill: '', image: 'card-nature-wolf.png', emoji: '🗡️' },
  nature_panda:   { name: 'テンペストエレメンタル', element: 'nature', rarity: 'rare', cost: 2, atk: 2, hp: 4,  role: 'defender', skill: '', image: 'card-nature-panda.png', emoji: '🌪️' },
  light_angel:    { name: 'ヴァルキリー', element: 'light', rarity: 'epic', cost: 4, atk: 5, hp: 4, role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'healAllAllies', value: 1 }, skill: '場に出た時、味方全体のHPを1回復', image: 'card-light-angel.png', emoji: '⚔️' },
  light_unicorn:  { name: 'ライトガーディアン', element: 'light', rarity: 'normal',  cost: 2, atk: 2, hp: 4,  role: 'defender', skill: '', image: 'card-light-unicorn.png', emoji: '🛡️' },
  light_cleric:   { name: 'クレリック',       element: 'light',  rarity: 'normal', cost: 2, atk: 1, hp: 3,  role: 'defender', skill: '', image: 'card-light-cleric.png', emoji: '🕊️' },
  dark_wolf:      { name: 'シャドウウルフ',   element: 'dark',   rarity: 'rare',   cost: 3, atk: 4, hp: 3,  role: 'attacker', skill: '', image: 'card-dark-wolf.png', emoji: '🐾' },
  dark_reaper:    { name: 'ブレイズデーモン', element: 'dark',   rarity: 'legend', cost: 5, atk: 5, hp: 7,  role: 'attacker', skillTag: { trigger: 'onKillAttack', effect: 'drainEnemyCost', value: 1 }, skill: '敵モンスターを撃破した時、相手のコストを1消費させる', image: 'card-dark-reaper.png', emoji: '😈' },
  dark_ghost:     { name: 'ワンダリングゴースト', element: 'dark', rarity: 'normal', cost: 1, atk: 1, hp: 4, role: 'defender', skill: '', image: 'card-dark-ghost.png', emoji: '👻' },
  rock_giant:     { name: 'グラウンドゴーレム', element: 'nature', rarity: 'epic', cost: 5, atk: 4, hp: 9,  role: 'defender', skill: '', image: 'card-rock-giant.png', emoji: '🗿' },
  storm_bird:     { name: 'サンダーイーグル', element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 3,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'extraDamage', value: 1 }, skill: '攻撃時、追加で1ダメージ', image: 'card-storm-bird.png', emoji: '🦅' },
  crystal_fox:    { name: 'クリスタルフォックス', element: 'light', rarity: 'legend', cost: 6, atk: 6, hp: 8, role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'drawCard', value: 1 }, skill: '場に出た時、カードを1枚引く', image: 'card-crystal-fox.png', emoji: '🦊' },
  water_icewolf:      { name: 'アイスウルフ',     element: 'water', rarity: 'epic',   cost: 4, atk: 5, hp: 4, role: 'attacker', skill: '', image: 'card-water-icewolf.png', emoji: '🐺' },
  nature_elfunicorn:  { name: 'エルフユニコーン', element: 'nature', rarity: 'rare',  cost: 3, atk: 4, hp: 3, role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'healAllAllies', value: 1 }, skill: '場に出た時、味方全体のHPを1回復', image: 'card-nature-elfunicorn.png', emoji: '🦄' },
  water_crystalgolem: { name: 'クリスタルゴーレム', element: 'water', rarity: 'epic', cost: 4, atk: 3, hp: 7, role: 'defender', skill: '', image: 'card-water-crystalgolem.png', emoji: '💎' },
  dark_thunderchimera:{ name: 'サンダーキマイラ', element: 'dark', rarity: 'epic',    cost: 4, atk: 6, hp: 4, role: 'attacker', skill: '', image: 'card-dark-thunderchimera.png', emoji: '⚡' },
  nature_sylph:       { name: 'シルフ',           element: 'nature', rarity: 'normal',  cost: 1, atk: 2, hp: 2, role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'drawCard', value: 1 }, skill: '場に出た時、カードを1枚引く', image: 'card-nature-sylph.png', emoji: '🧚' },
  dark_demonlord:     { name: 'デモンロード',     element: 'dark', rarity: 'legend',  cost: 6, atk: 5, hp: 9, role: 'defender', skillTag: { trigger: 'onKillAttack', effect: 'drainEnemyCost', value: 1 }, skill: '敵モンスターを撃破した時、相手のコストを1消費させる', image: 'card-dark-demonlord.png', emoji: '😈' },
  fire_magmacolossus: { name: 'マグマコロッサス', element: 'fire', rarity: 'epic',    cost: 5, atk: 4, hp: 9, role: 'defender', skillTag: { trigger: 'turnStart', effect: 'healSelf', value: 1 }, skill: '毎ターン開始時、HPを1回復', image: 'card-fire-magmacolossus.png', emoji: '🌋' },
  dark_voidreaper:        { name: 'ヴォイドリーパー',   element: 'dark', rarity: 'legend', cost: 6, atk: 7, hp: 8,  role: 'attacker', skillTag: { trigger: 'onKillAttack', effect: 'extraAttackOnKill' }, skill: '【固有】敵を撃破した時、行動終了せず続けてもう一度攻撃できる', image: 'card-dark-voidreaper.png', emoji: '💀' },
  dark_nocturnaldragon:    { name: 'ノクターナルドラゴン', element: 'dark', rarity: 'legend', cost: 7, atk: 8, hp: 10,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'novaAttack' }, skill: '【固有】攻撃時、自分の攻撃力と同じダメージを敵全体に与える', image: 'card-dark-nocturnaldragon.png', emoji: '🐉' },
  dark_lunaelf:            { name: 'ルナエルフ',         element: 'dark', rarity: 'legend', cost: 4, atk: 3, hp: 7,  role: 'defender', skillTag: { trigger: 'onPlay', effect: 'refundCost', value: 2 }, skill: '【固有】場に出た時、自分のコストを2回復する', image: 'card-dark-lunaelf.png', emoji: '🦋' },
  dark_nightmarecavalier:  { name: 'ナイトメアキャバリア', element: 'dark', rarity: 'legend', cost: 7, atk: 5, hp: 13, role: 'defender', skillTag: { trigger: 'passiveDamageReduction', value: 0.5 }, skill: '【固有】受けるダメージを常に半減する', image: 'card-dark-nightmarecavalier.png', emoji: '🛡️' },
  dark_shadowslime:        { name: 'シャドウスライム',   element: 'dark', rarity: 'legend', cost: 5, atk: 6, hp: 5,  role: 'attacker', skillTag: { trigger: 'onDeath', effect: 'deathBuffAllies', value: 2 }, skill: '【固有】撃破された時、味方全体の攻撃力を永続+2する', image: 'card-dark-shadowslime.png', emoji: '🟣' },
  spell_orbitalgrimoire:   { name: 'オービタルグリモア', element: 'dark', rarity: 'legend', cost: 5, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 3 }, skill: '【固有】カードを3枚引く', image: 'card-dark-orbitalgrimoire.png', emoji: '📖' },

  // ---- スペルカード（即時効果・場には残らない） ----
  spell_fireball:   { name: 'ファイアボール',   element: 'fire',  rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 4 }, skill: '敵1体（または敵本体）に4ダメージ', image: 'card-spell-fireball.png', emoji: '☄️' },
  spell_iceshard:   { name: 'アイスシャード',   element: 'water', rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 2 }, skill: '敵1体（または敵本体）に2ダメージ', image: 'card-spell-iceshard.png', emoji: '🧊' },
  spell_healing:    { name: 'ヒーリングライト', element: 'light', rarity: 'normal', cost: 2, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'heal', value: 5 }, skill: '自分のHPを5回復', image: 'card-spell-healing.png', emoji: '💫' },
  spell_mindsurge:  { name: 'マインドサージ',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 2 }, skill: 'カードを2枚引く', image: 'card-spell-mindsurge.png', emoji: '📖' },
  spell_apocalypse: { name: 'アポカリプス',     element: 'dark',  rarity: 'legend', cost: 6, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'wipe' }, skill: '相手の場のモンスターを全て撃破する', image: 'card-spell-apocalypse.png', emoji: '💥' },
  spell_soulbind:   { name: '封印の呪符',       element: 'dark',  rarity: 'epic',   cost: 4, atk: 0, hp: 0, type: 'spell', target: 'enemy_monster', effect: { kind: 'destroy' }, skill: '敵モンスター1体を選択して撃破する（HPに関わらず必ず撃破）', image: null, emoji: '⛓️' },

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

// ---------- リーダーカード ----------
// デッキに1体だけ設定でき、効果はそのデッキの対象属性モンスター全てに反映される
const LEADERS = {
  lisnoir_f: {
    name: 'リス・ノワール',
    skillName: 'ダークエレガンス',
    element: 'dark',
    desc: '闇属性ユニットの攻撃力を25%アップ、HPを15%アップ',
    effect: { atkPct: 0.25, hpPct: 0.15, enemyDmgPct: 0 },
    fullImage: 'leader-lisnoir-f-full.png',
    icon: 'leader-lisnoir-f-icon.png',
  },
  lisnoir_m: {
    name: 'リス・ノワール',
    skillName: 'ナイトメアドミニオン',
    element: 'dark',
    desc: '闇属性ユニットの攻撃力を25%アップ、敵全体へのダメージを15%アップ',
    effect: { atkPct: 0.25, hpPct: 0, enemyDmgPct: 0.15 },
    fullImage: 'leader-lisnoir-m-full.png',
    icon: 'leader-lisnoir-m-icon.png',
  },
};

function getActiveLeader() {
  return state.leaderId ? LEADERS[state.leaderId] : null;
}

// 対象ユニットにリーダー効果が乗るかどうか（自分のカードのみ・対象属性一致のみ）
function leaderAppliesTo(unit, isPlayerCard) {
  if (!isPlayerCard) return false;
  const leader = getActiveLeader();
  if (!leader) return false;
  return unit.def.element === leader.element;
}

// ---------- イベント限定ガチャ(チケット消費・専用プール) ----------
// ※ defaultState()から参照されるため、state初期化より前に定義する必要がある
const EVENT_GACHA_PACKS = [
  { id: 'nightlegends', name: '夜天の英雄ガチャ', icon: '🌙', currency: 'tickets', cost: 1,
    desc: 'この6体のうち、いずれか1体が必ず出現（全てレジェンド・闇属性）',
    pool: ['dark_voidreaper', 'dark_nocturnaldragon', 'dark_lunaelf', 'dark_nightmarecavalier', 'dark_shadowslime', 'spell_orbitalgrimoire'] },
];

const EVOLVE_COST = 800;
const EVOLVE_BONUS_ATK = 2;
const EVOLVE_BONUS_HP = 3;
const CARD_MAX_LEVEL = 10;

function defaultState() {
  const owned = {};
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  Object.keys(CARD_DEFS).forEach(id => {
    if (eventExclusiveIds.has(id)) return; // 期間限定ガチャ専用カードは、実際に引くまで所持しない
    owned[id] = { level: 1, exp: 0, count: 1, evolved: false };
  });
  return {
    playerName: 'プレイヤー',
    avatarIcon: '🛡️',
    avatarImage: null,
    deckPresets: [],
    leaderId: null,
    tickets: 1,
    pityCounters: {},
    compendiumRewardClaimed: false,
    battleHistory: [],
    playerLevel: 1,
    playerExp: 0,
    gold: 25300,
    gems: 1250,
    trophy: 0,
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

// ---------- プレイヤーレベル ----------
// レベルアップに必要な経験値は序盤は少なく、レベルが上がるほど徐々に増える
function expNeededForLevel(level) {
  return 20 + (level - 1) * 12;
}

function gainPlayerExp(amount) {
  state.playerExp += amount;
  let leveledUp = false;
  while (state.playerExp >= expNeededForLevel(state.playerLevel)) {
    state.playerExp -= expNeededForLevel(state.playerLevel);
    state.playerLevel += 1;
    leveledUp = true;
  }
  saveState();
  return leveledUp;
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
      .catch((err) => { console.error('cloud save failed', err); setCloudSyncStatus('⚠️ 同期に失敗しました：' + (err && err.message ? err.message : '')); });
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

function cardStatsLine(def, evolved, opts) {
  opts = opts || {};
  const type = def.type || 'monster';
  if (type === 'spell') {
    const eff = def.effect || {};
    let label = '効果';
    if (eff.kind === 'damage') label = `⚡${eff.value}`;
    else if (eff.kind === 'heal') label = `➕${eff.value}`;
    else if (eff.kind === 'draw') label = `🃏${eff.value}`;
    else if (eff.kind === 'wipe') label = `💥全体`;
    else if (eff.kind === 'destroy') label = `💀撃破`;
    return `<div class="cg-card-stats"><span class="cg-stat spell">スペル</span><span class="cg-stat spell-val">${label}</span></div>`;
  }
  if (type === 'equipment') {
    const eff = def.effect || {};
    const parts = [];
    if (eff.atk) parts.push(`ATK+${eff.atk}`);
    if (eff.hp) parts.push(`HP+${eff.hp}`);
    return `<div class="cg-card-stats"><span class="cg-stat equip">装備</span><span class="cg-stat equip-val">${parts.join(' ')}</span></div>`;
  }
  if (type === 'field') {
    const eff = def.effect || {};
    const elIcon = ELEMENTS[eff.boostElement] ? ELEMENTS[eff.boostElement].icon : '🌐';
    return `<div class="cg-card-stats"><span class="cg-stat field">フィールド</span><span class="cg-stat field-val">${elIcon}+${eff.atk}</span></div>`;
  }
  if (opts.hideStats) return ''; // バトル画面では別途バッジで表示するため、重複を避けて非表示にする
  const atk = def.atk + (evolved ? EVOLVE_BONUS_ATK : 0);
  const hp = def.hp + (evolved ? EVOLVE_BONUS_HP : 0);
  return `<div class="cg-card-stats"><span class="cg-stat atk">ATK ${atk}</span><span class="cg-stat hp">HP ${hp}</span></div>`;
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
  const isMonster = (def.type || 'monster') === 'monster';
  const roleBadge = (isMonster && !opts.battleMode)
    ? `<span class="cg-card-role ${def.role === 'defender' ? 'defender' : 'attacker'}" title="${def.role === 'defender' ? 'ディフェンダー' : 'アタッカー'}">${def.role === 'defender' ? '🛡' : '⚔'}</span>`
    : '';
  const foil = (def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : '';
  // バトル画面では、カード内表示をイラスト・コスト・ATK・HPの4情報のみに絞るため、名称・属性アイコンを省略
  const nameLine = opts.battleMode ? '' : `<div class="cg-card-name">${def.name}</div>`;
  const elLine = opts.battleMode ? '' : `<div class="cg-card-el" style="color:${el.color}">${el.icon}</div>`;
  return `
    <div class="cg-card${small}${evolvedClass}" data-id="${id}" data-rarity="${def.rarity}" style="--rarity-color:${rarity.color}; box-shadow:${rarity.glow};">
      <div class="cg-card-cost">${def.cost}</div>
      <div class="cg-card-art">${img}${opts.evolved ? '<span class="cg-card-evolved-badge">★</span>' : ''}${roleBadge}${foil}</div>
      ${nameLine}
      ${cardStatsLine(def, opts.evolved, { hideStats: opts.battleMode })}
      ${elLine}
    </div>`;
}

// ---------- 画面切り替え ----------
const IMMERSIVE_SCREENS = ['battle', 'card-detail', 'result']; // タブバーを隠す画面

const SCREEN_TAB_MAP = { home: 'nav-home', collection: 'nav-cards', stage: 'nav-battle', shop: 'nav-shop', mission: 'nav-mission' };

function showScreen(name) {
  document.querySelectorAll('.cg-screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
    requestAnimationFrame(() => { el.scrollTop = 0; });
  }

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
  // image: ランクアイコン画像ファイル名（null間は絵文字iconを表示。画像を追加したらファイル名を入れるだけで反映される）
  { name: 'ブロンズ', min: 0, icon: '🥉', image: 'rank-bronze.jpg' },
  { name: 'シルバー', min: 1001, icon: '🥈', image: 'rank-silver.jpg' },
  { name: 'ゴールド', min: 2001, icon: '🥇', image: 'rank-gold.jpg' },
  { name: 'プラチナ', min: 4001, icon: '💠', image: 'rank-platinum.jpg' },
  { name: 'ダイヤモンド', min: 6001, icon: '💎', image: 'rank-diamond.jpg' },
];

// トロフィー数からランクTierオブジェクトを取得
function getRankTier(trophy) {
  let tierIdx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) { if (trophy >= RANK_TIERS[i].min) tierIdx = i; }
  return RANK_TIERS[tierIdx];
}

// ランクアイコンを要素に描画（image指定があれば画像、無ければ絵文字で表示）
function renderRankIcon(el, tier) {
  if (!el || !tier) return;
  if (tier.image) {
    el.style.backgroundImage = `url('${tier.image}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = tier.icon || '🛡️';
  }
}

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
  document.getElementById('home-exp-fill').style.width = Math.min(100, (state.playerExp / expNeededForLevel(state.playerLevel)) * 100) + '%';
  document.getElementById('home-name').textContent = state.playerName;
  renderAvatarInto(document.getElementById('home-avatar'));
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
  renderRankIcon(document.getElementById('rank-card-avatar'), tier);
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
  renderEventBanner();
}

function renderEventBanner() {
  const banner = document.getElementById('event-banner');
  const active = getActiveEvents();
  if (!active.length) { banner.classList.add('hidden'); return; }
  const ev = active[0];
  banner.classList.remove('hidden');
  banner.innerHTML = `
    <span class="ic">${ev.portrait}</span>
    <div class="cg-event-banner-text">
      <div class="cg-event-banner-title-row">
        <span class="cg-event-banner-title">${ev.name}</span>
        <span class="cg-event-banner-badge">残り${daysRemaining(ev)}日</span>
      </div>
      <div class="cg-event-banner-sub">${active.length > 1 ? `他${active.length - 1}件開催中` : ev.desc}</div>
    </div>`;
  banner.onclick = () => { renderEventList(); showScreen('events'); };
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
  { minLevel: 20, name: '古代竜',   emoji: '🐉', glow: true },
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

// プレイヤーの最大HP：レベルに応じて成長する（レベルが上がらないとステージが進むにつれ敵HPとの差が開きすぎるため、
// プレイヤーレベル1につき+8。ドラゴン育成ボーナスは従来通り別枠で加算）
const PLAYER_HP_BASE = 30;
const PLAYER_HP_PER_LEVEL = 8;
function getPlayerMaxHp() {
  return PLAYER_HP_BASE + (state.playerLevel - 1) * PLAYER_HP_PER_LEVEL + getDragonBonusHp();
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
  const emojiEl = document.getElementById('dragon-summary-emoji');
  if (!emojiEl) return; // ホーム画面の相棒ドラゴンカードは非表示中（要素が無ければ何もしない）
  const stage = getDragonStageInfo(state.dragon.level);
  emojiEl.textContent = stage.emoji;
  document.getElementById('dragon-summary-stage').textContent = `${stage.name}・Lv.${state.dragon.level}`;
  document.getElementById('dragon-summary-fill').style.width = Math.min(100, (state.dragon.exp / DRAGON_EXP_PER_LEVEL) * 100) + '%';
}

function renderDragon() {
  const d = state.dragon;
  const stage = getDragonStageInfo(d.level);
  const emojiEl = document.getElementById('dragon-emoji');
  emojiEl.textContent = stage.emoji;
  emojiEl.classList.toggle('cg-dragon-emoji-glow', !!stage.glow);
  document.getElementById('dragon-stage-name').textContent = stage.name;
  document.getElementById('dragon-level').textContent = `Lv.${d.level}`;
  document.getElementById('dragon-exp-fill').style.width = Math.min(100, (d.exp / DRAGON_EXP_PER_LEVEL) * 100) + '%';
  document.getElementById('dragon-exp-label').textContent = `${d.exp}/${DRAGON_EXP_PER_LEVEL}`;
  document.getElementById('dragon-bonus-desc').textContent = `バトル開始時の自分のHPが +${getDragonBonusHp()}（現在の最大HP ${getPlayerMaxHp()}）`;
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
// ---------- プレイヤー設定 ----------
const AVATAR_OPTIONS = ['🛡️', '🧙‍♂️', '🧙‍♀️', '👑', '🐉', '🦊', '🌙', '✨', '💀', '👻', '🔮', '⚔️', '🏹', '🌹', '⭐'];

// アバター表示を共通化：カスタム画像があればそれを、無ければ絵文字を表示
function renderAvatarInto(el) {
  if (!el) return;
  if (state.avatarImage) {
    el.style.backgroundImage = `url('${state.avatarImage}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = state.avatarIcon || '🛡️';
  }
}

// アップロードされた画像をリサイズ・圧縮してDataURLとして返す(保存容量対策)
function resizeImageFile(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let pendingAvatarImage = undefined; // undefined=未変更, null=絵文字に戻す, string=新しい画像

function renderProfileScreen() {
  pendingAvatarImage = undefined;
  document.getElementById('profile-name-input').value = state.playerName;
  renderAvatarInto(document.getElementById('profile-avatar-preview'));
  document.getElementById('profile-save-status').textContent = '';
  const grid = document.getElementById('profile-avatar-grid');
  grid.innerHTML = AVATAR_OPTIONS.map(ic =>
    `<div class="cg-profile-avatar-opt ${(!state.avatarImage && ic === state.avatarIcon) ? 'selected' : ''}" data-icon="${ic}">${ic}</div>`
  ).join('');
  grid.querySelectorAll('.cg-profile-avatar-opt').forEach(node => {
    node.addEventListener('click', () => {
      grid.querySelectorAll('.cg-profile-avatar-opt').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      pendingAvatarImage = null; // 絵文字を選んだので画像はクリア
      const preview = document.getElementById('profile-avatar-preview');
      preview.style.backgroundImage = '';
      preview.textContent = node.dataset.icon;
    });
  });
}

async function handleAvatarUpload(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('画像ファイルを選択してください。'); return; }
  const status = document.getElementById('profile-save-status');
  status.textContent = '画像を読み込み中…';
  try {
    const dataUrl = await resizeImageFile(file, 300);
    pendingAvatarImage = dataUrl;
    document.querySelectorAll('.cg-profile-avatar-opt').forEach(n => n.classList.remove('selected'));
    const preview = document.getElementById('profile-avatar-preview');
    preview.style.backgroundImage = `url('${dataUrl}')`;
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    preview.textContent = '';
    status.textContent = '画像を選択しました。「保存」を押して確定してください。';
  } catch (e) {
    status.textContent = '画像の読み込みに失敗しました。';
  }
  fileInput.value = '';
}

function saveProfile() {
  const name = document.getElementById('profile-name-input').value.trim();
  const selected = document.querySelector('.cg-profile-avatar-opt.selected');
  const status = document.getElementById('profile-save-status');
  if (!name) { status.textContent = 'プレイヤー名を入力してください。'; return; }
  if (!confirm('保存してよいですか？')) return;
  state.playerName = name.slice(0, 12);
  if (pendingAvatarImage === null) {
    // 絵文字に戻す選択がされた場合
    state.avatarImage = null;
    if (selected) state.avatarIcon = selected.dataset.icon;
  } else if (typeof pendingAvatarImage === 'string') {
    // 新しい画像がアップロードされた場合
    state.avatarImage = pendingAvatarImage;
  } else if (selected) {
    // 画像操作なし・絵文字を選び直しただけの場合(保険)
    state.avatarIcon = selected.dataset.icon;
  }
  saveState();
  renderHome();
  status.textContent = '保存しました！';
}

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
    wrap.innerHTML = `<div class="cg-rank-list">${list.map((entry, i) => {
      const entryTier = getRankTier(entry.trophy || 0);
      const iconStyle = entryTier.image ? ` style="background-image:url('${entryTier.image}');background-size:cover;background-position:center;"` : '';
      const iconContent = entryTier.image ? '' : (entryTier.icon || '🛡️');
      return `
      <div class="cg-rank-row ${entry.uid === user.uid ? 'me' : ''}">
        <div class="cg-rank-pos">${i + 1}</div>
        <div class="cg-rank-tier-icon"${iconStyle}>${iconContent}</div>
        <div class="cg-rank-name">${entry.displayName || 'プレイヤー'}${entry.uid === user.uid ? '（あなた）' : ''}</div>
        <div class="cg-rank-trophy">🏆 ${(entry.trophy || 0).toLocaleString()}</div>
      </div>`;
    }).join('')}</div>`;
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

function renderLeaderSelect(containerId) {
  containerId = containerId || 'leader-select-row';
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const noneCard = `
    <div class="cg-leader-card ${!state.leaderId ? 'selected' : ''}" data-leader="">
      <div class="cg-leader-none-card"><span>なし</span></div>
    </div>`;
  const leaderCards = Object.keys(LEADERS).map(lid => {
    const l = LEADERS[lid];
    const selected = state.leaderId === lid;
    return `
      <div class="cg-leader-card ${selected ? 'selected' : ''}" data-leader="${lid}">
        ${selected ? '<span class="cg-leader-card-badge">設定中</span>' : ''}
        <img src="${l.icon}" alt="${l.name}">
        <div class="cg-leader-card-name">${l.name}</div>
        <div class="cg-leader-card-skill">${l.skillName}</div>
      </div>`;
  }).join('');
  wrap.innerHTML = noneCard + leaderCards;
  wrap.querySelectorAll('.cg-leader-card').forEach(node => {
    node.addEventListener('click', () => {
      if (longPressFired) { longPressFired = false; return; }
      const lid = node.dataset.leader;
      state.leaderId = lid || null;
      saveState();
      renderLeaderSelect(containerId);
      renderHome();
    });
    if (node.dataset.leader) {
      bindLongPress(node, () => showLeaderInfo(node.dataset.leader));
    }
  });
}

function showLeaderInfo(lid) {
  const l = LEADERS[lid];
  if (!l) return;
  const el = ELEMENTS[l.element];
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="background:linear-gradient(160deg,#3a1f63,#1c0f33);"><img src="${l.icon}"/></div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${l.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:var(--true-gold)">LEADER・${l.skillName}</span></div>
      <div class="cg-detail-desc">対象属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${l.desc}</div>
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
}

// ---------- デッキ内カードの並び替え(長押し→ドラッグ) ----------
let deckDragState = null; // { fromIndex, pointerId, holdTimer, moved }

function bindDeckDragReorder(deckEl) {
  deckEl.querySelectorAll('.cg-deck-slot-item').forEach(item => {
    item.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.cg-deck-remove-btn')) return; // 削除ボタンは対象外
      const idx = Number(item.dataset.index);
      const holdTimer = setTimeout(() => {
        deckDragState = { fromIndex: idx, pointerId: e.pointerId, holdTimer: null, moved: false };
        item.classList.add('dragging');
        try { item.setPointerCapture(e.pointerId); } catch (err) {}
        sfxTap();
      }, 220);
      deckDragState = { fromIndex: idx, pointerId: e.pointerId, holdTimer, moved: false };
    });

    item.addEventListener('pointermove', (e) => {
      if (!deckDragState || deckDragState.pointerId !== e.pointerId) return;
      if (deckDragState.holdTimer) return; // まだ長押し確定前
      deckDragState.moved = true;
      deckEl.querySelectorAll('.cg-deck-slot-item').forEach(s => s.classList.remove('drop-target'));
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const slot = target && target.closest('.cg-deck-slot-item');
      if (slot && Number(slot.dataset.index) !== deckDragState.fromIndex) slot.classList.add('drop-target');
    });

    const finishDrag = (e) => {
      if (!deckDragState || deckDragState.pointerId !== e.pointerId) return;
      if (deckDragState.holdTimer) clearTimeout(deckDragState.holdTimer);
      if (deckDragState.moved) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const slot = target && target.closest('.cg-deck-slot-item');
        if (slot) {
          const toIndex = Number(slot.dataset.index);
          if (toIndex !== deckDragState.fromIndex) {
            const [moved] = state.deck.splice(deckDragState.fromIndex, 1);
            state.deck.splice(toIndex, 0, moved);
            saveState();
          }
        }
      }
      deckDragState = null;
      renderDeck();
    };
    item.addEventListener('pointerup', finishDrag);
    item.addEventListener('pointercancel', () => {
      if (deckDragState && deckDragState.holdTimer) clearTimeout(deckDragState.holdTimer);
      deckDragState = null;
      deckEl.querySelectorAll('.cg-deck-slot-item').forEach(s => { s.classList.remove('dragging'); s.classList.remove('drop-target'); });
    });
  });
}

function renderDeck() {
  renderLeaderSelect();
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
  bindDeckDragReorder(deckEl);

  const avgCost = state.deck.length
    ? (state.deck.reduce((s, id) => s + CARD_DEFS[id].cost, 0) / state.deck.length).toFixed(1)
    : '0.0';
  document.getElementById('deck-avgcost').textContent = avgCost;

  renderDeckPresets();

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

// ---------- デッキ保存（プリセット） ----------
const MAX_DECK_PRESETS = 5;

function renderDeckPresets() {
  const wrap = document.getElementById('deck-preset-list');
  const presets = state.deckPresets || [];
  const saveBtn = document.getElementById('deck-preset-save-btn');
  if (saveBtn) saveBtn.disabled = presets.length >= MAX_DECK_PRESETS;
  if (!presets.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = presets.map((p, i) => `
    <div class="cg-deck-preset-item">
      <span class="cg-deck-preset-name">📁 ${p.name}</span>
      <span class="cg-deck-preset-count">${p.cards.length}枚</span>
      <button class="cg-deck-preset-load-btn" data-index="${i}">読み込む</button>
      <button class="cg-deck-preset-del-btn" data-index="${i}" aria-label="削除">🗑️</button>
    </div>`).join('');
  wrap.querySelectorAll('.cg-deck-preset-load-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      const preset = state.deckPresets[i];
      if (!preset) return;
      if (!confirm(`「${preset.name}」を読み込みます。現在編成中のデッキは上書きされます。よろしいですか？`)) return;
      state.deck = preset.cards.slice();
      saveState();
      renderDeck();
    });
  });
  wrap.querySelectorAll('.cg-deck-preset-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      const preset = state.deckPresets[i];
      if (!preset) return;
      if (!confirm(`「${preset.name}」を削除します。よろしいですか？`)) return;
      state.deckPresets.splice(i, 1);
      saveState();
      renderDeck();
    });
  });
}

function saveDeckPreset() {
  if (!state.deck.length) { alert('デッキが空です。カードを編成してから保存してください。'); return; }
  if (state.deckPresets.length >= MAX_DECK_PRESETS) { alert(`保存できるデッキは最大${MAX_DECK_PRESETS}件までです。`); return; }
  const name = prompt('デッキの名前を入力してください（例：アグロデッキ）', `デッキ${state.deckPresets.length + 1}`);
  if (!name) return;
  state.deckPresets.push({ name: name.slice(0, 16), cards: state.deck.slice() });
  saveState();
  renderDeck();
}

function setCollectionFilter(filter) {
  collectionFilter = filter;
  document.querySelectorAll('#collection-filter-tabs .cg-filter-tab').forEach(btn => {
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

const COMPENDIUM_REWARD = { gold: 2000, gems: 100, trophy: 50 };

function getEvolvedMonsterCount() {
  const monsterIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') === 'monster' && state.cards[id]);
  const evolvedCount = monsterIds.filter(id => state.cards[id].evolved).length;
  return { evolvedCount, total: monsterIds.length };
}

function renderCompendiumPanel() {
  const { evolvedCount, total } = getEvolvedMonsterCount();
  document.getElementById('compendium-count').textContent = `${evolvedCount}/${total}`;
  document.getElementById('compendium-fill').style.width = Math.min(100, (evolvedCount / total) * 100) + '%';
  const claimBtn = document.getElementById('compendium-claim-btn');
  const complete = evolvedCount >= total;
  claimBtn.classList.toggle('hidden', !complete || state.compendiumRewardClaimed);
  claimBtn.textContent = state.compendiumRewardClaimed
    ? '受取済み'
    : `🎁 コンプリート報酬を受け取る（💰${COMPENDIUM_REWARD.gold} 💎${COMPENDIUM_REWARD.gems} 🏆+${COMPENDIUM_REWARD.trophy}）`;
}

function claimCompendiumReward() {
  const { evolvedCount, total } = getEvolvedMonsterCount();
  if (evolvedCount < total || state.compendiumRewardClaimed) return;
  state.gold += COMPENDIUM_REWARD.gold;
  state.gems += COMPENDIUM_REWARD.gems;
  state.trophy += COMPENDIUM_REWARD.trophy;
  state.compendiumRewardClaimed = true;
  saveState();
  renderCompendiumPanel();
  renderHome();
}

let cardListFilter = 'all';
let cardListOrder = [];

function setCardListFilter(filter) {
  cardListFilter = filter;
  document.querySelectorAll('#cardlist-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderCardList();
}

function renderCardList() {
  renderLeaderSelect('cardlist-leader-row');
  const listEl = document.getElementById('cardlist-grid');
  const ids = Object.keys(state.cards).filter(id => {
    if (cardListFilter === 'all') return true;
    return (CARD_DEFS[id].type || 'monster') === cardListFilter;
  });
  cardListOrder = ids;
  listEl.innerHTML = ids.map(id => renderCardFace(id, { small: true, evolved: state.cards[id].evolved })).join('');
  listEl.querySelectorAll('.cg-card').forEach(node => {
    node.addEventListener('click', () => openCardDetail(node.dataset.id));
  });
  renderCompendiumPanel();
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
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${owned.evolved ? '<span class="cg-card-evolved-badge lg">★</span>' : ''}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level">Lv.${owned.level} <span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${owned.evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      <div class="cg-detail-bar"><div class="cg-detail-bar-fill" style="width:${owned.level >= CARD_MAX_LEVEL ? 100 : Math.min(100, owned.exp)}%"></div></div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def, owned.evolved)}
      </div>
      ${owned.level >= CARD_MAX_LEVEL
        ? `<div class="cg-evolve-done">Lv.${CARD_MAX_LEVEL}（最大レベル）</div>`
        : `<button class="cg-btn cg-btn-main" id="detail-upgrade-btn">強化 (💰400)</button>`}
      ${isMonster ? `
        <div class="cg-evolve-row">
          ${owned.evolved
            ? `<div class="cg-evolve-done">★ 進化済み（ATK+${EVOLVE_BONUS_ATK} HP+${EVOLVE_BONUS_HP} 適用中）</div>`
            : `<button class="cg-btn cg-evolve-btn" id="detail-evolve-btn" ${owned.level < EVOLVE_LEVEL_REQ ? 'disabled' : ''}>
                 ${owned.level < EVOLVE_LEVEL_REQ ? `進化はLv.${EVOLVE_LEVEL_REQ}で解放` : `進化 (💰${EVOLVE_COST})`}
               </button>`}
        </div>` : ''}
    </div>`;
  const upgradeBtn = document.getElementById('detail-upgrade-btn');
  if (upgradeBtn) upgradeBtn.addEventListener('click', () => {
    if (state.gold >= 400 && state.cards[id].level < CARD_MAX_LEVEL) {
      state.gold -= 400;
      state.cards[id].exp += 20;
      if (state.cards[id].exp >= 100 && state.cards[id].level < CARD_MAX_LEVEL) {
        state.cards[id].exp = 0;
        state.cards[id].level += 1;
      }
      if (state.cards[id].level >= CARD_MAX_LEVEL) state.cards[id].exp = 0;
      state.totalUpgrades = (state.totalUpgrades || 0) + 1;
      saveState();
      openCardDetail(id);
      renderHome();
    }
  });
  const evolveBtn = document.getElementById('detail-evolve-btn');
  if (evolveBtn) evolveBtn.addEventListener('click', () => evolveCard(id));

  const orderIdx = cardListOrder.indexOf(id);
  const prevBtn = document.getElementById('detail-prev-btn');
  const nextBtn = document.getElementById('detail-next-btn');
  prevBtn.disabled = orderIdx <= 0;
  nextBtn.disabled = orderIdx === -1 || orderIdx >= cardListOrder.length - 1;
  prevBtn.onclick = () => { if (orderIdx > 0) openCardDetail(cardListOrder[orderIdx - 1]); };
  nextBtn.onclick = () => { if (orderIdx !== -1 && orderIdx < cardListOrder.length - 1) openCardDetail(cardListOrder[orderIdx + 1]); };

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
  { id: 1, name: '森を彷徨う影', portrait: '🐺', hp: 14, spellChance: 0.05, bgTheme: 'forest',
    weights: { normal: 95, rare: 5, epic: 0, legend: 0 }, rewardGold: 80, rewardGems: 5, trophyDelta: 20,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '呪いを喰らう獣＝モンスターが跋扈する時代。人々は結界の内側で身を寄せ合い、外の世界を恐れながら暮らしていた。' },
      { speaker: 'ナレーター', portrait: '📖', text: '小さな村を守るため、若き調教師が今日、初めて森へと足を踏み入れる。' },
      { speaker: '調教師', portrait: '🧑', text: '……大丈夫。剣の握り方は習った。あとは、度胸だけだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '村の外れで、彷徨う影に遭遇した。低い唸り声が、木々の間から響く。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '一体、また一体。震える手で剣を構えながら、影を退けていく。' },
      { speaker: '調教師', portrait: '🧑', text: '……勝てた。本当に、勝てるんだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '束の間の平穏の中、彼は森の奥へと続く道を見つめた。' },
    ] },
  { id: 2, name: '素材集めの試練', portrait: '🍃', hp: 16, spellChance: 0.08, bgTheme: 'snow',
    weights: { normal: 80, rare: 17, epic: 3, legend: 0 }, rewardGold: 100, rewardGems: 8, trophyDelta: 25,
    storyIntro: [
      { speaker: '村長', portrait: '👴', text: 'よく戻った。噂には聞いていたが、まさか本当に森の影を退けるとはな。' },
      { speaker: '村長', portrait: '👴', text: '村を建て直すには、モンスターが落とす「呪素材」が要る。危険だが、頼めるか？' },
      { speaker: '調教師', portrait: '🧑', text: '……分かった。この村のためなら。' },
      { speaker: 'ナレーター', portrait: '📖', text: '荒れた雪原に、素材を守るモンスターの気配があった。吐く息が、白く凍りつく。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '手に入れた呪素材は、まだ温かく、確かな力を宿していた。' },
      { speaker: '調教師', portrait: '🧑', text: 'これが……呪いの結晶。なんだか、悲しい色をしている。' },
      { speaker: 'ナレーター', portrait: '📖', text: '村へ戻る足取りは、来た時より少しだけ重かった。' },
    ] },
  { id: 3, name: '深淵よりの囁き', portrait: '🔮', hp: 19, spellChance: 0.13, bgTheme: 'cave',
    weights: { normal: 55, rare: 32, epic: 11, legend: 2 }, rewardGold: 130, rewardGems: 10, trophyDelta: 28,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '洞窟の奥から、言葉にならない囁きが聞こえる。呪いに深く蝕まれたモンスターの気配だ。' },
      { speaker: '調教師', portrait: '🧑', text: '……この声、何を言っているんだ？ まるで、誰かに助けを求めているような。' },
      { speaker: 'ナレーター', portrait: '📖', text: '闇の奥で、無数の目がこちらを見つめていた。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '囁きは静まった。だが、これほどの呪いが集まる理由が、どうしても引っかかる。' },
      { speaker: '調教師', portrait: '🧑', text: 'まるで、この森全体が何かに怯えているみたいだ。' },
    ] },
  { id: 4, name: '竜の血を継ぐ者', portrait: '🐲', hp: 22, spellChance: 0.19, bgTheme: 'volcano',
    weights: { normal: 32, rare: 35, epic: 26, legend: 7 }, rewardGold: 160, rewardGems: 14, trophyDelta: 32,
    storyIntro: [
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: 'グルル……我が縄張りに踏み込むとは、良い度胸だ。' },
      { speaker: '調教師', portrait: '🧑', text: '……古き竜。伝説でしか聞いたことがない。' },
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: '人の子よ、お前もこの呪いに焼かれたいか？ ならばかかってくるがいい。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '古き竜の力もまた、呪いに触れれば牙を剥く。それでも、この地に平和が戻った。' },
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: '……ぐ……見事だ、人の子よ。この森には、まだ知らぬ強者がいる。心せよ。' },
    ] },
  { id: 5, name: '森の女王', portrait: '👑', hp: 26, spellChance: 0.26, bgTheme: 'castle',
    weights: { normal: 12, rare: 28, epic: 38, legend: 22 }, rewardGold: 220, rewardGems: 20, trophyDelta: 40,
    storyIntro: [
      { speaker: '森の女王', portrait: '👑', text: 'ここまで来たか、人の子よ。ならば見せてやろう、この森の真の姿を。' },
      { speaker: '調教師', portrait: '🧑', text: 'あなたが……この森を統べる者。なぜ、こんなにも多くのモンスターが呪われているんですか？' },
      { speaker: '森の女王', portrait: '👑', text: 'ふふ……その問いに答える資格が、お前にあるかどうか。まずは力を示せ。' },
    ],
    storyVictory: [
      { speaker: '森の女王', portrait: '👑', text: '……見事だ。だが人の子よ、覚えておくがいい。呪いの源は、まだ遥か先にある。' },
      { speaker: '森の女王', portrait: '👑', text: 'この森を抜けた先に、かつて栄えた月影の国がある。そこで、お前は真実の一端を知るだろう。' },
      { speaker: '調教師', portrait: '🧑', text: '……ありがとうございます。必ず、この呪いの正体を突き止めてみせます。' },
    ] },
  { id: 6, name: '月下の斥候', portrait: '🌙', hp: 30, spellChance: 0.22, bgTheme: 'moonshadow',
    weights: { normal: 20, rare: 32, epic: 35, legend: 13 }, rewardGold: 250, rewardGems: 22, trophyDelta: 44,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '森を抜けた先には、かつて栄えたという月影の国の廃墟が広がっていた。' },
      { speaker: '調教師', portrait: '🧑', text: '……こんなに大きな国が、なぜここまで荒れ果てているんだ。' },
      { speaker: '月下の斥候', portrait: '🌙', text: '……よそ者か。この廃墟に近づく者は、逃さない。' },
      { speaker: '調教師', portrait: '🧑', text: '待ってくれ、争うつもりはない。ただ、話が聞きたいだけなんだ。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '廃墟の奥に、まだ息づく者たちがいた。ここから、村と国の復興が始まる。' },
      { speaker: '月下の斥候', portrait: '🌙', text: '……その力、本物のようだな。良かろう、お前の話を聞こう。' },
    ] },
  { id: 7, name: '荒野の守護者', portrait: '🍃', hp: 34, spellChance: 0.25, bgTheme: 'emerald',
    weights: { normal: 14, rare: 30, epic: 38, legend: 18 }, rewardGold: 280, rewardGems: 25, trophyDelta: 48,
    storyIntro: [
      { speaker: '荒野の守護者', portrait: '🍃', text: '復興だと？ この荒野に、もう希望などない。' },
      { speaker: '調教師', portrait: '🧑', text: 'それでも、諦めたくないんだ。誰かが最初の一歩を踏み出さなければ、何も変わらない。' },
      { speaker: '荒野の守護者', portrait: '🍃', text: '……青臭い理想だ。だが、嫌いではない。力を示してみせろ。' },
    ],
    storyVictory: [
      { speaker: '荒野の守護者', portrait: '🍃', text: '……お前のような者がいるなら、まだ望みはあるのかもしれん。' },
      { speaker: '調教師', portrait: '🧑', text: '一緒に、この国を立て直そう。' },
      { speaker: '荒野の守護者', portrait: '🍃', text: 'フン……悪くない誘いだ。' },
    ] },
  { id: 8, name: '氷の試練', portrait: '❄️', hp: 38, spellChance: 0.28, bgTheme: 'frost',
    weights: { normal: 8, rare: 26, epic: 40, legend: 26 }, rewardGold: 310, rewardGems: 28, trophyDelta: 52,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '新たな仲間を迎えるには、氷の祠が課す試練を越えねばならないという。' },
      { speaker: '調教師', portrait: '🧑', text: '仲間、か。この旅を、一人だけで続けるのはもう限界だと思っていた。' },
      { speaker: 'ナレーター', portrait: '📖', text: '祠の奥から、凍てついた気配が押し寄せてくる。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '試練を越えた証に、祠は静かに光を放ち、新たな絆が芽生えた。' },
      { speaker: '調教師', portrait: '🧑', text: 'これから、よろしく頼む。一緒に、この呪いの謎を解き明かそう。' },
    ] },
  { id: 9, name: '業火の番人', portrait: '🔥', hp: 42, spellChance: 0.31, bgTheme: 'inferno2',
    weights: { normal: 5, rare: 22, epic: 40, legend: 33 }, rewardGold: 350, rewardGems: 32, trophyDelta: 58,
    storyIntro: [
      { speaker: '業火の番人', portrait: '🔥', text: '女帝様の宝を狙う者に、我が炎は容赦せぬ。' },
      { speaker: '調教師', portrait: '🧑', text: '女帝……？ この国には、まだ統治者が残っているのか。' },
      { speaker: '業火の番人', portrait: '🔥', text: 'その通り。だが、お前のような小僧に会わせるわけにはいかん。' },
    ],
    storyVictory: [
      { speaker: '業火の番人', portrait: '🔥', text: '……我が炎が届かぬとはな。女帝様に伝えよ、危険な者が来ると。' },
      { speaker: '調教師', portrait: '🧑', text: '危険なつもりはない。ただ、この国を救う手立てを探しているだけだ。' },
    ] },
  { id: 10, name: '月影の女帝', portrait: '👸', hp: 47, spellChance: 0.34, bgTheme: 'empress',
    weights: { normal: 2, rare: 16, epic: 38, legend: 44 }, rewardGold: 450, rewardGems: 45, trophyDelta: 70,
    storyIntro: [
      { speaker: '月影の女帝', portrait: '👸', text: 'よくぞここまで。復興を志す者よ、我が力、見せてやろう。' },
      { speaker: '調教師', portrait: '🧑', text: 'あなたが、この国の女帝……。なぜ国はここまで荒れ果ててしまったのですか？' },
      { speaker: '月影の女帝', portrait: '👸', text: '……その答えは、お前が力を示した後で語ろう。まずは剣を交えよ。' },
    ],
    storyVictory: [
      { speaker: '月影の女帝', portrait: '👸', text: '……見事。そなたになら話そう。この呪いの根は「四天王」、そしてその先の魔王城にある。' },
      { speaker: '月影の女帝', portrait: '👸', text: 'かつてこの国は、四天王の軍勢に呪いを撒き散らされ、滅びかけた。私が守れたのは、この程度の廃墟だけだ。' },
      { speaker: '調教師', portrait: '🧑', text: '四天王……。分かりました、必ず彼らを止めてみせます。' },
    ] },
  { id: 11, name: '四天王・爪の将', portrait: '🦅', hp: 52, spellChance: 0.36, bgTheme: 'cave',
    weights: { normal: 0, rare: 14, epic: 40, legend: 46 }, rewardGold: 500, rewardGems: 50, trophyDelta: 76,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '月影の国を越えた先、四天王が支配する領域へと足を踏み入れる。' },
      { speaker: '爪の将', portrait: '🦅', text: 'この先は魔王様の御領地。人の子が通れる道ではない。' },
      { speaker: '調教師', portrait: '🧑', text: '通してもらう。この呪いを終わらせるために、俺はここまで来たんだ。' },
      { speaker: '爪の将', portrait: '🦅', text: '……その目、嫌いではない。だが、覚悟のほどを見せてもらおう。' },
    ],
    storyVictory: [
      { speaker: '爪の将', portrait: '🦅', text: '……我が爪を退けるか。だが、我らは四人。まだ三人残っている。' },
      { speaker: '調教師', portrait: '🧑', text: '一人ずつでも構わない。必ず、全員を退けてみせる。' },
    ] },
  { id: 12, name: '四天王・鎧の将', portrait: '🐢', hp: 58, spellChance: 0.38, bgTheme: 'frost',
    weights: { normal: 0, rare: 10, epic: 40, legend: 50 }, rewardGold: 550, rewardGems: 55, trophyDelta: 82,
    storyIntro: [
      { speaker: '鎧の将', portrait: '🐢', text: 'ほう、爪の将を退けたか。だが我が鎧は、何者をも通さぬ。' },
      { speaker: '調教師', portrait: '🧑', text: 'その鎧、まるで岩そのものだ。だが、俺は退けない。' },
      { speaker: '鎧の将', portrait: '🐢', text: '若造が。防御こそ、この世で最も揺るがぬ真理よ。' },
    ],
    storyVictory: [
      { speaker: '鎧の将', portrait: '🐢', text: '……鎧が、砕けた。人の子よ、お前は本物だ。' },
      { speaker: '鎧の将', portrait: '🐢', text: 'だが油断するな。次に待つ毒の将は、我のような真っ向勝負を好まぬ。' },
    ] },
  { id: 13, name: '四天王・毒の将', portrait: '🐍', hp: 64, spellChance: 0.40, bgTheme: 'emerald',
    weights: { normal: 0, rare: 8, epic: 38, legend: 54 }, rewardGold: 600, rewardGems: 60, trophyDelta: 88,
    storyIntro: [
      { speaker: '毒の将', portrait: '🐍', text: 'シュルル……その息、いつまで保つかしらねぇ。' },
      { speaker: '調教師', portrait: '🧑', text: '……この空気、まるで毒そのものだ。気を抜いたら終わる。' },
      { speaker: '毒の将', portrait: '🐍', text: '賢い判断ね。でも、もう遅いわよ。' },
    ],
    storyVictory: [
      { speaker: '毒の将', portrait: '🐍', text: '……毒が効かぬとは。面白い人の子だこと。' },
      { speaker: '毒の将', portrait: '🐍', text: 'ふふ、気に入ったわ。炎の将によろしく伝えて。彼はあなたを歓迎しないでしょうけど。' },
    ] },
  { id: 14, name: '四天王・炎の将', portrait: '🐉', hp: 70, spellChance: 0.42, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 6, epic: 36, legend: 58 }, rewardGold: 650, rewardGems: 65, trophyDelta: 94,
    storyIntro: [
      { speaker: '炎の将', portrait: '🐉', text: '三人が敗れたと聞いた。ならば我が炎で、決着をつけよう。' },
      { speaker: '調教師', portrait: '🧑', text: 'あなたたち四天王は、なぜ魔王に仕えているんだ？' },
      { speaker: '炎の将', portrait: '🐉', text: '……問答は不要。力こそが、我らの言葉だ。' },
    ],
    storyVictory: [
      { speaker: '炎の将', portrait: '🐉', text: '……我が炎すら凌ぐか。もはや止める者はいない。魔王城へ行くがいい。' },
      { speaker: '炎の将', portrait: '🐉', text: 'だが、最後に待つ者は我らの誰よりも強い。心して行け、人の子よ。' },
    ] },
  { id: 15, name: '四天王を統べる者', portrait: '⚔️', hp: 78, spellChance: 0.45, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 4, epic: 34, legend: 62 }, rewardGold: 800, rewardGems: 80, trophyDelta: 110,
    storyIntro: [
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '四天王すべてを退けるとは……。だが我こそが、その頂点だと知れ。' },
      { speaker: '調教師', portrait: '🧑', text: 'あなたが、四天王の長。ここまで多くの仲間に出会えたのは、あなたたちのおかげでもある。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '……皮肉なことを言う。だが、その言葉に免じて、全力で相手をしよう。' },
    ],
    storyVictory: [
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '……敗北を認めよう。魔王城への門は、もう開いている。行け。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: 'そして、伝えておく。魔王もまた、望んでこの座にいるわけではないということを。' },
      { speaker: '調教師', portrait: '🧑', text: '……どういう意味だ？ 教えてくれ。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '会えば分かる。行くがいい。' },
    ] },
  { id: 16, name: '魔王城・門番', portrait: '🗿', hp: 86, spellChance: 0.47, bgTheme: 'castle',
    weights: { normal: 0, rare: 2, epic: 32, legend: 66 }, rewardGold: 850, rewardGems: 85, trophyDelta: 118,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '聳え立つ魔王城。その門を、巨大な石の番人が塞いでいた。' },
      { speaker: '調教師', portrait: '🧑', text: 'いよいよか……。この城の奥で、全ての真実が待っている。' },
      { speaker: '門番', portrait: '🗿', text: '許可なき者、通すべからず……。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '門は開いた。魔王城の内部へ、一歩ずつ近づいていく。' },
      { speaker: '調教師', portrait: '🧑', text: '……不思議と、恐怖より確信の方が強い。俺は、間違っていない。' },
    ] },
  { id: 17, name: '魔王城・呪術師', portrait: '💀', hp: 94, spellChance: 0.49, bgTheme: 'cave',
    weights: { normal: 0, rare: 2, epic: 30, legend: 68 }, rewardGold: 900, rewardGems: 90, trophyDelta: 126,
    storyIntro: [
      { speaker: '呪術師', portrait: '💀', text: 'クククッ……この城で正気を保てる者など、いはしないよ。' },
      { speaker: '調教師', portrait: '🧑', text: 'この城全体が、呪いそのものみたいだ。一体、何が起きているんだ。' },
      { speaker: '呪術師', portrait: '💀', text: 'さあ、お前もじきに分かる。その前に、私の呪詛を受けてみるがいい。' },
    ],
    storyVictory: [
      { speaker: '呪術師', portrait: '💀', text: '……私の呪詛が届かぬか。お前もまた、何かに選ばれし者か。' },
      { speaker: '呪術師', portrait: '💀', text: 'ならば教えてやろう。この城の呪いの濃さは、玉座に近づくほど増していく。心せよ。' },
    ] },
  { id: 18, name: '魔王城・処刑人', portrait: '🪓', hp: 102, spellChance: 0.51, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 30, legend: 70 }, rewardGold: 950, rewardGems: 95, trophyDelta: 134,
    storyIntro: [
      { speaker: '処刑人', portrait: '🪓', text: '魔王様に近づく者は、皆ここで終わる。お前も例外ではない。' },
      { speaker: '調教師', portrait: '🧑', text: '何人が、ここで散っていったんだ……。' },
      { speaker: '処刑人', portrait: '🪓', text: '数えるだけ無駄だ。お前も、その一人に加わるだけのこと。' },
    ],
    storyVictory: [
      { speaker: '処刑人', portrait: '🪓', text: '……この斧が、届かぬだと……。魔王様、お気をつけを……。' },
      { speaker: '調教師', portrait: '🧑', text: '……その最後の言葉、まるで魔王を案じているみたいだった。' },
    ] },
  { id: 19, name: '魔王城・影の宰相', portrait: '🕶️', hp: 110, spellChance: 0.53, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 28, legend: 72 }, rewardGold: 1000, rewardGems: 100, trophyDelta: 142,
    storyIntro: [
      { speaker: '影の宰相', portrait: '🕶️', text: 'ここまで来たか。魔王様の前に立つ最後の壁は、私だ。' },
      { speaker: '調教師', portrait: '🧑', text: '宰相……。あなたなら、この呪いの本当の理由を知っているんじゃないか？' },
      { speaker: '影の宰相', portrait: '🕶️', text: '……知っている。だが、それを語る役目は私にはない。力で示すがいい。' },
    ],
    storyVictory: [
      { speaker: '影の宰相', portrait: '🕶️', text: '……見事。だが、玉座の間で待つものを見て、お前は後悔するだろう。' },
      { speaker: '調教師', portrait: '🧑', text: '後悔なんてしない。俺は、真実を知るためにここまで来たんだ。' },
      { speaker: '影の宰相', portrait: '🕶️', text: '……その覚悟、忘れるな。行け。' },
    ] },
  { id: 20, name: '魔王', portrait: '👹', hp: 120, spellChance: 0.56, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 26, legend: 74 }, rewardGold: 1300, rewardGems: 130, trophyDelta: 170,
    storyIntro: [
      { speaker: '魔王', portrait: '👹', text: 'よくぞ辿り着いた、人の子よ。この世界の呪いの元凶……この私を倒しに来たか。' },
      { speaker: '調教師', portrait: '🧑', text: 'ああ。この呪いを終わらせるために、多くの仲間と共にここまで来た。' },
      { speaker: '魔王', portrait: '👹', text: '……そうか。ならば来るがいい。だが、覚えておけ。世界はお前が思うほど、単純ではない。' },
    ],
    storyVictory: [
      { speaker: '魔王', portrait: '👹', text: '……ぐ、あ……。だが……私を倒しても、呪いは……消えない……本当の元凶は、まだ……。' },
      { speaker: '調教師', portrait: '🧑', text: '待ってくれ！ 本当の元凶とは、一体誰のことだ！？' },
      { speaker: '魔王', portrait: '👹', text: '……女神に、会いに行け……。全ては、そこから始まった……。' },
      { speaker: 'ナレーター', portrait: '📖', text: '魔王は光の粒となって消えていった。世界中の人々が歓喜する中、調教師の胸には拭えない違和感が残った。' },
    ] },
  { id: 21, name: '崩れゆく世界', portrait: '🌑', hp: 130, spellChance: 0.58, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 24, legend: 76 }, rewardGold: 1400, rewardGems: 140, trophyDelta: 180,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '魔王を倒したはずなのに、モンスターの呪いは消えるどころか、むしろ濃くなっていく。' },
      { speaker: '調教師', portrait: '🧑', text: 'どうして……。魔王を倒せば、全てが終わるはずだったのに。' },
      { speaker: 'ナレーター', portrait: '📖', text: '世界の歪みの中から、新たな影が姿を現した。空は黒く染まり始めている。' },
      { speaker: '調教師', portrait: '🧑', text: '魔王の最後の言葉……「女神に会いに行け」。あれは、一体どういう意味だったんだ。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '倒しても倒しても、次々と現れる呪い。何かが、根本から間違っている。' },
      { speaker: '調教師', portrait: '🧑', text: '……行こう。この世界の中心にある神殿へ。全ての答えが、そこにあるはずだ。' },
    ] },
  { id: 22, name: '黒百合の巫女', portrait: '🥀', hp: 140, spellChance: 0.60, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 22, legend: 78 }, rewardGold: 1500, rewardGems: 150, trophyDelta: 190,
    storyIntro: [
      { speaker: '黒百合の巫女', portrait: '🥀', text: 'ふふ……気づいてしまったのね。この世界の呪いの、本当の意味に。' },
      { speaker: '調教師', portrait: '🧑', text: 'あなたは誰だ。この世界で何が起きているのか、知っているんだろう？' },
      { speaker: '黒百合の巫女', portrait: '🥀', text: '教えてあげる。全ての始まりは──女神様よ。' },
      { speaker: '調教師', portrait: '🧑', text: '女神……。世界を救う存在だと、伝えられてきた。それが、どうして呪いの元凶になるんだ？' },
    ],
    storyVictory: [
      { speaker: '黒百合の巫女', portrait: '🥀', text: '……もういい。あとは、あなた自身の目で確かめなさい。' },
      { speaker: '黒百合の巫女', portrait: '🥀', text: '神殿の奥、白と黒の百合が咲く場所に、全ての真実が眠っている。' },
      { speaker: '調教師', portrait: '🧑', text: '……分かった。行こう。' },
    ] },
  { id: 23, name: '記憶の断片', portrait: '🕸️', hp: 150, spellChance: 0.62, bgTheme: 'cave',
    weights: { normal: 0, rare: 0, epic: 20, legend: 80 }, rewardGold: 1600, rewardGems: 160, trophyDelta: 200,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '砕け散った記憶の欠片が、モンスターの姿となって襲いかかる。' },
      { speaker: '調教師', portrait: '🧑', text: 'これは……誰の記憶なんだ？ まるで、誰かの悲しみそのものが形になったみたいだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: 'かつて白かった百合が、なぜ黒く染まったのか──その真実が、少しずつ見えてくる。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '全ての記憶が繋がった。女神は、かつて世界を救おうとして──呪われたのだ。' },
      { speaker: '調教師', portrait: '🧑', text: '……世界を守るために、自分が犠牲になったっていうのか。そんなの、あんまりだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '彼は拳を強く握りしめ、神殿の最奥へと歩みを進めた。' },
    ] },
  { id: 24, name: '女神の影', portrait: '✨', hp: 162, spellChance: 0.64, bgTheme: 'castle',
    weights: { normal: 0, rare: 0, epic: 18, legend: 82 }, rewardGold: 1700, rewardGems: 170, trophyDelta: 210,
    storyIntro: [
      { speaker: '女神の影', portrait: '✨', text: 'ようこそ、我が最後の使者よ。あなたなら、私を止められるかしら。' },
      { speaker: '調教師', portrait: '🧑', text: '止める、じゃない。俺は、あなたを助けに来たんだ。' },
      { speaker: '女神の影', portrait: '✨', text: '……優しい嘘ね。かつて白百合だった私は、世界を守るため、自ら呪いを受け入れた。もう戻れない。' },
      { speaker: '調教師', portrait: '🧑', text: '戻れるかどうかは、まだ誰にも分からない。俺が、それを証明してみせる。' },
    ],
    storyVictory: [
      { speaker: '女神の影', portrait: '✨', text: '……ありがとう。これで、本当の私に会いに行ける。' },
      { speaker: '女神の影', portrait: '✨', text: '奥で待っているのは、もっと深く呪いに沈んだ、本当の女神の姿。覚悟して。' },
      { speaker: '調教師', portrait: '🧑', text: '……大丈夫。ここまで来た仲間たちと一緒なら、何も怖くない。' },
    ] },
  { id: 25, name: '黒百合の女神', portrait: '🖤', hp: 180, spellChance: 0.68, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 15, legend: 85 }, rewardGold: 2500, rewardGems: 250, trophyDelta: 300,
    storyIntro: [
      { speaker: '黒百合の女神', portrait: '🖤', text: '……よく来たわね、Lis Noirの継承者。私を倒せば、この呪いは終わる。それとも──赦せる？' },
      { speaker: 'ナレーター', portrait: '📖', text: '黒く染まった百合の女神。その瞳の奥には、まだ世界を想う優しさが残っていた。' },
      { speaker: '調教師', portrait: '🧑', text: '倒すつもりなんてない。俺はただ、あなたを穢れから解き放ちに来ただけだ。' },
      { speaker: '黒百合の女神', portrait: '🖤', text: '……愚かな人の子。私を救えば、その穢れごと、あなたも巻き込まれるかもしれないのに。' },
      { speaker: '調教師', portrait: '🧑', text: '構わない。一人だけが犠牲になる世界なんて、俺は絶対に認めない。' },
    ],
    storyVictory: [
      { speaker: '黒百合の女神', portrait: '🌸', text: '……ああ、光が見える。ありがとう。この世界に、もう一度「Lis Noir」を──白と黒の百合を、咲かせて。' },
      { speaker: 'ナレーター', portrait: '📖', text: '黒百合は一輪ずつ、白百合へと変わっていく。女神は初めて、心からの笑顔を見せた。' },
      { speaker: '女神', portrait: '🌸', text: 'もう、祈らなくていいの……？' },
      { speaker: '調教師', portrait: '🧑', text: 'ああ。これからは、一緒に生きよう。' },
      { speaker: 'ナレーター', portrait: '📖', text: '数年後。世界には再び、人と共存できる小さく穏やかなモンスターたちが現れるようになった。神殿の前には、黒百合と白百合が寄り添って咲いている。' },
    ] },
];

const WORLDS = [
  { id: 1, name: '見習いの森', stageIds: [1, 2, 3, 4, 5] },
  { id: 2, name: '月影の国', stageIds: [6, 7, 8, 9, 10] },
  { id: 3, name: '四天王の領域', stageIds: [11, 12, 13, 14, 15] },
  { id: 4, name: '魔王城', stageIds: [16, 17, 18, 19, 20] },
  { id: 5, name: '黒百合の真実', stageIds: [21, 22, 23, 24, 25] },
];

// ---------- イベントクエスト（期間限定） ----------
// 今後、新しいイベントを追加する場合はこの配列に1件追加するだけでOK（startDate/endDateを過ぎると自動的に非表示になる）
const EVENTS = [
  {
    id: 'launch_2026',
    name: 'オープン記念イベント',
    desc: '期間限定の特別ステージに挑戦して、豪華報酬を手に入れよう！',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    portrait: '🎉',
    bgTheme: 'empress',
    hp: 30,
    spellChance: 0.20,
    weights: { normal: 30, rare: 35, epic: 25, legend: 10 },
    rewardGold: 500,
    rewardGems: 50,
    trophyDelta: 30,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: 'どこからともなく、祝祭の花びらが舞い降りてきた。' },
      { speaker: '祝祭の精霊', portrait: '🎉', text: 'ようこそ、旅人よ。この記念すべき日を、共に祝おうではないか！' },
    ],
    storyVictory: { speaker: '祝祭の精霊', portrait: '🎉', text: '素晴らしい力だ。この特別な報酬を受け取るがいい。' },
  },
];

function getActiveEvents() {
  const now = new Date();
  return EVENTS.filter(ev => {
    const start = new Date(ev.startDate + 'T00:00:00');
    const end = new Date(ev.endDate + 'T23:59:59');
    return now >= start && now <= end;
  });
}

function daysRemaining(event) {
  const end = new Date(event.endDate + 'T23:59:59');
  const now = new Date();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

function renderEventList() {
  const wrap = document.getElementById('event-list');
  const active = getActiveEvents();
  if (!active.length) {
    wrap.innerHTML = '<div class="cg-rank-empty">現在開催中のイベントはありません。<br>また今度チェックしてみてください。</div>';
    return;
  }
  wrap.innerHTML = active.map(ev => `
    <div class="cg-stage-card cg-event-card" data-event="${ev.id}">
      <div class="cg-stage-portrait">${ev.portrait}</div>
      <div class="cg-stage-info">
        <div class="cg-stage-name">${ev.name}</div>
        <div class="cg-stage-desc">${ev.desc}</div>
        <div class="cg-event-reward">🏆+${ev.trophyDelta}　💰${ev.rewardGold}　💎${ev.rewardGems}</div>
      </div>
      <div class="cg-event-countdown">残り<br>${daysRemaining(ev)}日</div>
    </div>`).join('');
  wrap.querySelectorAll('.cg-event-card').forEach(node => {
    node.addEventListener('click', () => {
      const ev = EVENTS.find(e => e.id === node.dataset.event);
      showStory(ev.storyIntro, () => startBattle(ev));
    });
  });
}

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
  wrap.innerHTML = WORLDS.map(world => {
    const worldStages = world.stageIds.map(id => STAGES.find(s => s.id === id));
    const worldUnlocked = worldStages[0].id <= state.stageProgress;
    const stagesHtml = worldStages.map(stage => {
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
    return `
      <div class="cg-world-section">
        <div class="cg-world-header ${worldUnlocked ? '' : 'locked'}">
          <span class="cg-world-name">🗺️ ワールド${world.id}：${worldUnlocked ? world.name : '？？？'}</span>
          ${!worldUnlocked ? '<span class="cg-world-lock">🔒 未解放</span>' : ''}
        </div>
        <div class="cg-world-stages">${stagesHtml}</div>
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
  let bonusAtk = evolved ? EVOLVE_BONUS_ATK : 0;
  let bonusHp = evolved ? EVOLVE_BONUS_HP : 0;
  const leader = isPlayerCard ? getActiveLeader() : null;
  let leaderBuff = false;
  if (leader && def.element === leader.element) {
    leaderBuff = true;
    bonusAtk += Math.round((def.atk + bonusAtk) * (leader.effect.atkPct || 0));
    bonusHp += Math.round((def.hp + bonusHp) * (leader.effect.hpPct || 0));
  }
  return { id, defId: id, def, curHp: def.hp + bonusHp, atkBonus: bonusAtk, hpBonus: bonusHp, evolved, leaderBuff, canAttack: false, justPlayed: true, stunned: false, revived: false };
}

function buildWeightedMonsterDeck(weights, count, spellChance) {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const monsterIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') === 'monster' && !eventExclusiveIds.has(id));
  const otherIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') !== 'monster' && !eventExclusiveIds.has(id));
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
const BATTLE_BG_GRADIENTS = {
  forest:     'radial-gradient(ellipse 500px 400px at 50% 30%, #2d6a4444 0%, transparent 70%), linear-gradient(160deg, #0c1f14 0%, #1a3323 55%, #081008 100%)',
  snow:       'radial-gradient(ellipse 500px 400px at 50% 30%, #6fa8c944 0%, transparent 70%), linear-gradient(160deg, #101f2b 0%, #22384d 55%, #0a141c 100%)',
  cave:       'radial-gradient(ellipse 500px 400px at 50% 30%, #6b573344 0%, transparent 70%), linear-gradient(160deg, #1a1522 0%, #2e2440 55%, #0c0a12 100%)',
  volcano:    'radial-gradient(ellipse 500px 400px at 50% 30%, #b8451f44 0%, transparent 70%), linear-gradient(160deg, #260a06 0%, #4a1f0c 55%, #140402 100%)',
  castle:     'radial-gradient(ellipse 500px 400px at 50% 30%, #8a2e6e44 0%, transparent 70%), linear-gradient(160deg, #1c0f1a 0%, #3a1f30 55%, #0d0609 100%)',
  moonshadow: 'radial-gradient(ellipse 500px 400px at 50% 30%, #3a3a6644 0%, transparent 70%), linear-gradient(160deg, #14142c 0%, #23234a 55%, #0d0d1e 100%)',
  emerald:    'radial-gradient(ellipse 500px 400px at 50% 30%, #1f6b4a44 0%, transparent 70%), linear-gradient(160deg, #0d1f16 0%, #163a26 55%, #081109 100%)',
  frost:      'radial-gradient(ellipse 500px 400px at 50% 30%, #4a7a9944 0%, transparent 70%), linear-gradient(160deg, #0d1e2b 0%, #1c3a52 55%, #081018 100%)',
  inferno2:   'radial-gradient(ellipse 500px 400px at 50% 30%, #8a2e2244 0%, transparent 70%), linear-gradient(160deg, #260a06 0%, #4a150c 55%, #140402 100%)',
  empress:    'radial-gradient(ellipse 500px 400px at 50% 30%, #8A4FFF44 0%, transparent 70%), linear-gradient(160deg, #1c0f33 0%, #3a1f63 55%, #0d0619 100%)',
  purification: 'radial-gradient(ellipse 600px 450px at 50% 25%, #D9B45B55 0%, transparent 65%), radial-gradient(ellipse 500px 400px at 50% 60%, #8A4FFF44 0%, transparent 70%), linear-gradient(160deg, #241344 0%, #3a1f63 45%, #1c0f33 100%)',
};

function applyBattleBgTheme(theme) {
  const board = document.querySelector('.cg-battle-board');
  if (!board) return;
  if (BATTLE_BG_GRADIENTS[theme]) {
    board.style.backgroundImage = BATTLE_BG_GRADIENTS[theme];
    board.style.backgroundSize = 'cover';
    board.style.backgroundPosition = 'center';
    board.style.backgroundRepeat = 'no-repeat';
    return;
  }
  const img = BATTLE_BG_THEMES[theme] || BATTLE_BG_THEMES.forest;
  board.style.backgroundImage =
    `linear-gradient(180deg, #1A1725b8 0%, #1A1725d9 50%, #1A1725b8 100%), url('${img}')`;
  board.style.backgroundSize = 'cover';
  board.style.backgroundPosition = 'center';
  board.style.backgroundRepeat = 'no-repeat';
}

function applyLeaderPortraits() {
  const leader = getActiveLeader();
  const battleImg = leader ? `url('${leader.icon}')` : "url('hero-bg.jpg')";
  const vsEl = document.getElementById('vs-player-portrait');
  const battleEl = document.getElementById('battle-player-portrait');
  if (battleEl) battleEl.style.backgroundImage = battleImg;
  if (vsEl) {
    vsEl.style.backgroundImage = battleImg;
    vsEl.textContent = '';
  }
}

function startBattle(stage) {
  stage = stage || (battle && battle.stage) || STAGES[0];
  const playerDeck = shuffle(state.deck.length ? state.deck.slice() : Object.keys(state.cards).slice(0, 10));
  const enemyDeck = shuffle(buildWeightedMonsterDeck(stage.weights, 20, stage.spellChance || 0));
  const playerMaxHp = getPlayerMaxHp();

  battle = {
    stage,
    turn: 1,
    activeSide: 'player',
    playerHp: playerMaxHp, playerMaxHp: playerMaxHp, enemyHp: stage.hp,
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
  applyLeaderPortraits();
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

function impactEffect(targetEl, dmg, mult) {
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
  if (targetEl && dmg !== undefined) spawnImpactBurst(targetEl, dmg, mult);
}

function spawnImpactBurst(targetEl, dmg, mult) {
  const board = document.querySelector('.cg-battle-board');
  if (!board || !targetEl) return;
  const boardRect = board.getBoundingClientRect();
  const rect = targetEl.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - boardRect.left;
  const y = rect.top + rect.height / 2 - boardRect.top;

  const burst = document.createElement('div');
  burst.className = 'cg-impact-burst';
  burst.style.left = x + 'px';
  burst.style.top = y + 'px';
  board.appendChild(burst);
  setTimeout(() => burst.remove(), 550);

  const slash = document.createElement('div');
  slash.className = 'cg-impact-slash';
  slash.style.left = x + 'px';
  slash.style.top = y + 'px';
  board.appendChild(slash);
  setTimeout(() => slash.remove(), 420);

  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('div');
    spark.className = 'cg-impact-spark';
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.setProperty('--sa', (i * 60) + 'deg');
    board.appendChild(spark);
    setTimeout(() => spark.remove(), 500);
  }

  if (dmg !== undefined) {
    const dmgEl = document.createElement('div');
    dmgEl.className = 'cg-impact-dmg' + (mult > 0 ? ' adv' : mult < 0 ? ' dis' : '');
    dmgEl.textContent = '-' + dmg;
    dmgEl.style.left = x + 'px';
    dmgEl.style.top = y + 'px';
    board.appendChild(dmgEl);
    setTimeout(() => dmgEl.remove(), 950);
  }
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
  document.getElementById('battle-hand-count').textContent = battle.playerHand.length;
  document.getElementById('battle-pp-current').textContent = battle.playerCost;
  document.getElementById('battle-pp-max').textContent = battle.playerMaxCost > 10 ? 10 : battle.playerMaxCost;

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
  const previewingSpell = selectedSpell && (selectedSpell.type || 'monster') === 'spell' && (selectedSpell.target === 'enemy' || selectedSpell.target === 'enemy_monster') ? selectedSpell : null;
  const attackValid = previewingAttack ? getValidTargets(previewingAttack, battle.enemyField) : null;

  enemyFieldEl.innerHTML = battle.enemyField.map((u, i) => {
    let preview = '';
    let blockedCls = '';
    if (u && previewingAttack) {
      if (attackValid.indices.includes(i)) {
        const p = previewDamage(previewingAttack, u);
        const cls = p.mult > 0 ? 'adv' : p.mult < 0 ? 'dis' : '';
        preview = `<div class="cg-preview-badge ${cls}">⚔${p.dmg}</div>`;
      } else {
        blockedCls = 'blocked';
      }
    } else if (u && previewingSpell) {
      preview = previewingSpell.effect.kind === 'destroy'
        ? `<div class="cg-preview-badge destroy">💀撃破</div>`
        : `<div class="cg-preview-badge spell">✨${previewingSpell.effect.value}</div>`;
    }
    const atkVal = u ? (u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u)) : 0;
    return u
      ? `<div class="cg-field-slot filled ${blockedCls}" data-side="enemy" data-idx="${i}">${renderCardFace(u.defId, { small: true, battleMode: true })}<div class="cg-atk-badge">${atkVal}</div><div class="cg-hp-badge">${u.curHp}</div>${u.stunned ? '<div class="cg-stun-icon">💫</div>' : ''}${preview}</div>`
      : `<div class="cg-field-slot" data-side="enemy" data-idx="${i}"></div>`;
  }).join('');

  const playerFieldEl = document.getElementById('battle-player-field');
  playerFieldEl.innerHTML = battle.playerField.map((u, i) => {
    if (!u) return `<div class="cg-field-slot" data-side="player" data-idx="${i}"></div>`;
    const atkVal = u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u);
    return `<div class="cg-field-slot filled ${battle.selectedFieldIdx === i ? 'selected' : ''}" data-side="player" data-idx="${i}">${renderCardFace(u.defId, { small: true, evolved: u.evolved, battleMode: true })}<div class="cg-atk-badge">${atkVal}</div><div class="cg-hp-badge">${u.curHp}</div>${u.canAttack ? '<div class="cg-ready-dot"></div>' : ''}${u.stunned ? '<div class="cg-stun-icon">💫</div>' : ''}</div>`;
  }).join('');

  const handEl = document.getElementById('battle-hand');
  handEl.innerHTML = battle.playerHand.map((id, i) => {
    const def = CARD_DEFS[id];
    const affordable = def.cost <= battle.playerCost;
    const evolved = state.cards[id] && state.cards[id].evolved;
    const isMonster = (def.type || 'monster') === 'monster';
    let statBadges = '';
    if (isMonster) {
      const atk = def.atk + (evolved ? EVOLVE_BONUS_ATK : 0);
      const hp = def.hp + (evolved ? EVOLVE_BONUS_HP : 0);
      statBadges = `<div class="cg-atk-badge">${atk}</div><div class="cg-hp-badge">${hp}</div>`;
    }
    return `<div class="cg-hand-card ${affordable ? '' : 'disabled'} ${battle.selectedHandIdx === i ? 'selected' : ''}" data-idx="${i}">${renderCardFace(id, { small: true, evolved, battleMode: true })}${statBadges}</div>`;
  }).join('');

  const portraitPreviewEl = document.getElementById('battle-portrait-preview');
  const faceAttackReady = !!(previewingAttack && attackValid.faceAllowed) || !!previewingSpell;
  if (previewingAttack && attackValid.faceAllowed) {
    portraitPreviewEl.textContent = `⚔${previewDamage(previewingAttack, null).dmg}`;
    portraitPreviewEl.classList.add('show');
  } else if (previewingSpell) {
    portraitPreviewEl.textContent = `✨${previewingSpell.effect.value}`;
    portraitPreviewEl.classList.add('show');
  } else {
    portraitPreviewEl.classList.remove('show');
  }
  document.getElementById('battle-enemy-portrait').classList.toggle('attackable', faceAttackReady);
  document.getElementById('battle-enemy-hp-chip').classList.toggle('attackable', faceAttackReady);
  document.getElementById('battle-direct-attack-label').classList.toggle('show', faceAttackReady);
  const guardLabel = previewingAttack && !attackValid.faceAllowed && attackValid.indices.length > 0;
  document.getElementById('battle-direct-attack-label').textContent = guardLabel ? '🛡️ディフェンダーを先に攻撃' : 'タップで直接攻撃';

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
        if (type === 'monster' && !battle.playerField[idx]) {
          playCardFromHand(battle.selectedHandIdx, idx);
          return;
        }
        if (type === 'equipment' && def.target === 'friendly' && battle.playerField[idx]) {
          equipCardFromHand(battle.selectedHandIdx, idx);
          return;
        }
        // 手札のカードがこのマスに対して使えない場合は、手札の選択を解除して
        // 通常通り「このマスのモンスターを攻撃選択」の操作に切り替える
        battle.selectedHandIdx = null;
      }
      if (battle.playerField[idx] && battle.playerField[idx].canAttack) {
        battle.selectedFieldIdx = (battle.selectedFieldIdx === idx) ? null : idx;
      }
      renderBattle();
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
        if ((def.type || 'monster') === 'spell' && (def.target === 'enemy' || def.target === 'enemy_monster') && battle.enemyField[idx]) {
          castSpell(battle.selectedHandIdx, idx);
          return;
        }
        // 手札のカードがこのマスに対して使えない場合は、手札の選択を解除して
        // 通常通り「この敵モンスターを攻撃対象として選択」の操作に切り替える
        battle.selectedHandIdx = null;
      }
      if (battle.selectedFieldIdx !== null) {
        attackTarget(battle.selectedFieldIdx, idx);
      } else {
        renderBattle();
      }
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
        return;
      }
      // 手札のカードが本体攻撃に使えない場合は、手札の選択を解除して
      // 通常通り「本体を攻撃対象として選択」の操作に切り替える
      battle.selectedHandIdx = null;
    }
    if (battle.selectedFieldIdx !== null) {
      attackTarget(battle.selectedFieldIdx, null);
    } else {
      renderBattle();
    }
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
  const roleText = def.role === 'defender' ? '🛡 ディフェンダー（相手のディフェンダーしか攻撃できない）' : '⚔ アタッカー（相手にディフェンダーがいれば、それを優先攻撃）';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span></div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${roleText}</div>
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
  const roleText = type === 'monster'
    ? (def.role === 'defender' ? '🛡 ディフェンダー（相手のディフェンダーしか攻撃できない）' : '⚔ アタッカー（相手にディフェンダーがいれば、それを優先攻撃）')
    : '';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      <div class="cg-detail-desc">属性: <span style="color:${el.color}">${el.icon} ${el.name}</span></div>
      ${roleText ? `<div class="cg-detail-desc">${roleText}</div>` : ''}
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
  applySkillTag(battle.playerField[fieldIdx], 'onPlay', true);
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
    const leaderSp = getActiveLeader();
    const dmgPctSp = leaderSp ? (leaderSp.effect.enemyDmgPct || 0) : 0;
    const dmg = Math.round((eff.value || 0) * (1 + dmgPctSp));
    const targetEl = targetIdx === null
      ? document.getElementById('battle-enemy-portrait')
      : document.querySelectorAll('#battle-enemy-field .cg-field-slot')[targetIdx];
    impactEffect(targetEl, dmg, 0);
    if (targetIdx === null) {
      battle.enemyHp -= dmg;
    } else {
      const target = battle.enemyField[targetIdx];
      if (target) {
        target.curHp -= mitigateIncomingDamage(target, dmg);
        if (target.curHp <= 0) battle.enemyField[targetIdx] = null;
      }
    }
  } else if (eff.kind === 'heal') {
    battle.playerHp = Math.min(battle.playerMaxHp || 30, battle.playerHp + (eff.value || 0));
  } else if (eff.kind === 'draw') {
    for (let i = 0; i < (eff.value || 0); i++) {
      if (battle.playerDeck.length) battle.playerHand.push(battle.playerDeck.shift());
    }
  } else if (eff.kind === 'wipe') {
    battle.enemyField.forEach((u, i) => {
      if (u) {
        const targetEl = document.querySelectorAll('#battle-enemy-field .cg-field-slot')[i];
        impactEffect(targetEl, u.curHp, 0);
      }
    });
    battle.enemyField = [null, null, null, null, null];
  } else if (eff.kind === 'destroy') {
    if (targetIdx !== null) {
      const target = battle.enemyField[targetIdx];
      if (target) {
        const targetEl = document.querySelectorAll('#battle-enemy-field .cg-field-slot')[targetIdx];
        impactEffect(targetEl, target.curHp, 0);
        battle.enemyField[targetIdx] = null;
      }
    }
  }
  if (def.skill) skillFlash(`${def.name}！\n${def.skill}`);
  battle.enemyField = cleanupField(battle.enemyField);
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

// ---------- アタッカー/ディフェンダーの攻撃対象判定 ----------
// アタッカー: 相手にディフェンダーがいれば、いずれかのディフェンダーしか攻撃できない（いなければ何でも攻撃可）
// ディフェンダー: 相手のディフェンダーしか攻撃できない（相手にディフェンダーがいなければ、このターンは攻撃不可）
function getValidTargets(unit, opponentField) {
  const oppDefenderIdxs = [];
  opponentField.forEach((u, i) => { if (u && u.def.role === 'defender') oppDefenderIdxs.push(i); });
  const role = unit.def.role || 'attacker';
  if (role === 'defender') {
    return { indices: oppDefenderIdxs, faceAllowed: false };
  }
  if (oppDefenderIdxs.length > 0) {
    return { indices: oppDefenderIdxs, faceAllowed: false };
  }
  const allIdxs = [];
  opponentField.forEach((u, i) => { if (u) allIdxs.push(i); });
  return { indices: allIdxs, faceAllowed: true };
}

// ---------- モンスター固有スキルの発動処理 ----------
function applySkillTag(unit, trigger, isPlayerSide) {
  if (!unit || !unit.def || !unit.def.skillTag) return;
  const tag = unit.def.skillTag;
  if (tag.trigger !== trigger) return;
  const field = isPlayerSide ? battle.playerField : battle.enemyField;
  const hand = isPlayerSide ? battle.playerHand : battle.enemyHand;
  const deck = isPlayerSide ? battle.playerDeck : battle.enemyDeck;
  if (tag.effect === 'healSelf') {
    const maxHp = unit.def.hp + (unit.hpBonus || 0);
    unit.curHp = Math.min(maxHp, unit.curHp + tag.value);
  } else if (tag.effect === 'healAllAllies') {
    field.forEach(u => { if (u) { const maxHp = u.def.hp + (u.hpBonus || 0); u.curHp = Math.min(maxHp, u.curHp + tag.value); } });
  } else if (tag.effect === 'drawCard') {
    for (let i = 0; i < tag.value; i++) { if (deck.length) hand.push(deck.shift()); }
  } else if (tag.effect === 'refundCost') {
    if (isPlayerSide) battle.playerCost = Math.min(battle.playerMaxCost, battle.playerCost + tag.value);
    else battle.enemyCost = Math.min(battle.enemyMaxCost, battle.enemyCost + tag.value);
  }
}

// 撃破されたユニットを取り除く際、復活スキル(reviveHalfHp)を持つ場合は1度だけ半分のHPで復活させる
// 被ダメージ軽減パッシブ(passiveDamageReduction)を考慮してダメージを補正
function mitigateIncomingDamage(target, dmg) {
  const tag = target && target.def && target.def.skillTag;
  if (tag && tag.trigger === 'passiveDamageReduction') {
    return Math.max(1, Math.round(dmg * (1 - tag.value)));
  }
  return dmg;
}

function cleanupField(field) {
  return field.map(u => {
    if (!u || u.curHp > 0) return u;
    const tag = u.def.skillTag;
    if (tag && tag.effect === 'reviveHalfHp' && !u.revived) {
      const maxHp = u.def.hp + (u.hpBonus || 0);
      u.curHp = Math.max(1, Math.floor(maxHp / 2));
      u.revived = true;
      skillFlash(`${u.def.name}のスキル！\n1/2のHPで復活`);
      return u;
    }
    if (tag && tag.effect === 'deathBuffAllies') {
      field.forEach(ally => { if (ally && ally !== u && ally.curHp > 0) ally.atkBonus = (ally.atkBonus || 0) + tag.value; });
      skillFlash(`${u.def.name}のスキル！\n味方全体の攻撃力が永続+${tag.value}`);
    }
    return null;
  });
}

function attackTarget(attackerIdx, targetIdx) {
  const attacker = battle.playerField[attackerIdx];
  if (!attacker || !attacker.canAttack) return;
  const valid = getValidTargets(attacker, battle.enemyField);
  if (targetIdx === null) {
    if (!valid.faceAllowed) return;
  } else {
    if (!valid.indices.includes(targetIdx)) return;
  }
  const tag = attacker.def.skillTag;
  const mult = targetIdx === null ? 0 : elementMultiplier(attacker.def.element, battle.enemyField[targetIdx].def.element);
  const leader = getActiveLeader();
  const dmgPct = leader ? (leader.effect.enemyDmgPct || 0) : 0;
  const extraDmg = (tag && tag.effect === 'extraDamage') ? tag.value : 0;
  const dmg = Math.max(1, Math.round((attacker.def.atk + (attacker.atkBonus || 0) + fieldBonusFor(attacker) + mult) * (1 + dmgPct))) + extraDmg;
  const targetEl = targetIdx === null
    ? document.getElementById('battle-enemy-portrait')
    : document.querySelectorAll('#battle-enemy-field .cg-field-slot')[targetIdx];
  impactEffect(targetEl, dmg, mult);

  let killedSomething = false;
  if (targetIdx === null) {
    battle.enemyHp -= dmg;
  } else if (tag && tag.effect === 'novaAttack') {
    // 【固有】自分の攻撃力と同じダメージを敵全体に与える
    battle.enemyField.forEach(u => { if (u) u.curHp -= mitigateIncomingDamage(u, dmg); });
    skillFlash(`${attacker.def.name}のスキル！\n攻撃力と同じダメージを敵全体に`);
    killedSomething = battle.enemyField.some(u => u && u.curHp <= 0);
  } else {
    const target = battle.enemyField[targetIdx];
    target.curHp -= mitigateIncomingDamage(target, dmg);
    if ((tag && tag.effect === 'aoeDamage') || (attacker.def.skill && attacker.def.skill.includes('全体'))) {
      const aoeVal = (tag && tag.effect === 'aoeDamage') ? tag.value : 2;
      battle.enemyField.forEach(u => { if (u) u.curHp -= mitigateIncomingDamage(u, aoeVal); });
      skillFlash(`${attacker.def.name}のスキル！\n全ての敵に${aoeVal}ダメージ`);
    }
    const killed = target.curHp <= 0;
    killedSomething = killed;
    if (tag && tag.effect === 'stunTarget' && !killed) {
      target.stunned = true;
      skillFlash(`${attacker.def.name}のスキル！\n相手を1ターン行動不能に`);
    }
    if (killed && tag && tag.effect === 'drainEnemyCost') {
      battle.enemyCost = Math.max(0, battle.enemyCost - tag.value);
      skillFlash(`${attacker.def.name}のスキル！\n相手のコストを${tag.value}消費`);
    }
  }
  if (killedSomething && tag && tag.effect === 'extraAttackOnKill') {
    attacker.canAttack = true;
    skillFlash(`${attacker.def.name}のスキル！\n連続攻撃発動！`);
  } else {
    attacker.canAttack = false;
  }
  battle.selectedFieldIdx = null;
  battle.enemyField = cleanupField(battle.enemyField);
  renderBattle();
}

function endTurn() {
  if (!battle || battle.over) return;
  // 自分の場のユニットは次ターンから攻撃可能に（スタン中は1回だけスキップ）
  battle.playerField.forEach(u => {
    if (!u) return;
    if (u.stunned) { u.stunned = false; u.canAttack = false; }
    else { u.canAttack = true; }
  });
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
  battle.enemyField.forEach(u => applySkillTag(u, 'turnStart', false));
  battle.enemyField = cleanupField(battle.enemyField);

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
        applySkillTag(battle.enemyField[emptyIdx], 'onPlay', false);
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
        if (def.target === 'enemy' || def.target === 'enemy_monster') {
          // 'enemy_monster'：破壊対象のモンスターが場に無ければこのカードは使わない（他のカードを試す）
          if (def.target === 'enemy_monster' && !battle.playerField.some(u => u !== null)) continue;
          // AI視点の「敵」＝プレイヤー側
          battle.enemyCost -= def.cost;
          battle.enemyHand.splice(i, 1);
          if (eff.kind === 'damage') {
            const targetIdx = battle.playerField.findIndex(u => u !== null);
            const targetEl = targetIdx !== -1
              ? document.querySelectorAll('#battle-player-field .cg-field-slot')[targetIdx]
              : document.getElementById('battle-player-portrait');
            impactEffect(targetEl, eff.value, 0);
            if (targetIdx !== -1) {
              battle.playerField[targetIdx].curHp -= mitigateIncomingDamage(battle.playerField[targetIdx], eff.value);
              if (battle.playerField[targetIdx].curHp <= 0) battle.playerField[targetIdx] = null;
            } else {
              battle.playerHp -= eff.value;
            }
          } else if (eff.kind === 'destroy') {
            const targetIdx = battle.playerField.findIndex(u => u !== null);
            if (targetIdx !== -1) {
              const targetEl = document.querySelectorAll('#battle-player-field .cg-field-slot')[targetIdx];
              impactEffect(targetEl, battle.playerField[targetIdx].curHp, 0);
              battle.playerField[targetIdx] = null;
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
          } else if (eff.kind === 'wipe') {
            battle.playerField.forEach((u, k) => {
              if (u) {
                const targetEl = document.querySelectorAll('#battle-player-field .cg-field-slot')[k];
                impactEffect(targetEl, u.curHp, 0);
              }
            });
            battle.playerField = [null, null, null, null, null];
          }
          skillFlash(`${def.name}！\n${def.skill}`);
          progressed = true;
          break;
        }
      }
    }
  }
  battle.playerField = cleanupField(battle.playerField);

  // 攻撃可能な既存ユニットで攻撃（アタッカー/ディフェンダーのルールに従う）
  battle.enemyField.forEach((u, i) => {
    if (u && u.canAttack) {
      const valid = getValidTargets(u, battle.playerField);
      const tag = u.def.skillTag;
      const extraDmg = (tag && tag.effect === 'extraDamage') ? tag.value : 0;
      const dmg = Math.max(1, u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u)) + extraDmg;
      if (tag && tag.effect === 'novaAttack' && valid.indices.length > 0) {
        battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, dmg); });
        skillFlash(`${u.def.name}のスキル！\n攻撃力と同じダメージを敵全体に`);
      } else if (valid.indices.length > 0) {
        const targetIdx = valid.indices[0];
        const target = battle.playerField[targetIdx];
        const targetEl = document.querySelectorAll('#battle-player-field .cg-field-slot')[targetIdx];
        impactEffect(targetEl, dmg, 0);
        target.curHp -= mitigateIncomingDamage(target, dmg);
        if ((tag && tag.effect === 'aoeDamage') || (u.def.skill && u.def.skill.includes('全体'))) {
          const aoeVal = (tag && tag.effect === 'aoeDamage') ? tag.value : 2;
          battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, aoeVal); });
          skillFlash(`${u.def.name}のスキル！\n全ての敵に${aoeVal}ダメージ`);
        }
        const killed = target.curHp <= 0;
        if (tag && tag.effect === 'stunTarget' && !killed) target.stunned = true;
        if (killed && tag && tag.effect === 'drainEnemyCost') {
          battle.playerCost = Math.max(0, battle.playerCost - tag.value);
        }
      } else if (valid.faceAllowed) {
        const targetEl = document.getElementById('battle-player-portrait');
        impactEffect(targetEl, dmg, 0);
        battle.playerHp -= dmg;
      }
      // ディフェンダーで有効な対象がいない場合は何もせず待機
    }
  });
  battle.enemyField.forEach(u => {
    if (!u) return;
    if (u.stunned) { u.stunned = false; u.canAttack = false; }
    else { u.canAttack = true; }
  });
  battle.playerField = cleanupField(battle.playerField);

  // 次は自分のターン
  battle.turn += 1;
  battle.activeSide = 'player';
  battle.playerMaxCost = Math.min(10, battle.playerMaxCost + 1);
  battle.playerCost = battle.playerMaxCost;
  if (battle.playerDeck.length) battle.playerHand.push(battle.playerDeck.shift());
  battle.playerField.forEach(u => applySkillTag(u, 'turnStart', true));
  battle.playerField = cleanupField(battle.playerField);
  renderBattle();
}

function showResult(won) {
  const stage = battle.stage || STAGES[0];
  gainDailyProgress();
  if (won) sfxWin(); else sfxLose();
  const el = document.getElementById('result-title');
  el.textContent = won ? 'WIN' : 'LOSE';
  el.className = won ? 'cg-result-title win' : 'cg-result-title lose';
  document.getElementById('result-stage-name').textContent = typeof stage.id === 'number' ? `ステージ${stage.id}　${stage.name}` : `🎉 ${stage.name}`;
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
    if (typeof stage.id === 'number' && stage.id === state.stageProgress) {
      state.stageProgress = Math.min(STAGES.length, state.stageProgress + 1);
    }
    gainDragonExp(15);
  }
  let leveledUp = false;
  if (won) {
    const idNum = typeof stage.id === 'number' ? stage.id : 5;
    leveledUp = gainPlayerExp(10 + idNum * 6);
  }
  logBattleHistory(stage, won, delta);
  saveState();
  document.getElementById('result-reward-gold').textContent = (goldReward > 0 ? '+' : '') + goldReward;
  document.getElementById('result-reward-gem').textContent = (gemReward > 0 ? '+' : '') + gemReward;
  const levelupEl = document.getElementById('result-levelup');
  levelupEl.classList.toggle('hidden', !leveledUp);
  if (leveledUp) levelupEl.textContent = `⭐ レベルアップ！ Lv.${state.playerLevel}`;

  if (won && stage.storyVictory) {
    showStory(stage.storyVictory, () => revealResultScreen(won, stage));
  } else {
    revealResultScreen(won, stage);
  }
}

const MAX_BATTLE_HISTORY = 50;

function logBattleHistory(stage, won, trophyDelta) {
  state.battleHistory = state.battleHistory || [];
  state.battleHistory.unshift({
    name: stage.name,
    isEvent: typeof stage.id !== 'number',
    won,
    trophyDelta,
    date: Date.now(),
  });
  if (state.battleHistory.length > MAX_BATTLE_HISTORY) {
    state.battleHistory.length = MAX_BATTLE_HISTORY;
  }
}

function renderBattleHistory() {
  const history = state.battleHistory || [];
  const wins = history.filter(h => h.won).length;
  const total = history.length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  document.getElementById('history-summary').innerHTML = `
    <div class="cg-history-summary-card"><div class="cg-history-summary-value">${state.totalWins || 0}</div><div class="cg-history-summary-label">通算勝利数</div></div>
    <div class="cg-history-summary-card"><div class="cg-history-summary-value">${winRate}%</div><div class="cg-history-summary-label">勝率（直近${total}戦）</div></div>`;
  const listEl = document.getElementById('history-list');
  if (!history.length) {
    listEl.innerHTML = '<div class="cg-rank-empty">まだ対戦履歴がありません。<br>バトルに挑戦してみましょう！</div>';
    return;
  }
  listEl.innerHTML = history.map(h => {
    const d = new Date(h.date);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `
      <div class="cg-history-item ${h.won ? 'win' : 'lose'}">
        <div class="cg-history-result">${h.won ? 'WIN' : 'LOSE'}</div>
        <div class="cg-history-info">
          <div class="cg-history-stage">${h.isEvent ? '🎉 ' : ''}${h.name}</div>
          <div class="cg-history-date">${dateStr}</div>
        </div>
        <div class="cg-history-trophy ${h.won ? 'win' : 'lose'}">${h.trophyDelta > 0 ? '+' : ''}${h.trophyDelta}</div>
      </div>`;
  }).join('');
}

function revealResultScreen(won, stage) {
  const fx = document.getElementById('result-victory-fx');
  const isRareReward = won && stage && (
    (typeof stage.id === 'number' && stage.id % 5 === 0) || typeof stage.id !== 'number'
  );
  if (fx) {
    fx.classList.toggle('hidden', !won);
    fx.classList.toggle('rainbow', !!isRareReward);
    if (won) {
      fx.querySelectorAll('span').forEach(s => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; });
    }
  }
  const rareLabel = document.getElementById('result-rare-label');
  if (rareLabel) rareLabel.classList.toggle('hidden', !isRareReward);
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
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const pool = [];
  Object.keys(weights).forEach(rarity => {
    const w = weights[rarity];
    if (w <= 0) return;
    Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === rarity && !eventExclusiveIds.has(id)).forEach(id => pool.push({ id, w }));
  });
  if (!pool.length) return Object.keys(CARD_DEFS)[0];
  const total = pool.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
  return pool[pool.length - 1].id;
}

function renderPackCard(pack) {
  const currencyIcon = pack.currency === 'gold' ? '💰' : pack.currency === 'gems' ? '💎' : '🎫';
  const affordable = state[pack.currency] >= pack.cost;
  const affordable10 = state[pack.currency] >= pack.cost * 10;
  const show10 = !pack.pool; // 固定プールの期間限定ガチャ（チケット制）は10連非対応
  const previewIds = pack.pool || pack.preview || [];
  const previewHtml = previewIds.map(id => {
    const def = CARD_DEFS[id];
    if (!def) return '';
    const rarity = RARITY[def.rarity];
    const img = def.image
      ? `<img src="${def.image}" alt="${def.name}"/>`
      : `<span>${def.emoji}</span>`;
    return `<div class="cg-pack-preview-thumb" style="border-color:${rarity.color}" title="${def.name}">${img}</div>`;
  }).join('');
  const pityCount = (state.pityCounters && state.pityCounters[pack.id]) || 0;
  const pityRemain = Math.max(0, PITY_LIMIT - pityCount);
  const showPity = !pack.pool && pack.weights.normal > 0; // 固定プールのガチャ・ノーマルが出ないパックには天井表示不要
  return `
      <div class="cg-pack-card">
        <div class="cg-pack-top">
          <div class="cg-pack-icon">${pack.icon}</div>
          <div class="cg-pack-info">
            <div class="cg-pack-name">${pack.name}</div>
            <div class="cg-pack-desc">${pack.desc}</div>
          </div>
        </div>
        ${showPity ? `<div class="cg-pack-pity">🎯 あと${pityRemain}回でレア以上確定</div>` : ''}
        <div class="cg-pack-buy-row">
          <button class="cg-btn cg-btn-main cg-pack-buy" data-pack="${pack.id}" data-times="1" ${affordable ? '' : 'disabled'}>${currencyIcon} ${pack.cost}</button>
          ${show10 ? `<button class="cg-btn cg-pack-buy cg-pack-buy10" data-pack="${pack.id}" data-times="10" ${affordable10 ? '' : 'disabled'}>10連　${currencyIcon} ${pack.cost * 10}</button>` : ''}
        </div>
        <div class="cg-pack-preview-row">
          <span class="cg-pack-preview-label">${pack.pool ? '収録カード' : '収録例'}</span>
          ${previewHtml}
        </div>
      </div>`;
}

function renderShop() {
  document.getElementById('shop-gold').textContent = state.gold.toLocaleString();
  document.getElementById('shop-gems').textContent = state.gems.toLocaleString();
  const ticketEl = document.getElementById('shop-tickets');
  if (ticketEl) ticketEl.textContent = (state.tickets || 0).toLocaleString();

  const eventWrap = document.getElementById('shop-event-packs');
  if (eventWrap) {
    eventWrap.innerHTML = EVENT_GACHA_PACKS.map(renderPackCard).join('');
    eventWrap.querySelectorAll('.cg-pack-buy').forEach(btn => {
      btn.addEventListener('click', () => buyPack(btn.dataset.pack, Number(btn.dataset.times) || 1));
    });
  }

  const wrap = document.getElementById('shop-packs');
  wrap.innerHTML = SHOP_PACKS.map(renderPackCard).join('');
  wrap.querySelectorAll('.cg-pack-buy').forEach(btn => {
    btn.addEventListener('click', () => buyPack(btn.dataset.pack, Number(btn.dataset.times) || 1));
  });
}

// ---------- ガチャの天井（保証） ----------
const PITY_LIMIT = 10; // このパックで10回連続ノーマルが出たら、次回はレア以上を確定でプレゼント

function pickCardForPack(pack) {
  // 固定プールから均等な確率で1枚選ぶ専用ガチャ(天井システム対象外)
  if (pack.pool) {
    return pack.pool[Math.floor(Math.random() * pack.pool.length)];
  }
  state.pityCounters = state.pityCounters || {};
  const count = state.pityCounters[pack.id] || 0;
  let cardId;
  if (count >= PITY_LIMIT - 1) {
    const w = pack.weights;
    const guaranteed = { normal: 0, rare: w.rare || 50, epic: w.epic || 35, legend: w.legend || 15 };
    cardId = pickWeightedCardId(guaranteed);
  } else {
    cardId = pickWeightedCardId(pack.weights);
  }
  const rarity = CARD_DEFS[cardId].rarity;
  state.pityCounters[pack.id] = (rarity === 'normal') ? count + 1 : 0;
  saveState();
  return cardId;
}

function buyPack(packId, times) {
  times = times || 1;
  const pack = SHOP_PACKS.find(p => p.id === packId) || EVENT_GACHA_PACKS.find(p => p.id === packId);
  if (!pack) return;
  const totalCost = pack.cost * times;
  if (state[pack.currency] < totalCost) return;
  state[pack.currency] -= totalCost;
  state.totalPacksOpened = (state.totalPacksOpened || 0) + times;
  saveState();
  renderShop();
  renderHome();

  const cardIds = [];
  for (let i = 0; i < times; i++) cardIds.push(pickCardForPack(pack));
  showOpeningAnimation(pack, cardIds);
}

function showOpeningAnimation(pack, cardIds) {
  const overlay = document.getElementById('shop-opening-overlay');
  const inner = document.getElementById('opening-tap-zone');
  const iconEl = document.getElementById('opening-pack-icon');
  inner.classList.remove('bursting');
  iconEl.textContent = pack.icon;

  // 獲得カードの中で最も高いレアリティに応じて、演出のグレード（発光色・激しさ）を変える
  const rarityOrder = ['normal', 'rare', 'epic', 'legend'];
  const bestRarity = cardIds.reduce((best, id) => {
    const r = CARD_DEFS[id].rarity;
    return rarityOrder.indexOf(r) > rarityOrder.indexOf(best) ? r : best;
  }, 'normal');
  inner.dataset.rarity = bestRarity;
  document.getElementById('opening-hint-text').textContent = cardIds.length > 1 ? 'タップして10連開封！' : 'タップして開封！';

  overlay.classList.remove('hidden');
  sfxTap();

  const openNow = () => {
    inner.removeEventListener('click', openNow);
    inner.classList.add('bursting');
    document.getElementById('opening-flash').classList.add('flash');
    sfxReveal();
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.getElementById('opening-flash').classList.remove('flash');
      applyPackRewards(cardIds);
    }, 480);
  };
  inner.addEventListener('click', openNow);
}

function applyPackRewards(cardIds) {
  const results = cardIds.map(cardId => {
    const isNew = !state.cards[cardId];
    if (isNew) state.cards[cardId] = { level: 1, exp: 0, count: 0, evolved: false };
    const owned = state.cards[cardId];
    owned.count = (owned.count || 1) + 1;
    let leveledUp = false;
    if (!isNew && owned.level < CARD_MAX_LEVEL) {
      owned.exp += 20;
      if (owned.exp >= 100) {
        owned.exp = 0;
        owned.level += 1;
        leveledUp = true;
        if (owned.level >= CARD_MAX_LEVEL) owned.exp = 0;
      }
    }
    return { cardId, isNew, leveledUp };
  });
  saveState();

  if (results.length === 1) {
    showReveal(results[0].cardId, results[0].leveledUp, results[0].isNew);
  } else {
    showRevealMulti(results);
  }
  renderShop();
  renderHome();
}

function showReveal(cardId, leveledUp, isNew) {
  const def = CARD_DEFS[cardId];
  const rarity = RARITY[def.rarity];
  sfxReveal();
  document.getElementById('shop-reveal-label').textContent = '獲得！';
  document.getElementById('shop-reveal-single').classList.remove('hidden');
  document.getElementById('shop-reveal-grid').classList.add('hidden');
  document.getElementById('shop-reveal-card').innerHTML = renderCardFace(cardId, { evolved: state.cards[cardId].evolved });
  const subLine = isNew ? '<br>✨NEW！ カード一覧に追加されました' : (leveledUp ? `<br>Lv.${state.cards[cardId].level} にレベルアップ！` : '<br>強化経験値+20');
  document.getElementById('shop-reveal-caption').innerHTML =
    `<span style="color:${rarity.color}; font-weight:800;">${rarity.name}</span> ${def.name} を獲得！` + subLine;
  document.getElementById('shop-reveal-overlay').classList.remove('hidden');
}

function showRevealMulti(results) {
  sfxReveal();
  document.getElementById('shop-reveal-label').textContent = `${results.length}連ガチャ結果`;
  document.getElementById('shop-reveal-single').classList.add('hidden');
  const gridEl = document.getElementById('shop-reveal-grid');
  gridEl.classList.remove('hidden');
  const rarityRank = { legend: 4, epic: 3, rare: 2, normal: 1 };
  const sorted = results.slice().sort((a, b) => rarityRank[CARD_DEFS[b.cardId].rarity] - rarityRank[CARD_DEFS[a.cardId].rarity]);
  gridEl.innerHTML = sorted.map((r, i) => {
    const def = CARD_DEFS[r.cardId];
    const rarity = RARITY[def.rarity];
    const badge = r.isNew ? '<div class="cg-reveal-grid-badge">NEW</div>' : '';
    const legendGlow = def.rarity === 'legend' ? ' legend-glow' : '';
    return `<div class="cg-reveal-grid-item${legendGlow}" style="animation-delay:${(i * 0.07).toFixed(2)}s; --rarity-color:${rarity.color};">
      ${renderCardFace(r.cardId, { small: true, evolved: state.cards[r.cardId].evolved })}${badge}
    </div>`;
  }).join('');
  document.getElementById('shop-reveal-overlay').classList.remove('hidden');
}

function hideReveal() {
  document.getElementById('shop-reveal-overlay').classList.add('hidden');
}

// ---------- ミッション ----------
const MISSIONS = [
  { id: 'win1', category: 'battle', title: 'はじめての勝利', desc: 'バトルに1回勝利する', target: 1, check: s => s.totalWins || 0, reward: { gold: 200 } },
  { id: 'win3', category: 'battle', title: '勝利を重ねる', desc: 'バトルに3回勝利する', target: 3, check: s => s.totalWins || 0, reward: { gold: 500 } },
  { id: 'win10', category: 'battle', title: '歴戦の証', desc: 'バトルに10回勝利する', target: 10, check: s => s.totalWins || 0, reward: { gems: 20 } },
  { id: 'win25', category: 'battle', title: 'バトルマスターへの道', desc: 'バトルに25回勝利する', target: 25, check: s => s.totalWins || 0, reward: { gems: 40 } },
  { id: 'win50', category: 'battle', title: '百戦錬磨', desc: 'バトルに50回勝利する', target: 50, check: s => s.totalWins || 0, reward: { gems: 80, gold: 1000 } },
  { id: 'pack1', category: 'collect', title: '初めてのパック', desc: 'カードパックを1回開封する', target: 1, check: s => s.totalPacksOpened || 0, reward: { gems: 5 } },
  { id: 'pack5', category: 'collect', title: 'パックコレクター', desc: 'カードパックを5回開封する', target: 5, check: s => s.totalPacksOpened || 0, reward: { gems: 15 } },
  { id: 'pack15', category: 'collect', title: 'パック愛好家', desc: 'カードパックを15回開封する', target: 15, check: s => s.totalPacksOpened || 0, reward: { gems: 30 } },
  { id: 'pack30', category: 'collect', title: 'ガチャの求道者', desc: 'カードパックを30回開封する', target: 30, check: s => s.totalPacksOpened || 0, reward: { gems: 60 } },
  { id: 'upgrade3', category: 'growth', title: 'カードを鍛える', desc: 'カードを3回強化する', target: 3, check: s => s.totalUpgrades || 0, reward: { gold: 400 } },
  { id: 'upgrade10', category: 'growth', title: '熟練の強化師', desc: 'カードを10回強化する', target: 10, check: s => s.totalUpgrades || 0, reward: { gold: 800 } },
  { id: 'upgrade25', category: 'growth', title: '究極の強化師', desc: 'カードを25回強化する', target: 25, check: s => s.totalUpgrades || 0, reward: { gold: 1500, gems: 20 } },
  { id: 'deck20', category: 'collect', title: 'デッキを整える', desc: 'デッキを20枚以上編成する', target: 20, check: s => s.deck.length, reward: { gold: 300 } },
  { id: 'deck30', category: 'collect', title: '完全なるデッキ', desc: 'デッキを30枚編成する', target: 30, check: s => s.deck.length, reward: { gold: 600, gems: 10 } },
  { id: 'trophy500', category: 'growth', title: 'ランクを上げろ', desc: 'トロフィーを500以上獲得する', target: 500, check: s => s.trophy || 0, reward: { gold: 500 } },
  { id: 'trophy1500', category: 'growth', title: '上位ランカー', desc: 'トロフィーを1500以上獲得する', target: 1500, check: s => s.trophy || 0, reward: { gems: 50 } },
  { id: 'level5', category: 'growth', title: '成長の証', desc: 'プレイヤーレベル5に到達する', target: 5, check: s => s.playerLevel || 1, reward: { gold: 400 } },
  { id: 'level10', category: 'growth', title: 'ベテラン冒険者', desc: 'プレイヤーレベル10に到達する', target: 10, check: s => s.playerLevel || 1, reward: { gems: 30 } },
  { id: 'world1clear', category: 'battle', title: '見習いの森を制覇', desc: 'ステージ5をクリアする', target: 6, check: s => s.stageProgress || 1, reward: { gold: 500, gems: 15 } },
  { id: 'world2clear', category: 'battle', title: '月影の国を制覇', desc: 'ステージ10をクリアする', target: 11, check: s => s.stageProgress || 1, reward: { gold: 700, gems: 20 } },
  { id: 'world3clear', category: 'battle', title: '四天王を打ち破る', desc: 'ステージ15をクリアする', target: 16, check: s => s.stageProgress || 1, reward: { gold: 900, gems: 30 } },
  { id: 'world4clear', category: 'battle', title: '魔王城を攻略', desc: 'ステージ20をクリアする', target: 21, check: s => s.stageProgress || 1, reward: { gold: 1200, gems: 40 } },
  { id: 'world5clear', category: 'battle', title: '真実にたどり着く', desc: 'ステージ25をクリアする', target: 26, check: s => s.stageProgress || 1, reward: { gold: 2000, gems: 100 } },
  { id: 'evolve1', category: 'growth', title: '進化の目覚め', desc: 'カードを1体進化させる', target: 1, check: s => getEvolvedMonsterCount().evolvedCount, reward: { gold: 500 } },
  { id: 'evolve9', category: 'growth', title: '進化の達人', desc: 'カードを9体進化させる', target: 9, check: s => getEvolvedMonsterCount().evolvedCount, reward: { gold: 1500, gems: 30 } },
  // ---- 追加ミッション（87回目の修正） ----
  { id: 'win75', category: 'battle', title: 'バトルの覇者', desc: 'バトルに75回勝利する', target: 75, check: s => s.totalWins || 0, reward: { gems: 100 } },
  { id: 'win100', category: 'battle', title: '伝説の挑戦者', desc: 'バトルに100回勝利する', target: 100, check: s => s.totalWins || 0, reward: { gold: 3000, gems: 60 } },
  { id: 'history50', category: 'battle', title: '戦いの記録者', desc: '対戦履歴を50件残す', target: 50, check: s => (s.battleHistory || []).length, reward: { gold: 600 } },
  { id: 'trophy4001', category: 'battle', title: 'プラチナランク到達', desc: 'トロフィーを4001以上獲得する', target: 4001, check: s => s.trophy || 0, reward: { gems: 80 } },
  { id: 'trophy6001', category: 'battle', title: 'ダイヤモンドランク到達', desc: 'トロフィーを6001以上獲得する', target: 6001, check: s => s.trophy || 0, reward: { gold: 5000, gems: 150 } },
  { id: 'upgrade50', category: 'growth', title: 'カード強化の鬼', desc: 'カードを50回強化する', target: 50, check: s => s.totalUpgrades || 0, reward: { gold: 2500, gems: 25 } },
  { id: 'level15', category: 'growth', title: '熟練の証', desc: 'プレイヤーレベル15に到達する', target: 15, check: s => s.playerLevel || 1, reward: { gold: 1000, gems: 20 } },
  { id: 'level20', category: 'growth', title: '頂を目指す者', desc: 'プレイヤーレベル20に到達する', target: 20, check: s => s.playerLevel || 1, reward: { gems: 60 } },
  { id: 'evolve20', category: 'growth', title: '進化の極致', desc: 'カードを20体進化させる', target: 20, check: s => getEvolvedMonsterCount().evolvedCount, reward: { gold: 2000, gems: 40 } },
  { id: 'dragonlevel10', category: 'growth', title: 'ドラゴンを育てる', desc: 'ドラゴンをLv.10まで育てる', target: 10, check: s => (s.dragon && s.dragon.level) || 1, reward: { gold: 800 } },
  { id: 'dragonlevel20', category: 'growth', title: '古代竜の目覚め', desc: 'ドラゴンをLv.20まで育てる', target: 20, check: s => (s.dragon && s.dragon.level) || 1, reward: { gems: 70 } },
  { id: 'pack50', category: 'collect', title: 'ガチャの達人', desc: 'カードパックを50回開封する', target: 50, check: s => s.totalPacksOpened || 0, reward: { gems: 80 } },
  { id: 'leaderselect1', category: 'collect', title: 'リーダーを選ぼう', desc: 'デッキにリーダーを設定する', target: 1, check: s => s.leaderId ? 1 : 0, reward: { gold: 300 } },
  { id: 'presetsave1', category: 'collect', title: 'デッキを保存しよう', desc: 'デッキプリセットを1件保存する', target: 1, check: s => (s.deckPresets || []).length, reward: { gold: 300 } },
  { id: 'compendium1', category: 'collect', title: '図鑑コンプリート', desc: '図鑑コンプリート報酬を受け取る', target: 1, check: s => s.compendiumRewardClaimed ? 1 : 0, reward: { gems: 50 } },
];

const MISSION_CATEGORIES = [
  { id: 'all', label: '全て' },
  { id: 'battle', label: 'バトル' },
  { id: 'growth', label: '育成' },
  { id: 'collect', label: '収集' },
];

function formatReward(reward) {
  const parts = [];
  if (reward.gold) parts.push(`💰${reward.gold}`);
  if (reward.gems) parts.push(`💎${reward.gems}`);
  return parts.join(' ');
}

let missionFilter = 'all';

function setMissionFilter(cat) {
  missionFilter = cat;
  document.querySelectorAll('#mission-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderMissions();
}

function renderMissionFilterTabs() {
  const wrap = document.getElementById('mission-filter-tabs');
  if (!wrap) return;
  wrap.innerHTML = MISSION_CATEGORIES.map(c => {
    const count = MISSIONS.filter(m => (c.id === 'all' || m.category === c.id) && !state.missionsClaimed[m.id] && m.check(state) >= m.target).length;
    return `<button class="cg-filter-tab ${missionFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}${count > 0 ? `<span class="cg-filter-badge">${count}</span>` : ''}</button>`;
  }).join('');
  wrap.querySelectorAll('.cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setMissionFilter(btn.dataset.cat));
  });
}

function renderMissions() {
  renderMissionFilterTabs();
  const wrap = document.getElementById('mission-list');
  const visibleMissions = MISSIONS.filter(m => missionFilter === 'all' || m.category === missionFilter);
  wrap.innerHTML = visibleMissions.map(m => {
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
  }).join('') + (visibleMissions.length === 0 ? '<div class="cg-empty">該当するミッションがありません</div>' : '');
  wrap.querySelectorAll('.cg-mission-claim:not(.claimed):not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => claimMission(btn.dataset.mission));
  });
  const claimableCount = MISSIONS.filter(m => !state.missionsClaimed[m.id] && m.check(state) >= m.target).length;
  const claimAllBtn = document.getElementById('mission-claimall-btn');
  claimAllBtn.classList.toggle('hidden', claimableCount === 0);
  claimAllBtn.textContent = `🎁 まとめて受け取る（${claimableCount}件）`;
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

function claimAllMissions() {
  let claimedAny = false;
  MISSIONS.forEach(m => {
    if (!state.missionsClaimed[m.id] && m.check(state) >= m.target) {
      state.gold += m.reward.gold || 0;
      state.gems += m.reward.gems || 0;
      state.missionsClaimed[m.id] = true;
      claimedAny = true;
    }
  });
  if (claimedAny) {
    saveState();
    renderMissions();
    renderHome();
  }
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
  const quickDragonBtn = document.getElementById('quick-dragon');
  if (quickDragonBtn) quickDragonBtn.addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('quick-history').addEventListener('click', () => { renderBattleHistory(); showScreen('history'); });
  document.getElementById('mission-claimall-btn').addEventListener('click', claimAllMissions);
  const dragonSummaryEl = document.getElementById('dragon-summary');
  if (dragonSummaryEl) dragonSummaryEl.addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('dragon-feed-btn').addEventListener('click', feedDragon);
  document.getElementById('story-overlay').addEventListener('click', advanceStory);
  document.getElementById('shop-reveal-close').addEventListener('click', hideReveal);
  document.getElementById('seg-deck').addEventListener('click', () => showCollectionSegment('deck'));
  document.getElementById('seg-list').addEventListener('click', () => showCollectionSegment('list'));
  document.getElementById('auto-build-btn').addEventListener('click', autoBuildDeck);
  document.getElementById('deck-preset-save-btn').addEventListener('click', saveDeckPreset);
  document.getElementById('compendium-claim-btn').addEventListener('click', claimCompendiumReward);
  document.querySelectorAll('#collection-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setCollectionFilter(btn.dataset.filter));
  });
  document.querySelectorAll('#cardlist-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setCardListFilter(btn.dataset.filter));
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
      .catch((err) => setCloudSyncStatus('⚠️ 同期に失敗しました：' + (err && err.message ? err.message : '')));
  });
  document.getElementById('daily-claim-btn').addEventListener('click', claimDailyReward);
  document.getElementById('rank-card-btn').addEventListener('click', () => { renderRanking(); showScreen('ranking'); });
  document.getElementById('player-info-btn').addEventListener('click', () => { renderProfileScreen(); showScreen('profile'); });
  document.getElementById('profile-save-btn').addEventListener('click', saveProfile);
  document.getElementById('profile-avatar-file').addEventListener('change', (e) => handleAvatarUpload(e.target));
  if (window.LisNoirCloud) {
    window.LisNoirCloud.onAuthChange((user) => {
      refreshCloudAuthUI(user);
      if (user) setCloudSyncStatus('☁️ ログイン中（' + user.email + '）');
    });
  }
  showScreen('home');
  setTimeout(() => {
    const loader = document.getElementById('splash-loader');
    const startBtn = document.getElementById('splash-start-btn');
    if (loader) loader.style.display = 'none';
    if (startBtn) startBtn.classList.remove('hidden');
    document.querySelectorAll('.cg-splash-start-flourish').forEach(el => el.style.opacity = '1');
  }, 1300);
  const startBtn = document.getElementById('splash-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      sfxTap();
      const splash = document.getElementById('splash-screen');
      if (splash) splash.classList.add('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
