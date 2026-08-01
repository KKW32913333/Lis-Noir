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
// 相性: 火→自然→水→火 の3すくみ（攻撃側が有利なら+2、不利なら-1）
// 光と闇はお互いが弱点の関係（どちらから攻撃しても+2）
const ELEMENT_ADVANTAGE = { fire: 'nature', nature: 'water', water: 'fire', light: 'dark', dark: 'light' };

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
  // ---- リーダーキャラクターカード（通常のデッキ内カードとして使用可能。1枚まで） ----
  fire_imp:       { name: 'シルフ',   element: 'nature',   rarity: 'normal', cost: 2, atk: 2, hp: 1,  role: 'attacker', skill: '', image: 'card-nature-sylph2.png', emoji: '🐦' },
  fire_phoenix:   { name: '炎帝フェニックス', element: 'fire',   rarity: 'epic',   cost: 4, atk: 4, hp: 5,  role: 'attacker', skillTag: { trigger: 'onDeath', effect: 'reviveHalfHp' }, skill: '撃破された時、1度だけ1/2のHPで復活', image: 'card-fire-phoenixemperor.png', emoji: '🔥' },
  fire_bahamut:   { name: '煉獄の焔竜バハムート', element: 'fire', rarity: 'legend', cost: 6, atk: 5, hp: 7, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'aoeDamageBurnAtkDownAll', value: 3, burnDmg: 1, burnTurns: 3, atkDownValue: 1 }, skill: '場に出た時、敵全体に3ダメージを与え、3ターンの間火傷を、さらに攻撃力を永続で1下げる', image: 'card-fire-bahamut.png', emoji: '🐉' },
  fire_flameslime: { name: 'フレイムスライム', element: 'fire',  rarity: 'normal',   cost: 2, atk: 2, hp: 1,  role: 'attacker', skill: '', image: 'card-fire-flameslime.png', emoji: '🔥' },
  water_slime:    { name: 'アクアスライム',   element: 'water',  rarity: 'normal', cost: 2, atk: 1, hp: 1,  role: 'defender', skillTag: { trigger: 'onPlay', effect: 'drawCard', value: 1 }, skill: '場に出た時、カードを1枚引く', image: 'card-water-aquaslime.png', emoji: '🔵' },
  water_serpent:  { name: '海皇リヴァイアサン', element: 'water',  rarity: 'epic',   cost: 4, atk: 5, hp: 5,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageStunHeal', value: 2, healValue: 1 }, skill: '攻撃時、敵全体に2ダメージを与えて1ターン行動不能にし、味方全体のHPを1回復する', image: 'card-water-leviathan.png', emoji: '🐍' },
  water_seiren:   { name: '水奏の女王セイレーン', element: 'water', rarity: 'legend', cost: 6, atk: 5, hp: 7, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healShieldAlliesAtkDownEnemies', healValue: 3, shieldValue: 2, atkDownValue: 1 }, skill: '場に出た時、味方全体のHPを3回復してシールド2を付与し、敵全体の攻撃力を永続で1下げる', image: 'card-water-seiren.png', emoji: '👑' },
  nature_wolf:    { name: 'シャドウアサシン', element: 'dark', rarity: 'rare', cost: 2, atk: 3, hp: 2,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'extraDamage', value: 1 }, skill: '攻撃時、追加で1ダメージ', image: 'card-dark-shadowassassin.png', emoji: '🗡️' },
  nature_dryad:   { name: '森羅の樹神ドリアード', element: 'nature', rarity: 'epic', cost: 4, atk: 3, hp: 6, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'aoeDamagePoisonShieldAllies', value: 2, poisonDmg: 1, poisonTurns: 2, shieldValue: 1 }, skill: '場に出た時、敵全体に2ダメージを与えて毒（2ターン）を付与し、味方全体にシールド1を付与する', image: 'card-nature-dryad.png', emoji: '🌲' },
  nature_emeraldgaia: { name: '翠嵐龍エメラルドガイア', element: 'nature', rarity: 'legend', cost: 7, atk: 8, hp: 6, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageAtkUpAllies', value: 3, atkUpValue: 1 }, skill: '攻撃時、敵全体に3ダメージを与え、味方全体の攻撃力を永続で1上げる', image: 'card-nature-emeraldgaia.png', emoji: '🐲' },
  light_angel:    { name: '光輝の大天使ルミナス', element: 'light', rarity: 'epic', cost: 4, atk: 4, hp: 6, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healAllAllies', value: 1 }, skill: '場に出た時、味方全体のHPを1回復', image: 'card-light-luminous.png', emoji: '👼' },
  light_holyangel: { name: 'ホーリーエンジェル', element: 'light', rarity: 'normal', cost: 2, atk: 1, hp: 2, role: 'attacker', skill: '', image: 'card-light-holyangel.png', emoji: '👼' },
  dark_shadowbat: { name: 'シャドウバット',   element: 'dark',   rarity: 'normal',   cost: 2, atk: 1, hp: 1,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'atkDown', value: 1 }, skill: '攻撃時、相手の攻撃力を1下げる', image: 'card-dark-shadowbat.png', emoji: '🦇' },
  dark_reaper:    { name: '虚無の女王ノクターリア', element: 'dark',   rarity: 'legend', cost: 6, atk: 7, hp: 7,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageStunDrainCost', value: 3, drainValue: 1 }, skill: '攻撃時、敵全体に3ダメージを与えて1ターン行動不能にし、相手のコストを1消費させる', image: 'card-dark-nocturia.png', emoji: '😈' },
  water_icewolf:      { name: 'スピリットメイデン',     element: 'water', rarity: 'rare',   cost: 4, atk: 5, hp: 4, role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'refundCost', value: 1 }, skill: '場に出た時、自分のコストを1回復する', image: 'card-water-spiritmaiden.png', emoji: '🐺' },
  nature_swiftrabbit: { name: '俊足のウサギ',     element: 'nature', rarity: 'rare',  cost: 1, atk: 1, hp: 2, role: 'attacker', rush: true, skill: '【速攻】召喚したこのターンにすぐ攻撃できる（攻撃力は低め）', image: 'card-nature-swiftrabbit.png', emoji: '🐇' },
  dark_demonlord:     { name: 'ヴァンパイアロード',     element: 'dark', rarity: 'legend',  cost: 6, atk: 5, hp: 9, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'lifesteal' }, skill: '攻撃時、与えたダメージ分だけ自分のHPを回復する（吸血）', image: 'card-dark-vampirelord2.png', emoji: '🧛' },
  dark_chaosdemon:    { name: '冥王カオスデーモン', element: 'dark', rarity: 'epic', cost: 4, atk: 6, hp: 4, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageAtkDownAll', value: 2, atkDownValue: 1 }, skill: '攻撃時、敵全体に2ダメージを与え、敵全体の攻撃力を1下げる', image: 'card-dark-chaosdemon.png', emoji: '😈' },
  dark_voidreaper:        { name: 'ヴォイドリーパー',   element: 'dark', rarity: 'legend', cost: 6, atk: 7, hp: 8,  role: 'attacker', skillTag: { trigger: 'onKillAttack', effect: 'extraAttackOnKill' }, skill: '【固有】敵を撃破した時、行動終了せず続けてもう一度攻撃できる', image: 'card-dark-voidreaper.png', emoji: '💀' },
  dark_nocturnaldragon:    { name: 'ノクターナルドラゴン', element: 'dark', rarity: 'legend', cost: 7, atk: 8, hp: 10,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'novaAttack' }, skill: '【固有】攻撃時、自分の攻撃力と同じダメージを敵全体に与える', image: 'card-dark-nocturnaldragon.png', emoji: '🐉' },
  dark_lunaelf:            { name: 'ルナエルフ',         element: 'dark', rarity: 'legend', cost: 4, atk: 3, hp: 7,  role: 'defender', skillTag: { trigger: 'onPlay', effect: 'refundCost', value: 2 }, skill: '【固有】場に出た時、自分のコストを2回復する', image: 'card-dark-lunaelf.png', emoji: '🦋' },
  dark_nightmarecavalier:  { name: 'ナイトメアキャバリア', element: 'dark', rarity: 'legend', cost: 7, atk: 5, hp: 13, role: 'defender', skillTag: { trigger: 'passiveDamageReduction', value: 0.5 }, skill: '【固有】受けるダメージを常に半減する', image: 'card-dark-nightmarecavalier.png', emoji: '🛡️' },
  dark_shadowslime:        { name: 'シャドウスライム',   element: 'dark', rarity: 'legend', cost: 5, atk: 6, hp: 5,  role: 'attacker', skillTag: { trigger: 'onDeath', effect: 'deathBuffAllies', value: 2 }, skill: '【固有】撃破された時、味方全体の攻撃力を永続+2する', image: 'card-dark-shadowslime.png', emoji: '🟣' },
  spell_orbitalgrimoire:   { name: 'オービタルグリモア', element: 'dark', rarity: 'legend', cost: 5, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 3 }, skill: '【固有】カードを3枚引く', image: 'card-dark-orbitalgrimoire.png', emoji: '📖' },
  // ---- 「光耀の祝福」ガチャ限定カード（全て光属性・レジェンド。実際に引くまで所持しない） ----
  light_shirayuki:      { name: '華光の白姫シラユキ', element: 'light', rarity: 'legend', cost: 6, atk: 6, hp: 8,  role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'healAndShieldAllies', value: 3, shieldValue: 3 }, skill: '【固有】場に出た時、味方全体のHPを3回復し、シールド3を付与する', image: 'card-light-shirayuki.png', emoji: '☂️' },
  light_lucius:          { name: '聖導の賢者ルシウス', element: 'light', rarity: 'legend', cost: 5, atk: 5, hp: 7,  role: 'defender', skillTag: { trigger: 'onPlay', effect: 'drawAndRefundCost', value: 2, refundValue: 2 }, skill: '【固有】場に出た時、カードを2枚引き、自分のコストを2回復する', image: 'card-light-lucius.png', emoji: '📜' },
  light_starlightunicorn:{ name: 'スターライトユニコーン', element: 'light', rarity: 'legend', cost: 6, atk: 7, hp: 8,  role: 'attacker', skillTag: { trigger: 'onPlay', effect: 'cleanseAndHealAllies', value: 2 }, skill: '【固有】場に出た時、味方全体の状態異常を解除し、HPを2回復する', image: 'card-light-starlightunicorn.png', emoji: '🦄' },
  light_stardustwhale:   { name: 'スターダストホエール', element: 'light', rarity: 'legend', cost: 7, atk: 8, hp: 10, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageStunHeal', value: 3, healValue: 2 }, skill: '【固有】攻撃時、敵全体に3ダメージを与えて1ターン行動不能にし、味方全体のHPを2回復する', image: 'card-light-stardustwhale.png', emoji: '🐋' },
  light_sunblazenoble:   { name: 'サンブレイズ・ノーブル', element: 'light', rarity: 'legend', cost: 7, atk: 6, hp: 11, role: 'defender', skillTag: { trigger: 'passiveDamageReduction', value: 0.4 }, skill: '【固有】受けるダメージを常に40%軽減する', image: 'card-light-sunblazenoble.png', emoji: '🥂' },
  light_whitegriffon:    { name: 'ホワイトグリフォン', element: 'light', rarity: 'legend', cost: 6, atk: 8, hp: 9,  role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageAtkUpAllies', value: 3, atkUpValue: 2 }, skill: '【固有】攻撃時、敵全体に3ダメージを与え、味方全体の攻撃力を永続で2上げる', image: 'card-light-whitegriffon.png', emoji: '🦅' },
  // ---- 初心者ガチャ用の新規カード ----
  fire_flarelion:      { name: 'フレアライオン', element: 'fire', rarity: 'rare', cost: 3, atk: 4, hp: 3, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'extraDamage', value: 1 }, skill: '攻撃時、追加で1ダメージ', image: 'card-fire-flarelion.png', emoji: '🦁' },
  nature_venomscorpion: { name: 'ヴェノムスコーピオン', element: 'nature', rarity: 'rare', cost: 3, atk: 3, hp: 3, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'poisonChance', value: 1, chance: 0.6, turns: 2 }, skill: '攻撃時、60%の確率で毒（2ターン）を付与する', image: 'card-nature-venomscorpion.png', emoji: '🦂' },
  light_lightguardian:  { name: 'ライトガーディアン', element: 'light', rarity: 'rare', cost: 3, atk: 2, hp: 4, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'shieldAllAllies', value: 1 }, skill: '場に出た時、味方全体にシールド1を付与する', image: 'card-light-lightguardian.png', emoji: '🛡️' },
  fire_crimson:         { name: '炎龍王クリムゾン', element: 'fire', rarity: 'legend', cost: 6, atk: 7, hp: 8, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageAndBurn', value: 2, burnDmg: 1, burnTurns: 2 }, skill: '攻撃時、敵全体に2ダメージを与えて火傷（2ターン）を付与する', image: 'card-fire-crimson2.png', emoji: '🐉' },
  light_arcknight:      { name: '聖騎士アークナイト', element: 'light', rarity: 'legend', cost: 6, atk: 6, hp: 9, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healAndShieldAllies', value: 2, shieldValue: 2 }, skill: '場に出た時、味方全体のHPを2回復し、シールド2を付与する', image: 'card-light-arcknight.png', emoji: '🛡️' },

  // ---- スペルカード（即時効果・場には残らない） ----
  spell_fireball:   { name: 'ファイアボール',   element: 'fire',  rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 4 }, skill: '敵1体（または敵本体）に4ダメージ', image: 'card-spell-fireball.png', emoji: '☄️' },
  spell_iceshard:   { name: 'アイスシャード',   element: 'water', rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'spell', target: 'enemy', effect: { kind: 'damage', value: 2 }, skill: '敵1体（または敵本体）に2ダメージ', image: 'card-spell-iceshard.png', emoji: '🧊' },
  spell_healing:    { name: 'ヒーリングライト', element: 'light', rarity: 'normal', cost: 2, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'heal', value: 5 }, skill: '自分のHPを5回復', image: 'card-spell-healing.png', emoji: '💫' },
  spell_mindsurge:  { name: 'マインドサージ',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'draw', value: 2 }, skill: 'カードを2枚引く', image: 'card-spell-mindsurge.png', emoji: '📖' },
  spell_apocalypse: { name: 'メテオシャワー',     element: 'fire',  rarity: 'epic', cost: 5, atk: 0, hp: 0, type: 'spell', target: 'none', effect: { kind: 'destroyRandom', count: 3 }, skill: '敵モンスターをランダムで3体まで撃破する（HPに関わらず必ず撃破。ただしシールドを持つモンスターは対象外）', image: 'card-spell-meteorshower.png', emoji: '☄️' },
  spell_soulbind:   { name: 'ソウルストライク',       element: 'dark',  rarity: 'epic',   cost: 4, atk: 0, hp: 0, type: 'spell', target: 'enemy_monster', effect: { kind: 'destroy' }, skill: '敵モンスター1体を選択して撃破する（HPに関わらず必ず撃破）', image: 'card-spell-soulstrike.png', emoji: '⛓️' },

  // ---- 装備カード（味方モンスター1体に付与） ----
  equip_ironsword:  { name: 'アイアンソード',     element: 'fire',  rarity: 'normal', cost: 1, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 0 }, skill: '味方1体の攻撃力+2', image: 'card-equip-ironsword.png', emoji: '🗡️' },
  equip_shield:     { name: 'ガーディアンシールド', element: 'light', rarity: 'rare',   cost: 2, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 0, hp: 4 }, skill: '味方1体のHP+4', image: 'card-equip-shield.png', emoji: '🛡️' },
  equip_dragonmail: { name: 'ドラゴンアーマー',   element: 'dark',  rarity: 'epic',   cost: 3, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 2, hp: 3 }, skill: '味方1体の攻撃力+2・HP+3', image: 'card-equip-dragonmail.png', emoji: '🎽' },
  equip_aqualance:  { name: 'アクアランス',       element: 'water', rarity: 'legend', cost: 4, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 6, hp: 1 }, skill: '味方1体の攻撃力+6・HP+1', image: 'card-equip-aqualance.png', emoji: '🔱' },
  // ---- ダンジョン限定装備（レジェンド）：10階ごとのフロアボス撃破報酬。画像は今後差し替え予定（image:nullの間は絵文字で表示） ----
  dungeon_equip_10:  { name: '深淵の欠片',     element: 'dark',   rarity: 'legend', cost: 2, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 3, hp: 3 }, skill: '味方1体の攻撃力+3・HP+3', image: null, emoji: '🔮' },
  dungeon_equip_20:  { name: '奈落の指輪',     element: 'dark',   rarity: 'legend', cost: 3, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 4, hp: 4 }, skill: '味方1体の攻撃力+4・HP+4', image: null, emoji: '💍' },
  dungeon_equip_30:  { name: '亡国の紋章',     element: 'fire',   rarity: 'legend', cost: 3, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 5, hp: 4 }, skill: '味方1体の攻撃力+5・HP+4', image: null, emoji: '🏵️' },
  dungeon_equip_40:  { name: '氷結の秘宝',     element: 'water',  rarity: 'legend', cost: 4, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 5, hp: 5 }, skill: '味方1体の攻撃力+5・HP+5', image: null, emoji: '❄️' },
  dungeon_equip_50:  { name: '天空の羽衣',     element: 'light',  rarity: 'legend', cost: 4, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 6, hp: 5 }, skill: '味方1体の攻撃力+6・HP+5', image: null, emoji: '🪽' },
  dungeon_equip_60:  { name: '終焉の書',       element: 'dark',   rarity: 'legend', cost: 4, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 6, hp: 6 }, skill: '味方1体の攻撃力+6・HP+6', image: null, emoji: '📕' },
  dungeon_equip_70:  { name: '虚無の指輪',     element: 'dark',   rarity: 'legend', cost: 5, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 7, hp: 6 }, skill: '味方1体の攻撃力+7・HP+6', image: null, emoji: '⚫' },
  dungeon_equip_80:  { name: '永劫の鎧',       element: 'nature', rarity: 'legend', cost: 5, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 7, hp: 7 }, skill: '味方1体の攻撃力+7・HP+7', image: null, emoji: '🛡️' },
  dungeon_equip_90:  { name: '創世の宝珠',     element: 'light',  rarity: 'legend', cost: 5, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 8, hp: 7 }, skill: '味方1体の攻撃力+8・HP+7', image: null, emoji: '🔆' },
  dungeon_equip_100: { name: '万物の冠',       element: 'light',  rarity: 'legend', cost: 6, atk: 0, hp: 0, type: 'equipment', target: 'friendly', effect: { atk: 9, hp: 8 }, skill: '味方1体の攻撃力+9・HP+8', image: null, emoji: '👑' },

  // ---- フィールドカード（場に出ている間、対応属性のモンスター全体（両陣営）に継続効果） ----
  field_inferno:   { name: 'フレイムコア', element: 'fire',  rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none',
    effect: { allyBoost: { element: 'fire', stat: 'atk', value: 1 }, allyDamageReduction: { element: 'fire', percent: 0.10 } },
    skill: '場に出ている間、火属性の味方全体の攻撃力+1。さらに、火属性の味方が受けるダメージを10%軽減する', image: 'card-field-flamecore.png', emoji: '🔥' },
  field_aquadeep:  { name: 'アクアディープ', element: 'water', rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none',
    effect: { allyBoost: { element: 'water', stat: 'atk', value: 1 }, allyDamageReduction: { element: 'water', percent: 0.10 } },
    skill: '場に出ている間、水属性の味方全体の攻撃力+1。さらに、水属性の味方が受けるダメージを10%軽減する', image: 'card-field-aquadeep.png', emoji: '🌊' },
  field_evergrove: { name: 'エバーグローブ', element: 'nature', rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none',
    effect: { allyBoost: { element: 'nature', stat: 'hp', value: 1 }, allyDamageReduction: { element: 'nature', percent: 0.10 } },
    skill: '場に出ている間、自然属性の味方全体のHP+1。さらに、自然属性の味方が受けるダメージを10%軽減する', image: 'card-field-evergrove.png', emoji: '🌳' },
  field_sanctuary: { name: 'ホーリーサンクチュアリ', element: 'light', rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none',
    effect: { allyBoost: { element: 'light', stat: 'atk', value: 1 }, allyDamageReduction: { element: 'all', percent: 0.10 } },
    skill: '場に出ている間、味方全体が受けるダメージを10%軽減する。さらに、光属性の味方の攻撃力+1', image: 'card-field-sanctuary.png', emoji: '⛩️' },
  field_abyss:     { name: 'アビスの深淵',       element: 'dark',  rarity: 'rare', cost: 2, atk: 0, hp: 0, type: 'field', target: 'none',
    effect: { enemyDebuff: { element: 'dark', stat: 'atk', value: -1 }, enemyDamageBoost: 0.10 },
    skill: '場に出ている間、敵全体が受けるダメージが10%増加する。さらに、闇属性の敵の攻撃力を-1する', image: 'card-field-abyss.png', emoji: '🕳️' },

  // ---- プレミアムガチャ第1弾 追加カード（ノーマル5種・レア4種） ----
  fire_infernoimp:    { name: 'インフェルノインプ', element: 'fire',  rarity: 'normal', cost: 2, atk: 2, hp: 2, role: 'defender', skill: '', image: 'card-fire-infernoimp.png', emoji: '😈' },
  water_frostwolf:     { name: 'フロストウルフ',   element: 'water',  rarity: 'normal', cost: 2, atk: 2, hp: 2, role: 'attacker', skill: '', image: 'card-water-frostwolf.png', emoji: '🐺' },
  nature_leafslime:    { name: 'リーフスライム',   element: 'nature', rarity: 'normal', cost: 2, atk: 1, hp: 2, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healAllAllies', value: 1 }, skill: '場に出た時、味方全体のHPを1回復する', image: 'card-nature-leafslime.png', emoji: '🍃' },
  light_sainttiger:    { name: 'セイントタイガー', element: 'light',  rarity: 'normal', cost: 2, atk: 2, hp: 2, role: 'attacker', skill: '', image: 'card-light-sainttiger.png', emoji: '🐯' },
  dark_scarecrow:      { name: 'スケアクロウ',     element: 'dark',   rarity: 'normal', cost: 2, atk: 2, hp: 2, role: 'defender', skill: '', image: 'card-dark-scarecrow.png', emoji: '🎃' },
  fire_flameboar:      { name: 'フレイムボア',     element: 'fire',   rarity: 'rare', cost: 3, atk: 4, hp: 3, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'extraDamage', value: 2 }, skill: '攻撃時、追加で2ダメージ', image: 'card-fire-flameboar.png', emoji: '🐗' },
  dark_wraithbanshee:  { name: 'レイスバンシー',   element: 'dark',   rarity: 'rare', cost: 3, atk: 3, hp: 3, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'poisonChance', value: 1, chance: 0.7, turns: 2 }, skill: '攻撃時、70%の確率で毒（2ターン）を付与する', image: 'card-dark-wraithbanshee.png', emoji: '👻' },
  nature_stonesanctuary: { name: 'ストーンサンクチュアリ', element: 'nature', rarity: 'rare', cost: 3, atk: 2, hp: 4, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'shieldAllAllies', value: 2 }, skill: '場に出た時、味方全体にシールド2を付与する', image: 'card-nature-stonesanctuary.png', emoji: '🐢' },
  light_ancientunicorn: { name: 'エンシェントユニコーン', element: 'light', rarity: 'rare', cost: 4, atk: 4, hp: 3, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'stunTarget' }, skill: '攻撃時、相手を行動不能にする', image: 'card-light-ancientunicorn.png', emoji: '🦄' },

  // ---- プレミアムガチャ第1弾 追加カード（エピック5種・レジェンド5種） ----
  fire_cerberus:        { name: 'ヘルハウンド・ケルベロス', element: 'fire',   rarity: 'epic', cost: 4, atk: 5, hp: 5, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamage', value: 2 }, skill: '攻撃時、敵全体に2ダメージを与える', image: 'card-fire-cerberus.png', emoji: '🐺' },
  water_icequartz:       { name: 'アイスクォーツ',     element: 'water',  rarity: 'epic', cost: 4, atk: 4, hp: 5, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageStunHeal', value: 3, healValue: 1 }, skill: '攻撃時、敵全体に3ダメージを与えて1ターン行動不能にし、味方全体のHPを1回復する', image: 'card-water-icequartz.png', emoji: '❄️' },
  nature_venusharvest:   { name: 'ヴィーナスハーヴェスト', element: 'nature', rarity: 'epic', cost: 4, atk: 4, hp: 4, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'poisonChance', value: 2, chance: 0.5, turns: 2 }, skill: '攻撃時、50%の確率で毒（2ターン）を付与する', image: 'card-nature-venusharvest.png', emoji: '🌺' },
  light_crystalguardian: { name: 'クリスタルガーディアン', element: 'light', rarity: 'epic', cost: 4, atk: 3, hp: 5, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'shieldAllAllies', value: 3 }, skill: '場に出た時、味方全体にシールド3を付与する', image: 'card-light-crystalguardian.png', emoji: '💎' },
  dark_deepabyssdemon:   { name: 'ディープアビスデーモン', element: 'dark',  rarity: 'epic', cost: 4, atk: 5, hp: 4, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'atkDown', value: 2 }, skill: '攻撃時、相手の攻撃力を2下げる', image: 'card-dark-deepabyssdemon.png', emoji: '👹' },
  fire_kagutsuchi:       { name: 'カグツチノ将',       element: 'fire',   rarity: 'legend', cost: 6, atk: 7, hp: 7, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'aoeDamageAtkUpAllies', value: 3, atkUpValue: 2 }, skill: '【固有】攻撃時、敵全体に3ダメージを与え、味方全体の攻撃力を永続で2上げる', image: 'card-fire-kagutsuchi.png', emoji: '⚔️' },
  water_mermaidsongress: { name: 'マーメイドソングレス', element: 'water', rarity: 'legend', cost: 5, atk: 4, hp: 7, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'cleanseAndHealAllies', value: 2 }, skill: '【固有】場に出た時、味方全体の状態異常を解除し、HPを2回復する', image: 'card-water-mermaidsongress.png', emoji: '🧜' },
  nature_foreststag:     { name: 'フォレストスタッグ', element: 'nature', rarity: 'legend', cost: 6, atk: 5, hp: 10, role: 'defender', skillTag: { trigger: 'passiveDamageReduction', value: 0.3 }, skill: '【固有】受けるダメージを常に30%軽減する', image: 'card-nature-foreststag.png', emoji: '🦌' },
  light_fairylumina:     { name: 'フェアリールミナ',   element: 'light',  rarity: 'legend', cost: 5, atk: 4, hp: 6, role: 'defender', skillTag: { trigger: 'onPlay', effect: 'healAndShieldAllies', value: 3, shieldValue: 2 }, skill: '【固有】場に出た時、味方全体のHPを3回復し、シールド2を付与する', image: 'card-light-fairylumina.png', emoji: '🧚' },
  dark_deathwhisperer:   { name: 'デスウィスパラー',   element: 'dark',   rarity: 'legend', cost: 6, atk: 6, hp: 7, role: 'attacker', skillTag: { trigger: 'onAttack', effect: 'drainEnemyCost', value: 2 }, skill: '【固有】攻撃で相手を撃破した時、相手のコストを2消費させる', image: 'card-dark-deathwhisperer.png', emoji: '💀' },
};

// 初心者ガチャの対象カードID一覧（SHOP_PACKS本体はファイル後方で定義されるため、
// アプリ起動時のstate読み込み処理からも安全に参照できるよう、先にここで定義しておく）
const BEGINNER_GACHA_CARD_IDS = new Set([
  'fire_flameslime', 'water_slime', 'fire_imp', 'light_holyangel', 'dark_shadowbat', 'spell_iceshard', 'spell_healing',
  'fire_flarelion', 'water_icewolf', 'nature_venomscorpion', 'light_lightguardian', 'nature_wolf', 'spell_fireball', 'field_inferno', 'field_aquadeep', 'field_evergrove', 'field_sanctuary', 'field_abyss',
  'fire_phoenix', 'water_serpent', 'nature_dryad', 'light_angel', 'dark_chaosdemon', 'spell_mindsurge', 'spell_soulbind', 'spell_apocalypse',
  'fire_crimson', 'water_seiren', 'nature_emeraldgaia', 'light_arcknight', 'dark_reaper', 'equip_aqualance',
  // プレミアムガチャ第1弾 追加カード（ノーマル5種・レア4種）：スタート時の自動編成デッキには含めない
  'fire_infernoimp', 'water_frostwolf', 'nature_leafslime', 'light_sainttiger', 'dark_scarecrow',
  'fire_flameboar', 'dark_wraithbanshee', 'nature_stonesanctuary', 'light_ancientunicorn',
  // プレミアムガチャ第1弾 追加カード（エピック5種・レジェンド5種）：スタート時の自動編成デッキには含めない
  'fire_cerberus', 'water_icequartz', 'nature_venusharvest', 'light_crystalguardian', 'dark_deepabyssdemon',
  'fire_kagutsuchi', 'water_mermaidsongress', 'nature_foreststag', 'light_fairylumina', 'dark_deathwhisperer',
]);



// ---------- ダンジョン（地下1階〜100階） ----------
const DUNGEON_MAX_FLOOR = 100;
const ONLINE_BATTLE_HP = 400; // オンライン対戦は、双方の育成状況（プレイヤーレベル・ドラゴンボーナス等）に関わらず、必ずこの値で公平に対戦する
// フロアボスの見た目（10階ごとに切り替え、既存のレジェンドモンスターを巡回して使用）
const DUNGEON_BOSS_CARDS = ['fire_crimson', 'fire_bahamut', 'water_seiren', 'nature_emeraldgaia', 'light_whitegriffon', 'dark_reaper', 'light_arcknight', 'dark_demonlord'];
// 10階ごとの装備報酬（フロアボスを撃破した時に手に入るレジェンド装備。floor/10 - 1 が配列インデックスに対応）
const DUNGEON_EQUIPMENT_REWARDS = [
  'dungeon_equip_10', 'dungeon_equip_20', 'dungeon_equip_30', 'dungeon_equip_40', 'dungeon_equip_50',
  'dungeon_equip_60', 'dungeon_equip_70', 'dungeon_equip_80', 'dungeon_equip_90', 'dungeon_equip_100',
];
const DUNGEON_BG_THEMES = ['cave', 'moonshadow', 'purification', 'frost', 'empress', 'inferno2', 'volcano', 'castle'];

// ---------- 状態管理 ----------
const SAVE_KEY = 'cardgame_save_v1';
const EVOLVE_LEVEL_REQ = 5;

// ---------- リーダーカード ----------
// デッキに1体だけ設定でき、効果はそのデッキの対象属性モンスター全てに反映される
const LEADERS = {
  lisnoir_f: {
    name: 'エレナ・ノワール',
    skillName: 'ダークエレガンス',
    element: 'dark',
    desc: '闇属性ユニットの攻撃力を+2、HPを+2',
    effect: { atkFlat: 2, hpFlat: 2, enemyDmgFlat: 0 },
    fullImage: 'leader-lisnoir-f-full.png',
    icon: 'leader-lisnoir-f-icon.png',
    ultimateSkill: { name: '漆黒の断罪', desc: '敵本体と敵の場にいる全モンスターに5ダメージを与える', dmg: 5 },
  },
  lisnoir_m: {
    name: 'ディアブロ・ノワール',
    skillName: 'ナイトメアドミニオン',
    element: 'dark',
    desc: '闇属性ユニットの攻撃力を+2、敵へのダメージを+1',
    effect: { atkFlat: 2, hpFlat: 0, enemyDmgFlat: 1 },
    fullImage: 'leader-lisnoir-m-full.png',
    icon: 'leader-lisnoir-m-icon.png',
    ultimateSkill: { name: '悪夢の侵食', desc: '敵本体と敵の場にいる全モンスターに4ダメージを与え、モンスターを1ターン行動不能にする', dmg: 4, stunTurns: 1 },
  },
  lisblanc_f: {
    name: 'テスタ・ブラン',
    skillName: 'ホーリーグロウ',
    element: 'light',
    desc: '光属性ユニットの攻撃力を+2、HPを+3',
    effect: { atkFlat: 2, hpFlat: 3, enemyDmgFlat: 0 },
    fullImage: 'leader-lisblanc-f-full.png',
    icon: 'leader-lisblanc-f-icon.png',
    ultimateSkill: { name: '聖なる浄化', desc: '敵本体と敵の場にいる全モンスターに4ダメージを与え、味方全体のHPを3回復する', dmg: 4, healAllies: 3 },
  },
  luxblanc_m: {
    name: 'ジュード・ブラン',
    skillName: 'ホーリーセイント',
    element: 'light',
    desc: '光属性ユニットの攻撃力を+2、HPを+3',
    effect: { atkFlat: 2, hpFlat: 3, enemyDmgFlat: 0 },
    fullImage: 'leader-luxblanc-m-full.png',
    icon: 'leader-luxblanc-m-icon.png',
    ultimateSkill: { name: '聖域の裁き', desc: '敵本体と敵の場にいる全モンスターに4ダメージを与え、味方全体にシールド2を付与する', dmg: 4, shieldAllies: 2 },
  },
  liramaline: {
    name: 'リーラ・マリーン',
    skillName: 'アクアエンパイア',
    element: 'water',
    desc: '水属性ユニットの攻撃力を+2、HPを+2',
    effect: { atkFlat: 2, hpFlat: 2, enemyDmgFlat: 0 },
    fullImage: 'leader-liramaline-full.png',
    icon: 'leader-liramaline-icon.png',
    ultimateSkill: { name: '深海の怒涛', desc: '敵本体と敵の場にいる全モンスターに4ダメージを与え、味方全体のHPを2回復する', dmg: 4, healAllies: 2 },
  },
  kaien: {
    name: 'エル・カイエン',
    skillName: 'フレイムブンリト',
    element: 'fire',
    desc: '火属性ユニットの攻撃力を+2、敵へのダメージを+1',
    effect: { atkFlat: 2, hpFlat: 0, enemyDmgFlat: 1 },
    fullImage: 'leader-kaien-full.png',
    icon: 'leader-kaien-icon.png',
    ultimateSkill: { name: '業火の焔', desc: '敵本体と敵の場にいる全モンスターに5ダメージを与え、敵の場にいるモンスターの攻撃力を永続で1下げる', dmg: 5, atkDownEnemies: 1 },
  },
  mornabane: {
    name: 'モナ・ロマネスク',
    skillName: 'ネスコスポーズル',
    element: 'nature',
    desc: '自然属性ユニットの攻撃力を+3、敵の回復効果を無効化',
    effect: { atkFlat: 3, hpFlat: 0, enemyDmgFlat: 0, nullifyEnemyHeal: true },
    fullImage: 'leader-mornabane-full.png',
    icon: 'leader-mornabane-icon.png',
    ultimateSkill: { name: '虚無の審判', desc: '敵本体と敵の場にいる全モンスターに6ダメージを与える', dmg: 6 },
  },
};

const ULTIMATE_COOLDOWN_TURNS = 5; // アルティメットスキルが使えるまでの必要ターン数

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
  { id: 'nightlegends', name: '夜天の英雄ガチャ', icon: '🌙', iconImage: 'gacha-icon-nightlegends.png', currency: 'tickets', cost: 1,
    desc: '期間限定ガチャチケットを使用。この6体のうち、いずれか1体が必ず出現（全てレジェンド・闇属性）',
    pool: ['dark_voidreaper', 'dark_nocturnaldragon', 'dark_lunaelf', 'dark_nightmarecavalier', 'dark_shadowslime', 'spell_orbitalgrimoire'] },
  { id: 'lightblessing', name: '光耀の祝福ガチャ', icon: '☀️', iconImage: 'gacha-icon-lightblessing.png', currency: 'tickets', cost: 1,
    desc: '期間限定ガチャチケットを使用。この6体のうち、いずれか1体が必ず出現（全てレジェンド・光属性）',
    pool: ['light_shirayuki', 'light_lucius', 'light_starlightunicorn', 'light_stardustwhale', 'light_sunblazenoble', 'light_whitegriffon'] },
];

const EVOLVE_COST = 800;
const EVOLVE_BONUS_ATK = 2;
const EVOLVE_BONUS_HP = 3;
const CARD_MAX_LEVEL = 30;
// レア度ごとの強化コスト基準（基本コスト、レベルごとの増加量）
const CARD_UPGRADE_COST_BY_RARITY = {
  normal: { base: 300, perLevel: 80 },
  rare:   { base: 400, perLevel: 100 },
  epic:   { base: 550, perLevel: 140 },
  legend: { base: 700, perLevel: 180 },
};
// レベルが上がるほど、また レア度が高いほど、強化に必要なゴールドも増えていく
function cardUpgradeCost(level, rarity) {
  const scale = CARD_UPGRADE_COST_BY_RARITY[rarity] || CARD_UPGRADE_COST_BY_RARITY.normal;
  return scale.base + (level - 1) * scale.perLevel;
}

// ---------- 絆レベル ----------
// 同じカードを繰り返し入手（重複取得）した際の、進化のさらに上位段階。純粋に見た目・演出の変化のみで、
// 能力値には影響しない（重複入手そのものに新しい価値を持たせるための仕組み）
const BOND_LEVEL_THRESHOLDS = [
  { level: 0, count: 0, title: null,        color: null },
  { level: 1, count: 5, title: '見習いの絆', color: '#c58a4a' }, // 銅
  { level: 2, count: 15, title: '深き絆',    color: '#c0c0c8' }, // 銀
  { level: 3, count: 30, title: '無二の絆',  color: '#f0c15c' }, // 金
];

// カードの累計入手数（count）から、現在の絆レベル情報を返す
function getBondLevel(count) {
  count = count || 0;
  let current = BOND_LEVEL_THRESHOLDS[0];
  for (const tier of BOND_LEVEL_THRESHOLDS) {
    if (count >= tier.count) current = tier;
  }
  const idx = BOND_LEVEL_THRESHOLDS.indexOf(current);
  const next = BOND_LEVEL_THRESHOLDS[idx + 1] || null;
  return { ...current, next };
}

function defaultState() {
  const owned = {};
  const starterIds = new Set(buildStarterDeck()); // 序盤の実用性を確保するため、初期デッキ分のカードのみ最初から所持する
  Object.keys(CARD_DEFS).forEach(id => {
    const def = CARD_DEFS[id];
    if (!starterIds.has(id)) return; // それ以外のカードは、実際にガチャで当たるまで所持しない（リーダーカード・スペル・装備・フィールドも同様）
    owned[id] = { level: 1, exp: 0, count: 1, evolved: false };
  });
  return {
    playerName: 'プレイヤー',
    avatarIcon: '🛡️',
    avatarImage: null,
    deckPresets: [],
    leaderId: null,
    tickets: 2,
    pityCounters: {},
    compendiumRewardClaimed: false,
    achievementsUnlocked: {},
    equippedTitle: null,
    playerLevel: 1,
    playerExp: 0,
    gold: 3000,
    gems: 5000,
    trophy: 0,
    seasonId: null,
    dailyDate: '', dailyProgress: 0, dailyMax: 5, dailyClaimed: false,
    winProgress: 1, winMax: 3,
    totalWins: 0,
    totalPacksOpened: 0,
    totalUpgrades: 0,
    stageProgress: 1,
    dungeonFloor: 1,
    dungeonEquipClaimed: [],
    hasSeenBattleHelp: false,
    hasSeenOnboarding: false,
    hasSeenInteractiveTutorial: false,
    sfxMuted: false,
    battleFastMode: false,
    autoBattleMode: false,
    bgmMuted: true,
    bgmVolume: 0.5,
    dragon: { level: 1, exp: 0 },
    missionsClaimed: {},
    presentsClaimed: {},
    beginnerGachaDone: false,
    cards: owned,
    deck: buildStarterDeck(),
  };
}

// 新規プレイヤー用の初期デッキを、コストの低いノーマル・レアのモンスターを中心に自動で組む。
// （CARD_DEFSの定義順に依存する「最初の12枚」方式だと、コストの重いレジェンドカードが混ざって
// 　序盤で身動きが取れなくなる不具合があったため、コストで並べ替えて選ぶ方式に変更）
function buildStarterDeck() {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  // 初心者ガチャの対象カードは、初期デッキには含めない（ガチャで手に入れる楽しみを残すため）
  const candidates = Object.keys(CARD_DEFS).filter(id => {
    const def = CARD_DEFS[id];
    if (eventExclusiveIds.has(id)) return false;
    if (BEGINNER_GACHA_CARD_IDS.has(id)) return false;
    if ((def.type || 'monster') !== 'monster') return false;
    return def.rarity === 'normal' || def.rarity === 'rare';
  }).sort((a, b) => CARD_DEFS[a].cost - CARD_DEFS[b].cost);

  const deck = [];
  let progressed = true;
  while (deck.length < 20 && progressed) {
    progressed = false;
    for (const id of candidates) {
      if (deck.length >= 20) break;
      const count = deck.filter(d => d === id).length;
      if (count < 3) { deck.push(id); progressed = true; }
    }
  }
  return deck;
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
    // 既存プレイヤーへの後方互換対応: 旧セーブにhasSeenOnboardingが無い場合、
    // 新規プレイヤー向けチュートリアルが誤って表示されないよう「見た事にする」
    if (saved.hasSeenOnboarding === undefined) saved.hasSeenOnboarding = true;
    // 体験型チュートリアル追加に伴う後方互換対応: 既存プレイヤーには表示しない
    if (saved.hasSeenInteractiveTutorial === undefined) saved.hasSeenInteractiveTutorial = true;
    // カード完全削除時の後方互換対応: 廃止したカードIDが旧セーブに残っていると、
    // カード一覧の空白セルや、デッキ内での参照切れの原因になるため、
    // 「現在のCARD_DEFSに存在しないIDすべて」を所持カード・デッキ・デッキプリセットから自動的に取り除く
    // （個別のカードIDをここに書き足す必要はなく、今後カードを削除しても自動的に対応される）
    if (saved.cards) {
      Object.keys(saved.cards).forEach(id => {
        if (!CARD_DEFS[id]) delete saved.cards[id];
      });
    }
    if (Array.isArray(saved.deck)) {
      saved.deck = saved.deck.filter(id => !!CARD_DEFS[id]);
    }
    if (Array.isArray(saved.deckPresets)) {
      saved.deckPresets.forEach(preset => {
        if (Array.isArray(preset.cards)) preset.cards = preset.cards.filter(id => !!CARD_DEFS[id]);
      });
    }
    // 「夜天の英雄」ガチャ用チケットを1枚追加配布（既存プレイヤーへ1回限り）
    if (!saved.grantedBonusTicket_20260724) {
      saved.tickets = (saved.tickets || 0) + 1;
      saved.grantedBonusTicket_20260724 = true;
    }
    // 「光耀の祝福」ガチャ用チケットを1枚配布（既存プレイヤーへ1回限り）
    if (!saved.grantedLightTicket_20260724) {
      saved.tickets = (saved.tickets || 0) + 1;
      saved.grantedLightTicket_20260724 = true;
    }
    // チケット統合: 「夜天の英雄」用・「光耀の祝福」用に分かれていたチケットを、
    // 「期間限定ガチャチケット」として1本化する（既存プレイヤーへ1回限り、既存の所持数はそのまま合算）
    if (!saved.mergedLightTickets_20260725) {
      saved.tickets = (saved.tickets || 0) + (saved.lightTickets || 0);
      delete saved.lightTickets;
      saved.mergedLightTickets_20260725 = true;
    }
    // 不具合修正: 最終ステージ（50）をクリアしても進行度が50のまま止まってしまい、「クリア済み」と
    // 表示されない不具合があったため、既存プレイヤーの対戦履歴から実際にクリア済みかどうかを判定し、
    // 該当する場合は進行度を修正する（既存プレイヤーへ1回限り）
    if (!saved.fixedFinalStageProgress_20260725) {
      if (saved.stageProgress === STAGES.length) {
        const finalStageName = STAGES[STAGES.length - 1].name;
        const clearedFinalStage = Array.isArray(saved.battleHistory)
          && saved.battleHistory.some(h => h.won && h.name === finalStageName);
        if (clearedFinalStage) saved.stageProgress = STAGES.length + 1;
      }
      saved.fixedFinalStageProgress_20260725 = true;
    }
    // 初心者ガチャ必須化に伴う後方互換対応: この仕組みが無かった時期からの既存プレイヤーが、
    // 意図せずロックされて他の画面に進めなくなることがないよう、既に完了済み扱いにする
    if (saved.beginnerGachaDone === undefined) {
      saved.beginnerGachaDone = true;
    }
    // 不具合修正: ダンジョン限定装備が最初から所持できてしまっていたため、
    // 実際にそのフロアのボスを撃破済み（dungeonEquipClaimedに記録済み）のもの以外は取り除く（既存プレイヤーへ1回限り）
    if (!saved.fixedDungeonEquipOwnership_20260724) {
      const claimedFloors = new Set(saved.dungeonEquipClaimed || []);
      const removedEquipIds = [];
      DUNGEON_EQUIPMENT_REWARDS.forEach((eid, i) => {
        const floor = (i + 1) * 10;
        if (!claimedFloors.has(floor)) {
          if (saved.cards) delete saved.cards[eid];
          removedEquipIds.push(eid);
        }
      });
      if (removedEquipIds.length) {
        if (Array.isArray(saved.deck)) {
          saved.deck = saved.deck.filter(id => !removedEquipIds.includes(id));
        }
        if (Array.isArray(saved.deckPresets)) {
          saved.deckPresets.forEach(preset => {
            if (Array.isArray(preset.cards)) preset.cards = preset.cards.filter(id => !removedEquipIds.includes(id));
          });
        }
      }
      saved.fixedDungeonEquipOwnership_20260724 = true;
    }
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

// アプリを閉じる直前など、通常のデバウンス（1.5秒待ち）を待っていられない場面で、
// 即座にクラウド同期を行う（保留中のタイマーがあればキャンセルして今すぐ実行する）
function flushCloudSyncNow() {
  if (!window.LisNoirCloud || !window.LisNoirCloud.getUser()) return;
  clearTimeout(cloudSyncTimer);
  window.LisNoirCloud.saveCloud(state)
    .then(() => setCloudSyncStatus('✅ 同期済み（' + new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + '）'))
    .catch((err) => { console.error('cloud save failed', err); setCloudSyncStatus('⚠️ 同期に失敗しました：' + (err && err.message ? err.message : '')); });
  window.LisNoirCloud.updateLeaderboard(state.playerName, state.trophy).catch((err) => console.error('leaderboard update failed', err));
}

function setCloudSyncStatus(text) {
  const el = document.getElementById('cloud-sync-status');
  if (el) el.textContent = text;
}

// 汎用の確認モーダル（window.confirm()の代替）。破壊的な操作の確認に、確実に表示される専用UIを使う
function showGenericConfirm(message, title) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('generic-confirm-overlay');
    document.getElementById('generic-confirm-title').textContent = title || '確認';
    document.getElementById('generic-confirm-desc').textContent = message;
    overlay.classList.remove('hidden');
    const yesBtn = document.getElementById('generic-confirm-yes');
    const noBtn = document.getElementById('generic-confirm-no');
    const cleanup = () => {
      overlay.classList.add('hidden');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };
    const onYes = () => { cleanup(); resolve(true); };
    const onNo = () => { cleanup(); resolve(false); };
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

// window.confirm()はスタンドアロンPWA（ホーム画面に追加したアプリ）では正しく動作しないことがあり、
// 誤ってfalse相当の挙動になるとクラウドのデータを上書き消去してしまう危険があるため、
// 確実に表示される専用モーダルに置き換えている

// ステージ・クエスト（ストーリー/ダンジョン/高難易度/特別/イベント）挑戦前の確認ポップアップ
function showStageConfirm(stage) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('stage-confirm-overlay');
    document.getElementById('stage-confirm-portrait').innerHTML = stagePortraitHtml(stage, true);
    document.getElementById('stage-confirm-name').textContent = stage.name;
    const rewardParts = [`敵HP ${stage.hp}`];
    if (stage.rewardGold) rewardParts.push(`💰${stage.rewardGold}`);
    if (stage.rewardGems) rewardParts.push(`💎${stage.rewardGems}`);
    if (stage.trophyDelta) rewardParts.push(`🏆+${stage.trophyDelta}`);
    document.getElementById('stage-confirm-detail').textContent = `このクエストに挑戦しますか？\n${rewardParts.join('　')}`;
    overlay.classList.remove('hidden');
    const yesBtn = document.getElementById('stage-confirm-yes');
    const noBtn = document.getElementById('stage-confirm-no');
    const cleanup = () => {
      overlay.classList.add('hidden');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };
    const onYes = () => { cleanup(); resolve(true); };
    const onNo = () => { cleanup(); resolve(false); };
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}
function showCloudRestoreConfirm(desc, compareHtml) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('cloud-restore-overlay');
    document.getElementById('cloud-restore-desc').textContent = desc || 'クラウドにセーブデータが見つかりました。読み込みますか？';
    const compareEl = document.getElementById('cloud-restore-compare');
    compareEl.innerHTML = compareHtml || '';
    compareEl.classList.toggle('hidden', !compareHtml);
    overlay.classList.remove('hidden');
    const yesBtn = document.getElementById('cloud-restore-yes');
    const noBtn = document.getElementById('cloud-restore-no');
    const cleanup = () => {
      overlay.classList.add('hidden');
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
    };
    const onYes = () => { cleanup(); resolve(true); };
    const onNo = () => { cleanup(); resolve(false); };
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

// ログイン時の「クラウド／この端末」選択のために、両者の主要な進行状況を簡潔に比較表示するHTMLを作る
function buildSaveCompareHtml(localState, cloudState) {
  const summarize = (s) => ({
    level: s.playerLevel || 1,
    trophy: (s.trophy || 0).toLocaleString(),
    stage: s.stageProgress || 1,
    cards: Object.keys(s.cards || {}).length,
  });
  const l = summarize(localState);
  const c = summarize(cloudState);
  const col = (label, sum) => `
    <div class="cg-cloud-restore-compare-col">
      <div class="cg-cloud-restore-compare-label">${label}</div>
      <div class="cg-cloud-restore-compare-row"><span>Lv.</span><span>${sum.level}</span></div>
      <div class="cg-cloud-restore-compare-row"><span>トロフィー</span><span>${sum.trophy}</span></div>
      <div class="cg-cloud-restore-compare-row"><span>ステージ</span><span>${sum.stage}</span></div>
      <div class="cg-cloud-restore-compare-row"><span>所持カード</span><span>${sum.cards}種</span></div>
    </div>`;
  return col('この端末', l) + col('クラウド', c);
}

// 自動でクラウドから復元した際、操作を求めず短く通知するだけのトースト表示
function showAutoRestoreToast() {
  const toast = document.getElementById('auto-restore-toast');
  if (!toast) return;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

// クラウドのデータを、現在の端末データにマージ適用する共通処理
function applyCloudData(cloudData) {
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
}

function refreshCloudAuthUI(user) {
  const loggedOut = document.getElementById('cloud-section-loggedout');
  const loggedIn = document.getElementById('cloud-section-loggedin');
  updateCloudBackupBanner(user);
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

// クラウドにログインしていない状態で、ある程度進行している場合に、ホーム画面でバックアップ設定を案内する
// （端末側のデータのみに依存していると、iOSの仕様上、突然データが消えてしまうリスクがあるため）
function updateCloudBackupBanner(user) {
  const banner = document.getElementById('cloud-backup-banner');
  if (!banner) return;
  const loggedIn = user || (window.LisNoirCloud && window.LisNoirCloud.getUser && window.LisNoirCloud.getUser());
  const shouldShow = !loggedIn && state.beginnerGachaDone && !state.cloudBackupBannerDismissed;
  banner.classList.toggle('hidden', !shouldShow);
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
      const compareHtml = buildSaveCompareHtml(state, cloudData);
      const useCloud = await showCloudRestoreConfirm('クラウドにセーブデータが見つかりました。読み込みますか？', compareHtml);
      if (useCloud) {
        applyCloudData(cloudData);
        status.textContent = 'クラウドのデータを読み込みました！';
      } else {
        // クラウド側のデータを消してしまう、取り消せない操作のため、念のためもう一度確認する
        const reallyOverwrite = await showGenericConfirm(
          'クラウドに保存されているデータは完全に消去され、元に戻せません。本当にこの端末のデータで上書きしますか？',
          '⚠️ 最終確認'
        );
        if (!reallyOverwrite) { status.textContent = ''; return; }
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
  if (!(await showGenericConfirm('ログアウトしますか？（このアカウントで再ログインすれば、いつでも続きから再開できます）', '🔓 ログアウト'))) return;
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
  updateBgmToggleLabel();
  const volSlider = document.getElementById('bgm-volume-slider');
  if (volSlider) volSlider.value = Math.round(state.bgmVolume * 100);
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

// ---------- BGM ----------
function getBgmAudio() {
  return document.getElementById('bgm-audio');
}

function updateBgmToggleLabel() {
  const btn = document.getElementById('bgm-toggle-btn');
  if (btn) btn.textContent = state.bgmMuted ? 'BGM: OFF' : 'BGM: ON';
}

function applyBgmVolume() {
  const audio = getBgmAudio();
  if (audio) audio.volume = state.bgmMuted ? 0 : state.bgmVolume;
}

// スプラッシュ画面の「START」タップ（＝最初のユーザー操作）のタイミングで呼び出す。
// ブラウザの自動再生制限により、ユーザー操作なしでは音声を再生できないため。
function playBgm() {
  const audio = getBgmAudio();
  if (!audio) return;
  applyBgmVolume();
  if (state.bgmMuted) return;
  const p = audio.play();
  if (p && p.catch) p.catch(() => {}); // 自動再生がブロックされた場合は静かに無視
}

function pauseBgm() {
  const audio = getBgmAudio();
  if (audio) audio.pause();
}

function toggleBgm() {
  state.bgmMuted = !state.bgmMuted;
  saveState();
  updateBgmToggleLabel();
  if (state.bgmMuted) {
    pauseBgm();
  } else {
    playBgm();
  }
}

function setBgmVolume(v) {
  state.bgmVolume = Math.min(1, Math.max(0, v));
  saveState();
  applyBgmVolume();
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

async function restoreBackupCode() {
  const code = document.getElementById('backup-code-in').value;
  const status = document.getElementById('backup-restore-status');
  if (!code.trim()) { status.textContent = 'コードを貼り付けてください。'; return; }
  const ok = await showGenericConfirm('現在のセーブデータを上書きして復元します。よろしいですか？', '📥 バックアップから復元');
  if (!ok) return;
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
    const elIcon = ELEMENTS[def.element] ? ELEMENTS[def.element].icon : '🌐';
    return `<div class="cg-card-stats"><span class="cg-stat field">フィールド</span><span class="cg-stat field-val">${elIcon}</span></div>`;
  }
  if (opts.hideStats) return ''; // バトル画面では別途バッジで表示するため、重複を避けて非表示にする
  const atk = def.atk + (evolved ? EVOLVE_BONUS_ATK : 0);
  const hp = def.hp + (evolved ? EVOLVE_BONUS_HP : 0);
  return `<div class="cg-card-stats"><span class="cg-stat atk">ATK ${atk}</span><span class="cg-stat hp">HP ${hp}</span></div>`;
}

// カード画像の読み込みに失敗した場合（ファイルが見つからない等）、絵文字プレースホルダーに差し替える
function handleCardImgError(imgEl) {
  const placeholder = document.createElement('div');
  placeholder.className = 'cg-card-placeholder';
  placeholder.setAttribute('style', imgEl.dataset.bgstyle || '');
  placeholder.innerHTML = `<span>${imgEl.dataset.emoji || '❓'}</span>`;
  imgEl.replaceWith(placeholder);
}
// カード詳細ポップアップ内の画像用（背景は親要素が既に持っているため、絵文字のspanだけに差し替える）
function handleDetailImgError(imgEl) {
  const span = document.createElement('span');
  span.className = 'cg-detail-emoji';
  span.textContent = imgEl.dataset.emoji || '❓';
  imgEl.replaceWith(span);
}

function renderCardFace(id, opts) {
  opts = opts || {};
  const def = CARD_DEFS[id];
  if (!def) return '';
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const small = opts.small ? ' cg-card-sm' : '';
  const evolvedClass = opts.evolved ? ' evolved-glow' : '';
  const lockedClass = opts.locked ? ' cg-card-locked' : '';
  const inDeckClass = opts.inDeck ? ' in-deck' : '';
  const inDeckBadge = opts.inDeck ? '<div class="cg-card-indeck-badge">デッキ内</div>' : '';
  const img = def.image
    ? `<img src="${def.image}" alt="${def.name}" class="cg-card-img" data-emoji="${def.emoji}" data-bgstyle="${cardArtStyle(def)}" onerror="handleCardImgError(this)"/>`
    : `<div class="cg-card-placeholder" style="${cardArtStyle(def)}"><span>${def.emoji}</span></div>`;
  const isMonster = (def.type || 'monster') === 'monster';
  const roleBadge = (isMonster && !opts.battleMode)
    ? `<span class="cg-card-role ${def.role === 'defender' ? 'defender' : 'attacker'}" title="${def.role === 'defender' ? 'ディフェンダー' : 'アタッカー'}">${def.role === 'defender' ? '🛡' : '⚔'}</span>`
    : '';
  const foil = (def.rarity === 'legend' && !opts.locked) ? `<div class="cg-card-foil ${def.rarity}"></div>` : '';
  const lockIcon = opts.locked ? '<div class="cg-card-lock-icon">🔒</div>' : '';
  // 絆レベル：同じカードを繰り返し入手した際の見た目の変化（能力値には影響しない）
  const ownedInfo = state.cards[id];
  const bond = (ownedInfo && !opts.locked) ? getBondLevel(ownedInfo.count) : null;
  const bondClass = (bond && bond.level > 0 && !opts.battleMode) ? ` cg-card-bond-lv${bond.level}` : '';
  const bondBadge = (bond && bond.level > 0 && !opts.battleMode)
    ? `<div class="cg-card-bond-badge" style="background:${bond.color}" title="${bond.title}（絆Lv.${bond.level}）">${'★'.repeat(bond.level)}</div>`
    : '';
  // バトル画面では、カード内表示をイラスト・コスト・ATK・HPの4情報のみに絞るため、名称・属性アイコンを省略
  const nameLine = opts.battleMode ? '' : `<div class="cg-card-name">${def.name}</div>`;
  const elLine = opts.battleMode ? '' : `<div class="cg-card-el" style="color:${el.color}">${el.icon}</div>`;
  const costBadgeContent = (opts.onField && isMonster)
    ? `<span class="cg-card-role-oncost ${def.role === 'defender' ? 'defender' : 'attacker'}" title="${def.role === 'defender' ? 'ディフェンダー' : 'アタッカー'}">${def.role === 'defender' ? '🛡' : '⚔'}</span>`
    : def.cost;
  return `
    <div class="cg-card${small}${evolvedClass}${lockedClass}${inDeckClass}${bondClass}" data-id="${id}" data-rarity="${def.rarity}" style="--rarity-color:${rarity.color}; box-shadow:${rarity.glow};">
      <div class="cg-card-cost">${costBadgeContent}</div>
      <div class="cg-card-art">${img}${lockIcon}${inDeckBadge}${opts.evolved ? '<span class="cg-card-evolved-badge">★</span>' : ''}${roleBadge}${foil}${bondBadge}</div>
      ${nameLine}
      ${cardStatsLine(def, opts.evolved, { hideStats: opts.battleMode })}
      ${elLine}
    </div>`;
}

// ---------- 画面切り替え ----------
const IMMERSIVE_SCREENS = ['battle', 'card-detail', 'result']; // タブバーを隠す画面

const SCREEN_TAB_MAP = { home: 'nav-home', collection: 'nav-cards', stage: 'nav-battle', shop: 'nav-shop', mission: 'nav-mission' };

function showScreen(name) {
  document.querySelectorAll('.cg-screen.active').forEach(s => {
    s.classList.remove('active');
    // フェードアウトが終わってから完全に非表示にする（表示中のアニメーションを止め、CPU/GPU負荷を抑えるため）
    setTimeout(() => { if (!s.classList.contains('active')) s.classList.add('cg-screen-idle'); }, 340);
  });
  const el = document.getElementById('screen-' + name);
  if (el) {
    el.classList.remove('cg-screen-idle');
    void el.offsetWidth; // 上のdisplay解除を確実に反映させてから、次のフレームでフェードインを開始する
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
  { name: 'シルバー', min: 3000, icon: '🥈', image: 'rank-silver.jpg' },
  { name: 'ゴールド', min: 7000, icon: '🥇', image: 'rank-gold.jpg' },
  { name: 'プラチナ', min: 15000, icon: '💠', image: 'rank-platinum.jpg' },
  { name: 'ダイヤモンド', min: 30000, icon: '💎', image: 'rank-diamond.jpg' },
];

// トロフィー数からランクTierオブジェクトを取得
function getRankTier(trophy) {
  let tierIdx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) { if (trophy >= RANK_TIERS[i].min) tierIdx = i; }
  return RANK_TIERS[tierIdx];
}

// ---------- シーズン制トロフィーリセット ----------
// 「年-月」を約1ヶ月ごとのシーズンIDとして扱う（例: '2026-07'）
function getCurrentSeasonId() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// シーズンが切り替わっていたら、トロフィーを「現在のランクの1つ下のランクの開始値」までリセットする
// （0には戻さない。例: ゴールド帯で終えたら次シーズンはシルバーの開始値1001から再開）
// 最下位ランク(ブロンズ)の場合はそのままブロンズの開始値(0)になる
function checkSeasonReset() {
  const currentSeason = getCurrentSeasonId();
  if (!state.seasonId) {
    state.seasonId = currentSeason; // 初回起動時は「今シーズン」として記録するのみ
    return;
  }
  if (state.seasonId === currentSeason) return;

  const tier = getRankTier(state.trophy || 0);
  const tierIdx = RANK_TIERS.indexOf(tier);
  const newTrophy = tierIdx > 0 ? RANK_TIERS[tierIdx - 1].min : RANK_TIERS[0].min;
  const previousTrophy = state.trophy || 0;
  state.trophy = newTrophy;
  state.seasonId = currentSeason;
  saveState();
  showSeasonResetNotice(previousTrophy, newTrophy);
}

function showSeasonResetNotice(previousTrophy, newTrophy) {
  const newTier = getRankTier(newTrophy);
  const overlay = document.getElementById('season-reset-overlay');
  if (!overlay) return;
  document.getElementById('season-reset-message').textContent =
    `シーズンが切り替わりました。前シーズンのトロフィー（${previousTrophy.toLocaleString()}）に応じて、` +
    `今シーズンは${newTier.name}ランクの開始値（🏆${newTrophy.toLocaleString()}）からスタートします。`;
  overlay.classList.remove('hidden');
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

// ---------- ログインボーナスカレンダー ----------
// 7日周期。7日目を過ぎるとまた1日目から繰り返す
const LOGIN_CALENDAR = [
  { day: 1, reward: { gold: 500 } },
  { day: 2, reward: { gems: 20 } },
  { day: 3, reward: { gold: 1000 } },
  { day: 4, reward: { gems: 30 } },
  { day: 5, reward: { gold: 1500 } },
  { day: 6, reward: { gems: 50 } },
  { day: 7, reward: { gems: 150 } },
];

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// 日付が変わっていたら、連続ログイン日数を更新する（連続が途切れていたら1日目からやり直し）
function checkLoginBonus() {
  const today = todayStr();
  if (state.loginBonusDate === today) return;
  const yesterday = yesterdayStr();
  if (state.loginBonusDate === yesterday) {
    state.loginStreak = ((state.loginStreak || 0) % 7) + 1;
  } else {
    state.loginStreak = 1;
  }
  state.loginBonusDate = today;
  state.loginBonusClaimedToday = false;
  saveState();
}

function updateLoginBonusBadge() {
  const badge = document.getElementById('login-bonus-badge');
  if (!badge) return;
  badge.classList.toggle('hidden', !!state.loginBonusClaimedToday);
}

function renderLoginBonusCalendar() {
  checkLoginBonus();
  const today = state.loginStreak || 1;
  document.getElementById('login-bonus-streak').textContent = `現在 ${today}日目`;
  document.getElementById('login-bonus-grid').innerHTML = LOGIN_CALENDAR.map(entry => {
    const claimed = entry.day < today || (entry.day === today && state.loginBonusClaimedToday);
    const isToday = entry.day === today && !state.loginBonusClaimedToday;
    const icon = entry.reward.gems ? '💎' : '💰';
    const amount = entry.reward.gems ? `${entry.reward.gems}` : `${entry.reward.gold}`;
    return `<div class="cg-login-bonus-day ${claimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
      <span class="day-label">${entry.day}日目</span>
      <span class="day-icon">${icon}</span>
      <span class="day-amount">${amount}</span>
      ${claimed ? '<span class="day-label">済</span>' : ''}
    </div>`;
  }).join('');
  const claimBtn = document.getElementById('login-bonus-claim-btn');
  claimBtn.disabled = !!state.loginBonusClaimedToday;
  claimBtn.textContent = state.loginBonusClaimedToday ? '本日は受取済み' : `${today}日目を受け取る`;
  updateLoginBonusBadge();
}

function claimLoginBonus() {
  checkLoginBonus();
  if (state.loginBonusClaimedToday) return;
  const day = state.loginStreak || 1;
  const entry = LOGIN_CALENDAR.find(e => e.day === day) || LOGIN_CALENDAR[0];
  state.gold += entry.reward.gold || 0;
  state.gems += entry.reward.gems || 0;
  state.tickets = (state.tickets || 0) + (entry.reward.tickets || 0);
  state.loginBonusClaimedToday = true;
  saveState();
  renderLoginBonusCalendar();
  renderHome();
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
  checkAchievements();
  updatePresentBadge();
  updateMissionBadge();
  checkLoginBonus();
  updateLoginBonusBadge();
  updateCloudBackupBanner();
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

  // ランクカード
  let tierIdx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) { if (state.trophy >= RANK_TIERS[i].min) tierIdx = i; }
  const tier = RANK_TIERS[tierIdx];
  const next = RANK_TIERS[tierIdx + 1];
  document.getElementById('rank-name').textContent = state.playerName;
  document.getElementById('rank-tier').textContent = `${tier.name}ランク`;
  const titleEl = document.getElementById('rank-title');
  const equippedTitleText = getEquippedTitleText();
  titleEl.textContent = equippedTitleText || '';
  titleEl.classList.toggle('hidden', !equippedTitleText);
  renderRankIcon(document.getElementById('rank-card-avatar'), tier);
  if (next) {
    const pct = Math.min(100, Math.round((state.trophy - tier.min) / (next.min - tier.min) * 100));
    document.getElementById('rank-fill').style.width = pct + '%';
    document.getElementById('rank-sub').textContent = `🏆 ${state.trophy.toLocaleString()} / ${next.min.toLocaleString()}`;
  } else {
    document.getElementById('rank-fill').style.width = '100%';
    document.getElementById('rank-sub').textContent = `🏆 ${state.trophy.toLocaleString()}（最高ランク）`;
  }

  renderDragonSummary();
  renderEventBanner();
  renderPremiumGachaBanner();
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

// 現在開催中のプレミアムガチャを、ホーム画面のバナーとして案内する
function renderPremiumGachaBanner() {
  const card = document.getElementById('premium-gacha-card');
  if (!card) return;
  const featured = SHOP_PACKS.find(p => p.featured);
  if (!featured) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  card.innerHTML = `
    <div class="cg-premium-gacha-card-title-row">
      <span class="ic">${featured.icon}</span>
      <span class="cg-premium-gacha-card-title">${featured.flavor || featured.name}</span>
      <span class="cg-premium-gacha-card-badge">開催中</span>
    </div>
    <div class="cg-premium-gacha-card-sub">${featured.name}を好評開催中！</div>`;
  card.onclick = () => { renderShop(); showScreen('shop'); };
}

// ---------- ドラゴン育成 ----------
const DRAGON_STAGES = [
  { minLevel: 1,  name: '卵',       emoji: '🥚', image: 'dragon-egg.png' },
  { minLevel: 3,  name: '幼竜',     emoji: '🐣', image: 'dragon-baby.png' },
  { minLevel: 7,  name: '若竜',     emoji: '🐲', image: 'dragon-young.png' },
  { minLevel: 13, name: '成竜',     emoji: '🐉', image: 'dragon-adult.png' },
  { minLevel: 20, name: '古代竜',   emoji: '🐉', glow: true, image: 'dragon-ancient.png' },
];
const DRAGON_FEED_EXP = 25;
// レベルが上がるほど、次のレベルに必要な経験値も増えていく（最初は元と同じ100、後半になるほど大きく増加）
function dragonExpForLevel(level) {
  return 100 + (level - 1) * 40;
}

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
  return 30 + (state.dragon.level - 1) * 6;
}

function gainDragonExp(amount) {
  const d = state.dragon;
  d.exp += amount;
  while (d.exp >= dragonExpForLevel(d.level)) {
    d.exp -= dragonExpForLevel(d.level);
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
  if (!emojiEl) return; // ホーム画面の相棒ドラゴンカードは、画面見切れ対策のため意図的に非表示にしている（クイックメニューの「ドラゴン」から利用可能）
  const stage = getDragonStageInfo(state.dragon.level);
  emojiEl.innerHTML = stage.image
    ? `<img src="${stage.image}" alt="" class="cg-dragon-summary-img" data-emoji="${stage.emoji}" onerror="handleDragonImgError(this)"/>`
    : stage.emoji;
  document.getElementById('dragon-summary-stage').textContent = `${stage.name}・Lv.${state.dragon.level}`;
  document.getElementById('dragon-summary-fill').style.width = Math.min(100, (state.dragon.exp / dragonExpForLevel(state.dragon.level)) * 100) + '%';
}

// ドラゴンの画像が見つからない場合、絵文字表示に差し替える
function handleDragonImgError(imgEl) {
  const span = document.createElement('span');
  span.textContent = imgEl.dataset.emoji || '🐉';
  imgEl.replaceWith(span);
}

function renderDragon() {
  const d = state.dragon;
  const stage = getDragonStageInfo(d.level);
  const emojiEl = document.getElementById('dragon-emoji');
  emojiEl.innerHTML = stage.image
    ? `<img src="${stage.image}" alt="" class="cg-dragon-emoji-img" data-emoji="${stage.emoji}" onerror="handleDragonImgError(this)"/>`
    : stage.emoji;
  emojiEl.classList.toggle('cg-dragon-emoji-glow', !!stage.glow);
  document.getElementById('dragon-stage-name').textContent = stage.name;
  document.getElementById('dragon-level').textContent = `Lv.${d.level}`;
  document.getElementById('dragon-exp-fill').style.width = Math.min(100, (d.exp / dragonExpForLevel(d.level)) * 100) + '%';
  document.getElementById('dragon-exp-label').textContent = `${d.exp}/${dragonExpForLevel(d.level)}`;
  document.getElementById('dragon-bonus-desc').textContent = `バトル開始時の自分のHPが +${getDragonBonusHp()}（現在の最大HP ${getPlayerMaxHp()}）`;
  document.getElementById('dragon-feed-btn').textContent = `🍖 エサをあげる（💰${dragonFeedCost()}）`;

  const listEl = document.getElementById('dragon-stages-list');
  listEl.innerHTML = DRAGON_STAGES.map(s => {
    const current = stage.name === s.name;
    const iconHtml = s.image
      ? `<img src="${s.image}" alt="" class="cg-dragon-stage-icon" data-emoji="${s.emoji}" onerror="handleDragonImgError(this)"/>`
      : `<span class="em">${s.emoji}</span>`;
    return `<div class="cg-dragon-stage-row ${current ? 'current' : ''}">
      ${iconHtml}<span>${s.name}</span><span class="lv">Lv.${s.minLevel}〜</span>
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
  updateProfileTitleDisplay();
  const grid = document.getElementById('profile-avatar-grid');
  grid.innerHTML = AVATAR_OPTIONS.map(ic =>
    `<div class="cg-profile-avatar-opt ${(!state.avatarImage && ic === state.avatarIcon) ? 'selected' : ''}" data-icon="${ic}">${ic}</div>`
  ).join('');
  grid.querySelectorAll('.cg-profile-avatar-opt').forEach(node => {
    node.addEventListener('click', () => {
      grid.querySelectorAll('.cg-profile-avatar-opt').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      pendingAvatarImage = null; // 絵文字に戻す選択がされた場合
      const preview = document.getElementById('profile-avatar-preview');
      preview.style.backgroundImage = '';
      preview.textContent = node.dataset.icon;
    });
  });
}

function updateProfileTitleDisplay() {
  const el = document.getElementById('profile-title-display');
  if (!el) return;
  const equipped = state.equippedTitle ? ACHIEVEMENTS.find(a => a.id === state.equippedTitle) : null;
  el.textContent = equipped ? equipped.title : '称号なし';
}

// 現在装着中の称号のテキストを返す（プレイヤー名の横などに表示するため）
function getEquippedTitleText() {
  const equipped = state.equippedTitle ? ACHIEVEMENTS.find(a => a.id === state.equippedTitle) : null;
  return equipped ? equipped.title : null;
}

function renderAchievementsScreen() {
  checkAchievements();
  const unlockedCount = ACHIEVEMENTS.filter(a => state.achievementsUnlocked[a.id]).length;
  document.getElementById('achievement-progress-count').textContent = `${unlockedCount}/${ACHIEVEMENTS.length}`;
  const listEl = document.getElementById('achievement-list');
  listEl.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = !!state.achievementsUnlocked[a.id];
    const progress = Math.min(a.target, a.check(state));
    const equipped = state.equippedTitle === a.id;
    return `<div class="cg-achievement-card ${unlocked ? 'unlocked' : 'locked'}" data-id="${a.id}">
      <div class="cg-achievement-card-top">
        <span class="cg-achievement-card-title">${a.title}</span>
        <span class="cg-achievement-card-status ${unlocked ? 'done' : 'pending'}">${unlocked ? '達成済み' : '未達成'}</span>
      </div>
      <div class="cg-achievement-card-desc">${a.desc}</div>
      ${!unlocked ? `
        <div class="cg-achievement-card-track"><div class="cg-achievement-card-fill" style="width:${Math.min(100, (progress / a.target) * 100)}%"></div></div>
        <div class="cg-achievement-card-progress">${progress}/${a.target}</div>
      ` : `<button class="cg-achievement-equip-btn ${equipped ? 'equipped' : ''}" data-id="${a.id}">${equipped ? '装着中' : 'この称号を装着する'}</button>`}
    </div>`;
  }).join('');
  listEl.querySelectorAll('.cg-achievement-equip-btn:not(.equipped)').forEach(btn => {
    btn.addEventListener('click', () => {
      state.equippedTitle = btn.dataset.id;
      saveState();
      renderAchievementsScreen();
      updateProfileTitleDisplay();
      renderHome();
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

async function saveProfile() {
  const name = document.getElementById('profile-name-input').value.trim();
  const selected = document.querySelector('.cg-profile-avatar-opt.selected');
  const status = document.getElementById('profile-save-status');
  if (!name) { status.textContent = 'プレイヤー名を入力してください。'; return; }
  if (!(await showGenericConfirm('保存してよいですか？', '👤 プレイヤー設定'))) return;
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

// 各ランクの範囲を「min 〜 (次のmin-1)」の形式で返す（最上位ランクは「min 〜」）
function rankTierRangeLabel(tierIdx) {
  const tier = RANK_TIERS[tierIdx];
  const next = RANK_TIERS[tierIdx + 1];
  return next ? `${tier.min.toLocaleString()} 〜 ${(next.min - 1).toLocaleString()}` : `${tier.min.toLocaleString()} 〜`;
}

function rankTierIconHtml(tier, extraClass) {
  const iconStyle = tier.image ? ` style="background-image:url('${tier.image}');background-size:cover;background-position:center;"` : '';
  const iconContent = tier.image ? '' : (tier.icon || '🛡️');
  return `<div class="cg-rank-tier-icon${extraClass ? ' ' + extraClass : ''}"${iconStyle}>${iconContent}</div>`;
}

// ランクの早見表（どこからどこまでが何ランクか）。自分の現在のランクをハイライト表示
function renderRankLegend() {
  const currentTier = getRankTier(state.trophy || 0);
  return `<div class="cg-rank-legend">
    <div class="cg-rank-legend-title">🏆 ランク早見表</div>
    ${RANK_TIERS.map((tier, idx) => `
      <div class="cg-rank-legend-item ${tier.name === currentTier.name ? 'current' : ''}">
        ${rankTierIconHtml(tier, 'sm')}
        <div class="cg-rank-legend-text">
          <b>${tier.name}</b>
          <span>🏆 ${rankTierRangeLabel(idx)}</span>
        </div>
        ${tier.name === currentTier.name ? '<span class="cg-rank-legend-you">今ここ</span>' : ''}
      </div>`).join('')}
  </div>`;
}

async function renderRanking() {
  const wrap = document.getElementById('ranking-body');
  const legendHtml = renderRankLegend();
  const user = window.LisNoirCloud && window.LisNoirCloud.getUser();
  if (!user) {
    wrap.innerHTML = legendHtml + `
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
  wrap.innerHTML = legendHtml + '<div class="cg-rank-empty">読み込み中…</div>';
  try {
    const list = await window.LisNoirCloud.getLeaderboard(50);
    if (!list.length) { wrap.innerHTML = legendHtml + '<div class="cg-rank-empty">まだランキングデータがありません。</div>'; return; }
    let lastTierName = null;
    const rowsHtml = list.map((entry, i) => {
      const entryTier = getRankTier(entry.trophy || 0);
      let divider = '';
      // ランキングの並びの中で、ランクの境目に来たら区切り線を挿入（どこまでが何ランクか一目で分かるように）
      if (entryTier.name !== lastTierName) {
        const tierIdx = RANK_TIERS.indexOf(entryTier);
        divider = `<div class="cg-rank-tier-divider">
          ${rankTierIconHtml(entryTier, 'xs')}
          <span>ここから${entryTier.name}（🏆 ${rankTierRangeLabel(tierIdx)}）</span>
        </div>`;
        lastTierName = entryTier.name;
      }
      return divider + `
      <div class="cg-rank-row ${entry.uid === user.uid ? 'me' : ''}">
        <div class="cg-rank-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
        ${rankTierIconHtml(entryTier)}
        <div class="cg-rank-name">${entry.displayName || 'プレイヤー'}${entry.uid === user.uid ? '（あなた）' : ''}</div>
        <div class="cg-rank-trophy">🏆 ${(entry.trophy || 0).toLocaleString()}</div>
      </div>`;
    }).join('');
    wrap.innerHTML = legendHtml + `<div class="cg-rank-list">${rowsHtml}</div>`;
  } catch (e) {
    console.error('leaderboard fetch failed', e);
    wrap.innerHTML = legendHtml + '<div class="cg-rank-empty">ランキングの取得に失敗しました。時間をおいて再度お試しください。</div>';
  }
}


let collectionFilter = 'all';
let collectionSortMode = 'default';
let cardListSortMode = 'default';
const RARITY_SORT_ORDER = { legend: 0, epic: 1, rare: 2, normal: 3 };
const ELEMENT_SORT_ORDER = { fire: 0, water: 1, nature: 2, light: 3, dark: 4 };

// カードIDの配列を、指定した並び順（レアリティ・属性・コスト）に並び替える。
// 'default'の場合は、CARD_DEFSの定義順（元の並び）のまま変更しない
function sortCardIds(ids, mode) {
  if (mode === 'default' || !mode) return ids;
  const arr = ids.slice();
  if (mode === 'rarity') {
    arr.sort((a, b) => (RARITY_SORT_ORDER[CARD_DEFS[a].rarity] ?? 9) - (RARITY_SORT_ORDER[CARD_DEFS[b].rarity] ?? 9));
  } else if (mode === 'element') {
    arr.sort((a, b) => (ELEMENT_SORT_ORDER[CARD_DEFS[a].element] ?? 9) - (ELEMENT_SORT_ORDER[CARD_DEFS[b].element] ?? 9));
  } else if (mode === 'cost') {
    arr.sort((a, b) => CARD_DEFS[a].cost - CARD_DEFS[b].cost);
  }
  return arr;
}

function maxCopiesFor(id) {
  const def = CARD_DEFS[id];
  if (!def) return 0;
  if (def.isLeaderCard) return 1; // リーダーカードは唯一無二のキャラクターのため1枚まで
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
      bindLongPress(node, () => showLeaderDetailInfo(node.dataset.leader));
    }
  });
}

// アルティメットスキルの発動：敵本体と敵の場にいる全モンスターに効果を及ぼす（5ターンに1回）
function executeLeaderUltimate() {
  if (!battle || battle.over) return;
  if (battle.isOnline && battle.activeSide !== 'player') return;
  const leader = getActiveLeader();
  if (!leader || !leader.ultimateSkill) return;
  if ((battle.leaderUltimateCharge || 0) < ULTIMATE_COOLDOWN_TURNS) return;
  const skill = leader.ultimateSkill;

  battle.enemyHp = Math.max(0, battle.enemyHp - skill.dmg);
  impactEffect(document.getElementById('battle-enemy-portrait'), skill.dmg, 0);

  const enemySlots = document.querySelectorAll('#battle-enemy-field .cg-field-slot');
  battle.enemyField.forEach((u, i) => {
    if (!u) return;
    const dmg = mitigateIncomingDamage(u, skill.dmg);
    u.curHp -= dmg;
    if (skill.stunTurns) u.stunned = true;
    if (skill.atkDownEnemies) u.atkBonus = (u.atkBonus || 0) - skill.atkDownEnemies;
    if (enemySlots[i]) impactEffect(enemySlots[i], dmg, 0);
  });
  battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);

  if (skill.healAllies || skill.shieldAllies) {
    battle.playerField.forEach(u => {
      if (!u) return;
      if (skill.healAllies) {
        const maxHp = u.def.hp + (u.hpBonus || 0);
        u.curHp = Math.min(maxHp, u.curHp + skill.healAllies);
      }
      if (skill.shieldAllies) u.shield = (u.shield || 0) + skill.shieldAllies;
    });
  }

  battle.leaderUltimateCharge = 0;
  battle.lastPlayedInfo = { name: skill.name, skill: skill.desc };
  submitOnlineAction('use_ultimate', {
    attackerSideField: serializeFieldForSync(battle.playerField),
    attackerSideHp: battle.playerHp,
    targetSideField: serializeFieldForSync(battle.enemyField),
    targetSideHp: battle.enemyHp,
  });

  if (battle.enemyHp <= 0) {
    renderBattle();
    setTimeout(() => showResult(true), battleMs(600));
    return;
  }
  renderBattle();
}

function renderDeck() {
  renderLeaderSelect();
  const deckEl = document.getElementById('deck-slots');
  // 同じカードは1枠にまとめ、枚数を「×N」バッジで表示する
  const groups = [];
  const idToGroup = {};
  state.deck.forEach(id => {
    if (idToGroup[id] === undefined) {
      idToGroup[id] = groups.length;
      groups.push({ id, count: 1 });
    } else {
      groups[idToGroup[id]].count++;
    }
  });
  const slotHtml = (g) => `<div class="cg-deck-slot-item" data-id="${g.id}">
       ${renderCardFace(g.id, { small: true, evolved: state.cards[g.id] && state.cards[g.id].evolved })}
       ${g.count > 1 ? `<span class="cg-deck-slot-count">×${g.count}</span>` : ''}
       <span class="cg-deck-remove-icon">✕</span>
     </div>`;
  deckEl.innerHTML = groups.map(slotHtml).join('') + (state.deck.length === 0 ? '<div class="cg-empty">デッキにカードがありません</div>' : '');
  document.getElementById('deck-count').textContent = `${state.deck.length}/40`;
  renderDeckSynergy();

  // タップで1枚外す（デッキ内の並び順はバトル開始時に必ずシャッフルされ、ゲームプレイに影響しないため、
  // 以前あった「タップで選択→タップで並び替え」という操作は廃止し、「タップ＝外す」に統一している）
  const bindDeckSlotHandlers = (container) => {
    container.querySelectorAll('.cg-deck-slot-item').forEach(item => {
      item.addEventListener('click', () => {
        if (longPressFired) { longPressFired = false; return; }
        const id = item.dataset.id;
        const idx = state.deck.indexOf(id);
        if (idx !== -1) state.deck.splice(idx, 1);
        saveState();
        renderDeck();
      });
      bindLongPress(item, () => showHandCardInfo(item.dataset.id));
    });
  };
  bindDeckSlotHandlers(deckEl);

  const validDeckIds = state.deck.filter(id => !!CARD_DEFS[id]);
  const avgCost = validDeckIds.length
    ? (validDeckIds.reduce((s, id) => s + CARD_DEFS[id].cost, 0) / validDeckIds.length).toFixed(1)
    : '0.0';
  document.getElementById('deck-avgcost').textContent = avgCost;

  renderDeckPresets();

  const collEl = document.getElementById('collection-list');
  const owned = sortCardIds(Object.keys(state.cards).filter(id => {
    if (!CARD_DEFS[id]) return false; // 削除済みカードが紛れていた場合、空白セルにならないよう除外
    if (collectionFilter === 'all') return true;
    return (CARD_DEFS[id].type || 'monster') === collectionFilter;
  }), collectionSortMode);
  collEl.innerHTML = owned.map(id => {
    const count = countInDeck(id);
    const max = maxCopiesFor(id);
    const atMax = count >= max;
    return `<div class="cg-coll-item ${count > 0 ? 'in-deck' : ''} ${atMax ? 'at-max' : ''}" data-id="${id}">
      ${renderCardFace(id, { small: true, evolved: state.cards[id].evolved })}
      ${count > 0 ? `<span class="cg-coll-count">×${count}</span><button class="cg-coll-remove-btn" data-id="${id}" aria-label="デッキから1枚外す">−</button>` : ''}
    </div>`;
  }).join('');

  collEl.querySelectorAll('.cg-coll-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const idx = state.deck.indexOf(id);
      if (idx !== -1) state.deck.splice(idx, 1);
      saveState();
      renderDeck();
    });
  });
  collEl.querySelectorAll('.cg-coll-item').forEach(node => {
    node.addEventListener('click', () => {
      if (longPressFired) { longPressFired = false; return; }
      const id = node.dataset.id;
      const max = maxCopiesFor(id);
      if (countInDeck(id) >= max) {
        node.classList.remove('cg-shake'); void node.offsetWidth; node.classList.add('cg-shake');
        return;
      }
      if (state.deck.length >= 40) return;
      state.deck.push(id);
      saveState();
      renderDeck();
    });
    bindLongPress(node, () => showHandCardInfo(node.dataset.id));
  });
}

// ---------- デッキシナジー表示 ----------
// デッキ内のモンスターカードの属性・役割バランスを可視化し、初心者でも組みやすいよう簡単なアドバイスを添える
function renderDeckSynergy() {
  const panel = document.getElementById('deck-synergy-panel');
  if (!panel) return;
  const monsterIds = state.deck.filter(id => CARD_DEFS[id] && (CARD_DEFS[id].type || 'monster') === 'monster');
  if (monsterIds.length === 0) {
    panel.innerHTML = '<div class="cg-synergy-title">📊 デッキシナジー</div><div class="cg-synergy-empty">モンスターカードをデッキに追加すると、属性・役割のバランスが表示されます</div>';
    return;
  }
  const elementCounts = {};
  const roleCounts = { attacker: 0, defender: 0 };
  monsterIds.forEach(id => {
    const def = CARD_DEFS[id];
    elementCounts[def.element] = (elementCounts[def.element] || 0) + 1;
    const role = def.role === 'defender' ? 'defender' : 'attacker';
    roleCounts[role]++;
  });
  const total = monsterIds.length;
  const elementOrder = ['fire', 'water', 'nature', 'light', 'dark'];
  const presentElements = elementOrder.filter(e => elementCounts[e]);

  const elementBarHtml = presentElements.map(e => {
    const pct = Math.round((elementCounts[e] / total) * 100);
    const el = ELEMENTS[e];
    return `<div class="cg-synergy-seg" style="width:${pct}%; background:${el.color};" title="${el.name} ${elementCounts[e]}枚（${pct}%）"></div>`;
  }).join('');
  const elementLegendHtml = presentElements.map(e => {
    const el = ELEMENTS[e];
    const pct = Math.round((elementCounts[e] / total) * 100);
    return `<span class="cg-synergy-legend-item"><span class="cg-synergy-dot" style="background:${el.color}"></span>${el.icon}${el.name} ${elementCounts[e]}（${pct}%）</span>`;
  }).join('');

  const atkPct = Math.round((roleCounts.attacker / total) * 100);
  const defPct = 100 - atkPct;

  // 初心者向けの簡単なアドバイスを生成
  const tips = [];
  const dominantElement = presentElements.reduce((a, b) => (elementCounts[a] >= elementCounts[b] ? a : b));
  const dominantRatio = elementCounts[dominantElement] / total;
  if (presentElements.length >= 4) {
    tips.push('属性が広く分散しています。属性を絞ると、対応するリーダーのボーナスを活かしやすくなります。');
  } else if (dominantRatio >= 0.6) {
    tips.push(`${ELEMENTS[dominantElement].icon}${ELEMENTS[dominantElement].name}属性が中心の構成です。対応するリーダーを選ぶと恩恵を受けやすくなります。`);
  }
  if (roleCounts.defender === 0) {
    tips.push('ディフェンダーがいません。相手の攻撃を受け止めるカードを入れると安定しやすくなります。');
  } else if (defPct >= 60) {
    tips.push('ディフェンダーが多めの構成です。攻めきれるよう、アタッカーも意識すると良いかもしれません。');
  }
  if (monsterIds.length < 15) {
    tips.push('モンスターの枚数が少なめです。増やすと安定した展開がしやすくなります。');
  }

  panel.innerHTML = `
    <div class="cg-synergy-title">📊 デッキシナジー</div>
    <div class="cg-synergy-row">
      <div class="cg-synergy-label">属性バランス</div>
      <div class="cg-synergy-bar">${elementBarHtml}</div>
    </div>
    <div class="cg-synergy-legend">${elementLegendHtml}</div>
    <div class="cg-synergy-row">
      <div class="cg-synergy-label">役割バランス</div>
      <div class="cg-synergy-bar">
        <div class="cg-synergy-seg" style="width:${atkPct}%; background:var(--hp-red);" title="アタッカー ${roleCounts.attacker}枚"></div>
        <div class="cg-synergy-seg" style="width:${defPct}%; background:#3f6f8f;" title="ディフェンダー ${roleCounts.defender}枚"></div>
      </div>
    </div>
    <div class="cg-synergy-legend">
      <span class="cg-synergy-legend-item"><span class="cg-synergy-dot" style="background:var(--hp-red)"></span>⚔ アタッカー ${roleCounts.attacker}（${atkPct}%）</span>
      <span class="cg-synergy-legend-item"><span class="cg-synergy-dot" style="background:#3f6f8f"></span>🛡 ディフェンダー ${roleCounts.defender}（${defPct}%）</span>
    </div>
    ${tips.length ? `<div class="cg-synergy-tips">${tips.map(t => `<div class="cg-synergy-tip">💡 ${t}</div>`).join('')}</div>` : ''}
  `;
}

// ---------- デッキ保存（プリセット） ----------
const MAX_DECK_PRESETS = 5;

// ---------- デッキ共有コード ----------
// フレンドとお互いのデッキを見せ合うための機能。サーバーを介さず、コードの中にデッキ情報を
// そのまま埋め込む方式（コードをコピーして相手に送り、相手が貼り付けると内容を確認できる）
function generateDeckShareCode() {
  const payload = {
    n: state.playerName,
    l: state.leaderId,
    d: state.deck,
  };
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeDeckShareCode(code) {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const payload = JSON.parse(json);
    if (!payload || !Array.isArray(payload.d)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function openDeckShareOverlay() {
  document.getElementById('deck-share-code-text').value = generateDeckShareCode();
  document.getElementById('deck-share-view-result').innerHTML = '';
  document.getElementById('deck-share-input').value = '';
  document.getElementById('deck-share-overlay').classList.remove('hidden');
}

function copyDeckShareCode() {
  const textEl = document.getElementById('deck-share-code-text');
  textEl.select();
  try {
    navigator.clipboard.writeText(textEl.value);
  } catch (e) {
    document.execCommand('copy');
  }
  const btn = document.getElementById('deck-share-copy-btn');
  const original = btn.textContent;
  btn.textContent = 'コピーしました！';
  setTimeout(() => { btn.textContent = original; }, 1500);
}

// フレンドから受け取ったデッキ共有コードを読み取り、その内容を表示する（読み取り専用。自分のデッキには影響しない）
function viewSharedDeckCode() {
  const code = document.getElementById('deck-share-input').value;
  const resultEl = document.getElementById('deck-share-view-result');
  const payload = decodeDeckShareCode(code);
  if (!payload) {
    resultEl.innerHTML = '<div class="cg-empty">コードを読み取れませんでした。正しいコードか確認してください。</div>';
    return;
  }
  const leader = payload.l ? LEADERS[payload.l] : null;
  const groups = [];
  const idToGroup = {};
  payload.d.forEach(id => {
    if (!CARD_DEFS[id]) return; // 相手側で削除済みのカードは無視
    if (idToGroup[id] === undefined) { idToGroup[id] = groups.length; groups.push({ id, count: 1 }); }
    else groups[idToGroup[id]].count++;
  });
  resultEl.innerHTML = `
    <div class="cg-shared-deck-header">
      <div class="cg-shared-deck-name">${payload.n || '名無しのプレイヤー'} さんのデッキ</div>
      ${leader ? `<div class="cg-shared-deck-leader">👑 リーダー: ${leader.name}（${leader.skillName}）</div>` : ''}
      <div class="cg-shared-deck-count">合計 ${payload.d.length}枚</div>
    </div>
    <div class="cg-shared-deck-grid">
      ${groups.map(g => `
        <div class="cg-shared-deck-item">
          ${renderCardFace(g.id, { small: true, locked: !state.cards[g.id] })}
          ${g.count > 1 ? `<span class="cg-coll-count">×${g.count}</span>` : ''}
        </div>`).join('')}
    </div>
    <div class="cg-deck-hint">グレー表示のカードは、あなたがまだ持っていないカードです</div>`;
}

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
      <button class="cg-deck-preset-edit-btn" data-index="${i}">編集</button>
      <button class="cg-deck-preset-del-btn" data-index="${i}" aria-label="削除">削除</button>
    </div>`).join('');
  wrap.querySelectorAll('.cg-deck-preset-load-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = Number(btn.dataset.index);
      const preset = state.deckPresets[i];
      if (!preset) return;
      if (!(await showGenericConfirm(`「${preset.name}」を読み込みます。現在編成中のデッキは上書きされます。よろしいですか？`, '📁 デッキ読み込み'))) return;
      state.deck = preset.cards.slice();
      saveState();
      renderDeck();
    });
  });
  wrap.querySelectorAll('.cg-deck-preset-edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = Number(btn.dataset.index);
      const preset = state.deckPresets[i];
      if (!preset) return;
      const newName = prompt('デッキ名を編集できます（「OK」を押すと、内容も現在編成中のデッキで上書きされます）', preset.name);
      if (newName === null) return; // キャンセル
      if (!(await showGenericConfirm(`「${newName || preset.name}」として、名前と内容（現在編成中のデッキ）を上書き保存します。よろしいですか？`, '📁 デッキ編集'))) return;
      preset.name = (newName || preset.name).slice(0, 16);
      preset.cards = state.deck.slice();
      saveState();
      renderDeck();
    });
  });
  wrap.querySelectorAll('.cg-deck-preset-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = Number(btn.dataset.index);
      const preset = state.deckPresets[i];
      if (!preset) return;
      if (!(await showGenericConfirm(`「${preset.name}」を削除します。よろしいですか？`, '📁 デッキ削除'))) return;
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

async function clearDeck() {
  if (!state.deck.length) return;
  if (!(await showGenericConfirm('デッキ内のカードをすべて外します。よろしいですか？', '🗑️ デッキを空にする'))) return;
  state.deck = [];
  saveState();
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
  addUpTo(monsters, 32);
  addUpTo(others, 40);
  state.deck = deck.slice(0, 40);
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

// 図鑑：モンスター・スペル・装備・フィールドの全カード種を対象にした所持数（進化状況は問わない）
// 期間限定ガチャ専用カードは、他の画面と同様に入手するまで図鑑の対象外（引くまで存在自体を明かさない仕様のため）
function getCompendiumProgress() {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const allIds = Object.keys(CARD_DEFS).filter(id => !eventExclusiveIds.has(id));
  const ownedCount = allIds.filter(id => !!state.cards[id]).length;
  return { ownedCount, total: allIds.length };
}

function renderCompendiumPanel() {
  const { ownedCount, total } = getCompendiumProgress();
  document.getElementById('compendium-count').textContent = `${ownedCount}/${total}`;
  document.getElementById('compendium-fill').style.width = Math.min(100, (ownedCount / total) * 100) + '%';
  const claimBtn = document.getElementById('compendium-claim-btn');
  const complete = ownedCount >= total;
  claimBtn.classList.toggle('hidden', !complete || state.compendiumRewardClaimed);
  claimBtn.textContent = state.compendiumRewardClaimed
    ? '受取済み'
    : `🎁 コンプリート報酬を受け取る（💰${COMPENDIUM_REWARD.gold} 💎${COMPENDIUM_REWARD.gems} 🏆+${COMPENDIUM_REWARD.trophy}）`;
}

function claimCompendiumReward() {
  const { ownedCount, total } = getCompendiumProgress();
  if (ownedCount < total || state.compendiumRewardClaimed) return;
  state.gold += COMPENDIUM_REWARD.gold;
  state.gems += COMPENDIUM_REWARD.gems;
  state.trophy += COMPENDIUM_REWARD.trophy;
  state.compendiumRewardClaimed = true;
  saveState();
  renderCompendiumPanel();
  renderHome();
}

let cardListFilter = 'all';
let cardListDeckOnly = false;
let cardListOrder = [];

function setCardListFilter(filter) {
  cardListFilter = filter;
  document.querySelectorAll('#cardlist-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderCardList();
}

function toggleCardListDeckOnly() {
  cardListDeckOnly = !cardListDeckOnly;
  document.getElementById('cardlist-deckonly-toggle').classList.toggle('active', cardListDeckOnly);
  renderCardList();
}

// リーダーを、カード図鑑内でカードと同じ見た目で表示するための専用レンダリング関数
// （リーダーはCARD_DEFSのカードではないため、renderCardFaceとは別に用意する）
function renderLeaderCardFace(lid) {
  const l = LEADERS[lid];
  if (!l) return '';
  const el = ELEMENTS[l.element];
  const isActive = state.leaderId === lid;
  const bgStyle = 'background:linear-gradient(160deg,#3a1f63,#1c0f33);';
  const img = l.fullImage
    ? `<img src="${l.fullImage}" alt="${l.name}" class="cg-card-img" data-emoji="👑" data-bgstyle="${bgStyle}" onerror="handleCardImgError(this)"/>`
    : `<div class="cg-card-placeholder" style="${bgStyle}"><span>👑</span></div>`;
  return `
    <div class="cg-card cg-card-sm ${isActive ? 'in-deck' : ''}" data-leader="${lid}" data-rarity="legend" style="--rarity-color:${RARITY.legend.color}; box-shadow:${RARITY.legend.glow};">
      <div class="cg-card-cost">👑</div>
      <div class="cg-card-art">${img}${isActive ? '<div class="cg-card-indeck-badge">設定中</div>' : ''}<div class="cg-card-foil legend"></div></div>
      <div class="cg-card-name">${l.name}</div>
      <div class="cg-card-stats"><span class="cg-stat">${l.skillName}</span></div>
      <div class="cg-card-el" style="color:${el.color}">${el.icon}</div>
    </div>`;
}

// リーダーの詳細情報（リーダースキル・アルティメットスキル）を表示するポップアップ
function showLeaderDetailInfo(lid) {
  const l = LEADERS[lid];
  if (!l) return;
  const el = ELEMENTS[l.element];
  const isActive = state.leaderId === lid;
  const inBattle = !!(battle && !battle.over);
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="background:linear-gradient(160deg,#3a1f63,#1c0f33);">
      ${l.fullImage ? `<img src="${l.fullImage}" data-emoji="👑" onerror="handleDetailImgError(this)"/>` : `<span class="cg-detail-emoji">👑</span>`}
      <div class="cg-card-foil legend"></div>
    </div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${l.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${RARITY.legend.color}">レジェンド・リーダー</span>${isActive ? ' <span class="cg-evolved-tag">設定中</span>' : ''}</div>
      <div class="cg-detail-desc">属性: <span style="color:${elementTextColor(l.element)}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc"><b>👑 リーダースキル：${l.skillName}</b><br>${l.desc}</div>
      ${l.ultimateSkill ? `<div class="cg-detail-desc"><b>⚡ アルティメットスキル：${l.ultimateSkill.name}</b><br>${l.ultimateSkill.desc}<br><span style="opacity:.75;">（バトル中、5ターンごとに使用可能）</span></div>` : ''}
      ${inBattle ? '' : `<button class="cg-btn cg-btn-main" id="leader-detail-select-btn" data-leader="${lid}">${isActive ? '設定中' : 'このリーダーを設定'}</button>`}
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
  const selectBtn = document.getElementById('leader-detail-select-btn');
  if (selectBtn && !isActive) {
    selectBtn.addEventListener('click', () => {
      state.leaderId = lid;
      saveState();
      document.getElementById('card-info-overlay').classList.add('hidden');
      renderLeaderSelect();
      renderCardList();
      renderHome();
    });
  }
}

function renderCardList() {
  const listEl = document.getElementById('cardlist-grid');
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const deckIdSet = new Set(state.deck);
  const ids = sortCardIds(Object.keys(CARD_DEFS).filter(id => {
    if (eventExclusiveIds.has(id) && !state.cards[id]) return false; // 期間限定カードは入手するまで図鑑にも表示しない
    if (cardListDeckOnly && !deckIdSet.has(id)) return false; // デッキ内のみ表示
    if (cardListFilter === 'all') return true;
    return (CARD_DEFS[id].type || 'monster') === cardListFilter;
  }), cardListSortMode);
  cardListOrder = ids.filter(id => !!state.cards[id]); // 前へ/次へナビゲーションの対象は所持カードのみ
  const cardHtml = ids.map(id => {
    const owned = state.cards[id];
    return owned
      ? renderCardFace(id, { small: true, evolved: owned.evolved, inDeck: deckIdSet.has(id) })
      : renderCardFace(id, { small: true, locked: true });
  }).join('');
  listEl.innerHTML = cardHtml
    + (ids.length === 0 ? `<div class="cg-empty">${cardListDeckOnly ? 'デッキにカードが入っていません' : '該当するカードがありません'}</div>` : '');
  listEl.querySelectorAll('.cg-card[data-id]').forEach(node => {
    const id = node.dataset.id;
    if (state.cards[id]) {
      node.addEventListener('click', () => openCardDetail(id));
    } else {
      node.addEventListener('click', () => showLockedCardInfo(id));
    }
  });
  renderCompendiumPanel();
}

// リーダー一覧（カード図鑑とは別の、専用セクション）
function renderLeaderList() {
  const gridEl = document.getElementById('leader-list-grid');
  if (!gridEl) return;
  gridEl.innerHTML = Object.keys(LEADERS).map(lid => renderLeaderCardFace(lid)).join('');
  gridEl.querySelectorAll('.cg-card[data-leader]').forEach(node => {
    node.addEventListener('click', () => showLeaderDetailInfo(node.dataset.leader));
  });
}

// 未所持カードをタップした時の簡易情報表示（長押しカード情報ポップアップを流用）
function showLockedCardInfo(id) {
  const def = CARD_DEFS[id];
  if (!def) return;
  const el = ELEMENTS[def.element];
  const type = def.type || 'monster';
  const typeLabel = type === 'monster' ? 'モンスター' : type === 'spell' ? 'スペル' : type === 'equipment' ? '装備' : 'フィールド';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art cg-card-locked" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}" data-emoji="${def.emoji}" onerror="handleDetailImgError(this)"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:var(--text-dim-panel)">🔒 未所持</span></div>
      <div class="cg-detail-desc">属性: <span style="color:${elementTextColor(def.element)}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">種別: ${typeLabel}　コスト: ${def.cost}</div>
      <div class="cg-detail-desc">ガチャで入手すると、図鑑に登録されます</div>
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
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
  const deckCount = countInDeck(id);
  const maxCopies = maxCopiesFor(id);
  const deckControlHtml = `
    <div class="cg-detail-deck-row ${deckCount > 0 ? 'in-deck' : ''}">
      <span class="cg-detail-deck-count">${deckCount > 0 ? '🃏 デッキ内: ' + deckCount + '/' + maxCopies + '枚' : 'デッキ未編成'}</span>
      <button class="cg-btn cg-detail-deck-btn" id="detail-deck-remove-btn" ${deckCount <= 0 ? 'disabled' : ''}>− 外す</button>
      <button class="cg-btn cg-btn-main cg-detail-deck-btn" id="detail-deck-add-btn" ${(deckCount >= maxCopies || state.deck.length >= 40) ? 'disabled' : ''}>＋ 追加</button>
    </div>`;
  const bond = getBondLevel(owned.count);
  const bondHtml = `
    <div class="cg-detail-bond-row" style="${bond.level > 0 ? `border-color:${bond.color};` : ''}">
      <span class="cg-detail-bond-label">${bond.level > 0 ? `${'★'.repeat(bond.level)} ${bond.title}（絆Lv.${bond.level}）` : '絆レベルなし（重複入手で称号を獲得）'}</span>
      <span class="cg-detail-bond-progress">${bond.next ? `累計${owned.count}枚 / 次まであと${bond.next.count - owned.count}枚` : `累計${owned.count}枚（最大絆レベル）`}</span>
    </div>`;
  document.getElementById('detail-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}" data-emoji="${def.emoji}" onerror="handleDetailImgError(this)"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${owned.evolved ? '<span class="cg-card-evolved-badge lg">★</span>' : ''}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level">${isMonster ? `Lv.${owned.level} ` : ''}<span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${owned.evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      ${bondHtml}
      ${deckControlHtml}
      ${isMonster ? `<div class="cg-detail-bar"><div class="cg-detail-bar-fill" style="width:${owned.level >= CARD_MAX_LEVEL ? 100 : Math.min(100, owned.exp)}%"></div></div>` : ''}
      <div class="cg-detail-desc">属性: <span style="color:${elementTextColor(def.element)}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def, owned.evolved)}
      </div>
      ${isMonster ? (owned.level >= CARD_MAX_LEVEL
        ? `<div class="cg-evolve-done">Lv.${CARD_MAX_LEVEL}（最大レベル）</div>`
        : `<button class="cg-btn cg-btn-main" id="detail-upgrade-btn">強化 (💰${cardUpgradeCost(owned.level, def.rarity)})</button>
           <div class="cg-detail-gold-owned">所持ゴールド：💰${state.gold.toLocaleString()}</div>`) : ''}
      ${isMonster ? `
        <div class="cg-evolve-row">
          ${owned.evolved
            ? `<div class="cg-evolve-done">★ 進化済み（ATK+${EVOLVE_BONUS_ATK} HP+${EVOLVE_BONUS_HP} 適用中）</div>`
            : `<button class="cg-btn cg-evolve-btn" id="detail-evolve-btn" ${owned.level < EVOLVE_LEVEL_REQ ? 'disabled' : ''}>
                 ${owned.level < EVOLVE_LEVEL_REQ ? `進化はLv.${EVOLVE_LEVEL_REQ}で解放` : `進化 (💰${EVOLVE_COST})`}
               </button>`}
        </div>` : ''}
    </div>`;
  const deckAddBtn = document.getElementById('detail-deck-add-btn');
  if (deckAddBtn) deckAddBtn.addEventListener('click', () => {
    if (state.deck.length >= 40 || countInDeck(id) >= maxCopiesFor(id)) return;
    state.deck.push(id);
    saveState();
    openCardDetail(id);
  });
  const deckRemoveBtn = document.getElementById('detail-deck-remove-btn');
  if (deckRemoveBtn) deckRemoveBtn.addEventListener('click', () => {
    const idx = state.deck.indexOf(id);
    if (idx === -1) return;
    state.deck.splice(idx, 1);
    saveState();
    openCardDetail(id);
  });
  const upgradeBtn = document.getElementById('detail-upgrade-btn');
  if (upgradeBtn) upgradeBtn.addEventListener('click', () => {
    const cost = cardUpgradeCost(state.cards[id].level, CARD_DEFS[id].rarity);
    if (state.gold >= cost && state.cards[id].level < CARD_MAX_LEVEL) {
      state.gold -= cost;
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

// チュートリアル専用のステージ（本編のストーリー進行・実績には一切影響しない）。
// HPを低く設定し、チュートリアルの7ステップが終わった直後にすぐ勝敗がつくようにしている
const TUTORIAL_STAGE = {
  id: 'tutorial', name: 'チュートリアルの相手', portrait: '🎓', hp: 6, spellChance: 0, bgTheme: 'forest',
  weights: { normal: 100, rare: 0, epic: 0, legend: 0 }, rewardGold: 50, rewardGems: 0, trophyDelta: 0,
  isTutorialStage: true,
};

const STAGES = [
  { id: 1, name: '森を彷徨う影', portrait: '🐺', hp: 11, bossCard: 'nature_wolf', spellChance: 0.02, bgTheme: 'forest',
    weights: { normal: 95, rare: 5, epic: 0, legend: 0 }, rewardGold: 80, rewardGems: 5, trophyDelta: 20,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '呪いを喰らう獣＝モンスターが跋扈する時代。人々は結界の内側で身を寄せ合い、外の世界を恐れながら暮らしていた。' },
      { speaker: 'ナレーター', portrait: '📖', text: '小さな村を守るため、若き主人公が今日、初めて森へと足を踏み入れる。' },
      { speaker: '主人公', portrait: '🧑', text: '……大丈夫。剣の握り方は習った。あとは、度胸だけだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '村の外れで、彷徨う影に遭遇した。低い唸り声が、木々の間から響く。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '一体、また一体。震える手で剣を構えながら、影を退けていく。' },
      { speaker: '主人公', portrait: '🧑', text: '……勝てた。本当に、勝てるんだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '束の間の平穏の中、彼は森の奥へと続く道を見つめた。' },
    ] },
  { id: 2, name: '素材集めの試練', portrait: '🍃', hp: 12, bossCard: 'fire_imp', spellChance: 0.02, bgTheme: 'snow',
    weights: { normal: 80, rare: 17, epic: 3, legend: 0 }, rewardGold: 90, rewardGems: 6, trophyDelta: 25,
    storyIntro: [
      { speaker: '村長', portrait: '👴', text: 'よく戻った。噂には聞いていたが、まさか本当に森の影を退けるとはな。' },
      { speaker: '村長', portrait: '👴', text: '村を建て直すには、モンスターが落とす「呪素材」が要る。危険だが、頼めるか？' },
      { speaker: '主人公', portrait: '🧑', text: '……分かった。この村のためなら。' },
      { speaker: 'ナレーター', portrait: '📖', text: '荒れた雪原に、素材を守るモンスターの気配があった。吐く息が、白く凍りつく。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '手に入れた呪素材は、まだ温かく、確かな力を宿していた。' },
      { speaker: '主人公', portrait: '🧑', text: 'これが……呪いの結晶。なんだか、悲しい色をしている。' },
      { speaker: 'ナレーター', portrait: '📖', text: '村へ戻る足取りは、来た時より少しだけ重かった。' },
    ] },
  { id: 3, name: '深淵よりの囁き', portrait: '🔮', hp: 14, bossCard: 'nature_wolf', spellChance: 0.03, bgTheme: 'cave',
    weights: { normal: 55, rare: 32, epic: 11, legend: 2 }, rewardGold: 110, rewardGems: 8, trophyDelta: 28,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '洞窟の奥から、言葉にならない囁きが聞こえる。呪いに深く蝕まれたモンスターの気配だ。' },
      { speaker: '主人公', portrait: '🧑', text: '……この声、何を言っているんだ？ まるで、誰かに助けを求めているような。' },
      { speaker: 'ナレーター', portrait: '📖', text: '闇の奥で、無数の目がこちらを見つめていた。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '囁きは静まった。だが、これほどの呪いが集まる理由が、どうしても引っかかる。' },
      { speaker: '主人公', portrait: '🧑', text: 'まるで、この森全体が何かに怯えているみたいだ。' },
    ] },
  { id: 4, name: '竜の血を継ぐ者', portrait: '🐲', hp: 17, bossCard: 'fire_flameslime', spellChance: 0.03, bgTheme: 'volcano',
    weights: { normal: 32, rare: 35, epic: 26, legend: 7 }, rewardGold: 140, rewardGems: 11, trophyDelta: 32,
    storyIntro: [
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: 'グルル……我が縄張りに踏み込むとは、良い度胸だ。' },
      { speaker: '主人公', portrait: '🧑', text: '……古き竜。伝説でしか聞いたことがない。' },
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: '人の子よ、お前もこの呪いに焼かれたいか？ ならばかかってくるがいい。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '古き竜の力もまた、呪いに触れれば牙を剥く。それでも、この地に平和が戻った。' },
      { speaker: '竜の血を継ぐ者', portrait: '🐲', text: '……ぐ……見事だ、人の子よ。この森には、まだ知らぬ強者がいる。心せよ。' },
    ] },
  { id: 5, name: '森の女王', portrait: '👑', hp: 20, bossCard: 'nature_venomscorpion', spellChance: 0.04, bgTheme: 'castle',
    weights: { normal: 12, rare: 28, epic: 38, legend: 22 }, rewardGold: 160, rewardGems: 13, trophyDelta: 40,
    storyIntro: [
      { speaker: '森の女王', portrait: '👑', text: 'ここまで来たか、人の子よ。ならば見せてやろう、この森の真の姿を。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたが……この森を統べる者。なぜ、こんなにも多くのモンスターが呪われているんですか？' },
      { speaker: '森の女王', portrait: '👑', text: 'ふふ……その問いに答える資格が、お前にあるかどうか。まずは力を示せ。' },
    ],
    storyVictory: [
      { speaker: '森の女王', portrait: '👑', text: '……見事だ。だが人の子よ、覚えておくがいい。呪いの源は、まだ遥か先にある。' },
      { speaker: '森の女王', portrait: '👑', text: 'この森を抜けた先に、かつて栄えた月影の国がある。そこで、お前は真実の一端を知るだろう。' },
      { speaker: '主人公', portrait: '🧑', text: '……ありがとうございます。必ず、この呪いの正体を突き止めてみせます。' },
    ] },
  { id: 6, name: '月下の斥候', portrait: '🌙', hp: 24, bossCard: 'dark_shadowbat', spellChance: 0.05, bgTheme: 'moonshadow',
    weights: { normal: 20, rare: 32, epic: 35, legend: 13 }, rewardGold: 190, rewardGems: 16, trophyDelta: 44,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '森を抜けた先には、かつて栄えたという月影の国の廃墟が広がっていた。' },
      { speaker: '主人公', portrait: '🧑', text: '……こんなに大きな国が、なぜここまで荒れ果てているんだ。' },
      { speaker: '月下の斥候', portrait: '🌙', text: '……よそ者か。この廃墟に近づく者は、逃さない。' },
      { speaker: '主人公', portrait: '🧑', text: '待ってくれ、争うつもりはない。ただ、話が聞きたいだけなんだ。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '廃墟の奥に、まだ息づく者たちがいた。ここから、村と国の復興が始まる。' },
      { speaker: '月下の斥候', portrait: '🌙', text: '……その力、本物のようだな。良かろう、お前の話を聞こう。' },
    ] },
  { id: 7, name: '荒野の守護者', portrait: '🍃', hp: 28, bossCard: 'nature_swiftrabbit', spellChance: 0.05, bgTheme: 'emerald',
    weights: { normal: 14, rare: 30, epic: 38, legend: 18 }, rewardGold: 220, rewardGems: 19, trophyDelta: 48,
    storyIntro: [
      { speaker: '荒野の守護者', portrait: '🍃', text: '復興だと？ この荒野に、もう希望などない。' },
      { speaker: '主人公', portrait: '🧑', text: 'それでも、諦めたくないんだ。誰かが最初の一歩を踏み出さなければ、何も変わらない。' },
      { speaker: '荒野の守護者', portrait: '🍃', text: '……青臭い理想だ。だが、嫌いではない。力を示してみせろ。' },
    ],
    storyVictory: [
      { speaker: '荒野の守護者', portrait: '🍃', text: '……お前のような者がいるなら、まだ望みはあるのかもしれん。' },
      { speaker: '主人公', portrait: '🧑', text: '一緒に、この国を立て直そう。' },
      { speaker: '荒野の守護者', portrait: '🍃', text: 'フン……悪くない誘いだ。' },
    ] },
  { id: 8, name: '氷の試練', portrait: '❄️', hp: 33, bossCard: 'water_slime', spellChance: 0.06, bgTheme: 'frost',
    weights: { normal: 8, rare: 26, epic: 40, legend: 26 }, rewardGold: 250, rewardGems: 22, trophyDelta: 52,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '新たな仲間を迎えるには、氷の祠が課す試練を越えねばならないという。' },
      { speaker: '主人公', portrait: '🧑', text: '仲間、か。この旅を、一人だけで続けるのはもう限界だと思っていた。' },
      { speaker: 'ナレーター', portrait: '📖', text: '祠の奥から、凍てついた気配が押し寄せてくる。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '試練を越えた証に、祠は静かに光を放ち、新たな絆が芽生えた。' },
      { speaker: '主人公', portrait: '🧑', text: 'これから、よろしく頼む。一緒に、この呪いの謎を解き明かそう。' },
    ] },
  { id: 9, name: '業火の番人', portrait: '🔥', hp: 38, bossCard: 'dark_shadowbat', spellChance: 0.06, bgTheme: 'inferno2',
    weights: { normal: 5, rare: 22, epic: 40, legend: 33 }, rewardGold: 280, rewardGems: 25, trophyDelta: 58,
    storyIntro: [
      { speaker: '業火の番人', portrait: '🔥', text: '女帝様の宝を狙う者に、我が炎は容赦せぬ。' },
      { speaker: '主人公', portrait: '🧑', text: '女帝……？ この国には、まだ統治者が残っているのか。' },
      { speaker: '業火の番人', portrait: '🔥', text: 'その通り。だが、お前のような小僧に会わせるわけにはいかん。' },
    ],
    storyVictory: [
      { speaker: '業火の番人', portrait: '🔥', text: '……我が炎が届かぬとはな。女帝様に伝えよ、危険な者が来ると。' },
      { speaker: '主人公', portrait: '🧑', text: '危険なつもりはない。ただ、この国を救う手立てを探しているだけだ。' },
    ] },
  { id: 10, name: '月影の女帝', portrait: '👸', hp: 43, bossCard: 'water_icewolf', spellChance: 0.07, bgTheme: 'empress',
    weights: { normal: 2, rare: 16, epic: 38, legend: 44 }, rewardGold: 310, rewardGems: 29, trophyDelta: 70,
    storyIntro: [
      { speaker: '月影の女帝', portrait: '👸', text: 'よくぞここまで。復興を志す者よ、我が力、見せてやろう。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたが、この国の女帝……。なぜ国はここまで荒れ果ててしまったのですか？' },
      { speaker: '月影の女帝', portrait: '👸', text: '……その答えは、お前が力を示した後で語ろう。まずは剣を交えよ。' },
    ],
    storyVictory: [
      { speaker: '月影の女帝', portrait: '👸', text: '……見事。そなたになら話そう。この呪いの根は「四天王」、そしてその先の魔王城にある。' },
      { speaker: '月影の女帝', portrait: '👸', text: 'かつてこの国は、四天王の軍勢に呪いを撒き散らされ、滅びかけた。私が守れたのは、この程度の廃墟だけだ。' },
      { speaker: '主人公', portrait: '🧑', text: '四天王……。分かりました、必ず彼らを止めてみせます。' },
    ] },
  { id: 11, name: '四天王・爪の将', portrait: '🦅', hp: 49, bossCard: 'water_serpent', spellChance: 0.08, bgTheme: 'cave',
    weights: { normal: 0, rare: 14, epic: 40, legend: 46 }, rewardGold: 350, rewardGems: 32, trophyDelta: 76,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '月影の国を越えた先、四天王が支配する領域へと足を踏み入れる。' },
      { speaker: '爪の将', portrait: '🦅', text: 'この先は魔王様の御領地。人の子が通れる道ではない。' },
      { speaker: '主人公', portrait: '🧑', text: '通してもらう。この呪いを終わらせるために、俺はここまで来たんだ。' },
      { speaker: '爪の将', portrait: '🦅', text: '……その目、嫌いではない。だが、覚悟のほどを見せてもらおう。' },
    ],
    storyVictory: [
      { speaker: '爪の将', portrait: '🦅', text: '……我が爪を退けるか。だが、我らは四人。まだ三人残っている。' },
      { speaker: '主人公', portrait: '🧑', text: '一人ずつでも構わない。必ず、全員を退けてみせる。' },
    ] },
  { id: 12, name: '四天王・鎧の将', portrait: '🐢', hp: 56, bossCard: 'nature_dryad', spellChance: 0.08, bgTheme: 'frost',
    weights: { normal: 0, rare: 10, epic: 40, legend: 50 }, rewardGold: 380, rewardGems: 36, trophyDelta: 82,
    storyIntro: [
      { speaker: '鎧の将', portrait: '🐢', text: 'ほう、爪の将を退けたか。だが我が鎧は、何者をも通さぬ。' },
      { speaker: '主人公', portrait: '🧑', text: 'その鎧、まるで岩そのものだ。だが、俺は退けない。' },
      { speaker: '鎧の将', portrait: '🐢', text: '若造が。防御こそ、この世で最も揺るがぬ真理よ。' },
    ],
    storyVictory: [
      { speaker: '鎧の将', portrait: '🐢', text: '……鎧が、砕けた。人の子よ、お前は本物だ。' },
      { speaker: '鎧の将', portrait: '🐢', text: 'だが油断するな。次に待つ毒の将は、我のような真っ向勝負を好まぬ。' },
    ] },
  { id: 13, name: '四天王・毒の将', portrait: '🐍', hp: 62, bossCard: 'water_serpent', spellChance: 0.09, bgTheme: 'emerald',
    weights: { normal: 0, rare: 8, epic: 38, legend: 54 }, rewardGold: 420, rewardGems: 40, trophyDelta: 88,
    storyIntro: [
      { speaker: '毒の将', portrait: '🐍', text: 'シュルル……その息、いつまで保つかしらねぇ。' },
      { speaker: '主人公', portrait: '🧑', text: '……この空気、まるで毒そのものだ。気を抜いたら終わる。' },
      { speaker: '毒の将', portrait: '🐍', text: '賢い判断ね。でも、もう遅いわよ。' },
    ],
    storyVictory: [
      { speaker: '毒の将', portrait: '🐍', text: '……毒が効かぬとは。面白い人の子だこと。' },
      { speaker: '毒の将', portrait: '🐍', text: 'ふふ、気に入ったわ。炎の将によろしく伝えて。彼はあなたを歓迎しないでしょうけど。' },
    ] },
  { id: 14, name: '四天王・炎の将', portrait: '🐉', hp: 70, bossCard: 'fire_phoenix', spellChance: 0.09, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 6, epic: 36, legend: 58 }, rewardGold: 460, rewardGems: 43, trophyDelta: 94,
    storyIntro: [
      { speaker: '炎の将', portrait: '🐉', text: '三人が敗れたと聞いた。ならば我が炎で、決着をつけよう。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたたち四天王は、なぜ魔王に仕えているんだ？' },
      { speaker: '炎の将', portrait: '🐉', text: '……問答は不要。力こそが、我らの言葉だ。' },
    ],
    storyVictory: [
      { speaker: '炎の将', portrait: '🐉', text: '……我が炎すら凌ぐか。もはや止める者はいない。魔王城へ行くがいい。' },
      { speaker: '炎の将', portrait: '🐉', text: 'だが、最後に待つ者は我らの誰よりも強い。心して行け、人の子よ。' },
    ] },
  { id: 15, name: '四天王を統べる者', portrait: '⚔️', hp: 77, bossCard: 'dark_chaosdemon', spellChance: 0.1, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 4, epic: 34, legend: 62 }, rewardGold: 500, rewardGems: 47, trophyDelta: 110,
    storyIntro: [
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '四天王すべてを退けるとは……。だが我こそが、その頂点だと知れ。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたが、四天王の長。ここまで多くの仲間に出会えたのは、あなたたちのおかげでもある。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '……皮肉なことを言う。だが、その言葉に免じて、全力で相手をしよう。' },
    ],
    storyVictory: [
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '……敗北を認めよう。魔王城への門は、もう開いている。行け。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: 'そして、伝えておく。魔王もまた、望んでこの座にいるわけではないということを。' },
      { speaker: '主人公', portrait: '🧑', text: '……どういう意味だ？ 教えてくれ。' },
      { speaker: '四天王を統べる者', portrait: '⚔️', text: '会えば分かる。行くがいい。' },
    ] },
  { id: 16, name: '魔王城・門番', portrait: '🗿', hp: 85, bossCard: 'fire_bahamut', spellChance: 0.11, bgTheme: 'castle',
    weights: { normal: 0, rare: 2, epic: 32, legend: 66 }, rewardGold: 530, rewardGems: 51, trophyDelta: 118,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '聳え立つ魔王城。その門を、巨大な石の番人が塞いでいた。' },
      { speaker: '主人公', portrait: '🧑', text: 'いよいよか……。この城の奥で、全ての真実が待っている。' },
      { speaker: '門番', portrait: '🗿', text: '許可なき者、通すべからず……。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '門は開いた。魔王城の内部へ、一歩ずつ近づいていく。' },
      { speaker: '主人公', portrait: '🧑', text: '……不思議と、恐怖より確信の方が強い。俺は、間違っていない。' },
    ] },
  { id: 17, name: '魔王城・呪術師', portrait: '💀', hp: 93, bossCard: 'dark_reaper', spellChance: 0.11, bgTheme: 'cave',
    weights: { normal: 0, rare: 2, epic: 30, legend: 68 }, rewardGold: 570, rewardGems: 55, trophyDelta: 126,
    storyIntro: [
      { speaker: '呪術師', portrait: '💀', text: 'クククッ……この城で正気を保てる者など、いはしないよ。' },
      { speaker: '主人公', portrait: '🧑', text: 'この城全体が、呪いそのものみたいだ。一体、何が起きているんだ。' },
      { speaker: '呪術師', portrait: '💀', text: 'さあ、お前もじきに分かる。その前に、私の呪詛を受けてみるがいい。' },
    ],
    storyVictory: [
      { speaker: '呪術師', portrait: '💀', text: '……私の呪詛が届かぬか。お前もまた、何かに選ばれし者か。' },
      { speaker: '呪術師', portrait: '💀', text: 'ならば教えてやろう。この城の呪いの濃さは、玉座に近づくほど増していく。心せよ。' },
    ] },
  { id: 18, name: '魔王城・処刑人', portrait: '🪓', hp: 101, bossCard: 'light_shirayuki', spellChance: 0.12, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 30, legend: 70 }, rewardGold: 620, rewardGems: 59, trophyDelta: 134,
    storyIntro: [
      { speaker: '処刑人', portrait: '🪓', text: '魔王様に近づく者は、皆ここで終わる。お前も例外ではない。' },
      { speaker: '主人公', portrait: '🧑', text: '何人が、ここで散っていったんだ……。' },
      { speaker: '処刑人', portrait: '🪓', text: '数えるだけ無駄だ。お前も、その一人に加わるだけのこと。' },
    ],
    storyVictory: [
      { speaker: '処刑人', portrait: '🪓', text: '……この斧が、届かぬだと……。魔王様、お気をつけを……。' },
      { speaker: '主人公', portrait: '🧑', text: '……その最後の言葉、まるで魔王を案じているみたいだった。' },
    ] },
  { id: 19, name: '魔王城・影の宰相', portrait: '🕶️', hp: 109, bossCard: 'dark_demonlord', spellChance: 0.12, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 28, legend: 72 }, rewardGold: 660, rewardGems: 63, trophyDelta: 142,
    storyIntro: [
      { speaker: '影の宰相', portrait: '🕶️', text: 'ここまで来たか。魔王様の前に立つ最後の壁は、私だ。' },
      { speaker: '主人公', portrait: '🧑', text: '宰相……。あなたなら、この呪いの本当の理由を知っているんじゃないか？' },
      { speaker: '影の宰相', portrait: '🕶️', text: '……知っている。だが、それを語る役目は私にはない。力で示すがいい。' },
    ],
    storyVictory: [
      { speaker: '影の宰相', portrait: '🕶️', text: '……見事。だが、玉座の間で待つものを見て、お前は後悔するだろう。' },
      { speaker: '主人公', portrait: '🧑', text: '後悔なんてしない。俺は、真実を知るためにここまで来たんだ。' },
      { speaker: '影の宰相', portrait: '🕶️', text: '……その覚悟、忘れるな。行け。' },
    ] },
  { id: 20, name: '魔王', portrait: '👹', hp: 118, bossCard: 'fire_bahamut', spellChance: 0.13, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 26, legend: 74 }, rewardGold: 700, rewardGems: 68, trophyDelta: 170,
    storyIntro: [
      { speaker: '魔王', portrait: '👹', text: 'よくぞ辿り着いた、人の子よ。この世界の呪いの元凶……この私を倒しに来たか。' },
      { speaker: '主人公', portrait: '🧑', text: 'ああ。この呪いを終わらせるために、多くの仲間と共にここまで来た。' },
      { speaker: '魔王', portrait: '👹', text: '……そうか。ならば来るがいい。だが、覚えておけ。世界はお前が思うほど、単純ではない。' },
    ],
    storyVictory: [
      { speaker: '魔王', portrait: '👹', text: '……ぐ、あ……。だが……私を倒しても、呪いは……消えない……本当の元凶は、まだ……。' },
      { speaker: '主人公', portrait: '🧑', text: '待ってくれ！ 本当の元凶とは、一体誰のことだ！？' },
      { speaker: '魔王', portrait: '👹', text: '……女神に、会いに行け……。全ては、そこから始まった……。' },
      { speaker: 'ナレーター', portrait: '📖', text: '魔王は光の粒となって消えていった。世界中の人々が歓喜する中、主人公の胸には拭えない違和感が残った。' },
    ] },
  { id: 21, name: '崩れゆく世界', portrait: '🌑', hp: 128, bossCard: 'water_seiren', spellChance: 0.14, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 24, legend: 76 }, rewardGold: 740, rewardGems: 72, trophyDelta: 180,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '魔王を倒したはずなのに、モンスターの呪いは消えるどころか、むしろ濃くなっていく。' },
      { speaker: '主人公', portrait: '🧑', text: 'どうして……。魔王を倒せば、全てが終わるはずだったのに。' },
      { speaker: 'ナレーター', portrait: '📖', text: '世界の歪みの中から、新たな影が姿を現した。空は黒く染まり始めている。' },
      { speaker: '主人公', portrait: '🧑', text: '魔王の最後の言葉……「女神に会いに行け」。あれは、一体どういう意味だったんだ。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '倒しても倒しても、次々と現れる呪い。何かが、根本から間違っている。' },
      { speaker: '主人公', portrait: '🧑', text: '……行こう。この世界の中心にある神殿へ。全ての答えが、そこにあるはずだ。' },
    ] },
  { id: 22, name: '黒百合の巫女', portrait: '🥀', hp: 137, bossCard: 'light_whitegriffon', spellChance: 0.14, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 22, legend: 78 }, rewardGold: 780, rewardGems: 76, trophyDelta: 190,
    storyIntro: [
      { speaker: '黒百合の巫女', portrait: '🥀', text: 'ふふ……気づいてしまったのね。この世界の呪いの、本当の意味に。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたは誰だ。この世界で何が起きているのか、知っているんだろう？' },
      { speaker: '黒百合の巫女', portrait: '🥀', text: '教えてあげる。全ての始まりは──女神様よ。' },
      { speaker: '主人公', portrait: '🧑', text: '女神……。世界を救う存在だと、伝えられてきた。それが、どうして呪いの元凶になるんだ？' },
    ],
    storyVictory: [
      { speaker: '黒百合の巫女', portrait: '🥀', text: '……もういい。あとは、あなた自身の目で確かめなさい。' },
      { speaker: '黒百合の巫女', portrait: '🥀', text: '神殿の奥、白と黒の百合が咲く場所に、全ての真実が眠っている。' },
      { speaker: '主人公', portrait: '🧑', text: '……分かった。行こう。' },
    ] },
  { id: 23, name: '記憶の断片', portrait: '🕸️', hp: 147, bossCard: 'nature_emeraldgaia', spellChance: 0.15, bgTheme: 'cave',
    weights: { normal: 0, rare: 0, epic: 20, legend: 80 }, rewardGold: 830, rewardGems: 81, trophyDelta: 200,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '砕け散った記憶の欠片が、モンスターの姿となって襲いかかる。' },
      { speaker: '主人公', portrait: '🧑', text: 'これは……誰の記憶なんだ？ まるで、誰かの悲しみそのものが形になったみたいだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: 'かつて白かった百合が、なぜ黒く染まったのか──その真実が、少しずつ見えてくる。' },
    ],
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '全ての記憶が繋がった。女神は、かつて世界を救おうとして──呪われたのだ。' },
      { speaker: '主人公', portrait: '🧑', text: '……世界を守るために、自分が犠牲になったっていうのか。そんなの、あんまりだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '彼は拳を強く握りしめ、神殿の最奥へと歩みを進めた。' },
    ] },
  { id: 24, name: '女神の影', portrait: '✨', hp: 157, bossCard: 'fire_bahamut', spellChance: 0.15, bgTheme: 'castle',
    weights: { normal: 0, rare: 0, epic: 18, legend: 82 }, rewardGold: 870, rewardGems: 85, trophyDelta: 210,
    storyIntro: [
      { speaker: '女神の影', portrait: '✨', text: 'ようこそ、我が最後の使者よ。あなたなら、私を止められるかしら。' },
      { speaker: '主人公', portrait: '🧑', text: '止める、じゃない。俺は、あなたを助けに来たんだ。' },
      { speaker: '女神の影', portrait: '✨', text: '……優しい嘘ね。かつて白百合だった私は、世界を守るため、自ら呪いを受け入れた。もう戻れない。' },
      { speaker: '主人公', portrait: '🧑', text: '戻れるかどうかは、まだ誰にも分からない。俺が、それを証明してみせる。' },
    ],
    storyVictory: [
      { speaker: '女神の影', portrait: '✨', text: '……ありがとう。これで、本当の私に会いに行ける。' },
      { speaker: '女神の影', portrait: '✨', text: '奥で待っているのは、もっと深く呪いに沈んだ、本当の女神の姿。覚悟して。' },
      { speaker: '主人公', portrait: '🧑', text: '……大丈夫。ここまで来た仲間たちと一緒なら、何も怖くない。' },
    ] },
  { id: 25, name: '黒百合の女神', portrait: '🖤', hp: 167, bossCard: 'fire_bahamut', spellChance: 0.16, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 15, legend: 85 }, rewardGold: 920, rewardGems: 90, trophyDelta: 300,
    storyIntro: [
      { speaker: '黒百合の女神', portrait: '🖤', text: '……よく来たわね、Lis Noirの継承者。私を倒せば、この呪いは終わる。それとも──赦せる？' },
      { speaker: 'ナレーター', portrait: '📖', text: '黒く染まった百合の女神。その瞳の奥には、まだ世界を想う優しさが残っていた。' },
      { speaker: '主人公', portrait: '🧑', text: '倒すつもりなんてない。俺はただ、あなたを穢れから解き放ちに来ただけだ。' },
      { speaker: '黒百合の女神', portrait: '🖤', text: '……愚かな人の子。私を救えば、その穢れごと、あなたも巻き込まれるかもしれないのに。' },
      { speaker: '主人公', portrait: '🧑', text: '構わない。一人だけが犠牲になる世界なんて、俺は絶対に認めない。' },
    ],
    storyVictory: [
      { speaker: '黒百合の女神', portrait: '🌸', text: '……ああ、光が見える。ありがとう。この世界に、もう一度「Lis Noir」を──白と黒の百合を、咲かせて。' },
      { speaker: 'ナレーター', portrait: '📖', text: '黒百合は一輪ずつ、白百合へと変わっていく。女神は初めて、心からの笑顔を見せた。' },
      { speaker: '女神', portrait: '🌸', text: 'もう、祈らなくていいの……？' },
      { speaker: '主人公', portrait: '🧑', text: 'ああ。これからは、一緒に生きよう。' },
      { speaker: 'ナレーター', portrait: '📖', text: '数年後。世界には再び、人と共存できる小さく穏やかなモンスターたちが現れるようになった。神殿の前には、黒百合と白百合が寄り添って咲いている。' },
    ] },
  { id: 26, name: '静寂を破る足音', portrait: '👣', hp: 178, bossCard: 'dark_demonlord', spellChance: 0.17, bgTheme: 'cave',
    weights: { normal: 0, rare: 0, epic: 14, legend: 86 }, rewardGold: 960, rewardGems: 95, trophyDelta: 325,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '数年の時が流れた。世界には平和が戻り、人とモンスターが共に生きる村々が各地に生まれていた。' },
      { speaker: 'ナレーター', portrait: '📖', text: 'だがある夜、古い神殿の地下から、封じられていたはずの「深淵」の扉がひとりでに開いた。' },
      { speaker: '主人公', portrait: '🧑', text: '……この気配、まさか。眠っていたはずの闇が、また動き出している。' },
      { speaker: '女神', portrait: '🌸', text: 'お願い。もう一度だけ、力を貸して。まだ何かが、この世界の底に残っている。' },
    ] },
  { id: 27, name: '地底湖の哨戒者', portrait: '🌊', hp: 188, bossCard: 'light_shirayuki', spellChance: 0.17, bgTheme: 'cave',
    weights: { normal: 0, rare: 0, epic: 13, legend: 87 }, rewardGold: 1010, rewardGems: 99, trophyDelta: 350  },
  { id: 28, name: '忘れられた祭壇', portrait: '🕯️', hp: 199, bossCard: 'dark_reaper', spellChance: 0.18, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 12, legend: 88 }, rewardGold: 1060, rewardGems: 104, trophyDelta: 375  },
  { id: 29, name: '狭間の番人', portrait: '🚪', hp: 211, bossCard: 'light_whitegriffon', spellChance: 0.18, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 11, legend: 89 }, rewardGold: 1100, rewardGems: 109, trophyDelta: 400  },
  { id: 30, name: '深淵より来たりし者', portrait: '🕳️', hp: 222, bossCard: 'nature_emeraldgaia', spellChance: 0.19, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 10, legend: 90 }, rewardGold: 1150, rewardGems: 114, trophyDelta: 425,
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '深淵の最奥で、封じられていた古き者を打ち破った。' },
      { speaker: '主人公', portrait: '🧑', text: 'これで終わり……いや、まだ何か違う気配がする。もっと大きな影が。' },
      { speaker: '女神', portrait: '🌸', text: '気をつけて。深淵の奥には、さらに古い時代の「亡国」が眠っているという伝説がある。' },
    ] },
  { id: 31, name: '灰と炎の遺跡', portrait: '🏚️', hp: 234, bossCard: 'water_seiren', spellChance: 0.2, bgTheme: 'volcano',
    weights: { normal: 0, rare: 0, epic: 9, legend: 91 }, rewardGold: 1200, rewardGems: 119, trophyDelta: 450,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '深淵を抜けた先には、かつて栄えたという亡国の遺跡が、灰と炎に包まれて広がっていた。' },
      { speaker: '主人公', portrait: '🧑', text: 'ここが……亡国。何百年も燃え続けているって、本当だったんだな。' },
      { speaker: 'ナレーター', portrait: '📖', text: '崩れた玉座の奥から、炎をまとう衛兵たちの気配が近づいてくる。' },
    ] },
  { id: 32, name: '亡国の衛兵', portrait: '💂', hp: 246, bossCard: 'fire_bahamut', spellChance: 0.2, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 8, legend: 92 }, rewardGold: 1250, rewardGems: 124, trophyDelta: 475  },
  { id: 33, name: '灼熱の玉座跡', portrait: '👑', hp: 258, bossCard: 'fire_bahamut', spellChance: 0.21, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 7, legend: 93 }, rewardGold: 1300, rewardGems: 129, trophyDelta: 500  },
  { id: 34, name: '業火の残滓', portrait: '🔥', hp: 271, bossCard: 'dark_demonlord', spellChance: 0.21, bgTheme: 'volcano',
    weights: { normal: 0, rare: 0, epic: 6, legend: 94 }, rewardGold: 1350, rewardGems: 134, trophyDelta: 525  },
  { id: 35, name: '亡国を統べる火竜', portrait: '🐲', hp: 283, bossCard: 'fire_bahamut', spellChance: 0.22, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 1400, rewardGems: 139, trophyDelta: 550,
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '亡国を統べていた火竜を退け、燃え続けていた炎がついに静まった。' },
      { speaker: '主人公', portrait: '🧑', text: 'ようやく……ここも、終わったか。' },
      { speaker: 'ナレーター', portrait: '📖', text: 'だが灰の下から、凍りついた大地へと続く道が姿を現した。' },
    ] },
  { id: 36, name: '凍てつく回廊', portrait: '❄️', hp: 296, bossCard: 'light_shirayuki', spellChance: 0.23, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 4, legend: 96 }, rewardGold: 1450, rewardGems: 144, trophyDelta: 575,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '灰の道の先は、一転して凍てつく墓所へと続いていた。吐く息すら、瞬く間に凍りつく。' },
      { speaker: '主人公', portrait: '🧑', text: '火の次は、氷か……。この世界には、本当にいろんな「終わり方」が眠っているんだな。' },
      { speaker: 'ナレーター', portrait: '📖', text: '氷結の回廊の奥から、静かな足音が響いてくる。' },
    ] },
  { id: 37, name: '氷結の見張り', portrait: '🧊', hp: 310, bossCard: 'water_seiren', spellChance: 0.23, bgTheme: 'snow',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1500, rewardGems: 149, trophyDelta: 600  },
  { id: 38, name: '蒼氷の祭司', portrait: '⛄', hp: 323, bossCard: 'dark_reaper', spellChance: 0.24, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1550, rewardGems: 154, trophyDelta: 625  },
  { id: 39, name: '永久凍土の主', portrait: '🥶', hp: 337, bossCard: 'nature_emeraldgaia', spellChance: 0.24, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1600, rewardGems: 159, trophyDelta: 650  },
  { id: 40, name: '氷海に眠りし女王', portrait: '🌌', hp: 350, bossCard: 'water_seiren', spellChance: 0.25, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1660, rewardGems: 165, trophyDelta: 675,
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '氷海に眠っていた女王を解き放ち、凍りついた大地に、久方ぶりの陽光が差し込んだ。' },
      { speaker: '氷の女王', portrait: '👑', text: '……ありがとう。長い眠りの果てに、また誰かの温もりを感じられるなんて。' },
      { speaker: 'ナレーター', portrait: '📖', text: '空を見上げると、はるか高くに、光を放つ塔がそびえていた。' },
    ] },
  { id: 41, name: '天へと続く階', portrait: '🪜', hp: 364, bossCard: 'light_whitegriffon', spellChance: 0.26, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1710, rewardGems: 170, trophyDelta: 700,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: '氷海の先、雲を突き抜けるように、白く輝く聖塔が浮かんでいた。' },
      { speaker: '主人公', portrait: '🧑', text: 'あの塔……まるで、天まで続いているみたいだ。' },
      { speaker: 'ナレーター', portrait: '📖', text: '塔へと続く階段の下で、門衛たちが静かに待ち構えていた。' },
    ] },
  { id: 42, name: '聖塔の門衛', portrait: '⛩️', hp: 379, bossCard: 'fire_bahamut', spellChance: 0.26, bgTheme: 'castle',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1760, rewardGems: 176, trophyDelta: 725  },
  { id: 43, name: '雲上の詠唱者', portrait: '☁️', hp: 393, bossCard: 'dark_demonlord', spellChance: 0.27, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1820, rewardGems: 181, trophyDelta: 750  },
  { id: 44, name: '天空を統べる者', portrait: '🌠', hp: 408, bossCard: 'light_shirayuki', spellChance: 0.27, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1870, rewardGems: 186, trophyDelta: 775  },
  { id: 45, name: '堕ちた聖騎士', portrait: '🗡️', hp: 423, bossCard: 'light_whitegriffon', spellChance: 0.28, bgTheme: 'castle',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1920, rewardGems: 192, trophyDelta: 800,
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '塔の頂で待っていたのは、かつて光を司っていたはずの、堕ちた聖騎士だった。' },
      { speaker: '主人公', portrait: '🧑', text: 'あなたも、何かを守ろうとして、道を間違えただけなんだな。' },
      { speaker: 'ナレーター', portrait: '📖', text: '聖騎士の鎧から、静かに光が漏れ出し、天空に小さな祈りが響いた。' },
    ] },
  { id: 46, name: '終焉の兆し', portrait: '⏳', hp: 438, bossCard: 'dark_reaper', spellChance: 0.29, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 1980, rewardGems: 197, trophyDelta: 825,
    storyIntro: [
      { speaker: 'ナレーター', portrait: '📖', text: 'すべての戦いの果てに、時間そのものが歪んだ空間へとたどり着いた。ここが、最後の場所らしい。' },
      { speaker: '女神', portrait: '🌸', text: 'ここから先は、私にも見えない。あなたが初めて、本当の意味で「未知」に足を踏み入れる。' },
      { speaker: '主人公', portrait: '🧑', text: '……構わない。ここまで来た以上、最後まで見届ける。' },
    ] },
  { id: 47, name: '回帰の狭間', portrait: '🌀', hp: 453, bossCard: 'nature_emeraldgaia', spellChance: 0.29, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 2030, rewardGems: 203, trophyDelta: 850  },
  { id: 48, name: '時を喰らう者', portrait: '🕰️', hp: 468, bossCard: 'water_seiren', spellChance: 0.3, bgTheme: 'empress',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 2090, rewardGems: 209, trophyDelta: 875  },
  { id: 49, name: '永劫の番人', portrait: '👁️', hp: 484, bossCard: 'dark_demonlord', spellChance: 0.3, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 2140, rewardGems: 214, trophyDelta: 900  },
  { id: 50, name: 'すべての始まりの座', portrait: '🖤', hp: 500, bossCard: 'dark_demonlord', spellChance: 0.3, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 3, legend: 97 }, rewardGold: 2200, rewardGems: 220, trophyDelta: 925,
    storyVictory: [
      { speaker: 'ナレーター', portrait: '📖', text: '永劫回帰の座で、すべての始まりであり終わりでもある者を打ち破った。世界に、静かな朝が訪れる。' },
      { speaker: '主人公', portrait: '🧑', text: '終わった……いや、これは新しい「始まり」なんだろうな。' },
      { speaker: '女神', portrait: '🌸', text: 'ありがとう、Lis Noirの継承者。あなたの物語は、これからも続いていく。' },
      { speaker: 'ナレーター', portrait: '📖', text: '白と黒の百合が咲き誇る丘の上で、長い旅はひとまずの終わりを迎えた。' },
    ] },
];

const WORLDS = [
  { id: 1, name: '見習いの森', stageIds: [1, 2, 3, 4, 5] },
  { id: 2, name: '月影の国', stageIds: [6, 7, 8, 9, 10] },
  { id: 3, name: '四天王の領域', stageIds: [11, 12, 13, 14, 15] },
  { id: 4, name: '魔王城', stageIds: [16, 17, 18, 19, 20] },
  { id: 5, name: '黒百合の真実', stageIds: [21, 22, 23, 24, 25] },
  { id: 6, name: '深淵の狭間', stageIds: [26, 27, 28, 29, 30] },
  { id: 7, name: '灼熱の亡国', stageIds: [31, 32, 33, 34, 35] },
  { id: 8, name: '蒼氷の墓所', stageIds: [36, 37, 38, 39, 40] },
  { id: 9, name: '天空の聖塔', stageIds: [41, 42, 43, 44, 45] },
  { id: 10, name: '永劫回帰の座', stageIds: [46, 47, 48, 49, 50] },
];

// ---------- 高難易度クエスト（属性ごとの試練。ストーリーとは別枠の腕試しコンテンツ） ----------
const HARD_QUESTS = [
  { qid: 'hard_fire', id: 'hard_fire', name: '灼熱の悪夢', portrait: '🔥', hp: 2400, bossCard: 'fire_bahamut', spellChance: 0.30, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 4000, rewardGems: 300, trophyDelta: 150,
    desc: '火属性の強敵が立ちはだかる、上級者向けの試練。' },
  { qid: 'hard_water', id: 'hard_water', name: '深海の悪夢', portrait: '🌊', hp: 2400, bossCard: 'water_seiren', spellChance: 0.30, bgTheme: 'frost',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 4000, rewardGems: 300, trophyDelta: 150,
    desc: '水属性の強敵が立ちはだかる、上級者向けの試練。' },
  { qid: 'hard_nature', id: 'hard_nature', name: '森羅の悪夢', portrait: '🌿', hp: 2400, bossCard: 'nature_emeraldgaia', spellChance: 0.30, bgTheme: 'emerald',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 4000, rewardGems: 300, trophyDelta: 150,
    desc: '自然属性の強敵が立ちはだかる、上級者向けの試練。' },
  { qid: 'hard_light', id: 'hard_light', name: '光輝の試練', portrait: '✨', hp: 2400, bossCard: 'light_whitegriffon', spellChance: 0.30, bgTheme: 'purification',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 4000, rewardGems: 300, trophyDelta: 150,
    desc: '光属性の強敵が立ちはだかる、上級者向けの試練。' },
  { qid: 'hard_dark', id: 'hard_dark', name: '漆黒の試練', portrait: '🌙', hp: 2400, bossCard: 'dark_reaper', spellChance: 0.30, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 0, epic: 5, legend: 95 }, rewardGold: 4000, rewardGems: 300, trophyDelta: 150,
    desc: '闇属性の強敵が立ちはだかる、上級者向けの試練。' },
  { qid: 'hard_final', id: 'hard_final', name: '五属性の覇者', portrait: '💠', hp: 3600, bossCard: 'dark_demonlord', spellChance: 0.32, bgTheme: 'castle',
    weights: { normal: 0, rare: 0, epic: 0, legend: 100 }, rewardGold: 6000, rewardGems: 500, trophyDelta: 250,
    desc: 'すべての属性を極めた、高難易度クエスト最強格の相手。' },
];

// ---------- 特別クエスト（期間限定ではない、いつでも遊べる特殊ルールの一戦） ----------
const SPECIAL_QUESTS = [
  { qid: 'special_vampirelord', id: 'special_vampirelord', name: '決戦：ヴァンパイアロード', portrait: '🧛', hp: 1800, bossCard: 'dark_demonlord', spellChance: 0.28, bgTheme: 'castle',
    weights: { normal: 0, rare: 10, epic: 30, legend: 60 }, rewardGold: 3000, rewardGems: 200, trophyDelta: 120,
    desc: '吸血で自己回復し続ける、ヴァンパイアロードとの一騎打ち。長期戦を覚悟せよ。' },
  { qid: 'special_nocturia', id: 'special_nocturia', name: '決戦：虚無の女王', portrait: '😈', hp: 1800, bossCard: 'dark_reaper', spellChance: 0.28, bgTheme: 'moonshadow',
    weights: { normal: 0, rare: 10, epic: 30, legend: 60 }, rewardGold: 3000, rewardGems: 200, trophyDelta: 120,
    desc: '行動不能とコスト消費で妨害してくる、虚無の女王との一戦。' },
  { qid: 'special_twindragons', id: 'special_twindragons', name: '双竜戦', portrait: '🐉', hp: 2000, bossCard: 'fire_bahamut', spellChance: 0.28, bgTheme: 'inferno2',
    weights: { normal: 0, rare: 5, epic: 25, legend: 70 }, rewardGold: 3200, rewardGems: 220, trophyDelta: 130,
    desc: '伝説の竜が束になって襲いかかる、高火力デッキとの戦い。' },
];

function isDungeonBossFloor(floor) {
  return floor % 10 === 0;
}

// フロアの敵HP。通常階も含めてじわじわ強くなり、ボス階はさらに大きく強化される
function getDungeonFloorHp(floor) {
  const base = 15 + Math.round(Math.pow(floor, 1.5) * 2.0);
  return isDungeonBossFloor(floor) ? Math.round(base * 1.3) : base;
}

// フロアが深くなるほど、敵デッキのレアリティ構成を徐々に強くする。
// 序盤（1〜10階）はレジェンドはおろかエピックも出さず、ノーマル・レアのみの易しい構成にする
function getDungeonFloorWeights(floor) {
  if (floor <= 10) {
    const rare = Math.min(60, floor * 6);
    return { normal: 100 - rare, rare, epic: 0, legend: 0 };
  }
  if (floor <= 30) {
    const t = (floor - 10) / 20;
    const epic = Math.round(10 + t * 30);
    const legend = Math.round(Math.max(0, floor - 20) * 2);
    const rare = Math.max(0, 100 - epic - legend);
    return { normal: 0, rare, epic, legend };
  }
  if (floor <= 60) {
    const t = (floor - 30) / 30;
    const legend = Math.round(20 + t * 50);
    const epic = Math.max(5, 100 - legend);
    return { normal: 0, rare: 0, epic, legend };
  }
  const t = (floor - 60) / 40;
  const legend = Math.round(Math.min(97, 70 + t * 27));
  const epic = Math.max(3, 100 - legend);
  return { normal: 0, rare: 0, epic, legend };
}

function getDungeonFloorBossCard(floor) {
  const idx = Math.floor((floor - 1) / 10) % DUNGEON_BOSS_CARDS.length;
  return DUNGEON_BOSS_CARDS[idx];
}

function getDungeonEquipmentReward(floor) {
  const idx = Math.floor(floor / 10) - 1;
  return DUNGEON_EQUIPMENT_REWARDS[idx] || null;
}

// STAGESと同じ形（startBattleがそのまま扱える形）で、指定フロアの疑似ステージオブジェクトを生成する
function getDungeonFloorStage(floor) {
  floor = Math.max(1, Math.min(DUNGEON_MAX_FLOOR, floor));
  const boss = isDungeonBossFloor(floor);
  const idx = Math.floor((floor - 1) / 10);
  return {
    id: 5000 + floor, // 既存のSTAGES(1〜50)と衝突しない専用の番号帯
    isDungeon: true,
    dungeonFloor: floor,
    name: boss ? `地下${floor}階・フロアボス` : `地下${floor}階`,
    portrait: boss ? '👑' : '🗝️',
    hp: getDungeonFloorHp(floor),
    bossCard: getDungeonFloorBossCard(floor),
    spellChance: Math.min(0.32, 0.02 + floor * 0.003),
    bgTheme: DUNGEON_BG_THEMES[idx % DUNGEON_BG_THEMES.length],
    weights: getDungeonFloorWeights(floor),
    rewardGold: 300 + floor * 45,
    rewardGems: 20 + floor * 4,
    trophyDelta: 0, // ダンジョンはトロフィーに影響しない（通常のランク戦とは別モード）
    dungeonEquipReward: boss ? getDungeonEquipmentReward(floor) : null,
  };
}

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
    node.addEventListener('click', async () => {
      const ev = EVENTS.find(e => e.id === node.dataset.event);
      if (!(await showStageConfirm(ev))) return;
      showStory(ev.storyIntro, () => startBattle(ev));
    });
  });
}

// ---------- ストーリー会話 ----------
let storyQueue = [];
let storyOnDone = null;

// ストーリーは「ステージ単位」ではなく「ワールド単位」（各ワールドの最初と最後のステージ）でのみ発生させる
function isWorldFirstStage(stage) {
  if (!stage || typeof stage.id !== 'number') return false;
  const world = WORLDS.find(w => w.stageIds.includes(stage.id));
  return !!world && world.stageIds[0] === stage.id;
}
function isWorldLastStage(stage) {
  if (!stage || typeof stage.id !== 'number') return false;
  const world = WORLDS.find(w => w.stageIds.includes(stage.id));
  return !!world && world.stageIds[world.stageIds.length - 1] === stage.id;
}

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
  const isProtagonist = line.speaker === '主人公';
  const portraitEl = document.getElementById('story-portrait');
  if (isProtagonist) {
    renderAvatarInto(portraitEl);
  } else {
    portraitEl.style.backgroundImage = '';
    portraitEl.textContent = line.portrait || '💬';
  }
  document.getElementById('story-speaker').textContent = isProtagonist ? (state.playerName || '主人公') : (line.speaker || '');
  document.getElementById('story-text').textContent = line.text || '';
}

// ステージ選択・ダンジョン選択画面のアイコンを、バトル画面と同じボスカードのイラストで表示する
// （bossCardの画像が無い場合は、従来通り絵文字にフォールバック）
function stagePortraitHtml(stage, unlocked) {
  if (!unlocked) return '🔒';
  const bossDef = stage.bossCard && CARD_DEFS[stage.bossCard];
  if (bossDef && bossDef.image) {
    return `<img src="${bossDef.image}" alt="" class="cg-stage-portrait-img" data-emoji="${stage.portrait}" onerror="handleStagePortraitImgError(this)"/>`;
  }
  return stage.portrait;
}

// ボスカードの画像が見つからない場合、絵文字のポートレートに差し替える
function handleStagePortraitImgError(imgEl) {
  const span = document.createElement('span');
  span.textContent = imgEl.dataset.emoji || '❓';
  imgEl.replaceWith(span);
}

let stageSelectMode = 'story';

function renderStageSelect() {
  if (stageSelectMode === 'story') { renderStoryStages(); return; }
  if (stageSelectMode === 'dungeon') { renderDungeonSelect('stage-list'); return; }
  if (stageSelectMode === 'hard') { renderQuestList(HARD_QUESTS, '高難易度クエスト', 26); return; }
  renderQuestList(SPECIAL_QUESTS, '特別クエスト', 26);
}

function renderStoryStages() {
  const wrap = document.getElementById('stage-list');
  wrap.innerHTML = WORLDS.map(world => {
    const worldStages = world.stageIds.map(id => STAGES.find(s => s.id === id));
    const worldUnlocked = worldStages[0].id <= state.stageProgress;
    const stagesHtml = worldStages.map(stage => {
      const unlocked = stage.id <= state.stageProgress;
      // ステージ7は要望により「クリア済み」表示（チェックマーク・タグ）の対象から除外する
      const cleared = stage.id < state.stageProgress && stage.id !== 7;
      return `
        <div class="cg-stage-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" data-stage="${stage.id}">
          <div class="cg-stage-portrait">${stagePortraitHtml(stage, unlocked)}${cleared ? '<span class="cg-stage-cleared-badge">✓</span>' : ''}</div>
          <div class="cg-stage-info">
            <div class="cg-stage-name">ステージ${stage.id}　${unlocked ? stage.name : '？？？'}${cleared ? ' <span class="cg-stage-cleared-tag">クリア済み</span>' : ''}</div>
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
    node.addEventListener('click', async () => {
      if (interactiveTutorialActive) { startBattle(TUTORIAL_STAGE); return; }
      const stage = STAGES.find(s => s.id === Number(node.dataset.stage));
      if (!(await showStageConfirm(stage))) return;
      const intro = isWorldFirstStage(stage) ? stage.storyIntro : null;
      showStory(intro, () => startBattle(stage));
    });
  });
}

// 高難易度・特別クエスト共通のリスト表示（ワールド分けはせず、フラットな一覧）
function renderQuestList(quests, sectionLabel, unlockStageProgress) {
  const wrap = document.getElementById('stage-list');
  const unlocked = state.stageProgress > unlockStageProgress;
  if (!unlocked) {
    wrap.innerHTML = `<div class="cg-world-section">
      <div class="cg-world-header locked">
        <span class="cg-world-name">🔒 ${sectionLabel}</span>
        <span class="cg-world-lock">ステージ${unlockStageProgress}をクリアすると解放</span>
      </div>
    </div>`;
    return;
  }
  const cardsHtml = quests.map(q => `
    <div class="cg-stage-card" data-quest="${q.id}">
      <div class="cg-stage-portrait">${stagePortraitHtml(q, true)}</div>
      <div class="cg-stage-info">
        <div class="cg-stage-name">${q.name}</div>
        <div class="cg-stage-desc">${q.desc}<br>敵HP ${q.hp}　報酬 💰${q.rewardGold} 💎${q.rewardGems}</div>
      </div>
      <div class="cg-stage-go">⚔️</div>
    </div>`).join('');
  wrap.innerHTML = `
    <div class="cg-world-section">
      <div class="cg-world-header">
        <span class="cg-world-name">⚔️ ${sectionLabel}</span>
      </div>
      <div class="cg-world-stages">${cardsHtml}</div>
    </div>`;
  wrap.querySelectorAll('.cg-stage-card').forEach(node => {
    node.addEventListener('click', async () => {
      const quest = quests.find(q => q.id === node.dataset.quest);
      if (!(await showStageConfirm(quest))) return;
      startBattle(quest);
    });
  });
}

function renderDungeonSelect(containerId) {
  containerId = containerId || 'dungeon-list';
  const currentFloorEl = document.getElementById('dungeon-current-floor');
  if (currentFloorEl) currentFloorEl.textContent = state.dungeonFloor;
  const wrap = document.getElementById(containerId);
  const groups = [];
  for (let g = 0; g < DUNGEON_MAX_FLOOR / 10; g++) groups.push({ start: g * 10 + 1, end: g * 10 + 10 });

  // #stage-list（ステージ選択画面のタブ経由）に表示する場合は、進捗バナーを自前で先頭に付ける
  const progressBanner = containerId === 'stage-list'
    ? `<div class="cg-dungeon-progress-banner" id="dungeon-progress-jump-btn" title="タップして現在の階からプレイ">
        <div class="cg-dungeon-progress-label">現在の到達階層</div>
        <div class="cg-dungeon-progress-value">地下 ${state.dungeonFloor} / ${DUNGEON_MAX_FLOOR} 階</div>
        <div class="cg-dungeon-progress-hint">タップしてこの階からプレイ</div>
      </div>`
    : '';

  wrap.innerHTML = progressBanner + groups.map(group => {
    const groupUnlocked = group.start <= state.dungeonFloor;
    const floorsHtml = [];
    for (let floor = group.start; floor <= group.end; floor++) {
      const stageInfo = getDungeonFloorStage(floor);
      const unlocked = floor <= state.dungeonFloor;
      const cleared = floor < state.dungeonFloor;
      const boss = isDungeonBossFloor(floor);
      floorsHtml.push(`
        <div class="cg-stage-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''} ${boss ? 'cg-dungeon-boss-card' : ''}" data-floor="${floor}">
          <div class="cg-stage-portrait">${stagePortraitHtml(stageInfo, unlocked)}${cleared ? '<span class="cg-stage-cleared-badge">✓</span>' : ''}</div>
          <div class="cg-stage-info">
            <div class="cg-stage-name">地下${floor}階${boss ? '（フロアボス）' : ''}${cleared ? ' <span class="cg-stage-cleared-tag">クリア済み</span>' : ''}</div>
            <div class="cg-stage-desc">${unlocked
              ? `敵HP ${stageInfo.hp}　報酬 💰${stageInfo.rewardGold} 💎${stageInfo.rewardGems}${stageInfo.dungeonEquipReward ? ' <span class="cg-dungeon-equip-tag">👑レジェンド装備</span>' : ''}`
              : '前の階層をクリアすると解放'}</div>
          </div>
          <div class="cg-stage-go">${unlocked ? (boss ? '👑' : '⚔️') : ''}</div>
        </div>`);
    }
    return `
      <div class="cg-world-section">
        <div class="cg-world-header ${groupUnlocked ? '' : 'locked'}">
          <span class="cg-world-name">🕳️ 地下${group.start}〜${group.end}階</span>
          ${!groupUnlocked ? '<span class="cg-world-lock">🔒 未解放</span>' : ''}
        </div>
        <div class="cg-world-stages">${floorsHtml.join('')}</div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('.cg-stage-card:not(.locked)').forEach(node => {
    node.addEventListener('click', async () => {
      const floor = Number(node.dataset.floor);
      const stage = getDungeonFloorStage(floor);
      if (!(await showStageConfirm(stage))) return;
      startBattle(stage);
    });
  });
  const jumpBtn = document.getElementById('dungeon-progress-jump-btn');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', async () => {
      const stage = getDungeonFloorStage(state.dungeonFloor);
      if (!(await showStageConfirm(stage))) return;
      startBattle(stage);
    });
  }
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
    bonusAtk += (leader.effect.atkFlat || 0);
    bonusHp += (leader.effect.hpFlat || 0);
  }
  // フィールドカードによる味方限定のHPブースト（設置後に生成されるユニットにのみ反映される簡略仕様）
  if (battle && battle.fieldCard && battle.fieldCardSide) {
    const fdef = CARD_DEFS[battle.fieldCard];
    const allyBoost = fdef && fdef.effect && fdef.effect.allyBoost;
    if (allyBoost && allyBoost.stat === 'hp' && def.element === allyBoost.element
        && isPlayerCard === (battle.fieldCardSide === 'player')) {
      bonusHp += allyBoost.value;
    }
  }
  return { id, defId: id, def, curHp: def.hp + bonusHp, atkBonus: bonusAtk, hpBonus: bonusHp, evolved, leaderBuff, canAttack: !!def.rush, justPlayed: true, stunned: false, revived: false, usedExtraAttack: false, ailment: null, shield: 0 };
}

function buildWeightedMonsterDeck(weights, count, spellChance, maxLegendCount) {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const dungeonExclusiveIds = new Set(DUNGEON_EQUIPMENT_REWARDS);
  const monsterIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') === 'monster' && !eventExclusiveIds.has(id) && !CARD_DEFS[id].isLeaderCard);
  const otherIds = Object.keys(CARD_DEFS).filter(id => (CARD_DEFS[id].type || 'monster') !== 'monster' && !eventExclusiveIds.has(id) && !dungeonExclusiveIds.has(id));
  const nonLegendMonsterIds = monsterIds.filter(id => CARD_DEFS[id].rarity !== 'legend');
  const chance = spellChance || 0;
  // レジェンド抜きの重み（上限に達した後の再抽選用）をあらかじめ用意しておく
  const noLegendWeights = Object.assign({}, weights, { legend: 0 });
  const deck = [];
  let legendCount = 0;
  for (let i = 0; i < count; i++) {
    if (otherIds.length && Math.random() < chance) {
      deck.push(otherIds[Math.floor(Math.random() * otherIds.length)]);
      continue;
    }
    let id = pickWeightedCardId(weights);
    let cardId = monsterIds.includes(id) ? id : monsterIds[Math.floor(Math.random() * monsterIds.length)];
    if (maxLegendCount !== undefined && CARD_DEFS[cardId] && CARD_DEFS[cardId].rarity === 'legend') {
      if (legendCount >= maxLegendCount) {
        // 上限に達している場合は、レジェンドを除いた重みで引き直す。
        // フォールバック先も必ずレジェンド以外のモンスターに限定し、上限を確実に守る
        const reRolled = pickWeightedCardId(noLegendWeights);
        const reRolledDef = CARD_DEFS[reRolled];
        cardId = (monsterIds.includes(reRolled) && reRolledDef.rarity !== 'legend')
          ? reRolled
          : (nonLegendMonsterIds.length ? nonLegendMonsterIds[Math.floor(Math.random() * nonLegendMonsterIds.length)] : cardId);
      } else {
        legendCount++;
      }
    }
    deck.push(cardId);
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
// バトル画面の背景グラデーションは、通常戦・ボス戦の2種類に統一する
// （通常戦：Lis Noirのテーマカラーである紫を基調にしたグラデーション。ボス戦：金＋紫の特別なグラデーション）
const BATTLE_BG_STANDARD = 'radial-gradient(ellipse 500px 400px at 50% 30%, #8A4FFF44 0%, transparent 70%), linear-gradient(160deg, #1c0f33 0%, #3a1f63 55%, #0d0619 100%)';
const BATTLE_BG_BOSS = 'radial-gradient(ellipse 600px 450px at 50% 25%, #D9B45B55 0%, transparent 65%), radial-gradient(ellipse 500px 400px at 50% 60%, #8A4FFF44 0%, transparent 70%), linear-gradient(160deg, #241344 0%, #3a1f63 45%, #1c0f33 100%)';

// 現在のステージ／ダンジョン階／クエストが「ボス戦」に該当するかどうかを判定する
// （各ワールドの最終ステージ、ダンジョンのフロアボス、高難易度・特別クエストはすべてボス戦扱い）
function isBossBattleStage(stage) {
  if (!stage) return false;
  if (stage.isDungeon) return isDungeonBossFloor(stage.dungeonFloor);
  if (stage.qid) return true;
  return isWorldLastStage(stage);
}

function applyBattleBgTheme(theme, isBoss) {
  const board = document.querySelector('.cg-battle-board');
  if (!board) return;
  board.style.backgroundImage = isBoss ? BATTLE_BG_BOSS : BATTLE_BG_STANDARD;
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

// ストーリーステージの敵デッキに含めるレジェンドカードの上限枚数を、ワールドの進行度に応じて決める
// （ダンジョン・高難易度クエスト・特別クエストにはワールドの概念が無いため対象外＝上限なし）
function getEnemyLegendCap(stage) {
  if (!stage || stage.qid) return undefined; // クエストは対象外（従来通り無制限）
  if (stage.isDungeon) {
    const floor = stage.dungeonFloor;
    if (floor <= 10) return 0;   // 序盤（1〜10階）：レジェンドなし
    if (floor <= 30) return 1;   // 11〜30階
    if (floor <= 60) return 2;   // 31〜60階
    if (floor <= 90) return 3;   // 61〜90階
    return 4;                    // 91〜100階（終盤）
  }
  if (typeof stage.id !== 'number') return undefined;
  const worldNum = Math.ceil(stage.id / 5);
  if (worldNum <= 3) return 1;  // 序盤（ワールド1〜3）
  if (worldNum <= 6) return 2;  // 中盤（ワールド4〜6）
  if (worldNum <= 9) return 3;  // 終盤（ワールド7〜9）
  return 4;                     // ラスト（ワールド10）
}

function startBattle(stage) {
  stage = stage || (battle && battle.stage) || STAGES[0];
  // 削除済みカード等、CARD_DEFSに存在しないIDが万一デッキに残っていた場合に備え、安全のため除外してから使用
  const validDeck = state.deck.filter(id => !!CARD_DEFS[id]);
  const playerDeck = shuffle(validDeck.length ? validDeck.slice() : Object.keys(state.cards).slice(0, 10));
  const enemyDeck = shuffle(buildWeightedMonsterDeck(stage.weights, 40, stage.spellChance || 0, getEnemyLegendCap(stage)));
  const playerMaxHp = getPlayerMaxHp();

  battle = {
    stage,
    turn: 1,
    activeSide: 'player',
    playerHp: playerMaxHp, playerMaxHp: playerMaxHp, enemyHp: stage.hp,
    playerMaxCost: 1, enemyMaxCost: 1,
    playerCost: 1, enemyCost: 1,
    playerDeck, enemyDeck,
    playerHand: playerDeck.splice(0, 2),
    enemyHand: enemyDeck.splice(0, 2),
    playerField: [null, null, null, null, null],
    enemyField: [null, null, null, null, null],
    fieldCard: null,
    fieldCardSide: null,
    selectedHandIdx: null,
    selectedFieldIdx: null,
    log: '',
    over: false,
    deckOutSide: null,
    playerGraveyard: [],
    enemyGraveyard: [],
    lastPlayedInfo: null,
    leaderUltimateCharge: 1,
    leaderUltimateReady: false,
  };
  const bossDef = stage.bossCard && CARD_DEFS[stage.bossCard];
  const enemyPortraitEl = document.getElementById('battle-enemy-portrait');
  const enemyEmojiEl = document.getElementById('battle-enemy-emoji');
  const showBossFallback = () => {
    enemyPortraitEl.style.backgroundImage = '';
    enemyPortraitEl.classList.remove('has-boss-image');
    enemyEmojiEl.textContent = stage.portrait;
  };
  if (bossDef && bossDef.image) {
    // 画像が実際に読み込めるか確認してから適用する（ファイルが見つからない場合は絵文字にフォールバック）
    const preload = new Image();
    preload.onload = () => {
      enemyPortraitEl.style.backgroundImage = `url('${bossDef.image}')`;
      enemyPortraitEl.classList.add('has-boss-image');
      enemyEmojiEl.textContent = '';
    };
    preload.onerror = showBossFallback;
    preload.src = bossDef.image;
  } else {
    showBossFallback();
  }
  applyBattleBgTheme(stage.bgTheme, isBossBattleStage(stage));
  applyLeaderPortraits();
  const playerPortraitEl = document.getElementById('battle-player-portrait');
  if (playerPortraitEl && !playerPortraitEl.dataset.longpressBound) {
    playerPortraitEl.dataset.longpressBound = '1';
    bindLongPress(playerPortraitEl, () => { if (state.leaderId) showLeaderDetailInfo(state.leaderId); });
  }
  renderBattle();
  updateBattleSpeedBtn();
  updateAutoBattleBtn();
  showScreen('battle');
  showVsIntro(stage);
}

// バトル倍速モード：ONの場合、演出・待ち時間を短縮する
function battleMs(baseMs) {
  return state.battleFastMode ? Math.round(baseMs / 2.5) : baseMs;
}

function updateBattleSpeedBtn() {
  const btn = document.getElementById('battle-speed-btn');
  if (!btn) return;
  btn.textContent = state.battleFastMode ? '2x' : '1x';
  btn.classList.toggle('fast', !!state.battleFastMode);
}

// ---------- オートバトル ----------
function updateAutoBattleBtn() {
  const btn = document.getElementById('battle-auto-btn');
  if (!btn) return;
  btn.classList.toggle('on', !!state.autoBattleMode);
}

function toggleAutoBattle() {
  state.autoBattleMode = !state.autoBattleMode;
  saveState();
  updateAutoBattleBtn();
  if (state.autoBattleMode && battle && !battle.over && battle.activeSide === 'player') {
    runAutoBattleTurn();
  }
}

// 自分のターンに、敵AIと同様のロジックでカードを出し続け、攻撃可能なモンスターで全て攻撃してからターンを終了する
function runAutoBattleTurn() {
  if (!battle || battle.over || !state.autoBattleMode) return;
  if (battle.activeSide !== 'player') return;

  // アルティメットスキルが準備できていれば、オート中も自動的に使用する
  if ((battle.leaderUltimateCharge || 0) >= ULTIMATE_COOLDOWN_TURNS) {
    executeLeaderUltimate();
    if (battle.over) return;
  }

  let progressed = true;
  let guard = 0;
  while (progressed && guard < 30) {
    progressed = false;
    guard++;
    for (let i = 0; i < battle.playerHand.length; i++) {
      const id = battle.playerHand[i];
      const def = CARD_DEFS[id];
      if (!def || def.cost > battle.playerCost) continue;
      const type = def.type || 'monster';

      if (type === 'monster') {
        const emptyIdx = battle.playerField.findIndex(s => s === null);
        if (emptyIdx === -1) continue;
        playCardFromHand(i, emptyIdx);
        progressed = true;
        break;
      }
      if (type === 'equipment' && def.target === 'friendly') {
        const targetIdx = battle.playerField.findIndex(u => u !== null);
        if (targetIdx === -1) continue;
        equipCardFromHand(i, targetIdx);
        progressed = true;
        break;
      }
      if (type === 'field') {
        playFieldCard(i);
        progressed = true;
        break;
      }
      if (type === 'spell') {
        const target = def.target || 'none';
        if (target === 'none' || target === 'enemy') {
          castSpell(i, null);
          progressed = true;
          break;
        }
        if (target === 'enemy_monster') {
          const targetIdx = battle.enemyField.findIndex(u => u !== null);
          if (targetIdx === -1) continue;
          castSpell(i, targetIdx);
          progressed = true;
          break;
        }
      }
    }
    if (battle.over) return;
  }

  battle.playerField.forEach((u, i) => {
    if (!u || !u.canAttack || battle.over) return;
    const valid = getValidTargets(u, battle.enemyField);
    if (valid.faceAllowed) {
      attackTarget(i, null);
    } else if (valid.indices.length) {
      attackTarget(i, valid.indices[0]);
    }
  });

  renderBattle();
  if (!battle.over && state.autoBattleMode) {
    setTimeout(() => { if (state.autoBattleMode && battle && !battle.over) endTurn(); }, battleMs(700));
  }
}

function showVsIntro(stage) {
  document.getElementById('vs-player-name').textContent = state.playerName || 'プレイヤー';
  const vsEnemyEl = document.getElementById('vs-enemy-portrait');
  const bossDef = stage.bossCard && CARD_DEFS[stage.bossCard];
  const showVsEnemyFallback = () => {
    vsEnemyEl.style.backgroundImage = '';
    vsEnemyEl.textContent = stage.portrait;
  };
  if (bossDef && bossDef.image) {
    // 画像が実際に読み込めるか確認してから適用する（ファイルが見つからない場合は絵文字にフォールバック）
    const preload = new Image();
    preload.onload = () => {
      vsEnemyEl.style.backgroundImage = `url('${bossDef.image}')`;
      vsEnemyEl.textContent = '';
    };
    preload.onerror = showVsEnemyFallback;
    preload.src = bossDef.image;
  } else {
    showVsEnemyFallback();
  }
  document.getElementById('vs-enemy-name').textContent = stage.name;
  const overlay = document.getElementById('battle-vs-intro');
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), battleMs(1400));
  setTimeout(() => {
    showTurnBanner('YOUR TURN');
    if (!state.hasSeenBattleHelp && !interactiveTutorialActive) {
      document.getElementById('battle-help-overlay').classList.remove('hidden');
    }
    if (state.autoBattleMode && battle && !battle.over) {
      runAutoBattleTurn();
    }
  }, battleMs(1450));
}

const MAX_HAND_SIZE = 5;
// 山札から1枚引いて手札に加える。手札が上限（5枚）に達している場合は、引いたカードをそのまま墓地へ送る
function drawCardToHand(deck, hand, graveyard) {
  if (!deck.length) return null;
  const id = deck.shift();
  if (hand.length >= MAX_HAND_SIZE) {
    if (graveyard) graveyard.push(id);
    skillFlash('手札がいっぱいのため、引いたカードが墓地へ送られた');
    return null;
  }
  hand.push(id);
  return id;
}

// 墓地（自分側）の中身を確認するポップアップを表示
function openGraveyard() {
  const grid = document.getElementById('graveyard-grid');
  const cards = (battle && battle.playerGraveyard) || [];
  if (!cards.length) {
    grid.innerHTML = '<div class="cg-graveyard-empty">墓地にはまだ何もありません</div>';
  } else {
    // 直近に送られたカードが先頭に来るよう逆順で表示。元の配列インデックスをスロットのdata属性に保持する
    const reversed = cards.map((id, i) => ({ id, originalIndex: i })).reverse();
    grid.innerHTML = reversed.map(entry =>
      `<div class="cg-graveyard-slot" data-gy-index="${entry.originalIndex}">${renderCardFace(entry.id, { small: true })}</div>`
    ).join('');
    grid.querySelectorAll('.cg-graveyard-slot').forEach(slot => {
      const cardNode = slot.querySelector('.cg-card');
      bindLongPress(slot, () => showHandCardInfo(cardNode.dataset.id));
      slot.addEventListener('click', () => {
        if (longPressFired) { longPressFired = false; return; }
        returnCardFromGraveyard(Number(slot.dataset.gyIndex));
      });
    });
  }
  document.getElementById('graveyard-overlay').classList.remove('hidden');
}

const GRAVEYARD_RECLAIM_COST = 1;

// 墓地のカードをマナを消費して手札に戻す（長押しでカード情報の確認、タップでこの動作）
async function returnCardFromGraveyard(gyIndex) {
  if (!battle || battle.over) return;
  const id = battle.playerGraveyard[gyIndex];
  const def = CARD_DEFS[id];
  if (!def) return;
  if (battle.playerHand.length >= MAX_HAND_SIZE) {
    skillFlash('手札がいっぱいで、墓地から戻せません');
    return;
  }
  if (battle.playerCost < GRAVEYARD_RECLAIM_COST) {
    skillFlash(`マナが足りず、墓地から戻せません（消費マナ${GRAVEYARD_RECLAIM_COST}）`);
    return;
  }
  if (!(await showGenericConfirm(`「${def.name}」をマナ${GRAVEYARD_RECLAIM_COST}消費して手札に戻します。よろしいですか？`, '⚰️ 墓地から回収'))) return;
  battle.playerCost -= GRAVEYARD_RECLAIM_COST;
  battle.playerGraveyard.splice(gyIndex, 1);
  battle.playerHand.push(id);
  sfxCardPlay();
  skillFlash(`「${def.name}」を手札に戻した`);
  renderBattle();
  openGraveyard(); // 一覧を最新状態で再描画
}

// 手札のカードを、確認の上で墓地に手動で送る（数合わせや後で「墓地から戻す」を使うための布石として）
async function discardHandCardToGraveyard(handIdx) {
  if (!battle || battle.over) return;
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def) return;
  if (!(await showGenericConfirm(`「${def.name}」を手札から墓地に送ります。よろしいですか？`, '⚰️ 墓地へ送る'))) return;
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  battle.playerGraveyard.push(id);
  document.getElementById('card-info-overlay').classList.add('hidden');
  skillFlash(`「${def.name}」を墓地に送った`);
  renderBattle();
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
  // ご要望により、画面中央には「ENEMY TURN」「YOUR TURN」（showTurnBanner）以外のメッセージを
  // 表示しないようにしたため、このポップアップ自体は無効化している（呼び出し箇所は多いため、
  // 個別に削除するのではなく、ここで一括して無効化する形にしている）
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
  setTimeout(() => burst.remove(), battleMs(550));

  const slash = document.createElement('div');
  slash.className = 'cg-impact-slash';
  slash.style.left = x + 'px';
  slash.style.top = y + 'px';
  board.appendChild(slash);
  setTimeout(() => slash.remove(), battleMs(420));

  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('div');
    spark.className = 'cg-impact-spark';
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.setProperty('--sa', (i * 60) + 'deg');
    board.appendChild(spark);
    setTimeout(() => spark.remove(), battleMs(500));
  }

  if (dmg !== undefined) {
    const dmgEl = document.createElement('div');
    dmgEl.className = 'cg-impact-dmg' + (mult > 0 ? ' adv' : mult < 0 ? ' dis' : '');
    dmgEl.textContent = '-' + dmg;
    dmgEl.style.left = x + 'px';
    dmgEl.style.top = y + 'px';
    board.appendChild(dmgEl);
    setTimeout(() => dmgEl.remove(), battleMs(950));
  }
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
  const eff = fdef.effect;
  let bonus = 0;
  // 旧形式（両陣営が対象の属性ATKブースト）。現在は使用しているカードは無いが、互換のため残す
  if (eff.boostElement && unit.def.element === eff.boostElement) bonus += (eff.atk || 0);
  const isAllySide = isUnitOnFieldCardOwnerSide(unit);
  if (eff.allyBoost && eff.allyBoost.stat === 'atk' && isAllySide && unit.def.element === eff.allyBoost.element) {
    bonus += eff.allyBoost.value;
  }
  if (eff.enemyDebuff && eff.enemyDebuff.stat === 'atk' && !isAllySide && unit.def.element === eff.enemyDebuff.element) {
    bonus += eff.enemyDebuff.value; // マイナス値
  }
  return bonus;
}

// 対象ユニットが、現在場に出ているフィールドカードを使用した側と同じ陣営かどうかを判定する
function isUnitOnFieldCardOwnerSide(unit) {
  if (!battle || !battle.fieldCardSide) return false;
  const onPlayerSide = battle.playerField.includes(unit);
  return battle.fieldCardSide === 'player' ? onPlayerSide : !onPlayerSide;
}

function previewDamage(attackerUnit, defenderUnit) {
  const mult = defenderUnit ? elementMultiplier(attackerUnit.def.element, defenderUnit.def.element) : 0;
  return { dmg: Math.max(1, attackerUnit.def.atk + (attackerUnit.atkBonus || 0) + fieldBonusFor(attackerUnit) + mult), mult };
}

function renderBattle() {
  if (!battle) return;
  document.getElementById('battle-turn-timer').textContent = 'ターン ' + battle.turn;
  const ultimateBadge = document.getElementById('battle-ultimate-charge');
  if (ultimateBadge) {
    const charge = Math.min(ULTIMATE_COOLDOWN_TURNS, battle.leaderUltimateCharge || 0);
    const ready = charge >= ULTIMATE_COOLDOWN_TURNS;
    ultimateBadge.textContent = ready ? '⚡準備完了' : `${charge}/${ULTIMATE_COOLDOWN_TURNS}`;
    ultimateBadge.classList.toggle('ready', ready);
  }
  document.getElementById('battle-player-hp').textContent = battle.playerHp;
  document.getElementById('battle-enemy-hp').textContent = battle.enemyHp;
  document.getElementById('battle-deck-remaining').textContent = battle.playerDeck.length;
  document.getElementById('battle-graveyard-count').textContent = battle.playerGraveyard.length;
  document.getElementById('battle-pp-current').textContent = battle.playerCost;
  document.getElementById('battle-pp-max').textContent = battle.playerMaxCost > 10 ? 10 : battle.playerMaxCost;
  document.getElementById('battle-enemy-pp-current').textContent = battle.enemyCost;
  document.getElementById('battle-enemy-pp-max').textContent = battle.enemyMaxCost > 10 ? 10 : battle.enemyMaxCost;
  document.getElementById('battle-enemy-deck-remaining').textContent = battle.enemyDeck.length;
  document.getElementById('battle-enemy-hand-count').textContent = battle.enemyHand.length;
  document.getElementById('battle-enemy-graveyard-count').textContent = battle.enemyGraveyard.length;

  const fieldIndicatorEl = document.getElementById('battle-field-indicator');
  if (battle.fieldCard) {
    const fdef = CARD_DEFS[battle.fieldCard];
    const fel = ELEMENTS[fdef.element];
    document.getElementById('battle-field-indicator-name').textContent = fdef.name;
    fieldIndicatorEl.style.display = '';
    fieldIndicatorEl.style.borderColor = fel.color;
    fieldIndicatorEl.onclick = () => showHandCardInfo(battle.fieldCard);
  } else {
    fieldIndicatorEl.style.display = 'none';
  }

  const enemyFieldEl = document.getElementById('battle-enemy-field');
  const previewingAttack = battle.selectedFieldIdx !== null ? battle.playerField[battle.selectedFieldIdx] : null;
  const selectedSpell = battle.selectedHandIdx !== null ? CARD_DEFS[battle.playerHand[battle.selectedHandIdx]] : null;
  const previewingSpell = selectedSpell && (selectedSpell.type || 'monster') === 'spell' && (selectedSpell.target === 'enemy' || selectedSpell.target === 'enemy_monster') ? selectedSpell : null;
  const attackValid = previewingAttack ? getValidTargets(previewingAttack, battle.enemyField) : null;

  // 選択中のカードのスキル効果を、手札の上の余白部分に表示する（未選択時は、直近に場に出した/使用したカードのスキルを表示）
  const skillInfoEl = document.getElementById('battle-selected-skill-info');
  const skillInfoDef = previewingAttack ? previewingAttack.def : (selectedSpell || battle.lastPlayedInfo);
  if (skillInfoDef) {
    document.getElementById('selected-skill-name').textContent = skillInfoDef.name;
    document.getElementById('selected-skill-meta').innerHTML = cardMetaHtml(skillInfoDef);
    document.getElementById('selected-skill-text').textContent = skillInfoDef.skill || '固有スキルなし';
    skillInfoEl.classList.remove('hidden');
  } else {
    skillInfoEl.classList.add('hidden');
  }

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
      ? `<div class="cg-field-slot filled ${blockedCls}" data-side="enemy" data-idx="${i}">${renderCardFace(u.defId, { small: true, battleMode: true, onField: true })}<div class="cg-atk-badge">${atkVal}</div><div class="cg-hp-badge">${u.curHp}</div>${u.stunned ? '<div class="cg-stun-icon">💫</div>' : ''}${u.ailment ? `<div class="cg-poison-icon" title="${u.ailment.kind === 'burn' ? '火傷' : '毒'}">${u.ailment.kind === 'burn' ? '🔥' : '☠️'}</div>` : ''}${u.shield > 0 ? `<div class="cg-shield-icon" title="シールド">🔷${u.shield}</div>` : ''}${preview}</div>`
      : `<div class="cg-field-slot" data-side="enemy" data-idx="${i}"></div>`;
  }).join('');

  const playerFieldEl = document.getElementById('battle-player-field');
  playerFieldEl.innerHTML = battle.playerField.map((u, i) => {
    if (!u) return `<div class="cg-field-slot" data-side="player" data-idx="${i}"></div>`;
    const atkVal = u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u);
    return `<div class="cg-field-slot filled ${battle.selectedFieldIdx === i ? 'selected' : ''}" data-side="player" data-idx="${i}">${renderCardFace(u.defId, { small: true, evolved: u.evolved, battleMode: true, onField: true })}<div class="cg-atk-badge">${atkVal}</div><div class="cg-hp-badge">${u.curHp}</div>${u.canAttack ? '<div class="cg-ready-dot"></div>' : ''}${u.stunned ? '<div class="cg-stun-icon">💫</div>' : ''}${u.ailment ? `<div class="cg-poison-icon" title="${u.ailment.kind === 'burn' ? '火傷' : '毒'}">${u.ailment.kind === 'burn' ? '🔥' : '☠️'}</div>` : ''}${u.shield > 0 ? `<div class="cg-shield-icon" title="シールド">🔷${u.shield}</div>` : ''}</div>`;
  }).join('');

  const handEl = document.getElementById('battle-hand');
  handEl.innerHTML = battle.playerHand.map((id, i) => {
    const def = CARD_DEFS[id];
    if (!def) return ''; // 削除済み等で存在しないカードIDが紛れていた場合、バトル画面全体がクラッシュしないよう安全にスキップ
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
  const quickAttackReady = battle.selectedFieldIdx === null && !previewingSpell &&
    battle.playerField.some(u => u && u.canAttack && getValidTargets(u, battle.enemyField).faceAllowed);
  const faceAttackReady = !!(previewingAttack && attackValid.faceAllowed) || !!previewingSpell || quickAttackReady;
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
  document.getElementById('battle-direct-attack-btn').classList.toggle('attackable', faceAttackReady);
  document.getElementById('battle-direct-attack-label').classList.toggle('show', faceAttackReady);
  const guardLabel = previewingAttack && !attackValid.faceAllowed && attackValid.indices.length > 0;
  document.getElementById('battle-direct-attack-label').textContent = guardLabel ? '🛡️ディフェンダーを先に攻撃' : 'タップで直接攻撃';

  bindBattleEvents();

  // オンライン対戦中は、自分のターンでない間は操作できないようにする
  const battleBoard = document.querySelector('.cg-battle-board');
  if (battleBoard) {
    const waitingForOpponent = !!(battle.isOnline && battle.activeSide !== 'player' && !battle.over);
    battleBoard.classList.toggle('cg-online-waiting-turn', waitingForOpponent);
  }
  const endTurnBtn = document.getElementById('battle-end-turn');
  if (endTurnBtn) {
    if (battle.isOnline) {
      endTurnBtn.disabled = battle.activeSide !== 'player' || battle.over;
      endTurnBtn.textContent = battle.activeSide === 'player' ? 'ターン終了' : '相手のターン…';
    } else {
      endTurnBtn.disabled = false;
      endTurnBtn.textContent = 'ターン終了';
    }
  }

  if (battle.isOnline) return; // 勝敗判定はcheckOnlineBattleEndで行うため、以下の通常フローは対象外
  if (battle.playerHp <= 0 || battle.enemyHp <= 0) {
    battle.over = true;
    if (battle.deckOutSide) {
      showDeckOutPopup(battle.deckOutSide);
    } else {
      setTimeout(() => showResult(battle.playerHp > 0), battleMs(600));
    }
  }
}

// 山札切れによる決着の場合、いきなり結果画面へ進まず、理由を説明するポップアップを挟む
function showDeckOutPopup(side) {
  const won = side === 'enemy'; // 相手の山札切れ＝自分の勝利
  document.getElementById('deckout-icon').textContent = won ? '🎉' : '💀';
  document.getElementById('deckout-title').textContent = won ? '勝利！' : '敗北…';
  document.getElementById('deckout-message').textContent = won
    ? '相手の山札が0になり、勝利しました！'
    : '自分の山札が0になり、敗北しました。';
  document.getElementById('deckout-overlay').classList.remove('hidden');
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
        // 誤操作防止のため即発動はせず、1回目のタップで選択（確認）、同じカードをもう一度タップで発動する
        if (battle.selectedHandIdx === idx) {
          castSpell(idx, null);
        } else {
          battle.selectedHandIdx = idx;
          renderBattle();
        }
        return;
      }
      if (type === 'field') {
        // フィールドカードも同様に、1回目のタップで選択、もう一度タップで発動する
        if (battle.selectedHandIdx === idx) {
          playFieldCard(idx);
        } else {
          battle.selectedHandIdx = idx;
          renderBattle();
        }
        return;
      }
      battle.selectedHandIdx = (battle.selectedHandIdx === idx) ? null : idx;
      renderBattle();
    };
    bindLongPress(node, () => {
      const idx = Number(node.dataset.idx);
      const id = battle.playerHand[idx];
      if (id) showHandCardInfo(id, idx);
    });
  });
  document.querySelectorAll('#battle-player-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
      if (longPressFired) { longPressFired = false; return; }
      const idx = Number(node.dataset.idx);
      if (battle.selectedHandIdx !== null) {
        const id = battle.playerHand[battle.selectedHandIdx];
        const def = CARD_DEFS[id];
        if (!def) { battle.selectedHandIdx = null; }
        else {
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
      }
      if (battle.playerField[idx] && battle.playerField[idx].canAttack) {
        battle.selectedFieldIdx = (battle.selectedFieldIdx === idx) ? null : idx;
      }
      renderBattle();
    };
    bindLongPress(node, () => {
      const idx = Number(node.dataset.idx);
      if (battle.playerField[idx]) showCardInfo(battle.playerField[idx], idx);
    });
  });
  document.querySelectorAll('#battle-enemy-field .cg-field-slot').forEach(node => {
    node.onclick = () => {
      if (longPressFired) { longPressFired = false; return; }
      const idx = Number(node.dataset.idx);
      if (battle.selectedHandIdx !== null) {
        const id = battle.playerHand[battle.selectedHandIdx];
        const def = CARD_DEFS[id];
        if (def && (def.type || 'monster') === 'spell' && (def.target === 'enemy' || def.target === 'enemy_monster') && battle.enemyField[idx]) {
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
      if (def && (def.type || 'monster') === 'spell' && def.target === 'enemy') {
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
      // モンスター未選択の状態で敵をタップした場合、攻撃可能な自分のモンスターを自動で選んで
      // そのまま直接攻撃する（毎回「モンスターをタップ→敵をタップ」としなくて済むようにするため）
      const readyIdx = battle.playerField.findIndex(u => u && u.canAttack && getValidTargets(u, battle.enemyField).faceAllowed);
      if (readyIdx !== -1) {
        attackTarget(readyIdx, null);
      } else {
        renderBattle();
      }
    }
  };
  document.getElementById('battle-enemy-portrait').onclick = handleDirectAttackTap;
  document.getElementById('battle-enemy-hp-chip').onclick = handleDirectAttackTap;
  document.getElementById('battle-direct-attack-btn').onclick = handleDirectAttackTap;
  document.getElementById('battle-player-portrait').onclick = () => {
    if (longPressFired) { longPressFired = false; return; }
    executeLeaderUltimate();
  };
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

function showCardInfo(unit, playerFieldIdx) {
  const def = unit.def;
  const rarity = RARITY[def.rarity];
  const el = ELEMENTS[def.element];
  const atk = def.atk + (unit.atkBonus || 0) + fieldBonusFor(unit);
  const roleText = def.role === 'defender' ? '🛡 ディフェンダー（相手のディフェンダーしか攻撃できない）' : '⚔ アタッカー（相手にディフェンダーがいれば、それを優先攻撃）';
  const discardBtn = (typeof playerFieldIdx === 'number')
    ? `<button class="cg-btn cg-detail-discard-btn" id="card-info-discard-btn" data-idx="${playerFieldIdx}">🪦 墓地に送る（場から除外）</button>`
    : '';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}" data-emoji="${def.emoji}" onerror="handleDetailImgError(this)"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span></div>
      <div class="cg-detail-desc">属性: <span style="color:${elementTextColor(def.element)}">${el.icon} ${el.name}</span></div>
      <div class="cg-detail-desc">${roleText}</div>
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        <div class="cg-detail-stat"><span>攻撃力</span><b>${atk}</b></div>
        <div class="cg-detail-stat"><span>現在HP</span><b>${unit.curHp}</b></div>
      </div>
      ${discardBtn}
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
  if (typeof playerFieldIdx === 'number') {
    document.getElementById('card-info-discard-btn').addEventListener('click', () => discardFieldUnit(playerFieldIdx));
  }
}

// 自分の場のモンスターを墓地に送る（除外する）
async function discardFieldUnit(idx) {
  const unit = battle && battle.playerField && battle.playerField[idx];
  if (!unit) return;
  if (!(await showGenericConfirm(`「${unit.def.name}」を墓地に送ります。場から除外されます。よろしいですか？`, '⚰️ 墓地へ送る'))) return;
  battle.playerField[idx] = null;
  battle.playerGraveyard.push(unit.defId);
  document.getElementById('card-info-overlay').classList.add('hidden');
  skillFlash(`${unit.def.name}を墓地に送った`);
  renderBattle();
}

// カードの種別・属性・役割（アタッカー/ディフェンダー）を、手札上のスキル表示欄向けに小さなタグとして生成する。
// 該当しない項目（スペル・装備・フィールドカードの役割など）は表示しない
// 属性を「文字色」として表示する際の色を返す。闇属性の色(#5A2D91)は背景色としては使えるが、
// 暗い背景の上に文字色として使うと読みにくいため、表示用には明るい紫に差し替える
function elementTextColor(elementKey) {
  if (elementKey === 'dark') return '#c9a8f0';
  const el = ELEMENTS[elementKey];
  return el ? el.color : '#fff';
}

function cardMetaHtml(def) {
  const type = def.type || 'monster';
  const typeLabel = type === 'monster' ? 'モンスター' : type === 'spell' ? 'スペル' : type === 'equipment' ? '装備' : 'フィールド';
  const parts = [`<span class="cg-skill-meta-tag">${typeLabel}</span>`];
  const el = ELEMENTS[def.element];
  if (el) parts.push(`<span class="cg-skill-meta-tag" style="color:${elementTextColor(def.element)}">${el.icon} ${el.name}</span>`);
  if (type === 'monster' && def.role) {
    const roleLabel = def.role === 'defender' ? '🛡 ディフェンダー' : '⚔ アタッカー';
    parts.push(`<span class="cg-skill-meta-tag">${roleLabel}</span>`);
  }
  return parts.join('');
}

function showHandCardInfo(id, handIdx) {
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
  const discardBtn = (typeof handIdx === 'number')
    ? `<button class="cg-btn cg-detail-discard-btn" id="card-info-hand-discard-btn" data-hand-idx="${handIdx}">🪦 墓地に送る（手札から除外）</button>`
    : '';
  document.getElementById('card-info-body').innerHTML = `
    <div class="cg-detail-art" style="${cardArtStyle(def)}">${def.image ? `<img src="${def.image}" data-emoji="${def.emoji}" onerror="handleDetailImgError(this)"/>` : `<span class="cg-detail-emoji">${def.emoji}</span>`}${(def.rarity === 'legend') ? `<div class="cg-card-foil ${def.rarity}"></div>` : ''}</div>
    <div class="cg-detail-info">
      <div class="cg-detail-name">${def.name}</div>
      <div class="cg-detail-level"><span class="cg-detail-rarity" style="color:${rarity.color}">${rarity.name}</span>${evolved ? ' <span class="cg-evolved-tag">★進化済</span>' : ''}</div>
      <div class="cg-detail-desc">属性: <span style="color:${elementTextColor(def.element)}">${el.icon} ${el.name}</span></div>
      ${roleText ? `<div class="cg-detail-desc">${roleText}</div>` : ''}
      <div class="cg-detail-desc">${def.skill || '固有スキルなし'}</div>
      <div class="cg-detail-stats">
        ${detailStatsBlock(def, evolved)}
      </div>
      ${discardBtn}
    </div>`;
  document.getElementById('card-info-overlay').classList.remove('hidden');
  if (typeof handIdx === 'number') {
    document.getElementById('card-info-hand-discard-btn').addEventListener('click', () => discardHandCardToGraveyard(handIdx));
  }
}

function playCardFromHand(handIdx, fieldIdx) {
  if (battle.isOnline && battle.activeSide !== 'player') return;
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost || battle.playerField[fieldIdx]) return;
  battle.playerCost -= def.cost;
  battle.playerField[fieldIdx] = newBattleUnit(id, true);
  applySkillTag(battle.playerField[fieldIdx], 'onPlay', true);
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  sfxCardPlay();
  if (def.skill) battle.lastPlayedInfo = def;
  // onPlayスキルにランダム要素を持つカードがあり、受信側で再現すると結果がずれる可能性があるため、
  // 結果が確定した状態をそのまま同期する
  submitOnlineAction('play_card', {
    cardId: id, fieldIdx,
    attackerSideField: serializeFieldForSync(battle.playerField),
    attackerSideHand: battle.playerHand.slice(),
    attackerSideCost: battle.playerCost,
    targetSideField: serializeFieldForSync(battle.enemyField),
    targetSideHp: battle.enemyHp,
  });
  renderBattle();
}

function castSpell(handIdx, targetIdx) {
  if (battle.isOnline && battle.activeSide !== 'player') return;
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost) return;
  battle.playerCost -= def.cost;
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  sfxCardPlay();

  const eff = def.effect || {};
  let dealtDmg = 0;
  let destroyRandomTargets = null;
  if (eff.kind === 'damage') {
    const leaderSp = getActiveLeader();
    const dmgFlatSp = leaderSp ? (leaderSp.effect.enemyDmgFlat || 0) : 0;
    dealtDmg = (eff.value || 0) + dmgFlatSp;
    const targetEl = targetIdx === null
      ? document.getElementById('battle-enemy-portrait')
      : document.querySelectorAll('#battle-enemy-field .cg-field-slot')[targetIdx];
    impactEffect(targetEl, dealtDmg, 0);
    if (targetIdx === null) {
      battle.enemyHp -= dealtDmg;
    } else {
      const target = battle.enemyField[targetIdx];
      if (target) {
        target.curHp -= mitigateIncomingDamage(target, dealtDmg);
        if (target.curHp <= 0) battle.enemyField[targetIdx] = null;
      }
    }
  } else if (eff.kind === 'heal') {
    battle.playerHp = Math.min(battle.playerMaxHp || 30, battle.playerHp + (eff.value || 0));
  } else if (eff.kind === 'draw') {
    for (let i = 0; i < (eff.value || 0); i++) {
      drawCardToHand(battle.playerDeck, battle.playerHand, battle.playerGraveyard);
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
  } else if (eff.kind === 'destroyRandom') {
    // シールドを持つモンスターは対象外。対象になり得るモンスターの中からランダムで最大N体を選び、HPに関わらず撃破する
    const eligibleIdx = battle.enemyField
      .map((u, i) => (u && !(u.shield > 0)) ? i : -1)
      .filter(i => i !== -1);
    for (let i = eligibleIdx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleIdx[i], eligibleIdx[j]] = [eligibleIdx[j], eligibleIdx[i]];
    }
    destroyRandomTargets = eligibleIdx.slice(0, eff.count || 3);
    destroyRandomTargets.forEach(i => {
      const u = battle.enemyField[i];
      const targetEl = document.querySelectorAll('#battle-enemy-field .cg-field-slot')[i];
      impactEffect(targetEl, u.curHp, 0);
      battle.enemyField[i] = null;
    });
  }
  if (def.skill) battle.lastPlayedInfo = def;
  battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
  submitOnlineAction('cast_spell', { cardId: id, targetIdx, dmg: dealtDmg, destroyRandomTargets });
  renderBattle();
}

function playFieldCard(handIdx) {
  if (battle.isOnline && battle.activeSide !== 'player') return;
  const id = battle.playerHand[handIdx];
  const def = CARD_DEFS[id];
  if (!def || def.cost > battle.playerCost) return;
  battle.playerCost -= def.cost;
  battle.playerHand.splice(handIdx, 1);
  battle.selectedHandIdx = null;
  battle.fieldCard = id;
  battle.fieldCardSide = 'player';
  sfxCardPlay();
  if (def.skill) battle.lastPlayedInfo = def;
  submitOnlineAction('play_field', { cardId: id });
  renderBattle();
}

function equipCardFromHand(handIdx, fieldIdx) {
  if (battle.isOnline && battle.activeSide !== 'player') return;
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
  if (def.skill) battle.lastPlayedInfo = def;
  submitOnlineAction('equip_card', { cardId: id, fieldIdx });
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

// AIの装備対象選択：最も攻撃力が高いユニットを優先的に強化する（従来は先頭のユニットを機械的に選んでいた）
function chooseAiBestUnitIdx(field) {
  let bestIdx = -1;
  let bestAtk = -Infinity;
  field.forEach((u, i) => {
    if (!u) return;
    const atk = u.def.atk + (u.atkBonus || 0);
    if (atk > bestAtk) { bestAtk = atk; bestIdx = i; }
  });
  return bestIdx;
}

// AIの攻撃対象選択：撃破できる相手がいれば、その中で最も脅威度（攻撃力）が高い相手を優先する。
// 撃破できる相手がいない場合は、単純に最も脅威度の高い相手を狙う（従来は先頭の対象を機械的に選んでいた）
function chooseAiAttackTargetIdx(validIndices, opponentField, dmg) {
  if (validIndices.length === 0) return null;
  let bestIdx = validIndices[0];
  let bestScore = -Infinity;
  validIndices.forEach(idx => {
    const t = opponentField[idx];
    if (!t) return;
    const threat = t.def.atk + (t.atkBonus || 0);
    const effectiveHp = t.curHp - (t.shield || 0); // シールド分は簡易的に考慮する
    const canKill = effectiveHp <= dmg;
    const score = (canKill ? 1000 : 0) + threat;
    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });
  return bestIdx;
}

// AIの単体対象スペル選択：撃破できる相手がいれば、その中で最も脅威度の高い相手を優先する
// （dmgがnullの場合＝HPに関わらず必ず撃破できる効果のため、脅威度だけで選ぶ）。従来は場の先頭のユニットを機械的に選んでいた
function chooseAiSpellTargetIdx(field, dmg) {
  let bestIdx = -1;
  let bestScore = -Infinity;
  field.forEach((t, idx) => {
    if (!t) return;
    const threat = t.def.atk + (t.atkBonus || 0);
    let score = threat;
    if (dmg != null) {
      const effectiveHp = t.curHp - (t.shield || 0); // シールド分は簡易的に考慮する
      const canKill = effectiveHp <= dmg;
      score += canKill ? 1000 : 0;
    }
    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });
  return bestIdx;
}

// カードのレア度を数値化（AIがモンスターを出す優先順位を決める際に使用）
const AI_RARITY_RANK = { normal: 0, rare: 1, epic: 2, legend: 3 };

// AIのモンスター配置選択：出せる中で最もレア度・ステータス（攻撃力+HP）の高いカードを優先する
// （従来は手札の並び順＝ドロー順で機械的に選んでいた）
function chooseAiBestMonsterHandIdx(hand, availableCost) {
  let bestIdx = -1;
  let bestScore = -Infinity;
  hand.forEach((id, i) => {
    const def = CARD_DEFS[id];
    if (!def || (def.type || 'monster') !== 'monster') return;
    if (def.cost > availableCost) return;
    const score = (AI_RARITY_RANK[def.rarity] || 0) * 100 + (def.atk || 0) + (def.hp || 0);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });
  return bestIdx;
}


// ---------- モンスター固有スキルの発動処理 ----------
// プレイヤーのリーダーが「敵の回復無効化」を持っているかどうか
function isEnemyHealNullified() {
  const leader = getActiveLeader();
  return !!(leader && leader.effect && leader.effect.nullifyEnemyHeal);
}

function applySkillTag(unit, trigger, isPlayerSide) {
  if (!unit || !unit.def || !unit.def.skillTag) return;
  const tag = unit.def.skillTag;
  if (tag.trigger !== trigger) return;
  const field = isPlayerSide ? battle.playerField : battle.enemyField;
  const hand = isPlayerSide ? battle.playerHand : battle.enemyHand;
  const deck = isPlayerSide ? battle.playerDeck : battle.enemyDeck;
  const healBlocked = !isPlayerSide && isEnemyHealNullified();
  if (tag.effect === 'healSelf') {
    if (healBlocked) return;
    const maxHp = unit.def.hp + (unit.hpBonus || 0);
    unit.curHp = Math.min(maxHp, unit.curHp + tag.value);
  } else if (tag.effect === 'healAllAllies') {
    if (healBlocked) return;
    field.forEach(u => { if (u) { const maxHp = u.def.hp + (u.hpBonus || 0); u.curHp = Math.min(maxHp, u.curHp + tag.value); } });
  } else if (tag.effect === 'drawCard') {
    const graveyard = isPlayerSide ? battle.playerGraveyard : battle.enemyGraveyard;
    for (let i = 0; i < tag.value; i++) { drawCardToHand(deck, hand, graveyard); }
  } else if (tag.effect === 'refundCost') {
    if (isPlayerSide) battle.playerCost = Math.min(battle.playerMaxCost, battle.playerCost + tag.value);
    else battle.enemyCost = Math.min(battle.enemyMaxCost, battle.enemyCost + tag.value);
  } else if (tag.effect === 'damageRandomEnemy') {
    // 【フレイムスライム等】場に出た時、相手の場のモンスターからランダムに1体へダメージ（いなければ相手本体へ）
    const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
    const aliveIdxs = opposingField.map((u, i) => (u ? i : null)).filter(i => i !== null);
    if (aliveIdxs.length) {
      const idx = aliveIdxs[Math.floor(Math.random() * aliveIdxs.length)];
      const target = opposingField[idx];
      const dmg = mitigateIncomingDamage(target, tag.value);
      target.curHp -= dmg;
      const selector = isPlayerSide ? '#battle-enemy-field .cg-field-slot' : '#battle-player-field .cg-field-slot';
      const targetEl = document.querySelectorAll(selector)[idx];
      if (targetEl) impactEffect(targetEl, dmg, 0);
    } else if (isPlayerSide) {
      battle.enemyHp -= tag.value;
      impactEffect(document.getElementById('battle-enemy-portrait'), tag.value, 0);
    } else {
      battle.playerHp -= tag.value;
      impactEffect(document.getElementById('battle-player-portrait'), tag.value, 0);
    }
    if (isPlayerSide) battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
    else battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
  } else if (tag.effect === 'healLowestAllyCleanse') {
    // 【ホーリーエンジェル】場に出た時、最もHPが減っている味方1体を回復し、状態異常を解除（他に味方がいなければ自分が対象）
    const allies = field.filter(u => u && u !== unit);
    let target = unit;
    if (allies.length) {
      target = allies.reduce((lowest, u) => {
        const maxHp = u.def.hp + (u.hpBonus || 0);
        const missing = maxHp - u.curHp;
        const lowestMaxHp = lowest.def.hp + (lowest.hpBonus || 0);
        const lowestMissing = lowestMaxHp - lowest.curHp;
        return missing > lowestMissing ? u : lowest;
      }, allies[0]);
    }
    if (!healBlocked) {
      const maxHp = target.def.hp + (target.hpBonus || 0);
      target.curHp = Math.min(maxHp, target.curHp + tag.value);
    }
    target.stunned = false;
    target.ailment = null;
  } else if (tag.effect === 'shieldAllAllies') {
    // 【セラフィムナイト等】場に出た時、味方全体にシールドを付与（ダメージを肩代わりする）
    field.forEach(u => { if (u) u.shield = (u.shield || 0) + tag.value; });
  } else if (tag.effect === 'healAndShieldAllies') {
    // 【世界樹の守護者】場に出た時、味方全体を回復＋シールドを付与
    field.forEach(u => {
      if (!u) return;
      if (!healBlocked) {
        const maxHp = u.def.hp + (u.hpBonus || 0);
        u.curHp = Math.min(maxHp, u.curHp + tag.value);
      }
      u.shield = (u.shield || 0) + (tag.shieldValue || 0);
    });
  } else if (tag.effect === 'aoeDamagePoisonShieldAllies') {
    // 【森羅の樹神ドリアード】場に出た時、敵全体にダメージ＋毒を付与し、味方全体にシールドを付与
    const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
    const selector = isPlayerSide ? '#battle-enemy-field .cg-field-slot' : '#battle-player-field .cg-field-slot';
    opposingField.forEach((u, i) => {
      if (!u) return;
      const dmg = mitigateIncomingDamage(u, tag.value);
      u.curHp -= dmg;
      const targetEl = document.querySelectorAll(selector)[i];
      if (targetEl) impactEffect(targetEl, dmg, 0);
      if (u.curHp > 0) u.ailment = { turns: tag.poisonTurns || 2, dmg: tag.poisonDmg || 1, kind: 'poison' };
    });
    if (isPlayerSide) battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
    else battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
    field.forEach(u => { if (u) u.shield = (u.shield || 0) + (tag.shieldValue || 0); });
  } else if (tag.effect === 'aoeDamageBurnAtkDownAll') {
    // 【煉獄の焔竜バハムート】場に出た時、敵全体にダメージ＋火傷＋攻撃力ダウン（永続）
    const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
    const selector = isPlayerSide ? '#battle-enemy-field .cg-field-slot' : '#battle-player-field .cg-field-slot';
    opposingField.forEach((u, i) => {
      if (!u) return;
      const dmg = mitigateIncomingDamage(u, tag.value);
      u.curHp -= dmg;
      const targetEl = document.querySelectorAll(selector)[i];
      if (targetEl) impactEffect(targetEl, dmg, 0);
      if (u.curHp > 0) {
        u.ailment = { turns: tag.burnTurns || 3, dmg: tag.burnDmg || 1, kind: 'burn' };
        u.atkBonus = (u.atkBonus || 0) - (tag.atkDownValue || 1);
      }
    });
    if (isPlayerSide) battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
    else battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
  } else if (tag.effect === 'healShieldAlliesAtkDownEnemies') {
    // 【水奏の女王セイレーン】場に出た時、味方全体を回復＋シールド付与、敵全体の攻撃力ダウン（永続）
    field.forEach(u => {
      if (!u) return;
      if (!healBlocked) {
        const maxHp = u.def.hp + (u.hpBonus || 0);
        u.curHp = Math.min(maxHp, u.curHp + (tag.healValue || 0));
      }
      u.shield = (u.shield || 0) + (tag.shieldValue || 0);
    });
    const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
    opposingField.forEach(u => { if (u) u.atkBonus = (u.atkBonus || 0) - (tag.atkDownValue || 1); });
  } else if (tag.effect === 'drawAndRefundCost') {
    // 【聖導の賢者ルシウス】場に出た時、カードを引き、自分のコストを回復する
    for (let i = 0; i < (tag.value || 0); i++) { drawCardToHand(deck, hand, isPlayerSide ? battle.playerGraveyard : battle.enemyGraveyard); }
    if (isPlayerSide) battle.playerCost = Math.min(battle.playerMaxCost, battle.playerCost + (tag.refundValue || 0));
    else battle.enemyCost = Math.min(battle.enemyMaxCost, battle.enemyCost + (tag.refundValue || 0));
  } else if (tag.effect === 'cleanseAndHealAllies') {
    // 【スターライトユニコーン】場に出た時、味方全体の状態異常を解除してHPを回復する
    field.forEach(u => {
      if (!u) return;
      u.stunned = false;
      u.ailment = null;
      if (!healBlocked) {
        const maxHp = u.def.hp + (u.hpBonus || 0);
        u.curHp = Math.min(maxHp, u.curHp + (tag.value || 0));
      }
    });
  } else if (tag.effect === 'boostSameElementAllies') {
    // 【リーダーカード共通】場に出た時、同じ属性の味方モンスター全体の攻撃力（・HP）を上げる。
    // カードによっては、敵全体へのダメージや攻撃力ダウンもあわせて発動する
    field.forEach(u => {
      if (!u || u === unit) return;
      if (u.def.element !== unit.def.element) return;
      u.atkBonus = (u.atkBonus || 0) + (tag.value || 0);
      if (tag.hpValue) {
        u.hpBonus = (u.hpBonus || 0) + tag.hpValue;
        u.curHp += tag.hpValue;
      }
    });
    if (tag.aoeDamage) {
      const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
      const selector = isPlayerSide ? '#battle-enemy-field .cg-field-slot' : '#battle-player-field .cg-field-slot';
      opposingField.forEach((u, i) => {
        if (!u) return;
        const dmg = mitigateIncomingDamage(u, tag.aoeDamage);
        u.curHp -= dmg;
        const targetEl = document.querySelectorAll(selector)[i];
        if (targetEl) impactEffect(targetEl, dmg, 0);
      });
      if (isPlayerSide) battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
      else battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
    }
    if (tag.atkDownEnemies) {
      const opposingField = isPlayerSide ? battle.enemyField : battle.playerField;
      opposingField.forEach(u => { if (u) u.atkBonus = (u.atkBonus || 0) - tag.atkDownEnemies; });
    }
  }
}

// 撃破されたユニットを取り除く際、復活スキル(reviveHalfHp)を持つ場合は1度だけ半分のHPで復活させる
// 被ダメージ軽減パッシブ(passiveDamageReduction)を考慮してダメージを補正
function mitigateIncomingDamage(target, dmg) {
  const tag = target && target.def && target.def.skillTag;
  if (tag && tag.trigger === 'passiveDamageReduction') {
    dmg = Math.max(1, Math.round(dmg * (1 - tag.value)));
  }
  if (battle && battle.fieldCard && target) {
    const fdef = CARD_DEFS[battle.fieldCard];
    const eff = fdef && fdef.effect;
    if (eff) {
      const isAllySide = isUnitOnFieldCardOwnerSide(target);
      if (eff.allyDamageReduction && isAllySide
          && (eff.allyDamageReduction.element === 'all' || target.def.element === eff.allyDamageReduction.element)) {
        dmg = Math.max(1, Math.round(dmg * (1 - eff.allyDamageReduction.percent)));
      }
      if (eff.enemyDamageBoost && !isAllySide) {
        dmg = Math.max(1, Math.round(dmg * (1 + eff.enemyDamageBoost)));
      }
    }
  }
  if (target && target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
  }
  return dmg;
}

// 【エルフアーチャー(毒)・イフリート(火傷)等】状態異常のユニットに、ターン開始時ダメージを与える（残りターン数を1減らし、0で解除）
function tickAilment(field) {
  field.forEach(u => {
    if (u && u.ailment && u.ailment.turns > 0) {
      const dmg = mitigateIncomingDamage(u, u.ailment.dmg);
      u.curHp -= dmg;
      u.ailment.turns -= 1;
      if (u.ailment.turns <= 0) u.ailment = null;
    }
  });
}

function cleanupField(field, graveyard) {
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
  if (battle.isOnline && battle.activeSide !== 'player') return;
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
  const dmgFlat = leader ? (leader.effect.enemyDmgFlat || 0) : 0;
  const extraDmg = (tag && tag.effect === 'extraDamage') ? tag.value : 0;
  const dmg = Math.max(1, Math.round(attacker.def.atk + (attacker.atkBonus || 0) + fieldBonusFor(attacker) + mult) + dmgFlat) + extraDmg;
  const targetEl = targetIdx === null
    ? document.getElementById('battle-enemy-portrait')
    : document.querySelectorAll('#battle-enemy-field .cg-field-slot')[targetIdx];
  impactEffect(targetEl, dmg, mult);
  if (tag && tag.effect === 'lifesteal') {
    // 【ヴァンパイアロード】攻撃時、与えたダメージ分だけ自分のHPを回復する
    const maxHp = attacker.def.hp + (attacker.hpBonus || 0);
    attacker.curHp = Math.min(maxHp, attacker.curHp + dmg);
  }

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
    if (tag && tag.effect === 'aoeDamage') {
      const aoeVal = (tag && tag.effect === 'aoeDamage') ? tag.value : 2;
      battle.enemyField.forEach(u => { if (u) u.curHp -= mitigateIncomingDamage(u, aoeVal); });
      skillFlash(`${attacker.def.name}のスキル！\n全ての敵に${aoeVal}ダメージ`);
    }
    if (tag && tag.effect === 'aoeDamageAndBurn') {
      // 【イフリート】攻撃時、敵全体にダメージ＋火傷（数ターンの間、毎ターン開始時にダメージ）を付与
      battle.enemyField.forEach(u => {
        if (!u) return;
        u.curHp -= mitigateIncomingDamage(u, tag.value);
        if (u.curHp > 0) u.ailment = { turns: tag.burnTurns || 2, dmg: tag.burnDmg || 1, kind: 'burn' };
      });
      skillFlash(`${attacker.def.name}のスキル！\n敵全体に${tag.value}ダメージ＋火傷`);
    }
    if (tag && tag.effect === 'aoeDamageStunHeal') {
      // 【海皇リヴァイアサン】攻撃時、敵全体にダメージ＋行動不能、味方全体を回復
      battle.enemyField.forEach(u => {
        if (!u) return;
        u.curHp -= mitigateIncomingDamage(u, tag.value);
        if (u.curHp > 0) u.stunned = true;
      });
      battle.playerField.forEach(p => {
        if (!p) return;
        const maxHp = p.def.hp + (p.hpBonus || 0);
        p.curHp = Math.min(maxHp, p.curHp + (tag.healValue || 0));
      });
      skillFlash(`${attacker.def.name}のスキル！\n敵全体にダメージ＋行動不能、味方全体を回復`);
    }
    if (tag && tag.effect === 'aoeDamageAtkDownAll') {
      // 【冥王カオスデーモン】攻撃時、敵全体にダメージ＋攻撃力ダウン
      battle.enemyField.forEach(u => {
        if (!u) return;
        u.curHp -= mitigateIncomingDamage(u, tag.value);
        if (u.curHp > 0) u.atkBonus = (u.atkBonus || 0) - (tag.atkDownValue || 1);
      });
      skillFlash(`${attacker.def.name}のスキル！\n敵全体にダメージ＋攻撃力ダウン`);
    }
    if (tag && tag.effect === 'aoeDamageAtkUpAllies') {
      // 【翠嵐龍エメラルドガイア】攻撃時、敵全体にダメージ＋味方全体の攻撃力アップ（永続）
      battle.enemyField.forEach(u => { if (u) u.curHp -= mitigateIncomingDamage(u, tag.value); });
      battle.playerField.forEach(p => { if (p) p.atkBonus = (p.atkBonus || 0) + (tag.atkUpValue || 1); });
      skillFlash(`${attacker.def.name}のスキル！\n敵全体にダメージ＋味方全体の攻撃力アップ`);
    }
    if (tag && tag.effect === 'aoeDamageStunDrainCost') {
      // 【虚無の女王ノクターリア】攻撃時、敵全体にダメージ＋行動不能、相手のコストを消費
      battle.enemyField.forEach(u => {
        if (!u) return;
        u.curHp -= mitigateIncomingDamage(u, tag.value);
        if (u.curHp > 0) u.stunned = true;
      });
      battle.enemyCost = Math.max(0, battle.enemyCost - (tag.drainValue || 1));
      skillFlash(`${attacker.def.name}のスキル！\n敵全体にダメージ＋行動不能、コストを消費`);
    }
    if (tag && tag.effect === 'aoeDamageShieldAllies') {
      // 【聖騎士アークガーディアン】攻撃時、敵全体にダメージ＋味方全体にシールド付与
      battle.enemyField.forEach(u => { if (u) u.curHp -= mitigateIncomingDamage(u, tag.value); });
      battle.playerField.forEach(p => { if (p) p.shield = (p.shield || 0) + (tag.shieldValue || 0); });
      skillFlash(`${attacker.def.name}のスキル！\n敵全体にダメージ＋味方全体にシールド付与`);
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
    if (!killed && tag && tag.effect === 'poisonChance' && Math.random() < (tag.chance || 0.5)) {
      target.ailment = { turns: tag.turns || 2, dmg: tag.value || 1, kind: 'poison' };
      skillFlash(`${attacker.def.name}のスキル！\n相手に毒を付与`);
    }
    if (!killed && tag && tag.effect === 'atkDown') {
      // 【シャドウバット】攻撃時、相手の攻撃力を下げる
      target.atkBonus = (target.atkBonus || 0) - tag.value;
      skillFlash(`${attacker.def.name}のスキル！\n相手の攻撃力を${tag.value}下げた`);
    }
  }
  if (killedSomething && tag && tag.effect === 'extraAttackOnKill' && !attacker.usedExtraAttack) {
    attacker.canAttack = true;
    attacker.usedExtraAttack = true; // 1回の攻撃につき追加攻撃は1回まで（無限連鎖を防止）
    skillFlash(`${attacker.def.name}のスキル！\n連続攻撃発動！`);
  } else {
    attacker.canAttack = false;
    attacker.usedExtraAttack = false; // ターン終了後、次に攻撃可能になった時点でまた使えるようにリセット
  }
  battle.selectedFieldIdx = null;
  battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);
  submitOnlineAction('attack', {
    attackerSideField: serializeFieldForSync(battle.playerField),
    attackerSideHp: battle.playerHp,
    targetSideField: serializeFieldForSync(battle.enemyField),
    targetSideHp: battle.enemyHp,
    targetSideCost: battle.enemyCost,
  });
  renderBattle();
}

function endTurn() {
  if (!battle || battle.over) return;
  if (battle.isOnline) {
    if (battle.activeSide !== 'player') return;
    battle.playerField.forEach(u => {
      if (!u) return;
      if (u.stunned) { u.stunned = false; u.canAttack = false; }
      else { u.canAttack = true; }
    });
    submitOnlineAction('end_turn', {});
    battle.activeSide = 'enemy'; // 相手のend_turnが届くまで待機
    showTurnBanner('相手のターン');
    renderBattle();
    return;
  }
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
  }, battleMs(700));
}

// 敵AIの「カードを引くかどうか」の判断：手札がすでに上限の場合、引いても墓地に送られるだけなので引かない
function shouldEnemyDraw() {
  return battle.enemyHand.length < MAX_HAND_SIZE;
}

function enemyTurn() {
  battle.activeSide = 'enemy';
  battle.enemyMaxCost = Math.min(10, battle.enemyMaxCost + 1);
  battle.enemyCost = battle.enemyMaxCost;
  if (battle.enemyDeck.length === 0) {
    battle.enemyHp = 0; // 山札切れで敗北
    battle.deckOutSide = 'enemy';
    renderBattle();
    return;
  }
  if (shouldEnemyDraw()) {
    drawCardToHand(battle.enemyDeck, battle.enemyHand, battle.enemyGraveyard);
  }
  battle.enemyField.forEach(u => applySkillTag(u, 'turnStart', false));
  tickAilment(battle.enemyField);
  battle.enemyField = cleanupField(battle.enemyField, battle.enemyGraveyard);

  // AI: モンスター配置 → 装備 → フィールド → スペルの優先順で、出せるカードを出し続ける
  // モンスターは手札の並び順（ドロー順）ではなく、出せる中で最もレア度・ステータスの高いカードを優先して出す
  let progressed = true;
  let guard = 0;
  while (progressed && guard < 30) {
    progressed = false;
    guard++;

    // ① モンスター：空きスロットがあれば、出せる中で最も価値の高いカードを優先して出す
    if (battle.enemyField.some(s => s === null)) {
      const bestIdx = chooseAiBestMonsterHandIdx(battle.enemyHand, battle.enemyCost);
      if (bestIdx !== -1) {
        const id = battle.enemyHand[bestIdx];
        const def = CARD_DEFS[id];
        const emptyIdx = battle.enemyField.findIndex(s => s === null);
        battle.enemyCost -= def.cost;
        battle.enemyField[emptyIdx] = newBattleUnit(id);
        applySkillTag(battle.enemyField[emptyIdx], 'onPlay', false);
        battle.enemyHand.splice(bestIdx, 1);
        progressed = true;
        continue;
      }
    }

    for (let i = 0; i < battle.enemyHand.length; i++) {
      const id = battle.enemyHand[i];
      const def = CARD_DEFS[id];
      const type = def.type || 'monster';
      if (type === 'monster') continue; // モンスターは上の①で処理済み
      if (def.cost > battle.enemyCost) continue;

      if (type === 'equipment' && def.target === 'friendly') {
        const targetIdx = chooseAiBestUnitIdx(battle.enemyField);
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
        battle.fieldCardSide = 'enemy';
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
            // 撃破できる相手がいればその中で、いなければ単純に最も脅威度の高い相手を狙う（従来は場の先頭を機械的に選択）
            const targetIdx = chooseAiSpellTargetIdx(battle.playerField, eff.value);
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
            // 必ず撃破できる効果のため、最も脅威度の高い相手を狙う（従来は場の先頭を機械的に選択）
            const targetIdx = chooseAiSpellTargetIdx(battle.playerField, null);
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
            if (!isEnemyHealNullified()) {
              battle.enemyHp = Math.min(battle.stage.hp, battle.enemyHp + (eff.value || 0));
            }
          } else if (eff.kind === 'draw') {
            for (let k = 0; k < (eff.value || 0); k++) {
              drawCardToHand(battle.enemyDeck, battle.enemyHand, battle.enemyGraveyard);
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
  battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);

  // 攻撃可能な既存ユニットで攻撃（アタッカー/ディフェンダーのルールに従う）
  battle.enemyField.forEach((u, i) => {
    if (!u || !u.canAttack) return;
    const tag = u.def.skillTag;
    const performOneAttack = () => {
      const valid = getValidTargets(u, battle.playerField);
      const extraDmg = (tag && tag.effect === 'extraDamage') ? tag.value : 0;
      const dmg = Math.max(1, u.def.atk + (u.atkBonus || 0) + fieldBonusFor(u)) + extraDmg;
      let killed = false;
      if (tag && tag.effect === 'novaAttack' && valid.indices.length > 0) {
        battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, dmg); });
        skillFlash(`${u.def.name}のスキル！\n攻撃力と同じダメージを敵全体に`);
        killed = battle.playerField.some(p => p && p.curHp <= 0);
      } else if (valid.indices.length > 0) {
        const targetIdx = chooseAiAttackTargetIdx(valid.indices, battle.playerField, dmg);
        const target = battle.playerField[targetIdx];
        const targetEl = document.querySelectorAll('#battle-player-field .cg-field-slot')[targetIdx];
        impactEffect(targetEl, dmg, 0);
        target.curHp -= mitigateIncomingDamage(target, dmg);
        if (tag && tag.effect === 'aoeDamage') {
          const aoeVal = (tag && tag.effect === 'aoeDamage') ? tag.value : 2;
          battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, aoeVal); });
          skillFlash(`${u.def.name}のスキル！\n全ての敵に${aoeVal}ダメージ`);
        }
        if (tag && tag.effect === 'aoeDamageAndBurn') {
          battle.playerField.forEach(p => {
            if (!p) return;
            p.curHp -= mitigateIncomingDamage(p, tag.value);
            if (p.curHp > 0) p.ailment = { turns: tag.burnTurns || 2, dmg: tag.burnDmg || 1, kind: 'burn' };
          });
          skillFlash(`${u.def.name}のスキル！\n敵全体に${tag.value}ダメージ＋火傷`);
        }
        if (tag && tag.effect === 'aoeDamageStunHeal') {
          battle.playerField.forEach(p => {
            if (!p) return;
            p.curHp -= mitigateIncomingDamage(p, tag.value);
            if (p.curHp > 0) p.stunned = true;
          });
          battle.enemyField.forEach(e => {
            if (!e) return;
            const maxHp = e.def.hp + (e.hpBonus || 0);
            e.curHp = Math.min(maxHp, e.curHp + (tag.healValue || 0));
          });
          skillFlash(`${u.def.name}のスキル！\n敵全体にダメージ＋行動不能、味方全体を回復`);
        }
        if (tag && tag.effect === 'aoeDamageAtkDownAll') {
          battle.playerField.forEach(p => {
            if (!p) return;
            p.curHp -= mitigateIncomingDamage(p, tag.value);
            if (p.curHp > 0) p.atkBonus = (p.atkBonus || 0) - (tag.atkDownValue || 1);
          });
          skillFlash(`${u.def.name}のスキル！\n敵全体にダメージ＋攻撃力ダウン`);
        }
        if (tag && tag.effect === 'aoeDamageAtkUpAllies') {
          battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, tag.value); });
          battle.enemyField.forEach(e => { if (e) e.atkBonus = (e.atkBonus || 0) + (tag.atkUpValue || 1); });
          skillFlash(`${u.def.name}のスキル！\n敵全体にダメージ＋敵の攻撃力アップ`);
        }
        if (tag && tag.effect === 'aoeDamageStunDrainCost') {
          battle.playerField.forEach(p => {
            if (!p) return;
            p.curHp -= mitigateIncomingDamage(p, tag.value);
            if (p.curHp > 0) p.stunned = true;
          });
          battle.playerCost = Math.max(0, battle.playerCost - (tag.drainValue || 1));
          skillFlash(`${u.def.name}のスキル！\n敵全体にダメージ＋行動不能、コストを消費`);
        }
        if (tag && tag.effect === 'aoeDamageShieldAllies') {
          battle.playerField.forEach(p => { if (p) p.curHp -= mitigateIncomingDamage(p, tag.value); });
          battle.enemyField.forEach(e => { if (e) e.shield = (e.shield || 0) + (tag.shieldValue || 0); });
          skillFlash(`${u.def.name}のスキル！\n敵全体にダメージ＋敵にシールド付与`);
        }
        killed = target.curHp <= 0;
        if (tag && tag.effect === 'stunTarget' && !killed) target.stunned = true;
        if (killed && tag && tag.effect === 'drainEnemyCost') {
          battle.playerCost = Math.max(0, battle.playerCost - tag.value);
        }
        if (!killed && tag && tag.effect === 'poisonChance' && Math.random() < (tag.chance || 0.5)) {
          target.ailment = { turns: tag.turns || 2, dmg: tag.value || 1, kind: 'poison' };
          skillFlash(`${u.def.name}のスキル！\n相手に毒を付与`);
        }
        if (!killed && tag && tag.effect === 'atkDown') {
          target.atkBonus = (target.atkBonus || 0) - tag.value;
          skillFlash(`${u.def.name}のスキル！\n相手の攻撃力を${tag.value}下げた`);
        }
      } else if (valid.faceAllowed) {
        const targetEl = document.getElementById('battle-player-portrait');
        impactEffect(targetEl, dmg, 0);
        battle.playerHp -= dmg;
      }
      if (tag && tag.effect === 'lifesteal' && (valid.indices.length > 0 || valid.faceAllowed)) {
        // 【ヴァンパイアロード】攻撃時、与えたダメージ分だけ自分のHPを回復する
        const maxHp = u.def.hp + (u.hpBonus || 0);
        u.curHp = Math.min(maxHp, u.curHp + dmg);
      }
      // ディフェンダーで有効な対象がいない場合は何もせず待機
      return killed;
    };
    const killedFirst = performOneAttack();
    battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
    // 【ヴォイドリーパー等】撃破した場合のみ、1回だけ追加攻撃（無限連鎖はしない）
    if (killedFirst && tag && tag.effect === 'extraAttackOnKill') {
      skillFlash(`${u.def.name}のスキル！\n連続攻撃発動！`);
      performOneAttack();
      battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
    }
  });
  battle.enemyField.forEach(u => {
    if (!u) return;
    if (u.stunned) { u.stunned = false; u.canAttack = false; }
    else { u.canAttack = true; }
  });
  battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);

  // 次は自分のターン
  battle.turn += 1;
  battle.leaderUltimateCharge = Math.min(ULTIMATE_COOLDOWN_TURNS, (battle.leaderUltimateCharge || 0) + 1);
  battle.activeSide = 'player';
  battle.playerMaxCost = Math.min(10, battle.playerMaxCost + 1);
  battle.playerCost = battle.playerMaxCost;
  if (battle.playerDeck.length === 0) {
    battle.playerHp = 0; // 山札切れで敗北
    battle.deckOutSide = 'player';
    finishPlayerTurnStart();
  } else if (state.autoBattleMode) {
    // オートバトル中は、自動的に「引く」を選んで進める
    drawCardToHand(battle.playerDeck, battle.playerHand, battle.playerGraveyard);
    finishPlayerTurnStart();
  } else {
    document.getElementById('draw-choice-deck-count').textContent = battle.playerDeck.length;
    document.getElementById('draw-choice-overlay').classList.remove('hidden');
  }
}

// カードを引くかどうかの選択が終わった後、ターン開始処理の残りを行う
function finishPlayerTurnStart() {
  battle.playerField.forEach(u => applySkillTag(u, 'turnStart', true));
  tickAilment(battle.playerField);
  battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
  renderBattle();
  if (state.autoBattleMode && battle && !battle.over) {
    setTimeout(() => runAutoBattleTurn(), battleMs(500));
  }
}

function resolveDrawChoice(shouldDraw) {
  document.getElementById('draw-choice-overlay').classList.add('hidden');
  if (shouldDraw && battle && !battle.over) {
    drawCardToHand(battle.playerDeck, battle.playerHand, battle.playerGraveyard);
  }
  finishPlayerTurnStart();
}

function showResult(won) {
  const stage = battle.stage || STAGES[0];
  gainDailyProgress();
  if (won) sfxWin(); else sfxLose();
  const el = document.getElementById('result-title');
  el.textContent = won ? 'WIN' : 'LOSE';
  el.className = won ? 'cg-result-title win' : 'cg-result-title lose';
  document.getElementById('result-stage-name').textContent = stage.isDungeon
    ? stage.name
    : (typeof stage.id === 'number' ? `ステージ${stage.id}　${stage.name}` : `🎉 ${stage.name}`);
  // ダンジョンはランク戦とは別モードのため、トロフィーには影響させない
  const delta = stage.isDungeon ? 0 : (won ? stage.trophyDelta : -20);
  state.trophy = Math.max(0, state.trophy + delta);
  document.getElementById('result-trophy-delta').textContent = (delta > 0 ? '+' : '') + delta;
  document.getElementById('result-trophy').textContent = state.trophy.toLocaleString();
  const goldReward = won ? stage.rewardGold : 0;
  const gemReward = won ? stage.rewardGems : 0;
  let dungeonEquipGained = null;
  if (won) {
    state.gold += goldReward; state.gems += gemReward;
    state.totalWins = (state.totalWins || 0) + 1;
    state.winProgress = Math.min(state.winMax, state.winProgress + 1);
    if (stage.isDungeon) {
      // このフロアが現在の到達フロアだった場合のみ、次のフロアを解放する
      if (stage.dungeonFloor === state.dungeonFloor) {
        state.dungeonFloor = Math.min(DUNGEON_MAX_FLOOR, state.dungeonFloor + 1);
      }
      if (stage.dungeonEquipReward) {
        state.dungeonEquipClaimed = state.dungeonEquipClaimed || [];
        if (!state.dungeonEquipClaimed.includes(stage.dungeonFloor)) {
          state.dungeonEquipClaimed.push(stage.dungeonFloor);
          const eid = stage.dungeonEquipReward;
          if (!state.cards[eid]) state.cards[eid] = { level: 1, exp: 0, count: 1, evolved: false };
          else state.cards[eid].count = (state.cards[eid].count || 1) + 1;
          dungeonEquipGained = eid;
        }
      }
    } else if (typeof stage.id === 'number' && stage.id === state.stageProgress) {
      // 最終ステージをクリアした場合も、他のステージと同様に進行度を1つ先へ進める。
      // ここでSTAGES.lengthに制限してしまうと、最終ステージが「クリア済み」判定されなくなるため注意
      state.stageProgress = Math.min(STAGES.length + 1, state.stageProgress + 1);
    }
    gainDragonExp(15);
  }
  let leveledUp = false;
  if (won) {
    const idNum = stage.isDungeon ? stage.dungeonFloor : (typeof stage.id === 'number' ? stage.id : 5);
    leveledUp = gainPlayerExp(10 + idNum * 6);
  }
  saveState();
  document.getElementById('result-reward-gold').textContent = (goldReward > 0 ? '+' : '') + goldReward;
  document.getElementById('result-reward-gem').textContent = (gemReward > 0 ? '+' : '') + gemReward;
  const levelupEl = document.getElementById('result-levelup');
  levelupEl.classList.toggle('hidden', !leveledUp);
  if (leveledUp) levelupEl.textContent = `⭐ レベルアップ！ Lv.${state.playerLevel}`;
  const equipEl = document.getElementById('result-dungeon-equip');
  if (equipEl) {
    equipEl.classList.toggle('hidden', !dungeonEquipGained);
    if (dungeonEquipGained) {
      const def = CARD_DEFS[dungeonEquipGained];
      equipEl.textContent = `👑 レジェンド装備獲得！「${def.name}」`;
    }
  }

  checkAchievements();
  if (won && stage.storyVictory && isWorldLastStage(stage)) {
    showStory(stage.storyVictory, () => revealResultScreen(won, stage));
  } else {
    revealResultScreen(won, stage);
  }
}

// ---------- オンライン対戦（試験提供） ----------
// window.LisNoirCloud に createBattleRoom / joinBattleRoom / listenToBattleRoom などが
// 実装されるまでは「準備中」を案内する。実装後は自動的につながる設計にしている
let onlineRoomUnsubscribe = null;
let onlineCurrentRoomCode = null;
let onlineIsHost = false;
let onlineActionUnsubscribe = null;
let onlineOpponentInfo = null;

function isOnlineBattleAvailable() {
  return !!(window.LisNoirCloud && typeof window.LisNoirCloud.createBattleRoom === 'function');
}

// オンライン対戦にはFirebase Authenticationへのログインが必要なため、
// 未ログインの場合は自動的に匿名ログインする（メール登録なしでも対戦できるようにするため）
async function ensureOnlineAuth() {
  if (window.LisNoirCloud.getUser()) return { ok: true };
  if (typeof window.LisNoirCloud.signInAnon !== 'function') {
    return { ok: false, message: 'オンライン対戦は現在準備中です（ログイン機能が未実装です）。' };
  }
  try {
    await window.LisNoirCloud.signInAnon();
    return { ok: true };
  } catch (err) {
    console.error('signInAnon failed', err);
    return { ok: false, message: (err && err.message) ? err.message : 'ログインに失敗しました。時間をおいて再度お試しください。' };
  }
}

function openOnlineScreen() {
  document.getElementById('online-lobby-view').classList.remove('hidden');
  document.getElementById('online-waiting-view').classList.add('hidden');
  document.getElementById('online-status-msg').textContent = '';
  document.getElementById('online-join-code-input').value = '';
  showScreen('online');
}

function setOnlineStatus(msg) {
  const el = document.getElementById('online-status-msg');
  if (el) el.textContent = msg || '';
}

async function createOnlineRoom() {
  if (!isOnlineBattleAvailable()) {
    setOnlineStatus('オンライン対戦は現在準備中です。しばらくお待ちください。');
    return;
  }
  if (!state.deck.length) {
    setOnlineStatus('先にデッキを編成してください。');
    return;
  }
  try {
    setOnlineStatus('準備しています…');
    const authResult = await ensureOnlineAuth();
    if (!authResult.ok) { setOnlineStatus(authResult.message); return; }
    setOnlineStatus('部屋を作成しています…');
    const validDeck = state.deck.filter(id => !!CARD_DEFS[id]);
    const hostShuffledDeck = shuffle(validDeck.slice());
    const hostInitialHand = hostShuffledDeck.splice(0, 2);
    const roomCode = await window.LisNoirCloud.createBattleRoom({
      hostName: state.playerName || 'プレイヤー',
      hostDeck: validDeck,
      hostLeaderId: state.leaderId,
      hostShuffledDeck,
      hostInitialHand,
    });
    onlineCurrentRoomCode = roomCode;
    onlineIsHost = true;
    document.getElementById('online-room-code-display').textContent = roomCode;
    document.getElementById('online-lobby-view').classList.add('hidden');
    document.getElementById('online-waiting-view').classList.remove('hidden');
    subscribeToOnlineRoom(roomCode);
  } catch (err) {
    console.error('createBattleRoom failed', err);
    setOnlineStatus('部屋の作成に失敗しました。時間をおいて再度お試しください。');
  }
}

async function joinOnlineRoom() {
  const code = document.getElementById('online-join-code-input').value.trim().toUpperCase();
  if (!code) { setOnlineStatus('合言葉コードを入力してください。'); return; }
  if (!isOnlineBattleAvailable()) {
    setOnlineStatus('オンライン対戦は現在準備中です。しばらくお待ちください。');
    return;
  }
  if (!state.deck.length) {
    setOnlineStatus('先にデッキを編成してください。');
    return;
  }
  try {
    setOnlineStatus('準備しています…');
    const authResult = await ensureOnlineAuth();
    if (!authResult.ok) { setOnlineStatus(authResult.message); return; }
    setOnlineStatus('参加しています…');
    const validDeck = state.deck.filter(id => !!CARD_DEFS[id]);
    const guestShuffledDeck = shuffle(validDeck.slice());
    const guestInitialHand = guestShuffledDeck.splice(0, 2);
    await window.LisNoirCloud.joinBattleRoom(code, {
      guestName: state.playerName || 'プレイヤー',
      guestDeck: validDeck,
      guestLeaderId: state.leaderId,
      guestShuffledDeck,
      guestInitialHand,
    });
    onlineCurrentRoomCode = code;
    onlineIsHost = false;
    subscribeToOnlineRoom(code);
  } catch (err) {
    console.error('joinBattleRoom failed', err);
    setOnlineStatus('参加できませんでした。コードをご確認の上、再度お試しください。');
  }
}

function subscribeToOnlineRoom(roomCode) {
  if (onlineRoomUnsubscribe) { onlineRoomUnsubscribe(); onlineRoomUnsubscribe = null; }
  onlineRoomUnsubscribe = window.LisNoirCloud.listenToBattleRoom(roomCode, (roomData) => {
    if (!roomData) return;
    if (roomData.status === 'active' && roomData.guestUid) {
      startOnlineBattleFromRoom(roomData);
    }
  });
}

// 相手が参加し、部屋が'active'になった時点で、両者共通の初期状態を使ってオンライン対戦を開始する
function startOnlineBattleFromRoom(roomData) {
  if (onlineRoomUnsubscribe) { onlineRoomUnsubscribe(); onlineRoomUnsubscribe = null; }
  const myUid = window.LisNoirCloud.getUser().uid;
  const iAmHost = roomData.hostUid === myUid;
  const seed = roomData.initialSeed || {};

  const myDeck = iAmHost ? (seed.hostShuffledDeck || []) : (seed.guestShuffledDeck || []);
  const myHand = iAmHost ? (seed.hostInitialHand || []) : (seed.guestInitialHand || []);
  const oppDeck = iAmHost ? (seed.guestShuffledDeck || []) : (seed.hostShuffledDeck || []);
  const oppHand = iAmHost ? (seed.guestInitialHand || []) : (seed.hostInitialHand || []);
  const oppName = iAmHost ? roomData.guestName : roomData.hostName;
  const oppLeaderId = iAmHost ? roomData.guestLeaderId : roomData.hostLeaderId;

  const playerMaxHp = ONLINE_BATTLE_HP; // オンライン対戦は、双方の育成状況に関わらず必ずHP400で公平に戦えるようにする
  onlineOpponentInfo = { name: oppName || '相手プレイヤー', leaderId: oppLeaderId };

  battle = {
    stage: { name: oppName || '相手プレイヤー', portrait: '👤', isOnline: true },
    isOnline: true,
    onlineRoomCode: onlineCurrentRoomCode,
    onlineIAmHost: iAmHost,
    onlineActionSeq: 0,
    turn: 1,
    activeSide: 'player', // ホストが先行。ゲスト側はホストのend_turn受信で自分のターンが始まる
    playerHp: playerMaxHp, playerMaxHp: playerMaxHp, enemyHp: playerMaxHp,
    playerMaxCost: 1, enemyMaxCost: 1,
    playerCost: 1, enemyCost: 1,
    playerDeck: myDeck.slice(), enemyDeck: oppDeck.slice(),
    playerHand: myHand.slice(), enemyHand: oppHand.slice(),
    playerField: [null, null, null, null, null],
    enemyField: [null, null, null, null, null],
    fieldCard: null,
    fieldCardSide: null,
    selectedHandIdx: null,
    selectedFieldIdx: null,
    log: '',
    over: false,
    deckOutSide: null,
    playerGraveyard: [],
    enemyGraveyard: [],
    lastPlayedInfo: null,
    leaderUltimateCharge: 1,
    leaderUltimateReady: false,
  };
  document.getElementById('battle-enemy-portrait').style.backgroundImage = '';
  document.getElementById('battle-enemy-portrait').classList.remove('has-boss-image');
  document.getElementById('battle-enemy-emoji').textContent = '👤';
  applyBattleBgTheme('forest', false);
  applyLeaderPortraits();
  const playerPortraitEl = document.getElementById('battle-player-portrait');
  if (playerPortraitEl && !playerPortraitEl.dataset.longpressBound) {
    playerPortraitEl.dataset.longpressBound = '1';
    bindLongPress(playerPortraitEl, () => { if (state.leaderId) showLeaderDetailInfo(state.leaderId); });
  }
  renderBattle();
  updateBattleSpeedBtn();
  document.getElementById('battle-auto-btn').classList.add('hidden'); // オンライン対戦ではオートバトルは使用不可
  showScreen('battle');
  showVsIntro(battle.stage);

  // 相手の行動をリアルタイムに購読し、届いたら自分側の「敵」情報として反映する
  if (onlineActionUnsubscribe) onlineActionUnsubscribe();
  onlineActionUnsubscribe = window.LisNoirCloud.listenToBattleActions(onlineCurrentRoomCode, (action) => {
    if (action.uid === myUid) return; // 自分自身の行動は無視（二重適用防止）
    applyRemoteAction(action);
  });

  if (!iAmHost) {
    battle.activeSide = 'enemy'; // ゲストは、ホストの最初のend_turnが届くまで待機
    renderBattle();
  }
}

// オンライン対戦の同期用：場のユニット情報から、Firestoreへ送信できるプレーンなデータに変換する
// （def はCARD_DEFSへの参照なのでそのままは送れないため、idだけ残して受信側で復元する）
function serializeFieldForSync(field) {
  return field.map(u => u ? {
    id: u.id, curHp: u.curHp, atkBonus: u.atkBonus, hpBonus: u.hpBonus,
    evolved: u.evolved, leaderBuff: u.leaderBuff, canAttack: u.canAttack,
    justPlayed: u.justPlayed, stunned: u.stunned, revived: u.revived,
    usedExtraAttack: u.usedExtraAttack, ailment: u.ailment, shield: u.shield,
  } : null);
}
function deserializeFieldFromSync(serialized) {
  return (serialized || []).map(u => (u && CARD_DEFS[u.id]) ? Object.assign({}, u, { def: CARD_DEFS[u.id], defId: u.id }) : null);
}

// オンライン対戦中、自分の行動をクラウドへ送信する（オンライン対戦でない場合は何もしない）
function submitOnlineAction(type, payload) {
  if (!battle || !battle.isOnline) return;
  battle.onlineActionSeq = (battle.onlineActionSeq || 0) + 1;
  window.LisNoirCloud.submitBattleAction(battle.onlineRoomCode, {
    turn: battle.turn,
    type,
    payload: payload || {},
  }).catch((err) => console.error('submitBattleAction failed', err));
}

// 相手から届いた行動を、自分の画面上では「敵」の行動として再現する
function applyRemoteAction(action) {
  if (!battle || !battle.isOnline || battle.over) return;
  const p = action.payload || {};
  switch (action.type) {
    case 'draw_choice': {
      if (p.drew) drawCardToHand(battle.enemyDeck, battle.enemyHand, battle.enemyGraveyard);
      break;
    }
    case 'play_card': {
      battle.enemyField = deserializeFieldFromSync(p.attackerSideField);
      battle.enemyHand = p.attackerSideHand || battle.enemyHand;
      battle.enemyCost = (typeof p.attackerSideCost === 'number') ? p.attackerSideCost : battle.enemyCost;
      battle.playerField = deserializeFieldFromSync(p.targetSideField);
      if (typeof p.targetSideHp === 'number') battle.playerHp = p.targetSideHp;
      break;
    }
    case 'cast_spell': {
      const idx = battle.enemyHand.indexOf(p.cardId);
      if (idx === -1) break;
      const def = CARD_DEFS[p.cardId];
      if (!def) break;
      battle.enemyCost = Math.max(0, battle.enemyCost - def.cost);
      battle.enemyHand.splice(idx, 1);
      const eff = def.effect || {};
      const targetIdx = (p.targetIdx === undefined) ? null : p.targetIdx;
      if (eff.kind === 'damage') {
        const dmg = p.dmg || eff.value || 0;
        if (targetIdx === null) {
          battle.playerHp -= dmg;
        } else {
          const target = battle.playerField[targetIdx];
          if (target) {
            target.curHp -= mitigateIncomingDamage(target, dmg);
            if (target.curHp <= 0) battle.playerField[targetIdx] = null;
          }
        }
      } else if (eff.kind === 'heal') {
        battle.enemyHp = Math.min(battle.enemyMaxHp || battle.playerMaxHp || 30, battle.enemyHp + (eff.value || 0));
      } else if (eff.kind === 'draw') {
        for (let i = 0; i < (eff.value || 0); i++) drawCardToHand(battle.enemyDeck, battle.enemyHand, battle.enemyGraveyard);
      } else if (eff.kind === 'wipe') {
        battle.playerField = [null, null, null, null, null];
      } else if (eff.kind === 'destroy') {
        if (targetIdx !== null) battle.playerField[targetIdx] = null;
      } else if (eff.kind === 'destroyRandom') {
        (p.destroyRandomTargets || []).forEach(i => { battle.playerField[i] = null; });
      }
      battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
      break;
    }
    case 'play_field': {
      const idx = battle.enemyHand.indexOf(p.cardId);
      if (idx === -1) break;
      const def = CARD_DEFS[p.cardId];
      battle.enemyCost = Math.max(0, battle.enemyCost - (def ? def.cost : 0));
      battle.enemyHand.splice(idx, 1);
      battle.fieldCard = p.cardId;
      battle.fieldCardSide = 'enemy';
      break;
    }
    case 'equip_card': {
      const idx = battle.enemyHand.indexOf(p.cardId);
      const unit = battle.enemyField[p.fieldIdx];
      if (idx === -1 || !unit) break;
      const def = CARD_DEFS[p.cardId];
      const eff = def.effect || {};
      battle.enemyCost = Math.max(0, battle.enemyCost - (def ? def.cost : 0));
      unit.atkBonus = (unit.atkBonus || 0) + (eff.atk || 0);
      unit.hpBonus = (unit.hpBonus || 0) + (eff.hp || 0);
      unit.curHp += (eff.hp || 0);
      battle.enemyHand.splice(idx, 1);
      break;
    }
    case 'attack': {
      // 相手の「自分側」＝自分から見た「敵側」、相手の「敵側」＝自分から見た「自分側」として反映する
      battle.enemyField = deserializeFieldFromSync(p.attackerSideField);
      battle.enemyHp = p.attackerSideHp;
      battle.playerField = deserializeFieldFromSync(p.targetSideField);
      battle.playerHp = p.targetSideHp;
      if (typeof p.targetSideCost === 'number') battle.playerCost = p.targetSideCost;
      break;
    }
    case 'use_ultimate': {
      battle.enemyField = deserializeFieldFromSync(p.attackerSideField);
      battle.enemyHp = p.attackerSideHp;
      battle.playerField = deserializeFieldFromSync(p.targetSideField);
      battle.playerHp = p.targetSideHp;
      break;
    }
    case 'end_turn': {
      battle.enemyField.forEach(u => { if (u) { if (u.stunned) { u.stunned = false; u.canAttack = false; } else { u.canAttack = true; } } });
      battle.turn += 1;
      battle.activeSide = 'player';
      battle.playerMaxCost = Math.min(10, battle.playerMaxCost + 1);
      battle.playerCost = battle.playerMaxCost;
      battle.leaderUltimateCharge = (battle.leaderUltimateCharge || 0) + 1;
      battle.playerField.forEach(u => applySkillTag(u, 'turnStart', true));
      tickAilment(battle.playerField);
      battle.playerField = cleanupField(battle.playerField, battle.playerGraveyard);
      // オンライン対戦では、カードを引くかどうかの選択は行わず、自動的に引く（v1の簡略化）
      if (battle.playerDeck.length > 0) {
        drawCardToHand(battle.playerDeck, battle.playerHand, battle.playerGraveyard);
      } else {
        battle.playerHp = 0;
        battle.deckOutSide = 'player';
      }
      showTurnBanner('YOUR TURN');
      break;
    }
    case 'surrender': {
      battle.playerHp = battle.playerMaxHp; // 相手の投了により、自分の勝利で終了する
      battle.enemyHp = 0;
      break;
    }
  }
  renderBattle();
  checkOnlineBattleEnd();
}

// オンライン対戦の勝敗判定（自分または相手のHPが0になった時点で終了とする）
function checkOnlineBattleEnd() {
  if (!battle || !battle.isOnline || battle.over) return;
  if (battle.playerHp <= 0 || battle.enemyHp <= 0) {
    battle.over = true;
    const won = battle.enemyHp <= 0 && battle.playerHp > 0;
    const myUid = window.LisNoirCloud.getUser().uid;
    window.LisNoirCloud.finishBattleRoom(battle.onlineRoomCode, won ? myUid : null).catch(() => {});
    if (onlineActionUnsubscribe) { onlineActionUnsubscribe(); onlineActionUnsubscribe = null; }
    showResult(won);
  }
}


function cancelOnlineRoom() {
  if (onlineRoomUnsubscribe) { onlineRoomUnsubscribe(); onlineRoomUnsubscribe = null; }
  if (onlineCurrentRoomCode && isOnlineBattleAvailable() && window.LisNoirCloud.leaveBattleRoom) {
    window.LisNoirCloud.leaveBattleRoom(onlineCurrentRoomCode).catch(err => console.error('leaveBattleRoom failed', err));
  }
  onlineCurrentRoomCode = null;
  openOnlineScreen();
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

  // 「次へ」ボタン：勝利かつ次のステージ／フロアが存在する場合はそこへ、それ以外は同じ内容に再挑戦
  const primaryBtn = document.getElementById('result-primary');
  const backBtn = document.getElementById('result-stageselect');
  if (stage.isDungeon) {
    const nextFloor = (won && stage.dungeonFloor < DUNGEON_MAX_FLOOR) ? stage.dungeonFloor + 1 : null;
    if (nextFloor) {
      primaryBtn.textContent = '次に進む';
      primaryBtn.onclick = () => startBattle(getDungeonFloorStage(nextFloor));
    } else {
      primaryBtn.textContent = 'もう一度挑戦する';
      primaryBtn.onclick = () => startBattle(stage);
    }
    backBtn.innerHTML = 'ダンジョン選択に<br>戻る';
    backBtn.onclick = () => { stageSelectMode = 'dungeon'; renderStageSelect(); showScreen('stage'); };
  } else {
    const nextStage = (won && typeof stage.id === 'number') ? STAGES.find(s => s.id === stage.id + 1) : null;
    if (nextStage) {
      primaryBtn.textContent = '次のステージへ';
      primaryBtn.onclick = () => startBattle(nextStage);
    } else {
      primaryBtn.textContent = 'もう一度挑戦する';
      primaryBtn.onclick = () => startBattle(stage);
    }
    backBtn.innerHTML = 'ステージ選択に<br>戻る';
    backBtn.onclick = () => { renderStageSelect(); showScreen('stage'); };
  }
  showScreen('result');
}

// ---------- カード画面（デッキ編成／カード一覧）セグメント切替 ----------
function showCollectionSegment(seg) {
  document.getElementById('seg-deck').classList.toggle('active', seg === 'deck');
  document.getElementById('seg-list').classList.toggle('active', seg === 'list');
  document.getElementById('seg-leader').classList.toggle('active', seg === 'leader');
  document.getElementById('collection-deck-view').style.display = seg === 'deck' ? '' : 'none';
  document.getElementById('collection-list-view').style.display = seg === 'list' ? '' : 'none';
  document.getElementById('collection-leader-view').style.display = seg === 'leader' ? '' : 'none';
  if (seg === 'deck') renderDeck();
  else if (seg === 'leader') renderLeaderList();
  else renderCardList();
}

function openCollectionScreen(seg) {
  showCollectionSegment(seg || 'deck');
  showScreen('collection');
}

// ---------- ガチャ ----------
const SHOP_PACKS = [
  { id: 'beginner', name: '初心者ガチャ', icon: '🔰', currency: 'gems', cost: 100,
    desc: '冒険を始める全ての人が、最初に必ず1回引く特別なガチャ。これを引くと他の全てのガチャが解放されます（50回以内にレジェンド確定）',
    weights: { normal: 60, rare: 30, epic: 8, legend: 2 },
    legendPityLimit: 50,
    rarityPool: {
      normal: ['fire_flameslime', 'water_slime', 'fire_imp', 'light_holyangel', 'dark_shadowbat', 'spell_iceshard', 'spell_healing',
        'fire_infernoimp', 'water_frostwolf', 'nature_leafslime', 'light_sainttiger', 'dark_scarecrow'],
      rare: ['fire_flarelion', 'water_icewolf', 'nature_venomscorpion', 'light_lightguardian', 'nature_wolf', 'spell_fireball', 'field_inferno', 'field_aquadeep', 'field_evergrove', 'field_sanctuary', 'field_abyss'],
      epic: ['fire_phoenix', 'water_serpent', 'nature_dryad', 'light_angel', 'dark_chaosdemon', 'spell_mindsurge', 'spell_soulbind', 'spell_apocalypse'],
      legend: ['fire_bahamut', 'water_seiren', 'nature_emeraldgaia', 'light_arcknight', 'dark_reaper', 'equip_aqualance'],
    },
    preview: ['fire_bahamut', 'water_seiren', 'nature_emeraldgaia', 'light_arcknight', 'dark_reaper', 'equip_aqualance', 'spell_apocalypse',
              'fire_phoenix', 'water_serpent', 'nature_dryad', 'light_angel', 'dark_chaosdemon'] },
  { id: 'normal', name: 'ノーマルガチャ', icon: '📦', currency: 'gems', cost: 100,
    desc: 'ノーマル〜レアのカードが出る基本ガチャ', weights: { normal: 60, rare: 40, epic: 0, legend: 0 },
    preview: ['water_slime', 'nature_wolf', 'fire_flarelion'] },
  { id: 'premium1', name: 'プレミアムガチャ第1弾', flavor: '冒険の始まり', icon: '👑', currency: 'gems', cost: 100,
    desc: '「冒険の始まり」レア〜レジェンドのカードが出る豪華ガチャ（50回以内にレジェンド確定）',
    featured: true,
    weights: { normal: 0, rare: 80, epic: 15, legend: 5 },
    legendPityLimit: 50,
    rarityPool: {
      // 初心者ガチャ等、他のガチャでも入手できる旧カード（下記コメントの16種）は、
      // ご要望によりプレミアムガチャ第1弾の排出対象から除外し、このガチャ限定の新規カードのみを対象にしている
      // 除外: fire_phoenix, water_serpent, nature_dryad, dark_chaosdemon, light_angel（エピック）
      //      fire_bahamut, water_seiren, nature_emeraldgaia, dark_reaper, light_arcknight（レジェンド）
      //      nature_wolf, water_icewolf, nature_swiftrabbit, fire_flarelion, nature_venomscorpion, light_lightguardian（レア）
      rare: ['fire_flameboar', 'dark_wraithbanshee', 'nature_stonesanctuary', 'light_ancientunicorn'],
      epic: ['fire_cerberus', 'water_icequartz', 'nature_venusharvest', 'light_crystalguardian', 'dark_deepabyssdemon'],
      legend: ['fire_kagutsuchi', 'water_mermaidsongress', 'nature_foreststag', 'light_fairylumina', 'dark_deathwhisperer'],
    },
    preview: ['fire_kagutsuchi', 'water_mermaidsongress', 'nature_foreststag', 'light_fairylumina', 'dark_deathwhisperer',
              'fire_cerberus', 'water_icequartz', 'nature_venusharvest', 'light_crystalguardian', 'dark_deepabyssdemon',
              'fire_flameboar', 'dark_wraithbanshee', 'nature_stonesanctuary', 'light_ancientunicorn'] },
];

// ガチャの排出確率を計算する（Apple App Store等の審査基準に対応するため、カード1枚ごとの正確な確率を開示する）
function computeGachaOdds(pack) {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  if (pack.pool) {
    // 固定プールのガチャ：収録カードから均等な確率で1枚
    const pct = 100 / pack.pool.length;
    return pack.pool
      .filter(id => CARD_DEFS[id])
      .map(id => ({ id, name: CARD_DEFS[id].name, rarity: CARD_DEFS[id].rarity, percent: pct }));
  }
  const results = [];
  Object.keys(pack.weights || {}).forEach(rarity => {
    const w = pack.weights[rarity];
    if (w <= 0) return;
    const restricted = pack.rarityPool && pack.rarityPool[rarity];
    const candidates = restricted
      ? restricted.filter(id => CARD_DEFS[id])
      : Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === rarity && !eventExclusiveIds.has(id) && !CARD_DEFS[id].isLeaderCard);
    if (!candidates.length) return;
    const perCardPct = w / candidates.length;
    candidates.forEach(id => results.push({ id, name: CARD_DEFS[id].name, rarity, percent: perCardPct }));
  });
  return results.sort((a, b) => b.percent - a.percent);
}

// ガチャの排出確率一覧を表示する
function showGachaOdds(packId) {
  const pack = SHOP_PACKS.find(p => p.id === packId) || EVENT_GACHA_PACKS.find(p => p.id === packId);
  if (!pack) return;
  const odds = computeGachaOdds(pack);
  const rarityOrder = { legend: 0, epic: 1, rare: 2, normal: 3 };
  odds.sort((a, b) => (rarityOrder[a.rarity] ?? 9) - (rarityOrder[b.rarity] ?? 9) || b.percent - a.percent);
  document.getElementById('gacha-odds-title').textContent = `${pack.name}：排出確率`;
  document.getElementById('gacha-odds-list').innerHTML = odds.map(o => {
    const rarity = RARITY[o.rarity] || { name: o.rarity, color: '#999' };
    return `<div class="cg-odds-row">
      <span class="cg-odds-rarity" style="color:${rarity.color}">${rarity.name}</span>
      <span class="cg-odds-name">${o.name}</span>
      <span class="cg-odds-pct">${o.percent.toFixed(2)}%</span>
    </div>`;
  }).join('') || '<div class="cg-empty">確率情報を表示できません</div>';
  document.getElementById('gacha-odds-overlay').classList.remove('hidden');
}

function pickWeightedCardId(weights, rarityPool) {
  const eventExclusiveIds = new Set(EVENT_GACHA_PACKS.flatMap(p => p.pool || []));
  const pool = [];
  Object.keys(weights).forEach(rarity => {
    const w = weights[rarity];
    if (w <= 0) return;
    const restricted = rarityPool && rarityPool[rarity];
    const candidates = restricted
      ? restricted.filter(id => CARD_DEFS[id])
      : Object.keys(CARD_DEFS).filter(id => CARD_DEFS[id].rarity === rarity && !eventExclusiveIds.has(id) && !CARD_DEFS[id].isLeaderCard);
    if (!candidates.length) return;
    // 表示している確率（例：ノーマル60%）が、そのレア度内のカード枚数に関わらず実際の排出率と一致するよう、
    // 均等に重みを分配する（1枚あたりの重み = 該当レア度の重み ÷ 該当レア度の候補カード数）
    const perCardWeight = w / candidates.length;
    candidates.forEach(id => pool.push({ id, w: perCardWeight }));
  });
  if (!pool.length) return Object.keys(CARD_DEFS)[0];
  const total = pool.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
  return pool[pool.length - 1].id;
}

function renderPackCard(pack) {
  const isFreeFirstBeginnerPull = pack.id === 'beginner' && !state.beginnerGachaDone;
  const effectiveCost = isFreeFirstBeginnerPull ? 0 : pack.cost;
  const currencyIcon = pack.currency === 'gold' ? '💰' : pack.currency === 'gems' ? '💎' : '🎫';
  const affordable = state[pack.currency] >= effectiveCost;
  const affordable10 = state[pack.currency] >= effectiveCost * 10;
  const show10 = !pack.pool && !pack.no10 && !isFreeFirstBeginnerPull; // 固定プールの期間限定ガチャ・no10指定のガチャ・初心者ガチャの初回無料分は10連非対応
  const previewIds = pack.pool || pack.preview || [];
  const previewHtml = previewIds.map(id => {
    const def = CARD_DEFS[id];
    if (!def) return '';
    const rarity = RARITY[def.rarity];
    const img = def.image
      ? `<img src="${def.image}" alt="${def.name}" data-emoji="${def.emoji}" onerror="this.style.display='none'; this.parentElement.textContent='${def.emoji}';"/>`
      : `<span>${def.emoji}</span>`;
    return `<div class="cg-pack-preview-thumb" style="border-color:${rarity.color}" title="${def.name}" data-id="${id}">${img}</div>`;
  }).join('');
  const pityCount = (state.pityCounters && state.pityCounters[pack.id]) || 0;
  const pityRemain = Math.max(0, PITY_LIMIT - pityCount);
  const showPity = !pack.pool && !pack.no10 && !isFreeFirstBeginnerPull && pack.weights.normal > 0; // 固定プールのガチャ・単発専用ガチャ・ノーマルが出ないガチャには天井表示不要
  const legendPityCount = (state.legendPityCounters && state.legendPityCounters[pack.id]) || 0;
  const legendPityRemain = pack.legendPityLimit ? Math.max(0, pack.legendPityLimit - legendPityCount) : 0;
  return `
      <div class="cg-pack-card">
        <div class="cg-pack-top">
          <div class="cg-pack-icon">${pack.iconImage ? `<img src="${pack.iconImage}" alt="${pack.name}"/>` : pack.icon}</div>
          <div class="cg-pack-info">
            <div class="cg-pack-name">${pack.name}${pack.flavor ? `<span class="cg-pack-flavor">〜${pack.flavor}〜</span>` : ''}</div>
            <div class="cg-pack-desc">${pack.desc}</div>
          </div>
        </div>
        ${showPity ? `<div class="cg-pack-pity">🎯 あと${pityRemain}回でレア以上確定</div>` : ''}
        ${pack.legendPityLimit ? `<div class="cg-pack-pity cg-pack-pity-legend">👑 あと${legendPityRemain}回でレジェンド確定</div>` : ''}
        <div class="cg-pack-buy-row">
          <button class="cg-btn cg-btn-main cg-pack-buy" data-pack="${pack.id}" data-times="1" ${affordable ? '' : 'disabled'}>${effectiveCost === 0 ? '無料' : currencyIcon + ' ' + effectiveCost}</button>
          ${show10 ? `<button class="cg-btn cg-pack-buy cg-pack-buy10" data-pack="${pack.id}" data-times="10" ${affordable10 ? '' : 'disabled'}>10連　${currencyIcon} ${effectiveCost * 10}</button>` : ''}
        </div>
        <div class="cg-pack-preview-label">${pack.pool ? '収録カード' : '収録例'}</div>
        <div class="cg-pack-preview-row">
          ${previewHtml}
        </div>
        <button class="cg-pack-odds-btn" data-pack="${pack.id}">📊 排出確率を見る</button>
      </div>`;
}

function renderShop() {
  document.getElementById('shop-gold').textContent = state.gold.toLocaleString();
  document.getElementById('shop-gems').textContent = state.gems.toLocaleString();
  const ticketEl = document.getElementById('shop-tickets');
  if (ticketEl) ticketEl.textContent = (state.tickets || 0).toLocaleString();

  const eventWrap = document.getElementById('shop-event-packs');
  if (eventWrap) {
    if (!state.beginnerGachaDone) {
      // 初心者ガチャを引くまでは、期間限定ガチャも表示しない
      eventWrap.innerHTML = '';
    } else {
      eventWrap.innerHTML = EVENT_GACHA_PACKS.map(renderPackCard).join('');
      eventWrap.querySelectorAll('.cg-pack-buy').forEach(btn => {
        btn.addEventListener('click', () => buyPack(btn.dataset.pack, Number(btn.dataset.times) || 1));
      });
      eventWrap.querySelectorAll('.cg-pack-preview-thumb').forEach(node => {
        node.addEventListener('click', () => showHandCardInfo(node.dataset.id));
      });
      eventWrap.querySelectorAll('.cg-pack-odds-btn').forEach(btn => {
        btn.addEventListener('click', () => showGachaOdds(btn.dataset.pack));
      });
    }
  }

  const wrap = document.getElementById('shop-packs');
  const visiblePacks = state.beginnerGachaDone
    ? SHOP_PACKS
    : SHOP_PACKS.filter(p => p.id === 'beginner');
  wrap.innerHTML = (!state.beginnerGachaDone ? '<div class="cg-beginner-gacha-banner">🔰 まずは「初心者ガチャ」を引いて、冒険を始めましょう！<br>引くと他のガチャも解放されます。</div>' : '')
    + visiblePacks.map(renderPackCard).join('');
  wrap.querySelectorAll('.cg-pack-buy').forEach(btn => {
    btn.addEventListener('click', () => buyPack(btn.dataset.pack, Number(btn.dataset.times) || 1));
  });
  wrap.querySelectorAll('.cg-pack-preview-thumb').forEach(node => {
    node.addEventListener('click', () => showHandCardInfo(node.dataset.id));
  });
  wrap.querySelectorAll('.cg-pack-odds-btn').forEach(btn => {
    btn.addEventListener('click', () => showGachaOdds(btn.dataset.pack));
  });
}

// ---------- ガチャの天井（保証） ----------
const PITY_LIMIT = 10; // このガチャで10回連続ノーマルが出たら、次回はレア以上を確定でプレゼント

function pickCardForPack(pack) {
  // 固定プールから均等な確率で1枚選ぶ専用ガチャ(天井システム対象外)
  if (pack.pool) {
    return pack.pool[Math.floor(Math.random() * pack.pool.length)];
  }
  state.pityCounters = state.pityCounters || {};
  const count = state.pityCounters[pack.id] || 0;
  state.legendPityCounters = state.legendPityCounters || {};
  const legendCount = state.legendPityCounters[pack.id] || 0;

  let cardId;
  if (pack.legendPityLimit && legendCount >= pack.legendPityLimit - 1) {
    // 指定回数以内にレジェンドが出ていない場合、次回は確定でレジェンド
    cardId = pickWeightedCardId({ legend: 1 }, pack.rarityPool);
  } else if (count >= PITY_LIMIT - 1) {
    const w = pack.weights;
    const guaranteed = { normal: 0, rare: w.rare || 50, epic: w.epic || 35, legend: w.legend || 15 };
    cardId = pickWeightedCardId(guaranteed, pack.rarityPool);
  } else {
    cardId = pickWeightedCardId(pack.weights, pack.rarityPool);
  }
  const rarity = CARD_DEFS[cardId].rarity;
  state.pityCounters[pack.id] = (rarity === 'normal') ? count + 1 : 0;
  if (pack.legendPityLimit) {
    state.legendPityCounters[pack.id] = (rarity === 'legend') ? 0 : legendCount + 1;
  }
  saveState();
  return cardId;
}

function buyPack(packId, times) {
  times = times || 1;
  const pack = SHOP_PACKS.find(p => p.id === packId) || EVENT_GACHA_PACKS.find(p => p.id === packId);
  if (!pack) return;
  // 初心者ガチャは、最初の1回（必須）のみ無料。それ以降は通常のガチャと同じ料金がかかる
  const effectiveCost = (packId === 'beginner' && !state.beginnerGachaDone) ? 0 : pack.cost;
  const totalCost = effectiveCost * times;
  if (state[pack.currency] < totalCost) return;
  state[pack.currency] -= totalCost;
  state.totalPacksOpened = (state.totalPacksOpened || 0) + times;
  if (packId === 'beginner') state.beginnerGachaDone = true; // 初心者ガチャを引いたら、他の全てのガチャが解放される
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
  if (pack.iconImage) {
    iconEl.textContent = '';
    iconEl.style.backgroundImage = `url('${pack.iconImage}')`;
    iconEl.classList.add('has-image');
  } else {
    iconEl.textContent = pack.icon;
    iconEl.style.backgroundImage = '';
    iconEl.classList.remove('has-image');
  }

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
      document.getElementById('opening-flash').classList.remove('flash');
      inner.style.visibility = 'hidden'; // 演出の土台(オーバーレイ)は表示したまま、バースト部分だけ隠す
      // 最も良いレアリティのカードを、実際のイラストとともに大きくお披露目してから結果画面へ
      showOpeningTeaser(cardIds, bestRarity, () => {
        overlay.classList.add('hidden');
        inner.style.visibility = '';
        applyPackRewards(cardIds);
      });
    }, 480);
  };
  inner.addEventListener('click', openNow);
}

// 獲得カードの中で最もレアリティが高い1枚を、実際のイラストとともに大きく表示する「お披露目」演出。
// ワクワク感を出すため、通常より長めに（約1.3秒）表示してから結果画面に進む
function showOpeningTeaser(cardIds, bestRarity, onDone) {
  const rarityOrder = ['normal', 'rare', 'epic', 'legend'];
  const bestId = cardIds.reduce((best, id) => {
    return rarityOrder.indexOf(CARD_DEFS[id].rarity) > rarityOrder.indexOf(CARD_DEFS[best].rarity) ? id : best;
  }, cardIds[0]);
  const def = CARD_DEFS[bestId];
  const rarity = RARITY[def.rarity];
  const teaser = document.getElementById('opening-teaser');
  const cardEl = document.getElementById('opening-teaser-card');
  cardEl.style.backgroundImage = def.image ? `url('${def.image}')` : `linear-gradient(145deg, ${rarity.color}, #1c1d24)`;
  cardEl.textContent = def.image ? '' : def.emoji;
  cardEl.style.display = 'flex';
  cardEl.style.alignItems = 'center';
  cardEl.style.justifyContent = 'center';
  cardEl.style.fontSize = '56px';
  document.getElementById('opening-teaser-name').textContent = def.name;
  document.getElementById('opening-teaser-rarity').textContent = rarity.name;
  teaser.dataset.rarity = def.rarity;
  void teaser.offsetWidth; // reflow でアニメ再トリガー
  teaser.classList.add('show');
  sfxReveal();
  const holdTime = def.rarity === 'legend' ? 1500 : (def.rarity === 'epic' ? 1300 : 1100);
  setTimeout(() => {
    teaser.classList.remove('show');
    onDone();
  }, holdTime);
}

function applyPackRewards(cardIds) {
  const results = cardIds.map(cardId => {
    const isNew = !state.cards[cardId];
    if (isNew) state.cards[cardId] = { level: 1, exp: 0, count: 0, evolved: false };
    const owned = state.cards[cardId];
    owned.count = (owned.count || 1) + 1;
    const isMonsterCard = (CARD_DEFS[cardId].type || 'monster') === 'monster';
    let leveledUp = false;
    if (!isNew && isMonsterCard && owned.level < CARD_MAX_LEVEL) {
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
  const isMonsterCard = (def.type || 'monster') === 'monster';
  sfxReveal();
  document.getElementById('shop-reveal-label').textContent = '獲得！';
  document.getElementById('shop-reveal-single').classList.remove('hidden');
  document.getElementById('shop-reveal-grid').classList.add('hidden');
  document.getElementById('shop-reveal-card').innerHTML = renderCardFace(cardId, { evolved: state.cards[cardId].evolved });
  const subLine = isNew
    ? '<br>✨NEW！ カード一覧に追加されました'
    : (leveledUp ? `<br>Lv.${state.cards[cardId].level} にレベルアップ！` : (isMonsterCard ? '<br>強化経験値+20' : '<br>重複獲得（累計枚数+1）'));
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
  gridEl.querySelectorAll('.cg-card').forEach(node => {
    node.addEventListener('click', () => showHandCardInfo(node.dataset.id));
  });
  document.getElementById('shop-reveal-overlay').classList.remove('hidden');
}

function hideReveal() {
  document.getElementById('shop-reveal-overlay').classList.add('hidden');
  // プレゼントの「まとめて受け取る」で複数のカードを獲得した場合、1つ閉じるごとに次のカードを表示する
  if (presentRevealQueue.length) {
    setTimeout(() => advancePresentRevealQueue(), 300);
  }
}

// ---------- プレゼント ----------
// 今後、新しいプレゼント（お詫び配布・イベント配布など）を追加する場合はこの配列に1件追加するだけでOK
const PRESENTS = [
  { id: 'welcome_bonus', title: '🎉 スタートダッシュ応援プレゼント', desc: 'ゲームを始めてくれてありがとうございます！冒険に役立つアイテムをプレゼントします。',
    reward: { gold: 2000, tickets: 2 } },
  { id: 'crimson_gift', title: '🐉 炎龍王クリムゾン 記念配布', desc: '力強い味方、「炎龍王クリムゾン」をプレゼントします。冒険のお供にどうぞ！',
    reward: { card: 'fire_crimson' } },
  { id: 'vampirelord_gift', title: '🧛 ヴァンパイアロード 記念配布', desc: '力強い味方、「ヴァンパイアロード」をプレゼントします。冒険のお供にどうぞ！',
    reward: { card: 'dark_demonlord' } },
];

function renderPresents() {
  const wrap = document.getElementById('present-list');
  const unclaimedCount = PRESENTS.filter(p => !state.presentsClaimed[p.id]).length;
  wrap.innerHTML = PRESENTS.map(p => {
    const claimed = !!state.presentsClaimed[p.id];
    return `
      <div class="cg-mission-card ${claimed ? '' : 'done'}">
        <div class="cg-mission-top">
          <div>
            <div class="cg-mission-title">${p.title}</div>
            <div class="cg-mission-desc">${p.desc}</div>
          </div>
          <div class="cg-mission-reward">${formatReward(p.reward)}</div>
        </div>
        <div class="cg-mission-bottom">
          <button class="cg-mission-claim ${claimed ? 'claimed' : ''}" data-present="${p.id}" ${claimed ? 'disabled' : ''}>${claimed ? '受取済み' : '受け取る'}</button>
        </div>
      </div>`;
  }).join('') + (PRESENTS.length === 0 ? '<div class="cg-empty">プレゼントはありません</div>' : '');
  wrap.querySelectorAll('.cg-mission-claim:not(.claimed):not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => claimPresent(btn.dataset.present));
  });
  const claimAllBtn = document.getElementById('present-claimall-btn');
  claimAllBtn.classList.toggle('hidden', unclaimedCount === 0);
  claimAllBtn.textContent = `🎁 まとめて受け取る（${unclaimedCount}件）`;
  updatePresentBadge();
}

function claimPresent(presentId) {
  const p = PRESENTS.find(x => x.id === presentId);
  if (!p || state.presentsClaimed[presentId]) return;
  state.gold += p.reward.gold || 0;
  state.gems += p.reward.gems || 0;
  state.tickets = (state.tickets || 0) + (p.reward.tickets || 0);
  if (p.reward.card) {
    const isNew = !state.cards[p.reward.card];
    grantPresentCard(p.reward.card);
    showReveal(p.reward.card, false, isNew);
  }
  state.presentsClaimed[presentId] = true;
  saveState();
  renderPresents();
  renderHome();
}

let presentRevealQueue = [];

function claimAllPresents() {
  presentRevealQueue = [];
  PRESENTS.forEach(p => { if (!state.presentsClaimed[p.id]) claimPresentSilent(p); });
  saveState();
  renderPresents();
  renderHome();
  advancePresentRevealQueue();
}

// プレゼントでカードを付与する（既に所持している場合は重複入手として枚数だけ加算する）
function grantPresentCard(cardId) {
  if (!CARD_DEFS[cardId]) return;
  if (state.cards[cardId]) {
    state.cards[cardId].count = (state.cards[cardId].count || 1) + 1;
  } else {
    state.cards[cardId] = { level: 1, exp: 0, count: 1, evolved: false };
  }
}

function claimPresentSilent(p) {
  state.gold += p.reward.gold || 0;
  state.gems += p.reward.gems || 0;
  state.tickets = (state.tickets || 0) + (p.reward.tickets || 0);
  if (p.reward.card) {
    const isNew = !state.cards[p.reward.card];
    grantPresentCard(p.reward.card);
    presentRevealQueue.push({ cardId: p.reward.card, isNew });
  }
  state.presentsClaimed[p.id] = true;
}

// 「まとめて受け取る」でカードを獲得していた場合、1件ずつ獲得演出を表示する
function advancePresentRevealQueue() {
  if (!presentRevealQueue.length) return;
  const next = presentRevealQueue.shift();
  showReveal(next.cardId, false, next.isNew);
}

// ホーム画面のプレゼントボタンに、未受け取り件数のバッジを表示する
function updatePresentBadge() {
  const badge = document.getElementById('present-badge');
  if (!badge) return;
  const count = PRESENTS.filter(p => !state.presentsClaimed[p.id]).length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

// ホーム画面のミッションボタンに、受け取り可能な達成済みミッション件数のバッジを表示する
function updateMissionBadge() {
  const badge = document.getElementById('mission-badge');
  if (!badge) return;
  const count = MISSIONS.filter(m => !state.missionsClaimed[m.id] && m.check(state) >= m.target).length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

// ---------- 実績・称号 ----------
// 一度達成すると永続的に記録される実績。各実績は専用の称号（プレイヤー名の横に表示できる）を解放する
const ACHIEVEMENTS = [
  { id: 'win1', category: 'battle', title: '駆け出しの冒険者', desc: 'バトルに1回勝利する', target: 1, check: s => s.totalWins || 0 },
  { id: 'win10', category: 'battle', title: '頼れる戦士', desc: 'バトルに10回勝利する', target: 10, check: s => s.totalWins || 0 },
  { id: 'win50', category: 'battle', title: '百戦錬磨', desc: 'バトルに50回勝利する', target: 50, check: s => s.totalWins || 0 },
  { id: 'win100', category: 'battle', title: '伝説の戦士', desc: 'バトルに100回勝利する', target: 100, check: s => s.totalWins || 0 },
  { id: 'upgrade10', category: 'card', title: '鍛錬の証', desc: 'カードを合計10回強化する', target: 10, check: s => s.totalUpgrades || 0 },
  { id: 'upgrade50', category: 'card', title: '熟練の鍛冶師', desc: 'カードを合計50回強化する', target: 50, check: s => s.totalUpgrades || 0 },
  { id: 'legend1', category: 'card', title: '幸運の持ち主', desc: 'レジェンドカードを1枚入手する', target: 1,
    check: s => Object.keys(s.cards).filter(id => CARD_DEFS[id] && CARD_DEFS[id].rarity === 'legend').length },
  { id: 'legend5', category: 'card', title: 'レジェンドコレクター', desc: 'レジェンドカードを5種類入手する', target: 5,
    check: s => Object.keys(s.cards).filter(id => CARD_DEFS[id] && CARD_DEFS[id].rarity === 'legend').length },
  { id: 'compendium50', category: 'card', title: '収集家の卵', desc: '図鑑の収集率が50%に到達する', target: 50,
    check: s => { const { ownedCount, total } = getCompendiumProgress(); return total ? Math.floor((ownedCount / total) * 100) : 0; } },
  { id: 'compendium100', category: 'card', title: '図鑑の達人', desc: '図鑑をコンプリートする', target: 1, check: s => s.compendiumRewardClaimed ? 1 : 0 },
  { id: 'dragon10', category: 'dragon', title: '竜の育て手', desc: 'ドラゴンをLv.10まで育てる', target: 10, check: s => (s.dragon && s.dragon.level) || 1 },
  { id: 'dragon30', category: 'dragon', title: '竜王の絆', desc: 'ドラゴンを最大レベルまで育てる', target: CARD_MAX_LEVEL, check: s => (s.dragon && s.dragon.level) || 1 },
  { id: 'trophy3000', category: 'rank', title: '躍進の証', desc: 'トロフィーを3000以上獲得する', target: 3000, check: s => s.trophy || 0 },
  { id: 'trophy15000', category: 'rank', title: '栄光のランカー', desc: 'トロフィーを15000以上獲得する', target: 15000, check: s => s.trophy || 0 },
  { id: 'storyClear', category: 'story', title: '世界を救いし者', desc: 'ストーリーを全てクリアする', target: STAGES.length + 1, check: s => s.stageProgress || 1 },
  { id: 'dungeon50', category: 'dungeon', title: '深淵の踏破者', desc: 'ダンジョン地下50階に到達する', target: 50, check: s => s.dungeonFloor || 1 },
  { id: 'dungeon100', category: 'dungeon', title: 'ダンジョンの覇者', desc: 'ダンジョン地下100階に到達する', target: DUNGEON_MAX_FLOOR, check: s => s.dungeonFloor || 1 },
  { id: 'deckPreset3', category: 'deck', title: '戦略家', desc: 'デッキプリセットを3つ作成する', target: 3, check: s => (s.deckPresets && s.deckPresets.length) || 0 },
];

// 実績の達成状況を確認し、新たに条件を満たしたものを解放する（画面遷移のたびに呼び出す軽量なチェック）
function checkAchievements() {
  let newlyUnlocked = null;
  ACHIEVEMENTS.forEach(a => {
    if (state.achievementsUnlocked[a.id]) return;
    if (a.check(state) >= a.target) {
      state.achievementsUnlocked[a.id] = true;
      if (!newlyUnlocked) newlyUnlocked = [];
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked) {
    saveState();
    showAchievementUnlockToast(newlyUnlocked);
  }
  return newlyUnlocked;
}


// 実績を新たに解放した際の通知（複数同時解放の場合は代表1件+件数を表示）
function showAchievementUnlockToast(newlyUnlocked) {
  const toast = document.getElementById('achievement-unlock-toast');
  if (!toast || !newlyUnlocked || !newlyUnlocked.length) return;
  const first = newlyUnlocked[0];
  const extra = newlyUnlocked.length > 1 ? `　他${newlyUnlocked.length - 1}件` : '';
  document.getElementById('achievement-unlock-toast-text').textContent = `実績解放：${first.title}${extra}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ---------- ミッション ----------
const MISSIONS = [
  { id: 'win1', category: 'battle', title: 'はじめての勝利', desc: 'バトルに1回勝利する', target: 1, check: s => s.totalWins || 0, reward: { gold: 200 } },
  { id: 'win3', category: 'battle', title: '勝利を重ねる', desc: 'バトルに3回勝利する', target: 3, check: s => s.totalWins || 0, reward: { gold: 500 } },
  { id: 'win10', category: 'battle', title: '歴戦の証', desc: 'バトルに10回勝利する', target: 10, check: s => s.totalWins || 0, reward: { gems: 20 } },
  { id: 'win25', category: 'battle', title: 'バトルマスターへの道', desc: 'バトルに25回勝利する', target: 25, check: s => s.totalWins || 0, reward: { gems: 40 } },
  { id: 'win50', category: 'battle', title: '百戦錬磨', desc: 'バトルに50回勝利する', target: 50, check: s => s.totalWins || 0, reward: { gems: 80, gold: 1000 } },
  { id: 'pack1', category: 'collect', title: '初めてのガチャ', desc: 'ガチャを1回引く', target: 1, check: s => s.totalPacksOpened || 0, reward: { gems: 5 } },
  { id: 'pack5', category: 'collect', title: 'ガチャコレクター', desc: 'ガチャを5回引く', target: 5, check: s => s.totalPacksOpened || 0, reward: { gems: 15 } },
  { id: 'pack15', category: 'collect', title: 'ガチャ愛好家', desc: 'ガチャを15回引く', target: 15, check: s => s.totalPacksOpened || 0, reward: { gems: 30 } },
  { id: 'pack30', category: 'collect', title: 'ガチャの求道者', desc: 'ガチャを30回引く', target: 30, check: s => s.totalPacksOpened || 0, reward: { gems: 60 } },
  { id: 'upgrade3', category: 'growth', title: 'カードを鍛える', desc: 'カードを3回強化する', target: 3, check: s => s.totalUpgrades || 0, reward: { gold: 400 } },
  { id: 'upgrade10', category: 'growth', title: '熟練の強化師', desc: 'カードを10回強化する', target: 10, check: s => s.totalUpgrades || 0, reward: { gold: 800 } },
  { id: 'upgrade25', category: 'growth', title: '究極の強化師', desc: 'カードを25回強化する', target: 25, check: s => s.totalUpgrades || 0, reward: { gold: 1500, gems: 20 } },
  { id: 'deck20', category: 'collect', title: 'デッキを整える', desc: 'デッキを20枚以上編成する', target: 20, check: s => s.deck.length, reward: { gold: 300 } },
  { id: 'deck30', category: 'collect', title: '完全なるデッキ', desc: 'デッキを30枚編成する', target: 30, check: s => s.deck.length, reward: { gold: 600, gems: 10 } },
  { id: 'deck40', category: 'collect', title: '極めしデッキ', desc: 'デッキを40枚編成する', target: 40, check: s => s.deck.length, reward: { gold: 1200, gems: 20 } },
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
  { id: 'dragonLv5', category: 'battle', title: '相棒との絆', desc: 'ドラゴンをLv.5まで育てる', target: 5, check: s => (s.dragon && s.dragon.level) || 1, reward: { gold: 600 } },
  { id: 'trophy4001', category: 'battle', title: 'プラチナランク到達', desc: 'トロフィーを4001以上獲得する', target: 4001, check: s => s.trophy || 0, reward: { gems: 80 } },
  { id: 'trophy6001', category: 'battle', title: 'ダイヤモンドランク到達', desc: 'トロフィーを6001以上獲得する', target: 6001, check: s => s.trophy || 0, reward: { gold: 5000, gems: 150 } },
  { id: 'upgrade50', category: 'growth', title: 'カード強化の鬼', desc: 'カードを50回強化する', target: 50, check: s => s.totalUpgrades || 0, reward: { gold: 2500, gems: 25 } },
  { id: 'level15', category: 'growth', title: '熟練の証', desc: 'プレイヤーレベル15に到達する', target: 15, check: s => s.playerLevel || 1, reward: { gold: 1000, gems: 20 } },
  { id: 'level20', category: 'growth', title: '頂を目指す者', desc: 'プレイヤーレベル20に到達する', target: 20, check: s => s.playerLevel || 1, reward: { gems: 60 } },
  { id: 'evolve20', category: 'growth', title: '進化の極致', desc: 'カードを20体進化させる', target: 20, check: s => getEvolvedMonsterCount().evolvedCount, reward: { gold: 2000, gems: 40 } },
  { id: 'dragonlevel10', category: 'growth', title: 'ドラゴンを育てる', desc: 'ドラゴンをLv.10まで育てる', target: 10, check: s => (s.dragon && s.dragon.level) || 1, reward: { gold: 800 } },
  { id: 'dragonlevel20', category: 'growth', title: '古代竜の目覚め', desc: 'ドラゴンをLv.20まで育てる', target: 20, check: s => (s.dragon && s.dragon.level) || 1, reward: { gems: 70 } },
  { id: 'pack50', category: 'collect', title: 'ガチャの達人', desc: 'ガチャを50回引く', target: 50, check: s => s.totalPacksOpened || 0, reward: { gems: 80 } },
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
  if (reward.tickets) parts.push(`🎫${reward.tickets}`);
  if (reward.card && CARD_DEFS[reward.card]) parts.push(`🃏${CARD_DEFS[reward.card].name}`);
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
  updateMissionBadge();
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
// ---------- 初回オンボーディング ----------
const ONBOARDING_STEPS = [
  { emoji: '🏰', title: 'ようこそ、Lis Noirへ',
    desc: 'ここはホーム画面です。トロフィー・ランクや、ログインボーナス、ステージ挑戦などがまとまっています。まずは全体の流れを簡単にご案内します（あとで設定画面からいつでも見返せます）。' },
  { emoji: '👆', title: 'このあと、実際に操作してみましょう',
    desc: 'これから、実際の画面を操作しながら「デッキ編成」と「バトル」の基本を体験できるご案内が始まります。画面の光っている部分をタップして進めてください。' },
  { emoji: '🔰', title: '体験のあとは：初心者ガチャ',
    desc: '操作を一通り体験したら、「初心者ガチャ」を1回引きます（無料）。ここで手に入るカードが、さらなる戦力になります。引き終えると他の画面もすべて解放されます。' },
  { emoji: '✨', title: 'ガチャでカードを集めよう',
    desc: '「ガチャ」からカードを集められます。同じカードを何度も入手すると「絆レベル」が上がり、見た目に称号や光る演出がつきます。レア度が高いカードほど強力です。' },
  { emoji: '📜', title: 'やり込み要素いろいろ',
    desc: '「ミッション」や「ログインボーナス」「プレゼント」から報酬を受け取れます。周回プレイには、バトル画面の「AUTO」（オートバトル）や「1x/2x」（倍速）が便利です。' },
  { emoji: '❓', title: '困ったときは',
    desc: 'それぞれの画面右上にある「？」ボタンから、その画面の詳しい遊び方をいつでも確認できます。さあ、あなただけのデッキで、Lis Noirの世界を制覇しましょう！' },
];
let onboardingStepIdx = 0;

// ---------- 体験型チュートリアル（実際の画面を操作しながら学ぶ） ----------
let interactiveTutorialActive = false;
let interactiveTutorialStepIdx = 0;
let interactiveTutorialWaiter = null; // setTimeoutのID、または{target, handler}

const INTERACTIVE_TUTORIAL_STEPS = [
  { selector: '#nav-cards',
    matches: (el) => !!el.closest('#nav-cards'),
    text: 'まずは「カード」タブをタップして、デッキ編成画面を開いてみましょう。', hint: '👆 「カード」タブをタップ' },
  { findTarget: findTutorialAddableCard,
    matches: (el) => {
      const card = el.closest('#collection-list .cg-coll-item');
      if (!card) return false;
      const id = card.dataset.id;
      return !!(id && !state.deck.includes(id) && state.cards[id]);
    },
    text: '下のカード一覧からカードをタップすると、デッキに追加できます。試しに1枚タップしてみましょう。', hint: '👆 好きなカードをタップ' },
  { selector: '#nav-battle',
    matches: (el) => !!el.closest('#nav-battle'),
    text: '次は「バトル」タブをタップして、ステージ選択画面に進みましょう。', hint: '👆 「バトル」タブをタップ' },
  { selector: '.cg-stage-card:not(.locked)',
    matches: (el) => !!el.closest('.cg-stage-card:not(.locked)'),
    text: 'ステージをタップするとバトルが始まります。挑戦してみましょう。', hint: '👆 一番上のステージをタップ' },
  { findTarget: findTutorialMonsterHandCard,
    matches: (el) => {
      const card = el.closest('#battle-hand .cg-hand-card');
      if (!card || !battle) return false;
      const id = battle.playerHand && battle.playerHand[Number(card.dataset.idx)];
      return !!(id && CARD_DEFS[id] && (CARD_DEFS[id].type || 'monster') === 'monster');
    },
    text: '手札のモンスターカードをタップして選んでみましょう。', hint: '👆 モンスターカードをタップ' },
  { selector: '#battle-player-field .cg-field-slot:not(.filled)',
    matches: (el) => !!el.closest('#battle-player-field .cg-field-slot:not(.filled)'),
    text: '空いている自分の場のマスをタップすると、選んだカードを召喚できます。', hint: '👆 空いているマスをタップ' },
  { selector: '#battle-end-turn',
    matches: (el) => !!el.closest('#battle-end-turn'),
    text: 'よくできました！行動が終わったら「ターン終了」をタップして、相手にターンを渡しましょう。', hint: '👆 「ターン終了」をタップ' },
];

// 手札の中から「モンスター」タイプのカードだけを対象にする（スペル・装備等だと後続の「空きマスをタップ」が成立しないため）
function findTutorialMonsterHandCard() {
  if (!battle || !battle.playerHand) return null;
  const idx = battle.playerHand.findIndex(id => CARD_DEFS[id] && (CARD_DEFS[id].type || 'monster') === 'monster');
  if (idx === -1) return null;
  return document.querySelector(`#battle-hand .cg-hand-card[data-idx="${idx}"]`);
}

// デッキ編成画面のカード一覧から、まだデッキに入っていないカードを対象にする
// （既にデッキに入っているカードをタップすると外れてしまい、意図と逆の動作になるため）
function findTutorialAddableCard() {
  const nodes = document.querySelectorAll('#collection-list .cg-coll-item');
  for (const node of nodes) {
    const id = node.dataset.id;
    if (id && !state.deck.includes(id) && state.cards[id]) return node;
  }
  return null;
}

function isTutorialTargetVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function startInteractiveTutorial() {
  interactiveTutorialActive = true;
  interactiveTutorialStepIdx = 0;
  tutorialScrolledForStep = -1;
  document.addEventListener('click', onTutorialDocumentClick, true);
  showInteractiveTutorialStep();
}

// 現在のステップの完了条件を、クリックのたびにその場のデータで判定する（対象要素が再描画で
// 差し替わっていても、正しく検知できるようにするため。特定のDOMノードにバインドする方式は
// 再描画で対象が消えると反応しなくなるため採用していない）
function onTutorialDocumentClick(e) {
  if (!interactiveTutorialActive) return;
  // チュートリアル自身のUI（ツールチップ・スキップボタン）は常に操作できるようにする
  if (e.target.closest('#tutorial-tooltip')) return;
  const step = INTERACTIVE_TUTORIAL_STEPS[interactiveTutorialStepIdx];
  if (!step || !step.matches(e.target)) {
    // 案内している対象と一致しない操作は、チュートリアル中は無効化する
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  interactiveTutorialStepIdx++;
  // 前のステップの「定期的に位置を再計算する」タイマーがまだ残っていると、遷移の合間に
  // それが発火して古いスポットライトを復活させてしまう（新しい画面をブロックする原因になる）ため、
  // ここで確実にキャンセルしてから、古いスポットライトを非表示にする
  clearInteractiveTutorialWaiter();
  hideTutorialSpotlight();
  // 画面遷移・再描画の完了を少し待ってから次のステップを表示する
  setTimeout(() => showInteractiveTutorialStep(), 400);
}

function hideTutorialSpotlight() {
  ['tutorial-mask-top', 'tutorial-mask-bottom', 'tutorial-mask-left', 'tutorial-mask-right', 'tutorial-spotlight-ring', 'tutorial-tooltip'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

function clearInteractiveTutorialWaiter() {
  if (interactiveTutorialWaiter) clearTimeout(interactiveTutorialWaiter);
  interactiveTutorialWaiter = null;
}

function showInteractiveTutorialStep() {
  clearInteractiveTutorialWaiter();
  if (!interactiveTutorialActive) return;
  if (interactiveTutorialStepIdx >= INTERACTIVE_TUTORIAL_STEPS.length) {
    finishInteractiveTutorial();
    return;
  }
  const step = INTERACTIVE_TUTORIAL_STEPS[interactiveTutorialStepIdx];
  document.getElementById('tutorial-tooltip-step').textContent = `ステップ ${interactiveTutorialStepIdx + 1} / ${INTERACTIVE_TUTORIAL_STEPS.length}`;
  document.getElementById('tutorial-tooltip-text').textContent = step.text;
  document.getElementById('tutorial-tooltip-hint').textContent = step.hint;
  waitForTutorialTarget(step, 0);
}

// 対象要素が現れる（画面遷移・再描画後）まで、短い間隔でポーリングし、見つかり次第スポットライトを合わせる
// （完了判定そのものはonTutorialDocumentClickが担うため、ここでは表示位置合わせのみ行う）
let tutorialScrolledForStep = -1;

function waitForTutorialTarget(step, attempts) {
  if (!interactiveTutorialActive) return;
  const vsIntro = document.getElementById('battle-vs-intro');
  const introShowing = vsIntro && !vsIntro.classList.contains('hidden');
  const target = step.findTarget ? step.findTarget() : document.querySelector(step.selector);
  if (!introShowing && target && isTutorialTargetVisible(target)) {
    // 対象が画面外（要スクロール）にある場合、このステップで初めて見つかった時にだけ自動でスクロールする
    if (tutorialScrolledForStep !== interactiveTutorialStepIdx) {
      tutorialScrolledForStep = interactiveTutorialStepIdx;
      const rect = target.getBoundingClientRect();
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!fullyVisible) {
        target.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
    positionTutorialSpotlight(target);
    // 再描画で対象の位置がずれることがあるため、このステップの間は定期的に位置を再計算する
    interactiveTutorialWaiter = setTimeout(() => waitForTutorialTarget(step, 0), 400);
    return;
  }
  if (attempts > 150) { // 約30秒待っても対象が現れない場合は、このステップを諦めて次へ
    interactiveTutorialStepIdx++;
    showInteractiveTutorialStep();
    return;
  }
  interactiveTutorialWaiter = setTimeout(() => waitForTutorialTarget(step, attempts + 1), 200);
}

function positionTutorialSpotlight(target) {
  const rect = target.getBoundingClientRect();
  const pad = 6;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const right = rect.right + pad;
  const bottom = rect.bottom + pad;
  const vw = window.innerWidth, vh = window.innerHeight;

  document.getElementById('tutorial-mask-top').style.cssText = `top:0; left:0; width:100%; height:${top}px;`;
  document.getElementById('tutorial-mask-bottom').style.cssText = `top:${bottom}px; left:0; width:100%; height:${Math.max(0, vh - bottom)}px;`;
  document.getElementById('tutorial-mask-left').style.cssText = `top:${top}px; left:0; width:${left}px; height:${bottom - top}px;`;
  document.getElementById('tutorial-mask-right').style.cssText = `top:${top}px; left:${right}px; width:${Math.max(0, vw - right)}px; height:${bottom - top}px;`;
  document.getElementById('tutorial-spotlight-ring').style.cssText = `top:${top}px; left:${left}px; width:${right - left}px; height:${bottom - top}px;`;

  ['tutorial-mask-top', 'tutorial-mask-bottom', 'tutorial-mask-left', 'tutorial-mask-right', 'tutorial-spotlight-ring', 'tutorial-tooltip'].forEach(id => {
    document.getElementById(id).classList.remove('hidden');
  });

  // 対象の下に十分な余白があれば下に、なければ上にツールチップを表示する
  const tooltip = document.getElementById('tutorial-tooltip');
  if (vh - bottom > 170) {
    tooltip.style.top = (bottom + 14) + 'px';
    tooltip.style.bottom = 'auto';
  } else {
    tooltip.style.bottom = (vh - top + 14) + 'px';
    tooltip.style.top = 'auto';
  }
}

function repositionTutorialIfActive() {
  if (!interactiveTutorialActive) return;
  const step = INTERACTIVE_TUTORIAL_STEPS[interactiveTutorialStepIdx];
  if (!step) return;
  const target = step.findTarget ? step.findTarget() : document.querySelector(step.selector);
  if (target && isTutorialTargetVisible(target)) positionTutorialSpotlight(target);
}

function finishInteractiveTutorial() {
  interactiveTutorialActive = false;
  clearInteractiveTutorialWaiter();
  document.removeEventListener('click', onTutorialDocumentClick, true);
  hideTutorialSpotlight();
  state.hasSeenInteractiveTutorial = true;
  saveState();
}

function renderOnboardingStep() {
  const step = ONBOARDING_STEPS[onboardingStepIdx];
  document.getElementById('onboarding-emoji').textContent = step.emoji;
  document.getElementById('onboarding-title').textContent = step.title;
  document.getElementById('onboarding-desc').textContent = step.desc;
  document.getElementById('onboarding-dots').innerHTML = ONBOARDING_STEPS.map((_, i) =>
    `<span class="${i === onboardingStepIdx ? 'active' : ''}"></span>`).join('');
  const isLast = onboardingStepIdx === ONBOARDING_STEPS.length - 1;
  document.getElementById('onboarding-next').textContent = isLast ? 'はじめる' : '次へ';
}

function startOnboarding() {
  onboardingStepIdx = 0;
  renderOnboardingStep();
  document.getElementById('onboarding-overlay').classList.remove('hidden');
}

function finishOnboarding() {
  document.getElementById('onboarding-overlay').classList.add('hidden');
  if (!state.hasSeenOnboarding) {
    state.hasSeenOnboarding = true;
    saveState();
  }
  // スライドが終わったら、続けて体験型チュートリアルを開始する（初回・再視聴のどちらの場合も）
  // 初心者ガチャは、チュートリアル完了後に案内する流れのため、ここでは完了チェックをしない
  if (!interactiveTutorialActive) {
    setTimeout(() => startInteractiveTutorial(), 400);
  }
}

function onboardingNext() {
  sfxTap();
  if (onboardingStepIdx < ONBOARDING_STEPS.length - 1) {
    onboardingStepIdx += 1;
    renderOnboardingStep();
  } else {
    finishOnboarding();
  }
}

// ---------- 画面ごとのヘルプ ----------
const SCREEN_HELP = {
  home: {
    title: 'ホーム画面のヘルプ',
    items: [
      '<b>① プレイヤー情報</b><br>アイコン・名前をタップすると、プレイヤー設定画面が開きます。',
      '<b>② トロフィー・ジェム・ゴールド</b><br>現在の所持数を確認できます。⚙アイコンから設定・データ管理も可能です。',
      '<b>③ 開催中のお知らせ</b><br>ランクカードの下に、開催中のイベントクエストや目玉のプレミアムガチャがあれば案内されます。',
      '<b>④ クイックメニュー</b><br>バトル・カード・ガチャ・ミッションなどへすぐに移動できます。',
      '<b>⑤ デイリー報酬・開催中のガチャ</b><br>毎日受け取れる報酬（左）と、現在開催中の目玉ガチャの案内（右）を確認できます。',
    ],
  },
  collection: {
    title: 'カード画面のヘルプ',
    items: [
      '<b>① デッキ編成</b><br>カード一覧のカードをタップするとデッキに追加、デッキ側のカードをタップすると1枚外れます（タップする場所によって、追加か削除かが決まるシンプルな操作です）。同じカードは1枠にまとめて「×N」で枚数表示されます。属性タブで絞り込みも可能。',
      '<b>② デッキの中身・枚数</b><br>「デッキの中身」に、現在編成中のカードと枚数・平均コストが表示されます。カードをタップすると1枚外れます。',
      '<b>③ 自動編成・一括解除</b><br>「自動編成」でおすすめのデッキを組んだり、「一括解除」で全カードを外したりできます。',
      '<b>④ リーダー・デッキ管理</b><br>「リーダー・デッキ管理」をタップすると開き、使用するリーダーの選択や、デッキの保存・読み込み・編集ができます。',
      '<b>⑤ カード一覧（図鑑）</b><br>所持カードはカラー、未所持はグレーで表示。長押しで簡易情報、タップで強化画面が開きます。「デッキ内のみ表示」で絞り込みも可能。',
      '<b>⑥ リーダーの詳細確認</b><br>カード一覧の「リーダー」タブから、全リーダーのリーダースキル・アルティメットスキルを確認できます。',
      '<b>⑦ 並び替え</b><br>「並び替え」のプルダウンから、レアリティ順・属性順・コスト順にカードを並び替えられます。',
    ],
  },
  cardDetail: {
    title: 'カード強化・進化画面のヘルプ',
    items: [
      '<b>① 強化</b><br>ゴールドを消費してカードのレベルを上げ、攻撃力・HPをアップさせます（最大Lv.30）。強化に必要なゴールドは、レベルとレア度が高いほど多くなります。この強化は、モンスターカードのみが対象です（スペル・装備・フィールドカードにはレベルの概念がありません）。',
      '<b>② 進化</b><br>規定のレベルに到達すると、ゴールドを消費して進化させ、ステータスを永続的に強化できます。',
      '<b>③ デッキ操作</b><br>この画面から直接、デッキへの追加・削除ができます。',
      '<b>④ 前へ／次へ</b><br>画面上部のボタンで、他の所持カードの詳細に移動できます。',
    ],
  },
  stage: {
    title: 'ステージ選択画面のヘルプ',
    items: [
      '<b>① ステージ挑戦</b><br>ステージをタップすると、挑戦前の確認画面が表示されます。内容を確認し「挑戦する」を選ぶとバトルが始まります（ダンジョン・高難易度・特別クエスト・イベントクエストも同様です）。上から順に難易度が上がっていきます。',
      '<b>② ステージ解放</b><br>ステージをクリアすると、次のステージが解放されます。',
      '<b>③ ダンジョン・高難易度・特別クエスト</b><br>画面上部のタブから切り替えられます。ダンジョンはホーム画面からも同じ内容にアクセスできます。高難易度・特別クエストは、ストーリーとは別枠の強敵クエストで、ステージ26以降を解放すると挑戦できるようになります。',
      '<b>④ ダンジョンについて</b><br>通常のステージとは別の、地下1階〜100階の長期やり込みコンテンツです（トロフィーには影響しません）。階層が深くなるほど敵が強くなり、10階ごとにフロアボスが出現して撃破すると限定のレジェンド装備が手に入ります。現在の到達階層より先には進めません。',
    ],
  },
  events: {
    title: 'イベントクエスト画面のヘルプ',
    items: [
      '<b>① 期間限定ステージ</b><br>開催期間中のみ挑戦できる、期間限定のステージ一覧です。',
    ],
  },
  shop: {
    title: 'ガチャ画面のヘルプ',
    items: [
      '<b>① ガチャを引く</b><br>ゴールドやジェムを消費してガチャを引き、カードを手に入れます。単発・10連が選べます。',
      '<b>② 天井（保証）</b><br>連続でノーマルばかり出た場合、一定回数を超えると次回はレア以上が確定します。',
      '<b>③ 収録カード</b><br>各ガチャの下に表示されているカードをタップすると、詳細を確認できます。',
      '<b>④ 期間限定ガチャ</b><br>「期間限定ガチャチケット」🎫を消費して引く、期間限定の特別なガチャです。1種類のチケットで、どの期間限定ガチャも引くことができます。',
      '<b>⑤ 排出確率</b><br>各ガチャの「📊排出確率を見る」から、カード1枚ごとの正確な排出確率を確認できます。',
    ],
  },
  mission: {
    title: 'ミッション画面のヘルプ',
    items: [
      '<b>① ミッション達成</b><br>条件を満たすと「達成」になり、報酬を受け取れます。',
      '<b>② まとめて受け取る</b><br>達成済みのミッションが複数あるとき、一括で報酬を受け取れます。',
      '<b>③ カテゴリ絞り込み</b><br>「全て／バトル／育成／収集」のタブで、ミッションを絞り込めます。',
    ],
  },
  present: {
    title: 'プレゼント画面のヘルプ',
    items: [
      '<b>① プレゼントの受け取り</b><br>運営からのお知らせやボーナスなど、受け取っていないプレゼントが一覧で表示されます。「受け取る」をタップすると報酬を獲得できます。',
      '<b>② まとめて受け取る</b><br>複数のプレゼントがある場合、一括で受け取ることもできます。',
    ],
  },
  dragon: {
    title: 'ドラゴン育成画面のヘルプ',
    items: [
      '<b>① エサをあげる</b><br>ゴールドを消費してエサをあげ、ドラゴンの経験値を稼ぎます。',
      '<b>② レベルアップ</b><br>経験値が貯まるとレベルが上がり、成長段階（見た目）も変化します。',
      '<b>③ 育成による効果</b><br>ドラゴンのレベルに応じて、バトル開始時の自分の最大HPにボーナスが付きます。',
    ],
  },
  ranking: {
    title: 'ランキング画面のヘルプ',
    items: [
      '<b>① ランク早見表</b><br>各ランク（ブロンズ〜ダイヤモンド）の必要トロフィー数を確認できます。',
      '<b>② ランキング一覧</b><br>トロフィー数による他プレイヤーとの順位を確認できます。ランクの境目には区切り線が表示されます。',
      '<b>③ ログイン</b><br>ログインすると、自分の順位もランキングに反映されます。',
    ],
  },
  profile: {
    title: 'プレイヤー設定画面のヘルプ',
    items: [
      '<b>① プレイヤー名・アイコン</b><br>名前の変更や、写真・イラストからのアイコン選択ができます。',
      '<b>② 保存</b><br>「保存する」を押すと確認ダイアログが表示され、OKで変更が反映されます。',
      '<b>③ 称号</b><br>「実績・称号一覧を見る」から、達成した実績に応じた称号を選んで装着できます。装着した称号は、ホーム画面のランクカードに表示されます。',
    ],
  },
  achievements: {
    title: '実績・称号画面のヘルプ',
    items: [
      '<b>① 実績とは</b><br>バトルの勝利数やカードの収集・強化状況など、様々な条件を満たすと自動的に達成される、恒久的な記録です。一度達成した実績が失われることはありません。',
      '<b>② 称号</b><br>達成済みの実績には、それぞれ専用の称号が用意されています。カードをタップして「この称号を装着する」を選ぶと、ホーム画面のランクカードに表示されます（いつでも変更できます）。',
    ],
  },
  online: {
    title: 'オンライン対戦のヘルプ（β版）',
    items: [
      '<b>① 部屋を作る</b><br>「部屋を作る」をタップすると、合言葉コードが発行されます。フレンドにそのコードを伝えましょう。',
      '<b>② コードで参加する</b><br>フレンドから伝えられたコードを入力し、「参加する」をタップすると対戦が始まります。',
      '<b>③ 対戦の流れ</b><br>お互いのデッキ・リーダーで実際に対戦します。ターン制で、自分のターン中のみ操作できます（相手のターン中は「相手のターンです…」と表示されます）。カードは毎ターン自動的に1枚引かれます。',
      '<b>④ この機能について</b><br>現在β版（試験提供）です。不具合が発生する場合があります。オートバトル機能はオンライン対戦では使用できません。',
    ],
  },
};

function openScreenHelp(key) {
  const help = SCREEN_HELP[key];
  if (!help) return;
  document.getElementById('screen-help-title').textContent = help.title;
  document.getElementById('screen-help-body').innerHTML = help.items.map(item => `<div class="cg-help-item">${item}</div>`).join('');
  document.getElementById('screen-help-overlay').classList.remove('hidden');
}

function init() {
  // アプリが閉じられる・裏に回る直前に、確実に最新の状態を保存しておく
  // （何らかの理由でこまめな保存が漏れていた場合の保険。iOSでアプリを完全に終了する際に
  // 特に重要なため、visibilitychange・pagehideの両方で保存する。クラウド同期は通常1.5秒待ってから
  // まとめて行うが、アプリが閉じる場面ではその猶予がないため、ここでは即座に同期する）
  const flushSaveOnClose = () => {
    try { saveState(); flushCloudSyncNow(); } catch (e) { console.error('flush save failed', e); }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSaveOnClose();
  });
  window.addEventListener('pagehide', flushSaveOnClose);

  // 全てのオーバーレイ（ヘルプ・カード情報・各種モーダル）について、非表示になった後は
  // display:noneにして完全にレンダリングを止める（見えない間もアニメーション等が動き続けて
  // 端末が発熱する問題への対策）。既存の hidden クラスの付け外しはそのままで動作する
  document.querySelectorAll('.cg-help-overlay').forEach(overlay => {
    const observer = new MutationObserver(() => {
      if (overlay.classList.contains('hidden')) {
        setTimeout(() => {
          if (overlay.classList.contains('hidden')) overlay.style.display = 'none';
        }, 220);
      } else {
        overlay.style.display = '';
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  });

  checkSeasonReset();
  renderHome();
  // 体験型チュートリアルを終えたのに初心者ガチャをまだ引いていない場合のみ、他の画面へ移動できないようにする
  // （チュートリアル自体がスポットライトで画面遷移を誘導するため、チュートリアル中・完了前は自由に操作できるようにしている）
  document.addEventListener('click', (e) => {
    if (state.beginnerGachaDone) return;
    if (!state.hasSeenInteractiveTutorial) return;
    if (interactiveTutorialActive) return;
    if (e.target.closest('.cg-tab, .cg-quick-btn, .cg-back-btn, #result-stageselect, #result-primary')) {
      e.preventDefault();
      e.stopPropagation();
      renderShop();
      showScreen('shop');
    }
  }, true);
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cg-tab, .cg-quick-btn, .cg-btn, .cg-stage-card, .cg-help-btn')) sfxTap();
  });
  document.getElementById('nav-home').addEventListener('click', () => { renderHome(); showScreen('home'); });
  document.getElementById('nav-battle').addEventListener('click', () => { renderStageSelect(); showScreen('stage'); });
  document.getElementById('nav-cards').addEventListener('click', () => openCollectionScreen('deck'));
  document.getElementById('nav-shop').addEventListener('click', () => { renderShop(); showScreen('shop'); });
  document.getElementById('nav-mission').addEventListener('click', () => { renderMissions(); showScreen('mission'); });
  document.getElementById('quick-stage').addEventListener('click', () => { renderStageSelect(); showScreen('stage'); });
  document.querySelectorAll('#stage-mode-tabs .cg-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      stageSelectMode = tab.dataset.mode;
      document.querySelectorAll('#stage-mode-tabs .cg-filter-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderStageSelect();
    });
  });
  document.getElementById('quick-cards').addEventListener('click', () => openCollectionScreen('deck'));
  document.getElementById('quick-shop').addEventListener('click', () => { renderShop(); showScreen('shop'); });
  document.getElementById('quick-mission').addEventListener('click', () => { renderMissions(); showScreen('mission'); });
  document.getElementById('quick-present').addEventListener('click', () => { renderPresents(); showScreen('present'); });
  document.getElementById('quick-login-bonus').addEventListener('click', () => {
    renderLoginBonusCalendar();
    document.getElementById('login-bonus-overlay').classList.remove('hidden');
  });
  document.getElementById('login-bonus-claim-btn').addEventListener('click', claimLoginBonus);
  document.getElementById('login-bonus-close').addEventListener('click', () => {
    document.getElementById('login-bonus-overlay').classList.add('hidden');
  });
  const quickDragonBtn = document.getElementById('quick-dragon');
  if (quickDragonBtn) quickDragonBtn.addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('quick-online').addEventListener('click', openOnlineScreen);
  document.getElementById('online-create-btn').addEventListener('click', createOnlineRoom);
  document.getElementById('online-join-btn').addEventListener('click', joinOnlineRoom);
  document.getElementById('online-cancel-btn').addEventListener('click', cancelOnlineRoom);
  document.getElementById('online-copy-code-btn').addEventListener('click', () => {
    const code = document.getElementById('online-room-code-display').textContent;
    try { navigator.clipboard.writeText(code); } catch (e) {}
    const btn = document.getElementById('online-copy-code-btn');
    const original = btn.textContent;
    btn.textContent = 'コピーしました！';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
  document.getElementById('mission-claimall-btn').addEventListener('click', claimAllMissions);
  document.getElementById('present-claimall-btn').addEventListener('click', claimAllPresents);
  const dragonSummaryEl = document.getElementById('dragon-summary');
  if (dragonSummaryEl) dragonSummaryEl.addEventListener('click', () => { renderDragon(); showScreen('dragon'); });
  document.getElementById('dragon-feed-btn').addEventListener('click', feedDragon);
  document.getElementById('story-overlay').addEventListener('click', advanceStory);
  document.getElementById('shop-reveal-close').addEventListener('click', hideReveal);
  document.getElementById('seg-deck').addEventListener('click', () => showCollectionSegment('deck'));
  document.getElementById('seg-list').addEventListener('click', () => showCollectionSegment('list'));
  document.getElementById('seg-leader').addEventListener('click', () => showCollectionSegment('leader'));
  document.getElementById('auto-build-btn').addEventListener('click', autoBuildDeck);
  document.getElementById('deck-clear-btn').addEventListener('click', clearDeck);
  document.getElementById('deck-share-btn').addEventListener('click', openDeckShareOverlay);
  document.getElementById('deck-share-close').addEventListener('click', () => {
    document.getElementById('deck-share-overlay').classList.add('hidden');
  });
  document.getElementById('deck-share-copy-btn').addEventListener('click', copyDeckShareCode);
  document.getElementById('deck-share-view-btn').addEventListener('click', viewSharedDeckCode);
  document.getElementById('deck-preset-save-btn').addEventListener('click', saveDeckPreset);
  document.getElementById('compendium-claim-btn').addEventListener('click', claimCompendiumReward);
  document.querySelectorAll('#collection-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setCollectionFilter(btn.dataset.filter));
  });
  document.querySelectorAll('#cardlist-filter-tabs .cg-filter-tab').forEach(btn => {
    btn.addEventListener('click', () => setCardListFilter(btn.dataset.filter));
  });
  document.getElementById('collection-sort-select').addEventListener('change', (e) => {
    collectionSortMode = e.target.value;
    renderDeck();
  });
  document.getElementById('cardlist-sort-select').addEventListener('change', (e) => {
    cardListSortMode = e.target.value;
    renderCardList();
  });
  document.getElementById('cardlist-deckonly-toggle').addEventListener('click', toggleCardListDeckOnly);
  document.querySelectorAll('.cg-back-btn:not(#battle-back-btn):not(.cg-back-btn-detail):not(.cg-back-btn-online):not(.cg-back-btn-achievements)').forEach(b => b.addEventListener('click', () => showScreen('home') || renderHome()));
  document.getElementById('profile-achievements-btn').addEventListener('click', () => { renderAchievementsScreen(); showScreen('achievements'); });
  document.querySelector('.cg-back-btn-achievements').addEventListener('click', () => { renderProfileScreen(); showScreen('profile'); });
  document.querySelector('.cg-back-btn-online').addEventListener('click', () => {
    if (onlineRoomUnsubscribe) { onlineRoomUnsubscribe(); onlineRoomUnsubscribe = null; }
    if (onlineCurrentRoomCode && isOnlineBattleAvailable() && window.LisNoirCloud.leaveBattleRoom) {
      window.LisNoirCloud.leaveBattleRoom(onlineCurrentRoomCode).catch(err => console.error('leaveBattleRoom failed', err));
    }
    onlineCurrentRoomCode = null;
    showScreen('home');
    renderHome();
  });
  document.querySelectorAll('.cg-back-btn-detail').forEach(b => b.addEventListener('click', () => openCollectionScreen('list')));
  document.getElementById('battle-end-turn').addEventListener('click', endTurn);
  document.getElementById('battle-back-btn').addEventListener('click', async () => {
    if (battle && !battle.over) {
      if (!(await showGenericConfirm('対戦中です。バトルを中断してホームに戻りますか？（勝敗はつきません）', '⚔️ バトル中断'))) return;
    }
    // オンライン対戦を中断する場合、行動の購読を確実に解除する（放置するとバックグラウンドで動き続けてしまうため）
    if (battle && battle.isOnline) {
      if (onlineActionUnsubscribe) { onlineActionUnsubscribe(); onlineActionUnsubscribe = null; }
      if (window.LisNoirCloud && window.LisNoirCloud.leaveBattleRoom && battle.onlineRoomCode) {
        window.LisNoirCloud.leaveBattleRoom(battle.onlineRoomCode).catch(err => console.error('leaveBattleRoom failed', err));
      }
    }
    battle = null;
    showScreen('home');
    renderHome();
  });
  document.getElementById('deckout-confirm-btn').addEventListener('click', () => {
    document.getElementById('deckout-overlay').classList.add('hidden');
    showResult(battle.playerHp > 0);
  });
  document.getElementById('battle-graveyard-btn').addEventListener('click', openGraveyard);
  document.getElementById('graveyard-close').addEventListener('click', () => {
    document.getElementById('graveyard-overlay').classList.add('hidden');
  });
  document.getElementById('season-reset-close').addEventListener('click', () => {
    document.getElementById('season-reset-overlay').classList.add('hidden');
  });
  document.getElementById('battle-help-btn').addEventListener('click', () => {
    document.getElementById('battle-help-overlay').classList.remove('hidden');
  });
  document.getElementById('battle-speed-btn').addEventListener('click', () => {
    state.battleFastMode = !state.battleFastMode;
    saveState();
    updateBattleSpeedBtn();
  });
  document.getElementById('battle-auto-btn').addEventListener('click', toggleAutoBattle);
  document.getElementById('battle-help-close').addEventListener('click', () => {
    document.getElementById('battle-help-overlay').classList.add('hidden');
    state.hasSeenBattleHelp = true;
    saveState();
  });
  document.getElementById('card-info-close').addEventListener('click', () => {
    document.getElementById('card-info-overlay').classList.add('hidden');
  });
  document.getElementById('draw-choice-yes').addEventListener('click', () => resolveDrawChoice(true));
  document.getElementById('gacha-odds-close').addEventListener('click', () => {
    document.getElementById('gacha-odds-overlay').classList.add('hidden');
  });
  document.getElementById('draw-choice-no').addEventListener('click', () => resolveDrawChoice(false));
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('rewatch-onboarding-btn').addEventListener('click', () => {
    document.getElementById('settings-overlay').classList.add('hidden');
    startOnboarding();
  });
  document.getElementById('tutorial-skip-btn').addEventListener('click', finishInteractiveTutorial);
  window.addEventListener('resize', () => repositionTutorialIfActive());
  document.getElementById('cloud-backup-goto-settings').addEventListener('click', () => {
    document.getElementById('cloud-backup-banner').classList.add('hidden');
    openSettings();
  });
  document.getElementById('cloud-backup-dismiss').addEventListener('click', () => {
    state.cloudBackupBannerDismissed = true;
    saveState();
    document.getElementById('cloud-backup-banner').classList.add('hidden');
  });
  document.getElementById('sfx-toggle-btn').addEventListener('click', toggleSfx);
  document.getElementById('bgm-toggle-btn').addEventListener('click', toggleBgm);
  document.getElementById('bgm-volume-slider').addEventListener('input', (e) => {
    setBgmVolume(Number(e.target.value) / 100);
  });
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
  document.getElementById('onboarding-next').addEventListener('click', onboardingNext);
  document.getElementById('onboarding-skip').addEventListener('click', finishOnboarding);
  document.querySelectorAll('.cg-screen-help-btn').forEach(btn => {
    btn.addEventListener('click', () => openScreenHelp(btn.dataset.help));
  });
  document.getElementById('screen-help-close').addEventListener('click', () => {
    document.getElementById('screen-help-overlay').classList.add('hidden');
  });
  if (window.LisNoirCloud) {
    window.LisNoirCloud.onAuthChange(async (user) => {
      refreshCloudAuthUI(user);
      if (!user) return;
      setCloudSyncStatus('☁️ ログイン中（' + user.email + '）');
      // ログインセッションは残っているのに、この端末のデータが初期状態のままに見える場合
      // （端末側のストレージだけが消えてしまった可能性が高いため）、確認を挟まず自動でクラウドから復元する
      if (!state.beginnerGachaDone) {
        try {
          const cloudData = await window.LisNoirCloud.loadCloud();
          if (cloudData && cloudData.beginnerGachaDone) {
            applyCloudData(cloudData);
            showAutoRestoreToast();
          }
        } catch (err) {
          console.error('auto cloud restore check failed', err);
        }
      } else {
        // この端末は初期状態ではないが、クラウド側が明らかにこの端末より進行している場合
        // （何らかの理由でこの端末のデータだけ古い・巻き戻っている可能性があるため）、
        // 自動での上書きは行わず、必ず確認を挟む
        try {
          const cloudData = await window.LisNoirCloud.loadCloud();
          if (cloudData && cloudData.beginnerGachaDone) {
            const cloudAhead = (cloudData.trophy || 0) > (state.trophy || 0) + 500
              || (cloudData.stageProgress || 1) > (state.stageProgress || 1) + 2;
            if (cloudAhead) {
              const compareHtml = buildSaveCompareHtml(state, cloudData);
              const useCloud = await showCloudRestoreConfirm(
                'クラウドの方が進行状況が大きく進んでいます。この端末のデータより新しい可能性があります。どちらを使いますか？',
                compareHtml
              );
              if (useCloud) {
                applyCloudData(cloudData);
                showAutoRestoreToast();
              }
              // 「この端末のデータを使う」を選んだ場合は、通常通りこの端末のデータで進行する
              // （ここでの選択だけではクラウド側を上書きしない。上書きは通常のクラウド同期のタイミングで行われる）
            }
          }
        } catch (err) {
          console.error('cloud progress comparison check failed', err);
        }
      }
    });
  }
  if (state.beginnerGachaDone || !state.hasSeenInteractiveTutorial) {
    showScreen('home');
  } else {
    renderShop();
    showScreen('shop');
  }
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
      playBgm();
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => { if (splash.classList.contains('hidden')) splash.style.display = 'none'; }, 650);
      }
      if (!state.hasSeenOnboarding) {
        setTimeout(startOnboarding, 500); // スプラッシュのフェードアウト後に表示
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
