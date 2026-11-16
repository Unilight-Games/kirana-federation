/* สหพันธรัฐแห่งคีรันนา · หอเกียรติยศอัตโนมัติและลานความคิดเห็น (Google Apps Script)
 *
 * วางโค้ดนี้ใน Apps Script ของ Google Sheet หนึ่งไฟล์ แล้วเผยแพร่เป็น Web app (Execute as: Me, Who has access: Anyone)
 * ผู้ชนะที่ลงชื่อเข้าใช้ Google (หรือเครื่องผู้พัฒนา) จะถูกบันทึกลงชีต "hof" เองตอนจบเกม หน้าเกมอ่านรายชื่อจากที่นี่
 * ความคิดเห็นที่ผู้เล่นที่ลงชื่อเข้าใช้กดส่งลงชีต "cmt" ทันที เครื่องผู้พัฒนาลบรายชื่อหรือความคิดเห็นจากหน้าเกมได้
 * การลบจดไว้ในชีต "removed" ทุกหน้าเกมจึงซ่อนรายการนั้น แม้รายการจะยังค้างอยู่ในไฟล์ของคลังหรือในเครื่องผู้เล่น
 * ลบแถวในชีตเพื่อเอาบันทึกที่ไม่ต้องการออกได้ทันทีเหมือนเดิม
 *
 * หอเกียรติยศเริ่มใหม่ทุกวันที่ 1 ของเดือนตามเวลาไทย (รุ่น 5): คำขอแรกของเดือนใหม่ย้ายแถวของเดือนก่อน ๆ จากชีต "hof"
 * ไปต่อท้ายชีต "hof-archive" พร้อมเดือนของแถวนั้นในคอลัมน์แรก ชีต "hof" จึงเหลือเฉพาะเดือนที่กำลังเดิน ไม่มีแถวใดถูกลบทิ้ง
 * วันที่ของบันทึกมาจากนาฬิกาของสคริปต์ และบันทึกที่เคยขึ้นหอในเดือนก่อนส่งซ้ำเข้าเดือนใหม่ไม่ได้
 * ถ้าเคยเผยแพร่รุ่นก่อนแล้ว วางโค้ดนี้ทับ แล้ว Deploy > Manage deployments > แก้ไข > Version: New version ที่อยู่เดิมใช้ต่อได้
 *
 * รุ่น 6 (15 พ.ย. 2026): เครื่องผู้พัฒนารีเซ็ตหอเกียรติยศได้ทั้งหอ ทุกแถวในชีต "hof" ย้ายไปต่อท้ายชีต "hof-archive"
 * (คอลัมน์แรกบอกเดือนและวันที่รีเซ็ต) ไม่มีแถวใดถูกลบทิ้ง เวลาที่รีเซ็ตเก็บไว้ใน Script Properties ชื่อ HOF_RESET และหน้าเกม
 * ทุกเครื่องซ่อนบันทึกที่เกิดก่อนเวลานั้นจากทุกแหล่ง บันทึกใหม่มีเวลาที่สคริปต์รับ (t) และรหัสเกม (gid) ติดมาด้วย
 * และเครื่องผู้พัฒนาขอบันทึกการเดินของเกมที่ตรงกับผู้ชนะคนหนึ่งได้ เพื่อเล่นซ้ำตรวจผลและการใช้ AI ของเกมช่วยเล่น
 *
 * รุ่น 7 (16 พ.ย. 2026): หน้าเกมส่งบันทึกการเดินของเกมไปพร้อมผลทุกครั้ง สคริปต์เก็บไว้ในชีต "hof-logs" คู่กับบันทึก
 * ตั้งทริกเกอร์รายวันให้ฟังก์ชัน nightlyHofCheck ทำงานช่วงเที่ยงคืนถึงตีหนึ่ง (Triggers > Add trigger > nightlyHofCheck >
 * Time-driven > Day timer > Midnight to 1am และตั้งเขตเวลาของโครงการเป็นกรุงเทพ) ทุกคืนสคริปต์ตรวจบันทึกในชีต "hof"
 * ที่เข้ามาตั้งแต่ผลแรกที่มีบันทึกการเดินติดมา (ก่อนหน้านั้นหน้าเกมรุ่นใหม่ยังไม่ขึ้น จึงไม่ตรวจอะไร) บันทึกที่ไม่มี
 * บันทึกการเดินเลย (ทั้งในชีต "hof-logs" และในเกมที่จบของสถิติ) ถูกนำออกไปชีต "hof-flagged" จดในชีต "removed"
 * ให้ทุกหน้าเกมซ่อน และบัญชีที่ส่งถูกระงับในชีต "blocked" (ส่งผลและความคิดเห็นไม่ได้ และเห็นข้อความ CONFIG.BLOCK_NOTICE)
 * บันทึกอื่นของบัญชีนั้นในหอออกไปด้วย ช่วง NIGHTLY_GRACE_DAYS วันแรกนำออกอย่างเดียว ไม่ระงับ เพราะหน้าเกมที่เปิดค้าง
 * ก่อนอัปเดตยังส่งผลโดยไม่มีบันทึกการเดิน บันทึกที่การย้ายเดือนพาไปชีต "hof-archive" ก่อนทริกเกอร์ทำงานถูกตรวจที่นั่น
 * ครั้งเดียว ปลดระงับได้จากหน้าสถิติบนเครื่องผู้พัฒนา หรือลบแถวในชีต "blocked"
 *
 * สถิติการเล่น: ชีต "daily" นับจำนวนคนเข้าต่อวัน (เบราว์เซอร์ละครั้งต่อวัน แยกสมาชิกกับผู้มาเยือน ไม่มีรายการการเข้าชม)
 * ชีต "games" เก็บเกมที่เริ่ม จบ หรือออกกลางคัน พร้อมผล การ์ดที่แต่ละรัฐเลือก และบันทึกการเดินของแต่ละเกม
 * สองชีตนี้ไม่มีทางอ่านผ่านที่อยู่สาธารณะ อ่านได้จากหน้าสถิติบนเครื่องผู้พัฒนาเท่านั้น (และจากตัวชีตเองในบัญชีของเจ้าของ)
 * ตั้ง CONFIG.STATS เป็น false เพื่อหยุดเก็บ
 *
 * สิ่งที่สคริปต์เก็บ: บันทึกเกมแบบเดียวกับไฟล์ data/hall-of-fame.json แฮชของรหัสบัญชี และสถิติการเล่นข้างต้น
 * (รหัสสุ่มของเบราว์เซอร์ ไม่ใช่ชื่อหรืออีเมล) สคริปต์ไม่เห็นที่อยู่ IP ของผู้เล่นและไม่เก็บอีเมล
 * โทเค็นการลงชื่อเข้าใช้ใช้ตรวจกับ Google ครั้งเดียวแล้วทิ้ง ที่เหลือใช้ตั๋วที่สคริปต์ลงลายมือชื่อเอง
 */
const CONFIG = {
  // OAuth Client ID ตัวเดียวกับใน config.js ของหน้าเกม ว่างไว้ = ยอมรับบัญชี Google ที่ยืนยันแล้วจากทุกแอป
  GOOGLE_CLIENT_ID: '',
  // แฮชของโทเค็นเครื่องผู้พัฒนา ต้องตรงกับ DEV_HASH ในหน้าเกม
  DEV_HASH: '34605b69ee31ea08c513356452b54d0d6093cdcedab4e2151355e1840c7f15fc',
  MAX_PER_DAY: 20,      // บันทึกที่บัญชีหนึ่งส่งได้ใน 24 ชั่วโมง
  LIST_SIZE: 30,        // จำนวนอันดับที่หน้าเกมอ่าน (หน้าเกมแสดง 10)
  SESSION_DAYS: 120,    // อายุตั๋วหลังลงชื่อเข้าใช้
  MAX_CMT_PER_DAY: 30,  // ความคิดเห็นที่บัญชีหนึ่งส่งได้ใน 24 ชั่วโมง
  CMT_LIST: 200,        // จำนวนความคิดเห็นล่าสุดที่หน้าเกมอ่าน
  REMOVED_LIST: 1000,   // จำนวนรายการที่ลบแล้วที่หน้าเกมอ่าน
  // สถิติการเล่น (อ่านได้เฉพาะเครื่องผู้พัฒนา)
  STATS: true,               // false = ไม่เก็บสถิติเลย
  KEEP_DAYS: 365,            // เก็บย้อนหลังกี่วัน แถวที่เก่ากว่านี้ถูกลบตอนผู้พัฒนาเปิดหน้าสถิติ
  UTC_OFFSET: 7,             // เขตเวลาที่ใช้แบ่งวัน (ไทย UTC+7)
  GAMES_PER_BROWSER: 80,     // เหตุการณ์เกมที่เบราว์เซอร์หนึ่งส่งได้ต่อวัน
  VISITS_PER_DAY: 20000,     // เพดานจำนวนคนเข้าต่อวัน กันตัวนับพองเพราะสแปม
  GAMES_PER_DAY: 3000,       // เพดานเหตุการณ์เกมทั้งเว็บต่อวัน
  TOP_CARDS: 15,             // จำนวนการ์ดยอดนิยมต่อชุดกฎที่หน้าสถิติแสดง
  // ตรวจหอเกียรติยศทุกคืน (รุ่น 7)
  NIGHTLY: true,             // false = ทริกเกอร์ทำงานแต่ไม่ตรวจอะไร
  NIGHTLY_GRACE_DAYS: 2,     // วันแรกหลังรุ่นนี้เริ่มใช้ บันทึกที่ไม่มีบันทึกการเดินถูกนำออกอย่างเดียว ไม่ระงับบัญชี
  // ข้อความที่บัญชีที่ถูกระงับเห็น ตอนส่งผล ตอนเขียนความคิดเห็น และบนหน้าหอเกียรติยศ
  BLOCK_NOTICE: 'ระบบตรวจพบว่ามีการใช้ AI และพยายามแทรกแซงระบบ ผลของบัญชีนี้ถูกนำออกจากหอเกียรติยศ และบัญชีถูกระงับจากหอเกียรติยศกับลานความคิดเห็น',
};
const SHEET = 'hof';
const HEAD = ['id', 'ts', 'by', 'score', 'margin', 'json'];
const CSHEET = 'cmt';
const CHEAD = ['id', 'ts', 'by', 'json'];
const RSHEET = 'removed';
const RHEAD = ['kind', 'id', 'ts', 'by'];
const ASHEET = 'hof-archive';
const AHEAD = ['month'].concat(HEAD);
// dates in Thai time (CONFIG.UTC_OFFSET): '2026-11-30' and the month '2026-11'
const dayStr = t => new Date(t + CONFIG.UTC_OFFSET * 3600e3).toISOString().slice(0, 10);
const monthStr = t => dayStr(t).slice(0, 7);
const listKey = () => 'list.' + monthStr(Date.now());

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.list === 'hof') return out(listCached());
  if (p.list === 'cmt') return out(listComments());
  if (p.list === 'removed') return out(listRemoved());
  return out({ ok: true, app: 'kirana-federation-hof', v: 7, month: monthStr(Date.now()), count: Math.max(0, sheet().getLastRow() - 1), reset: resetAt() });
}

function doPost(e) {
  let b;
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return out({ ok: false, err: 'json' }); }
  if (!b || typeof b !== 'object') return out({ ok: false, err: 'json' });
  if (b.action === 'session') return out(session(b));
  if (b.action === 'hof') return out(addRecord(b));
  if (b.action === 'cmt') return out(addComment(b));
  if (b.action === 'del') return out(removeEntry(b));
  if (b.action === 'ev') return out(addEvent(b));
  if (b.action === 'stats') return out(readStats(b));
  if (b.action === 'replay') return out(readReplay(b));
  if (b.action === 'hofLog') return out(readHofLog(b));
  if (b.action === 'reset') return out(resetHof(b));
  if (b.action === 'me') return out(readMe(b));
  if (b.action === 'unblock') return out(unblockAcct(b));
  return out({ ok: false, err: 'action' });
}

// ---------- who is sending: a Google sign-in (checked with Google) or the developer device ----------
function session(b) {
  let acct = null;
  if (typeof b.dev === 'string' && /^[0-9a-f]{64}$/.test(b.dev)) {
    if (hex(sha256(b.dev)) === CONFIG.DEV_HASH) acct = 'dev';
  } else if (typeof b.google === 'string' && b.google.length < 4096) {
    const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(b.google), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return { ok: false, err: 'token' };
    let t; try { t = JSON.parse(r.getContentText()); } catch (err) { return { ok: false, err: 'token' }; }
    if (!/^(https:\/\/)?accounts\.google\.com$/.test(t.iss || '')) return { ok: false, err: 'token' };
    if (CONFIG.GOOGLE_CLIENT_ID && t.aud !== CONFIG.GOOGLE_CLIENT_ID) return { ok: false, err: 'audience' };
    if (!(+t.exp * 1000 > Date.now()) || !t.sub) return { ok: false, err: 'token' };
    acct = hex(sha256('kirana-acct|' + t.sub)).slice(0, 16);
  }
  if (!acct) return { ok: false, err: 'auth' };
  const exp = Date.now() + CONFIG.SESSION_DAYS * 864e5;
  return { ok: true, session: signTicket(acct, exp), acct: acct, exp: exp };
}
function signTicket(acct, exp) { const body = 'v1.' + acct + '.' + exp; return body + '.' + Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret())); }
function checkTicket(t) {
  if (typeof t !== 'string') return null;
  const m = t.match(/^v1\.([0-9a-f]{16}|dev)\.(\d{10,16})\.([\w\-=]+)$/);
  if (!m || +m[2] < Date.now()) return null;
  return signTicket(m[1], m[2]) === t ? m[1] : null;
}
function secret() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SECRET', s); }
  return s;
}

// ---------- a winner's record: every field rebuilt, nothing taken as it came ----------
function addRecord(b) {
  const acct = checkTicket(b.session);
  if (!acct) return { ok: false, err: 'session' };
  // a blocked account sends no more records (version 7)
  const bl = blockedOf(acct);
  if (bl) return { ok: false, err: 'blocked', msg: CONFIG.BLOCK_NOTICE, at: bl.at };
  let rec;
  try { rec = cleanRecord(b.rec); } catch (err) { return { ok: false, err: 'record', msg: String(err && err.message || err) }; }
  // the move log that rides with the record (version 7) must be of this game: its seed, its table and a person's seat
  // of the winning state
  let log = '';
  if (typeof b.log === 'string' && b.log) {
    log = cleanLog(b.log);
    let o = null; try { o = log ? JSON.parse(log) : null; } catch (err) { o = null; }
    if (!logFits(o, rec)) return { ok: false, err: 'record', msg: 'บันทึกการเดินไม่ใช่ของเกมนี้' };
  }
  // the first win that comes with its log starts the clock of the nightly check: until the page of version 7 is up, no
  // record carries a log and nothing is checked, whichever of the page and the script went up first
  if (log) logRuleFrom(true);
  rec.by = acct; rec.via = 'auto';
  // the record is dated by the script's clock, in Thai time: the month it counts in is the month it arrived; t keeps the
  // moment, so a reset of the hall (version 6) can tell a record made after it from one made earlier the same day
  rec.at = dayStr(Date.now());
  rec.t = Date.now();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    rollHof(true);
    // a record the developer removed stays out, even when the winner's page sends it again
    if (isRemoved('hof', rec.id)) return { ok: true, removed: true };
    const sh = sheet();
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues() : [];
    const key = 'r:' + rec.id;
    if (rows.some(r => r[0] === key)) {
      if (log && !hofLogIds().has(rec.id)) storeHofLog(rec, acct, log);   // a second send that brings the log
      return { ok: true, dup: true, rank: rankIn(rows, rec.id), total: rows.length };
    }
    // a win that already stood in the hall of a month before does not come back for the new month
    if (archivedKeys().has(key)) return { ok: true, dup: true, old: true };
    const dayAgo = Date.now() - 864e5;
    if (rows.filter(r => r[2] === 'u:' + acct && +r[1] > dayAgo).length >= CONFIG.MAX_PER_DAY) return { ok: false, err: 'limit' };
    const row = [key, Date.now(), 'u:' + acct, rec.score, rec.margin, JSON.stringify(rec)];
    sh.appendRow(row);
    if (log) storeHofLog(rec, acct, log);
    CacheService.getScriptCache().remove(listKey());
    rows.push(row);
    return { ok: true, rank: rankIn(rows, rec.id), total: rows.length };
  } finally { lock.releaseLock(); }
}
// the rules of the hall (ruled 11 Nov 2026): a win against AI counts only at a table of 4 states and not against the easy
// level; winners who beat the hard AI rank first, then everyone by net score. A solo game, or an online game whose record
// carries the level of its AI seats, is a game against AI; an online game of people only keeps its place by score
const hofVsAI = r => r.mode !== 'online' || r.lvl != null;
const hofOk = r => !hofVsAI(r) || (r.n === 4 && r.lvl !== 'easy');
const hofTier = r => r.lvl === 'hard' ? 0 : 1;
const hofOrder = (a, b) => hofTier(a) - hofTier(b) || b.score - a.score || b.margin - a.margin;
function rowRec(r) { try { return JSON.parse(r[5]); } catch (err) { return null; } }
function rankIn(rows, id) {
  const recs = rows.map(rowRec).filter(x => x && x.id && hofOk(x)).sort(hofOrder);
  return recs.findIndex(x => x.id === id) + 1;
}
const str = (x, n) => (typeof x === 'string' ? x : '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi ? x : 0;
const okImg = (x, n) => typeof x === 'string' && x.length < n && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(x);
function cleanRecord(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('ไม่ใช่บันทึก');
  if (typeof d.id !== 'string' || !/^[a-z0-9]{1,16}$/.test(d.id)) throw new Error('รหัสบันทึกไม่ถูกต้อง');
  if (!Number.isInteger(d.score) || Math.abs(d.score) > 300) throw new Error('คะแนนไม่ถูกต้อง');
  const r = d.research || {}, st = d.style || {};
  const rec = {
    v: 1, id: d.id, at: str(d.at, 10), mode: d.mode === 'online' ? 'online' : 'solo', rules: str(d.rules, 8), n: int(d.n, 3, 4) || 4, seed: int(d.seed, 0, 4294967295),
    leader: str(d.leader, 24) || 'ผู้เล่น', title: str(d.title, 32), traits: (Array.isArray(d.traits) ? d.traits : []).slice(0, 3).map(x => str(x, 24)).filter(Boolean),
    state: str(d.state, 24) || 'รัฐไร้นาม', latin: str(d.latin, 24), meaning: str(d.meaning, 60),
    color: /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#888888',
    flag: d.flag && okImg(d.flag.img, 9000) ? { img: d.flag.img } : { seed: int(d.flag && d.flag.seed, 0, 4294967295) || 1 },
    score: d.score, legit: int(d.legit, -300, 300), stigma: int(d.stigma, 0, 300), grav: int(d.grav, 0, 9999),
    research: { culture: int(r.culture, 0, 99), innovation: int(r.innovation, 0, 99), building: int(r.building, 0, 99) },
    military: int(d.military, 0, 200), projects: int(d.projects, 0, 60),
    style: { label: str(st.label, 40), desc: str(st.desc, 160), key: str(st.key, 24) },
    margin: int(d.margin, -300, 300),
    opp: (Array.isArray(d.opp) ? d.opp : []).slice(0, 3).map(o => ({ state: str(o && o.state, 24), score: int(o && o.score, -300, 300), ai: !!(o && o.ai) })),
  };
  if (['easy', 'normal', 'hard'].indexOf(d.lvl) >= 0) rec.lvl = d.lvl;
  // the id the statistics gave this game (version 6): the developer's audit finds its move log by it
  const gid = typeof d.gid === 'string' && /^[a-z0-9]{6,32}$/.test(d.gid) ? d.gid : '';
  if (gid) rec.gid = gid;
  if (!hofOk(rec)) throw new Error('เกมกับ AI ขึ้นหอได้เฉพาะโต๊ะ 4 รัฐที่ AI ระดับปกติหรือยาก');
  if (rec.legit - rec.stigma !== rec.score) throw new Error('คะแนนสุทธิไม่ตรงกับความชอบธรรมลบตราบาป');
  if (rec.opp.length !== rec.n - 1) throw new Error('จำนวนคู่แข่งไม่ตรงกับจำนวนรัฐ');
  if (rec.opp.some(o => o.score > rec.score)) throw new Error('ผู้ชนะต้องมีคะแนนไม่น้อยกว่าคู่แข่ง');
  return rec;
}

// ---------- comments: posted by a signed-in player, shown to everyone at once ----------
function addComment(b) {
  const acct = checkTicket(b.session);
  if (!acct) return { ok: false, err: 'session' };
  const bl = blockedOf(acct);
  if (bl) return { ok: false, err: 'blocked', msg: CONFIG.BLOCK_NOTICE, at: bl.at };
  let c;
  try { c = cleanComment(b.cmt); } catch (err) { return { ok: false, err: 'comment', msg: String(err && err.message || err) }; }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (isRemoved('cmt', c.id)) return { ok: true, removed: true };
    const sh = cmtSheet();
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, CHEAD.length).getValues() : [];
    const key = 'c:' + c.id;
    if (rows.some(r => r[0] === key)) return { ok: true, dup: true };
    const dayAgo = Date.now() - 864e5;
    if (rows.filter(r => r[2] === 'u:' + acct && +r[1] > dayAgo).length >= CONFIG.MAX_CMT_PER_DAY) return { ok: false, err: 'limit' };
    // the time comes from the script, so nobody can date a comment ahead to keep it on top; the author tag too,
    // so the star average counts one rating per account. The tag is keyed with the script's secret: nobody can
    // work it out from the account id that the hall of fame records carry, so comments and records stay unlinked
    c.at = new Date(Date.now()).toISOString().slice(0, 23).replace('T', ' ');
    c.by = hex(Utilities.computeHmacSha256Signature('cmt|' + acct, secret())).slice(0, 12);
    sh.appendRow([key, Date.now(), 'u:' + acct, JSON.stringify(c)]);
    CacheService.getScriptCache().remove('clist');
    return { ok: true, at: c.at, by: c.by };
  } finally { lock.releaseLock(); }
}
function cleanComment(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('ไม่ใช่ความคิดเห็น');
  if (typeof d.id !== 'string' || !/^[a-z0-9]{1,16}$/.test(d.id)) throw new Error('รหัสความคิดเห็นไม่ถูกต้อง');
  const text = str(d.text, 280).trim();
  if (!text) throw new Error('ความคิดเห็นว่าง');
  const c = { id: d.id, leader: str(d.leader, 24) || 'ผู้เล่น', title: str(d.title, 32), state: str(d.state, 24), text, at: '', by: '' };
  if (Number.isInteger(d.stars) && d.stars >= 1 && d.stars <= 5) c.stars = d.stars;
  return c;
}
function listComments() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('clist');
  if (hit) return JSON.parse(hit);
  const sh = cmtSheet();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, CHEAD.length).getValues() : [];
  const list = [];
  for (const r of rows) { try { const c = JSON.parse(r[3]); if (c && c.id) list.push(c); } catch (err) { /* a row edited by hand */ } }
  list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const top = list.slice(0, CONFIG.CMT_LIST);
  const text = JSON.stringify(top);
  if (text.length < 95000) cache.put('clist', text, 60);
  return top;
}

// ---------- the developer removes a record or a comment; every page hides it from then on ----------
function removeEntry(b) {
  const acct = checkTicket(b.session);
  if (!acct) return { ok: false, err: 'session' };
  if (acct !== 'dev') return { ok: false, err: 'forbidden' };
  const kind = b.kind === 'hof' || b.kind === 'cmt' ? b.kind : '';
  if (!kind || typeof b.id !== 'string' || !/^[a-z0-9]{1,16}$/.test(b.id)) return { ok: false, err: 'id' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = kind === 'hof' ? sheet() : cmtSheet();
    const key = (kind === 'hof' ? 'r:' : 'c:') + b.id;
    let deleted = 0;
    const last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = ids.length - 1; i >= 0; i--) if (ids[i][0] === key) { sh.deleteRow(i + 2); deleted++; }
    }
    if (!isRemoved(kind, b.id)) removedSheet().appendRow([kind, b.id, Date.now(), acct]);
    const cache = CacheService.getScriptCache();
    [listKey(), 'clist', 'rlist'].forEach(k => cache.remove(k));
    return { ok: true, deleted: deleted };
  } finally { lock.releaseLock(); }
}
function removedRows() {
  const sh = removedSheet();
  return sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, RHEAD.length).getValues() : [];
}
function isRemoved(kind, id) { return removedRows().some(r => r[0] === kind && r[1] === id); }
function listRemoved() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('rlist');
  if (hit) return JSON.parse(hit);
  const list = removedRows().slice(-CONFIG.REMOVED_LIST).map(r => ({ k: String(r[0]), id: String(r[1]) }));
  const text = JSON.stringify(list);
  if (text.length < 95000) cache.put('rlist', text, 60);
  return list;
}

// ---------- the list the game reads: the month that runs, Thai time ----------
function listCached() {
  rollHof(false);
  const cache = CacheService.getScriptCache(), key = listKey(), month = monthStr(Date.now());
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const sh = sheet();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues() : [];
  const list = [];
  // rows saved before the rules of 11 Nov stay in the sheet; the list leaves out the ones the rules no longer count, and
  // a row of another month waits there only if the move into the archive could not run yet
  for (const r of rows) { const rec = rowRec(r); if (rec && rec.id && hofOk(rec) && rowMonth(r) === month) list.push(rec); }
  list.sort(hofOrder);
  const top = list.slice(0, CONFIG.LIST_SIZE);
  const text = JSON.stringify(top);
  if (text.length < 95000) cache.put(key, text, 60);
  return top;
}
// ---------- the hall starts again on the 1st of every month, Thai time (ruled 11 Nov 2026) ----------
// The first call of a new month moves the rows of the months before from "hof" to the end of "hof-archive", each with its
// month in front, in one write, and "hof" keeps the month that runs. Nothing is deleted: the owner reads every past month
// in the archive. A row's month comes from the time the script saved it (a row typed by hand without one: its date);
// a row with neither stays where it is
function rowMonth(r) {
  const t = +r[1];
  if (isFinite(t) && t > 0) return monthStr(t);
  const rec = rowRec(r);
  return rec && typeof rec.at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rec.at) ? rec.at.slice(0, 7) : '';
}
function rollHof(locked) {
  const props = PropertiesService.getScriptProperties(), month = monthStr(Date.now());
  if (props.getProperty('HOF_MONTH') === month) return;
  const lock = locked ? null : LockService.getScriptLock();
  if (lock) { try { lock.waitLock(15000); } catch (err) { return; } }   // busy: the list still shows this month only
  try {
    if (props.getProperty('HOF_MONTH') === month) return;
    const sh = sheet(), last = sh.getLastRow();
    if (last > 1) {
      const rows = sh.getRange(2, 1, last - 1, HEAD.length).getValues(), keep = [], old = [];
      for (const r of rows) { const m = rowMonth(r); (m && m < month ? old : keep).push(r); }
      if (old.length) {
        const ar = archiveSheet(), at = ar.getLastRow() + 1, need = at + old.length - 1 - ar.getMaxRows();
        if (need > 0) ar.insertRowsAfter(ar.getMaxRows(), need);
        ar.getRange(at, 1, old.length, AHEAD.length).setValues(old.map(r => [rowMonth(r)].concat(r)));
        sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
        if (keep.length) sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep);
      }
    }
    props.setProperty('HOF_MONTH', month);
    CacheService.getScriptCache().remove(listKey());
  } finally { if (lock) lock.releaseLock(); }
}
function archiveSheet() { return sheetNamed(ASHEET, AHEAD); }
// ---------- the developer resets the whole hall (version 6, ruled 15 Nov 2026) ----------
// Every row of "hof" moves to the end of "hof-archive" in one write, its first cell naming its month and the day of the
// reset, so nothing is deleted and a win of before cannot be sent into the hall again (archivedKeys). The time of the
// reset goes into the script properties, every page reads it from doGet and hides any record made before it, whatever
// source it came from (this browser, peers online, the repository file). Comments stay. b.confirm must say 'reset'
function resetAt() { return +(PropertiesService.getScriptProperties().getProperty('HOF_RESET') || 0) || 0; }
function resetHof(b) {
  const acct = checkTicket(b.session);
  if (!acct) return { ok: false, err: 'session' };
  if (acct !== 'dev') return { ok: false, err: 'forbidden' };
  if (b.confirm !== 'reset') return { ok: false, err: 'confirm' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const now = Date.now(), sh = sheet(), last = sh.getLastRow();
    let moved = 0;
    if (last > 1) {
      const rows = sh.getRange(2, 1, last - 1, HEAD.length).getValues().filter(r => r.some(x => x !== '' && x != null));
      if (rows.length) {
        const ar = archiveSheet(), at = ar.getLastRow() + 1, need = at + rows.length - 1 - ar.getMaxRows();
        if (need > 0) ar.insertRowsAfter(ar.getMaxRows(), need);
        ar.getRange(at, 1, rows.length, AHEAD.length).setValues(rows.map(r => [(rowMonth(r) || '-') + ' รีเซ็ต ' + dayStr(now)].concat(r)));
      }
      sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
      moved = rows.length;
    }
    PropertiesService.getScriptProperties().setProperty('HOF_RESET', String(now));
    CacheService.getScriptCache().remove(listKey());
    return { ok: true, moved: moved, reset: now };
  } finally { lock.releaseLock(); }
}
function archivedKeys() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), ar = ss.getSheetByName(ASHEET);
  if (!ar || ar.getLastRow() < 2) return new Set();
  return new Set(ar.getRange(2, 2, ar.getLastRow() - 1, 1).getValues().map(r => r[0]));
}
// ---------- play statistics: visitors per day, games and their move logs, for the developer's eyes only ----------
// Visitors are counts per day and nothing else: a page sends one signal a day, the script adds one to that day's
// visitors (members and guests apart) and writes no list of visits; the browser id only keeps the same browser from
// being counted twice the same day, in the script cache for a few hours. Each game's start, end or quit is a row
// with its settings, its result and its move log (the seed and the human answers, enough to rebuild the whole game);
// a random id names the browser and a member's ticket adds the hashed account id. doGet serves none of this: only a
// ticket of the developer device reads it, through the actions stats and replay
const DSHEET = 'daily';
const DHEAD = ['day', 'visitors', 'members', 'guests', 'dev'];
const GSHEET = 'games';
const GHEAD = ['ts', 'day', 'gid', 'ev', 'vid', 'sid', 'who', 'acct', 'mode', 'rules', 'n', 'humans', 'level', 'round', 'minutes', 'result', 'cards', 'loglen', 'log1', 'log2', 'log3', 'log4'];
const GCOLS = 18;                // the columns read for the summary (everything before the log)
const LOG_COL = 19;              // the first log column
const LOG_CELL = 45000;          // a sheet cell holds up to 50,000 characters
const LOG_MAX = 4 * LOG_CELL;
const idOf = (x, lo, hi) => typeof x === 'string' && x.length >= lo && x.length <= hi && /^[a-z0-9]+$/.test(x) ? x : '';
const word = (x, n) => typeof x === 'string' && /^[0-9A-Za-z._-]{1,16}$/.test(x) ? x.slice(0, n) : '';
const numIn = (x, lo, hi) => typeof x === 'number' && isFinite(x) ? Math.round(Math.min(hi, Math.max(lo, x)) * 10) / 10 : 0;
// days are numbers like 20261110 in the developer's time zone (a text date would turn into a date cell)
const dayNum = t => +new Date(t + CONFIG.UTC_OFFSET * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
function addEvent(b) {
  if (!CONFIG.STATS) return { ok: true, off: true };
  const vid = idOf(b.vid, 8, 24), sid = idOf(b.sid, 6, 24);
  const kind = b.type === 'visit' ? 'v' : b.type === 'game' ? 'g' : '';
  if (!vid || !kind || (kind === 'g' && !sid)) return { ok: false, err: 'event' };
  // the server decides who sent it: a valid ticket makes a member (or the developer), anything else is a guest
  const t = b.session ? checkTicket(b.session) : null;
  const who = t === 'dev' ? 'dev' : t ? 'member' : 'guest', acct = t === 'dev' ? 'dev' : t ? 'u:' + t : '';
  const now = Date.now(), day = dayNum(now);
  if (kind === 'v') return countVisit(vid, who, day);
  let row;
  {
    const ev = ['start', 'end', 'quit'].indexOf(b.ev) >= 0 ? b.ev : '';
    const gid = idOf(b.gid, 6, 32), mode = ['solo', 'online', 'tutorial'].indexOf(b.mode) >= 0 ? b.mode : '';
    if (!ev || !gid || !mode) return { ok: false, err: 'event' };
    const log = ev === 'start' ? '' : cleanLog(b.log);
    row = [now, day, gid, ev, vid, sid, who, acct, mode, word(b.rules, 8), int(b.n, 3, 4) || '', int(b.humans, 0, 4), word(b.level, 8), int(b.round, 0, 30),
      numIn(b.minutes, 0, 1440), ev === 'start' ? '' : JSON.stringify(cleanResult(b.result)), ev === 'start' ? '' : JSON.stringify(cleanCards(b.cards)), log.length];
    // a leading mark keeps a cut of the log from being read as a number or a formula
    for (let i = 0; i < 4; i++) { const part = log.slice(i * LOG_CELL, (i + 1) * LOG_CELL); row.push(part ? '~' + part : ''); }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // floods stop at a cap per browser and a cap for the whole site, per day (counted in the script cache, roughly)
    const cache = CacheService.getScriptCache();
    const k1 = 'g:' + day + ':' + vid, k2 = 'g:' + day;
    const n1 = +(cache.get(k1) || 0), n2 = +(cache.get(k2) || 0);
    if (n1 >= CONFIG.GAMES_PER_BROWSER || n2 >= CONFIG.GAMES_PER_DAY) return { ok: false, err: 'limit' };
    cache.put(k1, String(n1 + 1), 21600); cache.put(k2, String(n2 + 1), 21600);
    gameSheet().appendRow(row);
    return { ok: true };
  } finally { lock.releaseLock(); }
}
// one more visitor today, counted once per browser: the day's row holds the totals and nothing names a visitor
function countVisit(vid, who, day) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const cache = CacheService.getScriptCache(), seen = 'seen:' + day + ':' + vid;
    if (cache.get(seen)) return { ok: true, dup: true };
    const sh = dailySheet(), last = sh.getLastRow();
    let r = 0;
    if (last > 1 && +sh.getRange(last, 1, 1, 1).getValues()[0][0] === day) r = last;
    if (!r) { sh.appendRow([day, 0, 0, 0, 0]); r = sh.getLastRow(); }
    const c = sh.getRange(r, 1, 1, 5).getValues()[0].map(x => +x || 0);
    if (who !== 'dev' && c[1] >= CONFIG.VISITS_PER_DAY) return { ok: false, err: 'limit' };
    cache.put(seen, '1', 21600);
    sh.getRange(r, 1, 1, 5).setValues([[day, c[1] + (who === 'dev' ? 0 : 1), c[2] + (who === 'member' ? 1 : 0), c[3] + (who === 'guest' ? 1 : 0), c[4] + (who === 'dev' ? 1 : 0)]]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}
function cleanResult(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return {};
  const o = { won: r.won === true, rank: int(r.rank, 1, 4) };
  if (Array.isArray(r.scores)) o.scores = r.scores.slice(0, 4).map(x => {
    x = x && typeof x === 'object' ? x : {};
    return { state: str(x.state, 24), score: Number.isInteger(x.score) && Math.abs(x.score) < 500 ? x.score : 0, human: x.human === true, me: x.me === true, lvl: word(x.lvl, 8) };
  });
  return o;
}
// the cards the states of one game took: research cards (culture, innovation, buildings) and military cards recruited
// from the reform decks, each name with [taken by players, taken by AI]
function cleanCards(c) {
  const o = { r: {}, m: {} };
  if (!c || typeof c !== 'object') return o;
  for (const k of ['r', 'm']) {
    const src = c[k] && typeof c[k] === 'object' && !Array.isArray(c[k]) ? c[k] : {};
    for (const name of Object.keys(src).slice(0, 150)) {
      const v = src[name], n = str(name, 40).trim();
      if (!n || !Array.isArray(v)) continue;
      o[k][n] = [int(v[0], 0, 99), int(v[1], 0, 99)];
    }
  }
  return o;
}
// the move log: {v, cfg, log, takeover}, rebuilt so nothing else rides along; too long or broken leaves it out
function cleanLog(x) {
  if (typeof x !== 'string' || !x || x.length > LOG_MAX) return '';
  let o; try { o = JSON.parse(x); } catch (err) { return ''; }
  if (!o || typeof o !== 'object' || !o.cfg || typeof o.cfg !== 'object' || !Array.isArray(o.log)) return '';
  const s = JSON.stringify({ v: 1, cfg: o.cfg, log: o.log, takeover: o.takeover && typeof o.takeover === 'object' ? o.takeover : {} });
  return s.length <= LOG_MAX ? s : '';
}
function rowsOf(sh, cols) { const last = sh.getLastRow(); return last > 1 ? sh.getRange(2, 1, last - 1, cols).getValues() : []; }
// game rows older than KEEP_DAYS go when the developer opens the statistics (rows are in time order); the daily
// visitor totals name nobody and stay
function trimOld() {
  const cut = dayNum(Date.now() - CONFIG.KEEP_DAYS * 864e5);
  const sh = gameSheet(), last = sh.getLastRow(); if (last < 2) return;
  const days = sh.getRange(2, 2, last - 1, 1).getValues();
  let k = 0; while (k < days.length && +days[k][0] < cut) k++;
  if (k) sh.deleteRows(2, k);
}
function readStats(b) {
  if (checkTicket(b.session) !== 'dev') return { ok: false, err: 'forbidden' };
  const days = int(b.days, 1, 400) || 30;
  trimOld();
  const since = dayNum(Date.now() - (days - 1) * 864e5);
  const Dy = rowsOf(dailySheet(), 5).filter(r => +r[0] >= since);
  const Gm = rowsOf(gameSheet(), GCOLS).filter(r => +r[1] >= since);
  const byDay = {};
  const dayRow = d => byDay[d] || (byDay[d] = { day: d, visitors: 0, members: 0, guests: 0, starts: 0, ends: 0, quits: 0 });
  let devVisits = 0;
  for (const r of Dy) { const d = dayRow(+r[0]); d.visitors += +r[1] || 0; d.members += +r[2] || 0; d.guests += +r[3] || 0; devVisits += +r[4] || 0; }
  const modes = {}, rules = {}, started = {}, ended = {}, quit = {}, finM = {}, finG = {};
  let endMinutes = 0, endN = 0, wins = 0, devGames = 0;
  for (const r of Gm) {
    if (r[6] === 'dev') { devGames++; continue; }
    const ev = r[3], m = modes[r[8]] || (modes[r[8]] = { start: 0, end: 0, quit: 0, won: 0 });
    m[ev] = (m[ev] || 0) + 1;
    const d = dayRow(+r[1]); if (ev === 'start') d.starts++; else if (ev === 'end') d.ends++; else d.quits++;
    if (ev === 'start') started[r[2]] = 1;
    if (ev === 'quit') quit[r[2]] = 1;
    if (ev === 'end') {
      ended[r[2]] = 1; endMinutes += +r[14] || 0; endN++;
      if (r[6] === 'member') finM[r[7]] = 1; else finG[r[4]] = 1;   // who finished: accounts and guest browsers
      const k = String(r[9]); rules[k] = (rules[k] || 0) + 1;
      let res = {}; try { res = JSON.parse(r[15] || '{}'); } catch (err) { /* a row edited by hand */ }
      if (res.won) { wins++; m.won++; }
    }
  }
  const recent = Gm.slice(-150).reverse().map(r => {
    let res = null; try { res = r[15] ? JSON.parse(r[15]) : null; } catch (err) { /* a row edited by hand */ }
    return { ts: +r[0], gid: String(r[2]), ev: r[3], vid: String(r[4]).slice(0, 6), who: r[6], acct: String(r[7]).slice(0, 8), mode: r[8], rules: String(r[9]), n: +r[10] || 0,
      humans: +r[11] || 0, level: String(r[12]), round: +r[13] || 0, minutes: +r[14] || 0, result: res, log: +r[17] > 0 };
  });
  // the cards each patch's finished games used most: one report per game (an online game reported by several players
  // counts once), summed per rule set
  const lastOf = {};
  for (const r of Gm) if (r[6] !== 'dev' && r[3] === 'end') lastOf[r[2]] = r;
  const byRules = {};
  for (const r of Object.keys(lastOf).map(k => lastOf[k])) {
    let c = null; try { c = r[16] ? JSON.parse(r[16]) : null; } catch (err) { /* a row edited by hand */ }
    if (!c) continue;
    const k = String(r[9]), t = byRules[k] || (byRules[k] = { games: 0, r: {}, m: {} });
    t.games++;
    for (const kind of ['r', 'm']) for (const name of Object.keys(c[kind] || {})) {
      const v = c[kind][name], a = t[kind][name] || (t[kind][name] = [0, 0]);
      a[0] += +v[0] || 0; a[1] += +v[1] || 0;
    }
  }
  const topOf = o => Object.keys(o).map(n => [n, o[n][0], o[n][1]]).sort((x, y) => (y[1] + y[2]) - (x[1] + x[2]) || y[1] - x[1]).slice(0, CONFIG.TOP_CARDS);
  const cards = {};
  for (const k of Object.keys(byRules)) cards[k] = { games: byRules[k].games, research: topOf(byRules[k].r), military: topOf(byRules[k].m) };
  const finished = Object.keys(ended).length, begun = Object.keys(started).length;
  const list = Object.keys(byDay).sort().map(k => byDay[k]);
  const counted = list.filter(d => d.visitors > 0), today = byDay[dayNum(Date.now())];
  const top = counted.reduce((a, d) => (!a || d.visitors > a.visitors ? d : a), null);
  const total = counted.reduce((s, d) => s + d.visitors, 0);
  return {
    ok: true, days: days, since: since,
    visitors: { today: today ? today.visitors : 0, avg: counted.length ? Math.round(total / counted.length * 10) / 10 : 0, top: top ? top.visitors : 0, topDay: top ? top.day : 0,
      total: total, members: counted.reduce((s, d) => s + d.members, 0), guests: counted.reduce((s, d) => s + d.guests, 0), daysCounted: counted.length, dev: devVisits },
    games: { started: begun, ended: finished, quit: Object.keys(quit).filter(g => !ended[g]).length, finishRate: begun ? Math.round(Object.keys(started).filter(g => ended[g]).length / begun * 1000) / 1000 : 0,
      avgMinutes: endN ? Math.round(endMinutes / endN * 10) / 10 : 0, wins: wins, ends: endN, modes: modes, rules: rules, dev: devGames,
      finishers: { members: Object.keys(finM).length, guests: Object.keys(finG).length } },
    byDay: list,
    recent: recent,
    cards: cards,
    nightly: { last: nightlyLast(), from: logRuleFrom(),
      blocked: rowsOf(blockedSheet(), BHEAD.length).map(r => ({ by: String(r[0]), at: +r[1] || 0, reason: String(r[2] || ''), id: String(r[3] || ''), state: String(r[4] || ''), score: +r[5] || 0 })).reverse().slice(0, 100) },
  };
}
function readReplay(b) {
  if (checkTicket(b.session) !== 'dev') return { ok: false, err: 'forbidden' };
  const gid = idOf(b.gid, 6, 32), ts = Number(b.ts) || 0;
  const sh = gameSheet(), last = sh.getLastRow();
  if (!gid || last < 2) return { ok: false, err: 'id' };
  const keys = sh.getRange(2, 1, last - 1, 4).getValues();
  for (let i = keys.length - 1; i >= 0; i--) {
    if (String(keys[i][2]) !== gid || keys[i][3] === 'start' || (ts && +keys[i][0] !== ts)) continue;
    const cells = sh.getRange(i + 2, LOG_COL, 1, 4).getValues()[0];
    const log = cells.map(c => String(c || '').replace(/^~/, '')).join('');
    return log ? { ok: true, log: log } : { ok: false, err: 'nolog' };
  }
  return { ok: false, err: 'id' };
}
// the move log of the game a hall of fame record came from (version 6), for the developer's audit: see findLogFor. None:
// err 'nolog'. Version 7 also takes the record's id, to find the log that rode with it
function readHofLog(b) {
  if (checkTicket(b.session) !== 'dev') return { ok: false, err: 'forbidden' };
  const q = b.rec && typeof b.rec === 'object' ? b.rec : {};
  const rec = { id: idOf(q.id, 1, 16), gid: idOf(q.gid, 6, 32), seed: Number.isInteger(q.seed) && q.seed >= 0 ? q.seed : -1, state: str(q.state, 24),
    score: Number.isInteger(q.score) ? q.score : null, rules: word(q.rules, 8), n: int(q.n, 3, 4) };
  if (rec.seed < 0 || (!rec.id && !rec.gid && (!rec.state || rec.score == null))) return { ok: false, err: 'id' };
  // loose: the game the record names comes back even when its winning state is not at that table, so the replay on the
  // developer device can say the record does not match its game (the nightly check counts such a record as one without a log)
  const f = findLogFor(rec, null, true);
  return f ? { ok: true, log: f.log, gid: f.gid, ts: f.ts } : { ok: false, err: 'nolog' };
}

// ---------- every night (version 7, ruled 16 Nov 2026): a record with no move log leaves the hall ----------
// The page sends the game's move log with every win it puts in the hall; the script keeps it in "hof-logs" beside the
// record. A daily trigger runs nightlyHofCheck between midnight and one in the morning: a record that came in since the
// first win came with its log and has no move log anywhere (beside it, or among the finished games of the statistics) leaves the
// hall for "hof-flagged", the "removed" list hides it on every page, and its account is blocked: no more records, no
// comments, every other record of it leaves the hall too, and the player reads CONFIG.BLOCK_NOTICE. In the first
// NIGHTLY_GRACE_DAYS a record without a log only leaves: a page opened before the update sends its win without one.
// A record that the monthly roll moved to "hof-archive" before the trigger ran is checked there, once.
// The developer device unblocks an account from the statistics page, or the owner deletes its row in "blocked".
const LSHEET = 'hof-logs';
const LHEAD = ['id', 'ts', 'by', 'gid', 'seed', 'loglen', 'log1', 'log2', 'log3', 'log4'];
const BSHEET = 'blocked';
const BHEAD = ['by', 'ts', 'reason', 'id', 'state', 'score'];
const FSHEET = 'hof-flagged';
const FHEAD = ['ts', 'reason', 'by', 'id', 'json'];
function hofLogSheet() { return sheetNamed(LSHEET, LHEAD); }
function blockedSheet() { return sheetNamed(BSHEET, BHEAD); }
function flaggedSheet() { return sheetNamed(FSHEET, FHEAD); }
// the moment the first win came with its log (start = set it now if it is not set): a record older than it came
// without its log and is left alone. 0 = no win has come with its log yet
function logRuleFrom(start) {
  const props = PropertiesService.getScriptProperties();
  let t = +(props.getProperty('LOG_RULE_FROM') || 0) || 0;
  if (!t && start) { t = Date.now(); props.setProperty('LOG_RULE_FROM', String(t)); }
  return t;
}
// the account's block, if any (the developer device is never blocked)
function blockedOf(acct) {
  if (!acct || acct === 'dev') return null;
  const key = 'u:' + acct;
  const r = rowsOf(blockedSheet(), BHEAD.length).find(x => x[0] === key);
  return r ? { at: +r[1] || 0, reason: String(r[2] || '') } : null;
}
// a move log belongs to a record when its seed, its rule set, its table size and a person's seat of the record's state
// all match
function logFits(o, rec) {
  if (!o || !o.cfg || typeof o.cfg !== 'object' || !Array.isArray(o.cfg.seats) || !Array.isArray(o.log)) return false;
  if ((Number(o.cfg.seed) >>> 0) !== rec.seed) return false;
  if (rec.rules && String(o.cfg.rules || '') !== rec.rules) return false;
  if (rec.n && o.cfg.seats.length !== rec.n) return false;
  return o.cfg.seats.some(x => x && x.human === true && str(String(x.name || ''), 24) === rec.state);
}
function storeHofLog(rec, acct, log) {
  const row = [rec.id, Date.now(), 'u:' + acct, rec.gid || '', rec.seed, log.length];
  for (let i = 0; i < 4; i++) { const part = log.slice(i * LOG_CELL, (i + 1) * LOG_CELL); row.push(part ? '~' + part : ''); }
  hofLogSheet().appendRow(row);
}
function hofLogIds() { return new Set(rowsOf(hofLogSheet(), 1).map(r => String(r[0]))); }
// the move log of a record's game: the one that rode with the record first, then the finished games of the statistics,
// by the game id the record carries, else by rule set, table size, a person's state and score. The log must fit the
// record (loose: a log of the statistics with the record's seed is enough, as in version 6, for the developer's replay).
// cache: rows read once for a night of many records
function findLogFor(rec, cache, loose) {
  cache = cache || {};
  const ls = hofLogSheet(), lrows = cache.lrows || (cache.lrows = rowsOf(ls, 1));
  if (rec.id) for (let i = lrows.length - 1; i >= 0; i--) {
    if (String(lrows[i][0]) !== rec.id) continue;
    const log = ls.getRange(i + 2, 7, 1, 4).getValues()[0].map(c => String(c || '').replace(/^~/, '')).join('');
    let o = null; try { o = JSON.parse(log); } catch (err) { /* a cut log */ }
    if (logFits(o, rec)) return { log: log, gid: String(o.cfg.gid || rec.gid || ''), ts: 0, src: 'hof' };
  }
  const gs = gameSheet(), rows = cache.grows || (cache.grows = rowsOf(gs, GCOLS));
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r[3] !== 'end' || !(+r[17] > 0)) continue;
    if (rec.gid) { if (String(r[2]) !== rec.gid) continue; }
    else {
      if ((rec.rules && String(r[9]) !== rec.rules) || (rec.n && +r[10] !== rec.n)) continue;
      let res = null; try { res = JSON.parse(r[15] || '{}'); } catch (err) { /* a row edited by hand */ }
      if (!res || !Array.isArray(res.scores) || !res.scores.some(x => x.human && x.state === rec.state && x.score === rec.score)) continue;
    }
    const log = gs.getRange(i + 2, LOG_COL, 1, 4).getValues()[0].map(c => String(c || '').replace(/^~/, '')).join('');
    let o = null; try { o = JSON.parse(log); } catch (err) { /* a cut log */ }
    if (!logFits(o, rec) && !(loose && o && o.cfg && (Number(o.cfg.seed) >>> 0) === rec.seed)) continue;
    return { log: log, gid: String(r[2]), ts: +r[0], src: 'games' };
  }
  return null;
}
// the nightly check; a daily trigger calls it (see the head of this file). Returns what it did, and keeps it for the
// statistics page
function nightlyHofCheck() {
  if (CONFIG.NIGHTLY === false) return { ok: true, off: true };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    rollHof(true);
    const now = Date.now(), from = logRuleFrom(), graceEnd = from + CONFIG.NIGHTLY_GRACE_DAYS * 864e5;
    if (!from) {   // no win has come with its log: the page of this version is not up yet, nothing to check against
      const wait = { at: now, from: 0, checked: 0, removed: 0, blocked: 0, waiting: true };
      PropertiesService.getScriptProperties().setProperty('NIGHTLY_LAST', JSON.stringify(wait));
      return wait;
    }
    const sh = sheet(), last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2, 1, last - 1, HEAD.length).getValues().filter(r => r.some(x => x !== '' && x != null)) : [];
    // the records that the monthly roll (or a reset) moved to "hof-archive" since the last night are checked once where
    // they lie, or a win sent on the last day of a month would leave the hall at midnight unchecked. They stay in the
    // archive, which no page reads; one without a log is flagged, hidden on every page and blocks its account the same
    const prev = nightlyLast(), since = Math.max(from, prev && +prev.at || 0);
    const ar = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ASHEET), alast = ar ? ar.getLastRow() : 0;
    const arch = alast > 1 ? ar.getRange(2, 2, alast - 1, HEAD.length).getValues().filter(r => +r[1] >= since) : [];
    const cache = {}, drop = new Map(), adrop = new Map(), blocks = new Map();
    let checked = 0;
    const check = (r, i, into, tag) => {
      const t = +r[1], rec = rowRec(r);
      if (!rec || !rec.id || !(t >= from)) return;
      checked++;
      if (findLogFor(rec, cache)) return;
      // after the grace days the account is blocked too; the developer device never is
      const by = String(r[2] || ''), late = t >= graceEnd;
      into.set(i, (late ? 'nolog' : 'nolog-grace') + tag);
      if (late && /^u:[0-9a-f]{16}$/.test(by) && !blocks.has(by) && !blockedOf(by.slice(2))) blocks.set(by, rec);
    };
    rows.forEach((r, i) => check(r, i, drop, ''));
    arch.forEach((r, i) => check(r, i, adrop, '-archive'));
    // every other record of an account blocked tonight leaves the hall too
    for (let i = 0; i < rows.length; i++) if (!drop.has(i) && blocks.has(String(rows[i][2]))) drop.set(i, 'blocked');
    if (drop.size || adrop.size) {
      const fl = flaggedSheet(), rs = removedSheet();
      const gone = new Set(removedRows().filter(x => x[0] === 'hof').map(x => String(x[1])));
      const flag = (r, reason) => {
        const rec = rowRec(r) || {};
        fl.appendRow([now, reason, String(r[2] || ''), rec.id || '', String(r[5] || '')]);
        if (rec.id && !gone.has(rec.id)) { rs.appendRow(['hof', rec.id, now, 'nightly']); gone.add(rec.id); }
      };
      for (const [i, reason] of drop) flag(rows[i], reason);
      for (const [i, reason] of adrop) flag(arch[i], reason);
      for (const [by, rec] of blocks) blockedSheet().appendRow([by, now, 'nolog', rec.id, rec.state, rec.score]);
      if (drop.size) {
        const keep = rows.filter((r, i) => !drop.has(i));
        sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
        if (keep.length) sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep);
      }
      const c = CacheService.getScriptCache();
      [listKey(), 'rlist'].forEach(k => c.remove(k));
    }
    const report = { at: now, from: from, checked: checked, removed: drop.size + adrop.size, blocked: blocks.size };
    PropertiesService.getScriptProperties().setProperty('NIGHTLY_LAST', JSON.stringify(report));
    return report;
  } finally { lock.releaseLock(); }
}
function nightlyLast() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('NIGHTLY_LAST') || 'null'); } catch (err) { return null; } }
// a signed-in page asks whether its account is blocked
function readMe(b) {
  const acct = checkTicket(b.session);
  if (!acct) return { ok: false, err: 'session' };
  const bl = blockedOf(acct);
  return { ok: true, blocked: bl ? { at: bl.at, notice: CONFIG.BLOCK_NOTICE } : null };
}
// the developer device lifts a block; the records that left the hall stay in "hof-flagged"
function unblockAcct(b) {
  if (checkTicket(b.session) !== 'dev') return { ok: false, err: 'forbidden' };
  const by = typeof b.by === 'string' && /^u:[0-9a-f]{16}$/.test(b.by) ? b.by : '';
  if (!by) return { ok: false, err: 'id' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = blockedSheet(), last = sh.getLastRow();
    let n = 0;
    if (last > 1) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = ids.length - 1; i >= 0; i--) if (ids[i][0] === by) { sh.deleteRow(i + 2); n++; }
    }
    return { ok: true, unblocked: n };
  } finally { lock.releaseLock(); }
}
function dailySheet() { return sheetNamed(DSHEET, DHEAD); }
function gameSheet() { return sheetNamed(GSHEET, GHEAD); }
function sheetNamed(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function sheet() { return sheetNamed(SHEET, HEAD); }
function cmtSheet() { return sheetNamed(CSHEET, CHEAD); }
function removedSheet() { return sheetNamed(RSHEET, RHEAD); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sha256(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8); }
function hex(bytes) { return bytes.map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
