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
 * รุ่น 8 (17 พ.ย. 2026) กันการยัดข้อมูล: ผลจะขึ้นหอได้ต้องมีบันทึกการเดินติดมา และสคริปต์เล่นเกมนั้นซ้ำทั้งเกมด้วยเอนจิน AI
 * ข้อมูลการ์ดและชุดกฎชุดเดียวกับหน้าเกม (ส่วนท้ายของไฟล์นี้ build.py สร้างจากไฟล์ของหน้าเกม ห้ามแก้เอง) ผลที่เล่นซ้ำแล้ว
 * ผู้ชนะ คะแนน หรือตัวเลขใดไม่ตรงกับที่ส่งมาถูกปฏิเสธทันที จดไว้ในชีต "hof-flagged" พร้อมเหตุ และบัญชีที่ถูกปฏิเสธด้วยเหตุนี้
 * ครบ CONFIG.REFUSALS_TO_BLOCK ครั้งใน CONFIG.REFUSAL_DAYS วันถูกระงับ ทุกคืนสคริปต์เล่นซ้ำผลที่ขึ้นหอมาก่อนรุ่นนี้ซึ่งยังไม่เคย
 * ถูกเล่นซ้ำด้วย ทุกค่าที่ลงชีตถูกกันไม่ให้กลายเป็นสูตร คำขอที่ใหญ่เกิน CONFIG.MAX_BODY ตัวอักษรไม่ถูกอ่าน และโทเค็นที่ไม่ใช่
 * ของแอปนี้ถูกตัดทิ้งก่อนถาม Google เมื่อแก้กติกา เอนจิน AI หรือข้อมูลการ์ดของหน้าเกม ENGINE_STAMP ในส่วนท้ายจะเปลี่ยน
 * ต้องวางไฟล์นี้ใหม่ทั้งไฟล์คู่กับการอัปหน้าเกมทุกครั้ง (หน้าสถิติเตือนเมื่อสองฝั่งไม่ตรงกัน)
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
  // กันการยัดข้อมูล (รุ่น 8)
  REPLAY: true,              // false = รับผลโดยไม่เล่นซ้ำ (ยังต้องมีบันทึกการเดินติดมา)
  REPLAY_MS: 150000,         // เวลานานสุดที่การเล่นซ้ำหนึ่งเกมใช้ได้ เกินนี้ตอบว่ายุ่งให้ลองใหม่
  REFUSALS_TO_BLOCK: 3,      // ผลที่เล่นซ้ำแล้วไม่ตรงกี่ครั้งจึงระงับบัญชี (ไม่นับผลจากหน้าเกมรุ่นเก่าหรือตอนสคริปต์ยุ่ง)
  REFUSAL_DAYS: 7,           // นับครั้งที่ไม่ตรงย้อนหลังกี่วัน
  MAX_BODY: 300000,          // คำขอที่ยาวเกินกี่ตัวอักษรไม่ถูกอ่าน
  SIGNINS_PER_MIN: 60,       // การตรวจลงชื่อเข้าใช้กับ Google ต่อนาทีทั้งเว็บ กันการยิงโทเค็นปลอมจนโควตาหมด
  NIGHT_REPLAY_MS: 240000,   // เวลาที่การตรวจทุกคืนใช้เล่นซ้ำผลที่ขึ้นหอก่อนรุ่นนี้ ที่เหลือรอคืนถัดไป
  REQUIRE_LOG: true,         // false = รับผลที่ไม่มีบันทึกการเดินแบบรุ่น 7 (การตรวจทุกคืนยังนำออก)
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
  return out({ ok: true, app: 'kirana-federation-hof', v: 8, month: monthStr(Date.now()), count: Math.max(0, sheet().getLastRow() - 1), reset: resetAt(), eng: ENGINE_STAMP });
}

function doPost(e) {
  let b;
  const raw = (e && e.postData && e.postData.contents) || '{}';
  // a request larger than any the page sends is not read at all (version 8)
  if (typeof raw !== 'string' || raw.length > CONFIG.MAX_BODY) return out({ ok: false, err: 'size' });
  try { b = JSON.parse(raw); } catch (err) { return out({ ok: false, err: 'json' }); }
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
    // version 8: a token that is not shaped like a Google sign-in for this app, or has expired, stops here before any call
    // to Google, and only CONFIG.SIGNINS_PER_MIN calls a minute go out: junk tokens cannot use up the script's quota
    const pre = tokenClaims_(b.google);
    if (!pre || !/^(https:\/\/)?accounts\.google\.com$/.test(String(pre.iss || '')) || !(+pre.exp * 1000 > Date.now()) || !pre.sub) return { ok: false, err: 'token' };
    if (CONFIG.GOOGLE_CLIENT_ID && pre.aud !== CONFIG.GOOGLE_CLIENT_ID) return { ok: false, err: 'audience' };
    if (!signinSlot_()) return { ok: false, err: 'busy' };
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
// the claims a Google ID token carries in its middle part, read without trusting them (Google checks the signature)
function tokenClaims_(t) {
  const p = String(t).split('.');
  if (p.length !== 3 || !/^[\w-]{10,3000}$/.test(p[1])) return null;
  try {
    const o = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p[1] + '='.repeat((4 - p[1].length % 4) % 4))).getDataAsString());
    return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
  } catch (err) { return null; }
}
function signinSlot_() {
  const c = CacheService.getScriptCache(), k = 'signin:' + Math.floor(Date.now() / 60000), n = +(c.get(k) || 0);
  if (n >= CONFIG.SIGNINS_PER_MIN) return false;
  c.put(k, String(n + 1), 180);
  return true;
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
  // of the winning state. Version 8: no log, no record (a page from before version 7 sends none)
  let log = '', o = null;
  if (typeof b.log === 'string' && b.log) {
    log = cleanLog(b.log);
    try { o = log ? JSON.parse(log) : null; } catch (err) { o = null; }
    if (!logFits(o, rec)) return refuse_(acct, rec, 'record', 'บันทึกการเดินไม่ใช่ของเกมนี้', 'บันทึกการเดินไม่ใช่ของเกมที่ส่งผลมา');
  }
  if (!log && CONFIG.REQUIRE_LOG !== false) return refuse_(acct, rec, 'nolog', 'หน้าเกมที่ส่งผลนี้เป็นรุ่นเก่า ผลจึงไม่มีบันทึกการเดินติดมา กดโหลดหน้าใหม่ (Ctrl+F5) แล้วชัยชนะครั้งต่อไปจะขึ้นหอได้ตามปกติ', '');
  // version 8: the script plays the game again from the log with the page's engine; the record enters only as the game
  // gives it. The replay runs before the lock: it takes seconds and other requests go on meanwhile
  let checked = '';
  if (log && CONFIG.REPLAY !== false && !inHall_(rec.id)) {
    if (isRemoved('hof', rec.id)) return { ok: true, removed: true };
    const v = replayRecord_(o, rec, typeof b.es === 'string' ? b.es : '');
    if (!v.ok) return refuse_(acct, rec, v.err, v.err === 'busy' ? 'หอเกียรติยศตรวจผลไม่ทันตอนนี้ ลองส่งอีกครั้งในอีกสักครู่' : v.err === 'version'
      ? 'หน้าเกมนี้กับหอเกียรติยศออนไลน์ใช้กติกาคนละรุ่น กดโหลดหน้าใหม่ (Ctrl+F5) แล้วชัยชนะครั้งต่อไปจะขึ้นหอได้ตามปกติ' : 'ผลนี้ไม่ตรงกับเกมที่เล่นจริงตามบันทึกการเดิน', v.note);
    checked = v.stamp;
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
      if (log && !hofLogIds().has(rec.id)) storeHofLog(rec, acct, log, checked);   // a second send that brings the log
      return { ok: true, dup: true, rank: rankIn(rows, rec.id), total: rows.length };
    }
    // a win that already stood in the hall of a month before does not come back for the new month
    if (archivedKeys().has(key)) return { ok: true, dup: true, old: true };
    const dayAgo = Date.now() - 864e5;
    if (rows.filter(r => r[2] === 'u:' + acct && +r[1] > dayAgo).length >= CONFIG.MAX_PER_DAY) return { ok: false, err: 'limit' };
    const row = [key, Date.now(), 'u:' + acct, rec.score, rec.margin, JSON.stringify(rec)];
    append_(sh, row);
    if (log) storeHofLog(rec, acct, log, checked);
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
    append_(sh, [key, Date.now(), 'u:' + acct, JSON.stringify(c)]);
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
    if (!isRemoved(kind, b.id)) append_(removedSheet(), [kind, b.id, Date.now(), acct]);
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
        ar.getRange(at, 1, old.length, AHEAD.length).setValues(old.map(r => [rowMonth(r)].concat(r).map(cell_)));
        sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
        if (keep.length) sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep.map(r => r.map(cell_)));
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
        ar.getRange(at, 1, rows.length, AHEAD.length).setValues(rows.map(r => [(rowMonth(r) || '-') + ' รีเซ็ต ' + dayStr(now)].concat(r).map(cell_)));
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
    append_(gameSheet(), row);
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
    if (!r) { append_(sh, [day, 0, 0, 0, 0]); r = sh.getLastRow(); }
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
    // version 8: the wins the door turned away lately (newest first) and the engine this script replays with
    guard: { eng: ENGINE_STAMP, replay: CONFIG.REPLAY !== false, refused: rowsOf(flaggedSheet(), FHEAD.length).filter(r => /^refused-/.test(String(r[1])) && +r[0] >= Date.now() - 30 * 864e5)
      .reverse().slice(0, 60).map(r => { const rec = (() => { try { return JSON.parse(r[4]); } catch (e) { return {}; } })(); return { at: +r[0] || 0, why: String(r[1]).slice(8), by: String(r[2]), state: str(String(rec.state || ''), 24), score: Number.isInteger(rec.score) ? rec.score : null, note: str(String(r[5] || ''), 300) }; }) },
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
// ok: the stamp of the engine whose replay gave this record (version 8); empty for a record taken before the replay check
const LHEAD = ['id', 'ts', 'by', 'gid', 'seed', 'loglen', 'log1', 'log2', 'log3', 'log4', 'ok'];
const BSHEET = 'blocked';
const BHEAD = ['by', 'ts', 'reason', 'id', 'state', 'score'];
const FSHEET = 'hof-flagged';
// note: what the replay found (version 8), e.g. the score the game really gave
const FHEAD = ['ts', 'reason', 'by', 'id', 'json', 'note'];
function hofLogSheet() { return headed_(sheetNamed(LSHEET, LHEAD), LHEAD); }
function blockedSheet() { return sheetNamed(BSHEET, BHEAD); }
function flaggedSheet() { return headed_(sheetNamed(FSHEET, FHEAD), FHEAD); }
// a sheet made by an earlier version gets the columns this version added, named in its header (once a run)
const headedNow = {};
function headed_(sh, head) {
  const k = head.join('|');
  if (headedNow[k]) return sh;
  headedNow[k] = true;
  const have = sh.getLastRow() > 0 ? sh.getRange(1, 1, 1, head.length).getValues()[0] : [];
  if (have[head.length - 1] !== head[head.length - 1]) sh.getRange(1, 1, 1, head.length).setValues([head]);
  return sh;
}
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
function storeHofLog(rec, acct, log, checked) {
  const row = [rec.id, Date.now(), 'u:' + acct, rec.gid || '', rec.seed, log.length];
  for (let i = 0; i < 4; i++) { const part = log.slice(i * LOG_CELL, (i + 1) * LOG_CELL); row.push(part ? '~' + part : ''); }
  row.push(checked || '');
  append_(hofLogSheet(), row);
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
    const cells = ls.getRange(i + 2, 7, 1, 5).getValues()[0];
    const log = cells.slice(0, 4).map(c => String(c || '').replace(/^~/, '')).join('');
    let o = null; try { o = JSON.parse(log); } catch (err) { /* a cut log */ }
    if (logFits(o, rec)) return { log: log, gid: String(o.cfg.gid || rec.gid || ''), ts: 0, src: 'hof', row: i + 2, ok: String(cells[4] || '') };
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
    let checked = 0, replayed = 0, left = 0;
    const check = (r, i, into, tag) => {
      const t = +r[1], rec = rowRec(r);
      if (!rec || !rec.id || !(t >= from)) return;
      checked++;
      const f = findLogFor(rec, cache);
      if (f) {
        // version 8: a log the replay check has not passed (a record taken before this version) is played again tonight,
        // as far as the night's time allows; a record its game does not give leaves the hall (no block: another engine
        // took it). The rest wait for the next night
        if (CONFIG.REPLAY === false || (f.src === 'hof' && f.ok) || cache.noTime) return;
        if (Date.now() - now > CONFIG.NIGHT_REPLAY_MS) { cache.noTime = true; left++; return; }
        let o = null; try { o = JSON.parse(f.log); } catch (err) { /* checked by logFits already */ }
        const v = replayRecord_(o, rec, '');
        replayed++;
        if (v.ok) { if (f.src === 'hof') hofLogSheet().getRange(f.row, 11, 1, 1).setValues([[v.stamp]]); else storeHofLog(rec, String(r[2] || '').replace(/^u:/, ''), f.log, v.stamp); }
        else if (v.err !== 'busy') { into.set(i, 'replay' + tag); cache.notes = cache.notes || {}; cache.notes[rec.id] = v.note; }
        return;
      }
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
        append_(fl, [now, reason, String(r[2] || ''), rec.id || '', String(r[5] || ''), String((cache.notes || {})[rec.id] || '')]);
        if (rec.id && !gone.has(rec.id)) { append_(rs, ['hof', rec.id, now, 'nightly']); gone.add(rec.id); }
      };
      for (const [i, reason] of drop) flag(rows[i], reason);
      for (const [i, reason] of adrop) flag(arch[i], reason);
      for (const [by, rec] of blocks) append_(blockedSheet(), [by, now, 'nolog', rec.id, rec.state, rec.score]);
      if (drop.size) {
        const keep = rows.filter((r, i) => !drop.has(i));
        sh.getRange(2, 1, last - 1, HEAD.length).clearContent();
        if (keep.length) sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep.map(r => r.map(cell_)));
      }
      const c = CacheService.getScriptCache();
      [listKey(), 'rlist'].forEach(k => c.remove(k));
    }
    const report = { at: now, from: from, checked: checked, removed: drop.size + adrop.size, blocked: blocks.size, replayed: replayed, left: left };
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
// ---------- against stuffed data (version 8, ruled 17 Nov 2026) ----------
// A forged record, a forged move log, a value meant to become a sheet formula, a flood of junk: none gets in.
// 1. The door: a win enters the hall only with its move log, and only as the game in that log gives it. The script plays
//    the game again with the page's own engine, AI, card data and rule sets (the part build.py adds at the end of this
//    file, named by ENGINE_STAMP): the AI seats and the stretches the AI took over decide on the game's own random
//    stream, every other answer comes from the log, and the engine turns any answer the page could not have sent into
//    a legal one. The game must end with every answer of the log used, the record's state must win it at a person's
//    seat, and every number of the record must be what the game gave
// 2. A refused win waits in "hof-flagged" with what the replay found; CONFIG.REFUSALS_TO_BLOCK refusals of an account
//    within CONFIG.REFUSAL_DAYS block it, as the nightly check does (a page of another engine, an old page or a busy
//    script count for nothing)
// 3. Every value written to a sheet that could read as a formula (starting with = + - @) is kept as text
const cell_ = v => typeof v === 'string' && /^[=+\-@\t\r\n]/.test(v) ? "'" + v : v;
function append_(sh, row) { sh.appendRow(row.map(cell_)); }
const COUNTED = ['replay', 'record'];
// a win turned away: the player reads why; the developer finds it in "hof-flagged"; enough of them block the account
function refuse_(acct, rec, err, msg, note) {
  const now = Date.now(), by = 'u:' + acct;
  try {
    append_(flaggedSheet(), [now, 'refused-' + err, acct === 'dev' ? 'dev' : by, rec.id || '', JSON.stringify(rec), String(note || '').slice(0, 500)]);
    if (COUNTED.indexOf(err) >= 0 && acct !== 'dev' && CONFIG.REFUSALS_TO_BLOCK > 0 && !blockedOf(acct)) {
      const since = now - CONFIG.REFUSAL_DAYS * 864e5;
      const n = rowsOf(flaggedSheet(), 3).filter(r => r[2] === by && +r[0] >= since && COUNTED.some(c => r[1] === 'refused-' + c)).length;
      if (n >= CONFIG.REFUSALS_TO_BLOCK) {
        append_(blockedSheet(), [by, now, 'replay', rec.id || '', rec.state || '', rec.score]);
        return { ok: false, err: 'blocked', msg: CONFIG.BLOCK_NOTICE, at: now };
      }
    }
  } catch (e) { /* the refusal stands even if the note cannot be written */ }
  return { ok: false, err: err, msg: msg };
}
// is the record already in the hall: a page that sends again after a timeout gets its answer without a second replay
function inHall_(id) {
  const sh = sheet(), last = sh.getLastRow();
  return last > 1 && sh.getRange(2, 1, last - 1, 1).getValues().some(r => r[0] === 'r:' + id);
}
// the page's own reading of an answer in the log (30_session.js decodeAns)
function decodeAns_(req, e) {
  if (!e || typeof e !== 'object' || e.n) return null;
  if (e.o != null && req.options && req.options[e.o]) return req.options[e.o].value;
  return e.v === undefined ? null : e.v;
}
// the game of a move log, played again. Returns { ok: true, stamp } or { ok: false, err, note }: err 'replay' (this
// engine, so the record is not what the game gave), 'version' (the page named another engine and the replay disagrees:
// a page from before or after this script), 'busy' (the replay ran out of time)
function replayRecord_(o, rec, es) {
  const E = hofEngine_(), K = E.K, AI = E.AI, mine = es === E.stamp;
  const no = (note) => ({ ok: false, err: mine ? 'replay' : 'version', note: note });
  const cfg = o.cfg;
  if (cfg.assist) return { ok: false, err: 'record', note: 'เกมที่เปิดผู้ช่วย AI ไม่ขึ้นหอ' };
  const rs = E.RULESETS[cfg.rules];
  if (!rs || !rs.data()) return no('ชุดกฎ ' + str(String(cfg.rules), 12) + ' ไม่มีในสคริปต์');
  if (cfg.mode !== rec.mode) return no('โหมดในบันทึก ' + str(String(cfg.mode), 12) + ' แต่ผลบอก ' + rec.mode);
  if (!(cfg.seats.length >= 2 && cfg.seats.length <= 4) || !cfg.seats.every(x => x && typeof x === 'object')) return no('ที่นั่งในบันทึกไม่ถูกต้อง');
  if (rec.gid && cfg.gid !== rec.gid) return no('รหัสเกมในบันทึกไม่ตรงกับผล');
  if (o.log.length > 20000 || !o.log.every(x => Array.isArray(x) && Number.isInteger(x[0]) && x[0] > 0)) return no('บันทึกการเดินผิดรูป');
  const seats = cfg.seats.map(x => ({ name: String(x.name), human: x.human === true, style: typeof x.style === 'string' ? x.style : 'balanced',
    level: x.human === true ? 'normal' : (AI.LEVELS[x.level] ? x.level : 'normal'), color: x.color }));
  const log = new Map(o.log.map(x => [x[0], x[1]]));
  const take = {};
  for (const k of Object.keys(o.takeover || {})) {
    const t = o.takeover[k];
    if (/^[0-3]$/.test(k) && t && Number.isInteger(t.from) && t.from > 0) take[k] = { from: t.from, to: Number.isInteger(t.to) ? t.to : null };
  }
  const t0 = Date.now();
  let seq = 0, used = 0, short = false, slow = false;
  let G;
  try {
    G = K.newGame({ seats, seed: Number(cfg.seed) >>> 0, data: rs.data(), rules: rs.rules, first: 0, io: { event: () => {}, ask: (g, P, req) => {
      const k = ++seq;
      if (k > 30000) throw new Error('the game does not end');
      if (k % 25 === 0 && Date.now() - t0 > CONFIG.REPLAY_MS) { slow = true; throw new Error('slow'); }
      const tk = take[P.id];
      if (!P.human || (tk && k >= tk.from && (tk.to == null || k <= tk.to))) return AI.decide(g, P, req);
      if (!log.has(k)) { short = true; throw new Error('short'); }
      const e = log.get(k); used++;
      if (e && Array.isArray(e.c)) for (const c of e.c.slice(0, 4)) {
        if (!c || typeof c !== 'object') continue;
        if (Number.isInteger(c.reclaim) && take[c.reclaim] && take[c.reclaim].to == null) take[c.reclaim].to = k;
        if (c.pay === P.id && (c.m === 'auto' || K.PAY_ORDERS.indexOf(c.m) >= 0)) { if (c.m === 'auto') delete P.payFirst; else P.payFirst = c.m; }
      }
      return decodeAns_(req, e);
    } } });
    K.runGame(G);
  } catch (err) {
    if (slow) return { ok: false, err: 'busy', note: 'เล่นซ้ำไม่ทันใน ' + Math.round(CONFIG.REPLAY_MS / 1000) + ' วินาที' };
    if (short) return no('บันทึกการเดินจบก่อนเกมจบ (คำถามที่ ' + seq + ')');
    return no('เล่นซ้ำไม่ได้: ' + String(err && err.message || err).slice(0, 120));
  }
  if (!G.over) return no('เกมในบันทึกไม่จบ');
  if (log.size !== used) return no('บันทึกการเดินมีคำตอบเกินเกม ' + (log.size - used) + ' ข้อ');
  // the record the page made at the end of this game (80_end.js hofRecord), with the limits cleanRecord puts on it
  const sc = K.finalScores(G), W = sc[0] && sc[0].P;
  if (!W || !W.human || str(String(W.name), 24) !== rec.state) return no('ผู้ชนะของเกมนี้คือ ' + (W ? str(String(W.name), 24) + (W.human ? '' : ' (AI)') : 'ไม่มี'));
  const rs_ = W.research || [], lv = cfg.seats.filter(x => x.human !== true).map(x => x.level || 'normal');
  const want = {
    n: G.n, seed: G.seed, rules: String(cfg.rules), score: W.legit - W.stigma, legit: int(W.legit, -300, 300), stigma: int(W.stigma, 0, 300), grav: int(W.grav, 0, 9999),
    culture: int(rs_.filter(r => r.d.kind === 'culture').length, 0, 99), innovation: int(rs_.filter(r => r.d.kind === 'innovation').length, 0, 99),
    building: int(K.buildingsOf(W).length, 0, 99), military: int(K.armyCards(W).length, 0, 200), projects: int(W.projects.length, 0, 60),
    margin: int(sc.length > 1 ? sc[0].score - sc[1].score : 0, -300, 300),
    opp: sc.filter(x => x.P !== W).map(x => str(String(x.P.name), 24) + ' ' + int(x.score, -300, 300) + (x.P.human ? '' : ' AI')).join(', '),
    lvl: lv.length ? (lv.indexOf('hard') >= 0 ? 'hard' : lv.indexOf('normal') >= 0 ? 'normal' : 'easy') : '',
  };
  const got = { n: rec.n, seed: rec.seed, rules: rec.rules, score: rec.score, legit: rec.legit, stigma: rec.stigma, grav: rec.grav,
    culture: rec.research.culture, innovation: rec.research.innovation, building: rec.research.building, military: rec.military, projects: rec.projects,
    margin: rec.margin, opp: rec.opp.map(x => x.state + ' ' + x.score + (x.ai ? ' AI' : '')).join(', '), lvl: rec.lvl || '' };
  const off = Object.keys(want).filter(k => want[k] !== got[k]);
  if (off.length) return no(off.slice(0, 4).map(k => k + ' ผลบอก ' + got[k] + ' แต่เกมให้ ' + want[k]).join(' · '));
  return { ok: true, stamp: E.stamp, ms: Date.now() - t0 };
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

// =====================================================================================================================
// THE GAME ENGINE FOR THE REPLAY CHECK (version 8): made by build.py from the page's own files (card data, engine, AI
// and the rule sets of the menu). Do not edit it by hand: build the page again, and paste the whole file again whenever
// ENGINE_STAMP changes, or the check stops winners of the new page (the status answer shows the stamp as "eng")
// =====================================================================================================================
const ENGINE_STAMP = '1bff1744d13b9775';
function hofEngine_() {
if (hofEngine_.m) return hofEngine_.m;
const window = {};   // the page's global object, as the data, the engine and the rule sets know it
var KDATA02 = {
"projects": [
{
"name": "ทุ่งนาลุ่มน้ำ",
"isNew": false,
"era": 0,
"cost": {
"mat": 2,
"food": 2,
"grav": 1
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"ppl"
]
},
{
"name": "สวนผลไม้เชิงเขา",
"isNew": true,
"era": 0,
"cost": {
"mat": 3,
"food": 1
},
"inp": {},
"out": "food",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "หมู่บ้านชาวประมง",
"isNew": true,
"era": 0,
"cost": {
"mat": 3,
"grav": 2
},
"inp": {},
"out": "food",
"outN": 2,
"workers": 1,
"slots": 0,
"sale": 2,
"mil": 2,
"sym": [
"ppl"
]
},
{
"name": "ทุ่งไบซันยักษ์",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 1
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": [
"arms"
]
},
{
"name": "นาหลวง",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"trad"
]
},
{
"name": "เหมืองหินริมเขา",
"isNew": false,
"era": 0,
"cost": {
"mat": 3,
"food": 1
},
"inp": {},
"out": "mat",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": []
},
{
"name": "ป่าไม้เหล็กริมน้ำ",
"isNew": true,
"era": 0,
"cost": {
"food": 3,
"grav": 2
},
"inp": {},
"out": "mat",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "บ่อดินเหนียว",
"isNew": true,
"era": 0,
"cost": {
"mat": 2,
"food": 2
},
"inp": {},
"out": "mat",
"outN": 2,
"workers": 1,
"slots": 0,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "เหมืองเหล็กโบราณ",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "mat",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"arms"
]
},
{
"name": "ลานตัดศิลา",
"isNew": true,
"era": 0,
"cost": {
"mat": 3,
"food": 1,
"grav": 2
},
"inp": {},
"out": "mat",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": [
"trad"
]
},
{
"name": "เตาเผาถ่าน",
"isNew": false,
"era": 0,
"cost": {
"mat": 3,
"grav": 2
},
"inp": {},
"out": "fuel",
"outN": 2,
"workers": 1,
"slots": 0,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "ป่าฟืน",
"isNew": true,
"era": 0,
"cost": {
"mat": 2,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "บ่อน้ำมันดิน",
"isNew": true,
"era": 0,
"cost": {
"mat": 3,
"food": 1,
"grav": 1
},
"inp": {},
"out": "fuel",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": [
"sci"
]
},
{
"name": "ป่าชายเลน",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 1
},
"inp": {},
"out": "fuel",
"outN": 3,
"workers": 1,
"slots": 0,
"sale": 2,
"mil": 2,
"sym": []
},
{
"name": "ซากถนนหลวง",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "ตลาดนัดหัวเมือง",
"isNew": true,
"era": 0,
"cost": {
"mat": 2,
"food": 1,
"grav": 2
},
"inp": {},
"out": "grav",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": null,
"mil": 1,
"sym": [
"com"
]
},
{
"name": "ท่าเรือการค้า",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 1,
"grav": 1
},
"inp": {},
"out": "grav",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": null,
"mil": 2,
"sym": [
"com"
]
},
{
"name": "ด่านเก็บภาษี",
"isNew": true,
"era": 0,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "grav",
"outN": 3,
"workers": 1,
"slots": 0,
"sale": null,
"mil": 3,
"sym": []
},
{
"name": "นาข้าวชลประทาน",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 2,
"grav": 2
},
"inp": {},
"out": "food",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"ppl"
]
},
{
"name": "ไร่อ้อย",
"isNew": true,
"era": 1,
"cost": {
"mat": 5,
"food": 1
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": [
"com"
]
},
{
"name": "ฟาร์มโคอำพัน",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": []
},
{
"name": "สวนเครื่องเทศ",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 1,
"grav": 3
},
"inp": {},
"out": "food",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "ที่ดินตระกูลรีฟเก่า",
"isNew": true,
"era": 1,
"cost": {
"mat": 5,
"food": 2,
"grav": 2
},
"inp": {},
"out": "food",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"trad"
]
},
{
"name": "โรงเลื่อยพลังน้ำ",
"isNew": false,
"era": 1,
"cost": {
"mat": 4,
"fuel": 1,
"food": 1
},
"inp": {},
"out": "mat",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": []
},
{
"name": "เหมืองหินอ่อน",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 2,
"grav": 2
},
"inp": {},
"out": "mat",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "โรงหล่อโลหะ",
"isNew": true,
"era": 1,
"cost": {
"mat": 3,
"fuel": 2,
"food": 1
},
"inp": {},
"out": "mat",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": [
"sci"
]
},
{
"name": "เหมืองเหล็ก",
"isNew": true,
"era": 1,
"cost": {
"mat": 5,
"food": 2,
"grav": 2
},
"inp": {},
"out": "mat",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": [
"arms"
]
},
{
"name": "ป่าไม้สัมปทาน",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 2,
"grav": 3
},
"inp": {},
"out": "mat",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": []
},
{
"name": "เหมืองศิลาเวท",
"isNew": false,
"era": 1,
"cost": {
"mat": 5,
"food": 1
},
"inp": {},
"out": "fuel",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "เตาถ่านหลวง",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 2,
"sym": []
},
{
"name": "โรงหีบน้ำมันพืช",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"food": 3
},
"inp": {},
"out": "fuel",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": [
"ppl"
]
},
{
"name": "เหมืองผลึกมานา",
"isNew": true,
"era": 1,
"cost": {
"mat": 6,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "ป่าสนเรซิน",
"isNew": true,
"era": 1,
"cost": {
"mat": 5,
"food": 1,
"grav": 3
},
"inp": {},
"out": "fuel",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": 2,
"mil": 3,
"sym": [
"arms"
]
},
{
"name": "ตลาดนัดชายแดน",
"isNew": false,
"era": 1,
"cost": {
"mat": 3,
"food": 2,
"grav": 3
},
"inp": {},
"out": "grav",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": null,
"mil": 3,
"sym": [
"com"
]
},
{
"name": "โรงกษาปณ์",
"isNew": true,
"era": 1,
"cost": {
"mat": 4,
"fuel": 1,
"grav": 3
},
"inp": {},
"out": "grav",
"outN": 3,
"workers": 1,
"slots": 1,
"sale": null,
"mil": 2,
"sym": [
"trad"
]
},
{
"name": "บริษัทการค้าทางทะเล",
"isNew": true,
"era": 1,
"cost": {
"mat": 5,
"food": 1,
"grav": 4
},
"inp": {},
"out": "grav",
"outN": 4,
"workers": 2,
"slots": 1,
"sale": null,
"mil": 3,
"sym": []
},
{
"name": "ฟาร์มรวม",
"isNew": false,
"era": 2,
"cost": {
"mat": 5,
"fuel": 1,
"food": 2
},
"inp": {},
"out": "food",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": [
"ppl"
]
},
{
"name": "ไร่รวงอำพันจักรกล",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"fuel": 2
},
"inp": {
"fuel": 1
},
"out": "food",
"outN": 6,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "โรงงานอาหารกระป๋อง",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"fuel": 1,
"grav": 3
},
"inp": {
"fuel": 1
},
"out": "food",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"arms"
]
},
{
"name": "ไร่ปศุสัตว์ขนาดใหญ่",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"food": 2,
"grav": 3
},
"inp": {},
"out": "food",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": []
},
{
"name": "ไร่ชาบนที่สูง",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"food": 1,
"grav": 3
},
"inp": {},
"out": "food",
"outN": 6,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 4,
"sym": [
"com"
]
},
{
"name": "โรงถลุงเหล็ก",
"isNew": false,
"era": 2,
"cost": {
"mat": 6,
"fuel": 2,
"grav": 2
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "โรงงานซีเมนต์",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"fuel": 2,
"grav": 3
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 6,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "เหมืองทองแดง",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"food": 2
},
"inp": {},
"out": "mat",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": []
},
{
"name": "โรงอิฐเครื่องจักร",
"isNew": true,
"era": 2,
"cost": {
"mat": 5,
"fuel": 2,
"food": 2
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": [
"ppl"
]
},
{
"name": "ป่าไม้ทางรถไฟ",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"food": 2,
"grav": 3
},
"inp": {},
"out": "mat",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "เหมืองศิลาเวทอุตสาหกรรม",
"isNew": false,
"era": 2,
"cost": {
"mat": 7,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 4,
"sym": []
},
{
"name": "โรงอัดประจุศิลาเวท",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"food": 1,
"grav": 3
},
"inp": {},
"out": "fuel",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "เหมืองศิลาเวทตราศาสนจักร",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"food": 1,
"grav": 3
},
"inp": {},
"out": "fuel",
"outN": 5,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"trad"
]
},
{
"name": "เหมืองศิลาเวทเขตแดนผี",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 2,
"sym": []
},
{
"name": "ท่าเติมผลึกกองเรือลำน้ำ",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"food": 2,
"grav": 3
},
"inp": {},
"out": "fuel",
"outN": 6,
"workers": 2,
"slots": 1,
"sale": 3,
"mil": 4,
"sym": [
"arms"
]
},
{
"name": "ธนาคารพาณิชย์",
"isNew": true,
"era": 2,
"cost": {
"mat": 6,
"food": 1,
"grav": 6
},
"inp": {},
"out": "grav",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": null,
"mil": 3,
"sym": [
"com"
]
},
{
"name": "ท่าเรือน้ำลึก",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"fuel": 1,
"grav": 3
},
"inp": {},
"out": "grav",
"outN": 4,
"workers": 2,
"slots": 2,
"sale": null,
"mil": 4,
"sym": []
},
{
"name": "ชุมทางรถไฟและเรือเหาะ",
"isNew": true,
"era": 2,
"cost": {
"mat": 7,
"fuel": 2
},
"inp": {
"fuel": 1
},
"out": "grav",
"outN": 5,
"workers": 2,
"slots": 1,
"sale": null,
"mil": 3,
"sym": [
"trad"
]
},
{
"name": "ฟาร์มอุตสาหกรรม",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"fuel": 2
},
"inp": {
"fuel": 1
},
"out": "food",
"outN": 8,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": [
"sci"
]
},
{
"name": "สหกรณ์การเกษตร",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"food": 2,
"grav": 3
},
"inp": {},
"out": "food",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"ppl"
]
},
{
"name": "โรงงานแปรรูปอาหาร",
"isNew": true,
"era": 3,
"cost": {
"mat": 7,
"fuel": 2,
"grav": 4
},
"inp": {
"fuel": 1
},
"out": "food",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 4,
"mil": 4,
"sym": [
"com"
]
},
{
"name": "นิคมผู้ตั้งรกราก",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"food": 3
},
"inp": {},
"out": "food",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": []
},
{
"name": "ฟาร์มชลประทานเขื่อน",
"isNew": true,
"era": 3,
"cost": {
"mat": 9,
"fuel": 1,
"grav": 4
},
"inp": {},
"out": "food",
"outN": 8,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 5,
"sym": [
"trad"
]
},
{
"name": "นิคมอุตสาหกรรม",
"isNew": false,
"era": 3,
"cost": {
"mat": 9,
"fuel": 3
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 8,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": [
"sci"
]
},
{
"name": "โรงงานเหล็กกล้า",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"fuel": 3,
"grav": 2
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 8,
"workers": 2,
"slots": 2,
"sale": 4,
"mil": 5,
"sym": [
"arms"
]
},
{
"name": "เหมืองมิทริลเปิด",
"isNew": true,
"era": 3,
"cost": {
"mat": 9,
"food": 2
},
"inp": {},
"out": "mat",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": []
},
{
"name": "โรงงานปูนซีเมนต์ใหญ่",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"fuel": 2
},
"inp": {
"fuel": 1
},
"out": "mat",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"ppl"
]
},
{
"name": "สวนป่าเศรษฐกิจ",
"isNew": true,
"era": 3,
"cost": {
"mat": 7,
"food": 2,
"grav": 4
},
"inp": {},
"out": "mat",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": []
},
{
"name": "สายแร่มานาเซฟไฟน์",
"isNew": false,
"era": 3,
"cost": {
"mat": 8,
"fuel": 2,
"grav": 4
},
"inp": {},
"out": "fuel",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 4,
"mil": 5,
"sym": []
},
{
"name": "โรงกลั่นมานาข้น",
"isNew": true,
"era": 3,
"cost": {
"mat": 9,
"fuel": 2,
"grav": 2
},
"inp": {},
"out": "fuel",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 4,
"mil": 4,
"sym": [
"com"
]
},
{
"name": "เขื่อนไฟฟ้าพลังน้ำ",
"isNew": true,
"era": 3,
"cost": {
"mat": 10,
"grav": 4
},
"inp": {},
"out": "fuel",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"sci"
]
},
{
"name": "หอคอยมหากังหัน",
"isNew": true,
"era": 3,
"cost": {
"mat": 9,
"food": 1,
"grav": 3
},
"inp": {},
"out": "fuel",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 4,
"sym": []
},
{
"name": "คลังผลึกยุทธศาสตร์",
"isNew": true,
"era": 3,
"cost": {
"mat": 9,
"food": 2
},
"inp": {},
"out": "fuel",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": 3,
"mil": 3,
"sym": [
"arms"
]
},
{
"name": "หอทะเบียนสัมปทาน",
"isNew": false,
"era": 3,
"cost": {
"mat": 6,
"food": 2,
"grav": 8
},
"inp": {},
"out": "grav",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": null,
"mil": 3,
"sym": [
"com"
]
},
{
"name": "ท่าเรือเหาะนานาชาติ",
"isNew": true,
"era": 3,
"cost": {
"mat": 8,
"fuel": 2,
"grav": 4
},
"inp": {},
"out": "grav",
"outN": 6,
"workers": 2,
"slots": 2,
"sale": null,
"mil": 4,
"sym": []
},
{
"name": "คลังอินกอธ",
"isNew": true,
"era": 3,
"cost": {
"mat": 7,
"food": 2,
"grav": 6
},
"inp": {},
"out": "grav",
"outN": 7,
"workers": 2,
"slots": 2,
"sale": null,
"mil": 5,
"sym": [
"trad"
]
}
],
"startProjects": [
{
"name": "ไร่บรรพบุรุษ",
"isNew": false,
"era": -1,
"cost": {},
"inp": {},
"out": "food",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 1,
"sym": []
},
{
"name": "ป่าตัดไม้",
"isNew": false,
"era": -1,
"cost": {},
"inp": {},
"out": "mat",
"outN": 2,
"workers": 1,
"slots": 1,
"sale": 2,
"mil": 1,
"sym": []
}
],
"research": [
{
"name": "โรงสี",
"isNew": false,
"era": 0,
"kind": "building",
"cost": {
"mat": 2
},
"text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับเกรฟ 4",
"sym": [
"ppl"
]
},
{
"name": "โรงตีเหล็ก",
"isNew": false,
"era": 0,
"kind": "building",
"cost": {
"mat": 3
},
"text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 2 ใบ เลือก 1 เข้ากองทัพ",
"sym": [
"arms"
]
},
{
"name": "ยุ้งฉาง",
"isNew": false,
"era": 0,
"kind": "building",
"cost": {
"mat": 2
},
"text": "กด ย้ายสินค้าได้สูงสุด 2 หน่วยจากโครงการนี้เข้าคลัง",
"sym": [
"wagon"
]
},
{
"name": "โบสถ์ประจำเมือง",
"isNew": true,
"era": 0,
"kind": "building",
"cost": {
"mat": 3
},
"text": "กด จ่ายอาหาร 1 จากโครงการนี้ ขยับกระแสสายประเพณีขึ้น 1 ช่อง",
"sym": [
"trad"
]
},
{
"name": "โรงรับจำนำ",
"isNew": true,
"era": 0,
"kind": "building",
"cost": {
"mat": 2
},
"text": "กด จ่ายเกรฟ 2 รับสินค้าชนิดใดก็ได้ 1 หน่วยเข้าคลัง",
"sym": [
"com"
]
},
{
"name": "ค่ายฝึกทหาร",
"isNew": true,
"era": 0,
"kind": "building",
"cost": {
"mat": 2
},
"text": "กด จ่ายอาหาร 1 จากโครงการนี้ รวมกองพักกับกองทหารของคุณแล้วสับใหม่",
"sym": [
"arms"
]
},
{
"name": "กังหันน้ำ",
"isNew": true,
"era": 0,
"kind": "building",
"cost": {
"mat": 3
},
"text": "กด โครงการนี้ผลิตเพิ่ม 1 หน่วยทันทีตามชนิดที่พิมพ์ ไม่ต้องใช้แรงงานหรือวัตถุดิบนำเข้า",
"sym": [
"sci"
]
},
{
"name": "ท่าเทียบเรือ",
"isNew": true,
"era": 0,
"kind": "building",
"cost": {
"mat": 3
},
"text": "กด จ่ายสินค้า 1 หน่วยจากโครงการนี้ รับเกรฟเท่าราคาซื้อของตลาดกลางในยุคปัจจุบัน",
"sym": [
"wagon"
]
},
{
"name": "ขนบราชสำนัก",
"isNew": false,
"era": 0,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ทุกครั้งที่คุณสร้างโครงการ รับเกรฟ 1",
"sym": [
"trad"
]
},
{
"name": "จารีตตระกูล",
"isNew": true,
"era": 0,
"kind": "culture",
"cost": {
"grav": 2
},
"text": "การ์ดวัฒนธรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1",
"sym": [
"trad"
]
},
{
"name": "สมาพันธ์พ่อค้า",
"isNew": false,
"era": 0,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ราคาขายบนโครงการของคุณทุกใบเพิ่ม 1",
"sym": [
"com",
"wagon"
]
},
{
"name": "กฎหมายตราชั่ง",
"isNew": true,
"era": 0,
"kind": "culture",
"cost": {
"grav": 2
},
"text": "เมื่อคุณขายให้ตลาดกลาง ได้เกรฟเพิ่ม 1 ต่อหน่วย สูงสุด 3 หน่วยต่อแอคชัน",
"sym": [
"com"
]
},
{
"name": "สภาหมู่บ้าน",
"isNew": false,
"era": 0,
"kind": "culture",
"cost": {
"grav": 2
},
"text": "รับแรงงานถูกลง 1 อาหาร ต่ำสุด 1",
"sym": [
"ppl"
]
},
{
"name": "ยุ้งข้าวชุมชน",
"isNew": true,
"era": 0,
"kind": "culture",
"cost": {
"grav": 2
},
"text": "คลังสินค้าของคุณจุเพิ่ม 2 ช่อง",
"sym": [
"ppl"
]
},
{
"name": "ประเพณีนักรบ",
"isNew": false,
"era": 0,
"kind": "culture",
"cost": {
"grav": 2
},
"text": "พลหอกของคุณได้ตั้งรับ 1",
"sym": [
"arms"
]
},
{
"name": "หอตำรา",
"isNew": true,
"era": 0,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "การ์ดนวัตกรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1",
"sym": [
"sci"
]
},
{
"name": "เกวียนล้อเหล็ก",
"isNew": false,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 2
},
"text": "เมื่อคุณซื้อจากรัฐอื่นครบ 3 หน่วยในแอคชันเดียว ได้เกรฟคืน 1",
"sym": [
"wagon"
]
},
{
"name": "เรือท้องแบน",
"isNew": true,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณซื้อจากตลาดกลาง ราคาลด 1 ต่อหน่วย",
"sym": [
"wagon"
]
},
{
"name": "สมุดบัญชีคู่",
"isNew": true,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 2
},
"text": "เมื่อรัฐอื่นซื้อจากโครงการของคุณครบ 3 หน่วยในแอคชันเดียว รับเกรฟเพิ่ม 1",
"sym": [
"com"
]
},
{
"name": "หมุดเงิน",
"isNew": false,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณชนะการบุกเบิก จั่วการ์ดโบนัส 1 ใบ",
"sym": [
"arms"
]
},
{
"name": "คันไถเหล็ก",
"isNew": false,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 2
},
"text": "ตอนขั้นผลิต โครงการอาหารของคุณหนึ่งใบผลิตเพิ่ม 1",
"sym": [
"ppl"
]
},
{
"name": "ปฏิทินสิบสามห้วง",
"isNew": true,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 2
},
"text": "เมื่อคุณวิจัยแล้วไม่เลือกใบใด รับเกรฟ 4 แทน 2",
"sym": [
"sci"
]
},
{
"name": "นาฬิกาน้ำ",
"isNew": true,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 2
},
"text": "เมื่อคุณเป็นรัฐสุดท้ายที่เล่นการทูตในรอบนั้น รับเกรฟ 2",
"sym": [
"sci"
]
},
{
"name": "ตราประทับหลวง",
"isNew": true,
"era": 0,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณเป็นผู้เลือกระบอบตอนเปลี่ยนยุค รับความชอบธรรม 1",
"sym": [
"trad"
]
},
{
"name": "แท่นพิมพ์เวทมนตร์",
"isNew": false,
"era": 1,
"kind": "building",
"cost": {
"mat": 3,
"grav": 2
},
"text": "กด จ่ายวัสดุ 2 จากโครงการนี้ ขยับกระแสสายใดก็ได้ 1 ช่อง",
"sym": [
"sci"
]
},
{
"name": "โรงประจุกระสุนมานา",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 3,
"grav": 1
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ การรบครั้งถัดไปของคุณก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 1",
"sym": [
"arms"
]
},
{
"name": "คลังสินค้าท่าเรือ",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 4
},
"text": "กด ย้ายสินค้าได้สูงสุด 3 หน่วยจากโครงการนี้เข้าคลัง",
"sym": [
"wagon"
]
},
{
"name": "โรงทอผ้าด้วยกี่",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 3,
"grav": 2
},
"text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับเกรฟ 6",
"sym": [
"com"
]
},
{
"name": "ศาลาประชาคม",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 3
},
"text": "กด จ่ายอาหาร 1 จากโครงการนี้ ขยับกระแสสายประชาชนขึ้น 1 ช่อง",
"sym": [
"ppl"
]
},
{
"name": "โรงหล่อปืนใหญ่มานา",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 4,
"grav": 2
},
"text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 3 ใบ เลือก 1 เข้ากองทัพ",
"sym": [
"arms"
]
},
{
"name": "ห้องทดลองเคมี",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 3,
"grav": 2
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ โครงการนี้ผลิตเพิ่ม 2 หน่วยทันทีตามชนิดที่พิมพ์",
"sym": [
"sci"
]
},
{
"name": "ปราสาทตระกูล",
"isNew": true,
"era": 1,
"kind": "building",
"cost": {
"mat": 4
},
"text": "กด จ่ายวัสดุ 1 จากโครงการนี้ การรบครั้งถัดไปที่คุณเป็นฝ่ายรับก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 2",
"sym": [
"trad"
]
},
{
"name": "สำนักปราชญ์",
"isNew": false,
"era": 1,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "วิจัยจั่วเพิ่ม 1 ใบ",
"sym": [
"sci",
"sci"
]
},
{
"name": "นิรโทษกรรม",
"isNew": false,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ตอนวาง ทิ้งตราบาปของคุณได้ 1 ใบ",
"sym": [
"ppl"
]
},
{
"name": "หลักนิยมสองนาที",
"isNew": false,
"era": 1,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "ตอนวาง ทิ้งการ์ดล้มเหลวทางยุทธวิธีของคุณออกจากเกมได้ 1 ใบ",
"sym": [
"arms"
]
},
{
"name": "ขุนนางสืบตระกูล",
"isNew": true,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ตอนนับคะแนนระบอบ ถ้าคุณเสมอกับรัฐอื่น คุณได้แต้มของอันดับสูงสุดในกลุ่มที่เสมอ ถ้ามีหลายรัฐในกลุ่มที่มีการ์ดนี้ ใช้กติกาเสมอปกติ",
"sym": [
"trad"
]
},
{
"name": "จันทราอารักษ์",
"isNew": true,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "เมื่อคุณเป็นผู้ป้องกันระบอบจากรัฐประหาร ฝ่ายคุณรวมพลังบวก 2",
"sym": [
"trad"
]
},
{
"name": "บริษัทร่วมทุน",
"isNew": true,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ตอนสร้างหรือผนวกโครงการ จ่ายเกรฟ 3 แทนสินค้า 1 หน่วยได้ กี่หน่วยก็ได้",
"sym": [
"com"
]
},
{
"name": "หอการค้า",
"isNew": true,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "เกณฑ์การค้ามูลค่าสูงลดลง 2 เกรฟเมื่อคุณเป็นผู้ซื้อ",
"sym": [
"com",
"wagon"
]
},
{
"name": "ตลาดแรงงานเสรี",
"isNew": true,
"era": 1,
"kind": "culture",
"cost": {
"grav": 3
},
"text": "ตอนสภาประชุม รับแรงงานได้ 2 ตัว จ่ายตามราคาบนรางทีละตัว",
"sym": [
"ppl"
]
},
{
"name": "กล้องส่องทางไกล",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณประกาศโจมตีรัฐอื่น ดูการ์ด 2 ใบบนสุดของกองทหารฝ่ายรับได้ก่อนจ่ายเสบียง แล้วยกเลิกการโจมตีได้ การ์ดแอคชันที่เล่นไปแล้วไม่คืน",
"sym": [
"arms"
]
},
{
"name": "ดาบปลายปืน",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณชนะการโจมตีรัฐอื่น เอาสินค้าเพิ่มอีก 1 หน่วยจากโครงการนั้นถ้ายังเหลือ",
"sym": [
"arms"
]
},
{
"name": "ตั๋วแลกเงิน",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณได้โบนัสจากการค้ามูลค่าสูง จั่ว 2 ใบ เลือก 1 อีกใบวางใต้กอง",
"sym": [
"com",
"wagon"
]
},
{
"name": "ประกันภัยทางทะเล",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อรัฐอื่นปล้นสินค้าจากโครงการของคุณ รับเกรฟ 1 ต่อหน่วยที่เสีย",
"sym": [
"com"
]
},
{
"name": "พงศาวดาร",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "ตอนเปลี่ยนยุค ถ้าคุณมีความชอบธรรมน้อยที่สุดหรือเสมอน้อยที่สุด รับความชอบธรรม 2",
"sym": [
"trad"
]
},
{
"name": "เครื่องสูบน้ำ",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 4
},
"text": "ตอนขั้นผลิต โครงการวัสดุหรือเชื้อเพลิงของคุณหนึ่งใบผลิตเพิ่ม 1",
"sym": [
"sci"
]
},
{
"name": "ระบบหมุนเวียนพืช",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "ตอนขั้นผลิต โครงการอาหารของคุณหนึ่งใบผลิตเพิ่ม 2 ใช้กับโครงการเดียวกับคันไถเหล็กได้",
"sym": [
"ppl"
]
},
{
"name": "คลองขุด",
"isNew": true,
"era": 1,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อคุณซื้อจากรัฐอื่นครบ 4 หน่วยในแอคชันเดียว ได้เกรฟคืน 2",
"sym": [
"wagon"
]
},
{
"name": "สถานีรถไฟ",
"isNew": false,
"era": 2,
"kind": "building",
"cost": {
"mat": 4,
"fuel": 1
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ซื้อสินค้าจากรัฐอื่นได้ 2 หน่วยทันที",
"sym": [
"wagon"
]
},
{
"name": "โรงทอไหมมานา",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 4,
"fuel": 1
},
"text": "กด จ่ายสินค้า 3 หน่วยจากโครงการนี้ รับเกรฟ 10",
"sym": [
"com"
]
},
{
"name": "โรงงานยุทธภัณฑ์",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 5,
"grav": 2
},
"text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 3 ใบ เลือก 1 เข้ากองทัพ แล้วทิ้งการ์ดทหารได้ 1 ใบ",
"sym": [
"arms"
]
},
{
"name": "โรงพยาบาลรัฐ",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 4,
"grav": 2
},
"text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับแรงงานตัวถัดไปบนรางทันทีโดยไม่จ่ายอาหาร นับเป็นการรับแรงงานของรอบนี้",
"sym": [
"ppl"
]
},
{
"name": "ห้องปฏิบัติการวิจัย",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 4,
"fuel": 1
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ เปิดการ์ดวิจัยใบบนสุด จ่ายต้นทุนแล้ววางได้ ไม่อย่างนั้นวางใต้กอง",
"sym": [
"sci"
]
},
{
"name": "โรงจักรไอน้ำมานา",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 5
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ โครงการนี้ผลิตเพิ่ม 3 หน่วยทันทีตามชนิดที่พิมพ์",
"sym": [
"sci"
]
},
{
"name": "พิพิธภัณฑ์แห่งชาติ",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 4,
"grav": 2
},
"text": "กด จ่ายวัสดุ 1 จากโครงการนี้ ถ้าคุณมีการ์ดวัฒนธรรมอย่างน้อย 3 ใบ รับเกรฟ 5",
"sym": [
"trad"
]
},
{
"name": "ป้อมบาเรียร์ริมน้ำ",
"isNew": true,
"era": 2,
"kind": "building",
"cost": {
"mat": 5,
"fuel": 1
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ การรบครั้งถัดไปที่คุณเป็นฝ่ายรับก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 3",
"sym": [
"arms"
]
},
{
"name": "ข้าราชการสืบทอด",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "ทุกครั้งที่คุณสร้างโครงการ รับเกรฟ 2",
"sym": [
"trad"
]
},
{
"name": "ฟื้นฟูวัฒนธรรมชาติ",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "การ์ดวัฒนธรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1",
"sym": [
"trad",
"trad"
]
},
{
"name": "มาตรฐานเกรฟฮาร์ธ",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "ราคาขายให้ตลาดกลางของคุณเพิ่ม 1 ทุกหน่วย",
"sym": [
"com",
"wagon"
]
},
{
"name": "สมาคมธนาคาร",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "ตอนสภาประชุม รับเกรฟ 1 ต่อเกรฟ 5 ในคลังของคุณ สูงสุด 3",
"sym": [
"com"
]
},
{
"name": "หม้อกลาง",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "ตอนสภาประชุม รับเกรฟ 1 ต่อแรงงานว่างงานของคุณ สูงสุด 3",
"sym": [
"ppl"
]
},
{
"name": "สื่อมวลชนเสรี",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "เมื่อคุณเล่นการทูต ขยับกระแสได้ 2 ช่อง จะเป็นสายเดียวกันหรือสองสายก็ได้",
"sym": [
"ppl"
]
},
{
"name": "กองทัพมหาชน",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "ปฏิรูปกองทัพของคุณจั่วเพิ่ม 1 ใบ",
"sym": [
"arms"
]
},
{
"name": "สถาบันวิศวกร",
"isNew": true,
"era": 2,
"kind": "culture",
"cost": {
"grav": 4
},
"text": "โครงการที่คุณสร้างหรือผนวกลดต้นทุน 1 หน่วยสินค้า",
"sym": [
"sci"
]
},
{
"name": "เครื่องจักรไอน้ำมานา",
"isNew": false,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4,
"fuel": 1
},
"text": "เมื่อโครงการที่มีวัตถุดิบนำเข้าของคุณผลิต ผลิตเพิ่ม 1",
"sym": [
"sci"
]
},
{
"name": "วอกโซโฟนทอดสัญญาณ",
"isNew": false,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 3
},
"text": "เมื่อมีรัฐประกาศโจมตีคุณ ฝ่ายคุณรวมพลังบวก 1",
"sym": [
"arms"
]
},
{
"name": "ลวดหนาม",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4
},
"text": "เมื่อคุณเป็นฝ่ายรับ การ์ดของผู้บุกไม่ได้โบนัสทะลวง",
"sym": [
"arms"
]
},
{
"name": "เรือกลไฟ",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4,
"fuel": 1
},
"text": "เมื่อคุณเล่นการค้าโหมดค้าขาย ความจุการซื้อเพิ่ม 2",
"sym": [
"wagon"
]
},
{
"name": "ปุ๋ยเคมี",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 5
},
"text": "ตอนขั้นผลิต โครงการอาหารของคุณสูงสุด 2 ใบผลิตเพิ่มใบละ 1",
"sym": [
"ppl"
]
},
{
"name": "ตลาดซื้อขายล่วงหน้า",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4
},
"text": "ตอนขั้นผลิต ถ้าโครงการทุกใบของคุณผลิตได้ รับเกรฟ 3",
"sym": [
"com",
"wagon"
]
},
{
"name": "เพลงชาติ",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4
},
"text": "เมื่อคุณชนะการรบในฐานะฝ่ายรับ รับความชอบธรรม 1",
"sym": [
"trad"
]
},
{
"name": "โคมไฟกริดมานา",
"isNew": true,
"era": 2,
"kind": "innovation",
"cost": {
"grav": 4
},
"text": "ตอนขั้นผลิต โครงการหนึ่งใบของคุณผลิตได้แม้แรงงานขาด 1 ตัว",
"sym": [
"sci"
]
},
{
"name": "ศูนย์กระจายสินค้า",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 5,
"fuel": 1
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ซื้อสินค้าจากรัฐอื่นได้ 3 หน่วยทันที",
"sym": [
"wagon"
]
},
{
"name": "โรงงานเครื่องใช้เวทมนตร์",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 6,
"grav": 2
},
"text": "กด จ่ายสินค้า 3 หน่วยจากโครงการนี้ รับเกรฟ 14",
"sym": [
"com"
]
},
{
"name": "ฐานเรือเหาะรบ",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 6,
"fuel": 2
},
"text": "กด จ่ายเชื้อเพลิง 2 จากโครงการนี้ การรบครั้งถัดไปของคุณก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 3",
"sym": [
"arms"
]
},
{
"name": "หอกระจายเสียงวอกโซโฟน",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 5,
"grav": 2
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ขยับกระแสสายใดก็ได้ 1 ช่อง",
"sym": [
"sci"
]
},
{
"name": "เคหะนอกกำแพงเดิม",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 6
},
"text": "กด จ่ายวัสดุ 2 จากโครงการนี้ รับเกรฟ 1 ต่อแรงงานที่ทำงานอยู่ของคุณ",
"sym": [
"ppl"
]
},
{
"name": "โรงแปรธาตุ",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 5,
"fuel": 2
},
"text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ รับวัสดุ 3 เข้าคลัง",
"sym": [
"sci"
]
},
{
"name": "อนุสาวรีย์แห่งชาติ",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 6
},
"text": "กด จ่ายวัสดุ 2 จากโครงการนี้ ขยับกระแสสายประเพณีขึ้น 1 ช่อง",
"sym": [
"trad"
]
},
{
"name": "ศูนย์บัญชาการทหาร",
"isNew": true,
"era": 3,
"kind": "building",
"cost": {
"mat": 5,
"grav": 2
},
"text": "กด จ่ายอาหาร 1 กับเชื้อเพลิง 1 จากโครงการนี้ รวมกองพักกับกองทหารแล้วสับใหม่ จากนั้นดูการ์ด 2 ใบบนสุด วางใบหนึ่งไว้ใต้กองได้",
"sym": [
"arms"
]
},
{
"name": "มรดกเกรสแลนด์",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "ตอนสภาประชุม ถ้าคุณมีการ์ดวัฒนธรรมมากที่สุดหรือเสมอมากที่สุด รับเกรฟ 3",
"sym": [
"trad"
]
},
{
"name": "ภาพยนตร์มานาแห่งชาติ",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "ตอนวาง ขยับกระแสสายใดก็ได้เพิ่มอีก 2 ช่อง แยกสายได้",
"sym": [
"trad"
]
},
{
"name": "การค้าเสรีทั่วเกรสแลนด์",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "ราคาซื้อจากตลาดกลางของคุณลด 1 ต่อหน่วย",
"sym": [
"com",
"wagon"
]
},
{
"name": "บรรษัทข้ามรัฐ",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 6
},
"text": "เมื่อรัฐอื่นซื้อสินค้าจากโครงการของคุณ รับเกรฟเพิ่ม 1 ต่อแอคชันของรัฐนั้น",
"sym": [
"com",
"wagon"
]
},
{
"name": "รัฐสวัสดิการ",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "รับแรงงานไม่ต้องจ่ายอาหาร ยังรับได้รอบละ 1 ตัวตามปกติ",
"sym": [
"ppl"
]
},
{
"name": "สิทธิเลือกตั้งทั่วไป",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "ตอนนับคะแนนระบอบ ถ้าคุณได้ 0 แต้ม รับความชอบธรรม 1",
"sym": [
"ppl"
]
},
{
"name": "หลักนิยมการรบแยกเดี่ยวฆ่าหมู่",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 5
},
"text": "เมื่อคุณเป็นผู้บุก ฝ่ายคุณรวมพลังบวก 1",
"sym": [
"arms"
]
},
{
"name": "มหาวิทยาลัยวิจัย",
"isNew": true,
"era": 3,
"kind": "culture",
"cost": {
"grav": 6
},
"text": "วิจัยจั่วเพิ่ม 2 ใบ",
"sym": [
"sci",
"sci"
]
},
{
"name": "คอมพิวเตอร์มานา",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 6,
"fuel": 1
},
"text": "เมื่อคุณวางการ์ดวิจัย ต้นทุนของใบนั้นลด 2 จะลดเกรฟหรือสินค้าก็ได้",
"sym": [
"sci"
]
},
{
"name": "เลนส์ขยายอาคม",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 5,
"fuel": 1
},
"text": "เมื่อมีรัฐประกาศโจมตีคุณ ดูการ์ด 3 ใบบนสุดของกองทหารของคุณ แล้ววางเรียงใหม่ได้",
"sym": [
"arms"
]
},
{
"name": "เครื่องยนต์มานาแรมเจ็ท",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 6,
"fuel": 1
},
"text": "ในแต่ละการรบ การ์ดเชื้อเพลิงใบแรกที่คุณเปิดไม่ต้องจ่ายเชื้อเพลิง",
"sym": [
"arms"
]
},
{
"name": "พืชเสริมมานา",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 5
},
"text": "ตอนขั้นผลิต โครงการอาหารของคุณสูงสุด 2 ใบผลิตเพิ่มใบละ 2",
"sym": [
"ppl"
]
},
{
"name": "ล็อตมาตรฐานกิลด์",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 5
},
"text": "เมื่อคุณซื้อจากรัฐอื่นครบ 4 หน่วยในแอคชันเดียว ได้เกรฟคืน 3",
"sym": [
"wagon"
]
},
{
"name": "เงินกู้จำนองสัมปทาน",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 5
},
"text": "เมื่อคุณจ่ายต้นทุนโครงการหรือการ์ดวิจัย ยืมเกรฟได้สูงสุด 5 แล้วคืน 7 ตอนสภาประชุมถัดไป คืนไม่ครบรับตราบาป 1",
"sym": [
"com"
]
},
{
"name": "เครื่องฉายภาพมานา",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 5
},
"text": "ตอนสภาประชุม ก่อนตรวจกระแส ขยับกระแสสายใดก็ได้ 1 ช่อง",
"sym": [
"trad"
]
},
{
"name": "เรือเหาะสำรวจ",
"isNew": true,
"era": 3,
"kind": "innovation",
"cost": {
"grav": 6,
"fuel": 1
},
"text": "เมื่อคุณประกาศบุกเบิก ดูการ์ดโครงการ 3 ใบบนสุดของกองยุคปัจจุบัน เลือก 1 ใบเป็นเป้า อีกสองใบวางกลับตามลำดับเดิม",
"sym": [
"sci"
]
}
],
"military": [
{
"name": "พลธนูยาว",
"era": 0,
"tier": 1,
"power": 2,
"kw": {
"fire": true
},
"count": 3,
"mv": 2.3,
"flavor": "ห่าธนูถล่มกองที่ข้าศึกเพิ่งส่งขึ้นมา"
},
{
"name": "กำแพงโล่",
"era": 0,
"tier": 1,
"power": 1,
"kw": {
"def": 2
},
"count": 3,
"mv": 2.0,
"flavor": "ยืนแน่นอยู่กับที่ รับศึกได้หนัก บุกเองไม่เก่ง"
},
{
"name": "ทหารม้าทวน",
"era": 0,
"tier": 1,
"power": 1,
"kw": {
"chg": 2
},
"count": 2,
"mv": 2.0,
"flavor": "พุ่งชนแนวได้แรง แต่ตั้งรับไม่ถนัด"
},
{
"name": "ไพร่พลเกณฑ์",
"era": 0,
"tier": 2,
"power": 2,
"kw": {
"surge": 2
},
"count": 3,
"mv": 3.0,
"flavor": "ชาวนาเกณฑ์จากหัวเมืองมาเป็นระลอก ระลอกหลังดันแนวแรงกว่าระลอกแรก"
},
{
"name": "ม้าเร็ว",
"era": 0,
"tier": 2,
"power": 2,
"kw": {
"scout": 2,
"chg": 1
},
"count": 3,
"mv": 3.2,
"flavor": "ลาดตระเวนล่วงหน้า รู้ก่อนว่ากองไหนจะได้ปะทะ แล้วตีปลายแถวที่อ่อน"
},
{
"name": "พลหน้าไม้",
"era": 0,
"tier": 2,
"power": 2,
"kw": {
"int": 2
},
"count": 2,
"mv": 3.3,
"flavor": "หน้าไม้ยิงทะลุเกราะ เล็งกองที่แข็งที่สุดของข้าศึก"
},
{
"name": "ทัพหนุน",
"era": 0,
"tier": 2,
"power": 1,
"kw": {
"reinf": true,
"def": 1
},
"count": 2,
"mv": 3.0,
"flavor": "กองหนุนที่ซุ่มไว้หลังเนิน โผล่มาเติมแนวกลางศึก"
},
{
"name": "ทหารผ่านศึกจักรวรรดิเก่า",
"era": 0,
"tier": 3,
"power": 4,
"kw": {},
"count": 2,
"mv": 4.0,
"flavor": "นักรบอาชีพ ไม่มีลูกเล่น แข็งตรงไปตรงมา"
},
{
"name": "อัศวินไชน์เดสเทรีย",
"era": 0,
"tier": 3,
"power": 3,
"kw": {
"chg": 2
},
"count": 2,
"mv": 4.0,
"flavor": "ม้าศึกไชน์เดสเทรียพาอัศวินเกราะหนักทะลวงแนวหน้า แต่ตั้งรับเองไม่ดี"
},
{
"name": "ขุนศึกแนวหน้า",
"era": 0,
"tier": 3,
"power": 3,
"kw": {
"lead": 2
},
"count": 2,
"mv": 3.9,
"flavor": "ขุนพลขี่นำหน้าทัพ ทหารที่ตามมาเห็นแล้วฮึกเหิม"
},
{
"name": "พลหอกยาว",
"era": 1,
"tier": 1,
"power": 2,
"kw": {
"def": 2
},
"count": 3,
"mv": 3.0,
"flavor": "ป่าหอกยาวกันทหารม้า บุกเองช้า"
},
{
"name": "ทหารม้าดรากูน",
"era": 1,
"tier": 1,
"power": 2,
"kw": {
"chg": 2
},
"count": 2,
"mv": 3.0,
"flavor": "ขี่ม้าเข้าตีเร็ว แต่ตั้งรับไม่แน่น"
},
{
"name": "พลปืนคาบศิลามานา",
"era": 1,
"tier": 1,
"power": 3,
"kw": {},
"count": 3,
"mv": 3.0,
"flavor": "ทหารปืนแถวหน้าแบบมาตรฐานของยุค"
},
{
"name": "ทหารราบแนวเส้น",
"era": 1,
"tier": 2,
"power": 3,
"kw": {
"surge": 1
},
"count": 3,
"mv": 3.7,
"flavor": "แถวหลังเดินหน้าเสริมแถวแรก ยิ่งเข้าแนวช้ายิ่งหนัก"
},
{
"name": "ทหารพราน",
"era": 1,
"tier": 2,
"power": 3,
"kw": {
"scout": 2
},
"count": 3,
"mv": 4.0,
"flavor": "พรานนำทางล่วงหน้า จัดลำดับการเดินทัพได้ทั้งของเราและของข้าศึก"
},
{
"name": "ทหารยิงแถวสลับ",
"era": 1,
"tier": 2,
"power": 3,
"kw": {
"fire": true
},
"count": 2,
"mv": 3.6,
"flavor": "ยิงสลับแถวไม่ขาดช่วง กดกองที่ข้าศึกเพิ่งส่งเข้ามา"
},
{
"name": "ทหารม้าเบา",
"era": 1,
"tier": 2,
"power": 2,
"kw": {
"reinf": true
},
"count": 2,
"mv": 4.3,
"flavor": "ม้าเบาวิ่งไปพากองหนุนมาเติมสนาม"
},
{
"name": "ทหารม้าเกราะ",
"era": 1,
"tier": 3,
"power": 5,
"kw": {},
"count": 2,
"mv": 5.0,
"flavor": "ทหารม้าหนักใส่เกราะอก แข็งตรงไปตรงมา"
},
{
"name": "ปืนใหญ่มานา",
"era": 1,
"tier": 3,
"power": 3,
"kw": {
"int": 3
},
"count": 2,
"mv": 5.0,
"flavor": "ยิงถล่มกองที่แข็งที่สุดของข้าศึก"
},
{
"name": "พลระเบิดบาลาเดียม",
"era": 1,
"tier": 3,
"power": 4,
"kw": {
"lead": 1
},
"count": 2,
"mv": 4.8,
"flavor": "หน่วยระเบิดมือเปิดทาง ทหารที่ตามหลังบุกได้แรงขึ้น"
},
{
"name": "ทหารราบไรเฟิลมานา",
"era": 2,
"tier": 1,
"power": 4,
"kw": {},
"count": 3,
"mv": 4.0,
"flavor": "ทหารราบมาตรฐานของยุคกริดมานา"
},
{
"name": "แนวบาเรียร์สนามเพลาะ",
"era": 2,
"tier": 1,
"power": 3,
"kw": {
"def": 2
},
"count": 3,
"mv": 4.0,
"flavor": "บาเรียร์ประจำสนามเพลาะ ตั้งรับร้ายกาจ บุกยาก"
},
{
"name": "ทหารรถไฟ",
"era": 2,
"tier": 1,
"power": 1,
"kw": {
"reinf": true
},
"count": 2,
"mv": 4.1,
"flavor": "รถไฟลำเลียงกองหนุนถึงสนามกลางศึก"
},
{
"name": "ทหารเกณฑ์",
"era": 2,
"tier": 2,
"power": 4,
"kw": {
"surge": 1
},
"count": 3,
"mv": 5.1,
"flavor": "กองทัพมหาชน เดินมาเป็นระลอก"
},
{
"name": "หน่วยส่งกำลังบำรุง",
"era": 2,
"tier": 2,
"power": 3,
"kw": {
"sup": 3
},
"count": 3,
"mv": 5.0,
"flavor": "ขบวนเสบียงและศิลาเวทที่ทำให้กองหนักเคลื่อนได้"
},
{
"name": "ปืนกลมานาประจำที่",
"era": 2,
"tier": 2,
"power": 4,
"kw": {
"fire": true
},
"count": 2,
"mv": 5.0,
"flavor": "ยิงพังโล่ไม่ขาดช่วง กวาดกองที่เพิ่งโผล่ขึ้นมาจากแนว"
},
{
"name": "บอลลูนมานาตรวจการณ์",
"era": 2,
"tier": 2,
"power": 4,
"kw": {
"scout": 2
},
"count": 2,
"mv": 5.3,
"flavor": "ตาบนฟ้าเห็นการวางกำลังทั้งของเราและของข้าศึก"
},
{
"name": "ปืนใหญ่ลากจูงไอน้ำ",
"era": 2,
"tier": 3,
"power": 5,
"kw": {
"fuel": true,
"int": 2
},
"count": 2,
"mv": 6.6,
"flavor": "ปืนใหญ่หนักที่ต้องเผาศิลาเวทลาก"
},
{
"name": "หน่วยหอกอัสนี",
"era": 2,
"tier": 3,
"power": 5,
"kw": {
"lead": 1
},
"count": 2,
"mv": 6.0,
"flavor": "หอกอัสนีเจาะบาเรียร์ เปิดช่องให้ทั้งแนว"
},
{
"name": "เรือปืนท้องแบน",
"era": 2,
"tier": 3,
"power": 6,
"kw": {
"fuel": true,
"chg": 1
},
"count": 2,
"mv": 6.5,
"flavor": "ป้อมเหล็กลอยน้ำติดปืนใหญ่มานา บุกแรงแต่กินเชื้อเพลิง"
},
{
"name": "กองกำลังอาสา",
"era": 3,
"tier": 1,
"power": 4,
"kw": {
"def": 2
},
"count": 3,
"mv": 5.0,
"flavor": "อาสาสมัครรักษาบ้านเกิด สู้ยิบตาเมื่อมีคนบุกบ้าน"
},
{
"name": "ทหารราบยานเกราะล้อยาง",
"era": 3,
"tier": 1,
"power": 5,
"kw": {
"fuel": true,
"chg": 1
},
"count": 3,
"mv": 5.5,
"flavor": "ทหารราบบนยานเกราะล้อยาง เคลื่อนเร็วแต่ต้องเติมผลึก"
},
{
"name": "ปืนใหญ่อัตตาจร",
"era": 3,
"tier": 1,
"power": 4,
"kw": {
"fire": true
},
"count": 2,
"mv": 5.3,
"flavor": "ปืนใหญ่บนสายพาน ยิงตามแนวรุกได้ทัน"
},
{
"name": "กองเรือลำเลียงผลึก",
"era": 3,
"tier": 2,
"power": 4,
"kw": {
"sup": 3
},
"count": 3,
"mv": 6.2,
"flavor": "ล่องเรือส่งผลึกถึงแนวหน้าให้ยานเกราะวิ่งต่อได้"
},
{
"name": "หน่วยต่อต้านรถถัง",
"era": 3,
"tier": 2,
"power": 4,
"kw": {
"int": 2
},
"count": 3,
"mv": 5.7,
"flavor": "อาวุธต่อสู้รถถังที่เล็งยานที่หนักที่สุด"
},
{
"name": "หน่วยดักสายวอกโซโฟน",
"era": 3,
"tier": 2,
"power": 5,
"kw": {
"scout": 1
},
"count": 2,
"mv": 6.1,
"flavor": "ดักฟังสายวอกโซโฟน รู้ว่ากองไหนจะออกมา ทั้งของเราและของข้าศึก"
},
{
"name": "หน่วยโดดเรือเหาะ",
"era": 3,
"tier": 2,
"power": 2,
"kw": {
"reinf": true
},
"count": 2,
"mv": 6.1,
"flavor": "โดดจากเรือเหาะลงหลังแนวข้าศึกกลางศึก"
},
{
"name": "รถถัง",
"era": 3,
"tier": 3,
"power": 7,
"kw": {
"fuel": true,
"chg": 1
},
"count": 2,
"mv": 7.5,
"flavor": "หัวหอกยานเกราะ ไม่มีผลึกก็เป็นเหล็กกองหนึ่ง"
},
{
"name": "กองพันเวทมนตร์สนาม",
"era": 3,
"tier": 3,
"power": 4,
"kw": {
"lead": 2
},
"count": 2,
"mv": 6.8,
"flavor": "นักเวทสนามกางบาเรียร์และเวทเสริมให้กองที่ตามเข้ามา"
},
{
"name": "เรือเหาะทิ้งระเบิด",
"era": 3,
"tier": 3,
"power": 6,
"kw": {
"fuel": true,
"fire": true
},
"count": 2,
"mv": 7.6,
"flavor": "ครองฟ้าแล้วถล่มกองที่ข้าศึกเพิ่งส่งขึ้นมา"
}
],
"starterArmy": [
{
"name": "พลหอก",
"era": -1,
"tier": 0,
"power": 1,
"kw": {},
"count": 5,
"mv": 1.0,
"flavor": "ทหารหอกประจำรัฐ"
},
{
"name": "พลธนู",
"era": -1,
"tier": 0,
"power": 2,
"kw": {},
"count": 3,
"mv": 2.0,
"flavor": "พลธนูประจำรัฐ"
},
{
"name": "ล้มเหลวทางยุทธวิธี",
"era": -1,
"tier": 0,
"power": 0,
"kw": {
"keep": true
},
"count": 2,
"mv": 0.0,
"flavor": "คำสั่งที่ผิดพลาด ทหารที่หลงทาง และจังหวะที่พลาดไปในสนามรบ"
}
],
"neutral": [
{
"name": "ล้มเหลวทางยุทธวิธี",
"count": 2,
"power": [
0,
0,
0,
0
]
},
{
"name": "ยามรับจ้าง",
"count": 5,
"power": [
1,
2,
3,
4
]
},
{
"name": "มือปืนเสื้อคลุมน้ำเงิน",
"count": 2,
"power": [
2,
2,
4,
5
]
},
{
"name": "หน่วยเงาเสื้อคลุมน้ำเงิน",
"count": 1,
"power": [
3,
5,
5,
7
]
}
],
"regimes": [
{
"name": "ราชาธิปไตย",
"set": "classic",
"line": "trad",
"metric": "จำนวนการ์ดวัฒนธรรม",
"policy": "การ์ดวัฒนธรรมราคาลด 1 เกรฟ",
"base": "arms"
},
{
"name": "สาธารณรัฐพ่อค้า",
"set": "classic",
"line": "com",
"metric": "เกรฟในคลัง",
"policy": "ความจุการซื้อเพิ่ม 1",
"base": "trad"
},
{
"name": "ประชาคมเสรี",
"set": "classic",
"line": "ppl",
"metric": "จำนวนแรงงานทั้งหมด",
"policy": "รับแรงงานถูกลง 1 อาหาร ต่ำสุด 1",
"base": "sci"
},
{
"name": "ระบอบขุนศึก",
"set": "classic",
"line": "arms",
"metric": "จำนวนการ์ดในกองทัพ",
"policy": "บัญชาการทัพไม่ต้องจ่ายเสบียง ผู้บุกที่ชนะได้ความชอบธรรม 1",
"base": "ppl"
},
{
"name": "ปราชญาธิปไตย",
"set": "classic",
"line": "sci",
"metric": "จำนวนการ์ดนวัตกรรม",
"policy": "วิจัยจั่ว 4 เลือก 1",
"base": "com"
},
{
"name": "ชาตินิยม",
"set": "modern",
"line": "trad",
"metric": "จำนวนโครงการ",
"policy": "ฝ่ายรับได้พลังเพิ่ม 2",
"base": "com"
},
{
"name": "มานาเสรี",
"set": "modern",
"line": "com",
"metric": "จำนวนสิ่งปลูกสร้าง",
"policy": "ราคาขายให้ตลาดกลางเพิ่ม 1",
"base": "arms"
},
{
"name": "ประชาธิปไตยสังคม",
"set": "modern",
"line": "ppl",
"metric": "อาหารบนโครงการรวมกับในคลัง",
"policy": "ผู้บุกรัฐอื่นรับตราบาป 1 ใบแม้ชนะ",
"base": "trad"
},
{
"name": "รัฐบาลทหาร",
"set": "modern",
"line": "arms",
"metric": "การ์ดทหารยุค III ขึ้นไปในกองทัพ",
"policy": "ปฏิรูปกองทัพจั่ว 4 เลือก 1 และทิ้งได้ 2 ใบ",
"base": "sci"
},
{
"name": "เทคโนแครต",
"set": "modern",
"line": "sci",
"metric": "การ์ดวิจัยทั้งหมด",
"policy": "การ์ดนวัตกรรมราคาลด 2 เกรฟ",
"base": "ppl"
}
],
"bonus": [
{
"text": "รับสินค้าชนิดใดก็ได้ 2 หน่วยเข้าคลัง",
"count": 6
},
{
"text": "รับเกรฟ 3",
"count": 5
},
{
"text": "โครงการถัดไปที่คุณสร้างในรอบนี้ลดต้นทุน 2 หน่วยสินค้า วางค้างไว้จนใช้หรือจบรอบ",
"count": 4
},
{
"text": "ขยับกระแสสายใดก็ได้ 1 ช่อง",
"count": 4
},
{
"text": "จั่วการ์ดทหาร 2 ใบ เลือก 1 เข้ากองทัพ",
"count": 3
},
{
"text": "ความชอบธรรม 1",
"count": 3
},
{
"text": "ทิ้งตราบาปของคุณ 1 ใบ ถ้าไม่มีรับเกรฟ 2",
"count": 3
},
{
"text": "รับแรงงานตัวถัดไปบนรางทันทีโดยไม่จ่ายอาหาร",
"count": 2
}
],
"eras": [
{
"id": "I",
"name": "ตั้งรกราก",
"rank4": [
2,
1,
0,
0
],
"rank3": [
2,
1,
0
],
"buy": 3,
"sell": 1,
"hv": 6
},
{
"id": "II",
"name": "ปฏิรูป",
"rank4": [
3,
2,
1,
0
],
"rank3": [
3,
1,
0
],
"buy": 4,
"sell": 1,
"hv": 8
},
{
"id": "III",
"name": "กริดมานา",
"rank4": [
4,
2,
1,
0
],
"rank3": [
4,
2,
0
],
"buy": 4,
"sell": 2,
"hv": 10
},
{
"id": "IV",
"name": "เฟื่องฟู",
"rank4": [
5,
3,
1,
0
],
"rank3": [
5,
2,
0
],
"buy": 5,
"sell": 2,
"hv": 12
}
]
};

var KDATA03 = {"projects": [{"name": "ทุ่งนาลุ่มน้ำ", "isNew": false, "era": 0, "cost": {"mat": 3, "food": 3, "grav": 1}, "inp": {}, "out": "food", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 4, "sym": ["ppl"]}, {"name": "สวนผลไม้เชิงเขา", "isNew": true, "era": 0, "cost": {"mat": 4, "food": 1}, "inp": {}, "out": "food", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 2, "sym": []}, {"name": "หมู่บ้านชาวประมง", "isNew": true, "era": 0, "cost": {"mat": 4, "grav": 2}, "inp": {}, "out": "food", "outN": 2, "workers": 1, "slots": 0, "sale": 3, "mil": 3, "sym": ["ppl"]}, {"name": "ทุ่งไบซันยักษ์", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 1}, "inp": {}, "out": "food", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["arms"]}, {"name": "นาหลวง", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "food", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 4, "sym": ["trad"]}, {"name": "เหมืองหินริมเขา", "isNew": false, "era": 0, "cost": {"mat": 4, "food": 1}, "inp": {}, "out": "mat", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "ป่าไม้เหล็กริมน้ำ", "isNew": true, "era": 0, "cost": {"food": 4, "grav": 2}, "inp": {}, "out": "mat", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 2, "sym": []}, {"name": "บ่อดินเหนียว", "isNew": true, "era": 0, "cost": {"mat": 3, "food": 3}, "inp": {}, "out": "mat", "outN": 2, "workers": 1, "slots": 0, "sale": 3, "mil": 2, "sym": []}, {"name": "เหมืองเหล็กโบราณ", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "mat", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 4, "sym": ["arms"]}, {"name": "ลานตัดศิลา", "isNew": true, "era": 0, "cost": {"mat": 4, "food": 1, "grav": 2}, "inp": {}, "out": "mat", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["trad"]}, {"name": "เตาเผาถ่าน", "isNew": false, "era": 0, "cost": {"mat": 4, "grav": 2}, "inp": {}, "out": "fuel", "outN": 2, "workers": 1, "slots": 0, "sale": 3, "mil": 2, "sym": []}, {"name": "ป่าฟืน", "isNew": true, "era": 0, "cost": {"mat": 3, "food": 3}, "inp": {}, "out": "fuel", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 2, "sym": []}, {"name": "บ่อน้ำมันดิน", "isNew": true, "era": 0, "cost": {"mat": 4, "food": 1, "grav": 1}, "inp": {}, "out": "fuel", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["sci"]}, {"name": "ป่าชายเลน", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 1}, "inp": {}, "out": "fuel", "outN": 2, "workers": 1, "slots": 0, "sale": 3, "mil": 3, "sym": []}, {"name": "ซากถนนหลวง", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "fuel", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 4, "sym": ["sci"]}, {"name": "ตลาดนัดหัวเมือง", "isNew": true, "era": 0, "cost": {"mat": 3, "food": 1, "grav": 2}, "inp": {}, "out": "grav", "outN": 2, "workers": 1, "slots": 1, "sale": null, "mil": 2, "sym": ["com"]}, {"name": "ท่าเรือการค้า", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 1, "grav": 1}, "inp": {}, "out": "grav", "outN": 2, "workers": 1, "slots": 1, "sale": null, "mil": 3, "sym": ["com"]}, {"name": "ด่านเก็บภาษี", "isNew": true, "era": 0, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "grav", "outN": 3, "workers": 1, "slots": 0, "sale": null, "mil": 4, "sym": []}, {"name": "นาข้าวชลประทาน", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 3, "grav": 2}, "inp": {}, "out": "food", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": ["ppl"]}, {"name": "ไร่อ้อย", "isNew": true, "era": 1, "cost": {"mat": 7, "food": 1}, "inp": {}, "out": "food", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["com"]}, {"name": "ฟาร์มโคอำพัน", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "food", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "สวนเครื่องเทศ", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 1, "grav": 3}, "inp": {}, "out": "food", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "ที่ดินตระกูลรีฟเก่า", "isNew": true, "era": 1, "cost": {"mat": 7, "food": 3, "grav": 2}, "inp": {}, "out": "food", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": ["trad"]}, {"name": "โรงเลื่อยพลังน้ำ", "isNew": false, "era": 1, "cost": {"mat": 5, "fuel": 1, "food": 1}, "inp": {}, "out": "mat", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 3, "sym": []}, {"name": "เหมืองหินอ่อน", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 3, "grav": 2}, "inp": {}, "out": "mat", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "โรงหล่อโลหะ", "isNew": true, "era": 1, "cost": {"mat": 4, "fuel": 3, "food": 1}, "inp": {}, "out": "mat", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["sci"]}, {"name": "เหมืองเหล็ก", "isNew": true, "era": 1, "cost": {"mat": 7, "food": 3, "grav": 2}, "inp": {}, "out": "mat", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": ["arms"]}, {"name": "ป่าไม้สัมปทาน", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 3, "grav": 3}, "inp": {}, "out": "mat", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": []}, {"name": "เหมืองศิลาเวท", "isNew": false, "era": 1, "cost": {"mat": 7, "food": 1}, "inp": {}, "out": "fuel", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "เตาถ่านหลวง", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 3}, "inp": {}, "out": "fuel", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": []}, {"name": "โรงหีบน้ำมันพืช", "isNew": true, "era": 1, "cost": {"mat": 5, "food": 4}, "inp": {}, "out": "fuel", "outN": 3, "workers": 1, "slots": 1, "sale": 3, "mil": 3, "sym": ["ppl"]}, {"name": "เหมืองผลึกมานา", "isNew": true, "era": 1, "cost": {"mat": 8, "food": 3}, "inp": {}, "out": "fuel", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": ["sci"]}, {"name": "ป่าสนเรซิน", "isNew": true, "era": 1, "cost": {"mat": 7, "food": 1, "grav": 3}, "inp": {}, "out": "fuel", "outN": 4, "workers": 2, "slots": 2, "sale": 3, "mil": 4, "sym": ["arms"]}, {"name": "ตลาดนัดชายแดน", "isNew": false, "era": 1, "cost": {"mat": 4, "food": 3, "grav": 3}, "inp": {}, "out": "grav", "outN": 3, "workers": 1, "slots": 1, "sale": null, "mil": 4, "sym": ["com"]}, {"name": "โรงกษาปณ์", "isNew": true, "era": 1, "cost": {"mat": 5, "fuel": 1, "grav": 3}, "inp": {}, "out": "grav", "outN": 3, "workers": 1, "slots": 1, "sale": null, "mil": 3, "sym": ["trad"]}, {"name": "บริษัทการค้าทางทะเล", "isNew": true, "era": 1, "cost": {"mat": 7, "food": 1, "grav": 4}, "inp": {}, "out": "grav", "outN": 4, "workers": 2, "slots": 2, "sale": null, "mil": 4, "sym": []}, {"name": "ฟาร์มรวม", "isNew": false, "era": 2, "cost": {"mat": 7, "fuel": 1, "food": 3}, "inp": {}, "out": "food", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 3, "sym": ["ppl"]}, {"name": "ไร่รวงอำพันจักรกล", "isNew": true, "era": 2, "cost": {"mat": 8, "fuel": 3}, "inp": {"fuel": 1}, "out": "food", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["sci"]}, {"name": "โรงงานอาหารกระป๋อง", "isNew": true, "era": 2, "cost": {"mat": 8, "fuel": 1, "grav": 3}, "inp": {"fuel": 1}, "out": "food", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["arms"]}, {"name": "ไร่ปศุสัตว์ขนาดใหญ่", "isNew": true, "era": 2, "cost": {"mat": 8, "food": 3, "grav": 3}, "inp": {}, "out": "food", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": []}, {"name": "ไร่ชาบนที่สูง", "isNew": true, "era": 2, "cost": {"mat": 9, "food": 1, "grav": 3}, "inp": {}, "out": "food", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": ["com"]}, {"name": "โรงถลุงเหล็ก", "isNew": false, "era": 2, "cost": {"mat": 8, "fuel": 3, "grav": 2}, "inp": {"fuel": 1}, "out": "mat", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["sci"]}, {"name": "โรงงานซีเมนต์", "isNew": true, "era": 2, "cost": {"mat": 8, "fuel": 3, "grav": 3}, "inp": {"fuel": 1}, "out": "mat", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 3, "sym": []}, {"name": "เหมืองทองแดง", "isNew": true, "era": 2, "cost": {"mat": 9, "food": 3}, "inp": {}, "out": "mat", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": []}, {"name": "โรงอิฐเครื่องจักร", "isNew": true, "era": 2, "cost": {"mat": 7, "fuel": 3, "food": 3}, "inp": {"fuel": 1}, "out": "mat", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": ["ppl"]}, {"name": "ป่าไม้ทางรถไฟ", "isNew": true, "era": 2, "cost": {"mat": 8, "food": 3, "grav": 3}, "inp": {}, "out": "mat", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 3, "sym": []}, {"name": "เหมืองศิลาเวทอุตสาหกรรม", "isNew": false, "era": 2, "cost": {"mat": 9, "food": 3}, "inp": {}, "out": "fuel", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": []}, {"name": "โรงอัดประจุศิลาเวท", "isNew": true, "era": 2, "cost": {"mat": 8, "food": 1, "grav": 3}, "inp": {}, "out": "fuel", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["sci"]}, {"name": "เหมืองศิลาเวทตราศาสนจักร", "isNew": true, "era": 2, "cost": {"mat": 9, "food": 1, "grav": 3}, "inp": {}, "out": "fuel", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["trad"]}, {"name": "เหมืองศิลาเวทเขตแดนผี", "isNew": true, "era": 2, "cost": {"mat": 8, "food": 3}, "inp": {}, "out": "fuel", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 3, "sym": []}, {"name": "ท่าเติมผลึกกองเรือลำน้ำ", "isNew": true, "era": 2, "cost": {"mat": 9, "food": 3, "grav": 3}, "inp": {}, "out": "fuel", "outN": 5, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": ["arms"]}, {"name": "ธนาคารพาณิชย์", "isNew": true, "era": 2, "cost": {"mat": 8, "food": 1, "grav": 6}, "inp": {}, "out": "grav", "outN": 5, "workers": 2, "slots": 2, "sale": null, "mil": 4, "sym": ["com"]}, {"name": "ท่าเรือน้ำลึก", "isNew": true, "era": 2, "cost": {"mat": 9, "fuel": 1, "grav": 3}, "inp": {}, "out": "grav", "outN": 4, "workers": 2, "slots": 2, "sale": null, "mil": 5, "sym": []}, {"name": "ชุมทางรถไฟและเรือเหาะ", "isNew": true, "era": 2, "cost": {"mat": 9, "fuel": 3}, "inp": {"fuel": 1}, "out": "grav", "outN": 5, "workers": 2, "slots": 2, "sale": null, "mil": 4, "sym": ["trad"]}, {"name": "ฟาร์มอุตสาหกรรม", "isNew": true, "era": 3, "cost": {"mat": 10, "fuel": 3}, "inp": {"fuel": 1}, "out": "food", "outN": 7, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": ["sci"]}, {"name": "สหกรณ์การเกษตร", "isNew": true, "era": 3, "cost": {"mat": 10, "food": 3, "grav": 3}, "inp": {}, "out": "food", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["ppl"]}, {"name": "โรงงานแปรรูปอาหาร", "isNew": true, "era": 3, "cost": {"mat": 9, "fuel": 3, "grav": 4}, "inp": {"fuel": 1}, "out": "food", "outN": 7, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": ["com"]}, {"name": "นิคมผู้ตั้งรกราก", "isNew": true, "era": 3, "cost": {"mat": 10, "food": 4}, "inp": {}, "out": "food", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": []}, {"name": "ฟาร์มชลประทานเขื่อน", "isNew": true, "era": 3, "cost": {"mat": 12, "fuel": 1, "grav": 4}, "inp": {}, "out": "food", "outN": 6, "workers": 2, "slots": 3, "sale": 2, "mil": 6, "sym": ["trad"]}, {"name": "นิคมอุตสาหกรรม", "isNew": false, "era": 3, "cost": {"mat": 12, "fuel": 4}, "inp": {"fuel": 1}, "out": "mat", "outN": 7, "workers": 2, "slots": 3, "sale": 2, "mil": 5, "sym": ["sci"]}, {"name": "โรงงานเหล็กกล้า", "isNew": true, "era": 3, "cost": {"mat": 10, "fuel": 4, "grav": 2}, "inp": {"fuel": 1}, "out": "mat", "outN": 7, "workers": 2, "slots": 3, "sale": 2, "mil": 6, "sym": ["arms"]}, {"name": "เหมืองมิทริลเปิด", "isNew": true, "era": 3, "cost": {"mat": 12, "food": 3}, "inp": {}, "out": "mat", "outN": 6, "workers": 2, "slots": 3, "sale": 2, "mil": 5, "sym": []}, {"name": "โรงงานปูนซีเมนต์ใหญ่", "isNew": true, "era": 3, "cost": {"mat": 10, "fuel": 3}, "inp": {"fuel": 1}, "out": "mat", "outN": 7, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["ppl"]}, {"name": "สวนป่าเศรษฐกิจ", "isNew": true, "era": 3, "cost": {"mat": 9, "food": 3, "grav": 4}, "inp": {}, "out": "mat", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": []}, {"name": "สายแร่มานาเซฟไฟน์", "isNew": false, "era": 3, "cost": {"mat": 10, "fuel": 3, "grav": 4}, "inp": {}, "out": "fuel", "outN": 6, "workers": 2, "slots": 3, "sale": 2, "mil": 6, "sym": []}, {"name": "โรงกลั่นมานาข้น", "isNew": true, "era": 3, "cost": {"mat": 12, "fuel": 3, "grav": 2}, "inp": {}, "out": "fuel", "outN": 6, "workers": 2, "slots": 3, "sale": 2, "mil": 5, "sym": ["com"]}, {"name": "เขื่อนไฟฟ้าพลังน้ำ", "isNew": true, "era": 3, "cost": {"mat": 13, "grav": 4}, "inp": {}, "out": "fuel", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["sci"]}, {"name": "หอคอยมหากังหัน", "isNew": true, "era": 3, "cost": {"mat": 12, "food": 1, "grav": 3}, "inp": {}, "out": "fuel", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 5, "sym": []}, {"name": "คลังผลึกยุทธศาสตร์", "isNew": true, "era": 3, "cost": {"mat": 12, "food": 3}, "inp": {}, "out": "fuel", "outN": 6, "workers": 2, "slots": 2, "sale": 2, "mil": 4, "sym": ["arms"]}, {"name": "หอทะเบียนสัมปทาน", "isNew": false, "era": 3, "cost": {"mat": 8, "food": 3, "grav": 8}, "inp": {}, "out": "grav", "outN": 6, "workers": 2, "slots": 2, "sale": null, "mil": 4, "sym": ["com"]}, {"name": "ท่าเรือเหาะนานาชาติ", "isNew": true, "era": 3, "cost": {"mat": 10, "fuel": 3, "grav": 4}, "inp": {}, "out": "grav", "outN": 6, "workers": 2, "slots": 2, "sale": null, "mil": 5, "sym": []}, {"name": "คลังอินกอธ", "isNew": true, "era": 3, "cost": {"mat": 9, "food": 3, "grav": 6}, "inp": {}, "out": "grav", "outN": 6, "workers": 2, "slots": 2, "sale": null, "mil": 6, "sym": ["trad"]}], "startProjects": [{"name": "ไร่บรรพบุรุษ", "isNew": false, "era": -1, "cost": {}, "inp": {}, "out": "food", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 2, "sym": []}, {"name": "ป่าตัดไม้", "isNew": false, "era": -1, "cost": {}, "inp": {}, "out": "mat", "outN": 2, "workers": 1, "slots": 1, "sale": 3, "mil": 2, "sym": []}], "research": [{"name": "โรงสี", "isNew": false, "era": 0, "kind": "building", "cost": {"mat": 2, "grav": 1}, "text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับเกรฟ 4", "sym": ["ppl"]}, {"name": "โรงตีเหล็ก", "isNew": false, "era": 0, "kind": "building", "cost": {"mat": 4, "grav": 1}, "text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 2 ใบ เลือก 1 เข้ากองทัพ", "sym": ["arms"]}, {"name": "ยุ้งฉาง", "isNew": false, "era": 0, "kind": "building", "cost": {"mat": 2, "grav": 1}, "text": "กด ย้ายสินค้าได้สูงสุด 2 หน่วยจากโครงการนี้เข้าคลัง", "sym": ["wagon"]}, {"name": "โบสถ์ประจำเมือง", "isNew": true, "era": 0, "kind": "building", "cost": {"mat": 4, "grav": 1}, "text": "กด จ่ายอาหาร 1 จากโครงการนี้ ขยับกระแสสายประเพณีขึ้น 1 ช่อง", "sym": ["trad"]}, {"name": "โรงรับจำนำ", "isNew": true, "era": 0, "kind": "building", "cost": {"mat": 2, "grav": 1}, "text": "กด จ่ายเกรฟ 2 รับสินค้าชนิดใดก็ได้ 1 หน่วยเข้าคลัง", "sym": ["com"]}, {"name": "ค่ายฝึกทหาร", "isNew": true, "era": 0, "kind": "building", "cost": {"mat": 2, "grav": 1}, "text": "กด จ่ายอาหาร 1 จากโครงการนี้ รวมกองพักกับกองทหารของคุณแล้วสับใหม่", "sym": ["arms"]}, {"name": "กังหันน้ำ", "isNew": true, "era": 0, "kind": "building", "cost": {"mat": 4, "grav": 1}, "text": "กด โครงการนี้ผลิตเพิ่ม 1 หน่วยทันทีตามชนิดที่พิมพ์ ไม่ต้องใช้แรงงานหรือวัตถุดิบนำเข้า", "sym": ["sci"]}, {"name": "ท่าเทียบเรือ", "isNew": true, "era": 0, "kind": "building", "cost": {"mat": 4, "grav": 1}, "text": "กด จ่ายสินค้า 1 หน่วยจากโครงการนี้ รับเกรฟเท่าราคาซื้อของตลาดกลางในยุคปัจจุบัน", "sym": ["wagon"]}, {"name": "ขนบราชสำนัก", "isNew": false, "era": 0, "kind": "culture", "cost": {"grav": 5}, "text": "ทุกครั้งที่คุณสร้างโครงการ รับเกรฟ 1", "sym": ["trad"]}, {"name": "จารีตตระกูล", "isNew": true, "era": 0, "kind": "culture", "cost": {"grav": 3}, "text": "การ์ดวัฒนธรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1", "sym": ["trad"]}, {"name": "สมาพันธ์พ่อค้า", "isNew": false, "era": 0, "kind": "culture", "cost": {"grav": 5}, "text": "ราคาขายบนโครงการของคุณทุกใบเพิ่ม 1", "sym": ["com", "wagon"]}, {"name": "กฎหมายตราชั่ง", "isNew": true, "era": 0, "kind": "culture", "cost": {"grav": 3}, "text": "เมื่อคุณขายให้ตลาดกลาง ได้เกรฟเพิ่ม 1 ต่อหน่วย สูงสุด 3 หน่วยต่อแอคชัน", "sym": ["com"]}, {"name": "สภาหมู่บ้าน", "isNew": false, "era": 0, "kind": "culture", "cost": {"grav": 3}, "text": "รับแรงงานถูกลง 1 อาหาร ต่ำสุด 1", "sym": ["ppl"]}, {"name": "ยุ้งข้าวชุมชน", "isNew": true, "era": 0, "kind": "culture", "cost": {"grav": 3}, "text": "คลังสินค้าของคุณจุเพิ่ม 2 ช่อง", "sym": ["ppl"]}, {"name": "ประเพณีนักรบ", "isNew": false, "era": 0, "kind": "culture", "cost": {"grav": 3}, "text": "พลหอกของคุณได้ตั้งรับ 1", "sym": ["arms"]}, {"name": "หอตำรา", "isNew": true, "era": 0, "kind": "culture", "cost": {"grav": 5}, "text": "การ์ดนวัตกรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1", "sym": ["sci"]}, {"name": "เกวียนล้อเหล็ก", "isNew": false, "era": 0, "kind": "innovation", "cost": {"grav": 3}, "text": "เมื่อคุณซื้อจากรัฐอื่นครบ 3 หน่วยในแอคชันเดียว ได้เกรฟคืน 1", "sym": ["wagon"]}, {"name": "เรือท้องแบน", "isNew": true, "era": 0, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณซื้อจากตลาดกลาง ราคาลด 1 ต่อหน่วย", "sym": ["wagon"]}, {"name": "สมุดบัญชีคู่", "isNew": true, "era": 0, "kind": "innovation", "cost": {"grav": 3}, "text": "เมื่อรัฐอื่นซื้อจากโครงการของคุณครบ 3 หน่วยในแอคชันเดียว รับเกรฟเพิ่ม 1", "sym": ["com"]}, {"name": "หมุดเงิน", "isNew": false, "era": 0, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณชนะการบุกเบิก จั่วการ์ดโบนัส 1 ใบ", "sym": ["arms"]}, {"name": "คันไถเหล็ก", "isNew": false, "era": 0, "kind": "innovation", "cost": {"grav": 3}, "text": "ตอนขั้นผลิต โครงการอาหารของคุณหนึ่งใบผลิตเพิ่ม 1", "sym": ["ppl"]}, {"name": "ปฏิทินสิบสามห้วง", "isNew": true, "era": 0, "kind": "innovation", "cost": {"grav": 3}, "text": "เมื่อคุณวิจัยแล้วไม่เลือกใบใด รับเกรฟ 4 แทน 2", "sym": ["sci"]}, {"name": "นาฬิกาน้ำ", "isNew": true, "era": 0, "kind": "innovation", "cost": {"grav": 3}, "text": "เมื่อคุณเป็นรัฐสุดท้ายที่เล่นการทูตในรอบนั้น รับเกรฟ 2", "sym": ["sci"]}, {"name": "ตราประทับหลวง", "isNew": true, "era": 0, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณเป็นผู้เลือกระบอบตอนเปลี่ยนยุค รับความชอบธรรม 1", "sym": ["trad"]}, {"name": "แท่นพิมพ์เวทมนตร์", "isNew": false, "era": 1, "kind": "building", "cost": {"mat": 4, "grav": 4}, "text": "กด จ่ายวัสดุ 2 จากโครงการนี้ ขยับกระแสสายใดก็ได้ 1 ช่อง", "sym": ["sci"]}, {"name": "โรงประจุกระสุนมานา", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 4, "grav": 3}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ การรบครั้งถัดไปของคุณก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 1", "sym": ["arms"]}, {"name": "คลังสินค้าท่าเรือ", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 5, "grav": 1}, "text": "กด ย้ายสินค้าได้สูงสุด 3 หน่วยจากโครงการนี้เข้าคลัง", "sym": ["wagon"]}, {"name": "โรงทอผ้าด้วยกี่", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 4, "grav": 4}, "text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับเกรฟ 6", "sym": ["com"]}, {"name": "ศาลาประชาคม", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 4, "grav": 1}, "text": "กด จ่ายอาหาร 1 จากโครงการนี้ ขยับกระแสสายประชาชนขึ้น 1 ช่อง", "sym": ["ppl"]}, {"name": "โรงหล่อปืนใหญ่มานา", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 5, "grav": 4}, "text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 3 ใบ เลือก 1 เข้ากองทัพ", "sym": ["arms"]}, {"name": "ห้องทดลองเคมี", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 4, "grav": 4}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ โครงการนี้ผลิตเพิ่ม 2 หน่วยทันทีตามชนิดที่พิมพ์", "sym": ["sci"]}, {"name": "ปราสาทตระกูล", "isNew": true, "era": 1, "kind": "building", "cost": {"mat": 5, "grav": 1}, "text": "กด จ่ายวัสดุ 1 จากโครงการนี้ การรบครั้งถัดไปที่คุณเป็นฝ่ายรับก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 2", "sym": ["trad"]}, {"name": "สำนักปราชญ์", "isNew": false, "era": 1, "kind": "culture", "cost": {"grav": 6}, "text": "วิจัยจั่วเพิ่ม 1 ใบ", "sym": ["sci", "sci"]}, {"name": "นิรโทษกรรม", "isNew": false, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "ตอนวาง ทิ้งตราบาปของคุณได้ 1 ใบ", "sym": ["ppl"]}, {"name": "หลักนิยมสองนาที", "isNew": false, "era": 1, "kind": "culture", "cost": {"grav": 6}, "text": "ตอนวาง ทิ้งการ์ดล้มเหลวทางยุทธวิธีของคุณออกจากเกมได้ 1 ใบ", "sym": ["arms"]}, {"name": "ขุนนางสืบตระกูล", "isNew": true, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "ตอนนับคะแนนระบอบ ถ้าคุณเสมอกับรัฐอื่น คุณได้แต้มของอันดับสูงสุดในกลุ่มที่เสมอ ถ้ามีหลายรัฐในกลุ่มที่มีการ์ดนี้ ใช้กติกาเสมอปกติ", "sym": ["trad"]}, {"name": "จันทราอารักษ์", "isNew": true, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "เมื่อคุณเป็นผู้ป้องกันระบอบจากรัฐประหาร ฝ่ายคุณรวมพลังบวก 2", "sym": ["trad"]}, {"name": "บริษัทร่วมทุน", "isNew": true, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "ตอนสร้างหรือผนวกโครงการ จ่ายเกรฟ 3 แทนสินค้า 1 หน่วยได้ กี่หน่วยก็ได้", "sym": ["com"]}, {"name": "หอการค้า", "isNew": true, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "เกณฑ์การค้ามูลค่าสูงลดลง 2 เกรฟเมื่อคุณเป็นผู้ซื้อ", "sym": ["com", "wagon"]}, {"name": "ตลาดแรงงานเสรี", "isNew": true, "era": 1, "kind": "culture", "cost": {"grav": 5}, "text": "ตอนสภาประชุม รับแรงงานได้ 2 ตัว จ่ายตามราคาบนรางทีละตัว", "sym": ["ppl"]}, {"name": "กล้องส่องทางไกล", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณประกาศโจมตีรัฐอื่น ดูการ์ด 2 ใบบนสุดของกองทหารฝ่ายรับได้ก่อนจ่ายเสบียง แล้วยกเลิกการโจมตีได้ การ์ดแอคชันที่เล่นไปแล้วไม่คืน", "sym": ["arms"]}, {"name": "ดาบปลายปืน", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณชนะการโจมตีรัฐอื่น เอาสินค้าเพิ่มอีก 1 หน่วยจากโครงการนั้นถ้ายังเหลือ", "sym": ["arms"]}, {"name": "ตั๋วแลกเงิน", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณได้โบนัสจากการค้ามูลค่าสูง จั่ว 2 ใบ เลือก 1 อีกใบวางใต้กอง", "sym": ["com", "wagon"]}, {"name": "ประกันภัยทางทะเล", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อรัฐอื่นปล้นสินค้าจากโครงการของคุณ รับเกรฟ 1 ต่อหน่วยที่เสีย", "sym": ["com"]}, {"name": "พงศาวดาร", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "ตอนเปลี่ยนยุค ถ้าคุณมีความชอบธรรมน้อยที่สุดหรือเสมอน้อยที่สุด รับความชอบธรรม 2", "sym": ["trad"]}, {"name": "เครื่องสูบน้ำ", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 6}, "text": "ตอนขั้นผลิต โครงการวัสดุหรือเชื้อเพลิงของคุณหนึ่งใบผลิตเพิ่ม 1", "sym": ["sci"]}, {"name": "ระบบหมุนเวียนพืช", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "ตอนขั้นผลิต โครงการอาหารของคุณหนึ่งใบผลิตเพิ่ม 2 ใช้กับโครงการเดียวกับคันไถเหล็กได้", "sym": ["ppl"]}, {"name": "คลองขุด", "isNew": true, "era": 1, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อคุณซื้อจากรัฐอื่นครบ 4 หน่วยในแอคชันเดียว ได้เกรฟคืน 2", "sym": ["wagon"]}, {"name": "สถานีรถไฟ", "isNew": false, "era": 2, "kind": "building", "cost": {"mat": 5, "fuel": 1, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ซื้อสินค้าจากรัฐอื่นได้ 2 หน่วยทันที", "sym": ["wagon"]}, {"name": "โรงทอไหมมานา", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 5, "fuel": 1, "grav": 2}, "text": "กด จ่ายสินค้า 3 หน่วยจากโครงการนี้ รับเกรฟ 10", "sym": ["com"]}, {"name": "โรงงานยุทธภัณฑ์", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 6, "grav": 5}, "text": "กด จ่ายวัสดุ 1 กับเชื้อเพลิง 1 จากโครงการนี้ จั่วการ์ดทหาร 3 ใบ เลือก 1 เข้ากองทัพ แล้วทิ้งการ์ดทหารได้ 1 ใบ", "sym": ["arms"]}, {"name": "โรงพยาบาลรัฐ", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 5, "grav": 5}, "text": "กด จ่ายอาหาร 2 จากโครงการนี้ รับแรงงานตัวถัดไปบนรางทันทีโดยไม่จ่ายอาหาร นับเป็นการรับแรงงานของรอบนี้", "sym": ["ppl"]}, {"name": "ห้องปฏิบัติการวิจัย", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 5, "fuel": 1, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ เปิดการ์ดวิจัยใบบนสุด จ่ายต้นทุนแล้ววางได้ ไม่อย่างนั้นวางใต้กอง", "sym": ["sci"]}, {"name": "โรงจักรไอน้ำมานา", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 6, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ โครงการนี้ผลิตเพิ่ม 3 หน่วยทันทีตามชนิดที่พิมพ์", "sym": ["sci"]}, {"name": "พิพิธภัณฑ์แห่งชาติ", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 5, "grav": 5}, "text": "กด จ่ายวัสดุ 1 จากโครงการนี้ ถ้าคุณมีการ์ดวัฒนธรรมอย่างน้อย 3 ใบ รับเกรฟ 5", "sym": ["trad"]}, {"name": "ป้อมบาเรียร์ริมน้ำ", "isNew": true, "era": 2, "kind": "building", "cost": {"mat": 6, "fuel": 1, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ การรบครั้งถัดไปที่คุณเป็นฝ่ายรับก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 3", "sym": ["arms"]}, {"name": "ข้าราชการสืบทอด", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 6}, "text": "ทุกครั้งที่คุณสร้างโครงการ รับเกรฟ 2", "sym": ["trad"]}, {"name": "ฟื้นฟูวัฒนธรรมชาติ", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 8}, "text": "การ์ดวัฒนธรรมของคุณราคาลด 1 เกรฟ ต่ำสุด 1", "sym": ["trad", "trad"]}, {"name": "มาตรฐานเกรฟฮาร์ธ", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 6}, "text": "ราคาขายให้ตลาดกลางของคุณเพิ่ม 1 ทุกหน่วย", "sym": ["com", "wagon"]}, {"name": "สมาคมธนาคาร", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 8}, "text": "ตอนสภาประชุม รับเกรฟ 1 ต่อเกรฟ 5 ในคลังของคุณ สูงสุด 3", "sym": ["com"]}, {"name": "หม้อกลาง", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 6}, "text": "ตอนสภาประชุม รับเกรฟ 1 ต่อแรงงานว่างงานของคุณ สูงสุด 3", "sym": ["ppl"]}, {"name": "สื่อมวลชนเสรี", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 8}, "text": "เมื่อคุณเล่นการทูต ขยับกระแสได้ 2 ช่อง จะเป็นสายเดียวกันหรือสองสายก็ได้", "sym": ["ppl"]}, {"name": "กองทัพมหาชน", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 6}, "text": "ปฏิรูปกองทัพของคุณจั่วเพิ่ม 1 ใบ", "sym": ["arms"]}, {"name": "สถาบันวิศวกร", "isNew": true, "era": 2, "kind": "culture", "cost": {"grav": 6}, "text": "โครงการที่คุณสร้างหรือผนวกลดต้นทุน 1 หน่วยสินค้า", "sym": ["sci"]}, {"name": "เครื่องจักรไอน้ำมานา", "isNew": false, "era": 2, "kind": "innovation", "cost": {"grav": 6, "fuel": 1}, "text": "เมื่อโครงการที่มีวัตถุดิบนำเข้าของคุณผลิต ผลิตเพิ่ม 1", "sym": ["sci"]}, {"name": "วอกโซโฟนทอดสัญญาณ", "isNew": false, "era": 2, "kind": "innovation", "cost": {"grav": 5}, "text": "เมื่อมีรัฐประกาศโจมตีคุณ ฝ่ายคุณรวมพลังบวก 1", "sym": ["arms"]}, {"name": "ลวดหนาม", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 6}, "text": "เมื่อคุณเป็นฝ่ายรับ การ์ดของผู้บุกไม่ได้โบนัสทะลวง", "sym": ["arms"]}, {"name": "เรือกลไฟ", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 6, "fuel": 1}, "text": "เมื่อคุณเล่นการค้าโหมดค้าขาย ความจุการซื้อเพิ่ม 2", "sym": ["wagon"]}, {"name": "ปุ๋ยเคมี", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 8}, "text": "ตอนขั้นผลิต โครงการอาหารของคุณสูงสุด 2 ใบผลิตเพิ่มใบละ 1", "sym": ["ppl"]}, {"name": "ตลาดซื้อขายล่วงหน้า", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 6}, "text": "ตอนขั้นผลิต ถ้าโครงการทุกใบของคุณผลิตได้ รับเกรฟ 3", "sym": ["com", "wagon"]}, {"name": "เพลงชาติ", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 6}, "text": "เมื่อคุณชนะการรบในฐานะฝ่ายรับ รับความชอบธรรม 1", "sym": ["trad"]}, {"name": "โคมไฟกริดมานา", "isNew": true, "era": 2, "kind": "innovation", "cost": {"grav": 6}, "text": "ตอนขั้นผลิต โครงการหนึ่งใบของคุณผลิตได้แม้แรงงานขาด 1 ตัว", "sym": ["sci"]}, {"name": "ศูนย์กระจายสินค้า", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 6, "fuel": 1, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ซื้อสินค้าจากรัฐอื่นได้ 3 หน่วยทันที", "sym": ["wagon"]}, {"name": "โรงงานเครื่องใช้เวทมนตร์", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 7, "grav": 5}, "text": "กด จ่ายสินค้า 3 หน่วยจากโครงการนี้ รับเกรฟ 14", "sym": ["com"]}, {"name": "ฐานเรือเหาะรบ", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 7, "fuel": 2, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 2 จากโครงการนี้ การรบครั้งถัดไปของคุณก่อนสภาประชุม ฝ่ายคุณรวมพลังบวก 3", "sym": ["arms"]}, {"name": "หอกระจายเสียงวอกโซโฟน", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 6, "grav": 5}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ ขยับกระแสสายใดก็ได้ 1 ช่อง", "sym": ["sci"]}, {"name": "เคหะนอกกำแพงเดิม", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 7, "grav": 2}, "text": "กด จ่ายวัสดุ 2 จากโครงการนี้ รับเกรฟ 1 ต่อแรงงานที่ทำงานอยู่ของคุณ", "sym": ["ppl"]}, {"name": "โรงแปรธาตุ", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 6, "fuel": 2, "grav": 2}, "text": "กด จ่ายเชื้อเพลิง 1 จากโครงการนี้ รับวัสดุ 3 เข้าคลัง", "sym": ["sci"]}, {"name": "อนุสาวรีย์แห่งชาติ", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 7, "grav": 2}, "text": "กด จ่ายวัสดุ 2 จากโครงการนี้ ขยับกระแสสายประเพณีขึ้น 1 ช่อง", "sym": ["trad"]}, {"name": "ศูนย์บัญชาการทหาร", "isNew": true, "era": 3, "kind": "building", "cost": {"mat": 6, "grav": 5}, "text": "กด จ่ายอาหาร 1 กับเชื้อเพลิง 1 จากโครงการนี้ รวมกองพักกับกองทหารแล้วสับใหม่ จากนั้นดูการ์ด 2 ใบบนสุด วางใบหนึ่งไว้ใต้กองได้", "sym": ["arms"]}, {"name": "มรดกเกรสแลนด์", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "ตอนสภาประชุม ถ้าคุณมีการ์ดวัฒนธรรมมากที่สุดหรือเสมอมากที่สุด รับเกรฟ 3", "sym": ["trad"]}, {"name": "ภาพยนตร์มานาแห่งชาติ", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "ตอนวาง ขยับกระแสสายใดก็ได้เพิ่มอีก 2 ช่อง แยกสายได้", "sym": ["trad"]}, {"name": "การค้าเสรีทั่วเกรสแลนด์", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "ราคาซื้อจากตลาดกลางของคุณลด 1 ต่อหน่วย", "sym": ["com", "wagon"]}, {"name": "บรรษัทข้ามรัฐ", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 9}, "text": "เมื่อรัฐอื่นซื้อสินค้าจากโครงการของคุณ รับเกรฟเพิ่ม 1 ต่อแอคชันของรัฐนั้น", "sym": ["com", "wagon"]}, {"name": "รัฐสวัสดิการ", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "รับแรงงานไม่ต้องจ่ายอาหาร ยังรับได้รอบละ 1 ตัวตามปกติ", "sym": ["ppl"]}, {"name": "สิทธิเลือกตั้งทั่วไป", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "ตอนนับคะแนนระบอบ ถ้าคุณได้ 0 แต้ม รับความชอบธรรม 1", "sym": ["ppl"]}, {"name": "หลักนิยมการรบแยกเดี่ยวฆ่าหมู่", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 8}, "text": "เมื่อคุณเป็นผู้บุก ฝ่ายคุณรวมพลังบวก 1", "sym": ["arms"]}, {"name": "มหาวิทยาลัยวิจัย", "isNew": true, "era": 3, "kind": "culture", "cost": {"grav": 9}, "text": "วิจัยจั่วเพิ่ม 2 ใบ", "sym": ["sci", "sci"]}, {"name": "คอมพิวเตอร์มานา", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 9, "fuel": 1}, "text": "เมื่อคุณวางการ์ดวิจัย ต้นทุนของใบนั้นลด 2 จะลดเกรฟหรือสินค้าก็ได้", "sym": ["sci"]}, {"name": "เลนส์ขยายอาคม", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 8, "fuel": 1}, "text": "เมื่อมีรัฐประกาศโจมตีคุณ ดูการ์ด 3 ใบบนสุดของกองทหารของคุณ แล้ววางเรียงใหม่ได้", "sym": ["arms"]}, {"name": "เครื่องยนต์มานาแรมเจ็ท", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 9, "fuel": 1}, "text": "ในแต่ละการรบ การ์ดเชื้อเพลิงใบแรกที่คุณเปิดไม่ต้องจ่ายเชื้อเพลิง", "sym": ["arms"]}, {"name": "พืชเสริมมานา", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 8}, "text": "ตอนขั้นผลิต โครงการอาหารของคุณสูงสุด 2 ใบผลิตเพิ่มใบละ 2", "sym": ["ppl"]}, {"name": "ล็อตมาตรฐานกิลด์", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 8}, "text": "เมื่อคุณซื้อจากรัฐอื่นครบ 4 หน่วยในแอคชันเดียว ได้เกรฟคืน 3", "sym": ["wagon"]}, {"name": "เงินกู้จำนองสัมปทาน", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 8}, "text": "เมื่อคุณจ่ายต้นทุนโครงการหรือการ์ดวิจัย ยืมเกรฟได้สูงสุด 5 แล้วคืน 7 ตอนสภาประชุมถัดไป คืนไม่ครบรับตราบาป 1", "sym": ["com"]}, {"name": "เครื่องฉายภาพมานา", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 8}, "text": "ตอนสภาประชุม ก่อนตรวจกระแส ขยับกระแสสายใดก็ได้ 1 ช่อง", "sym": ["trad"]}, {"name": "เรือเหาะสำรวจ", "isNew": true, "era": 3, "kind": "innovation", "cost": {"grav": 9, "fuel": 1}, "text": "เมื่อคุณประกาศบุกเบิก ดูการ์ดโครงการ 3 ใบบนสุดของกองยุคปัจจุบัน เลือก 1 ใบเป็นเป้า อีกสองใบวางกลับตามลำดับเดิม", "sym": ["sci"]}], "military": [{"name": "พลธนูยาว", "era": 0, "tier": 1, "power": 2, "kw": {"fire": true}, "count": 3, "mv": 2.4, "flavor": "ห่าธนูถล่มกองที่ข้าศึกเพิ่งส่งขึ้นมา", "mvAtt": 2.6, "mvDef": 2.2}, {"name": "กำแพงโล่", "era": 0, "tier": 1, "power": 1, "kw": {"def": 2}, "count": 3, "mv": 2, "flavor": "ยืนแน่นอยู่กับที่ รับศึกได้หนัก บุกเองไม่เก่ง", "mvAtt": 1, "mvDef": 3}, {"name": "ทหารม้าทวน", "era": 0, "tier": 1, "power": 1, "kw": {"chg": 2}, "count": 2, "mv": 2, "flavor": "พุ่งชนแนวได้แรง แต่ตั้งรับไม่ถนัด", "mvAtt": 3, "mvDef": 1}, {"name": "ไพร่พลเกณฑ์", "era": 0, "tier": 2, "power": 2, "kw": {"surge": 1}, "count": 3, "mv": 2.9, "flavor": "ชาวนาเกณฑ์จากหัวเมืองมาเป็นระลอก ระลอกหลังดันแนวแรงกว่าระลอกแรก", "mvAtt": 3.0, "mvDef": 2.9}, {"name": "ม้าเร็ว", "era": 0, "tier": 2, "power": 2, "kw": {"scout": 2, "chg": 1}, "count": 3, "mv": 3.2, "flavor": "ลาดตระเวนล่วงหน้า รู้ก่อนว่ากองไหนจะได้ปะทะ แล้วตีปลายแถวที่อ่อน", "mvAtt": 3.9, "mvDef": 2.5}, {"name": "พลหน้าไม้", "era": 0, "tier": 2, "power": 2, "kw": {"int": 2}, "count": 2, "mv": 3.4, "flavor": "หน้าไม้ยิงทะลุเกราะ เล็งกองที่แข็งที่สุดของข้าศึก", "mvAtt": 3.0, "mvDef": 3.8}, {"name": "ทัพหนุน", "era": 0, "tier": 2, "power": 1, "kw": {"reinf": true, "def": 1}, "count": 2, "mv": 2.9, "flavor": "กองหนุนที่ซุ่มไว้หลังเนิน โผล่มาเติมแนวกลางศึก", "mvAtt": 2.4, "mvDef": 3.4}, {"name": "ทหารผ่านศึกจักรวรรดิเก่า", "era": 0, "tier": 3, "power": 4, "kw": {}, "count": 2, "mv": 4, "flavor": "นักรบอาชีพ ไม่มีลูกเล่น แข็งตรงไปตรงมา", "mvAtt": 4, "mvDef": 4}, {"name": "อัศวินไชน์เดสเทรีย", "era": 0, "tier": 3, "power": 3, "kw": {"chg": 2}, "count": 2, "mv": 4, "flavor": "ม้าศึกไชน์เดสเทรียพาอัศวินเกราะหนักทะลวงแนวหน้า แต่ตั้งรับเองไม่ดี", "mvAtt": 5, "mvDef": 3}, {"name": "ขุนศึกแนวหน้า", "era": 0, "tier": 3, "power": 3, "kw": {"lead": 1}, "count": 2, "mv": 4.0, "flavor": "ขุนพลขี่นำหน้าทัพ ทหารที่ตามมาเห็นแล้วฮึกเหิม", "mvAtt": 4.0, "mvDef": 4.0}, {"name": "พลหอกยาว", "era": 1, "tier": 1, "power": 2, "kw": {"def": 2}, "count": 3, "mv": 3, "flavor": "ป่าหอกยาวกันทหารม้า บุกเองช้า", "mvAtt": 2, "mvDef": 4}, {"name": "ทหารม้าดรากูน", "era": 1, "tier": 1, "power": 2, "kw": {"chg": 2}, "count": 2, "mv": 3, "flavor": "ขี่ม้าเข้าตีเร็ว แต่ตั้งรับไม่แน่น", "mvAtt": 4, "mvDef": 2}, {"name": "พลปืนคาบศิลามานา", "era": 1, "tier": 1, "power": 3, "kw": {}, "count": 3, "mv": 3, "flavor": "ทหารปืนแถวหน้าแบบมาตรฐานของยุค", "mvAtt": 3, "mvDef": 3}, {"name": "ทหารราบแนวเส้น", "era": 1, "tier": 2, "power": 3, "kw": {"surge": 1}, "count": 3, "mv": 4.2, "flavor": "แถวหลังเดินหน้าเสริมแถวแรก ยิ่งเข้าแนวช้ายิ่งหนัก", "mvAtt": 4.2, "mvDef": 4.2}, {"name": "ทหารพราน", "era": 1, "tier": 2, "power": 3, "kw": {"scout": 2}, "count": 3, "mv": 3.9, "flavor": "พรานนำทางล่วงหน้า จัดลำดับการเดินทัพได้ทั้งของเราและของข้าศึก", "mvAtt": 4.0, "mvDef": 3.8}, {"name": "ทหารยิงแถวสลับ", "era": 1, "tier": 2, "power": 3, "kw": {"fire": true}, "count": 2, "mv": 3.7, "flavor": "ยิงสลับแถวไม่ขาดช่วง กดกองที่ข้าศึกเพิ่งส่งเข้ามา", "mvAtt": 4.0, "mvDef": 3.4}, {"name": "ทหารม้าเบา", "era": 1, "tier": 2, "power": 2, "kw": {"reinf": true}, "count": 2, "mv": 4.1, "flavor": "ม้าเบาวิ่งไปพากองหนุนมาเติมสนาม", "mvAtt": 4.1, "mvDef": 4.1}, {"name": "ทหารม้าเกราะ", "era": 1, "tier": 3, "power": 5, "kw": {}, "count": 2, "mv": 5, "flavor": "ทหารม้าหนักใส่เกราะอก แข็งตรงไปตรงมา", "mvAtt": 5, "mvDef": 5}, {"name": "ปืนใหญ่มานา", "era": 1, "tier": 3, "power": 3, "kw": {"int": 3}, "count": 2, "mv": 5.1, "flavor": "ยิงถล่มกองที่แข็งที่สุดของข้าศึก", "mvAtt": 4.6, "mvDef": 5.7}, {"name": "พลระเบิดบาลาเดียม", "era": 1, "tier": 3, "power": 4, "kw": {"lead": 1}, "count": 2, "mv": 5.2, "flavor": "หน่วยระเบิดมือเปิดทาง ทหารที่ตามหลังบุกได้แรงขึ้น", "mvAtt": 5.2, "mvDef": 5.2}, {"name": "ทหารราบไรเฟิลมานา", "era": 2, "tier": 1, "power": 4, "kw": {}, "count": 3, "mv": 4, "flavor": "ทหารราบมาตรฐานของยุคกริดมานา", "mvAtt": 4, "mvDef": 4}, {"name": "แนวบาเรียร์สนามเพลาะ", "era": 2, "tier": 1, "power": 3, "kw": {"def": 2}, "count": 3, "mv": 4, "flavor": "บาเรียร์ประจำสนามเพลาะ ตั้งรับร้ายกาจ บุกยาก", "mvAtt": 3, "mvDef": 5}, {"name": "ทหารรถไฟ", "era": 2, "tier": 1, "power": 1, "kw": {"reinf": true}, "count": 2, "mv": 3.9, "flavor": "รถไฟลำเลียงกองหนุนถึงสนามกลางศึก", "mvAtt": 3.9, "mvDef": 3.8}, {"name": "ทหารเกณฑ์", "era": 2, "tier": 2, "power": 3, "kw": {"surge": 1, "def": 1}, "count": 3, "mv": 5.1, "flavor": "กองทัพมหาชน เดินมาเป็นระลอก", "mvAtt": 4.6, "mvDef": 5.5}, {"name": "หน่วยส่งกำลังบำรุง", "era": 2, "tier": 2, "power": 3, "kw": {"sup": 3}, "count": 3, "mv": 5.2, "flavor": "ขบวนเสบียงและศิลาเวทที่ทำให้กองหนักเคลื่อนได้", "mvAtt": 5.2, "mvDef": 5.2}, {"name": "ปืนกลมานาประจำที่", "era": 2, "tier": 2, "power": 4, "kw": {"fire": true}, "count": 2, "mv": 5.1, "flavor": "ยิงพังโล่ไม่ขาดช่วง กวาดกองที่เพิ่งโผล่ขึ้นมาจากแนว", "mvAtt": 5.7, "mvDef": 4.6}, {"name": "บอลลูนมานาตรวจการณ์", "era": 2, "tier": 2, "power": 4, "kw": {"scout": 2}, "count": 2, "mv": 5.0, "flavor": "ตาบนฟ้าเห็นการวางกำลังทั้งของเราและของข้าศึก", "mvAtt": 5.2, "mvDef": 4.8}, {"name": "ปืนใหญ่ลากจูงไอน้ำ", "era": 2, "tier": 3, "power": 5, "kw": {"fuel": true, "int": 2}, "count": 2, "mv": 6.7, "flavor": "ปืนใหญ่หนักที่ต้องเผาศิลาเวทลาก", "mvAtt": 6.4, "mvDef": 6.9}, {"name": "หน่วยหอกอัสนี", "era": 2, "tier": 3, "power": 4, "kw": {"lead": 1, "chg": 1}, "count": 2, "mv": 6.0, "flavor": "หอกอัสนีเจาะบาเรียร์ เปิดช่องให้ทั้งแนว", "mvAtt": 6.5, "mvDef": 5.5}, {"name": "เรือปืนท้องแบน", "era": 2, "tier": 3, "power": 6, "kw": {"fuel": true, "chg": 1}, "count": 2, "mv": 6.5, "flavor": "ป้อมเหล็กลอยน้ำติดปืนใหญ่มานา บุกแรงแต่กินเชื้อเพลิง", "mvAtt": 7, "mvDef": 6}, {"name": "กองกำลังอาสา", "era": 3, "tier": 1, "power": 4, "kw": {"def": 2}, "count": 3, "mv": 5, "flavor": "อาสาสมัครรักษาบ้านเกิด สู้ยิบตาเมื่อมีคนบุกบ้าน", "mvAtt": 4, "mvDef": 6}, {"name": "ทหารราบยานเกราะล้อยาง", "era": 3, "tier": 1, "power": 5, "kw": {"fuel": true, "chg": 1}, "count": 3, "mv": 5.5, "flavor": "ทหารราบบนยานเกราะล้อยาง เคลื่อนเร็วแต่ต้องเติมผลึก", "mvAtt": 6, "mvDef": 5}, {"name": "ปืนใหญ่อัตตาจร", "era": 3, "tier": 1, "power": 4, "kw": {"fire": true}, "count": 2, "mv": 5.3, "flavor": "ปืนใหญ่บนสายพาน ยิงตามแนวรุกได้ทัน", "mvAtt": 6.0, "mvDef": 4.6}, {"name": "กองเรือลำเลียงผลึก", "era": 3, "tier": 2, "power": 4, "kw": {"sup": 2}, "count": 3, "mv": 5.6, "flavor": "ล่องเรือส่งผลึกถึงแนวหน้าให้ยานเกราะวิ่งต่อได้", "mvAtt": 5.6, "mvDef": 5.6}, {"name": "หน่วยต่อต้านรถถัง", "era": 3, "tier": 2, "power": 4, "kw": {"int": 2}, "count": 3, "mv": 5.7, "flavor": "อาวุธต่อสู้รถถังที่เล็งยานที่หนักที่สุด", "mvAtt": 5.5, "mvDef": 5.9}, {"name": "หน่วยดักสายวอกโซโฟน", "era": 3, "tier": 2, "power": 5, "kw": {"scout": 1}, "count": 2, "mv": 5.8, "flavor": "ดักฟังสายวอกโซโฟน รู้ว่ากองไหนจะออกมา ทั้งของเราและของข้าศึก", "mvAtt": 5.8, "mvDef": 5.7}, {"name": "หน่วยโดดเรือเหาะ", "era": 3, "tier": 2, "power": 2, "kw": {"reinf": true}, "count": 2, "mv": 5.8, "flavor": "โดดจากเรือเหาะลงหลังแนวข้าศึกกลางศึก", "mvAtt": 5.8, "mvDef": 5.8}, {"name": "รถถัง", "era": 3, "tier": 3, "power": 7, "kw": {"fuel": true, "chg": 1}, "count": 2, "mv": 7.5, "flavor": "หัวหอกยานเกราะ ไม่มีผลึกก็เป็นเหล็กกองหนึ่ง", "mvAtt": 8, "mvDef": 7}, {"name": "กองพันเวทมนตร์สนาม", "era": 3, "tier": 3, "power": 5, "kw": {"lead": 1}, "count": 2, "mv": 6.9, "flavor": "นักเวทสนามกางบาเรียร์และเวทเสริมให้กองที่ตามเข้ามา", "mvAtt": 6.9, "mvDef": 6.8}, {"name": "เรือเหาะทิ้งระเบิด", "era": 3, "tier": 3, "power": 6, "kw": {"fuel": true, "fire": true}, "count": 2, "mv": 7.6, "flavor": "ครองฟ้าแล้วถล่มกองที่ข้าศึกเพิ่งส่งขึ้นมา", "mvAtt": 8.2, "mvDef": 7.0}], "starterArmy": [{"name": "พลหอก", "era": -1, "tier": 0, "power": 1, "kw": {}, "count": 5, "mv": 1.0, "flavor": "ทหารหอกประจำรัฐ"}, {"name": "พลธนู", "era": -1, "tier": 0, "power": 2, "kw": {}, "count": 3, "mv": 2.0, "flavor": "พลธนูประจำรัฐ"}, {"name": "ล้มเหลวทางยุทธวิธี", "era": -1, "tier": 0, "power": 0, "kw": {"keep": true}, "count": 2, "mv": 0.0, "flavor": "คำสั่งที่ผิดพลาด ทหารที่หลงทาง และจังหวะที่พลาดไปในสนามรบ"}], "neutral": [{"name": "ล้มเหลวทางยุทธวิธี", "count": 2, "power": [0, 0, 0, 0]}, {"name": "ยามรับจ้าง", "count": 5, "power": [1, 2, 3, 4]}, {"name": "มือปืนเสื้อคลุมน้ำเงิน", "count": 2, "power": [3, 3, 5, 7]}, {"name": "หน่วยเงาเสื้อคลุมน้ำเงิน", "count": 1, "power": [3, 6, 7, 10]}], "regimes": [{"name": "ราชาธิปไตย", "set": "classic", "line": "trad", "metric": "จำนวนการ์ดวัฒนธรรม", "policy": "การ์ดวัฒนธรรมราคาลด 1 เกรฟ", "base": "arms"}, {"name": "สาธารณรัฐพ่อค้า", "set": "classic", "line": "com", "metric": "เกรฟในคลัง", "policy": "ความจุการซื้อเพิ่ม 1", "base": "trad"}, {"name": "ประชาคมเสรี", "set": "classic", "line": "ppl", "metric": "จำนวนแรงงานทั้งหมด", "policy": "รับแรงงานถูกลง 1 อาหาร ต่ำสุด 1", "base": "sci"}, {"name": "ระบอบขุนศึก", "set": "classic", "line": "arms", "metric": "จำนวนการ์ดในกองทัพ", "policy": "บัญชาการทัพไม่ต้องจ่ายเสบียง ผู้บุกที่ชนะได้ความชอบธรรม 1", "base": "ppl"}, {"name": "ปราชญาธิปไตย", "set": "classic", "line": "sci", "metric": "จำนวนการ์ดนวัตกรรม", "policy": "วิจัยจั่ว 4 เลือก 1", "base": "com"}, {"name": "ชาตินิยม", "set": "modern", "line": "trad", "metric": "จำนวนโครงการ", "policy": "ฝ่ายรับได้พลังเพิ่ม 2", "base": "com"}, {"name": "มานาเสรี", "set": "modern", "line": "com", "metric": "จำนวนสิ่งปลูกสร้าง", "policy": "ราคาขายให้ตลาดกลางเพิ่ม 1", "base": "arms"}, {"name": "ประชาธิปไตยสังคม", "set": "modern", "line": "ppl", "metric": "อาหารบนโครงการรวมกับในคลัง", "policy": "ผู้บุกรัฐอื่นรับตราบาป 1 ใบแม้ชนะ", "base": "trad"}, {"name": "รัฐบาลทหาร", "set": "modern", "line": "arms", "metric": "การ์ดทหารยุค III ขึ้นไปในกองทัพ", "policy": "ปฏิรูปกองทัพจั่ว 4 เลือก 1 และทิ้งได้ 2 ใบ", "base": "sci"}, {"name": "เทคโนแครต", "set": "modern", "line": "sci", "metric": "การ์ดวิจัยทั้งหมด", "policy": "การ์ดนวัตกรรมราคาลด 2 เกรฟ", "base": "ppl"}], "bonus": [{"text": "รับสินค้าชนิดใดก็ได้ 2 หน่วยเข้าคลัง", "count": 6}, {"text": "รับเกรฟ 3", "count": 5}, {"text": "โครงการถัดไปที่คุณสร้างในรอบนี้ลดต้นทุน 2 หน่วยสินค้า วางค้างไว้จนใช้หรือจบรอบ", "count": 4}, {"text": "ขยับกระแสสายใดก็ได้ 1 ช่อง", "count": 4}, {"text": "จั่วการ์ดทหาร 2 ใบ เลือก 1 เข้ากองทัพ", "count": 3}, {"text": "ความชอบธรรม 1", "count": 3}, {"text": "ทิ้งตราบาปของคุณ 1 ใบ ถ้าไม่มีรับเกรฟ 2", "count": 3}, {"text": "รับแรงงานตัวถัดไปบนรางทันทีโดยไม่จ่ายอาหาร", "count": 2}], "eras": [{"id": "I", "name": "ตั้งรกราก", "rank4": [2, 1, 0, 0], "rank3": [2, 1, 0], "buy": 5, "sell": 2, "hv": 9, "spine": 3}, {"id": "II", "name": "ปฏิรูป", "rank4": [3, 2, 1, 0], "rank3": [3, 1, 0], "buy": 4, "sell": 1, "hv": 9, "spine": 2.75}, {"id": "III", "name": "กริดมานา", "rank4": [4, 2, 1, 0], "rank3": [4, 2, 0], "buy": 3, "sell": 1, "hv": 6, "spine": 2}, {"id": "IV", "name": "เฟื่องฟู", "rank4": [5, 3, 1, 0], "rank3": [5, 2, 0], "buy": 3, "sell": 1, "hv": 6, "spine": 2}], "rules": {"flipScore": true, "expansionFree": 4, "expansionStep": 2, "turnOrder": "trailing", "leaderBurden": 1, "workerCost": [2, 3, 4, 5, 6, 7, 8, 9]}, "version": "0.3"};

/* สหพันธรัฐ · dataset 0.4, built at load time from the 0.3 cards (KDATA03 in the page, KDATA in the node tools).
   Rules 0.4: 12 rounds of 3 per era, workers that stay where they were, a reform that culls only from the discard pile,
   permanent buildings that work while their project is fully staffed, and worker placement and hiring asked of every
   state at once. Only the building texts change on the cards; costs and every other card are the 0.3 values. */
var KDATA04 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4';
  // three councils per era leave the currents less time to build, so the tipping point drops by one (5 with 4 states,
  // 4 with 3): at 6 the simulated flips fell from 0.7 to 0.3 a game, at 5 they are back at 0.7
  d.rules = Object.assign({}, d.rules, { rounds: 12, perEra: 3, workersStay: true, reformDiscOnly: true, passiveBuildings: true, simul: true, tip4: 5, tip3: 4 });
  // every building works on its own while all worker slots of its project are filled (rule 8.2 of the 0.4 rulebook)
  var TEXT = {
    'โรงสี': 'ขั้นผลิต: อาหารที่โครงการนี้ผลิตเกินเพดาน กลายเป็นเกรฟหน่วยละ 2 แทนการทิ้ง',
    'โรงตีเหล็ก': 'ปฏิรูปกองทัพของคุณจั่วการ์ดทหารเพิ่ม 2 ใบ',
    'ยุ้งฉาง': 'โครงการนี้เก็บสินค้าได้ 9 หน่วยแทน 6 และรัฐอื่นปล้นสินค้าจากโครงการนี้ไม่ได้',
    'โบสถ์ประจำเมือง': 'เมื่อคุณเล่นการทูต ดันกระแสสายประเพณีขึ้นได้อีก 1 ช่อง',
    'โรงรับจำนำ': 'ขั้นผลิต: รับเกรฟ 1 ต่อสินค้า 2 หน่วยในคลังสินค้าของคุณ สูงสุด 3',
    'ค่ายฝึกทหาร': 'เมื่อคุณเป็นผู้บุก พลหอกกับพลธนูของคุณพลังเพิ่มใบละ 1',
    'กังหันน้ำ': 'ขั้นผลิต: โครงการนี้ผลิตเพิ่ม 1',
    'ท่าเทียบเรือ': 'ขั้นผลิต: ขายสินค้าบนโครงการนี้ 1 หน่วยให้เรือสินค้า รับเกรฟเท่าราคาซื้อของตลาดกลางในยุคปัจจุบัน',
    'แท่นพิมพ์เวทมนตร์': 'เมื่อคุณเล่นการทูต ขยับกระแสสายใดก็ได้อีก 1 ช่อง',
    'โรงประจุกระสุนมานา': 'เมื่อคุณเป็นผู้บุก ฝ่ายคุณรวมพลังบวก 1',
    'คลังสินค้าท่าเรือ': 'คลังสินค้าของคุณจุเพิ่ม 3 ช่อง',
    'โรงทอผ้าด้วยกี่': 'ขั้นผลิต: ถ้าโครงการนี้มีอาหารค้างอย่างน้อย 2 หน่วย ทออาหาร 2 หน่วยเป็นเกรฟ 6',
    'ศาลาประชาคม': 'เมื่อคุณเล่นการทูต ดันกระแสสายประชาชนขึ้นได้อีก 1 ช่อง',
    'โรงหล่อปืนใหญ่มานา': 'ปฏิรูปกองทัพของคุณเลือกการ์ดทหารเข้ากองทัพได้ 2 ใบแทน 1',
    'ห้องทดลองเคมี': 'ขั้นผลิต: ถ้าคุณมีเชื้อเพลิง จ่าย 1 หน่วย แล้วโครงการนี้ผลิตเพิ่ม 2',
    'ปราสาทตระกูล': 'เมื่อโครงการนี้ถูกโจมตี ฝ่ายคุณรวมพลังบวก 2',
    'สถานีรถไฟ': 'เมื่อคุณเล่นค้าขาย ความจุการซื้อเพิ่ม 2',
    'โรงทอไหมมานา': 'ขั้นผลิต: ถ้าโครงการนี้มีสินค้าค้างอย่างน้อย 3 หน่วย แปรรูป 3 หน่วยเป็นเกรฟ 8',
    'โรงงานยุทธภัณฑ์': 'ปฏิรูปกองทัพของคุณจั่วเพิ่ม 1 ใบ และทิ้งการ์ดจากกองพักได้เพิ่มอีก 1 ใบ',
    'โรงพยาบาลรัฐ': 'รับแรงงานถูกลง 2 อาหาร ต่ำสุด 1',
    'ห้องปฏิบัติการวิจัย': 'วิจัยของคุณจั่วเพิ่ม 1 ใบ',
    'โรงจักรไอน้ำมานา': 'ขั้นผลิต: ถ้าคุณมีเชื้อเพลิง จ่าย 1 หน่วย แล้วโครงการนี้ผลิตเพิ่ม 3',
    'พิพิธภัณฑ์แห่งชาติ': 'ขั้นผลิต: รับเกรฟ 1 ต่อการ์ดวัฒนธรรมของคุณ สูงสุด 4',
    'ป้อมบาเรียร์ริมน้ำ': 'เมื่อคุณเป็นฝ่ายรับ ฝ่ายคุณรวมพลังบวก 2',
    'ศูนย์กระจายสินค้า': 'เมื่อคุณเล่นค้าขาย ความจุการซื้อเพิ่ม 3',
    'โรงงานเครื่องใช้เวทมนตร์': 'ขั้นผลิต: ถ้าโครงการนี้มีสินค้าค้างอย่างน้อย 3 หน่วย แปรรูป 3 หน่วยเป็นเกรฟ 11',
    'ฐานเรือเหาะรบ': 'เมื่อคุณเป็นผู้บุก ฝ่ายคุณรวมพลังบวก 2',
    'หอกระจายเสียงวอกโซโฟน': 'เมื่อคุณเล่นการทูต ขยับกระแสได้อีก 2 ช่อง จะเป็นสายเดียวกันหรือสองสายก็ได้',
    'เคหะนอกกำแพงเดิม': 'ขั้นผลิต: รับเกรฟ 1 ต่อแรงงานที่ทำงานอยู่ทุก 2 คนของคุณ',
    'โรงแปรธาตุ': 'ขั้นผลิต: รับวัสดุ 2 เข้าคลังสินค้า',
    'อนุสาวรีย์แห่งชาติ': 'เมื่อคุณเล่นการทูต ดันกระแสสายประเพณีขึ้นได้อีก 2 ช่อง',
    'ศูนย์บัญชาการทหาร': 'ก่อนการรบทุกครั้งของคุณ รวมกองพักกับกองทหารแล้วสับใหม่',
  };
  d.research.forEach(function (r) {
    if (r.kind !== 'building') return;
    if (TEXT[r.name]) r.text = TEXT[r.name];
    // buildings of eras I and II cost half the materials (rounded up): in 0.3 they were the dearest research of their era
    // and the hardest to afford, so they were almost never taken; a permanent building also asks for a staffed project
    if (r.era <= 1 && r.cost.mat) r.cost.mat = Math.ceil(r.cost.mat / 2);
  });
  return d;
})(typeof KDATA03 !== 'undefined' ? KDATA03 : KDATA);

/* dataset 0.4.1: the 0.4 cards and rules with the reform of the designer's rulings of 8 Nov 2026. The reform looks through
   the army deck and the discard pile, culls one card from either, then shuffles the discard pile and the new cards into
   the army deck. Every new military card joins the army deck at once, so diplomacy matters after a battle. */
var KDATA041 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.1';
  d.rules = Object.assign({}, d.rules, { reformDiscOnly: false, deckReform: true, reformMerge: true });
  d.research.forEach(function (r) {
    if (r.name === 'โรงงานยุทธภัณฑ์') r.text = 'ปฏิรูปกองทัพของคุณจั่วเพิ่ม 1 ใบ และทิ้งการ์ดได้เพิ่มอีก 1 ใบ';
  });
  return d;
})(KDATA04);

/* dataset 0.4.2: the 0.4.1 cards and rules with the military rewards of the designer's rulings of 9 Nov 2026. A won
   exploration pays the card's whole production; a won raid on a state takes half the goods stored on the target
   project, rounded up. */
// 0.4.2 (ruled 9 Nov): a won exploration pays the card's whole production, a raid takes half of what the project holds
// (rounded up), and the annex stays paid as in 0.4.1. The first draft's free annex is the annexFree switch, kept for saved games
var KDATA042 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.2';
  d.rules = Object.assign({}, d.rules, { exploreFull: true, raidStock: true });
  return d;
})(KDATA041);

// 0.4.3 (ruled 10 Nov): the leader burden applies only at a scoring that leaves rank 1, 2 or 3 empty (a tie among the
// three highest metric values); every card and every other rule is as in 0.4.2
var KDATA043 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.3';
  d.rules = Object.assign({}, d.rules, { burdenGap: true });
  return d;
})(KDATA042);

/* KDATA044 BEGIN */
// 0.4.4 (trial, 10 Nov): the designer's military table (federation-military-cards.xlsx). 32 of the 40 reform card types
// change power or keywords (ทหารรถไฟ becomes รถไฟลำเลียง), the blue cloak's gunmen and shadows get weaker, and three cards
// pay legitimacy for battles: the anthem 2 for a battle won as defender, nationalism 1 for a won exploration, the junta 1
// for a won attack on another state. mv, mvAtt and mvDef are the power equivalents measured with calib_mil.js (the AI
// picks and culls cards by them). Every other card and rule is as in 0.4.3
var KDATA044 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.4';
  d.rules = Object.assign({}, d.rules, { anthemLegit: 2, natExploreLegit: true, juntaRaidLegit: true });
  var MIL = {
    "กำแพงโล่": {"name": "กำแพงโล่", "power": 1, "kw": {"def": 3}, "count": 3, "mv": 2.5, "mvAtt": 1, "mvDef": 4},
    "ทหารม้าทวน": {"name": "ทหารม้าทวน", "power": 1, "kw": {"chg": 3}, "count": 2, "mv": 2.5, "mvAtt": 4, "mvDef": 1},
    "ไพร่พลเกณฑ์": {"name": "ไพร่พลเกณฑ์", "power": 2, "kw": {"int": 1, "surge": 1}, "count": 3, "mv": 3.7, "mvAtt": 3.5, "mvDef": 3.8},
    "ม้าเร็ว": {"name": "ม้าเร็ว", "power": 2, "kw": {"chg": 1, "scout": 2, "sup": 1}, "count": 3, "mv": 3.8, "mvAtt": 4.5, "mvDef": 3.0},
    "ทัพหนุน": {"name": "ทัพหนุน", "power": 1, "kw": {"def": 1, "reinf": true, "sup": 1}, "count": 2, "mv": 3.9, "mvAtt": 3.4, "mvDef": 4.4},
    "ทหารผ่านศึกจักรวรรดิเก่า": {"name": "ทหารผ่านศึกจักรวรรดิเก่า", "power": 4, "kw": {"fire": true}, "count": 2, "mv": 4.7, "mvAtt": 4.8, "mvDef": 4.5},
    "อัศวินไชน์เดสเทรีย": {"name": "อัศวินไชน์เดสเทรีย", "power": 3, "kw": {"chg": 2, "fire": true}, "count": 2, "mv": 4.5, "mvAtt": 5.5, "mvDef": 3.4},
    "ขุนศึกแนวหน้า": {"name": "ขุนศึกแนวหน้า", "power": 3, "kw": {"lead": 2}, "count": 2, "mv": 4.6, "mvAtt": 4.6, "mvDef": 4.6},
    "พลหอกยาว": {"name": "พลหอกยาว", "power": 2, "kw": {"def": 3}, "count": 3, "mv": 3.5, "mvAtt": 2, "mvDef": 5},
    "ทหารม้าดรากูน": {"name": "ทหารม้าดรากูน", "power": 2, "kw": {"chg": 3}, "count": 2, "mv": 3.5, "mvAtt": 5, "mvDef": 2},
    "พลปืนคาบศิลามานา": {"name": "พลปืนคาบศิลามานา", "power": 3, "kw": {"sup": 1}, "count": 3, "mv": 3.7, "mvAtt": 3.7, "mvDef": 3.7},
    "ทหารพราน": {"name": "ทหารพราน", "power": 3, "kw": {"scout": 2, "sup": 1}, "count": 3, "mv": 4.6, "mvAtt": 4.7, "mvDef": 4.4},
    "ทหารยิงแถวสลับ": {"name": "ทหารยิงแถวสลับ", "power": 3, "kw": {"int": 1, "fire": true}, "count": 2, "mv": 4.4, "mvAtt": 4.5, "mvDef": 4.3},
    "ทหารม้าเบา": {"name": "ทหารม้าเบา", "power": 2, "kw": {"reinf": true, "scout": 1}, "count": 2, "mv": 4.7, "mvAtt": 4.8, "mvDef": 4.6},
    "ทหารม้าเกราะ": {"name": "ทหารม้าเกราะ", "power": 5, "kw": {"fire": true}, "count": 2, "mv": 6.0, "mvAtt": 6.3, "mvDef": 5.7},
    "ทหารราบไรเฟิลมานา": {"name": "ทหารราบไรเฟิลมานา", "power": 4, "kw": {"chg": 1}, "count": 3, "mv": 4.5, "mvAtt": 5, "mvDef": 4},
    "แนวบาเรียร์สนามเพลาะ": {"name": "แนวบาเรียร์สนามเพลาะ", "power": 3, "kw": {"def": 2, "int": 1}, "count": 3, "mv": 4.8, "mvAtt": 3.7, "mvDef": 6.0},
    "ทหารรถไฟ": {"name": "รถไฟลำเลียง", "power": 1, "kw": {"fuel": true, "reinf": true, "sup": 2}, "count": 2, "mv": 5.8, "mvAtt": 5.9, "mvDef": 5.7},
    "ทหารเกณฑ์": {"name": "ทหารเกณฑ์", "power": 2, "kw": {"def": 1, "surge": 2}, "count": 3, "mv": 5.4, "mvAtt": 5.1, "mvDef": 5.7},
    "ปืนกลมานาประจำที่": {"name": "ปืนกลมานาประจำที่", "power": 4, "kw": {"def": 1, "fire": true}, "count": 2, "mv": 5.6, "mvAtt": 5.7, "mvDef": 5.4},
    "บอลลูนมานาตรวจการณ์": {"name": "บอลลูนมานาตรวจการณ์", "power": 4, "kw": {"def": 1, "scout": 2}, "count": 2, "mv": 5.5, "mvAtt": 5.2, "mvDef": 5.7},
    "หน่วยหอกอัสนี": {"name": "หน่วยหอกอัสนี", "power": 4, "kw": {"lead": 1, "chg": 2}, "count": 2, "mv": 6.5, "mvAtt": 7.5, "mvDef": 5.5},
    "เรือปืนท้องแบน": {"name": "เรือปืนท้องแบน", "power": 6, "kw": {"fuel": true, "chg": 2}, "count": 2, "mv": 7, "mvAtt": 8, "mvDef": 6},
    "กองกำลังอาสา": {"name": "กองกำลังอาสา", "power": 4, "kw": {"def": 3}, "count": 3, "mv": 5.5, "mvAtt": 4, "mvDef": 7},
    "ทหารราบยานเกราะล้อยาง": {"name": "ทหารราบยานเกราะล้อยาง", "power": 5, "kw": {"fuel": true, "chg": 2}, "count": 3, "mv": 6, "mvAtt": 7, "mvDef": 5},
    "กองเรือลำเลียงผลึก": {"name": "กองเรือลำเลียงผลึก", "power": 4, "kw": {"def": 2, "sup": 2}, "count": 3, "mv": 6.6, "mvAtt": 5.6, "mvDef": 7.5},
    "หน่วยต่อต้านรถถัง": {"name": "หน่วยต่อต้านรถถัง", "power": 4, "kw": {"def": 2, "int": 2}, "count": 3, "mv": 6.7, "mvAtt": 5.5, "mvDef": 8.0},
    "หน่วยดักสายวอกโซโฟน": {"name": "หน่วยดักสายวอกโซโฟน", "power": 5, "kw": {"scout": 2}, "count": 2, "mv": 6.3, "mvAtt": 6.4, "mvDef": 6.2},
    "หน่วยโดดเรือเหาะ": {"name": "หน่วยโดดเรือเหาะ", "power": 2, "kw": {"reinf": true, "sup": 1}, "count": 2, "mv": 6.8, "mvAtt": 6.8, "mvDef": 6.8},
    "รถถัง": {"name": "รถถัง", "power": 7, "kw": {"fuel": true, "chg": 2}, "count": 2, "mv": 8, "mvAtt": 9, "mvDef": 7},
    "กองพันเวทมนตร์สนาม": {"name": "กองพันเวทมนตร์สนาม", "power": 5, "kw": {"lead": 1, "def": 1}, "count": 2, "mv": 7.4, "mvAtt": 6.9, "mvDef": 7.8},
    "เรือเหาะทิ้งระเบิด": {"name": "เรือเหาะทิ้งระเบิด", "power": 6, "kw": {"fuel": true, "chg": 1, "fire": true}, "count": 2, "mv": 8.1, "mvAtt": 9.2, "mvDef": 7.0},
  };
  d.military.forEach(function (m) {
    var p = MIL[m.name]; if (!p) return;
    m.name = p.name; m.power = p.power; m.kw = p.kw; m.count = p.count; m.mv = p.mv; m.mvAtt = p.mvAtt; m.mvDef = p.mvDef;
  });
  var NEUTRAL = {"มือปืนเสื้อคลุมน้ำเงิน": [2, 3, 4, 5], "หน่วยเงาเสื้อคลุมน้ำเงิน": [3, 5, 6, 8]};
  d.neutral.forEach(function (n) { if (NEUTRAL[n.name]) n.power = NEUTRAL[n.name].slice(); });
  d.research.forEach(function (r) { if (r.name === 'เพลงชาติ') r.text = "เมื่อคุณชนะการรบในฐานะฝ่ายรับ รับความชอบธรรม 2"; });
  var POLICY = { 'ชาตินิยม': "ฝ่ายรับได้พลังเพิ่ม 2 หากชนะการรบในการบุกเบิกดินแดนจะได้รับ 1 ความชอบธรรม", 'รัฐบาลทหาร': "ปฏิรูปกองทัพจั่ว 4 เลือก 1 และทิ้งได้ 2 ใบ ผู้บุกที่ชนะการรบกับรัฐอื่นๆ จะได้รับ 1 ความชอบธรรม" };
  d.regimes.forEach(function (r) { if (POLICY[r.name]) r.policy = POLICY[r.name]; });
  return d;
})(KDATA043);
/* KDATA044 END */

/* 0.4.4 as ruled on 11 Nov: the trial table becomes the default rules. The era II culture จันทราอารักษ์ is renamed
   หน่วยพิทักษ์ธรรม (the armed guard that protects and arrests for the church of the moon), so the name stays with the
   church itself, which is a supporter card below. The effect is unchanged and the engine reads both names */
KDATA044.research.forEach(function (r) { if (r.name === 'จันทราอารักษ์') r.name = 'หน่วยพิทักษ์ธรรม'; });

/* mode รัฐที่แตกแยก (trial of 11 Nov, rule switch supporters, rule set 0.44s): before the first round every state draws
   5 of these 30 supporter cards, keeps 1 face down, and all states reveal together; the other cards leave the game.
   The supporter lies face up beside the state board for the whole game. Its tags are ideology symbols on the symbol
   track from the start (choosing the regime at an era change, defending the regime against a coup). Cards 1 to 15 have
   two tags and lighter effects than cards 16 to 30, which have one; every line has 9 tags.
   id: the key the engine reads; alt: the organisation's other name; when: when the card starts to pay (for the designer) */
KDATA044.supporters = [
  { id: 'regulator', no: 1, name: 'เดอะรีกูเลเตอร์', alt: 'กองทหารเสื้อคลุมขาว', leader: 'อันโทน ฮิลสค์', tags: ['sci', 'arms'], text: 'ทุกครั้งที่คุณวางการ์ดนวัตกรรม จั่วการ์ดทหาร 2 ใบ เลือก 1 ใบสับเข้ากองทัพ', when: 'ตามจังหวะนวัตกรรม' },
  { id: 'ritter', no: 2, name: 'สมาพันธ์พ่อค้า', leader: 'คาร์ล ริทเทอร์', tags: ['com', 'ppl'], text: 'ในแอคชันค้าขายของคุณ เกณฑ์การค้ามูลค่าสูงลดลง 2 เกรฟ รัฐที่ขายให้ได้โบนัสตามปกติ', when: 'ยุค III ขึ้นไป (เกณฑ์ 6 เหลือ 4)' },
  { id: 'freemagic', no: 3, name: 'ขบวนการเสรีเวทมนตร์', leader: 'เซเลนา ซอเซอร์เรส', tags: ['ppl', 'sci'], text: 'ทุกครั้งที่รัฐอื่นวางการ์ดนวัตกรรม คุณรับเกรฟ 1 และการ์ดนวัตกรรมของคุณราคาลด 1 เกรฟ', when: 'สะสมทีละน้อยทั้งเกม' },
  { id: 'sunslayer', no: 4, name: 'หน่วยสุริยะพิฆาต', alt: 'กองทหารเสื้อคลุมเหลือง', leader: 'จอมพล เอ็ดวิน รอทริค', tags: ['arms', 'trad'], text: 'เมื่อคุณโจมตีรัฐอื่นหรือก่อรัฐประหาร การ์ดใบแรกที่คุณเปิดได้นำทัพ 1 เพิ่มจากที่พิมพ์', when: 'กลางเกม เมื่อมีของค้างให้ปล้น' },
  { id: 'windclans', no: 5, name: 'สมาพันธ์เผ่าสายลมหวน', leader: 'นารันทูยา', tags: ['ppl', 'arms'], text: 'บัญชาการทัพของคุณไม่ต้องจ่ายอาหาร และชนะการบุกเบิกแล้วรับอาหารเพิ่ม 2 เข้าคลัง', when: 'ทีละน้อยทั้งเกม' },
  { id: 'godhand', no: 6, name: 'องค์กรหัตถ์เทวะ', leader: 'มหาอุปราช', tags: ['arms', 'trad'], text: 'เมื่อคุณโจมตีรัฐที่มีตราบาปมากกว่าคุณ แพ้แล้วไม่รับตราบาป ชนะแล้วรับความชอบธรรม 1 (ยุคละครั้ง)', when: 'กลางเกม ต้นเกมยังไม่มีใครมีตราบาป' },
  { id: 'curators', no: 7, name: 'องค์กรภัณฑารักษ์', leader: 'ภัณฑารักษ์สูงสุด', tags: ['sci', 'com'], text: 'ตอนวิจัย เก็บการ์ดที่ไม่เลือกไว้คว่ำหน้ารัฐได้ 1 ใบ (เก็บได้ทีละใบ ข้ามยุคได้) ใบที่เก็บนับเป็นตัวเลือกในการวิจัยครั้งต่อไป', when: 'ทั้งเกม เด่นตอนเปลี่ยนยุค' },
  { id: 'bluecoats', no: 8, name: 'กองทหารเสื้อคลุมน้ำเงิน', leader: 'เจ้าชายเฟรดิน', tags: ['arms', 'com'], text: 'ก่อนรบกับกองรับจ้างเสื้อคลุมน้ำเงินทุกครั้ง หลังสับแล้ว คุณดูการ์ด 2 ใบบนสุดของกองนั้น และวางใบหนึ่งไว้ใต้กองได้', when: 'ตามจำนวนการบุกเบิก' },
  { id: 'talan', no: 9, name: 'คณะทาลัน', leader: 'สามหัวหน้าคณะ', tags: ['com', 'trad'], text: 'ตั้งแต่ยุค II ตอนสภาประชุม ถ้ามีรัฐเดียวที่คะแนนสุทธิสูงสุดและรัฐนั้นไม่ใช่คุณ ย้ายเกรฟ 3 จากคลังรัฐนั้นมาเข้าคลังคุณ ถ้ารัฐนั้นมีเกรฟไม่ถึง 3 รัฐนั้นรับตราบาป 1 แทน', when: 'ยุค II ขึ้นไป เป็นเบรกของผู้นำ' },
  { id: 'londo', no: 10, name: 'ตระกูลลอนโด', leader: 'ประมุขตระกูล', tags: ['trad', 'sci'], text: 'โครงการทุกใบของคุณมีช่องสิ่งปลูกสร้างเพิ่ม 1 ช่อง', when: 'กลางเกม เมื่อเริ่มซ้อนสิ่งปลูกสร้าง' },
  { id: 'thorn', no: 11, name: 'ตระกูลธอร์น', leader: 'ประมุขตระกูล', tags: ['ppl', 'trad'], text: 'แรงงานตัวที่ 4 ขึ้นไปของคุณถูกลง 1 อาหาร', when: 'ตั้งแต่การจ้างครั้งที่สอง' },
  { id: 'quillan', no: 12, name: 'ตระกูลควิลลัน', leader: 'ประมุขตระกูล', tags: ['trad', 'sci'], text: 'ทุกครั้งที่คุณวางการ์ดวัฒนธรรม ขยับกระแสสายใดก็ได้เพิ่ม 1 ช่อง ขึ้นหรือลง', when: 'ตามจังหวะกระแสพลิก' },
  { id: 'blackwood', no: 13, name: 'สมาคมแบล็ควูด', leader: 'นายกสมาคม', tags: ['sci', 'ppl'], text: 'สิ่งปลูกสร้างของคุณใช้วัสดุน้อยลง 1 หน่วย ต่ำสุด 1', when: 'ยุค III ขึ้นไป ที่สิ่งปลูกสร้างกินวัสดุ 5 ถึง 7' },
  { id: 'wildwardens', no: 14, name: 'หน่วยพิทักษ์พงไพร', leader: 'ผู้บัญชาการหน่วย', tags: ['ppl', 'arms'], text: 'ชนะการบุกเบิกแล้วผนวกด้วยต้นทุนลด 4 หน่วยแทน 2 และการบุกเบิกที่แพ้ครั้งแรกของแต่ละยุคไม่รับตราบาป', when: 'กลางเกม เมื่อต้นทุนโครงการสูง' },
  { id: 'cogs', no: 15, name: 'สภาฟันเฟือง', alt: 'ฮันเดอลอว', leader: 'ผู้แทนบรรษัทในสภา', tags: ['com', 'sci'], text: 'ทุกขั้นผลิต โครงการหนึ่งใบของคุณที่มีวัตถุดิบนำเข้าจ่ายวัตถุดิบน้อยลง 1 หน่วย', when: 'ยุค III ขึ้นไป' },
  { id: 'lunar', no: 16, name: 'จันทราอารักษ์', leader: 'บิชอป สเตลลาร์ เอลดริช', tags: ['trad'], text: 'เมื่อรัฐอื่นก่อรัฐประหาร คุณประกาศเป็นผู้ป้องกันระบอบแทนรัฐที่กฎกำหนดได้ ป้องกันสำเร็จแล้วรับความชอบธรรม 1 และผู้ก่อการรับตราบาปเพิ่ม 1', when: 'เมื่อเริ่มมีรัฐประหาร' },
  { id: 'fozarken', no: 17, name: 'ฟอซาร์เคน ฟรอนท์', alt: 'แนวร่วมผู้ถูกทอดทิ้ง', leader: 'ดูม แวนไฮด์ แห่งสภาชาวนา', tags: ['ppl'], text: 'รัฐประหารที่คุณก่อสำเร็จไม่ต้องรับตราบาป และการ์ดทหารที่มีสกัดทุกใบในกองทัพของคุณได้สนับสนุน 1', when: 'กลางเกม' },
  { id: 'stanter', no: 18, name: 'นครการศึกษาสแตนเทอร์', leader: 'วอกส์', tags: ['sci'], text: 'วิจัยของคุณจั่ว 4 ใบ เลือก 1', when: 'ทั้งเกม' },
  { id: 'whiterose', no: 19, name: 'ภาคีกุหลาบขาว', leader: 'เอสตร้า รอทริค', tags: ['arms'], text: 'การปฏิรูปกองทัพครั้งแรกในแต่ละยุค คุณทิ้งการ์ดได้ 2 ใบ', when: 'สะสมเป็นกองทัพที่คมขึ้น' },
  { id: 'sunflame', no: 20, name: 'ภาคีเปลวสุริยา', leader: 'ข่าน', tags: ['arms'], text: 'การ์ดทหารยุค III และ IV ในกองทัพของคุณพลังเพิ่ม 1 ใบที่พลังเป็น 0 เพราะไม่จ่ายเชื้อเพลิงไม่ได้ผลนี้', when: 'ยุค III ขึ้นไปเท่านั้น' },
  { id: 'ascended', no: 21, name: 'ผู้หลุดพ้น', leader: 'ท่านพ่อ', tags: ['sci'], text: 'ตอนปฏิรูปกองทัพ ยุคละครั้ง แทนที่จะทิ้งการ์ด คุณจ่ายอาหาร 2 เพื่อยกระดับการ์ด 1 ใบได้ โดยทิ้งใบนั้น แล้วจั่วการ์ดทหาร 2 ใบ เลือก 1 ใบสับเข้ากอง', when: 'ทั้งเกม' },
  { id: 'biohazard', no: 22, name: 'หน่วยรับมือเหตุฉุกเฉินทางชีวภาพ', leader: 'เดวิล แอชลอน', tags: ['ppl'], text: 'ตั้งแต่ยุค II สภาครั้งไหนที่คุณได้ 0 แต้มจากระบอบ รับความชอบธรรม 1 (สภาละครั้ง) และเมื่อโครงการของคุณถูกปล้น รับสินค้าที่เสียไปคืนครึ่งหนึ่ง ปัดลง', when: 'ยุค II ขึ้นไป เมื่อรัฐคุณตกที่นั่งลำบาก' },
  { id: 'cohen', no: 23, name: 'ตระกูลโคเฮน', leader: 'ประมุขตระกูล', tags: ['arms'], text: 'ปฏิรูปกองทัพของคุณจั่ว 4 ใบ เลือก 1', when: 'ทั้งเกม' },
  { id: 'vendettia', no: 24, name: 'ตระกูลเวนเดทเทีย', alt: 'เดอะวี', leader: 'ประมุขตระกูล', tags: ['trad'], text: 'ทุกการรบระหว่างคุณกับรัฐอื่น ก่อนเปิดการ์ด คุณดูการ์ด 2 ใบบนสุดของกองทหารอีกฝ่าย และวางใบหนึ่งไว้ใต้กองได้', when: 'กลางเกม เมื่อรัฐเริ่มรบกัน' },
  { id: 'mercier', no: 25, name: 'ตระกูลเมอร์ซิเออร์', leader: 'ประมุขตระกูล', tags: ['com'], text: 'คุณขายสินค้าให้ตลาดกลางได้ราคาเพิ่ม 1 เกรฟต่อหน่วย', when: 'ทั้งเกม' },
  { id: 'argent', no: 26, name: 'ตระกูลอาร์เจนท์', leader: 'ประมุขตระกูล', tags: ['com'], text: 'ตอนสภาประชุม หลังรับเกรฟ 2 ตามปกติ รับเกรฟเพิ่ม 1 ต่อทุก 8 เกรฟในคลัง สูงสุด 6', when: 'กลางเกมขึ้นไป' },
  { id: 'corvus', no: 27, name: 'ตระกูลคอร์วัส', leader: 'ประมุขตระกูล', tags: ['trad'], text: 'ตั้งแต่ยุค III เมื่อคุณเสมอกับรัฐอื่นตอนนับคะแนนระบอบ คุณได้แต้มของอันดับสูงสุดในกลุ่มที่เสมอ', when: 'ยุค III ขึ้นไปเท่านั้น' },
  { id: 'crimson', no: 28, name: 'องค์กรจันทร์สีชาด', leader: 'เหล่าอาร์ชบิชอปแห่งศาสนจักรจันทร์โลหิต', tags: ['ppl'], text: 'รัฐที่โจมตีโครงการของคุณรับตราบาป 1 ใบแม้ชนะ และต้นยุค III กับต้นยุค IV คุณทิ้งตราบาปของตัวเองได้ 1 ใบ', when: 'กันการปล้นทั้งเกม ล้างตราบาปยุค III ขึ้นไป' },
  { id: 'brass', no: 29, name: 'บรรษัทเหมืองแร่แห่งนครทองเหลือง', leader: 'ผู้แทนบรรษัท', tags: ['com'], text: 'ทุกครั้งที่รัฐอื่นโจมตีรัฐอื่นหรือก่อรัฐประหาร คุณรับเกรฟ 2', when: 'ตามความร้อนของโต๊ะ' },
  { id: 'celestia', no: 30, name: 'สภาการค้าและคลังแห่งซีเลสเทีย', leader: 'สมาชิกสภาจากตระกูลการค้า', tags: ['com'], text: 'ค่าขยายดินแดนของคุณลดลง 2 เกรฟ และตอนสร้างโครงการ คุณเลือกใบบนสุดของกองโครงการแทนใบในตลาดได้', when: 'โครงการใบที่ 5 ขึ้นไป' },
];

/* KDATA045 BEGIN */
// 0.4.5 (ruled 11 Nov): the designer's military table federation-military-cards.v3 applied in full. Two reform cards change:
// พลธนูยาว (era I, low) has power 3 instead of 2, and ทหารผ่านศึกจักรวรรดิเก่า (era I, high) loses อำนาจยิงเหนือกว่า; mv, mvAtt
// and mvDef measured again with calib_mil.js at 20 000 battles a point. Seven research cards and one regime that touch
// battle get the designer's new texts; the engine reads them under the rule switch milV3:
//   ค่ายฝึกทหาร: attacking, every card with ทะลวง charges 1 more (was spearmen and archers +1)
//   ประเพณีนักรบ: defending, every card with ตั้งรับ defends 1 more (was spearmen defend 1)
//   กองทัพมหาชน: also, once in every battle, 3 food raise the โถมกำลัง of one revealed card by 1
//   วอกโซโฟนทอดสัญญาณ: +1 whenever defending (was only against an attack), and before the battle look at the attacker's
//     top 2 army cards and discard any of them to that army's discard pile
//   หลักนิยมการรบแยกเดี่ยวฆ่าหมู่: attacking, every card with สกัด strikes 1 more (was +1 to the total)
//   เลนส์ขยายอาคม: the top 3 cards may also be discarded to the defender's own discard pile
//   เครื่องยนต์มานาแรมเจ็ท: also, every card that burns fuel has ทะลวง 1 more
//   ประชาธิปไตยสังคม: also, the state that defends the regime against a coup and wins gains 1 legitimacy
// Every other card, the starting army and the blue cloak deck are as in 0.4.4
var KDATA045 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.5';
  d.rules = Object.assign({}, d.rules, { milV3: true });
  var MIL = {
    "พลธนูยาว": { power: 3, kw: { fire: true }, mv: 3.6, mvAtt: 3.8, mvDef: 3.4 },
    "ทหารผ่านศึกจักรวรรดิเก่า": { power: 4, kw: {}, mv: 4.0, mvAtt: 4.0, mvDef: 4.0 },
  };
  d.military.forEach(function (m) {
    var p = MIL[m.name]; if (!p) return;
    m.power = p.power; m.kw = p.kw; m.mv = p.mv; m.mvAtt = p.mvAtt; m.mvDef = p.mvDef;
  });
  var TEXT = {
    'ค่ายฝึกทหาร': "เมื่อคุณเป็นผู้บุก การ์ดที่มีเอฟเฟคทะลวง เพิ่มทะลวงขึ้น 1 ทุกใบ",
    'ประเพณีนักรบ': "เมื่อคุณเป็นฝ่ายรับ การ์ดที่มีเอฟเฟคตั้งรับ เพิ่มตั้งรับขึ้น 1 ทุกใบ",
    'กองทัพมหาชน': "ปฏิรูปกองทัพของคุณจั่วเพิ่ม 1 ใบ และทุกการรบสามารถจ่าย 3 อาหาร ให้กับการ์ดโถมกำลังหนึ่งไป เพื่อทำให้เอฟเฟคโถมกำลังเพิ่มขึ้น 1",
    'วอกโซโฟนทอดสัญญาณ': "เมื่อคุณเป็นฝ่ายรับ ฝ่ายคุณรวมพลังบวก 1 และก่อนเริ่มการรบ ดูการ์ด 2 ใบบนสุดของกองทหารฝ่ายตรงข้าม แล้วเลือกทิ้งการ์ดเหล่านั้นลงกองพักได้",
    'หลักนิยมการรบแยกเดี่ยวฆ่าหมู่': "เมื่อคุณเป็นผู้บุก การ์ดที่มีเอฟเฟคสกัด เพิ่มสกัดขึ้น 1 ทุกใบ",
    'เลนส์ขยายอาคม': "เมื่อมีรัฐประกาศโจมตีคุณ ดูการ์ด 3 ใบบนสุดของกองทหารของคุณ แล้ววางเรียงใหม่ได้ และเลือกทิ้งการ์ดเหล่านั้นลงกองพักได้",
    'เครื่องยนต์มานาแรมเจ็ท': "ในแต่ละการรบ การ์ดเชื้อเพลิงใบแรกที่คุณเปิดไม่ต้องจ่ายเชื้อเพลิง และการ์ดทหารทุกใบที่ต้องจ่ายเชื้อเพลิง ได้รับ 1 ทะลวง เพิ่มเติม",
  };
  d.research.forEach(function (r) { if (TEXT[r.name]) r.text = TEXT[r.name]; });
  d.regimes.forEach(function (r) { if (r.name === 'ประชาธิปไตยสังคม') r.policy = "ผู้บุกรัฐอื่นรับตราบาป 1 ใบแม้ชนะ ผู้ที่ปกป้องการรัฐประหารได้ ได้รับ 1 ความชอบธรรม"; });
  return d;
})(KDATA044);
/* KDATA045 END */

/* KDATA047 BEGIN */
// 0.4.7 (ruled 12 Nov): the designer's regime sheet federation-regimes.xlsx, cells edited in yellow taken word for word.
//   มานาเสรี: the threshold of a high-value trade is 1 grav lower (on top of every other cut) and the selling state draws
//     its bonus as usual; the central market pays the era's price again (it paid 1 more until 0.4.6)
//   รัฐบาลทหาร: ranks the states by their arms symbols (แท็กศาสตรา) instead of their military cards of era III and later
//   with 3 states, rank 2 of era IV scores 3 legitimacy instead of 2
// The engine reads the two regimes under the switches manaHv and juntaSym, set here so the cards and their reading travel
// together. Every other card is as in 0.4.5
var KDATA047 = (function (base) {
  var d = JSON.parse(JSON.stringify(base));
  d.version = '0.4.7';
  d.rules = Object.assign({}, d.rules, { manaHv: true, juntaSym: true });
  d.regimes.forEach(function (r) {
    if (r.name === 'มานาเสรี') r.policy = "เกณฑ์การค้ามูลค่าสูงลดลง 1 เกรฟ (ทบกับเอฟเฟคอื่นๆที่บอกให้ลดลงได้) รัฐที่ขายให้ได้โบนัสตามปกติ";
    if (r.name === 'รัฐบาลทหาร') r.metric = "จำนวนแท็กศาสตรา";
  });
  d.eras[3].rank3 = [5, 3, 0];
  return d;
})(KDATA045);
/* KDATA047 END */

window.KDATA02 = KDATA02;
window.KDATA03 = KDATA03;
window.KDATA04 = KDATA04;
window.KDATA041 = KDATA041;
window.KDATA042 = KDATA042;
window.KDATA043 = KDATA043;
window.KDATA044 = KDATA044;
window.KDATA045 = KDATA045;
window.KDATA047 = KDATA047;
window.KDATA = KDATA047;
/* สหพันธรัฐ · rules engine (no DOM). Implements federation-rulebook-v0.2 to v0.4.5 (Kirana names) and the trial mode รัฐที่แตกแยก (supporter cards); the dataset and the rule switches pick the rule set. */
(function (root) {
'use strict';
let D = root.KDATA;
const K = root.K = root.K || {};

const LINES = ['trad', 'com', 'ppl', 'arms', 'sci'];
const LINE_NAME = { trad: 'ประเพณี', com: 'พาณิชย์', ppl: 'ประชาชน', arms: 'ศาสตรา', sci: 'วิทยาการ' };
const GOODS = ['mat', 'fuel', 'food'];
const RES_NAME = { mat: 'วัสดุ', fuel: 'เชื้อเพลิง', food: 'อาหาร', grav: 'เกรฟ' };
const WORKER_COST = [2, 2, 3, 3, 4, 4, 5, 5];
const CARD_NAME = { trade: 'การค้า', military: 'การทหาร', research: 'วิจัย', diplomacy: 'การทูต' };
const MODE_NAME = { build: 'สร้างโครงการ', commerce: 'ค้าขาย', command: 'บัญชาการทัพ', reform: 'ปฏิรูปกองทัพ', research: 'วิจัย', diplomacy: 'การทูต' };
K.LINES = LINES; K.LINE_NAME = LINE_NAME; K.GOODS = GOODS; K.RES_NAME = RES_NAME; K.CARD_NAME = CARD_NAME; K.MODE_NAME = MODE_NAME;
K.WORKER_COST = WORKER_COST;

// ---------- rng ----------
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
K.rng = rng;
function shuffleWith(r, a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
K.shuffleWith = shuffleWith;
const shuffle = (G, a) => shuffleWith(G.r, a);

// ---------- defs ----------
const REG = {};
function buildReg() { for (const k of Object.keys(REG)) delete REG[k]; for (const r of D.regimes) REG[r.name] = r; }
buildReg();
K.REG = REG;
// switch rule set: every game starts by selecting its dataset (cards, era table, rule switches)
K.setData = function (d) { D = d || root.KDATA; buildReg(); };
K.data = () => D;
// rule switches; a dataset may override them in d.rules
const RULE_DEFAULTS = {
  flipScore: false,        // score the new regime once when a current flips it
  expansionFree: null,     // projects you may own before expansion cost applies (null = no expansion cost)
  expansionStep: 1,        // extra grav per project above expansionFree
  turnOrder: 'left',       // 'left' = pass first player left; 'trailing' = lowest net legitimacy goes first
  leaderBounty: 0,         // legitimacy for beating the net-legitimacy leader in an attack (attacker must not be a leader)
  upkeepFree: null,        // projects a state may hold before paying upkeep at council (null = no upkeep)
  upkeepCost: 1,           // grav per project above upkeepFree, paid at council
  leaderBurden: 0,         // points withheld from the sole net-legitimacy leader at each scoring
  eraChooser: 'base',      // 'base' = most base-power symbols chooses (rulebook 11.3); 'trailing' = lowest net legitimacy chooses
  tip4: 6,                 // current tipping point with 4 states
  tip3: 5,                 // current tipping point with 3 states
  startGrav: 6,
  councilGrav: 2,
  researchNone: 2,
  // rules 0.4 switches (all off in 0.2 and 0.3, so their games replay exactly as before)
  rounds: 16,              // rounds in the game
  perEra: 4,               // rounds in each era (era change after every perEra rounds, but not after the last)
  workersStay: false,      // workers stay where they were; an empty production answer keeps last round's placement
  reformDiscOnly: false,   // the reform action culls only from the discard pile (no search of the army deck)
  passiveBuildings: false, // buildings work on their own while their project is fully staffed (no activation, no untap)
  simul: false,            // worker placement and hiring are asked of every state at once, then applied in seat order
  reformReview: 0,         // with reformDiscOnly: cards the reform first takes from the top of the army deck to the discard pile
  // rules 0.4.1: the reform looks through the whole army deck and culls from it, and every new military card is shuffled
  // straight into the army deck, so the discard pile holds only troops that fought and diplomacy matters after battle
  deckReform: false,
  // rules 0.4.1 as ruled on 8 Nov: with deckReform, the reform also opens the discard pile for the cull and then shuffles
  // the whole discard pile back into the army deck together with the new cards
  reformMerge: false,
  // rules 0.4.2 as ruled on 9 Nov: a won exploration pays the card's whole production (not half); a won raid on a state
  // takes half the goods stored on the target project, rounded up, instead of half the printed production.
  // annexFree is the first draft of 0.4.2 (annex without the card's cost, the expansion fee still applies)
  exploreFull: false,
  annexFree: false,
  raidStock: false,
  // rules 0.4.3 as ruled on 10 Nov: the leader burden applies only at a scoring that leaves rank 1, 2 or 3 empty,
  // that is when the three highest metric values are not all different (a tie between the 3rd and the 4th does not count)
  burdenGap: false,
  // rules 0.4.4 (trial, the designer's military table of 10 Nov): battle rewards in legitimacy.
  // anthemLegit: what the national anthem (เพลงชาติ) gives for a battle won as defender (1 until 0.4.3);
  // natExploreLegit: under nationalism (ชาตินิยม) a won exploration gives 1 legitimacy;
  // juntaRaidLegit: under the military junta (รัฐบาลทหาร) a won attack on another state gives 1 legitimacy
  anthemLegit: 1,
  natExploreLegit: false,
  juntaRaidLegit: false,
  // mode รัฐที่แตกแยก (trial of 11 Nov): before the first round every state draws 5 supporter cards from the dataset's
  // supporters list and keeps 1 for the whole game; its tags count as ideology symbols. Off in every other rule set
  supporters: false,
  // rules 0.4.4 as ruled on 11 Nov: playing diplomacy asks whether the military discard pile is shuffled back into the
  // army deck (until then it always was); off in every older rule set and in the 0.4.4 trial key, so their games replay
  dipChoice: false,
  // rules 0.4.6 as ruled on 11 Nov: building a project with an ideology symbol pushes that current 1 step a symbol
  projPush: false,
  // rules 0.4.7 as ruled on 12 Nov: a current that reaches the flip point flips at once, right after the push that took it
  // there, instead of at the council (instantFlip); and the regime cards of the designer's sheet federation-regimes.xlsx:
  // มานาเสรี lowers the threshold of a high-value trade by 1 grav instead of raising the central market's price (manaHv),
  // รัฐบาลทหาร ranks the states by their arms symbols instead of their military cards of era III on (juntaSym)
  instantFlip: false,
  manaHv: false,
  juntaSym: false,
};
K.RULE_DEFAULTS = RULE_DEFAULTS;
// game length (rules 0.4 plays 12 rounds of 3 per era; older rules 16 of 4)
const totalRounds = G => (G && G.rules && G.rules.rounds) || 16;
const perEra = G => (G && G.rules && G.rules.perEra) || 4;
K.totalRounds = totalRounds; K.perEra = perEra;
function regimeOf(set, line) { return D.regimes.find(r => r.set === set && r.line === line); }
K.regimeOf = regimeOf;
const BONUS_KIND = ['goods2', 'grav3', 'projDisc', 'current', 'mil2', 'legit1', 'stigma', 'worker'];

// ---------- small helpers ----------
const eraD = G => D.eras[G.era];
const rankPts = G => (G.n === 4 ? eraD(G).rank4 : eraD(G).rank3);
const totalWorkers = P => 2 + P.hired;
const assignedWorkers = P => P.projects.reduce((s, p) => s + p.workers, 0);
function goodsOf(P, t) { let s = P.wh[t]; for (const p of P.projects) if (p.d.out === t) s += p.goods; return s; }
function allGoods(P) { const o = {}; for (const t of GOODS) o[t] = goodsOf(P, t); return o; }
function whTotal(P) { return P.wh.mat + P.wh.fuel + P.wh.food; }
function whCap(P) { return 6 + (has(P, 'ยุ้งข้าวชุมชน') ? 2 : 0) + 3 * bldOn(P, 'คลังสินค้าท่าเรือ'); }
function has(P, name) { for (const r of P.research) if (r.d.name === name) return true; return false; }
// mode รัฐที่แตกแยก: the supporter card a state kept (P.supporter, null without the mode), by the card's id
function sup(P, id) { return !!(P && P.supporter && P.supporter.d.id === id); }
// what a supporter card has used up: once per era or per council, kept on the state (only states with a supporter write it)
function supUsed(P) { return P.supUsed || (P.supUsed = {}); }
// ผู้หลุดพ้น: the food an upgrade at the reform costs (ruled 11 Nov; 1 in the first draft of the mode)
const ASCEND_FOOD = 2;
K.ASCEND_FOOD = ASCEND_FOOD;
// กองทัพมหาชน (rules 0.4.5): the food that feeds one more wave of a โถมกำลัง card in a battle
const MASS_FOOD = 3;
K.MASS_FOOD = MASS_FOOD;
// building slots of a project: printed slots, one more on every project of ตระกูลลอนโด
function slotsOf(P, pr) { return pr.d.slots + (sup(P, 'londo') ? 1 : 0); }
function buildingsOf(P) { const o = []; for (const p of P.projects) for (const b of p.buildings) o.push({ b, p }); return o; }
// ---------- permanent buildings (rules 0.4): a building works while every worker slot of its project is filled ----------
// the mana-grid lamp (โคมไฟกริดมานา) lets one chosen project count as full with one worker short, as it does for production
function staffed(P, pr) { return pr.workers >= pr.d.workers - (P.lampUid != null && P.lampUid === pr.uid ? 1 : 0); }
// working copies of a building on P (P.pb is set from the rules at setup, so helpers without G can read it)
function bldOn(P, name) {
  if (!P.pb) return 0;
  let n = 0;
  for (const pr of P.projects) if (pr.buildings.length && staffed(P, pr)) for (const b of pr.buildings) if (b.d.name === name) n++;
  return n;
}
function bldOnProj(P, pr, name) { if (!P.pb || !staffed(P, pr)) return 0; let n = 0; for (const b of pr.buildings) if (b.d.name === name) n++; return n; }
// goods a project can hold: 6, or 9 while a staffed granary (ยุ้งฉาง) stands on it
function projCap(P, pr) { return bldOnProj(P, pr, 'ยุ้งฉาง') ? 9 : 6; }
function researchCount(P) { return P.research.length + buildingsOf(P).length; }
function cultures(P) { return P.research.filter(r => r.d.kind === 'culture').length; }
function innovations(P) { return P.research.filter(r => r.d.kind === 'innovation').length; }
function armyCards(P) { return P.army.deck.concat(P.army.disc); }
function symCount(P, line) {
  let s = 0;
  for (const p of P.projects) { for (const x of p.d.sym) if (x === line) s++; for (const b of p.buildings) for (const x of b.d.sym) if (x === line) s++; }
  for (const r of P.research) for (const x of r.d.sym) if (x === line) s++;
  // mode รัฐที่แตกแยก: the supporter's tags are ideology symbols from the start of the game
  if (P.supporter) for (const x of P.supporter.d.tags) if (x === line) s++;
  return s;
}
function wagons(P) {
  let s = 0;
  for (const r of P.research) for (const x of r.d.sym) if (x === 'wagon') s++;
  for (const { b } of buildingsOf(P)) for (const x of b.d.sym) if (x === 'wagon') s++;
  return s;
}
function regimeName(G) { return G.regime; }
function isRegime(G, name) { return G.regime === name; }
Object.assign(K, { eraD, rankPts, totalWorkers, assignedWorkers, goodsOf, allGoods, whTotal, whCap, has, buildingsOf,
  researchCount, cultures, innovations, armyCards, symCount, wagons, isRegime, staffed, bldOn, bldOnProj, projCap, sup, slotsOf });

function cardPower(G, inst) { return inst.neutral ? inst.d.power[G.era] : inst.d.power; }
K.cardPower = cardPower;

// ---------- prices ----------
function salePrice(G, owner, proj) { return proj.d.sale == null ? null : proj.d.sale + (has(owner, 'สมาพันธ์พ่อค้า') ? 1 : 0); }
function marketBuyPrice(G, P) { let p = eraD(G).buy; if (has(P, 'เรือท้องแบน')) p--; if (has(P, 'การค้าเสรีทั่วเกรสแลนด์')) p--; return Math.max(1, p); }
function marketSellPrice(G, P) { let p = eraD(G).sell; if (has(P, 'มาตรฐานเกรฟฮาร์ธ')) p++; if (isRegime(G, 'มานาเสรี') && !G.rules.manaHv) p++; if (sup(P, 'mercier')) p++; return p; }
function capacity(G, P, commerce) {
  return 2 + wagons(P) + (isRegime(G, 'สาธารณรัฐพ่อค้า') ? 1 : 0) + (commerce && has(P, 'เรือกลไฟ') ? 2 : 0)
    + (commerce ? 2 * bldOn(P, 'สถานีรถไฟ') + 3 * bldOn(P, 'ศูนย์กระจายสินค้า') : 0);
}
// rules 0.4.7: under มานาเสรี every buyer's threshold is 1 grav lower, on top of its other cuts
function hvThreshold(G, P) { return eraD(G).hv - (has(P, 'หอการค้า') ? 2 : 0) - (sup(P, 'ritter') ? 2 : 0) - (G.rules.manaHv && isRegime(G, 'มานาเสรี') ? 1 : 0); }
function hireCost(G, P) {
  if (P.hired >= 8) return null;
  if (has(P, 'รัฐสวัสดิการ')) return 0;
  let c = (G.rules.workerCost || WORKER_COST)[P.hired];
  if (has(P, 'สภาหมู่บ้าน')) c--;
  if (sup(P, 'thorn') && totalWorkers(P) >= 3) c--;   // ตระกูลธอร์น: the 4th worker and every one after it (ruled 11 Nov)
  if (isRegime(G, 'ประชาคมเสรี')) c--;
  c -= 2 * bldOn(P, 'โรงพยาบาลรัฐ');
  return Math.max(1, c);
}
function maxHires(G, P) { return has(P, 'ตลาดแรงงานเสรี') ? 2 : 1; }
Object.assign(K, { salePrice, marketBuyPrice, marketSellPrice, capacity, hvThreshold, hireCost, maxHires });

// ---------- logging / io ----------
function log(G, msg, cls, pid) {
  G.log.push({ r: G.round, ph: G.phase, msg, cls: cls || '', p: pid == null ? -1 : pid });
  if (G.log.length > 4000) G.log.splice(0, 1000);
}
// score ledger: every change to a state's net score (legitimacy gained, stigma taken or cleared) with its round,
// source (s) and an optional note (n), so the table can show where each point came from. Bookkeeping only: no rng, no rule reads it.
function scoreNote(G, P, d, s, n) { if (d) P.ledger.push(n ? { r: G.round, d, s, n } : { r: G.round, d, s }); }
function addLegit(G, P, k, s, n) { P.legit += k; scoreNote(G, P, k, s, n); }
function addStigma(G, P, k, s, n) { P.stigma += k; scoreNote(G, P, -k, s, n); }
// some regime names already start with ระบอบ (ระบอบขุนศึก); avoid writing it twice in ledger labels
function regLabel(name) { return /^ระบอบ/.test(name) ? name : 'ระบอบ' + name; }
K.log = log;
// Answers are not trusted (ruled 17 Nov 2026): a peer online, a saved game or a forged move log may send any JSON, and the
// hall of fame script plays move logs again with this engine. An answer to a question with options must be one of the
// options not turned off, or nothing where the question allows nothing; anything else becomes nothing where that is
// allowed, else the first option not turned off. Research also takes -1 for none, as the AI answers it. The page and the
// AI only ever answer this way, so every honest game plays as before. Numbers inside the other answers go through cnt
const firstOpen = req => { const o = req.options.find(o => !o.disabled); return o ? o.value : null; };
function legalAnswer(req, v) {
  if (!req || !Array.isArray(req.options)) return v;
  if (v == null) return req.allowNone || req.allowBack ? null : firstOpen(req);
  if (req.kind === 'researchPick' && v === -1) return v;
  const s = JSON.stringify(v);
  const o = req.options.find(o => !o.disabled && JSON.stringify(o.value) === s);
  if (o) return o.value;
  return req.allowNone || req.allowBack ? null : firstOpen(req);
}
K.legalAnswer = legalAnswer;
// a count inside an answer (goods to sell or buy, workers on a project): a whole number above zero, else nothing
const cnt = x => typeof x === 'number' && Number.isInteger(x) && x > 0 ? x : 0;
function ask(G, P, req) { return legalAnswer(req, G.io.ask(G, P, req)); }
function emit(G, ev, data) { if (G.io.event) G.io.event(G, ev, data); }

// ---------- setup ----------
let UID = 1;
function inst(d, extra) { return Object.assign({ uid: UID++, d }, extra || {}); }
function mkProject(d) { return inst(d, { goods: 0, workers: 0, buildings: [] }); }

// a difficulty level may give an AI seat legitimacy at the start of every era (the AI module owns the levels);
// it goes through the ledger like any other point, so the score tooltip shows where it came from
function levelPrestige(G, P) {
  const L = !P.human && K.AI && K.AI.LEVELS && K.AI.LEVELS[P.level];
  if (!L || !L.legitEra) return;
  addLegit(G, P, L.legitEra, 'บารมีตระกูลเก่า', `AI ระดับ${L.name} · ยุค ${eraD(G).id}`);
  log(G, `${P.name} (AI ระดับ${L.name}) ได้ความชอบธรรม ${L.legitEra} จากบารมีตระกูลเก่าเมื่อเริ่มยุค ${eraD(G).id}`, 'res', P.id);
}
function newGame(opts) {
  UID = 1; // every peer of an online game must hand out the same uids
  K.setData(opts.data || root.KDATA);
  const n = opts.seats.length;
  const seed = (opts.seed == null ? Math.floor(Math.random() * 2 ** 31) : opts.seed) >>> 0;
  const G = {
    seed, r: rng(seed), aiR: rng(seed ^ 0x5bd1e995), n, players: [], first: 0, round: 1, era: 0, roundInEra: 1,
    phase: 'setup', lap: 0, cur: -1, regime: null, regimeSetRound: -1, regimeSet: 'classic',
    currents: { trad: 0, com: 0, ppl: 0, arms: 0, sci: 0 }, tip: n === 4 ? 6 : 5,
    projectDecks: [[], [], [], []], market: [], researchDecks: [[], [], [], []], reformDecks: [[], [], [], []],
    bonusDeck: [], bonusDiscard: [], neutral: [], log: [], over: false, io: opts.io || null,
    stats: { regimes: [], flips: 0, coups: 0, coupsEraI: 0, coupWins: 0, hvTrades: 0, actions: {}, battles: [],
      legitByRound: [], annex: 0, startTime: Date.now(),
      builds: [0, 0, 0, 0], annexByEra: [0, 0, 0, 0], produced: [0, 0, 0, 0], prodGrav: [0, 0, 0, 0], capWaste: 0,
      centralSold: { units: 0, grav: 0 }, overflow: { units: 0, grav: 0 }, research: { building: 0, culture: 0, innovation: 0 }, researchNone: 0,
      flipScores: 0, burdenCuts: 0, burdenPts: 0, snaps: [] },
  };
  G.rules = Object.assign({}, RULE_DEFAULTS, D.rules || {}, opts.rules || {});
  G.tip = n === 4 ? G.rules.tip4 : G.rules.tip3;
  for (let e = 0; e < 4; e++) {
    G.projectDecks[e] = shuffle(G, D.projects.filter(p => p.era === e).map(mkProject));
    G.researchDecks[e] = shuffle(G, D.research.filter(r => r.era === e).map(d => inst(d)));
    const mil = [];
    for (const m of D.military.filter(m => m.era === e)) for (let i = 0; i < m.count; i++) mil.push(inst(m));
    G.reformDecks[e] = shuffle(G, mil);
  }
  for (const nd of D.neutral) for (let i = 0; i < nd.count; i++) G.neutral.push(inst(nd, { neutral: true }));
  D.bonus.forEach((b, i) => { for (let k = 0; k < b.count; k++) G.bonusDeck.push(inst(Object.assign({ kind: BONUS_KIND[i] }, b))); });
  shuffle(G, G.bonusDeck);
  const classic = shuffle(G, D.regimes.filter(r => r.set === 'classic').map(r => r.name));
  G.regime = classic[0];
  G.stats.regimes.push({ name: G.regime, round: 1, how: 'เริ่มเกม' });
  G.market = G.projectDecks[0].splice(0, 3);
  const COLORS = ['#3fa7d6', '#e0605f', '#e2b13c', '#9b7fe0'];
  opts.seats.forEach((s, i) => {
    const P = {
      id: i, name: s.name, color: s.color || COLORS[i], human: !!s.human, style: s.style || 'balanced', level: s.level || 'normal',
      grav: G.rules.startGrav, legit: 0, stigma: 0, ledger: [], wh: { mat: 0, fuel: 0, food: 0 }, projects: [], research: [], hired: 0,
      hand: ['trade', 'military', 'research', 'diplomacy'], played: [], diploPlayed: false,
      army: { deck: [], disc: [] }, removed: [], attacked: {}, coupDone: false, tradeBonus: false, hiresThisRound: 0,
      mods: [], projDiscount: 0, loanDue: 0, pb: !!G.rules.passiveBuildings, lampUid: null, supporter: null,
      st: { build: 0, commerce: 0, explore: 0, attack: 0, coup: 0, reform: 0, research: 0, diplomacy: 0, bwin: 0, blose: 0, annex: 0, plunderedFrom: 0 },
    };
    for (const sp of D.startProjects) { const p = mkProject(sp); p.workers = 1; P.projects.push(p); }
    for (const m of D.starterArmy) for (let k = 0; k < m.count; k++) P.army.deck.push(inst(m));
    shuffle(G, P.army.deck);
    G.players.push(P);
  });
  const fr = Math.floor(G.r() * n);
  G.first = opts.first != null ? opts.first : fr;
  log(G, `เริ่มเกม ${n} รัฐ ระบอบแรกคือ ${G.regime} ผู้เล่นคนแรกคือ ${G.players[G.first].name}`, 'sys');
  for (const P of G.players) levelPrestige(G, P);
  return G;
}
K.newGame = newGame;

// ---------- mode รัฐที่แตกแยก: the supporter draft ----------
// every state draws 5 supporter cards and keeps 1 face down; all states choose at once and reveal together, the other
// cards leave the game. The deck is shuffled with the game's stream after the setup, so a game without the mode draws
// exactly what it drew before
const TAG_TEXT = tags => tags.map(t => LINE_NAME[t]).join(' ');
function supSub(d) { return `${d.leader} · แท็ก ${TAG_TEXT(d.tags)} · ${d.text}`; }
K.supSub = supSub;
function supporterDraft(G) {
  const list = D.supporters || [];
  if (list.length < G.n * 5) { log(G, 'ชุดข้อมูลนี้ไม่มีการ์ดผู้สนับสนุนพอ เล่นแบบไม่มีผู้สนับสนุน', 'sys'); return; }
  const deck = shuffle(G, list.map(d => inst(d)));
  const hands = G.players.map(() => deck.splice(0, 5));
  log(G, 'โหมดรัฐที่แตกแยก: ทุกรัฐจั่วการ์ดผู้สนับสนุน 5 ใบ เลือกเก็บ 1 ใบคว่ำไว้ แล้วเปิดพร้อมกัน ที่เหลือออกจากเกม', 'sys');
  emit(G, 'fx', { t: 'supDraft' });
  const ans = (G.players.map((P, i) => ask(G, P, { kind: 'supporterPick', title: 'เลือกผู้สนับสนุน 1 ใบ อีก 4 ใบออกจากเกม', cards: hands[i],
    options: hands[i].map((c, j) => ({ value: j, label: c.d.name, sub: supSub(c.d), card: c })) })));
  G.players.forEach((P, i) => { const j = Number.isInteger(ans[i]) && hands[i][ans[i]] ? ans[i] : 0; P.supporter = hands[i][j]; });
  for (const P of G.players) log(G, `${P.name} เปิดผู้สนับสนุน ${P.supporter.d.name} · ${P.supporter.d.leader} (แท็ก ${TAG_TEXT(P.supporter.d.tags)})`, 'sup', P.id);
  emit(G, 'fx', { t: 'supReveal' });
}

// ---------- payments ----------
// Where the goods of a payment come from is the payer's choice (rules 5.1: any of the state's projects or the warehouse).
// P.payFirst holds the order the player picked on the page (ruled 11 Nov): 'wh' takes from the warehouse first, 'proj'
// from the projects first, the project holding the most first. Unset (the AI, and every game before the choice
// existed), each payment keeps the order it always had: selling to the central market and fuel from the warehouse first,
// everything else from the projects first. The page changes it with a control that rides on the player's next answer,
// so every peer and every replay applies it at the same point of the game
const PAY_ORDERS = ['wh', 'proj'];
K.PAY_ORDERS = PAY_ORDERS;
function takeGoods(P, t, k, preferWh) {
  // remove k goods of type t: projects first (largest stock), warehouse last (or the reverse)
  if (P.payFirst === 'wh') preferWh = true; else if (P.payFirst === 'proj') preferWh = false;
  if (preferWh) { const w = Math.min(k, P.wh[t]); P.wh[t] -= w; k -= w; }
  if (k > 0) {
    const ps = P.projects.filter(p => p.d.out === t && p.goods > 0).sort((a, b) => b.goods - a.goods);
    for (const p of ps) { if (!k) break; const x = Math.min(k, p.goods); p.goods -= x; k -= x; }
  }
  if (k > 0) { const w = Math.min(k, P.wh[t]); P.wh[t] -= w; k -= w; }
  if (k > 0) throw new Error('takeGoods short ' + t);
}
function canPayGoods(P, need) { for (const t of GOODS) if (goodsOf(P, t) < (need[t] || 0)) return false; return true; }
function payGoods(P, need) { for (const t of GOODS) if (need[t]) takeGoods(P, t, need[t]); }
function costStr(c) {
  const parts = [];
  for (const t of ['mat', 'fuel', 'food', 'grav']) if (c[t]) parts.push(`${RES_NAME[t]} ${c[t]}`);
  return parts.length ? parts.join(' ') : 'ฟรี';
}
K.costStr = costStr; K.canPayGoods = canPayGoods;

// Plan a payment for a cost {mat,fuel,food,grav}. opts.joint: บริษัทร่วมทุน allowed, opts.loan: เงินกู้จำนองสัมปทาน allowed
function payPlan(G, P, cost, opts) {
  opts = opts || {};
  const short = {}; let sub = 0;
  for (const t of GOODS) { const s = Math.max(0, (cost[t] || 0) - goodsOf(P, t)); short[t] = s; sub += s; }
  if (sub > 0 && !(opts.joint && has(P, 'บริษัทร่วมทุน'))) return { ok: false, why: 'สินค้าไม่พอ', short };
  const gravNeed = (cost.grav || 0) + 3 * sub;
  let borrow = 0;
  if (P.grav < gravNeed) {
    if (opts.loan && has(P, 'เงินกู้จำนองสัมปทาน') && gravNeed - P.grav <= 5) borrow = gravNeed - P.grav;
    else return { ok: false, why: 'เกรฟไม่พอ', short };
  }
  return { ok: true, short, sub, gravNeed, borrow };
}
function execPay(G, P, cost, plan) {
  for (const t of GOODS) { const k = (cost[t] || 0) - plan.short[t]; if (k > 0) takeGoods(P, t, k); }
  if (plan.borrow) { P.grav += plan.borrow; P.loanDue += plan.borrow + 2; log(G, `${P.name} กู้ ${plan.borrow} เกรฟ ต้องคืน ${plan.borrow + 2} ตอนสภาประชุม`, 'eco', P.id); }
  P.grav -= plan.gravNeed;
  if (P.grav < 0) throw new Error('negative grav');
}
K.payPlan = payPlan; K.execPay = execPay; K.takeGoods = takeGoods;
// what a payment lacks, for a table that has to say why something did not happen (ruled 13 Nov): the goods short of the
// cost (none with บริษัทร่วมทุน, which turns them into grav at 3 a unit) and the grav still short once the joint venture and
// the mortgage loan (up to 5) have had their say. Reads payPlan's rules without paying; no rng
function payLack(G, P, cost, opts) {
  opts = opts || {};
  const joint = !!(opts.joint && has(P, 'บริษัทร่วมทุน'));
  const goods = []; let sub = 0;
  for (const t of GOODS) { const s = Math.max(0, (cost[t] || 0) - goodsOf(P, t)); if (s) { goods.push([t, s]); sub += s; } }
  const gravNeed = (cost.grav || 0) + (joint ? 3 * sub : 0);
  const room = opts.loan && has(P, 'เงินกู้จำนองสัมปทาน') ? 5 : 0;
  return { goods: joint ? [] : goods, grav: Math.max(0, gravNeed - P.grav - room), gravNeed, joint };
}
const lackStr = L => L.goods.map(([t, n]) => `${RES_NAME[t]} ${n}`).concat(L.grav ? [`เกรฟ ${L.grav}`] : []).join(' ');
K.payLack = payLack; K.lackStr = lackStr;

function projectCost(G, P, d, annex) {
  if (annex && G.rules && G.rules.annexFree) return { mat: 0, fuel: 0, food: 0, grav: expansionCost(G, P) };
  const c = { mat: d.cost.mat || 0, fuel: d.cost.fuel || 0, food: d.cost.food || 0, grav: d.cost.grav || 0 };
  let red = (annex ? (sup(P, 'wildwardens') ? 4 : 2) : 0) + (has(P, 'สถาบันวิศวกร') ? 1 : 0) + (P.projDiscount || 0);
  const total = c.mat + c.fuel + c.food;
  red = Math.min(red, Math.max(0, total - 1));
  for (let i = 0; i < red; i++) {
    let best = null, bs = -1e9;
    for (const t of GOODS) if (c[t] > 0) { const s = (c[t] - goodsOf(P, t)) * 10 + c[t]; if (s > bs) { bs = s; best = t; } }
    if (!best) break;
    c[best]--;
  }
  c.grav += expansionCost(G, P);
  return c;
}
// ค่าขยายรัฐ: grav surcharge for every project owned beyond the free allowance
function expansionCost(G, P) {
  const f = G.rules && G.rules.expansionFree;
  if (f == null) return 0;
  const x = Math.max(0, P.projects.length + 1 - f) * (G.rules.expansionStep || 1);
  return sup(P, 'celestia') ? Math.max(0, x - 2) : x;   // สภาการค้าและคลังแห่งซีเลสเทีย: 2 grav less
}
K.expansionCost = expansionCost;
// what a won exploration pays out: half the printed production rounded up, or the whole production under exploreFull
function exploreGain(G, d) { return G.rules && G.rules.exploreFull ? d.outN : Math.ceil(d.outN / 2); }
// goods a won raid takes from the target project before card effects: half the printed production rounded up, as far
// as the project holds it; under raidStock half of what the project holds, rounded up. Grav projects keep the old rule.
function raidTake(G, pr) { return G.rules && G.rules.raidStock ? Math.ceil(pr.goods / 2) : Math.min(pr.goods, Math.ceil(pr.d.outN / 2)); }
K.exploreGain = exploreGain; K.raidTake = raidTake;
function researchCost(G, P, d) {
  const c = { mat: d.cost.mat || 0, fuel: d.cost.fuel || 0, food: d.cost.food || 0, grav: d.cost.grav || 0 };
  let disc = 0;
  if (d.kind === 'culture') { if (has(P, 'จารีตตระกูล')) disc++; if (has(P, 'ฟื้นฟูวัฒนธรรมชาติ')) disc++; if (isRegime(G, 'ราชาธิปไตย')) disc++; }
  if (d.kind === 'innovation') { if (has(P, 'หอตำรา')) disc++; if (isRegime(G, 'เทคโนแครต')) disc += 2; if (sup(P, 'freemagic')) disc++; }
  if (c.grav > 0) c.grav = Math.max(1, c.grav - disc);
  if (d.kind === 'building' && sup(P, 'blackwood') && c.mat > 1) c.mat--;   // สมาคมแบล็ควูด: 1 material less, not below 1
  if (has(P, 'คอมพิวเตอร์มานา')) {
    for (let i = 0; i < 2; i++) {
      let best = null, bs = 0;
      for (const t of GOODS) if (c[t] > 0) { const s = c[t] - goodsOf(P, t); if (s > 0 && s + 1 > bs) { bs = s + 1; best = t; } }
      if (best) { c[best]--; continue; }
      if (c.grav > 1) { c.grav--; continue; }
      const any = GOODS.find(t => c[t] > 0);
      if (any) c[any]--;
    }
  }
  return c;
}
Object.assign(K, { projectCost, researchCost });

// ---------- currents & regimes ----------
function moveCurrent(G, line, dir, who) {
  const before = G.currents[line];
  G.currents[line] = Math.max(0, Math.min(9, before + dir));
  if (G.currents[line] !== before) log(G, `${who ? who.name + ' ' : ''}ขยับกระแส${LINE_NAME[line]} ${dir > 0 ? '+1' : '-1'} (เป็น ${G.currents[line]})`, 'cur', who ? who.id : -1);
}
K.moveCurrent = moveCurrent;
// only: restrict the push to one line, upward (the church, hall and monument push their own line up)
function askCurrent(G, P, title, optional, only) {
  const options = [];
  for (const l of LINES) {
    if (only && l !== only) continue;
    options.push({ value: { line: l, dir: 1 }, label: `${LINE_NAME[l]} +1`, sub: `ตอนนี้ ${G.currents[l]}${flipNote(G, l)}`, line: l });
    if (!only && G.currents[l] > 0) options.push({ value: { line: l, dir: -1 }, label: `${LINE_NAME[l]} −1`, sub: `ตอนนี้ ${G.currents[l]}`, line: l });
  }
  const v = ask(G, P, { kind: 'current', title: title || 'ขยับกระแส', options, allowNone: optional !== false ? 'ไม่ขยับ' : null, only: only || null });
  // an answer must be one of the options offered (a restricted push cannot move another line)
  if (v && options.some(o => o.value.line === v.line && o.value.dir === v.dir)) {
    moveCurrent(G, v.line, v.dir, P);
    if (G.rules.instantFlip) resolveFlip(G);
  }
}
// rules 0.4.7: what one more step up does when it reaches the flip point (the choice says so before the push)
function flipNote(G, l) {
  if (!G.rules.instantFlip || G.currents[l] + 1 < G.tip) return '';
  const r = regimeOf(G.regimeSet, l);
  return !r ? '' : r.name === G.regime ? ' · ถึงจุดเปลี่ยน สายที่ครองอยู่กลับเป็น 0 ทันที' : ` · ถึงจุดเปลี่ยน ${r.name}ขึ้นครองทันที`;
}
K.flipNote = flipNote;
// a current at the flip point takes power (rules 11.4): the highest such line, the first player choosing between equals;
// that line goes back to 0, and a line whose regime already rules only goes back to 0. Rules 0.4.7 run this right after
// every push (one line reaches the flip point at a time); the older rules once at every council, after the scoring
function resolveFlip(G) {
  const over = LINES.filter(l => G.currents[l] >= G.tip);
  if (!over.length) return;
  const m = Math.max(...over.map(l => G.currents[l]));
  let tied = over.filter(l => G.currents[l] === m);
  let line = tied[0];
  if (tied.length > 1) {
    const FP = G.players[G.first];
    line = ask(G, FP, { kind: 'flipTie', title: 'กระแสถึงจุดเปลี่ยนพร้อมกัน: ผู้เล่นคนแรกเลือกสาย', options: tied.map(l => ({ value: l, label: LINE_NAME[l], sub: `ระบอบ${regimeOf(G.regimeSet, l).name}`, reg: regimeOf(G.regimeSet, l) })) });
  }
  const reg = regimeOf(G.regimeSet, line);
  G.currents[line] = 0;
  if (reg.name !== G.regime) {
    setRegime(G, reg.name, `กระแส${LINE_NAME[line]}พลิก`); G.stats.flips++;
    if (G.rules.instantFlip && G.phase !== 'council') G.stats.flipsNow = (G.stats.flipsNow || 0) + 1;
    emit(G, 'fx', { t: 'flip', line });
    if (G.rules.flipScore) { G.stats.flipScores++; scoreRegime(G, 'กระแสพลิก นับคะแนนระบอบใหม่ทันที', true); emit(G, 'fx', { t: 'score', flip: true }); }
  }
  else log(G, `กระแส${LINE_NAME[line]}ถึงจุดเปลี่ยนแต่ครองอำนาจอยู่แล้ว รีเซ็ตเป็น 0`, 'cur');
}
K.resolveFlip = resolveFlip;

function metricOf(G, P, regName) {
  switch (regName || G.regime) {
    case 'ราชาธิปไตย': return cultures(P);
    case 'สาธารณรัฐพ่อค้า': return P.grav;
    case 'ประชาคมเสรี': return totalWorkers(P);
    case 'ระบอบขุนศึก': return armyCards(P).length;
    case 'ปราชญาธิปไตย': return innovations(P);
    case 'ชาตินิยม': return P.projects.length;
    case 'มานาเสรี': return buildingsOf(P).length;
    case 'ประชาธิปไตยสังคม': return goodsOf(P, 'food');
    // rules 0.4.7: the arms symbols on the state's symbol track (projects, buildings, research, the supporter's tags)
    case 'รัฐบาลทหาร': return G.rules.juntaSym ? symCount(P, 'arms') : armyCards(P).filter(c => c.d.era >= 2).length;
    case 'เทคโนแครต': return researchCount(P);
  }
  return 0;
}
K.metricOf = metricOf;
// points per player for given metric values (array), with tie rules: highTie[i] true takes the top points of its tied group
// when no other state of the group holds the same right (ขุนนางสืบตระกูล); 2 takes them in every tie (ตระกูลคอร์วัส), and a
// group that holds a 2 leaves every similar right to the normal tie rule (ruled 11 Nov: คอร์วัส comes first)
function pointsFor(G, vals, highTie) {
  const pts = rankPts(G);
  const idx = vals.map((v, i) => i).sort((a, b) => vals[b] - vals[a]);
  const out = vals.map(() => 0);
  let k = 0;
  while (k < idx.length) {
    let m = k; while (m + 1 < idx.length && vals[idx[m + 1]] === vals[idx[k]]) m++;
    const grp = idx.slice(k, m + 1);
    const low = pts[m] || 0, high = pts[k] || 0;
    const first = !!highTie && grp.some(i => highTie[i] === 2);
    const holders = first ? [] : grp.filter(i => highTie && highTie[i] && highTie[i] !== 2);
    for (const i of grp) {
      if (vals[i] <= 0) { out[i] = 0; continue; }
      const always = !!highTie && highTie[i] === 2;
      out[i] = (grp.length > 1 && (always || (holders.length === 1 && holders[0] === i))) ? high : low;
    }
    k = m + 1;
  }
  return out;
}
K.pointsFor = pointsFor;
// who takes the top points of a tied group: ขุนนางสืบตระกูล, and ตระกูลคอร์วัส from era III on
function tieHigh(G) { return G.players.map(P => (sup(P, 'corvus') && G.era >= 2) ? 2 : has(P, 'ขุนนางสืบตระกูล')); }
K.tieHigh = tieHigh;
function setRegime(G, name, how) {
  const old = G.regime;
  G.regime = name;
  G.stats.regimes.push({ name, round: G.round, how });
  log(G, `ระบอบเปลี่ยนจาก ${old} เป็น ${name} (${how})`, 'reg');
}

// ---------- bonus ----------
function drawBonusCard(G) {
  if (!G.bonusDeck.length) { G.bonusDeck = shuffle(G, G.bonusDiscard); G.bonusDiscard = []; }
  return G.bonusDeck.shift();
}
function drawBonus(G, P, pick2) {
  let card = drawBonusCard(G);
  if (!card) return;
  if (pick2) {
    const c2 = drawBonusCard(G);
    if (c2) {
      const v = ask(G, P, { kind: 'bonusPick', title: 'ตั๋วแลกเงิน: เลือกโบนัส 1 ใบ', cards: [card, c2],
        options: [{ value: 0, label: card.d.text }, { value: 1, label: c2.d.text }] });
      const keep = v === 1 ? c2 : card, back = v === 1 ? card : c2;
      G.bonusDeck.push(back); card = keep;
    }
  }
  log(G, `${P.name} ได้โบนัส: ${card.d.text}`, 'bonus', P.id);
  resolveBonus(G, P, card);
  G.bonusDiscard.push(card);
}
function resolveBonus(G, P, card) {
  switch (card.d.kind) {
    case 'goods2':
      for (let i = 0; i < 2; i++) {
        const t = ask(G, P, { kind: 'goodsType', title: `โบนัส: เลือกสินค้าหน่วยที่ ${i + 1}`, options: GOODS.map(g => ({ value: g, label: RES_NAME[g] })) });
        P.wh[t]++;
      }
      break;
    case 'grav3': P.grav += 3; break;
    case 'projDisc': P.projDiscount += 2; break;
    case 'current': askCurrent(G, P, 'โบนัส: ขยับกระแส 1 ช่อง'); break;
    case 'mil2': gainMilitary(G, P, 2, 'โบนัส'); break;
    case 'legit1': addLegit(G, P, 1, 'การ์ดโบนัส'); break;
    case 'stigma': if (P.stigma > 0) { addStigma(G, P, -1, 'การ์ดโบนัส ล้างตราบาป'); log(G, `${P.name} ล้างตราบาป 1 ใบ (เหลือ ${P.stigma})`, 'bonus', P.id); } else { P.grav += 2; log(G, `${P.name} ไม่มีตราบาป รับเกรฟ 2 แทน`, 'bonus', P.id); } break;
    case 'worker': if (P.hired < 8) { P.hired++; log(G, `${P.name} ได้แรงงานเพิ่มฟรี (รวม ${totalWorkers(P)})`, 'eco', P.id); } else log(G, `${P.name} มีแรงงานครบ 10 คนแล้ว โบนัสนี้ไม่มีผล`, 'bonus', P.id); break;
  }
}

// ---------- military cards ----------
function drawReform(G, k) { const d = G.reformDecks[G.era]; return d.splice(0, Math.min(k, d.length)); }
// keep: cards to take from the draw (the cannon foundry lets a reform keep two)
// hold (rules 0.4.1, the reform only): the kept cards wait beside the army until the cull is done
function gainMilitary(G, P, k, src, keep, hold) {
  const drawn = drawReform(G, k);
  if (!drawn.length) { log(G, `${P.name}: กองปฏิรูปหมด`, 'mil', P.id); return null; }
  const n = Math.min(keep || 1, drawn.length);
  const toDeck = !!G.rules.deckReform, got = [];
  let pick = null;
  for (let t = 0; t < n; t++) {
    const i = ask(G, P, { kind: 'milPick', title: n > 1 ? `${src}: เลือกการ์ดทหารเข้ากองทัพ ใบที่ ${t + 1}/${n}` : `${src}: เลือกการ์ดทหาร 1 ใบเข้ากองทัพ`, cards: drawn,
      options: drawn.map((c, j) => ({ value: j, label: c.d.name, sub: milSub(c.d), card: c })) });
    pick = drawn[i] || drawn[0];
    if (toDeck) {
      (hold || got).push(pick);
      drawn.splice(drawn.indexOf(pick), 1);
      log(G, `${P.name} ได้${pick.d.name} (พลัง ${pick.d.power}) เข้ากองทัพ`, 'mil', P.id);
      continue;
    }
    P.army.disc.push(pick);
    emit(G, 'fx', { t: 'milGain', pid: P.id, uid: pick.uid });
    drawn.splice(drawn.indexOf(pick), 1);
    log(G, `${P.name} ได้${pick.d.name} (พลัง ${pick.d.power}) เข้ากองพัก`, 'mil', P.id);
  }
  G.reformDecks[G.era].push(...drawn);
  if (got.length) shuffleIntoDeck(G, P, got);
  return pick;
}
// rules 0.4.1: new troops join the ranks at once; the deck is shuffled after anyone has looked through it
function shuffleIntoDeck(G, P, cards) {
  P.army.deck.push(...cards);
  shuffle(G, P.army.deck);
  if (!cards.length) return;
  log(G, `${P.name} สับ${cards.map(c => c.d.name).join(', ')}เข้ากองทหาร (กองทหาร ${P.army.deck.length} ใบ)`, 'mil', P.id);
  for (const c of cards) emit(G, 'fx', { t: 'milGain', pid: P.id, uid: c.uid, to: 'deck' });
}
function kwText(kw) {
  const o = [];
  if (kw.keep) o.push('ห้ามทิ้ง'); if (kw.fuel) o.push('เชื้อเพลิง'); if (kw.lead) o.push(`นำทัพ ${kw.lead}`);
  if (kw.def) o.push(`ตั้งรับ ${kw.def}`); if (kw.chg) o.push(`ทะลวง ${kw.chg}`); if (kw.int) o.push(`สกัด ${kw.int}`);
  if (kw.reinf) o.push('เสริมทัพ'); if (kw.scout) o.push(`สอดแนม ${kw.scout}`); if (kw.fire) o.push('อำนาจยิงเหนือกว่า');
  if (kw.sup) o.push(`สนับสนุน ${kw.sup}`); if (kw.surge) o.push(`โถมกำลัง ${kw.surge}`);
  return o.join(', ');
}
function milSub(d) { const k = kwText(d.kw); return `พลัง ${d.power}${k ? ' · ' + k : ''}${d.era >= 0 ? ' · ยุค ' + ['I', 'II', 'III', 'IV'][d.era] : ''}`; }
K.kwText = kwText; K.milSub = milSub;
// from: 'disc' (rules 0.4, true also means this): only cards in the discard pile, so nobody searches the army deck;
// 'deck' (the first draft of rules 0.4.1): the whole army deck, looked through at the reform and shuffled afterwards;
// 'army' (rules 0.4.1): the army deck and the discard pile, all shuffled together afterwards by the caller;
// anything else (rules 0.2 and 0.3): the deck and the discard pile
function removeMilitary(G, P, title, from, incoming) {
  const discOnly = from === true || from === 'disc', deckOnly = from === 'deck', army = from === 'army';
  const cands = (discOnly ? [] : P.army.deck.map(c => ({ c, from: 'deck' }))).concat(deckOnly ? [] : P.army.disc.map(c => ({ c, from: 'disc' }))).filter(x => !x.c.d.kw.keep);
  if (!cands.length) {
    if (discOnly) log(G, `${P.name}: กองพักไม่มีการ์ดที่ทิ้งได้`, 'mil', P.id);
    if (deckOnly) log(G, `${P.name}: กองทหารไม่มีการ์ดที่ทิ้งได้`, 'mil', P.id);
    return null;
  }
  const req = { kind: 'milRemove', title: title || 'ทิ้งการ์ดทหารออกจากเกมได้ 1 ใบ', discOnly: !!discOnly,
    options: cands.map(x => ({ value: x.c.uid, label: x.c.d.name, sub: milSub(x.c.d) + (x.from === 'disc' ? ' · กองพัก' : ' · กองทหาร'), card: x.c })),
    allowNone: 'ไม่ทิ้ง' };
  if (deckOnly) { req.deckOnly = true; req.incoming = (incoming || []).map(c => c.d.name); }
  if (army) { req.armyAll = true; req.incoming = (incoming || []).map(c => c.d.name); }
  const uid = ask(G, P, req);
  if (uid == null) return null;
  let gone = null;
  for (const where of ['deck', 'disc']) {
    const i = P.army[where].findIndex(c => c.uid === uid);
    if (i >= 0) { const [c] = P.army[where].splice(i, 1); P.removed.push(c); gone = c; if (where === 'deck' && !deckOnly && !army) shuffle(G, P.army.deck); log(G, `${P.name} ทิ้ง${c.d.name}ออกจากเกม`, 'mil', P.id); }
  }
  return gone;
}
function permutations(a) {
  if (a.length <= 1) return [a.slice()];
  const out = [];
  a.forEach((x, i) => { for (const p of permutations(a.slice(0, i).concat(a.slice(i + 1)))) out.push([x].concat(p)); });
  return out;
}
function reshuffleArmy(G, P) { P.army.deck = shuffle(G, P.army.deck.concat(P.army.disc)); P.army.disc = []; }

// =====================================================================
// BATTLE (generator: yields decisions {kind:'scout', ...})
// side spec: {P} for a state, {neutral:true}
// =====================================================================
function battleMods(G, P, role, type, consume, pr) {
  // total power +X from cards/buildings (rule 13.4); pr = the project under attack, when there is one
  let v = 0; const used = [];
  if (P) {
    for (const m of P.mods) if (m.kind === 'next' || (m.kind === 'nextDef' && role === 'def')) { v += m.v; used.push(m); }
    // rules 0.4.5 (milV3): the doctrine strikes harder card by card instead (battleGen), and the voxophone net adds 1
    // whenever its state defends, a coup included
    const v3 = !!(G.rules && G.rules.milV3);
    if (role === 'att' && !v3 && has(P, 'หลักนิยมการรบแยกเดี่ยวฆ่าหมู่')) v += 1;
    if (role === 'def' && (type === 'attack' || v3) && has(P, 'วอกโซโฟนทอดสัญญาณ')) v += 1;
    // the culture card was renamed หน่วยพิทักษ์ธรรม in 0.4.4; older datasets keep the old name
    if (role === 'def' && type === 'coup' && (has(P, 'จันทราอารักษ์') || has(P, 'หน่วยพิทักษ์ธรรม'))) v += 2;
    if (P.pb) {
      if (role === 'att') v += bldOn(P, 'โรงประจุกระสุนมานา') + 2 * bldOn(P, 'ฐานเรือเหาะรบ');
      if (role === 'def') v += 2 * bldOn(P, 'ป้อมบาเรียร์ริมน้ำ');
      if (role === 'def' && type === 'attack' && pr && P.projects.includes(pr)) v += 2 * bldOnProj(P, pr, 'ปราสาทตระกูล');
    }
    if (consume && used.length) P.mods = P.mods.filter(m => !used.includes(m));
  }
  if (role === 'def' && isRegime(G, 'ชาตินิยม')) v += 2;
  return v;
}
K.battleMods = battleMods;

function* battleGen(G, A, Dd, size, type, opt) {
  // opt: {sim, r (rng), fuel:[a,d] budgets for sim, decks:[a,d] for sim}
  const r = opt.r || G.r;
  const v3 = !!(G.rules && G.rules.milV3);
  const mk = (spec, role, i) => {
    const s = { role, P: spec.P || null, neutral: !!spec.neutral, revealed: [], counted: 0, pendingSup: 0, ramjetUsed: false, bonus: 0, events: [] };
    if (opt.sim) { s.deck = opt.decks[i].deck; s.disc = opt.decks[i].disc; s.fuel = opt.fuel[i]; }
    else if (s.neutral) { s.deck = shuffleWith(r, G.neutral.slice()); s.disc = []; }
    else { s.deck = s.P.army.deck; s.disc = s.P.army.disc; }
    // the military command centre (rules 0.4) readies the whole army before every battle of its state
    if (s.P && s.P.pb && bldOn(s.P, 'ศูนย์บัญชาการทหาร') && s.disc.length) { s.deck.push(...s.disc.splice(0)); shuffleWith(r, s.deck); if (!opt.sim) ev.push({ side: i, t: 'shuffle' }); }
    s.total = s.deck.length + s.disc.length;
    s.need = Math.min(size, s.total);
    s.bonus = battleMods(G, s.P, role, type, !opt.sim, spec.pr) + (opt.extra ? opt.extra[i] : 0);
    s.spear = !v3 && !!(s.P && has(s.P, 'ประเพณีนักรบ'));
    s.camp = !v3 && role === 'att' && s.P ? bldOn(s.P, 'ค่ายฝึกทหาร') : 0;   // drilled levy: spearmen and archers +1 when attacking
    s.ramjet = !!(s.P && has(s.P, 'เครื่องยนต์มานาแรมเจ็ท'));
    // rules 0.4.5 (milV3, the designer's table v3 of 11 Nov): defending, every card with ตั้งรับ defends 1 more (ประเพณีนักรบ);
    // attacking, every card with ทะลวง charges 1 more for each working training camp (ค่ายฝึกทหาร) and every card with สกัด
    // strikes 1 more (หลักนิยมการรบแยกเดี่ยวฆ่าหมู่); the ramjet gives every card that burns fuel ทะลวง 1 more, and a card
    // that has ทะลวง only from the ramjet counts as a card with ทะลวง for the camp
    s.defUp = v3 && role === 'def' && s.P && has(s.P, 'ประเพณีนักรบ') ? 1 : 0;
    s.chgUp = v3 && role === 'att' && s.P ? bldOn(s.P, 'ค่ายฝึกทหาร') : 0;
    s.intUp = v3 && role === 'att' && s.P && has(s.P, 'หลักนิยมการรบแยกเดี่ยวฆ่าหมู่') ? 1 : 0;
    s.fuelChg = v3 && s.ramjet ? 1 : 0;
    s.wire = !!(s.P && role === 'def' && has(s.P, 'ลวดหนาม'));
    // supporters (mode รัฐที่แตกแยก): the first card of an attack or a coup leads 1 more (หน่วยสุริยะพิฆาต), era III and IV
    // troops +1 (ภาคีเปลวสุริยา), every troop that intercepts also supports 1 (ฟอซาร์เคน ฟรอนท์, ruled 11 Nov; spearmen
    // defended 1 before)
    s.sunLead = !!(s.P && role === 'att' && (type === 'attack' || type === 'coup') && sup(s.P, 'sunslayer'));
    s.flame = !!(s.P && sup(s.P, 'sunflame'));
    s.intSup = !!(s.P && sup(s.P, 'fozarken'));
    return s;
  };
  const ev = [];
  const S = [mk(A, 'att', 0), mk(Dd, 'def', 1)];
  const sumNow = s => s.revealed.reduce((a, c) => a + (c.destroyed ? 0 : c.cur), 0);
  // before the first card turns: กองทหารเสื้อคลุมน้ำเงิน looks at the top 2 of the blue cloak deck, ตระกูลเวนเดทเทีย at the
  // top 2 of the other state's army deck, and either may put one of them at the bottom (attacker first)
  for (const si of [0, 1]) {
    const s = S[si], o = S[1 - si];
    if (!s.P || !o.deck.length) continue;
    const by = o.neutral ? (sup(s.P, 'bluecoats') ? 'bluecoats' : null) : (o.P && sup(s.P, 'vendettia') ? 'vendettia' : null);
    if (!by) continue;
    const top = o.deck.slice(0, 2);
    const ans = yield { kind: 'peek', si, by, theirs: top, s, o };
    if (Number.isInteger(ans) && ans >= 0 && ans < top.length) {
      const m = o.deck.splice(ans, 1)[0]; o.deck.push(m);
      if (!opt.sim) ev.push({ side: si, t: 'peek', name: m.d.name });
      s.peekNote = `ส่ง ${m.d.name} ของอีกฝ่ายไปใต้กอง`;
    } else s.peekNote = 'ดูแล้วไม่ย้าย';
  }
  // วอกโซโฟนทอดสัญญาณ (rules 0.4.5): before the first card turns, the defender looks at the top 2 cards of the attacker's
  // army deck (as many as there are) and may discard any of them, none, one or both, to that army's discard pile
  if (v3 && S[1].P && S[0].P && has(S[1].P, 'วอกโซโฟนทอดสัญญาณ') && S[0].deck.length) {
    const s = S[1], o = S[0], top = o.deck.slice(0, 2);
    const ans = yield { kind: 'voxPeek', si: 1, theirs: top, s, o };
    const pick = Array.isArray(ans) ? [...new Set(ans)].filter(i => Number.isInteger(i) && i >= 0 && i < top.length).sort((a, b) => a - b) : [];
    const gone = pick.map(i => top[i]);
    for (const m of gone) { o.deck.splice(o.deck.indexOf(m), 1); o.disc.push(m); }
    if (!opt.sim) ev.push({ side: 1, t: 'vox', names: gone.map(m => m.d.name) });
    s.voxNote = gone.length ? `วอกโซโฟน ทิ้ง${gone.map(m => m.d.name).join(' กับ ')}ของอีกฝ่ายลงกองพัก` : 'วอกโซโฟน ดูแล้วไม่ทิ้ง';
    if (!opt.sim) s.voxGone = gone.map(m => m.d.name);
  }
  function payFuel(s) {
    if (opt.sim) { if (s.fuel > 0) { s.fuel--; return true; } return false; }
    if (goodsOf(s.P, 'fuel') > 0) { takeGoods(s.P, 'fuel', 1, true); return true; }
    return false;
  }
  function* reveal(si, extra) {
    const s = S[si], o = S[1 - si];
    if (!s.deck.length) {
      if (!s.disc.length) return;
      const nd = shuffleWith(r, s.disc.splice(0));
      s.deck.push(...nd);
      if (!opt.sim) ev.push({ side: si, t: 'shuffle' });
    }
    const instc = s.deck.shift();
    const kw = s.neutral ? {} : instc.d.kw;
    const base = cardPower(G, instc);
    const c = { inst: instc, name: instc.d.name, kw, base, cur: base, destroyed: false, extra: !!extra, notes: [] };
    s.revealed.push(c);
    if (!extra) s.counted++;
    if (s.pendingSup) { c.cur += s.pendingSup; c.fuelFree = true; c.notes.push(`สนับสนุน +${s.pendingSup}`); if (!opt.sim) { c.supFrom = s.supFrom; c.supIn = s.pendingSup; } s.pendingSup = 0; }
    let dry = false;
    if (kw.fuel) {
      if (c.fuelFree) c.notes.push('ไม่ต้องจ่ายเชื้อเพลิง');
      else if (s.ramjet && !s.ramjetUsed) { s.ramjetUsed = true; c.notes.push('แรมเจ็ท ไม่ต้องจ่ายเชื้อเพลิง'); }
      else if (payFuel(s)) c.notes.push('จ่ายเชื้อเพลิง 1');
      else { c.cur = 0; dry = true; c.notes.push('ไม่มีเชื้อเพลิง พลังเป็น 0'); }
      if (!opt.sim) c.dry = dry;
    }
    if (s.flame && !dry && instc.d.era >= 2) { c.cur += 1; c.notes.push('ภาคีเปลวสุริยา +1'); }
    if (s.sunLead && s.revealed.length === 1) c.notes.push('หน่วยสุริยะพิฆาต นำทัพ +1');
    if (s.peekNote && s.revealed.length === 1) { c.notes.push(s.peekNote); s.peekNote = null; }
    if (s.voxNote && s.revealed.length === 1) { c.notes.push(s.voxNote); s.voxNote = null; }
    if (kw.int) {
      let tgt = null;
      for (const x of o.revealed) if (!x.destroyed && (!tgt || x.cur > tgt.cur)) tgt = x;
      if (tgt && tgt.cur > 0) {
        const iv = kw.int + s.intUp;
        const before = tgt.cur; tgt.cur = Math.max(0, tgt.cur - iv); c.notes.push(`สกัด ${tgt.name} ${before}→${tgt.cur}${s.intUp ? ` (หลักนิยมการรบแยกเดี่ยวฆ่าหมู่ สกัด +${s.intUp})` : ''}`);
        // for the battle view: the card struck and by how much, and the cuts a card took in all
        if (!opt.sim) { c.hit = { k: o.revealed.indexOf(tgt), d: before - tgt.cur }; tgt.cut = (tgt.cut || 0) + (before - tgt.cur); }
      }
    }
    if (kw.scout) {
      const ans = yield { kind: 'scout', si, X: kw.scout, mine: s.deck.slice(0, kw.scout), theirs: o.deck.slice(0, kw.scout), s, o };
      if (ans && ans.which) {
        const deck = ans.which === 'mine' ? s.deck : o.deck;
        const k = Math.min(kw.scout, deck.length);
        if (ans.idx >= 0 && ans.idx < k) { const [m] = deck.splice(ans.idx, 1); deck.push(m); if (!opt.sim) c.scouted = ans.which; c.notes.push(`สอดแนม ส่ง ${m.d.name} ของ${ans.which === 'mine' ? 'ฝ่ายตน' : 'อีกฝ่าย'}ไปใต้กอง`); }
        else c.notes.push('สอดแนม ไม่ย้ายการ์ด');
      }
    }
    if (kw.fire) {
      const latest = [...o.revealed].reverse().find(x => !x.destroyed);
      if (latest && sumNow(s) > sumNow(o)) {
        latest.destroyed = true; c.notes.push(`อำนาจยิงเหนือกว่า ทำลาย ${latest.name}`);
        if (!opt.sim) c.shot = o.revealed.indexOf(latest);
        if (!o.neutral) { const i = o.revealed.indexOf(latest); latest.toDisc = true; o.disc.push(latest.inst); void i; }
      }
    }
    if (kw.sup) { s.pendingSup = kw.sup; s.supFrom = s.revealed.indexOf(c); }
    if (s.intSup && kw.int) { s.pendingSup = (kw.sup || 0) + 1; s.supFrom = s.revealed.indexOf(c); c.notes.push('ฟอซาร์เคน ฟรอนท์ สนับสนุน 1'); }
    if (!opt.sim) ev.push({ side: si, t: 'card', c });
    if (kw.reinf) { c.notes.push('เสริมทัพ'); yield* reveal(si, true); }
  }
  // alternate reveals
  let guard = 0;
  while ((S[0].counted < S[0].need && (S[0].deck.length || S[0].disc.length)) || (S[1].counted < S[1].need && (S[1].deck.length || S[1].disc.length))) {
    if (S[0].counted < S[0].need && (S[0].deck.length || S[0].disc.length)) yield* reveal(0, false);
    if (S[1].counted < S[1].need && (S[1].deck.length || S[1].disc.length)) yield* reveal(1, false);
    if (++guard > 100) break;
  }
  // the tally: what every card counts, its power now with the banners before it, its surge, its shield or its charge.
  // Pure, so a side can see the totals before it decides to feed the mass army
  const wire = S[1].wire;
  const chgOf = (s, c) => {
    if (s.role !== 'att' || wire) return 0;
    const x = (c.kw.chg || 0) + (c.kw.fuel ? s.fuelChg : 0);
    return x ? x + s.chgUp : 0;
  };
  function tally(s) {
    let t = 0, before = 0; const leads = [], rows = [];
    s.revealed.forEach((c, i) => {
      const lead = leads.reduce((a, x) => a + x, 0);
      const surge = c.kw.surge ? (c.kw.surge + (c.surgeUp || 0)) * before : 0;
      const def = s.role === 'def' && c.kw.def ? c.kw.def + s.defUp : 0;
      const chg = chgOf(s, c);
      // rules before 0.4.5: spearmen defend 1 with ประเพณีนักรบ, spearmen and archers +1 when attacking with ค่ายฝึกทหาร
      const old = (s.role === 'def' && s.spear && c.name === 'พลหอก' ? 1 : 0) + (s.camp && (c.name === 'พลหอก' || c.name === 'พลธนู') ? s.camp : 0);
      const v = c.destroyed ? 0 : c.cur + lead + surge + def + chg + old;
      rows.push({ v, lead, surge, def, chg, old }); t += v;
      if (c.kw.lead) leads.push(c.kw.lead);
      if (i === 0 && s.sunLead) leads.push(1);
      before++;
    });
    return { t: t + s.bonus, rows };
  }
  // กองทัพมหาชน (rules 0.4.5): once in every battle, after the last card has turned, its state may pay 3 food to raise the
  // โถมกำลัง of one of its revealed cards by 1, so that card counts 1 more for every card its side turned before it. The
  // attacker decides first, then the defender. Only who wins counts in a battle, so the state is asked only when the push
  // turns a lost battle into a won one, and only cards that can do that are offered
  if (v3) for (const si of [0, 1]) {
    const s = S[si];
    if (!s.P || !has(s.P, 'กองทัพมหาชน') || goodsOf(s.P, 'food') < MASS_FOOD) continue;
    const T0 = tally(S[0]), T1 = tally(S[1]), now = [T0.t, T1.t];
    const need = si === 0 ? now[1] - now[0] + 1 : now[0] - now[1];   // what the side lacks to win; ties go to the defender
    if (need <= 0) continue;
    const cand = s.revealed.map((c, k) => k).filter(k => !s.revealed[k].destroyed && s.revealed[k].kw.surge && k >= need);
    if (!cand.length) continue;
    const ans = yield { kind: 'massSurge', si, s, o: S[1 - si], cand, now, need, vals: [T0.rows.map(x => x.v), T1.rows.map(x => x.v)] };
    if (Number.isInteger(ans) && cand.includes(ans)) {
      const c = s.revealed[ans];
      c.surgeUp = 1;
      if (!opt.sim) { takeGoods(s.P, 'food', MASS_FOOD); c.massFed = true; ev.push({ side: si, t: 'mass', k: ans }); }
      c.notes.push(`กองทัพมหาชน จ่ายอาหาร ${MASS_FOOD} โถมกำลัง +1`);
    }
  }
  const totals = S.map(s => {
    const T = tally(s);
    s.revealed.forEach((c, i) => {
      const x = T.rows[i];
      c.final = x.v;
      // for the battle view: what each skill added to this card, what a destroyed card would have counted, and the
      // research cards behind a bonus
      if (!opt.sim) {
        c.adds = { lead: x.lead, surge: x.surge, def: x.def, chg: x.chg };
        if (c.destroyed) c.lost = c.cur + x.lead + x.surge + x.def + x.chg + x.old;
        else {
          if (x.def && s.defUp) c.notes.push(`ประเพณีนักรบ ตั้งรับ +${s.defUp}`);
          if (x.chg && s.chgUp) c.notes.push(`ค่ายฝึกทหาร ทะลวง +${s.chgUp}`);
          if (x.chg && c.kw.fuel && s.fuelChg) c.notes.push(`แรมเจ็ท ทะลวง +${s.fuelChg}`);
        }
      }
    });
    return T.t;
  });
  const winner = totals[0] > totals[1] ? 0 : 1;
  return { winner, totals, sides: S, ev, size };
}

function finishBattle(G, res) {
  // revealed cards to discard piles (neutral returns)
  for (const s of res.sides) {
    if (s.neutral) continue;
    for (const c of s.revealed) if (!c.toDisc) s.disc.push(c.inst);
  }
}

function runBattle(G, A, Dd, size, type, info) {
  const it = battleGen(G, A, Dd, size, type, {});
  let step = it.next();
  while (!step.done) {
    const q = step.value;
    let ans = null;
    if (q.kind === 'peek') {
      const who = q.by === 'bluecoats' ? 'กองทหารเสื้อคลุมน้ำเงิน' : 'ตระกูลเวนเดทเทีย';
      const oppName = q.o.P ? 'กองทหารของ' + q.o.P.name : 'กองเสื้อคลุมน้ำเงิน';
      ans = ask(G, q.s.P, { kind: 'peek', title: `${who}: การ์ด 2 ใบบนสุดของ${oppName} (ลำดับจากบน) ส่งใบหนึ่งไปใต้กองได้`, by: q.by, q, live: liveBattle(q),
        options: q.theirs.map((c, i) => ({ value: i, label: `${i + 1}. ${c.d.name}`, sub: `พลัง ${cardPower(G, c)}${c.neutral ? '' : (kwText(c.d.kw) ? ' · ' + kwText(c.d.kw) : '')} → ส่งไปใต้กอง`, card: c })),
        allowNone: 'ไม่ย้าย วางกลับตามเดิม' });
      log(G, Number.isInteger(ans) && q.theirs[ans] ? `${q.s.P.name} ใช้${who} ดูการ์ดบนสุดของ${oppName} แล้วส่งใบหนึ่งไปใต้กอง` : `${q.s.P.name} ใช้${who} ดูการ์ดบนสุดของ${oppName} แล้ววางกลับตามเดิม`, 'mil', q.s.P.id);
    }
    if (q.kind === 'voxPeek') {
      // the discard pile is face up, so the log names the cards sent there; the ones put back stay unnamed
      const t = q.theirs, one = (i, more) => ({ value: [i], label: `ทิ้ง${t[i].d.name}`, sub: `ใบที่ ${i + 1} จากบน · พลัง ${cardPower(G, t[i])}${kwText(t[i].d.kw) ? ' · ' + kwText(t[i].d.kw) : ''}${more}`, card: t[i] });
      const options = t.map((c, i) => one(i, t.length > 1 ? ` · อีกใบวางกลับ` : ''));
      if (t.length > 1) options.push({ value: [0, 1], label: 'ทิ้งทั้ง 2 ใบ', sub: `${t[0].d.name} กับ ${t[1].d.name}`, cards: t.slice() });
      ans = ask(G, q.s.P, { kind: 'voxPeek', title: `วอกโซโฟนทอดสัญญาณ: การ์ด ${t.length} ใบบนสุดของกองทหารของ${q.o.P.name} (ลำดับจากบน) ทิ้งลงกองพักได้`, q, live: liveBattle(q), options, allowNone: 'ไม่ทิ้ง วางกลับตามเดิม' });
      const gone = Array.isArray(ans) ? [...new Set(ans)].filter(i => Number.isInteger(i) && t[i]).map(i => t[i].d.name) : [];
      log(G, gone.length ? `${q.s.P.name} ใช้วอกโซโฟนทอดสัญญาณ ดูการ์ดบนสุดของ${q.o.P.name} แล้วทิ้ง${gone.join(' กับ ')}ลงกองพัก` : `${q.s.P.name} ใช้วอกโซโฟนทอดสัญญาณ ดูการ์ดบนสุดของ${q.o.P.name} แล้ววางกลับตามเดิม`, 'mil', q.s.P.id);
    }
    if (q.kind === 'massSurge') {
      const options = q.cand.map(k => { const c = q.s.revealed[k]; return { value: k, label: `${c.name} (ใบที่ ${k + 1})`, sub: `โถมกำลัง ${c.kw.surge} → ${c.kw.surge + 1} · พลังเพิ่ม ${k} · รวม ${q.now[q.si] + k} ต่อ ${q.now[1 - q.si]}`, card: c.inst }; });
      // the cards show what they count at the tally, so the totals on the screen add up
      const live = liveBattle(q); live.forEach((side, i) => side.cards.forEach((c, k) => { if (q.vals[i] && q.vals[i][k] != null) c.cur = q.vals[i][k]; }));
      ans = ask(G, q.s.P, { kind: 'massSurge', title: `กองทัพมหาชน: จ่ายอาหาร ${MASS_FOOD} ให้การ์ดโถมกำลังใบหนึ่ง โถมกำลังเพิ่ม 1`, q, live, now: q.now.slice(), si: q.si, need: q.need, options, allowNone: `ไม่จ่าย แพ้ ${q.now[q.si]} ต่อ ${q.now[1 - q.si]}` });
      const c = Number.isInteger(ans) && q.cand.includes(ans) ? q.s.revealed[ans] : null;
      if (c) log(G, `${q.s.P.name} จ่ายอาหาร ${MASS_FOOD} ให้${c.name} โถมกำลังเพิ่ม 1 (กองทัพมหาชน)`, 'mil', q.s.P.id);
    }
    if (q.kind === 'scout') {
      const owner = q.s.P;
      if (owner) {
        const oppName = q.o.P ? q.o.P.name : 'กองเสื้อคลุมน้ำเงิน';
        const which = ask(G, owner, { kind: 'scoutDeck', title: `สอดแนม ${q.X}: เลือกกองที่จะดู`, q, live: liveBattle(q),
          options: [{ value: 'mine', label: 'กองทหารของเรา', sub: `เหลือ ${q.s.deck.length} ใบ · ต้องเปิดอีก ${Math.max(0, q.s.need - q.s.counted)} ใบ`, disabled: !q.s.deck.length },
            { value: 'theirs', label: `กองของ${oppName}`, sub: `เหลือ ${q.o.deck.length} ใบ · ต้องเปิดอีก ${Math.max(0, q.o.need - q.o.counted)} ใบ`, disabled: !q.o.deck.length }],
          allowNone: 'ไม่ใช้สอดแนม' });
        if (which === 'mine' || which === 'theirs') {
          const cards = which === 'mine' ? q.mine : q.theirs;
          const opts = cards.map((c, i) => ({ value: { which, idx: i }, label: `${i + 1}. ${c.d.name}`, sub: `พลัง ${cardPower(G, c)}${c.neutral ? '' : (kwText(c.d.kw) ? ' · ' + kwText(c.d.kw) : '')} → ส่งไปใต้กอง`, card: c }));
          ans = ask(G, owner, { kind: 'scout', title: `สอดแนม: การ์ดบนสุดของ${which === 'mine' ? 'กองเรา' : 'กอง' + oppName} (ลำดับจากบน)`, options: opts, allowNone: 'ไม่ย้าย วางกลับตามเดิม', q, which, live: liveBattle(q) });
        }
      }
    }
    step = it.next(ans);
  }
  const res = step.value;
  finishBattle(G, res);
  res.type = type; res.info = info;
  G.stats.battles.push({ type, round: G.round, att: A.P ? A.P.id : -1, def: Dd.P ? Dd.P.id : -1, win: res.winner === 0, totals: res.totals, size });
  emit(G, 'battle', res);
  return res;
}
K.battleGen = battleGen;

// Monte Carlo odds from public info only (deck order unknown, discard known)
function simOdds(G, attP, defSpec, size, type, N, extra) {
  const r = G.aiR; let wins = 0;
  const attDeck = attP.army.deck, attDisc = attP.army.disc;
  const defIsNeutral = !!defSpec.neutral;
  for (let i = 0; i < N; i++) {
    const da = { deck: shuffleWith(r, attDeck.slice()), disc: attDisc.slice() };
    const dd = defIsNeutral ? { deck: shuffleWith(r, G.neutral.slice()), disc: [] }
      : { deck: shuffleWith(r, defSpec.P.army.deck.slice()), disc: defSpec.P.army.disc.slice() };
    if (defSpec.top) { // known top cards (spyglass)
      const top = defSpec.top; dd.deck = dd.deck.filter(c => !top.includes(c)); dd.deck.unshift(...top);
    }
    const fuel = [goodsOf(attP, 'fuel') - (type === 'command' ? 0 : 0), defIsNeutral ? 0 : goodsOf(defSpec.P, 'fuel')];
    const it = battleGen(G, { P: attP }, defSpec, size, type, { sim: true, r, decks: [da, dd], fuel, extra });
    let st = it.next();
    while (!st.done) st = it.next(simScout(G, st.value));
    if (st.value.winner === 0) wins++;
  }
  return wins / N;
}
function liveBattle(q) {
  const side = s => ({ name: s.P ? s.P.name : 'กองเสื้อคลุมน้ำเงิน', role: s.role, cards: s.revealed.map(c => ({ name: c.name, cur: c.cur, destroyed: c.destroyed, notes: c.notes.slice() })), need: s.need, counted: s.counted, bonus: s.bonus || 0 });
  const S = q.s.role === 'att' ? [q.s, q.o] : [q.o, q.s];
  return S.map(side);
}
K.liveBattle = liveBattle;
// which deck to look at, chosen without peeking (public info only)
function scoutDeckChoice(G, q) {
  const oppLeft = q.o.need - q.o.counted, myLeft = q.s.need - q.s.counted;
  if (oppLeft > 0 && q.o.deck.length) return 'theirs';
  if (myLeft > 0 && q.s.deck.length) return 'mine';
  return null;
}
function scoutCardChoice(G, q, which) {
  const pw = c => cardPower(G, c);
  const cards = which === 'mine' ? q.mine : q.theirs;
  const left = which === 'mine' ? q.s.need - q.s.counted : q.o.need - q.o.counted;
  if (left <= 0 || !cards.length) return null;
  // only the cards that will actually be revealed matter
  const window = cards.slice(0, left);
  let idx = -1;
  if (which === 'theirs') {
    let bv = -1; window.forEach((c, i) => { const v = pw(c) + (c.d.kw && (c.d.kw.lead || c.d.kw.reinf || c.d.kw.surge) ? 1.5 : 0); if (v > bv) { bv = v; idx = i; } });
    if (bv < 2) return null;
  } else {
    let wv = 99; window.forEach((c, i) => { if (pw(c) < wv) { wv = pw(c); idx = i; } });
    if (wv >= 2) return null;
  }
  return idx >= 0 ? { which, idx } : null;
}
// a supporter's look at the other side's top 2 cards before the first reveal: send the strongest of the cards that will be
// revealed to the bottom when it is worth it (public power only; the cards were looked at, so this uses no hidden order)
function peekChoice(G, q) {
  const pw = c => cardPower(G, c) + (c.d.kw && (c.d.kw.lead || c.d.kw.reinf || c.d.kw.surge) ? 1.5 : 0);
  const window = q.theirs.slice(0, Math.max(0, q.o.need - q.o.counted));
  let idx = -1, bv = -1;
  window.forEach((c, i) => { const v = pw(c); if (v > bv) { bv = v; idx = i; } });
  return idx >= 0 && bv >= 2 ? idx : null;
}
K.peekChoice = peekChoice;
// วอกโซโฟนทอดสัญญาณ (rules 0.4.5): the defender discards each of the attacker's top cards that is stronger than what the
// attacker would turn instead, the average of the troops left in that deck by the power it counts when attacking
function voxChoice(G, q) {
  const att = c => c.d.mvAtt != null ? c.d.mvAtt : c.d.mv != null ? c.d.mv : cardPower(G, c);
  const left = q.o.deck.slice(q.theirs.length), rest = left.length ? left : q.o.disc;
  const avg = rest.length ? rest.reduce((a, c) => a + att(c), 0) / rest.length : 0;
  const window = q.theirs.slice(0, Math.max(0, q.o.need - q.o.counted));
  const out = [];
  window.forEach((c, i) => { if (att(c) > avg + 0.3) out.push(i); });
  return out.length ? out : null;
}
K.voxChoice = voxChoice;
// กองทัพมหาชน (rules 0.4.5): the ask comes only when the push wins the battle, so feed the card that adds the most
function massChoice(G, q) {
  return q.cand.length ? q.cand.reduce((a, b) => (b > a ? b : a)) : null;
}
K.massChoice = massChoice;
function simScout(G, q) {
  if (q.kind === 'peek') return peekChoice(G, q);
  if (q.kind === 'voxPeek') return voxChoice(G, q);
  if (q.kind === 'massSurge') return massChoice(G, q);
  const which = scoutDeckChoice(G, q);
  if (!which) return null;
  return scoutCardChoice(G, q, which);
}
K.scoutDeckChoice = scoutDeckChoice; K.scoutCardChoice = scoutCardChoice;
K.simOdds = simOdds; K.simScout = simScout;

// ---------- coup defender ----------
function coupDefender(G, P) {
  const base = REG[G.regime].base;
  const counts = G.players.map(p => symCount(p, base));
  let cand = G.players.filter(p => p !== P && counts[p.id] > 0);
  const maxAll = Math.max(...counts);
  if (counts[P.id] === maxAll && maxAll > 0) cand = G.players.filter(p => p !== P && counts[p.id] > 0); // next most
  if (!cand.length) return null;
  const m = Math.max(...cand.map(p => counts[p.id]));
  const tied = cand.filter(p => counts[p.id] === m);
  if (tied.length === 1) return tied[0];
  for (let k = 1; k < G.n; k++) { const q = G.players[(P.id + k) % G.n]; if (tied.includes(q)) return q; }
  return tied[0];
}
K.coupDefender = coupDefender;

// =====================================================================
// ACTIONS
// =====================================================================
// สภาการค้าและคลังแห่งซีเลสเทีย may build the top card of the era's project deck instead of a market card
const deckTopFor = (G, P) => sup(P, 'celestia') && G.projectDecks[G.era].length ? G.projectDecks[G.era][0] : null;
K.deckTopFor = deckTopFor;
function marketOptions(G, P) {
  const opt = (pr, top) => {
    const c = projectCost(G, P, pr.d, false);
    const pl = payPlan(G, P, c, { joint: true, loan: true });
    return { value: pr.uid, label: pr.d.name, sub: `${top ? 'ใบบนสุดของกองโครงการ · ' : ''}ต้นทุน ${costStr(c)}`, proj: pr, cost: c, disabled: !pl.ok, why: pl.why, deckTop: !!top };
  };
  const list = G.market.map(pr => opt(pr, false));
  const top = deckTopFor(G, P);
  if (top) list.push(opt(top, true));
  return list;
}
K.marketOptions = marketOptions;

function placeProject(G, P, proj, how) {
  P.projects.push(proj);
  emit(G, 'fx', { t: 'build', pid: P.id, uid: proj.uid, annex: how.indexOf('ผนวก') === 0 });
  if (P.projDiscount) P.projDiscount = 0;
  if (has(P, 'ขนบราชสำนัก')) P.grav += 1;
  if (has(P, 'ข้าราชการสืบทอด')) P.grav += 2;
  log(G, `${P.name} ${how} ${proj.d.name}`, 'build', P.id);
}

function doBuild(G, P, uid) {
  const i = G.market.findIndex(p => p.uid === uid);
  const top = i < 0 ? deckTopFor(G, P) : null;
  if (i < 0 && !(top && top.uid === uid)) return false;
  const proj = top || G.market[i];
  const c = projectCost(G, P, proj.d, false);
  const pl = payPlan(G, P, c, { joint: true, loan: true });
  if (!pl.ok) return false;
  execPay(G, P, c, pl);
  const deck = G.projectDecks[G.era];
  if (top) deck.shift();
  else { G.market.splice(i, 1); if (deck.length) G.market.push(deck.shift()); }
  G.stats.builds[G.era]++;
  placeProject(G, P, proj, `สร้าง${top ? 'จากใบบนสุดของกองโครงการ' : ''} (จ่าย ${costStr(c)}${pl.sub ? ` ใช้เกรฟแทนสินค้า ${pl.sub} หน่วย` : ''})`);
  // rules 0.4.6 (ruled 11 Nov): a project built with an ideology symbol pushes the current of that line 1 step a symbol,
  // like a culture card when it is placed. Building only: an annexed project and the starting projects push nothing
  if (G.rules.projPush) for (const s of proj.d.sym || []) if (LINES.includes(s)) {
    moveCurrent(G, s, 1, P); G.stats.projPush = (G.stats.projPush || 0) + 1;
    if (G.rules.instantFlip) resolveFlip(G);
  }
  return true;
}

// commerce plan: {sells:{t:n}, buys:[{pid, puid, n}], central:{t:n}}
function doCommerce(G, P, plan) {
  if (!plan || typeof plan !== 'object') plan = {};
  const sellP = marketSellPrice(G, P);
  let law = has(P, 'กฎหมายตราชั่ง') ? 3 : 0;
  const sold = [], fx = { t: 'trade', pid: P.id, sells: [], buys: [], central: [] };
  for (const t of GOODS) {
    const n = Math.min(cnt(plan.sells && plan.sells[t]), goodsOf(P, t));
    if (n <= 0) continue;
    // the player may say where every unit comes from: plan.from[t] = {wh: n, <project uid>: n}; what it leaves out (or
    // asks beyond what a place holds) comes by the state's payment order
    let left = n;
    const from = plan.from && typeof plan.from[t] === 'object' ? plan.from[t] : null;
    if (from) for (const key of Object.keys(from)) {
      const want = Math.min(left, cnt(from[key]));
      if (!want) continue;
      if (key === 'wh') { const x = Math.min(want, P.wh[t]); P.wh[t] -= x; left -= x; continue; }
      const pr = P.projects.find(p => String(p.uid) === key && p.d.out === t);
      if (pr) { const x = Math.min(want, pr.goods); pr.goods -= x; left -= x; }
    }
    if (left > 0) takeGoods(P, t, left, true);
    let earned = n * sellP; const extra = Math.min(law, n); earned += extra; law -= extra;
    P.grav += earned; sold.push(`${RES_NAME[t]} ${n} ได้ ${earned}`); fx.sells.push({ t, n, g: earned });
    G.stats.centralSold.units += n; G.stats.centralSold.grav += earned;
  }
  if (sold.length) log(G, `${P.name} ขายตลาดกลาง: ${sold.join(', ')}`, 'eco', P.id);
  const cap = capacity(G, P, true); let used = 0;
  const paid = {}, units = {};
  let fromStates = 0;
  const bought = [];
  for (const b of Array.isArray(plan.buys) ? plan.buys : []) {
    const S = b && Number.isInteger(b.pid) ? G.players[b.pid] : null; if (!S || S === P) continue;
    const proj = S.projects.find(p => p.uid === b.puid); if (!proj || proj.d.sale == null) continue;
    const price = salePrice(G, S, proj);
    let n = Math.min(cnt(b.n), proj.goods, cap - used, Math.floor(P.grav / price));
    if (n <= 0) continue;
    proj.goods -= n; P.wh[proj.d.out] += n; P.grav -= n * price; S.grav += n * price;
    used += n; fromStates += n; paid[S.id] = (paid[S.id] || 0) + n * price; units[S.id] = (units[S.id] || 0) + n;
    fx.buys.push({ sid: S.id, puid: proj.uid, t: proj.d.out, n, g: n * price });
    bought.push(`${RES_NAME[proj.d.out]} ${n} จาก${proj.d.name}ของ${S.name} (${n * price})`);
  }
  const mp = marketBuyPrice(G, P);
  for (const t of GOODS) {
    let n = Math.min(cnt(plan.central && plan.central[t]), cap - used, Math.floor(P.grav / mp));
    if (n <= 0) continue;
    P.grav -= n * mp; P.wh[t] += n; used += n; bought.push(`${RES_NAME[t]} ${n} จากตลาดกลาง (${n * mp})`); fx.central.push({ t, n, g: n * mp });
  }
  if (fx.sells.length || fx.buys.length || fx.central.length) emit(G, 'fx', fx);
  if (bought.length) log(G, `${P.name} ซื้อ: ${bought.join(', ')}`, 'eco', P.id);
  if (fromStates >= 3 && has(P, 'เกวียนล้อเหล็ก')) P.grav += 1;
  if (fromStates >= 4 && has(P, 'คลองขุด')) P.grav += 2;
  if (fromStates >= 4 && has(P, 'ล็อตมาตรฐานกิลด์')) P.grav += 3;
  const th = hvThreshold(G, P);
  for (const sid of Object.keys(paid)) {
    const S = G.players[sid];
    if (units[sid] >= 3 && has(S, 'สมุดบัญชีคู่')) S.grav += 1;
    if (has(S, 'บรรษัทข้ามรัฐ')) S.grav += 1;
    if (paid[sid] >= th) {
      G.stats.hvTrades++;
      log(G, `การค้ามูลค่าสูง ${P.name} กับ ${S.name} (${paid[sid]} เกรฟ)`, 'bonus');
      if (!P.tradeBonus) { P.tradeBonus = true; drawBonus(G, P, has(P, 'ตั๋วแลกเงิน')); }
      if (!S.tradeBonus) { S.tradeBonus = true; drawBonus(G, S, has(S, 'ตั๋วแลกเงิน')); }
    }
  }
  return true;
}

// buy via card effect (13.2): no capacity, no hv
function cardBuy(G, P, n, title) {
  for (let k = 0; k < n; k++) {
    const opts = [];
    for (const S of G.players) if (S !== P) for (const pr of S.projects) {
      if (pr.d.sale == null || pr.goods <= 0) continue;
      const price = salePrice(G, S, pr);
      opts.push({ value: { pid: S.id, puid: pr.uid }, label: `${RES_NAME[pr.d.out]} จาก${pr.d.name} (${S.name})`, sub: `ราคา ${price} · เหลือ ${pr.goods}`, disabled: P.grav < price, price, t: pr.d.out, S });
    }
    if (!opts.some(o => !o.disabled)) break;
    const v = ask(G, P, { kind: 'cardBuy', title: `${title}: ซื้อหน่วยที่ ${k + 1}/${n}`, options: opts, allowNone: 'พอแล้ว' });
    if (!v) break;
    const S = G.players[v.pid]; const pr = S.projects.find(p => p.uid === v.puid);
    if (!pr || pr.goods <= 0) break;
    const price = salePrice(G, S, pr);
    if (P.grav < price) break;
    pr.goods--; P.wh[pr.d.out]++; P.grav -= price; S.grav += price;
    emit(G, 'fx', { t: 'trade', pid: P.id, sells: [], buys: [{ sid: S.id, puid: pr.uid, t: pr.d.out, n: 1, g: price }], central: [] });
    log(G, `${P.name} ซื้อ${RES_NAME[pr.d.out]} 1 จาก${S.name} (${price})`, 'eco', P.id);
  }
}

// the command needs no food under the warlords' regime, nor for สมาพันธ์เผ่าสายลมหวน
const freeSupply = (G, P) => isRegime(G, 'ระบอบขุนศึก') || sup(P, 'windclans');
K.freeSupply = freeSupply;
function commandOptions(G, P) {
  const opts = [];
  const supplyOk = freeSupply(G, P) || goodsOf(P, 'food') >= 1;
  const deck = G.projectDecks[G.era];
  opts.push({ value: { t: 'explore' }, label: 'บุกเบิกดินแดน', sub: deck.length ? `ฝ่ายรับ: กองเสื้อคลุมน้ำเงิน · ขนาดการรบตามการ์ดบนสุด (เหลือ ${deck.length} ใบ)${G.rules.exploreFull ? ' · ชนะได้ผลผลิตเต็ม' + (G.rules.annexFree ? 'และผนวกโดยไม่จ่ายต้นทุน' : '') : ''}` : 'กองโครงการยุคนี้หมด',
    disabled: !supplyOk || !deck.length, why: !supplyOk ? 'ไม่มีอาหารจ่ายเสบียง' : '' });
  for (const S of G.players) {
    if (S === P) continue;
    for (const pr of S.projects) {
      const half = Math.ceil(pr.d.outN / 2);
      const loot = pr.d.out === 'grav' ? Math.min(S.grav, half) : bldOnProj(S, pr, 'ยุ้งฉาง') ? 0 : raidTake(G, pr);
      opts.push({ value: { t: 'attack', pid: S.id, puid: pr.uid }, label: `โจมตี ${S.name}: ${pr.d.name}`,
        sub: `ขนาดการรบ ${pr.d.mil} · ปล้นได้ ${loot} ${RES_NAME[pr.d.out]}`, disabled: !supplyOk || !!P.attacked[S.id],
        why: P.attacked[S.id] ? 'โจมตีรัฐนี้ไปแล้วรอบนี้' : '', S, pr, loot });
    }
  }
  const okCoup = !P.coupDone && G.regimeSetRound !== G.round;
  const def = coupDefender(G, P);
  const lunar = G.players.find(Q => Q !== P && Q !== def && sup(Q, 'lunar'));
  opts.push({ value: { t: 'coup' }, label: 'รัฐประหาร', sub: `ขนาดการรบ ${G.era + 2} · ฝ่ายรับ: ${def ? def.name : 'กองเสื้อคลุมน้ำเงิน'}${lunar ? ` · ${lunar.name} (จันทราอารักษ์) ประกาศรับแทนได้` : ''}`,
    disabled: !supplyOk || !okCoup, why: P.coupDone ? 'ก่อรัฐประหารแล้วรอบนี้' : (G.regimeSetRound === G.round ? 'ระบอบเพิ่งตั้งรอบนี้' : '') });
  return opts;
}
K.commandOptions = commandOptions;

// the state(s) with the highest net legitimacy
function isLeader(G, P) { const m = Math.max(...G.players.map(Q => Q.legit - Q.stigma)); return P.legit - P.stigma === m; }
K.isLeader = isLeader;
function paySupply(G, P) {
  if (freeSupply(G, P)) return true;
  if (goodsOf(P, 'food') < 1) return false;
  takeGoods(P, 'food', 1); return true;
}
K.paySupply = paySupply;

function doCommand(G, P, cmd) {
  const warlord = isRegime(G, 'ระบอบขุนศึก');
  if (cmd.t === 'explore') {
    P.st.explore++;
    const deck = G.projectDecks[G.era];
    if (!deck.length) return;
    if (!paySupply(G, P)) return;
    let target;
    if (has(P, 'เรือเหาะสำรวจ') && deck.length > 1) {
      const top = deck.slice(0, 3);
      const i = ask(G, P, { kind: 'exploreChoose', title: 'เรือเหาะสำรวจ: เลือกดินแดนเป้าหมาย', cards: top,
        options: top.map((c, j) => ({ value: j, label: c.d.name, sub: `ขนาดการรบ ${c.d.mil} · ${RES_NAME[c.d.out]} ${c.d.outN} · ต้นทุน ${costStr(c.d.cost)}`, proj: c })) });
      target = deck.splice(i, 1)[0];
    } else target = deck.shift();
    log(G, `${P.name} บุกเบิกดินแดน ${target.d.name} (ขนาดการรบ ${target.d.mil})`, 'mil', P.id);
    const res = runBattle(G, { P }, { neutral: true }, target.d.mil, 'explore', { target });
    if (res.winner === 0) {
      P.st.bwin++;
      const half = exploreGain(G, target.d);
      if (target.d.out === 'grav') P.grav += half; else P.wh[target.d.out] += half;
      log(G, `${P.name} ชนะการบุกเบิก ได้${RES_NAME[target.d.out]} ${half} (${res.totals[0]} ต่อ ${res.totals[1]})`, 'win', P.id);
      if (warlord) { addLegit(G, P, 1, 'นโยบายระบอบขุนศึก', `ชนะบุกเบิก${target.d.name}`); log(G, `${P.name} ได้ความชอบธรรม 1 จากนโยบายระบอบขุนศึก`, 'win', P.id); }
      if (G.rules.natExploreLegit && isRegime(G, 'ชาตินิยม')) { addLegit(G, P, 1, 'นโยบายชาตินิยม', `ชนะบุกเบิก${target.d.name}`); log(G, `${P.name} ได้ความชอบธรรม 1 จากนโยบายชาตินิยม`, 'win', P.id); }
      if (sup(P, 'windclans')) { P.wh.food += 2; log(G, `${P.name} รับอาหาร 2 เข้าคลังจากสมาพันธ์เผ่าสายลมหวน`, 'sup', P.id); }
      if (has(P, 'หมุดเงิน')) drawBonus(G, P, false);
      const c = projectCost(G, P, target.d, true);
      const pl = payPlan(G, P, c, { joint: true, loan: true });
      let annexed = false;
      if (pl.ok) {
        const free = !!G.rules.annexFree, paid = c.mat + c.fuel + c.food + c.grav > 0;
        const v = ask(G, P, { kind: 'annex', title: `ผนวก ${target.d.name}?`, proj: target, cost: c, free,
          options: [{ value: true, label: !paid ? 'ผนวกโดยไม่เสียค่าใช้จ่าย' : free ? `ผนวก จ่ายค่าขยายดินแดน ${c.grav} เกรฟ` : `ผนวก จ่าย ${costStr(c)}` }, { value: false, label: 'ไม่ผนวก' }] });
        if (v) { execPay(G, P, c, pl); placeProject(G, P, target, !paid ? 'ผนวกดินแดน (ไม่เสียค่าใช้จ่าย)' : free ? `ผนวกดินแดน (ค่าขยายดินแดน ${c.grav} เกรฟ)` : `ผนวกดินแดน (จ่าย ${costStr(c)})`); annexed = true; P.st.annex++; G.stats.annex++; G.stats.annexByEra[G.era]++; }
      } else {
        // rules 10.6 give the winner the right to annex, not the means. A winner who cannot pay is not asked, so the table
        // says why (ruled 13 Nov): what the annex costs and what is missing. Bookkeeping only: no rng, no answer
        const L = payLack(G, P, c, { joint: true, loan: true });
        log(G, `${P.name} ผนวก ${target.d.name} ไม่ได้ ทรัพยากรไม่พอ (ต้นทุน ${costStr(c)} · ขาด ${lackStr(L)}) การ์ดกลับไปใต้กองโครงการ`, 'skip', P.id);
        emit(G, 'fx', { t: 'skip', what: 'annex', pid: P.id, name: target.d.name, cost: c, lack: L });
      }
      if (!annexed) deck.push(target);
    } else {
      P.st.blose++;
      // หน่วยพิทักษ์พงไพร: the first lost exploration of each era takes no stigma
      if (sup(P, 'wildwardens') && supUsed(P).ward !== G.era) {
        supUsed(P).ward = G.era;
        log(G, `${P.name} แพ้การบุกเบิก (${res.totals[0]} ต่อ ${res.totals[1]}) หน่วยพิทักษ์พงไพรรับไว้ ไม่รับตราบาป (ครั้งแรกของยุคนี้)`, 'lose', P.id);
      } else {
        addStigma(G, P, 1, 'แพ้การบุกเบิก', target.d.name);
        log(G, `${P.name} แพ้การบุกเบิก (${res.totals[0]} ต่อ ${res.totals[1]}) รับตราบาป 1`, 'lose', P.id);
      }
      deck.push(target);
    }
    return;
  }
  if (cmd.t === 'attack') {
    P.st.attack++;
    const S = G.players[cmd.pid]; const pr = S.projects.find(p => p.uid === cmd.puid);
    if (!pr) return;
    if (has(P, 'กล้องส่องทางไกล')) {
      const top = S.army.deck.slice(0, 2);
      const go = ask(G, P, { kind: 'spyglass', title: `กล้องส่องทางไกล: การ์ดบนสุดของ${S.name}`, top, S, pr,
        text: top.map(c => `${c.d.name} (${c.d.power})`).join(', ') || 'กองว่าง', options: [{ value: true, label: 'โจมตีต่อ' }, { value: false, label: 'ยกเลิกการโจมตี' }] });
      if (!go) { log(G, `${P.name} ยกเลิกการโจมตี${S.name} หลังส่องกล้อง`, 'mil', P.id); return; }
    }
    if (!paySupply(G, P)) return;
    P.attacked[S.id] = true;
    log(G, `${P.name} โจมตี ${S.name} ที่${pr.d.name} (ขนาดการรบ ${pr.d.mil})`, 'mil', P.id);
    // องค์กรหัตถ์เทวะ: an attack on a state that carries more stigma, judged when the attack is declared
    const crusade = sup(P, 'godhand') && S.stigma > P.stigma;
    for (const Q of G.players) if (Q !== P && Q !== S && sup(Q, 'brass')) { Q.grav += 2; log(G, `${Q.name} รับเกรฟ 2 จากบรรษัทเหมืองแร่แห่งนครทองเหลือง เพราะ${P.name}โจมตี${S.name}`, 'sup', Q.id); }
    if (G.rules.milV3 && has(S, 'เลนส์ขยายอาคม') && S.army.deck.length) {
      // rules 0.4.5: the lens may also discard any of the top 3 cards to the defender's own discard pile. The answer is
      // {order, disc}: the indexes of the cards kept, top first, and of the cards discarded, each card exactly once
      const k = Math.min(3, S.army.deck.length);
      const top = S.army.deck.slice(0, k);
      const a = ask(G, S, { kind: 'lensDisc', title: `เลนส์ขยายอาคม: ${P.name} ประกาศโจมตี${pr.d.name} เรียงการ์ด ${k} ใบบนสุดของคุณใหม่ และทิ้งลงกองพักได้`, cards: top, attacker: P, size: pr.d.mil });
      const order = a && Array.isArray(a.order) ? a.order : null, disc = a && Array.isArray(a.disc) ? a.disc : [];
      const all = (order || []).concat(disc);
      const ok = order && all.length === k && all.every(i => Number.isInteger(i) && i >= 0 && i < k) && new Set(all).size === k;
      const keep = ok ? order : top.map((c, i) => i), gone = ok ? disc.slice().sort((x, y) => x - y) : [];
      S.army.deck.splice(0, k, ...keep.map(i => top[i]));
      for (const i of gone) S.army.disc.push(top[i]);
      log(G, gone.length ? `${S.name} ใช้เลนส์ขยายอาคม ทิ้ง${gone.map(i => top[i].d.name).join(' กับ ')}ลงกองพัก${keep.length > 1 ? ' แล้วเรียงการ์ดบนสุดที่เหลือใหม่' : ''}` : `${S.name} ใช้เลนส์ขยายอาคมเรียงการ์ดบนสุดใหม่`, 'mil', S.id);
    } else if (!G.rules.milV3 && has(S, 'เลนส์ขยายอาคม') && S.army.deck.length > 1) {
      const k = Math.min(3, S.army.deck.length);
      const top = S.army.deck.slice(0, k);
      const perms = permutations(top.map((c, i) => i));
      const order = ask(G, S, { kind: 'lens', title: `เลนส์ขยายอาคม: ${P.name} ประกาศโจมตี เรียงการ์ด ${k} ใบบนสุดของคุณใหม่ (ซ้ายเปิดก่อน)`, cards: top,
        options: perms.map(pm => ({ value: pm, label: pm.map(i => `${top[i].d.name} (${top[i].d.power})`).join(' → ') })) });
      const pm = Array.isArray(order) && order.length === k ? order : perms[0];
      S.army.deck.splice(0, k, ...pm.map(i => top[i]));
      log(G, `${S.name} ใช้เลนส์ขยายอาคมเรียงการ์ดบนสุดใหม่`, 'mil', S.id);
    }
    const res = runBattle(G, { P }, { P: S, pr }, pr.d.mil, 'attack', { S, pr });
    if (res.winner === 0) {
      P.st.bwin++;
      const half = Math.ceil(pr.d.outN / 2);
      if (pr.d.out !== 'grav' && bldOnProj(S, pr, 'ยุ้งฉาง')) {
        log(G, `${P.name} ชนะ แต่ยุ้งฉางของ${S.name}ปิดคลังไว้ ปล้นสินค้าจาก${pr.d.name}ไม่ได้ (${res.totals[0]} ต่อ ${res.totals[1]})`, 'win', P.id);
      } else if (pr.d.out === 'grav') {
        const take = Math.min(S.grav, half); S.grav -= take; P.grav += take;
        log(G, `${P.name} ชนะ ปล้นเกรฟ ${take} จาก${S.name}`, 'win', P.id);
      } else {
        let take = raidTake(G, pr);
        if (has(P, 'ดาบปลายปืน') && pr.goods > take) take++;
        pr.goods -= take; P.wh[pr.d.out] += take; S.st.plunderedFrom += take;
        if (has(S, 'ประกันภัยทางทะเล')) S.grav += take;
        log(G, `${P.name} ชนะ ปล้น${RES_NAME[pr.d.out]} ${take} จาก${S.name} (${res.totals[0]} ต่อ ${res.totals[1]})`, 'win', P.id);
        // หน่วยรับมือเหตุฉุกเฉินทางชีวภาพ: half the plundered goods come back onto the project, rounded down
        const back = sup(S, 'biohazard') ? Math.floor(take / 2) : 0;
        if (back) { pr.goods += back; log(G, `${S.name} ได้${RES_NAME[pr.d.out]}คืน ${back} หน่วยจากหน่วยรับมือเหตุฉุกเฉินทางชีวภาพ`, 'sup', S.id); }
      }
      if (warlord) { addLegit(G, P, 1, 'นโยบายระบอบขุนศึก', `ชนะการโจมตี${S.name}`); log(G, `${P.name} ได้ความชอบธรรม 1 จากนโยบายระบอบขุนศึก`, 'win', P.id); }
      if (G.rules.juntaRaidLegit && isRegime(G, 'รัฐบาลทหาร')) { addLegit(G, P, 1, 'นโยบายรัฐบาลทหาร', `ชนะการโจมตี${S.name}`); log(G, `${P.name} ได้ความชอบธรรม 1 จากนโยบายรัฐบาลทหาร`, 'win', P.id); }
      if (G.rules.leaderBounty && isLeader(G, S) && !isLeader(G, P)) { addLegit(G, P, G.rules.leaderBounty, 'ล้มรัฐที่นำอยู่', S.name); log(G, `${P.name} ล้มรัฐที่นำอยู่ ได้ความชอบธรรม ${G.rules.leaderBounty}`, 'win', P.id); }
      if (isRegime(G, 'ประชาธิปไตยสังคม')) { addStigma(G, P, 1, 'นโยบายประชาธิปไตยสังคม', `โจมตี${S.name}`); log(G, `${P.name} รับตราบาปจากนโยบายประชาธิปไตยสังคม`, 'lose', P.id); }
      if (crusade && supUsed(P).godhand !== G.era) { supUsed(P).godhand = G.era; addLegit(G, P, 1, 'องค์กรหัตถ์เทวะ', `ชนะการโจมตี${S.name}`); log(G, `${P.name} ได้ความชอบธรรม 1 จากองค์กรหัตถ์เทวะ (ครั้งเดียวของยุคนี้)`, 'win', P.id); }
      if (sup(S, 'crimson')) { addStigma(G, P, 1, 'องค์กรจันทร์สีชาด', `โจมตี${S.name}`); log(G, `${P.name} รับตราบาป 1 จากองค์กรจันทร์สีชาดของ${S.name} แม้ชนะ`, 'lose', P.id); }
    } else {
      P.st.blose++;
      if (crusade) log(G, `${P.name} แพ้การโจมตี${S.name} (${res.totals[0]} ต่อ ${res.totals[1]}) องค์กรหัตถ์เทวะรับรองสงคราม ไม่รับตราบาป`, 'lose', P.id);
      else { addStigma(G, P, 1, 'แพ้การโจมตี', S.name); log(G, `${P.name} แพ้การโจมตี${S.name} (${res.totals[0]} ต่อ ${res.totals[1]}) รับตราบาป 1`, 'lose', P.id); }
      if (has(S, 'เพลงชาติ')) { addLegit(G, S, G.rules.anthemLegit || 1, 'เพลงชาติ', `ต้านการโจมตีของ${P.name}`); log(G, `${S.name} ได้ความชอบธรรม ${G.rules.anthemLegit || 1} จากเพลงชาติ`, 'win', S.id); }
    }
    return;
  }
  if (cmd.t === 'coup') {
    P.st.coup++;
    if (P.coupDone || G.regimeSetRound === G.round) return;
    P.coupDone = true;
    if (!paySupply(G, P)) return;
    let def = coupDefender(G, P);
    // จันทราอารักษ์: the holder may declare itself the regime's defender in place of the state the rules name
    const lunar = G.players.find(Q => Q !== P && Q !== def && sup(Q, 'lunar'));
    if (lunar) {
      const v = ask(G, lunar, { kind: 'supVolunteer', title: `จันทราอารักษ์: ${P.name} ก่อรัฐประหารต่อ${G.regime} ประกาศเป็นผู้ป้องกันระบอบแทน${def ? def.name : 'กองเสื้อคลุมน้ำเงิน'}?`, plotter: P, def,
        options: [{ value: true, label: 'ประกาศเป็นผู้ป้องกันระบอบ', sub: 'ป้องกันสำเร็จได้ความชอบธรรม 1 และผู้ก่อการรับตราบาปเพิ่ม 1' }, { value: false, label: 'ไม่ประกาศ' }] });
      if (v === true) { log(G, `${lunar.name} ประกาศตัวเป็นผู้ป้องกันระบอบแทน${def ? def.name : 'กองเสื้อคลุมน้ำเงิน'} (จันทราอารักษ์)`, 'sup', lunar.id); def = lunar; }
    }
    G.stats.coups++; if (G.era === 0) G.stats.coupsEraI++;
    log(G, `${P.name} ก่อรัฐประหารต่อ${G.regime} ฝ่ายรับ: ${def ? def.name : 'กองเสื้อคลุมน้ำเงิน'}`, 'mil', P.id);
    for (const Q of G.players) if (Q !== P && sup(Q, 'brass')) { Q.grav += 2; log(G, `${Q.name} รับเกรฟ 2 จากบรรษัทเหมืองแร่แห่งนครทองเหลือง เพราะ${P.name}ก่อรัฐประหาร`, 'sup', Q.id); }
    const res = runBattle(G, { P }, def ? { P: def } : { neutral: true }, G.era + 2, 'coup', { def });
    if (res.winner === 0) {
      P.st.bwin++; G.stats.coupWins++;
      if (warlord) { addLegit(G, P, 1, 'นโยบายระบอบขุนศึก', 'รัฐประหารสำเร็จ'); log(G, `${P.name} ได้ความชอบธรรม 1 จากนโยบายระบอบขุนศึก`, 'win', P.id); }
      const set = G.regimeSet;
      const opts = D.regimes.filter(r => r.set === set && r.name !== G.regime).map(r => ({ value: r.name, label: r.name, sub: `${LINE_NAME[r.line]} · วัด: ${r.metric} · ${r.policy}`, reg: r }));
      const name = ask(G, P, { kind: 'regimeChoice', title: 'รัฐประหารสำเร็จ: เลือกระบอบใหม่', options: opts, why: 'coup' });
      setRegime(G, name, `รัฐประหารโดย ${P.name}`);
      G.regimeSetRound = G.round;
      // ฟอซาร์เคน ฟรอนท์: a coup it wins carries no stigma
      if (sup(P, 'fozarken')) log(G, `${P.name} รัฐประหารสำเร็จ (${res.totals[0]} ต่อ ${res.totals[1]}) ฟอซาร์เคน ฟรอนท์ยืนข้างการลุกฮือ ไม่รับตราบาป`, 'win', P.id);
      else {
        addStigma(G, P, 1, 'รัฐประหารสำเร็จ', `ตั้ง${regLabel(name)}`);
        log(G, `${P.name} รัฐประหารสำเร็จ (${res.totals[0]} ต่อ ${res.totals[1]}) รับตราบาป 1`, 'win', P.id);
      }
    } else {
      P.st.blose++; addStigma(G, P, 2, 'รัฐประหารล้มเหลว');
      log(G, `${P.name} รัฐประหารล้มเหลว (${res.totals[0]} ต่อ ${res.totals[1]}) รับตราบาป 2`, 'lose', P.id);
      if (def && sup(def, 'lunar')) {
        addLegit(G, def, 1, 'จันทราอารักษ์', `ต้านรัฐประหารของ${P.name}`); addStigma(G, P, 1, 'จันทราอารักษ์', `รัฐประหารล้มเหลวต่อ${def.name}`);
        log(G, `${def.name} ได้ความชอบธรรม 1 จากจันทราอารักษ์ และ${P.name}รับตราบาปเพิ่ม 1`, 'win', def.id);
      }
      if (def && has(def, 'เพลงชาติ')) { addLegit(G, def, G.rules.anthemLegit || 1, 'เพลงชาติ', `ต้านรัฐประหารของ${P.name}`); log(G, `${def.name} ได้ความชอบธรรม ${G.rules.anthemLegit || 1} จากเพลงชาติ`, 'win', def.id); }
      // rules 0.4.5: under ประชาธิปไตยสังคม the state that defended the regime gains 1 legitimacy (the blue cloak gains nothing)
      if (G.rules.milV3 && def && isRegime(G, 'ประชาธิปไตยสังคม')) { addLegit(G, def, 1, 'นโยบายประชาธิปไตยสังคม', `ต้านรัฐประหารของ${P.name}`); log(G, `${def.name} ได้ความชอบธรรม 1 จากนโยบายประชาธิปไตยสังคม`, 'win', def.id); }
    }
  }
}

// reform draws and culls; with permanent buildings the forge draws 2 more, the munitions works 1 more and culls 1 more,
// and the cannon foundry keeps 2 cards instead of 1
function reformDraws(G, P) {
  return 3 + (has(P, 'กองทัพมหาชน') ? 1 : 0) + (isRegime(G, 'รัฐบาลทหาร') ? 1 : 0) + 2 * bldOn(P, 'โรงตีเหล็ก') + bldOn(P, 'โรงงานยุทธภัณฑ์') + (sup(P, 'cohen') ? 1 : 0);
}
K.reformDraws = reformDraws;
// cards the reform may cull: 1, 2 under the junta, one more for each working munitions works, and one more for
// ภาคีกุหลาบขาว at the first reform of the state in each era (ruled 11 Nov; every reform before)
const roseFirst = (G, P) => sup(P, 'whiterose') && supUsed(P).rose !== G.era;
function reformCulls(G, P) { return (isRegime(G, 'รัฐบาลทหาร') ? 2 : 1) + bldOn(P, 'โรงงานยุทธภัณฑ์') + (roseFirst(G, P) ? 1 : 0); }
K.reformCulls = reformCulls; K.roseFirst = roseFirst;
function doReform(G, P) {
  P.st.reform++;
  const k = reformDraws(G, P);
  const rose = roseFirst(G, P);
  if (G.rules.deckReform) {
    // rules 0.4.1: draw and keep, look through the whole army deck and cull from it, then shuffle the kept cards in.
    // Cards in the discard pile fought since the last diplomacy and stay out of the review
    const hold = [];
    gainMilitary(G, P, k, 'ปฏิรูปกองทัพ', 1 + bldOn(P, 'โรงหล่อปืนใหญ่มานา'), hold);
    const rem = reformCulls(G, P);
    if (rose) { supUsed(P).rose = G.era; log(G, `${P.name} ปฏิรูปครั้งแรกของยุค ทิ้งได้เพิ่ม 1 ใบ (ภาคีกุหลาบขาว)`, 'sup', P.id); }
    const merge = !!G.rules.reformMerge;
    const what = merge ? 'เปิดดูกองทหารกับกองพัก' : 'เปิดดูกองทหารทั้งกอง';
    for (let i = 0; i < rem; i++) {
      const nth = rem > 1 ? ` (ครั้งที่ ${i + 1}/${rem})` : '';
      // ผู้หลุดพ้น: once per era, instead of a cull, pay 2 food to upgrade a card: it leaves the game and 2 new troops are
      // drawn, 1 kept (ruled 11 Nov: 2 food, then once per era; the first draft paid 1 food at every cull)
      if (sup(P, 'ascended') && supUsed(P).asc !== G.era && goodsOf(P, 'food') >= ASCEND_FOOD && G.reformDecks[G.era].length) {
        const up = ask(G, P, { kind: 'supAscend', title: `ผู้หลุดพ้น${nth}: ทิ้งตามปกติ หรือจ่ายอาหาร ${ASCEND_FOOD} ยกระดับการ์ด 1 ใบ (ยุคละครั้ง)`,
          options: [{ value: true, label: `จ่ายอาหาร ${ASCEND_FOOD} ยกระดับการ์ด`, sub: 'ทิ้งการ์ด 1 ใบ แล้วจั่วการ์ดทหาร 2 ใบ เลือก 1 สับเข้ากอง' }, { value: false, label: 'ทิ้งตามปกติ' }] });
        if (up === true) {
          const gone = removeMilitary(G, P, `ผู้หลุดพ้น: ${what} เลือกการ์ดที่จะยกระดับ ใบนี้ออกจากเกม`, merge ? 'army' : 'deck', hold);
          if (gone) {
            takeGoods(P, 'food', ASCEND_FOOD); supUsed(P).asc = G.era;
            log(G, `${P.name} จ่ายอาหาร ${ASCEND_FOOD} ยกระดับ${gone.d.name}ผ่านผู้หลุดพ้น`, 'sup', P.id);
            gainMilitary(G, P, 2, 'ผู้หลุดพ้น', 1, hold);
          }
          continue;
        }
      }
      removeMilitary(G, P, `ปฏิรูป: ${what} ทิ้งออกจากเกมได้ 1 ใบ${nth}`, merge ? 'army' : 'deck', hold);
    }
    // the whole discard pile rejoins the ranks with the new troops, so the reform also does what diplomacy does for the army
    if (merge && P.army.disc.length) {
      const n = P.army.disc.length;
      P.army.deck.push(...P.army.disc); P.army.disc = [];
      log(G, `${P.name} สับกองพัก ${n} ใบรวมเข้ากองทหาร`, 'mil', P.id);
      emit(G, 'fx', { t: 'reshuffle', pid: P.id, n });
    }
    shuffleIntoDeck(G, P, hold);
    return;
  }
  gainMilitary(G, P, k, 'ปฏิรูปกองทัพ', 1 + bldOn(P, 'โรงหล่อปืนใหญ่มานา'));
  const rem = reformCulls(G, P);
  if (rose) { supUsed(P).rose = G.era; log(G, `${P.name} ปฏิรูปครั้งแรกของยุค ทิ้งได้เพิ่ม 1 ใบ (ภาคีกุหลาบขาว)`, 'sup', P.id); }
  const disc = !!G.rules.reformDiscOnly;
  // reformReview (a 0.4 option): the reform first reviews the top cards of the army deck, which go face up to the
  // discard pile, so the cull has troops to choose from without anyone searching or shuffling the deck
  const rv = disc ? Math.min(G.rules.reformReview || 0, P.army.deck.length) : 0;
  if (rv) {
    const seen = P.army.deck.splice(0, rv); P.army.disc.push(...seen);
    log(G, `${P.name} ตรวจพล ${rv} ใบบนสุดของกองทหารลงกองพัก: ${seen.map(c => c.d.name).join(', ')}`, 'mil', P.id);
    emit(G, 'fx', { t: 'review', pid: P.id, n: rv });
  }
  for (let i = 0; i < rem; i++) removeMilitary(G, P, `ปฏิรูป: ทิ้งการ์ดทหาร${disc ? 'จากกองพัก' : ''}ออกจากเกม (ครั้งที่ ${i + 1}/${rem})`, disc);
}

function placeResearch(G, P, card) {
  const d = card.d;
  G.stats.research[d.kind]++;
  if (d.kind === 'building') {
    const opts = [];
    for (const pr of P.projects) {
      if (pr.buildings.length < slotsOf(P, pr)) opts.push({ value: { puid: pr.uid, replace: null }, label: `ติดกับ ${pr.d.name}`, sub: `ช่องว่าง ${slotsOf(P, pr) - pr.buildings.length}`, pr });
      for (const b of pr.buildings) opts.push({ value: { puid: pr.uid, replace: b.uid }, label: `สร้างทับ ${b.d.name} ที่ ${pr.d.name}`, sub: 'ใบเดิมออกจากเกม', pr, rep: b });
    }
    if (!opts.length) { log(G, `${P.name} ไม่มีช่องให้ติด${d.name}`, 'sys', P.id); return false; }
    const v = ask(G, P, { kind: 'attach', title: `ติด${d.name}กับโครงการ`, card, options: opts });
    const pr = P.projects.find(p => p.uid === v.puid);
    if (v.replace) pr.buildings = pr.buildings.filter(b => b.uid !== v.replace);
    card.used = false;
    pr.buildings.push(card);
    emit(G, 'fx', { t: 'attach', pid: P.id, puid: pr.uid, uid: card.uid });
    log(G, `${P.name} สร้าง${d.name}ที่${pr.d.name}`, 'res', P.id);
    return true;
  }
  P.research.push(card);
  log(G, `${P.name} ได้${d.kind === 'culture' ? 'วัฒนธรรม' : 'นวัตกรรม'} ${d.name}`, 'res', P.id);
  emit(G, 'fx', { t: 'research', pid: P.id, uid: card.uid, kind: d.kind });
  if (d.kind === 'innovation') {
    // ขบวนการเสรีเวทมนตร์: every other state's innovation pays the movement 1 grav
    for (const Q of G.players) if (Q !== P && sup(Q, 'freemagic')) { Q.grav += 1; log(G, `${Q.name} รับเกรฟ 1 จากขบวนการเสรีเวทมนตร์ เพราะ${P.name}วาง${d.name}`, 'sup', Q.id); }
    // เดอะรีกูเลเตอร์: the laboratory turns the invention into a weapon
    if (sup(P, 'regulator')) gainMilitary(G, P, 2, 'เดอะรีกูเลเตอร์');
  }
  if (d.kind === 'culture') {
    // rules 0.4.7: each step flips at once if it reaches the flip point, so a card with two symbols of one line that flips
    // it with the first pushes the line again, from 0, with the second
    for (const s of d.sym) if (LINES.includes(s)) {
      moveCurrent(G, s, 1, P); G.stats.cultPush = (G.stats.cultPush || 0) + 1;
      if (G.rules.instantFlip) resolveFlip(G);
    }
    if (d.name === 'นิรโทษกรรม' && P.stigma > 0) { addStigma(G, P, -1, 'นิรโทษกรรม ล้างตราบาป'); log(G, `${P.name} ล้างตราบาป 1`, 'res', P.id); }
    if (d.name === 'หลักนิยมสองนาที') {
      for (const where of ['deck', 'disc']) {
        const i = P.army[where].findIndex(c => c.d.name === 'ล้มเหลวทางยุทธวิธี');
        if (i >= 0) { const [c] = P.army[where].splice(i, 1); P.removed.push(c); log(G, `${P.name} ทิ้งล้มเหลวทางยุทธวิธี 1 ใบ`, 'mil', P.id); break; }
      }
    }
    if (d.name === 'ภาพยนตร์มานาแห่งชาติ') { askCurrent(G, P, 'ภาพยนตร์มานา: ขยับกระแส (1/2)'); askCurrent(G, P, 'ภาพยนตร์มานา: ขยับกระแส (2/2)'); }
    // ตระกูลควิลลัน: after the card's own pushes, any current one more step, up or down
    if (sup(P, 'quillan')) askCurrent(G, P, 'ตระกูลควิลลัน: ขยับกระแสสายใดก็ได้อีก 1 ช่อง ขึ้นหรือลง', true);
  }
  return true;
}

function researchOption(G, P, c) {
  const cost = researchCost(G, P, c.d);
  const pl = payPlan(G, P, cost, { loan: true });
  let ok = pl.ok;
  let why = pl.why;
  if (c.d.kind === 'building' && !P.projects.some(p => slotsOf(P, p) > 0)) { ok = false; why = 'ไม่มีโครงการที่ติดสิ่งปลูกสร้างได้'; }
  return { cost, plan: pl, ok, why };
}
K.researchOption = researchOption;

// research draws: 3, 4 under the philosophers' regime, more from cards, buildings and นครการศึกษาสแตนเทอร์
function researchDraws(G, P) {
  return (isRegime(G, 'ปราชญาธิปไตย') ? 4 : 3) + (has(P, 'สำนักปราชญ์') ? 1 : 0) + (has(P, 'มหาวิทยาลัยวิจัย') ? 2 : 0) + bldOn(P, 'ห้องปฏิบัติการวิจัย') + (sup(P, 'stanter') ? 1 : 0);
}
K.researchDraws = researchDraws;
function doResearch(G, P) {
  P.st.research++;
  const k = researchDraws(G, P);
  const deck = G.researchDecks[G.era];
  const drawn = deck.splice(0, Math.min(k, deck.length));
  const none = has(P, 'ปฏิทินสิบสามห้วง') ? G.rules.researchNone + 2 : G.rules.researchNone;
  // องค์กรภัณฑารักษ์: the card kept face down at an earlier research (of any era) is one more option
  const curators = sup(P, 'curators'), stash = curators ? P.supStash || null : null;
  const cards = stash ? drawn.concat([stash]) : drawn;
  const opts = cards.map((c, i) => {
    const o = researchOption(G, P, c);
    const x = { value: i, label: c.d.name, sub: `${c === stash ? 'ใบที่เก็บไว้ · ' : ''}${kindName(c.d.kind)} · ${costStr(o.cost)} · ${c.d.text}`, card: c, disabled: !o.ok, why: o.why, cost: o.cost };
    if (c === stash) x.stash = true;
    return x;
  });
  const i = ask(G, P, { kind: 'researchPick', title: `วิจัย: เลือก 1 ใบ หรือรับ ${none} เกรฟ`, options: opts, allowNone: `ไม่เลือก รับ ${none} เกรฟ`, cards, none });
  const took = !(i == null || i < 0 || !opts[i] || opts[i].disabled);
  const card = took ? cards[i] : null;
  if (!curators) {
    if (!took) {
      P.grav += none; deck.push(...drawn); G.stats.researchNone++;
      log(G, `${P.name} วิจัยแล้วไม่เลือก รับ ${none} เกรฟ`, 'res', P.id);
      return;
    }
    const o = researchOption(G, P, card);
    execPay(G, P, o.cost, o.plan);
    drawn.splice(i, 1); deck.push(...drawn);
    placeResearch(G, P, card);
    return;
  }
  if (took) { const o = researchOption(G, P, card); execPay(G, P, o.cost, o.plan); }
  else { P.grav += none; G.stats.researchNone++; log(G, `${P.name} วิจัยแล้วไม่เลือก รับ ${none} เกรฟ`, 'res', P.id); }
  // the curators keep one of the cards left (the old stash included) face down; the others go back under their decks
  const left = cards.filter(c => c !== card);
  let keep = null;
  if (left.length) {
    const v = ask(G, P, { kind: 'supStash', title: 'องค์กรภัณฑารักษ์: เก็บการ์ดที่ไม่ได้เลือกไว้คว่ำหน้ารัฐได้ 1 ใบ (เก็บได้ทีละใบ)', cards: left,
      options: left.map((c, j) => { const o = researchOption(G, P, c); return { value: j, label: c.d.name, sub: `${c === stash ? 'ใบที่เก็บอยู่ · ' : ''}${kindName(c.d.kind)} ยุค ${['I', 'II', 'III', 'IV'][c.d.era]} · ${costStr(o.cost)} · ${c.d.text}`, card: c, cost: o.cost }; }),
      allowNone: stash && left.includes(stash) ? 'ไม่เก็บใบใด ใบที่เก็บอยู่กลับเข้ากอง' : 'ไม่เก็บ' });
    keep = Number.isInteger(v) && left[v] ? left[v] : null;
  }
  P.supStash = keep;
  if (keep) log(G, `${P.name} เก็บการ์ดวิจัย 1 ใบไว้คว่ำหน้ารัฐ (องค์กรภัณฑารักษ์)`, 'sup', P.id);
  for (const c of left) if (c !== keep) G.researchDecks[c.d.era].push(c);
  if (card) placeResearch(G, P, card);
}
function kindName(k) { return k === 'building' ? 'สิ่งปลูกสร้าง' : k === 'culture' ? 'วัฒนธรรม' : 'นวัตกรรม'; }
K.kindName = kindName;

function doDiplomacy(G, P) {
  P.st.diplomacy++;
  P.hand.push(...P.played); P.played = [];
  P.diploPlayed = true;
  if (P.army.disc.length) {
    const n = P.army.disc.length;
    // rules 0.4.4: the state chooses; a deck that still holds its best troops may leave the tired ones on the discard pile
    let go = true;
    if (G.rules.dipChoice) {
      go = ask(G, P, { kind: 'dipShuffle', title: `การทูต: สับการ์ดทหาร ${n} ใบในกองพักกลับเข้ากองทหารหรือไม่`, n,
        options: [{ value: true, label: 'สับกองพักเข้ากองทหาร', sub: `กองทหารจะมี ${P.army.deck.length + n} ใบ` },
          { value: false, label: 'เก็บไว้ในกองพัก', sub: `รบครั้งหน้าเปิดจากกองทหาร ${P.army.deck.length} ใบที่เหลือก่อน` }] }) !== false;
      if (!go) log(G, `${P.name} เล่นการทูตโดยเก็บการ์ดทหาร ${n} ใบไว้ในกองพัก`, 'mil', P.id);
    }
    if (go) { reshuffleArmy(G, P); emit(G, 'fx', { t: 'reshuffle', pid: P.id, n }); }
  }
  const steps = has(P, 'สื่อมวลชนเสรี') ? 2 : 1;
  for (let s = 0; s < steps; s++) askCurrent(G, P, `การทูต: ขยับกระแส${steps > 1 ? ` (${s + 1}/${steps})` : ''}`);
  // buildings that speak for the state when its envoys lobby (rules 0.4): each push is optional
  if (P.pb) {
    const extra = [];
    for (let k = bldOn(P, 'โบสถ์ประจำเมือง'); k > 0; k--) extra.push(['trad', 'โบสถ์ประจำเมือง']);
    for (let k = bldOn(P, 'ศาลาประชาคม'); k > 0; k--) extra.push(['ppl', 'ศาลาประชาคม']);
    for (let k = 2 * bldOn(P, 'อนุสาวรีย์แห่งชาติ'); k > 0; k--) extra.push(['trad', 'อนุสาวรีย์แห่งชาติ']);
    for (let k = bldOn(P, 'แท่นพิมพ์เวทมนตร์'); k > 0; k--) extra.push([null, 'แท่นพิมพ์เวทมนตร์']);
    for (let k = 2 * bldOn(P, 'หอกระจายเสียงวอกโซโฟน'); k > 0; k--) extra.push([null, 'หอกระจายเสียงวอกโซโฟน']);
    for (const [line, src] of extra) askCurrent(G, P, line ? `${src}: ดันกระแส${LINE_NAME[line]}ขึ้นอีก 1 ช่องได้` : `${src}: ขยับกระแสสายใดก็ได้อีก 1 ช่อง`, true, line);
  }
  const last = G.players.every(p => p.diploPlayed);
  log(G, `${P.name} เล่นการทูต${last ? ' เป็นรัฐสุดท้าย ช่วงบริหารจบ' : ''}`, 'dip', P.id);
  if (last && has(P, 'นาฬิกาน้ำ')) P.grav += 2;
}

// ---------- buildings ----------
function projPay(P, pr, cost) {
  // building activation cost: from the attached project, shortfall from warehouse only
  for (const t of GOODS) {
    const need = cost[t] || 0; if (!need) continue;
    const fromP = pr.d.out === t ? Math.min(pr.goods, need) : 0;
    if (fromP + P.wh[t] < need) return false;
  }
  if (cost.any) { const avail = (pr.d.out !== 'grav' ? pr.goods : 0) + whTotal(P); if (avail < cost.any) return false; }
  if ((cost.grav || 0) > P.grav) return false;
  return true;
}
function projTake(P, pr, cost) {
  for (const t of GOODS) {
    let need = cost[t] || 0; if (!need) continue;
    if (pr.d.out === t) { const x = Math.min(pr.goods, need); pr.goods -= x; need -= x; }
    P.wh[t] -= need;
  }
  if (cost.any) {
    let need = cost.any;
    if (pr.d.out !== 'grav') { const x = Math.min(pr.goods, need); pr.goods -= x; need -= x; }
    while (need > 0) { const t = GOODS.slice().sort((a, b) => P.wh[b] - P.wh[a])[0]; P.wh[t]--; need--; }
  }
  if (cost.grav) P.grav -= cost.grav;
}
function addOutput(G, P, pr, n) {
  if (pr.d.out === 'grav') { P.grav += n; return n; }
  const before = pr.goods; pr.goods = Math.max(before, Math.min(projCap(P, pr), pr.goods + n)); return pr.goods - before;
}
const ACT = {
  'โรงสี': { cost: { food: 2 }, run: (G, P) => { P.grav += 4; } },
  'โรงตีเหล็ก': { cost: { mat: 1, fuel: 1 }, run: (G, P, pr, b) => { gainMilitary(G, P, 2, b.d.name); } },
  'ยุ้งฉาง': { cost: {}, can: (G, P, pr) => pr.d.out !== 'grav' && pr.goods > 0, run: (G, P, pr) => { const n = Math.min(2, pr.goods); pr.goods -= n; P.wh[pr.d.out] += n; } },
  'โบสถ์ประจำเมือง': { cost: { food: 1 }, run: (G, P) => moveCurrent(G, 'trad', 1, P) },
  'โรงรับจำนำ': { cost: { grav: 2 }, run: (G, P) => { const t = ask(G, P, { kind: 'goodsType', title: 'โรงรับจำนำ: เลือกสินค้า 1 หน่วย', options: GOODS.map(g => ({ value: g, label: RES_NAME[g] })) }); P.wh[t]++; } },
  'ค่ายฝึกทหาร': { cost: { food: 1 }, run: (G, P) => reshuffleArmy(G, P) },
  'กังหันน้ำ': { cost: {}, run: (G, P, pr) => { addOutput(G, P, pr, 1); } },
  'ท่าเทียบเรือ': { cost: { any: 1 }, run: (G, P) => { P.grav += eraD(G).buy; } },
  'แท่นพิมพ์เวทมนตร์': { cost: { mat: 2 }, run: (G, P) => askCurrent(G, P, 'แท่นพิมพ์เวทมนตร์: ขยับกระแส', false) },
  'โรงประจุกระสุนมานา': { cost: { fuel: 1 }, run: (G, P) => { P.mods.push({ kind: 'next', v: 1, src: 'โรงประจุกระสุนมานา' }); } },
  'คลังสินค้าท่าเรือ': { cost: {}, can: (G, P, pr) => pr.d.out !== 'grav' && pr.goods > 0, run: (G, P, pr) => { const n = Math.min(3, pr.goods); pr.goods -= n; P.wh[pr.d.out] += n; } },
  'โรงทอผ้าด้วยกี่': { cost: { food: 2 }, run: (G, P) => { P.grav += 6; } },
  'ศาลาประชาคม': { cost: { food: 1 }, run: (G, P) => moveCurrent(G, 'ppl', 1, P) },
  'โรงหล่อปืนใหญ่มานา': { cost: { mat: 1, fuel: 1 }, run: (G, P, pr, b) => { gainMilitary(G, P, 3, b.d.name); } },
  'ห้องทดลองเคมี': { cost: { fuel: 1 }, run: (G, P, pr) => { addOutput(G, P, pr, 2); } },
  'ปราสาทตระกูล': { cost: { mat: 1 }, run: (G, P) => { P.mods.push({ kind: 'nextDef', v: 2, src: 'ปราสาทตระกูล' }); } },
  'สถานีรถไฟ': { cost: { fuel: 1 }, run: (G, P) => cardBuy(G, P, 2, 'สถานีรถไฟ') },
  'โรงทอไหมมานา': { cost: { any: 3 }, run: (G, P) => { P.grav += 10; } },
  'โรงงานยุทธภัณฑ์': { cost: { mat: 1, fuel: 1 }, run: (G, P, pr, b) => { gainMilitary(G, P, 3, b.d.name); removeMilitary(G, P); } },
  'โรงพยาบาลรัฐ': { cost: { food: 2 }, can: (G, P) => P.hired < 8 && P.hiresThisRound < maxHires(G, P), run: (G, P) => { P.hired++; P.hiresThisRound++; } },
  'ห้องปฏิบัติการวิจัย': { cost: { fuel: 1 }, can: G => G.researchDecks[G.era].length > 0, run: (G, P) => {
    const deck = G.researchDecks[G.era]; const c = deck.shift();
    const o = researchOption(G, P, c);
    let take = false;
    if (o.ok) take = ask(G, P, { kind: 'labResearch', title: `ห้องปฏิบัติการวิจัย: ${c.d.name}`, card: c, cost: o.cost, text: c.d.text,
      options: [{ value: true, label: `จ่าย ${costStr(o.cost)} แล้ววาง` }, { value: false, label: 'วางใต้กอง' }] });
    if (take) { execPay(G, P, o.cost, o.plan); placeResearch(G, P, c); } else deck.push(c);
  } },
  'โรงจักรไอน้ำมานา': { cost: { fuel: 1 }, run: (G, P, pr) => { addOutput(G, P, pr, 3); } },
  'พิพิธภัณฑ์แห่งชาติ': { cost: { mat: 1 }, run: (G, P) => { if (cultures(P) >= 3) P.grav += 5; } },
  'ป้อมบาเรียร์ริมน้ำ': { cost: { fuel: 1 }, run: (G, P) => { P.mods.push({ kind: 'nextDef', v: 3, src: 'ป้อมบาเรียร์ริมน้ำ' }); } },
  'ศูนย์กระจายสินค้า': { cost: { fuel: 1 }, run: (G, P) => cardBuy(G, P, 3, 'ศูนย์กระจายสินค้า') },
  'โรงงานเครื่องใช้เวทมนตร์': { cost: { any: 3 }, run: (G, P) => { P.grav += 14; } },
  'ฐานเรือเหาะรบ': { cost: { fuel: 2 }, run: (G, P) => { P.mods.push({ kind: 'next', v: 3, src: 'ฐานเรือเหาะรบ' }); } },
  'หอกระจายเสียงวอกโซโฟน': { cost: { fuel: 1 }, run: (G, P) => askCurrent(G, P, 'หอกระจายเสียง: ขยับกระแส', false) },
  'เคหะนอกกำแพงเดิม': { cost: { mat: 2 }, run: (G, P) => { P.grav += assignedWorkers(P); } },
  'โรงแปรธาตุ': { cost: { fuel: 1 }, run: (G, P) => { P.wh.mat += 3; } },
  'อนุสาวรีย์แห่งชาติ': { cost: { mat: 2 }, run: (G, P) => moveCurrent(G, 'trad', 1, P) },
  'ศูนย์บัญชาการทหาร': { cost: { food: 1, fuel: 1 }, run: (G, P) => {
    reshuffleArmy(G, P);
    const top = P.army.deck.slice(0, 2);
    if (top.length) {
      const v = ask(G, P, { kind: 'cmdScout', title: 'ศูนย์บัญชาการทหาร: ส่งการ์ดบนสุดไปใต้กองได้ 1 ใบ',
        options: top.map((c, i) => ({ value: i, label: c.d.name, sub: milSub(c.d) })), allowNone: 'ไม่ย้าย' });
      if (v != null && v >= 0) { const [m] = P.army.deck.splice(v, 1); P.army.deck.push(m); }
    }
  } },
};
K.ACT = ACT;
function canActivate(G, P, b, pr) {
  if (P.pb) return false;   // permanent buildings have nothing to press
  const a = ACT[b.d.name]; if (!a || b.used) return false;
  if (a.can && !a.can(G, P, pr)) return false;
  return projPay(P, pr, a.cost);
}
function readyBuildings(G, P) { return buildingsOf(P).filter(({ b, p }) => canActivate(G, P, b, p)); }
function activate(G, P, uid) {
  const x = buildingsOf(P).find(({ b }) => b.uid === uid);
  if (!x || !canActivate(G, P, x.b, x.p)) return false;
  const a = ACT[x.b.d.name];
  projTake(P, x.p, a.cost);
  x.b.used = true;
  log(G, `${P.name} กด${x.b.d.name} (${x.p.d.name})`, 'act', P.id);
  emit(G, 'fx', { t: 'activate', pid: P.id, uid: x.b.uid, puid: x.p.uid });
  a.run(G, P, x.p, x.b);
  return true;
}
Object.assign(K, { canActivate, readyBuildings, projPay });

// ---------- turn ----------
function turnOptions(G, P) {
  const acts = readyBuildings(G, P).map(({ b, p }) => ({ uid: b.uid, name: b.d.name, proj: p.d.name, text: b.d.text }));
  const plays = [];
  const inHand = c => P.hand.includes(c);
  const onlyDip = P.hand.length === 1 && P.hand[0] === 'diplomacy';
  if (inHand('trade')) {
    const mo = marketOptions(G, P);
    plays.push({ card: 'trade', mode: 'build', ok: mo.some(o => !o.disabled), why: mo.length ? 'ยังไม่มีโครงการที่จ่ายไหว' : 'ตลาดว่าง' });
    plays.push({ card: 'trade', mode: 'commerce', ok: true });
  }
  if (inHand('military')) {
    const co = commandOptions(G, P);
    plays.push({ card: 'military', mode: 'command', ok: co.some(o => !o.disabled), why: 'ไม่มีเป้าหมายที่ทำได้' });
    plays.push({ card: 'military', mode: 'reform', ok: true });
  }
  if (inHand('research')) plays.push({ card: 'research', mode: 'research', ok: true });
  if (inHand('diplomacy')) plays.push({ card: 'diplomacy', mode: 'diplomacy', ok: true });
  void onlyDip;
  return { acts, plays };
}
K.turnOptions = turnOptions;

function commitCard(P, card) {
  const i = P.hand.indexOf(card);
  if (i >= 0) P.hand.splice(i, 1);
  if (card !== 'diplomacy') P.played.push(card);
}
function playAction(G, P, card, mode) {
  if (!P.hand.includes(card)) return false;
  G.stats.actions[mode] = (G.stats.actions[mode] || 0) + 1;
  if (mode === 'build') {
    const opts = marketOptions(G, P);
    const uid = ask(G, P, { kind: 'build', title: 'สร้างโครงการจากตลาด', options: opts, allowBack: true });
    if (uid == null) { G.stats.actions[mode]--; return false; }
    commitCard(P, card); P.st.build++;
    emit(G, 'fx', { t: 'play', pid: P.id, card, mode });
    const ok = doBuild(G, P, uid);
    if (!ok) log(G, `${P.name} สร้างไม่สำเร็จ`, 'sys', P.id);
    return true;
  }
  if (mode === 'commerce') {
    const plan = ask(G, P, { kind: 'commerce', title: 'ค้าขาย', allowBack: true });
    if (plan == null) { G.stats.actions[mode]--; return false; }
    commitCard(P, card); P.st.commerce++;
    emit(G, 'fx', { t: 'play', pid: P.id, card, mode });
    doCommerce(G, P, plan);
    return true;
  }
  if (mode === 'command') {
    const opts = commandOptions(G, P);
    const cmd = ask(G, P, { kind: 'command', title: 'บัญชาการทัพ', options: opts, allowBack: true });
    if (cmd == null) { G.stats.actions[mode]--; return false; }
    commitCard(P, card);
    emit(G, 'fx', { t: 'play', pid: P.id, card, mode, cmd });
    doCommand(G, P, cmd);
    return true;
  }
  if (mode === 'reform' || mode === 'research' || mode === 'diplomacy') {
    commitCard(P, card);
    emit(G, 'fx', { t: 'play', pid: P.id, card, mode });
    if (mode === 'reform') doReform(G, P); else if (mode === 'research') doResearch(G, P); else doDiplomacy(G, P);
    return true;
  }
  return false;
}

function checkWarehouse(G, P) {
  const cap = whCap(P); let ex = whTotal(P) - cap;
  if (ex <= 0) return;
  const price = marketSellPrice(G, P);
  const sold = [];
  while (ex > 0) {
    const t = GOODS.slice().sort((a, b) => P.wh[b] - P.wh[a])[0];
    P.wh[t]--; P.grav += price; ex--; sold.push(RES_NAME[t]);
  }
  G.stats.overflow.units += sold.length; G.stats.overflow.grav += sold.length * price;
  log(G, `${P.name} คลังเกินความจุ ขายส่วนเกิน ${sold.length} หน่วย (${sold.join(' ')}) ได้ ${sold.length * price}`, 'eco', P.id);
}

function playerTurn(G, P, lap) {
  G.cur = P.id; G.lap = lap;
  emit(G, 'turnStart', { P });
  let played = false;
  for (let guard = 0; guard < 600 && !played; guard++) {
    const opts = turnOptions(G, P);
    const d = ask(G, P, { kind: 'turn', opts, lap });
    if (!d || typeof d !== 'object') continue;
    if (d.type === 'activate') { activate(G, P, d.uid); emit(G, 'update'); continue; }
    // only a play the turn offers (ruled 17 Nov): a card in a mode the turn does not list for it is no play. Whether the
    // play can be done is checked as it goes on (a build nobody can pay or a command with no target goes back)
    if (d.type === 'play' && opts.plays.some(p => p.card === d.card && p.mode === d.mode)) played = (playAction(G, P, d.card, d.mode)) !== false;
  }
  if (!played) {
    // every turn must play a card: fall back to the simplest legal play
    const card = P.hand.includes('diplomacy') ? 'diplomacy' : P.hand.includes('research') ? 'research' : P.hand.includes('military') ? 'military' : 'trade';
    const mode = { diplomacy: 'diplomacy', research: 'research', military: 'reform', trade: 'commerce' }[card];
    log(G, `${P.name} ไม่ได้เลือกแอคชัน ระบบเล่น${MODE_NAME[mode]}แทน`, 'sys', P.id);
    if (mode === 'commerce') { commitCard(P, card); P.st.commerce++; doCommerce(G, P, { sells: {}, buys: [], central: {} }); }
    else playAction(G, P, card, mode);
  }
  checkWarehouse(G, P);
  emit(G, 'turnEnd', { P });
}

// =====================================================================
// PHASES
// =====================================================================
function productionPlan(G, P, assign) {
  // assign: {puid: n, lamp: puid|null}
  return assign;
}
// the placement a state keeps when it answers nothing (rules 0.4): last round's, trimmed to its workers
function keptPlacement(P) {
  const w = {}; for (const pr of P.projects) if (pr.workers) w[pr.uid] = pr.workers;
  return { w, lamp: P.lampUid };
}
K.keptPlacement = keptPlacement;
function productionPhase(G) {
  G.phase = 'production';
  log(G, `รอบที่ ${G.round} (ยุค ${eraD(G).id} ${eraD(G).name}) ขั้นผลิต`, 'phase');
  emit(G, 'phase');
  const req = { kind: 'workers', title: 'วางแรงงานลงโครงการ' };
  // rules 0.4: every state is asked at once, in seat order, so the ask numbers and AI draws match on every peer;
  // the answers are then applied in seat order exactly as if they had been asked one by one
  const all = G.rules.simul ? (G.players.map(P => ask(G, P, Object.assign({}, req)))) : null;
  for (const P of G.players) {
    let a = all ? all[P.id] : ask(G, P, Object.assign({}, req));
    // an empty answer (a dropped peer, a test) places nobody rather than stopping the game; with workers that stay, it keeps the old placement
    if (!a || typeof a !== 'object' || !a.w) a = G.rules.workersStay ? keptPlacement(P) : { w: {}, lamp: null };
    let left = totalWorkers(P);
    for (const pr of P.projects) { const n = Math.max(0, Math.min(pr.d.workers, cnt(a.w[pr.uid]), left)); pr.workers = n; left -= n; }
    emit(G, 'fx', { t: 'workers', pid: P.id });
    const lampOk = has(P, 'โคมไฟกริดมานา');
    const lamp = lampOk ? a.lamp : null;
    P.lampUid = lampOk && P.projects.some(pr => pr.uid === lamp) ? lamp : null;
    const producing = [];
    const order = P.projects.slice().sort((x, y) => (Object.keys(y.d.inp).length) - (Object.keys(x.d.inp).length));
    const cogs = sup(P, 'cogs') ? cogsTarget(P, order, lamp) : null;
    for (const pr of order) {
      const need = pr.d.workers - (lamp === pr.uid ? 1 : 0);
      if (pr.workers < need || (pr.workers === 0 && need > 0)) continue;
      if (Object.keys(pr.d.inp).length) {
        const inp = pr === cogs ? cogsInput(pr.d.inp) : pr.d.inp;
        if (!canPayGoods(P, inp)) continue;
        payGoods(P, inp);
        if (pr === cogs) log(G, `${P.name}: สภาฟันเฟืองลดวัตถุดิบนำเข้าของ${pr.d.name} 1 หน่วย`, 'sup', P.id);
      }
      producing.push(pr);
    }
    const gained = new Map();
    for (const pr of producing) gained.set(pr, pr.d.outN + (Object.keys(pr.d.inp).length && has(P, 'เครื่องจักรไอน้ำมานา') ? 1 : 0));
    const food = producing.filter(p => p.d.out === 'food').sort((x, y) => x.goods - y.goods);
    const boost = (list, k, v) => { for (let i = 0; i < Math.min(k, list.length); i++) gained.set(list[i], gained.get(list[i]) + v); };
    if (has(P, 'คันไถเหล็ก')) boost(food, 1, 1);
    if (has(P, 'ระบบหมุนเวียนพืช')) boost(food, 1, 2);
    if (has(P, 'ปุ๋ยเคมี')) boost(food, 2, 1);
    if (has(P, 'พืชเสริมมานา')) boost(food, 2, 2);
    if (has(P, 'เครื่องสูบน้ำ')) boost(producing.filter(p => p.d.out === 'mat' || p.d.out === 'fuel').sort((x, y) => x.goods - y.goods), 1, 1);
    const sum = { mat: 0, fuel: 0, food: 0, grav: 0 };
    const fxg = [];
    const milled = { n: 0 };
    for (const [pr, n] of gained) { const got = addOutput(G, P, pr, n); sum[pr.d.out] += got; fxg.push({ uid: pr.uid, out: pr.d.out, n: got }); if (pr.d.out === 'grav') G.stats.prodGrav[G.era] += got; else { G.stats.produced[G.era] += got; G.stats.capWaste += n - got; millOverflow(P, pr, n - got, milled); } }
    if (has(P, 'ตลาดซื้อขายล่วงหน้า') && producing.length === P.projects.length) { P.grav += 3; sum.grav += 3; }
    log(G, `${P.name} ผลิต: ${costStr(sum)} (${producing.length}/${P.projects.length} โครงการ)`, 'prod', P.id);
    emit(G, 'fx', { t: 'produce', pid: P.id, gains: fxg });
    if (P.pb) buildingsAtProduction(G, P, milled);
  }
  emit(G, 'update');
}
// สภาฟันเฟือง: one input project of the state pays one unit less of its largest input at each production
function cogsInput(inp) {
  const o = Object.assign({}, inp); let best = null;
  for (const t of GOODS) if (o[t] && (!best || o[t] > o[best])) best = t;
  if (best) { o[best]--; if (!o[best]) delete o[best]; }
  return o;
}
K.cogsInput = cogsInput;
// the project that gets it: the first staffed input project, in production order, that could not pay in full but can pay
// one unit less; failing that, the first staffed input project that pays
function cogsTarget(P, order, lamp) {
  const stock = allGoods(P); let first = null;
  const can = need => GOODS.every(t => stock[t] >= (need[t] || 0));
  for (const pr of order) {
    const need = pr.d.workers - (lamp === pr.uid ? 1 : 0);
    if (pr.workers < need || (pr.workers === 0 && need > 0) || !Object.keys(pr.d.inp).length) continue;
    if (can(pr.d.inp)) { if (!first) first = pr; for (const t of GOODS) stock[t] -= pr.d.inp[t] || 0; continue; }
    if (can(cogsInput(pr.d.inp))) return pr;
  }
  return first;
}
K.cogsTarget = cogsTarget;
// the mill (rules 0.4): food its project grows past the cap is ground and sold, 2 grav a unit, instead of spoiling
function millOverflow(P, pr, lost, milled) {
  if (lost > 0 && pr.d.out === 'food' && bldOnProj(P, pr, 'โรงสี')) { P.grav += 2 * lost; milled.n += lost; milled.g = (milled.g || 0) + 2 * lost; }
}
// permanent buildings that work at every production phase, right after their state has produced (rules 0.4).
// No choice is asked here, so the production phase stays one simultaneous decision per state.
function buildingsAtProduction(G, P, milled) {
  const notes = [], uids = [];
  const note = (b, t) => { notes.push(`${b.d.name} ${t}`); uids.push(b.uid); };
  for (const pr of P.projects) {
    if (!pr.buildings.length || !staffed(P, pr)) continue;
    const goods = pr.d.out !== 'grav';
    for (const b of pr.buildings) {
      switch (b.d.name) {
        case 'กังหันน้ำ': { const got = addOutputMill(G, P, pr, 1, milled); note(b, got ? 'ผลิตเพิ่ม 1' : 'ผลิตเพิ่ม 1 แต่ชนเพดาน'); break; }
        case 'ห้องทดลองเคมี': case 'โรงจักรไอน้ำมานา': {
          if (goodsOf(P, 'fuel') < 1) break;
          takeGoods(P, 'fuel', 1, true);
          const k = b.d.name === 'ห้องทดลองเคมี' ? 2 : 3;
          addOutputMill(G, P, pr, k, milled); note(b, `ใช้เชื้อเพลิง 1 ผลิตเพิ่ม ${k}`); break;
        }
        case 'ท่าเทียบเรือ': if (goods && pr.goods >= 1) { pr.goods--; P.grav += eraD(G).buy; note(b, `ขาย${RES_NAME[pr.d.out]} 1 ได้ ${eraD(G).buy} เกรฟ`); } break;
        case 'โรงทอผ้าด้วยกี่': if (pr.d.out === 'food' && pr.goods >= 2) { pr.goods -= 2; P.grav += 6; note(b, 'ทออาหาร 2 เป็นเกรฟ 6'); } break;
        case 'โรงทอไหมมานา': if (goods && pr.goods >= 3) { pr.goods -= 3; P.grav += 8; note(b, `แปรรูป${RES_NAME[pr.d.out]} 3 เป็นเกรฟ 8`); } break;
        case 'โรงงานเครื่องใช้เวทมนตร์': if (goods && pr.goods >= 3) { pr.goods -= 3; P.grav += 11; note(b, `แปรรูป${RES_NAME[pr.d.out]} 3 เป็นเกรฟ 11`); } break;
        case 'โรงรับจำนำ': { const g = Math.min(3, Math.floor(whTotal(P) / 2)); if (g) { P.grav += g; note(b, `ดอกเบี้ยของในคลัง ${g} เกรฟ`); } break; }
        case 'พิพิธภัณฑ์แห่งชาติ': { const g = Math.min(4, cultures(P)); if (g) { P.grav += g; note(b, `ผู้ชม ${g} เกรฟ`); } break; }
        case 'เคหะนอกกำแพงเดิม': { const g = Math.floor(assignedWorkers(P) / 2); if (g) { P.grav += g; note(b, `ค่าเช่า ${g} เกรฟ`); } break; }
        case 'โรงแปรธาตุ': P.wh.mat += 2; note(b, 'แปรธาตุได้วัสดุ 2 เข้าคลัง'); break;
      }
    }
  }
  if (milled.n) { for (const pr of P.projects) for (const b of pr.buildings) if (b.d.name === 'โรงสี' && bldOnProj(P, pr, 'โรงสี')) uids.push(b.uid); notes.push(`โรงสีบดอาหารล้นเพดาน ${milled.n} หน่วย ได้ ${milled.g} เกรฟ`); }
  if (notes.length) {
    log(G, `${P.name} สิ่งปลูกสร้างทำงาน: ${notes.join(' · ')}`, 'prod', P.id);
    emit(G, 'fx', { t: 'bldWork', pid: P.id, uids });
  }
}
function addOutputMill(G, P, pr, n, milled) {
  const got = addOutput(G, P, pr, n);
  if (pr.d.out === 'grav') G.stats.prodGrav[G.era] += got; else { G.stats.produced[G.era] += got; G.stats.capWaste += n - got; millOverflow(P, pr, n - got, milled); }
  return got;
}

function adminPhase(G) {
  G.phase = 'admin';
  log(G, `ขั้นบริหาร`, 'phase');
  for (const P of G.players) P.diploPlayed = false;
  for (let lap = 1; lap <= 8; lap++) {
    for (let i = 0; i < G.n; i++) {
      if (G.players.every(p => p.diploPlayed)) return;
      const P = G.players[(G.first + i) % G.n];
      if (!P.hand.length) continue;
      playerTurn(G, P, lap);
      if (G.players.every(p => p.diploPlayed)) return;
    }
  }
  throw new Error('admin phase did not end');
}

function councilPhase(G) {
  G.phase = 'council';
  log(G, `สภาประชุม รอบที่ ${G.round}`, 'phase');
  for (const P of G.players) checkWarehouse(G, P);
  emit(G, 'phase');
  for (const P of G.players) {
    P.hand = ['trade', 'military', 'research', 'diplomacy']; P.played = [];
    P.grav += G.rules.councilGrav;
    // ตระกูลอาร์เจนท์: after the 2 grav, 1 more for every 8 grav in the treasury, at most 6 (ruled 11 Nov; 3 before)
    if (sup(P, 'argent')) { const g = Math.min(6, Math.floor(P.grav / 8)); if (g) { P.grav += g; log(G, `${P.name} รับเกรฟ ${g} จากตระกูลอาร์เจนท์`, 'sup', P.id); } }
    if (P.loanDue) {
      const pay = Math.min(P.grav, P.loanDue); P.grav -= pay;
      if (pay < P.loanDue) { addStigma(G, P, 1, 'คืนเงินกู้ไม่ครบ'); log(G, `${P.name} คืนเงินกู้ไม่ครบ รับตราบาป 1`, 'lose', P.id); }
      P.loanDue = 0;
    }
    if (G.rules.upkeepFree != null) {
      const due = Math.max(0, P.projects.length - G.rules.upkeepFree) * G.rules.upkeepCost;
      if (due > 0) {
        const pay = Math.min(P.grav, due); P.grav -= pay; G.stats.upkeep = (G.stats.upkeep || 0) + pay;
        if (pay < due) { addStigma(G, P, 1, 'จ่ายค่าบริหารดินแดนไม่ครบ', `จ่าย ${pay}/${due}`); log(G, `${P.name} จ่ายค่าบริหารดินแดนไม่ครบ (${pay}/${due}) รับตราบาป 1`, 'lose', P.id); }
        else log(G, `${P.name} จ่ายค่าบริหารดินแดน ${due} เกรฟ (${P.projects.length} โครงการ)`, 'eco', P.id);
      }
    }
    if (has(P, 'สมาคมธนาคาร')) P.grav += Math.min(3, Math.floor(P.grav / 5));
    if (has(P, 'หม้อกลาง')) P.grav += Math.min(3, Math.max(0, totalWorkers(P) - assignedWorkers(P)));
  }
  emit(G, 'fx', { t: 'income' });
  const cul = G.players.map(cultures); const maxc = Math.max(...cul);
  for (const P of G.players) if (has(P, 'มรดกเกรสแลนด์') && cul[P.id] === maxc && maxc > 0) { P.grav += 3; log(G, `${P.name} ได้เกรฟ 3 จากมรดกเกรสแลนด์`, 'res', P.id); }
  // คณะทาลัน (from era II): the sole net-score leader, when it is another state, pays the holder 3 grav (ruled 11 Nov;
  // 1 before); a leader holding less than 3 pays nothing and takes 1 stigma instead (ruled 11 Nov, third round)
  if (G.era >= 1) for (const P of G.players) {
    if (!sup(P, 'talan')) continue;
    const nets = G.players.map(Q => Q.legit - Q.stigma), m = Math.max(...nets), top = G.players.filter(Q => Q.legit - Q.stigma === m);
    const L = top.length === 1 && top[0] !== P ? top[0] : null;
    if (L && L.grav >= 3) { L.grav -= 3; P.grav += 3; log(G, `${P.name} ย้ายเกรฟ 3 จากคลังของ${L.name} ผู้นำคะแนนสุทธิ (คณะทาลัน)`, 'sup', P.id); }
    else if (L) { addStigma(G, L, 1, 'คณะทาลัน', `ผู้นำมีเกรฟไม่ถึง 3`); log(G, `${L.name} ผู้นำคะแนนสุทธิมีเกรฟไม่ถึง 3 รับตราบาป 1 แทน (คณะทาลันของ${P.name})`, 'sup', P.id); }
  }
  // scoring
  scoreRegime(G, 'นับคะแนน');
  emit(G, 'fx', { t: 'score' });
  // currents
  for (let i = 0; i < G.n; i++) { const P = G.players[(G.first + i) % G.n]; if (has(P, 'เครื่องฉายภาพมานา')) askCurrent(G, P, 'เครื่องฉายภาพมานา: ขยับกระแสก่อนตรวจ'); }
  // rules 0.4.7 flip a current the moment it reaches the flip point (the projector above included), so none is left here
  resolveFlip(G);
  // workers
  const hireReq = (P, c) => ({ kind: 'hire', title: `รับแรงงานคนที่ ${totalWorkers(P) + 1}?`, cost: c,
    options: [{ value: true, label: `รับ จ่ายอาหาร ${c}` }, { value: false, label: 'ไม่รับ' }] });
  const hireNow = (P, c) => {
    takeGoods(P, 'food', c); P.hired++; P.hiresThisRound++;
    emit(G, 'fx', { t: 'hire', pid: P.id });
    log(G, `${P.name} รับแรงงาน จ่ายอาหาร ${c} (รวม ${totalWorkers(P)})`, 'eco', P.id);
  };
  const hireCan = P => { if (maxHires(G, P) - P.hiresThisRound <= 0) return null; const c = hireCost(G, P); return c == null || goodsOf(P, 'food') < c ? null : c; };
  // a state the council does not ask hears why (ruled 13 Nov): the food it lacks for its next worker, the hire it already
  // took this round (โรงพยาบาลรัฐ), or a full population track, said once a game. after: the state has just hired, so a
  // used hire is no news. Bookkeeping only: no rng, no answer, so saved games and online peers replay as before
  const hireSkip = (P, after) => {
    const why = P.hired >= 8 ? (P.toldFull ? '' : 'full') : maxHires(G, P) - P.hiresThisRound <= 0 ? (after ? '' : 'used')
      : goodsOf(P, 'food') < hireCost(G, P) ? 'food' : '';
    if (!why) return;
    const n = totalWorkers(P) + 1, cost = hireCost(G, P), have = goodsOf(P, 'food');
    if (why === 'full') { P.toldFull = true; log(G, `${P.name} มีแรงงานครบ 10 คนแล้ว สภาไม่ถามจ้างแรงงานอีก`, 'skip', P.id); }
    else if (why === 'used') log(G, `${P.name} รับแรงงานครบสิทธิ์ของรอบนี้ไปแล้ว สภาจึงไม่ถามจ้างอีก`, 'skip', P.id);
    else log(G, `${P.name} จ้างแรงงานคนที่ ${n} ไม่ได้ อาหารไม่พอ (ต้องใช้ ${cost} มี ${have})`, 'skip', P.id);
    emit(G, 'fx', { t: 'skip', what: 'hire', why, after: !!after, pid: P.id, n, cost, have });
  };
  const seatOrder = []; for (let i = 0; i < G.n; i++) seatOrder.push(G.players[(G.first + i) % G.n]);
  if (G.rules.simul) {
    // rules 0.4: every state that can hire is asked at once; a state allowed two hires is asked again in the next pass
    for (const P of seatOrder) if (hireCan(P) == null) hireSkip(P, false);
    let open = seatOrder.filter(P => hireCan(P) != null);
    while (open.length) {
      const costs = open.map(hireCan);
      const ans = (open.map((P, i) => ask(G, P, hireReq(P, costs[i]))));
      const next = [];
      for (let i = 0; i < open.length; i++) {
        if (!ans[i]) continue;
        hireNow(open[i], costs[i]);
        if (hireCan(open[i]) != null) next.push(open[i]); else hireSkip(open[i], true);
      }
      open = next;
    }
  } else {
    for (const P of seatOrder) {
      if (hireCan(P) == null) { hireSkip(P, false); continue; }
      let can = maxHires(G, P) - P.hiresThisRound;
      while (can > 0) {
        const c = hireCost(G, P);
        if (c == null || goodsOf(P, 'food') < c) { hireSkip(P, true); break; }
        const v = ask(G, P, hireReq(P, c));
        if (!v) break;
        hireNow(P, c); can--;
      }
    }
  }
  const anyUsed = G.players.some(P => buildingsOf(P).some(x => x.b.used));
  for (const P of G.players) {
    for (const { b } of buildingsOf(P)) b.used = false;
    P.mods = []; P.projDiscount = 0; P.attacked = {}; P.coupDone = false; P.tradeBonus = false; P.hiresThisRound = 0;
  }
  if (anyUsed) emit(G, 'fx', { t: 'untap' });
  passFirstPlayer(G);
  emit(G, 'fx', { t: 'first', pid: G.first });
  G.stats.legitByRound.push(G.players.map(P => P.legit - P.stigma));
  G.stats.snaps.push(G.players.map(P => ({ net: P.legit - P.stigma, grav: P.grav, goods: GOODS.reduce((a, t) => a + goodsOf(P, t), 0), projects: P.projects.length,
    buildings: buildingsOf(P).length, workers: totalWorkers(P), research: P.research.length })));
  emit(G, 'update');
}
function passFirstPlayer(G) {
  if (G.rules.turnOrder === 'trailing') {
    // the state with the lowest net legitimacy opens the next round; ties go to the one seated soonest after the current first player
    let best = null, bv = Infinity;
    for (let k = 1; k <= G.n; k++) { const P = G.players[(G.first + k) % G.n]; const v = P.legit - P.stigma; if (v < bv) { bv = v; best = P; } }
    G.first = best.id;
    log(G, `${best.name} มีคะแนนสุทธิต่ำสุด (${bv}) ได้เป็นผู้เล่นคนแรกรอบหน้า`, 'sys', best.id);
  } else G.first = (G.first + 1) % G.n;
}
// a scoring leaves rank 1, 2 or 3 empty when the three highest metric values are not all different
function rankGap(vals) { const s = vals.slice().sort((a, b) => b - a); return s[0] === s[1] || (s.length > 2 && s[1] === s[2]); }
K.rankGap = rankGap;
// ภาระผู้นำ: the sole net-legitimacy leader scores leaderBurden fewer points (not below 0); returns [leader index, cut].
// Under burdenGap only at a scoring that leaves one of the first three ranks empty
function leaderBurden(G, pts, vals) {
  if (!G.rules.leaderBurden) return [-1, 0];
  if (G.rules.burdenGap && !rankGap(vals)) return [-1, 0];
  const nets = G.players.map(P => P.legit - P.stigma); const m = Math.max(...nets);
  if (nets.filter(v => v === m).length !== 1) return [-1, 0];
  const L = nets.indexOf(m); const cut = Math.min(pts[L], G.rules.leaderBurden);
  pts[L] -= cut;
  return [L, cut];
}
// points each state would score now under the given values, leader burden included (for previews)
K.scorePreview = function (G, vals) {
  const pts = pointsFor(G, vals, tieHigh(G));
  leaderBurden(G, pts, vals);
  return pts;
};
function scoreRegime(G, label, flip) {
  const vals = G.players.map(P => metricOf(G, P));
  const pts = pointsFor(G, vals, tieHigh(G));
  const parts = [];
  const [L, cut] = leaderBurden(G, pts, vals);
  const gap = !!G.rules.burdenGap;
  if (cut > 0) { parts.push(`${G.players[L].name} นำอยู่${gap ? ' และสามอันดับแรกมีรัฐเสมอกัน' : ''} หักภาระผู้นำ ${cut}`); G.stats.burdenCuts++; G.stats.burdenPts += cut; }
  G.players.forEach((P, i) => {
    const note = [flip ? 'กระแสพลิก' : '', i === L && cut > 0 ? `หักภาระผู้นำ ${cut}${gap ? ' สามอันดับแรกมีรัฐเสมอ' : ''}` : ''].filter(Boolean).join(' ');
    addLegit(G, P, pts[i], `นับคะแนน${regLabel(G.regime)}`, note);
    parts.push(`${P.name} ${vals[i]}→+${pts[i]}`);
    if (pts[i] === 0 && has(P, 'สิทธิเลือกตั้งทั่วไป')) { addLegit(G, P, 1, 'สิทธิเลือกตั้งทั่วไป'); parts.push(`${P.name} +1 จากสิทธิเลือกตั้งทั่วไป`); }
    // หน่วยรับมือเหตุฉุกเฉินทางชีวภาพ (from era II): a council that scores the state 0 gives 1 legitimacy, once per council
    // (ruled 11 Nov; 2 grav before)
    if (pts[i] === 0 && G.era >= 1 && sup(P, 'biohazard') && supUsed(P).bio !== G.round) { supUsed(P).bio = G.round; addLegit(G, P, 1, 'หน่วยรับมือเหตุฉุกเฉินทางชีวภาพ'); parts.push(`${P.name} +1 จากหน่วยรับมือเหตุฉุกเฉินทางชีวภาพ`); }
  });
  log(G, `${label}${G.regime} (${REG[G.regime].metric}): ${parts.join(' · ')}`, 'score');
}

// who picks the next regime at the era change (rulebook 11.3): the state holding the most symbols of the base line of the
// regime in power; a tie goes to the lower legitimacy, then to the seat nearest the first player going round; nobody
// holding the line: the lowest legitimacy. legitOf and netOf read a state's legitimacy and net score, so the table can
// preview the pick with what the era change itself hands out before it (eraChooserPreview). why says which rule decided:
// most, legit, none or trailing, with -seat when the seat order broke the last tie. No rng
function eraChooserOf(G, legitOf, netOf) {
  legitOf = legitOf || (P => P.legit); netOf = netOf || (P => P.legit - P.stigma);
  const base = REG[G.regime].base;
  const cnt = G.players.map(P => symCount(P, base));
  const max = Math.max(...cnt);
  const byFirst = list => { for (let k = 0; k < G.n; k++) { const q = G.players[(G.first + k) % G.n]; if (list.includes(q)) return q; } return list[0]; };
  let pool, why, top = [];
  if (G.rules.eraChooser === 'trailing') { const mn = Math.min(...G.players.map(netOf)); pool = G.players.filter(p => netOf(p) === mn); why = 'trailing'; }
  else if (max <= 0) { const ml = Math.min(...G.players.map(legitOf)); pool = G.players.filter(p => legitOf(p) === ml); why = 'none'; }
  else {
    pool = top = G.players.filter(p => cnt[p.id] === max); why = 'most';
    if (pool.length > 1) { const ml = Math.min(...pool.map(legitOf)); pool = pool.filter(p => legitOf(p) === ml); why = 'legit'; }
  }
  if (pool.length > 1) why += '-seat';
  return { chooser: byFirst(pool), base, cnt, max, why, top, pool };
}
// the pick as it would fall if the era changed now, for the table to show (ruled 13 Nov). The era change hands out
// legitimacy before it picks (พงศาวดาร to the lowest, the old house's prestige to the AI levels that have it) and
// องค์กรจันทร์สีชาด discards a stigma from era III on, so the preview counts them the same way. set and options: the regimes
// the chooser picks from. null in the last era
function eraChooserPreview(G) {
  if (G.over || G.era >= D.eras.length - 1) return null;
  const minL = Math.min(...G.players.map(P => P.legit));
  const lv = P => (!P.human && K.AI && K.AI.LEVELS && K.AI.LEVELS[P.level] && K.AI.LEVELS[P.level].legitEra) || 0;
  const add = P => (has(P, 'พงศาวดาร') && P.legit === minL ? 2 : 0) + lv(P);
  const cut = P => (G.era + 1 >= 2 && sup(P, 'crimson') && P.stigma > 0 ? 1 : 0);
  const r = eraChooserOf(G, P => P.legit + add(P), P => P.legit + add(P) - P.stigma + cut(P));
  r.legit = G.players.map(P => P.legit + add(P));
  r.set = G.era + 1 === 2 ? 'modern' : G.regimeSet;
  r.options = D.regimes.filter(x => x.set === r.set && x.name !== G.regime).map(x => x.name);
  return r;
}
K.eraChooserOf = eraChooserOf; K.eraChooserPreview = eraChooserPreview;
// the log line that names the chooser and the rule that made it the chooser
function chooserLine(G, pk) {
  const C = pk.chooser, ln = LINE_NAME[pk.base];
  const others = list => { const a = list.filter(q => q !== C).map(q => q.name); return a.length < 2 ? a.join('') : a.slice(0, -1).join(' ') + ' และ' + a[a.length - 1]; };
  const seat = C.id === G.first ? 'เป็นผู้เล่นคนแรก' : 'นั่งใกล้ผู้เล่นคนแรกที่สุดตามเข็มนาฬิกา';
  if (pk.why.indexOf('trailing') === 0) return `${C.name} มีคะแนนสุทธิต่ำสุด${pk.why === 'trailing-seat' ? `เท่ากับ${others(pk.pool)} แต่${seat}` : ''} เป็นผู้เลือกระบอบ`;
  if (pk.why === 'none') return `ไม่มีรัฐใดถือสัญลักษณ์${ln} ${C.name} มีความชอบธรรมน้อยที่สุด เป็นผู้เลือกระบอบ`;
  if (pk.why === 'none-seat') return pk.pool.length === G.n ? `ไม่มีรัฐใดถือสัญลักษณ์${ln} และทุกรัฐมีความชอบธรรมเท่ากัน ${C.name} ${seat} จึงเป็นผู้เลือกระบอบ`
    : `ไม่มีรัฐใดถือสัญลักษณ์${ln} ${C.name} มีความชอบธรรมน้อยที่สุดเท่ากับ${others(pk.pool)} แต่${seat} เป็นผู้เลือกระบอบ`;
  const tie = pk.why === 'legit' ? ` เสมอกับ${others(pk.top)} แต่มีความชอบธรรมน้อยกว่า`
    : pk.why === 'legit-seat' ? ` เสมอกับ${others(pk.top)} ${pk.pool.length === pk.top.length ? 'ความชอบธรรมก็เท่ากัน' : `ความชอบธรรมน้อยที่สุดเท่ากับ${others(pk.pool)}`} แต่${seat}` : '';
  return `${C.name} ถือสัญลักษณ์${ln}มากที่สุด (${pk.cnt[C.id]})${tie} เป็นผู้เลือกระบอบ`;
}
K.chooserLine = chooserLine;

function eraChange(G) {
  G.phase = 'era';
  const prev = G.regime;
  const L = G.players.map(P => P.legit); const minL = Math.min(...L);
  for (const P of G.players) if (has(P, 'พงศาวดาร') && P.legit === minL) { addLegit(G, P, 2, 'พงศาวดาร', 'เปลี่ยนยุค'); log(G, `${P.name} ได้ความชอบธรรม 2 จากพงศาวดาร`, 'res', P.id); }
  G.era++; G.roundInEra = 1;
  if (G.era === 2) G.regimeSet = 'modern';
  log(G, `=== เข้าสู่ยุค ${eraD(G).id} ${eraD(G).name} ===`, 'era');
  for (const P of G.players) levelPrestige(G, P);
  // องค์กรจันทร์สีชาด: at the start of era III and of era IV the holder discards one of its stigma
  if (G.era >= 2) for (const P of G.players) if (sup(P, 'crimson') && P.stigma > 0) { addStigma(G, P, -1, 'องค์กรจันทร์สีชาด ล้างตราบาป', `ต้นยุค ${eraD(G).id}`); log(G, `${P.name} ทิ้งตราบาป 1 ใบจากองค์กรจันทร์สีชาด (เหลือ ${P.stigma})`, 'sup', P.id); }
  // succession (rulebook 11.3); the table previews the same pick through eraChooserPreview
  const pick = eraChooserOf(G), chooser = pick.chooser;
  const opts = D.regimes.filter(r => r.set === G.regimeSet && r.name !== prev).map(r => ({ value: r.name, label: r.name, sub: `${LINE_NAME[r.line]} · วัด: ${r.metric} · ${r.policy} · ฐาน: ${LINE_NAME[r.base]}`, reg: r }));
  log(G, chooserLine(G, pick), 'reg', chooser.id);
  G.stats.eraChoosers = (G.stats.eraChoosers || []).concat([{ round: G.round, id: chooser.id }]);
  const name = ask(G, chooser, { kind: 'regimeChoice', title: `เปลี่ยนยุค: ${chooser.name} เลือกระบอบใหม่`, options: opts, why: 'era' });
  setRegime(G, name, `สืบทอดเมื่อเปลี่ยนยุค โดย ${chooser.name}`);
  if (has(chooser, 'ตราประทับหลวง')) { addLegit(G, chooser, 1, 'ตราประทับหลวง', 'เปลี่ยนยุค'); log(G, `${chooser.name} ได้ความชอบธรรม 1 จากตราประทับหลวง`, 'win', chooser.id); }
  G.market = G.projectDecks[G.era].splice(0, 3);
  for (const l of LINES) G.currents[l] = 0;
  emit(G, 'update');
}

function finalScores(G) {
  const sc = G.players.map(P => ({ P, score: P.legit - P.stigma, grav: P.grav, goods: GOODS.reduce((s, t) => s + goodsOf(P, t), 0) }));
  sc.sort((a, b) => b.score - a.score || b.grav - a.grav || b.goods - a.goods);
  return sc;
}
K.finalScores = finalScores;

function runGame(G) {
  emit(G, 'start');
  if (G.rules.supporters) supporterDraft(G);
  const T = totalRounds(G), E = perEra(G);
  for (G.round = 1; G.round <= T; G.round++) {
    G.roundInEra = ((G.round - 1) % E) + 1;
    emit(G, 'fx', { t: 'round', round: G.round });
    productionPhase(G);
    adminPhase(G);
    councilPhase(G);
    if (G.round === T / 2) G.stats.midLeader = finalScores(G)[0].P.id;
    if (G.round < T && G.round % E === 0) eraChange(G);
  }
  G.phase = 'end'; G.over = true; G.round = T;
  const sc = finalScores(G);
  G.stats.final = sc.map(x => ({ id: x.P.id, score: x.score, legit: x.P.legit, stigma: x.P.stigma, grav: x.grav, goods: x.goods }));
  G.stats.winner = sc[0].P.id;
  G.stats.endTime = Date.now();
  log(G, `เกมจบ ผู้ชนะ: ${sc[0].P.name} (${sc[0].score})`, 'era');
  sc.forEach((x, i) => log(G, `อันดับ ${i + 1} ${x.P.name} สุทธิ ${x.score} (ความชอบธรรม ${x.P.legit} ตราบาป ${x.P.stigma}) เกรฟ ${x.grav} สินค้า ${x.goods}`, 'score', x.P.id));
  emit(G, 'end', sc);
  return sc;
}
K.runGame = runGame;

Object.assign(K, { askCurrent, drawBonus, doCommerce, doBuild, doCommand, doReform, doResearch, doDiplomacy, playAction,
  activate, checkWarehouse, productionPhase, adminPhase, councilPhase, eraChange, placeResearch, runBattle,
  marketSellPriceOf: marketSellPrice, coupDefenderOf: coupDefender, inst, takeGoods, projectPlan: productionPlan });
})(typeof window !== 'undefined' ? window : globalThis);

/* สหพันธรัฐ · heuristic AI. Uses public information only (deck order unknown; Monte Carlo for battles). */
(function (root) {
'use strict';
const K = root.K;
const AI = K.AI = {};
const GOODS = K.GOODS, LINES = K.LINES;

const STYLES = {
  balanced: { name: 'สมดุล', build: 1, commerce: 1, mil: 1, research: 1, aggr: 1 },
  builder: { name: 'นักสร้าง', build: 1.25, commerce: 1, mil: 0.75, research: 1, aggr: 0.7 },
  merchant: { name: 'พ่อค้า', build: 1, commerce: 1.3, mil: 0.75, research: 0.95, aggr: 0.8 },
  warlord: { name: 'ขุนศึก', build: 0.9, commerce: 0.9, mil: 1.5, research: 0.85, aggr: 1.6 },
  scholar: { name: 'นักวิชาการ', build: 0.95, commerce: 0.9, mil: 0.8, research: 1.35, aggr: 0.7 },
};
AI.STYLES = STYLES;
const sty = P => STYLES[P.style] || STYLES.balanced;
// ---------- difficulty ----------
// noise: spread on the value of each turn option; slip: chance of a careless pick;
// legitEra: legitimacy at the start of each era, the old house's prestige (the engine adds it through the ledger).
// Measured with sim_levels.js, a normal-AI seat against three AIs of the level (25% = even):
//   easy 52.5% (200 games); hard 18.8% (160 games). Sharper play alone (no noise, double battle samples) moved
//   nothing (26.3%), and +1 legitimacy per era was absorbed by the leader burden at council (27.5%).
// Every random draw comes from G.aiR, so peers that run the same AI seats stay in lockstep.
const LEVELS = {
  easy: { name: 'ง่าย', noise: 0.9, slip: 0.3 },
  normal: { name: 'ปกติ', noise: 0.12, slip: 0 },
  hard: { name: 'ยาก', noise: 0, slip: 0, legitEra: 2 },
};
AI.LEVELS = LEVELS;
AI.LEVEL_KEYS = ['easy', 'normal', 'hard'];
const lvl = P => LEVELS[P.level] || LEVELS.normal;

// ---------- value model ----------
// grav value of one unit of goods in the current era (dataset spine when present)
const uv = G => { const sp = K.eraD(G).spine; return sp != null ? sp : [2, 2.5, 3, 3.5][G.era]; };
// game length comes from the rules: 16 rounds of 4 (0.2, 0.3) or 12 of 3 (0.4); every horizon below scales with it
const TR = G => K.totalRounds(G), ER = G => K.perEra(G);
const PR = G => Math.max(0, TR(G) - G.round); // future production phases
const DELTA = 0.85;
function disc(n) { let s = 0, f = 1; for (let k = 1; k <= n; k++) { f *= DELTA; s += f; } return s; }
const LV = G => 10 + G.round * 8 / TR(G);
// resources lose their worth over the last era: 1 before it, then 0.8 down to 0.2 at the last round
const RES_DECAY = { 4: [0.8, 0.6, 0.4, 0.2], 3: [0.8, 0.5, 0.2] };
function resF(G) { const T = TR(G), E = ER(G), k = G.round - (T - E); return k <= 0 ? 1 : (RES_DECAY[E] || RES_DECAY[4])[Math.min(k, E) - 1]; }
// marginal value of 1 grav: drops when the treasury is large (nothing left to spend it on), except under สาธารณรัฐพ่อค้า
function gw(G, P) {
  if (G.regime === 'สาธารณรัฐพ่อค้า') return resF(G);
  return resF(G) * Math.max(0.35, Math.min(1, 1.25 - P.grav / 50));
}
AI.gw = gw;
function typeVal(G, P, t) {
  if (t === 'grav') return gw(G, P);
  const stock = K.goodsOf(P, t);
  return uv(G) * Math.max(0.5, Math.min(1.2, 1.2 - stock / 14)) * resF(G);
}
AI.typeVal = typeVal;
function costValue(G, P, c) { let v = (c.grav || 0) * gw(G, P); for (const t of GOODS) v += (c[t] || 0) * typeVal(G, P, t); return v; }
const armyAvg = P => { const a = K.armyCards(P); return a.length ? a.reduce((s, c) => s + c.d.mv, 0) / a.length : 0; };
const neutralAvg = G => K.data().neutral.reduce((s, c) => s + c.count * c.power[G.era], 0) / K.data().neutral.reduce((s, c) => s + c.count, 0);
function milNeed(G, P) {
  const gap = Math.max(0, neutralAvg(G) + 0.3 - armyAvg(P));
  return sty(P).mil * (0.6 + gap * 0.6);
}
function kEff(G, includeNow) { return Math.max(0, Math.min(3, (includeNow ? ER(G) + 1 : ER(G)) - G.roundInEra)); }
// expected councils a regime survives out of k (flips and coups cut regimes short)
function dur(k) { return k <= 1 ? k : 1 + (k - 1) * 0.45; }

// regime points for P under regime name, relative to the average opponent (legitimacy is a race)
function regimePts(G, P, name, override) {
  const vals = G.players.map(Q => (override && Q === P) ? override(name) : K.metricOf(G, Q, name));
  const pts = K.pointsFor(G, vals, K.tieHigh(G));
  let o = 0; for (let i = 0; i < pts.length; i++) if (i !== P.id) o += pts[i];
  return pts[P.id] - o / (pts.length - 1);
}
AI.regimePts = regimePts;
function metricDelta(G, P, kind, delta) {
  // value of changing P's metric for the current regime
  const map = { cultures: 'ราชาธิปไตย', grav: 'สาธารณรัฐพ่อค้า', workers: 'ประชาคมเสรี', army: 'ระบอบขุนศึก', innovations: 'ปราชญาธิปไตย',
    projects: 'ชาตินิยม', buildings: 'มานาเสรี', food: 'ประชาธิปไตยสังคม', army3: 'รัฐบาลทหาร', research: 'เทคโนแครต', armsSym: 'รัฐบาลทหาร' };
  // rules 0.4.7 (juntaSym): the junta ranks by arms symbols, so military cards of era III on no longer count, and arms
  // symbols count only then
  if (G.rules && G.rules.juntaSym ? kind === 'army3' : kind === 'armsSym') return 0;
  if (!delta) return 0;
  const reg = G.regime;
  const kinds = Object.keys(map).filter(k => map[k] === reg);
  if (!kinds.includes(kind)) {
    if (!(kind === 'cultures' || kind === 'innovations' || kind === 'buildings') || reg !== 'เทคโนแครต') return 0;
  }
  const base = K.metricOf(G, P, reg);
  const before = regimePts(G, P, reg);
  const after = regimePts(G, P, reg, () => base + delta);
  return (after - before) * LV(G) * Math.max(0.6, dur(kEff(G, true))) * 0.8;
}
const armsSyms = sym => (sym || []).filter(s => s === 'arms').length;
function regimeValue(G, P, name, k) { return regimePts(G, P, name) * LV(G) * dur(k); }

function pushValue(G, P, line, dir) {
  const reg = K.regimeOf(G.regimeSet, line);
  if (!reg || reg.name === G.regime) {
    // pushing the ruling line only resets it; pushing it down is harmless
    return 0;
  }
  // rules 0.4.7: a push that flips during a turn puts the new regime in power before this round's council, so that council
  // counts too; a flip at the council itself (the projector) comes after its scoring, as every flip did before
  const k = kEff(G, !!(G.rules && G.rules.instantFlip && G.phase !== 'council'));
  let gain = k > 0 ? (regimePts(G, P, reg.name) - regimePts(G, P, G.regime)) * LV(G) * dur(k) * 0.7 : 0;
  // flip scoring: the new regime is also scored once at the council where it takes power
  if (G.rules && G.rules.flipScore) gain += regimePts(G, P, reg.name) * LV(G) * 0.9;
  if (!gain) return 0.1 * dir;
  const v = G.currents[line], tip = G.tip;
  const p = x => { if (x >= tip) return 1; const q = Math.max(0, x) / tip; return q * q * 0.6; }; // exact on every JS engine (lockstep peers may run different browsers)
  return (p(v + dir) - p(v)) * gain;
}
AI.pushValue = pushValue;
function bestPush(G, P, mandatory) {
  let best = null, bv = mandatory ? -1e9 : 0.05;
  for (const l of LINES) for (const dir of [1, -1]) {
    if (dir < 0 && G.currents[l] <= 0) continue;
    const v = pushValue(G, P, l, dir);
    if (v > bv) { bv = v; best = { line: l, dir }; }
  }
  return { mv: best, v: Math.max(0, bv) };
}

// ---------- production knapsack ----------
function projGain(G, P, pr, cap) {
  // per-round gain of staffing pr (cap = respect current 6-cap)
  let n = pr.d.outN;
  if (Object.keys(pr.d.inp).length && K.has(P, 'เครื่องจักรไอน้ำมานา')) n++;
  if (pr.d.out === 'food') { if (K.has(P, 'คันไถเหล็ก')) n += 0.5; if (K.has(P, 'ปุ๋ยเคมี')) n += 0.7; if (K.has(P, 'พืชเสริมมานา')) n += 1.4; }
  let v;
  if (pr.d.out === 'grav') v = n;
  else {
    const top = P.pb ? K.projCap(P, pr) : 6;
    const room = cap ? top - pr.goods : top;
    v = Math.min(n, Math.max(0, room)) * typeVal(G, P, pr.d.out) + (cap ? 0 : 0);
    if (cap && room <= 0) v = 0;
  }
  for (const t of Object.keys(pr.d.inp)) v -= pr.d.inp[t] * typeVal(G, P, t);
  if (P.pb && pr.buildings && pr.buildings.length) v += bldStaffGain(G, P, pr);
  return v;
}
// rules 0.4: what the buildings on pr add per round while pr is fully staffed
function bldStaffGain(G, P, pr) {
  const g = gw(G, P), tv = t => t === 'grav' ? g : typeVal(G, P, t);
  let v = 0;
  for (const b of pr.buildings) {
    switch (b.d.name) {
      case 'กังหันน้ำ': v += tv(pr.d.out); break;
      case 'ห้องทดลองเคมี': v += Math.max(0, 2 * tv(pr.d.out) - typeVal(G, P, 'fuel')); break;
      case 'โรงจักรไอน้ำมานา': v += Math.max(0, 3 * tv(pr.d.out) - typeVal(G, P, 'fuel')); break;
      case 'ท่าเทียบเรือ': if (pr.d.out !== 'grav') v += Math.max(0, K.eraD(G).buy * g - tv(pr.d.out)); break;
      case 'โรงทอผ้าด้วยกี่': if (pr.d.out === 'food') v += Math.max(0, 6 * g - 2 * tv('food')); break;
      case 'โรงทอไหมมานา': if (pr.d.out !== 'grav') v += Math.max(0, 8 * g - 3 * tv(pr.d.out)); break;
      case 'โรงงานเครื่องใช้เวทมนตร์': if (pr.d.out !== 'grav') v += Math.max(0, 11 * g - 3 * tv(pr.d.out)); break;
      case 'โรงสี': if (pr.d.out === 'food') v += g; break;
      case 'โรงรับจำนำ': v += Math.min(3, Math.floor(K.whTotal(P) / 2)) * g; break;
      case 'พิพิธภัณฑ์แห่งชาติ': v += Math.min(4, K.cultures(P)) * g; break;
      case 'เคหะนอกกำแพงเดิม': v += Math.floor(K.assignedWorkers(P) / 2) * g; break;
      case 'โรงแปรธาตุ': v += 2 * typeVal(G, P, 'mat'); break;
      default: v += 0.6;   // buildings that act on reform, research, trade, diplomacy or battle
    }
  }
  return v;
}
function knap(items, W) {
  // items: {w, v}; returns {best, pick:Set(index)}
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (it.v > 0 && it.w <= w && dp[i - 1][w - it.w] + it.v > dp[i][w]) dp[i][w] = dp[i - 1][w - it.w] + it.v;
    }
  }
  const pick = new Set(); let w = W;
  for (let i = n; i > 0; i--) if (dp[i][w] !== dp[i - 1][w]) { pick.add(i - 1); w -= items[i - 1].w; }
  return { best: dp[n][W], pick };
}
function prodValue(G, P, projects, W, cap) {
  const lamp = K.has(P, 'โคมไฟกริดมานา');
  const items = projects.map(pr => ({ w: pr.d.workers, v: projGain(G, P, pr, cap), pr }));
  let r = knap(items, W); let lampIdx = -1;
  if (lamp) {
    for (let i = 0; i < items.length; i++) {
      const it2 = items.map((x, j) => j === i ? Object.assign({}, x, { w: Math.max(0, x.w - 1) }) : x);
      const r2 = knap(it2, W);
      if (r2.best > r.best + 0.01) { r = r2; lampIdx = i; }
    }
  }
  return { best: r.best, pick: r.pick, items, lampIdx };
}
function marginalProd(G, P, proj) {
  const W = K.totalWorkers(P) + (P.hired < 8 ? 1 : 0);
  const a = prodValue(G, P, P.projects, W, false).best;
  const b = prodValue(G, P, P.projects.concat([proj]), W, false).best;
  return Math.max(0, b - a);
}

// ---------- project valuation ----------
function symValue(G, P, syms) {
  let v = 0; const base = K.REG[G.regime].base;
  for (const s of syms) {
    if (s === 'wagon') v += 0.25 * Math.min(8, PR(G));
    else v += (s === base ? 2.0 : 0.8);
  }
  return v;
}
function projectGross(G, P, proj) {
  let g = marginalProd(G, P, proj) * disc(PR(G));
  g += K.slotsOf(P, proj) * 1.2 * Math.min(1, PR(G) / 6);
  g += symValue(G, P, proj.d.sym);
  g += metricDelta(G, P, 'projects', 1);
  g += metricDelta(G, P, 'armsSym', armsSyms(proj.d.sym));
  if (proj.d.sale != null) g += 0.4 * Math.min(6, PR(G));
  if (K.has(P, 'ขนบราชสำนัก')) g += 1;
  if (K.has(P, 'ข้าราชการสืบทอด')) g += 2;
  // land upkeep: every project above the allowance costs grav at each remaining council
  const R = G.rules || {};
  if (R.upkeepFree != null && P.projects.length + 1 > R.upkeepFree) g -= (R.upkeepCost || 1) * PR(G) * gw(G, P) * 0.9;
  return g;
}
function projectNet(G, P, proj, annex) {
  const c = K.projectCost(G, P, proj.d, annex);
  const pl = K.payPlan(G, P, c, { joint: true, loan: true });
  if (!pl.ok) return { v: -1e9, c, pl };
  let cv = costValue(G, P, c) + 3 * pl.sub * gw(G, P);
  if (pl.borrow) cv += 2 + pl.borrow * 0.3;
  if (G.regime === 'สาธารณรัฐพ่อค้า') cv += metricDelta(G, P, 'grav', -1) * -0.3 * ((c.grav || 0) + 3 * pl.sub);
  let v = projectGross(G, P, proj) * sty(P).build - cv;
  // rules 0.4.6: building pushes the current of each ideology symbol on the project 1 step, whether the state likes the
  // regime it leads to or not, so the push counts with its sign (an annexed project pushes nothing)
  if (!annex && G.rules && G.rules.projPush) for (const s of proj.d.sym || []) if (LINES.includes(s)) v += pushValue(G, P, s, 1);
  return { v, c, pl };
}
AI.projectNet = projectNet;

// ---------- research card valuation ----------
// rules 0.4.5 (milV3): the battle cards of the designer's table v3 work card by card, so they are worth what the army carries
const kwCount = (P, f) => K.armyCards(P).filter(c => f(c.d.kw || {})).length;
const v3 = G => !!(G.rules && G.rules.milV3);
// the troops a state with these cards wants more of at the reform
function milSynergy(G, P, d) {
  if (!v3(G)) return 0;
  const kw = d.kw || {}; let v = 0;
  const ram = K.has(P, 'เครื่องยนต์มานาแรมเจ็ท');
  if (kw.def && K.has(P, 'ประเพณีนักรบ')) v += 0.4;
  if ((kw.chg || (kw.fuel && ram)) && K.bldOn(P, 'ค่ายฝึกทหาร')) v += 0.5;
  if (kw.int && K.has(P, 'หลักนิยมการรบแยกเดี่ยวฆ่าหมู่')) v += 0.5;
  if (kw.fuel && ram) v += 0.4;
  if (kw.surge && K.has(P, 'กองทัพมหาชน')) v += 0.3;
  return v;
}
AI.milSynergy = milSynergy;
// rules 0.4: a permanent building is worth what it does over the rounds left, on a project the state keeps staffed
function passiveBldValue(G, P, d) {
  const R = PR(G), Pd = disc(R), u = uv(G), M = milNeed(G, P), g = gw(G, P);
  const fv = typeVal(G, P, 'food'), mv = typeVal(G, P, 'mat'), xv = typeVal(G, P, 'fuel');
  const foodP = P.projects.some(p => p.d.out === 'food'), goodsP = P.projects.some(p => p.d.out !== 'grav');
  const reforms = R / 3, dips = Math.min(R + 1, 4);
  switch (d.name) {
    case 'โรงสี': return foodP ? Pd * 1.2 * g : 0.2;
    case 'โรงตีเหล็ก': return M * 0.5 * reforms;
    case 'ยุ้งฉาง': return goodsP ? Pd * 0.5 + 1 : 0.2;
    case 'โบสถ์ประจำเมือง': return Math.max(pushValue(G, P, 'trad', 1), 0.2) * dips * 0.6;
    case 'โรงรับจำนำ': return Pd * Math.min(3, Math.floor(K.whTotal(P) / 2) + 0.5) * g * 0.8;
    case 'ค่ายฝึกทหาร': {
      // 0.4.5: every card with ทะลวง charges 1 more when the state attacks (explorations included); before, spearmen and archers
      if (v3(G)) { const n = kwCount(P, k => k.chg || (k.fuel && K.has(P, 'เครื่องยนต์มานาแรมเจ็ท'))); return M * (n + 1.5) * 0.35 * Math.min(1, R / 6); }
      const st = K.armyCards(P).filter(c => c.d.name === 'พลหอก' || c.d.name === 'พลธนู').length; return M * st * 0.25 * Math.min(1, R / 6);
    }
    case 'กังหันน้ำ': return u * Pd * 0.9;
    case 'ท่าเทียบเรือ': return goodsP ? Math.max(0, K.eraD(G).buy * g - u) * Pd * 0.9 : 0;
    case 'แท่นพิมพ์เวทมนตร์': return Math.max(bestPush(G, P, false).v, 0.3) * dips * 0.6;
    case 'โรงประจุกระสุนมานา': return M * 2.2 * Math.min(1, R / 5);
    case 'คลังสินค้าท่าเรือ': return 1.5 * Math.min(1, R / 4);
    case 'โรงทอผ้าด้วยกี่': return foodP ? Math.max(0, 6 * g - 2 * fv) * Pd * 0.8 : 0;
    case 'ศาลาประชาคม': return Math.max(pushValue(G, P, 'ppl', 1), 0.2) * dips * 0.6;
    case 'โรงหล่อปืนใหญ่มานา': return M * reforms;
    case 'ห้องทดลองเคมี': return Math.max(0, 2 * u - xv) * Pd * 0.8;
    case 'ปราสาทตระกูล': return 1.5;
    case 'สถานีรถไฟ': return Pd * 0.5;
    case 'โรงทอไหมมานา': return goodsP ? Math.max(0, 8 * g - 3 * u) * Pd * 0.75 : 0;
    case 'โรงงานยุทธภัณฑ์': return M * 0.8 * reforms;
    case 'โรงพยาบาลรัฐ': return Math.min(8 - P.hired, R / 2) * 2 * fv * 0.8;
    case 'ห้องปฏิบัติการวิจัย': return R * 0.35;
    case 'โรงจักรไอน้ำมานา': return Math.max(0, 3 * u - xv) * Pd * 0.8;
    case 'พิพิธภัณฑ์แห่งชาติ': return Math.min(4, K.cultures(P) + 0.5) * g * Pd * 0.9;
    case 'ป้อมบาเรียร์ริมน้ำ': return 2.5 * Math.min(1, R / 4);
    case 'ศูนย์กระจายสินค้า': return Pd * 0.6;
    case 'โรงงานเครื่องใช้เวทมนตร์': return goodsP ? Math.max(0, 11 * g - 3 * u) * Pd * 0.75 : 0;
    case 'ฐานเรือเหาะรบ': return M * 2.8 * Math.min(1, R / 3);
    case 'หอกระจายเสียงวอกโซโฟน': return Math.max(bestPush(G, P, false).v, 0.3) * dips * 0.9;
    case 'เคหะนอกกำแพงเดิม': return Math.floor(K.assignedWorkers(P) / 2) * g * Pd * 0.9;
    case 'โรงแปรธาตุ': return 2 * mv * Pd * 0.8;
    case 'อนุสาวรีย์แห่งชาติ': return Math.max(pushValue(G, P, 'trad', 1), 0.2) * Math.min(dips, 3) * 0.9;
    case 'ศูนย์บัญชาการทหาร': return M * 1.5 * Math.min(1, R / 3);
  }
  return 1;
}
function cardBase(G, P, d) {
  if (P.pb && d.kind === 'building') return passiveBldValue(G, P, d);
  const R = TR(G) + 1 - G.round, Pd = disc(PR(G)), u = uv(G), M = milNeed(G, P);
  const fv = typeVal(G, P, 'food'), mv = typeVal(G, P, 'mat'), xv = typeVal(G, P, 'fuel');
  const foodP = P.projects.filter(p => p.d.out === 'food').length;
  const cul = K.cultures(P);
  const bp = bestPush(G, P, false).v;
  switch (d.name) {
    case 'โรงสี': return (4 - 2 * fv + 1) * Pd * 0.7;
    case 'โรงตีเหล็ก': return M * 2.2 * Math.min(4, R / 2);
    case 'ยุ้งฉาง': return 0.5 * Pd;
    case 'โบสถ์ประจำเมือง': return Math.max(pushValue(G, P, 'trad', 1), 0.5) * Math.min(4, R / 2) - fv * 2;
    case 'โรงรับจำนำ': return 1 * Pd;
    case 'ค่ายฝึกทหาร': return M * 1.5;
    case 'กังหันน้ำ': return u * Pd * 0.8;
    case 'ท่าเทียบเรือ': return (K.eraD(G).buy - u + 1) * Pd * 0.6;
    case 'ขนบราชสำนัก': return R * 0.35;
    case 'จารีตตระกูล': return R * 0.25;
    case 'สมาพันธ์พ่อค้า': return Pd * 1.2;
    case 'กฎหมายตราชั่ง': return Pd * 0.9;
    case 'สภาหมู่บ้าน': return Math.min(8 - P.hired, R / 2) * fv;
    case 'ยุ้งข้าวชุมชน': return 2.5;
    case 'ประเพณีนักรบ': return v3(G) ? 1 + M * (0.4 + kwCount(P, k => k.def) * 0.3) : 2 + M;
    case 'หอตำรา': return R * 0.25;
    case 'เกวียนล้อเหล็ก': return Pd * 0.3;
    case 'เรือท้องแบน': return Pd * 0.8;
    case 'สมุดบัญชีคู่': return Pd * 0.25;
    case 'หมุดเงิน': return M * 2.5;
    case 'คันไถเหล็ก': return foodP ? fv * Pd : 0.5;
    case 'ปฏิทินสิบสามห้วง': return Pd * 0.35;
    case 'นาฬิกาน้ำ': return Pd * 0.6;
    case 'ตราประทับหลวง': return LV(G) * 0.4 * Math.max(0, 3 - G.era);
    case 'แท่นพิมพ์เวทมนตร์': return Math.max(bp, 0.6) * Math.min(4, R / 2) - mv * 2;
    case 'โรงประจุกระสุนมานา': return M * 3;
    case 'คลังสินค้าท่าเรือ': return 0.6 * Pd;
    case 'โรงทอผ้าด้วยกี่': return (6 - 2 * fv + 1) * Pd * 0.7;
    case 'ศาลาประชาคม': return Math.max(pushValue(G, P, 'ppl', 1), 0.5) * Math.min(4, R / 2) - fv * 2;
    case 'โรงหล่อปืนใหญ่มานา': return M * 3 * Math.min(4, R / 2);
    case 'ห้องทดลองเคมี': return (2 * u - xv) * Pd * 0.8;
    case 'ปราสาทตระกูล': return 3;
    case 'สำนักปราชญ์': return R * 0.6;
    case 'นิรโทษกรรม': return P.stigma > 0 ? LV(G) : LV(G) * 0.25;
    case 'หลักนิยมสองนาที': return 4 * M;
    case 'ขุนนางสืบตระกูล': return R * 0.25 * LV(G) * 0.2;
    case 'จันทราอารักษ์': case 'หน่วยพิทักษ์ธรรม': return LV(G) * 0.5;
    case 'บริษัทร่วมทุน': return 3;
    case 'หอการค้า': return R * 0.5;
    case 'ตลาดแรงงานเสรี': return Math.min(8 - P.hired, R / 3) * 2;
    case 'กล้องส่องทางไกล': return M * 1.5;
    case 'ดาบปลายปืน': return M * 1.5;
    case 'ตั๋วแลกเงิน': return 1.5;
    case 'ประกันภัยทางทะเล': return 2;
    case 'พงศาวดาร': return LV(G) * 0.6 * Math.max(0, 3 - G.era);
    case 'เครื่องสูบน้ำ': return u * Pd * 0.8;
    case 'ระบบหมุนเวียนพืช': return foodP ? 2 * fv * Pd : 1;
    case 'คลองขุด': return Pd * 0.3;
    case 'สถานีรถไฟ': return 1.5 * Pd * 0.5;
    case 'โรงทอไหมมานา': return (10 - 3 * u + 1) * Pd * 0.6;
    case 'โรงงานยุทธภัณฑ์': return M * 3.5 * Math.min(4, R / 2);
    case 'โรงพยาบาลรัฐ': return Math.min(8 - P.hired, R / 2) * fv * 1.2;
    case 'ห้องปฏิบัติการวิจัย': return Pd * 1.5;
    case 'โรงจักรไอน้ำมานา': return (3 * u - xv) * Pd * 0.8;
    case 'พิพิธภัณฑ์แห่งชาติ': return cul >= 2 ? (5 - mv) * Pd * 0.8 : 1;
    case 'ป้อมบาเรียร์ริมน้ำ': return 3;
    case 'ข้าราชการสืบทอด': return R * 0.6;
    case 'ฟื้นฟูวัฒนธรรมชาติ': return R * 0.25;
    case 'มาตรฐานเกรฟฮาร์ธ': return Pd * 1.1;
    case 'สมาคมธนาคาร': return Math.min(3, Math.floor(P.grav / 5) + 1) * Pd * 0.8;
    case 'หม้อกลาง': return Pd * 0.6;
    case 'สื่อมวลชนเสรี': return Math.max(bp, 0.5) * Math.min(4, R / 2);
    case 'กองทัพมหาชน': return M * R * 0.3 + (v3(G) ? Math.min(3, kwCount(P, k => k.surge)) * 0.8 * Math.min(1, R / 4) : 0);
    case 'สถาบันวิศวกร': return R * 0.5 * u;
    case 'เครื่องจักรไอน้ำมานา': return u * Pd * P.projects.filter(p => Object.keys(p.d.inp).length).length * 0.9 + 1;
    case 'วอกโซโฟนทอดสัญญาณ': return v3(G) ? 4 : 2.5;
    case 'ลวดหนาม': return 2.5;
    case 'เรือกลไฟ': return Pd * 0.5;
    case 'ปุ๋ยเคมี': return Math.min(2, foodP) * fv * Pd;
    case 'ตลาดซื้อขายล่วงหน้า': return 3 * Pd * 0.5;
    case 'เพลงชาติ': return LV(G) * 0.4 * (G.rules.anthemLegit || 1);
    case 'โคมไฟกริดมานา': return u * 2 * Pd * 0.8;
    case 'ศูนย์กระจายสินค้า': return 2 * Pd * 0.5;
    case 'โรงงานเครื่องใช้เวทมนตร์': return (14 - 3 * u + 1) * Pd * 0.6;
    case 'ฐานเรือเหาะรบ': return M * 2.5;
    case 'หอกระจายเสียงวอกโซโฟน': return Math.max(bp, 0.6) * Math.min(4, R / 2) - xv * 2;
    case 'เคหะนอกกำแพงเดิม': return (K.assignedWorkers(P) - 2 * mv) * Pd * 0.8;
    case 'โรงแปรธาตุ': return (3 * mv - xv) * Pd * 0.7;
    case 'อนุสาวรีย์แห่งชาติ': return Math.max(pushValue(G, P, 'trad', 1), 0.5) * Math.min(4, R / 2) - mv * 2;
    case 'ศูนย์บัญชาการทหาร': return M * 2;
    case 'มรดกเกรสแลนด์': return 3 * Pd * 0.6;
    case 'ภาพยนตร์มานาแห่งชาติ': return Math.max(bp, 0.5) * 2;
    case 'การค้าเสรีทั่วเกรสแลนด์': return Pd * 0.8;
    case 'บรรษัทข้ามรัฐ': return Pd * 0.7;
    case 'รัฐสวัสดิการ': return Math.min(8 - P.hired, R / 2) * fv * 3;
    case 'สิทธิเลือกตั้งทั่วไป': return R * 0.25 * LV(G) * 0.5;
    case 'หลักนิยมการรบแยกเดี่ยวฆ่าหมู่': return v3(G) ? M * (1 + kwCount(P, k => k.int) * 0.6) : M * 3;
    case 'มหาวิทยาลัยวิจัย': return R * 1.0;
    case 'คอมพิวเตอร์มานา': return R * 0.6;
    case 'เลนส์ขยายอาคม': return v3(G) ? 3 : 2;
    case 'เครื่องยนต์มานาแรมเจ็ท': return M * (2 + (v3(G) ? kwCount(P, k => k.fuel) * 0.4 : 0));
    case 'พืชเสริมมานา': return Math.min(2, foodP) * 2 * fv * Pd;
    case 'ล็อตมาตรฐานกิลด์': return Pd * 0.3;
    case 'เงินกู้จำนองสัมปทาน': return 2;
    case 'เครื่องฉายภาพมานา': return Math.max(bp, 0.6) * Math.min(4, R);
    case 'เรือเหาะสำรวจ': return M * 3;
  }
  return 2;
}
function cardValue(G, P, d) {
  let v = cardBase(G, P, d);
  const kindMap = { culture: 'cultures', innovation: 'innovations', building: 'buildings' };
  v += metricDelta(G, P, kindMap[d.kind], 1);
  if (G.regime === 'เทคโนแครต') v += metricDelta(G, P, 'research', 1) * 0.5;
  v += metricDelta(G, P, 'armsSym', armsSyms(d.sym));
  v += symValue(G, P, d.sym);
  if (d.kind === 'culture') for (const s of d.sym) if (LINES.includes(s)) v += Math.max(0, pushValue(G, P, s, 1));
  if (d.kind === 'building' && !P.projects.some(p => K.slotsOf(P, p) > p.buildings.length)) v -= 4;
  // a permanent building only works on a full project: without a staffed project that has room, it waits for workers
  else if (P.pb && d.kind === 'building' && !P.projects.some(p => K.slotsOf(P, p) > p.buildings.length && K.staffed(P, p))) v -= 1.5;
  // supporters: an innovation of เดอะรีกูเลเตอร์ brings a military card (best of 2); a culture of ตระกูลควิลลัน one more push
  if (d.kind === 'innovation' && K.sup(P, 'regulator')) v += milNeed(G, P) * 1.6;
  if (d.kind === 'culture' && K.sup(P, 'quillan')) v += Math.max(0, bestPush(G, P, false).v);
  return v;
}
AI.cardValue = cardValue;
function researchNet(G, P, c) {
  const o = K.researchOption(G, P, c);
  if (!o.ok) return -1e9;
  let cv = costValue(G, P, o.cost);
  if (o.plan.borrow) cv += 2 + o.plan.borrow * 0.3;
  return cardValue(G, P, c.d) * sty(P).research - cv;
}

// ---------- needs / commerce ----------
// the projects P can build: the market, and for สภาการค้าและคลังแห่งซีเลสเทีย the top card of the project deck
function buildPool(G, P) { const top = K.deckTopFor(G, P); return top ? G.market.concat([top]) : G.market; }
function bestMarketTarget(G, P) {
  let best = null;
  for (const pr of buildPool(G, P)) {
    const g = projectGross(G, P, pr) * sty(P).build;
    const c = K.projectCost(G, P, pr.d, false);
    const cv = costValue(G, P, c);
    const net = g - cv;
    if (!best || net > best.net) best = { pr, net, c };
  }
  return best;
}
function sourcesFor(G, P, t) {
  const src = [];
  for (const S of G.players) if (S !== P) for (const pr of S.projects) {
    if (pr.d.out === t && pr.goods > 0 && pr.d.sale != null) src.push({ pid: S.id, puid: pr.uid, price: K.salePrice(G, S, pr), n: pr.goods, S });
  }
  src.sort((a, b) => a.price - b.price);
  return src;
}
function bonusEV(G, P) {
  // expected value of one bonus card (deck composition from the rulebook)
  const u = uv(G), g = gw(G, P), L = LV(G);
  const hw = Math.max(0, hireWorth(G, P));
  return (6 * 2 * u + 5 * 3 * g + 4 * 2 * u * 0.5 + 4 * 1.5 + 3 * 2.5 * milNeed(G, P) + 3 * L + 3 * (P.stigma > 0 ? L : 2 * g) + 2 * hw) / 30;
}
AI.bonusEV = bonusEV;
function planCommerce(G, P) {
  const cap = K.capacity(G, P, true);
  const g = gw(G, P);
  const plan = { sells: { mat: 0, fuel: 0, food: 0 }, buys: [], central: { mat: 0, fuel: 0, food: 0 } };
  let value = 0;
  let grav = P.grav;
  const tgt = bestMarketTarget(G, P);
  const want = { mat: 0, fuel: 0, food: 0 };
  const useTgt = tgt && tgt.net > 3;
  if (useTgt) for (const t of GOODS) want[t] = Math.max(0, (tgt.c[t] || 0) - K.goodsOf(P, t));
  // worker food
  const hc = K.hireCost(G, P);
  if (hc != null && hc > 0 && hireWorth(G, P) > hc * uv(G)) want.food = Math.max(want.food, hc + (useTgt ? (tgt.c.food || 0) : 0) - K.goodsOf(P, 'food'));
  // supply food for a planned command
  if (P.hand.includes('military') && K.goodsOf(P, 'food') < 1) want.food = Math.max(want.food, 1);
  // input fuel for next production + fuel for army fuel cards
  let inpNeed = 0; for (const pr of P.projects) if (pr.d.inp.fuel) inpNeed += pr.d.inp.fuel;
  const fuelCards = K.armyCards(P).filter(c => c.d.kw.fuel).length;
  inpNeed += Math.min(2, fuelCards);
  want.fuel = Math.max(want.fuel, inpNeed - K.goodsOf(P, 'fuel'));
  // sell what overflows or will overflow (projects cap at 6) and is not needed
  const sellP = K.marketSellPrice(G, P);
  for (const t of GOODS) {
    const keep = (useTgt ? (tgt.c[t] || 0) : 0) + (t === 'food' ? (hc || 0) + 1 : 2) + (t === 'fuel' ? inpNeed : 0);
    let ex = K.goodsOf(P, t) - keep;
    const nearCap = P.projects.filter(p => p.d.out === t && p.goods >= 5).length;
    if (ex > 0 && (nearCap || ex > 5 || G.round >= TR(G) - 1) && sellP * g >= typeVal(G, P, t) * 0.5) {
      plan.sells[t] = ex; grav += ex * sellP; value += ex * (sellP * g - typeVal(G, P, t) * 0.5);
    }
  }
  let used = 0; let spent = 0; const paid = {};
  const mp = K.marketBuyPrice(G, P);
  const reserve = useTgt ? (tgt.c.grav || 0) : 0;
  const bought = { mat: 0, fuel: 0, food: 0 };
  const take = (t, src, n) => {
    plan.buys.push({ pid: src.pid, puid: src.puid, n });
    src.n -= n; used += n; spent += n * src.price; paid[src.pid] = (paid[src.pid] || 0) + n * src.price; bought[t] += n;
  };
  const srcs = {}; for (const t of GOODS) srcs[t] = sourcesFor(G, P, t);
  for (const t of GOODS) {
    let need = want[t];
    for (const s of srcs[t]) {
      if (need <= 0 || used >= cap) break;
      if (s.price > mp) break;
      const n = Math.min(need, s.n, cap - used, Math.floor((grav - spent - reserve) / s.price));
      if (n <= 0) continue;
      take(t, s, n); need -= n;
    }
    if (need > 0 && used < cap) {
      const n = Math.min(need, cap - used, Math.floor((grav - spent - reserve) / mp));
      if (n > 0) { plan.central[t] += n; used += n; spent += n * mp; need -= n; bought[t] += n; }
    }
  }
  // high-value trade: top up purchases from one state to reach the threshold (bonus for both sides)
  const th = K.hvThreshold(G, P);
  if (!P.tradeBonus && used < cap) {
    const bev = bonusEV(G, P);
    let best = null;
    for (const S of G.players) {
      if (S === P) continue;
      let p0 = paid[S.id] || 0; if (p0 >= th) { best = null; break; }
      const units = [];
      for (const t of GOODS) for (const s of srcs[t]) if (s.pid === S.id) for (let k = 0; k < s.n; k++) units.push({ t, s, price: s.price, v: typeVal(G, P, t) * (1 - 0.08 * (K.goodsOf(P, t) + bought[t])) });
      units.sort((a, b) => (b.v - b.price * g) - (a.v - a.price * g));
      let room = cap - used, cost = 0, gain = 0, pay = p0; const picks = [];
      for (const u of units) { if (pay >= th || room <= 0) break; if (grav - spent - reserve - cost < u.price) continue; picks.push(u); pay += u.price; cost += u.price; gain += u.v; room--; }
      if (pay < th) continue;
      const net = gain - cost * g + bev - (S.tradeBonus ? 0 : bev * 0.3);
      if (net > 0 && (!best || net > best.net)) best = { net, picks };
    }
    if (best) {
      for (const u of best.picks) { take(u.t, u.s, 1); }
      value += best.net;
    }
  }
  // merge duplicate buy entries
  const merged = {};
  for (const b of plan.buys) { const k = b.pid + ':' + b.puid; if (merged[k]) merged[k].n += b.n; else merged[k] = Object.assign({}, b); }
  plan.buys = Object.values(merged);
  // value
  if (useTgt) {
    let ok = true;
    for (const t of GOODS) if (K.goodsOf(P, t) - plan.sells[t] + bought[t] < (tgt.c[t] || 0)) ok = false;
    if (ok && grav - spent >= (tgt.c.grav || 0)) value += tgt.net * 0.55;
  }
  if (want.food > 0 && bought.food > 0) value += 1.5;
  if (want.fuel > 0 && bought.fuel > 0) value += Math.min(want.fuel, bought.fuel) * 1.2;
  value -= spent * 0.15 * g;
  if (!used && !Object.values(plan.sells).some(x => x)) value = 0.2;
  return { plan, value };
}
AI.planCommerce = planCommerce;

// ---------- military ----------
const oddsCache = new Map();
let oddsGame = null;
function odds(G, P, defSpec, size, type, N) {
  if (oddsGame !== G) { oddsCache.clear(); oddsGame = G; }
  const key = [G.round, G.lap, P.id, defSpec.neutral ? 'n' : defSpec.P.id, size, type, P.army.deck.length, P.army.disc.length,
    defSpec.P ? defSpec.P.army.deck.length + ':' + defSpec.P.army.disc.length : G.era, K.goodsOf(P, 'fuel'), P.mods.length, defSpec.top ? defSpec.top.map(c => c.uid).join(',') : '', defSpec.pr ? defSpec.pr.uid : ''].join('|');
  if (oddsCache.has(key)) return oddsCache.get(key);
  const p = K.simOdds(G, P, defSpec, size, type, N || 120);
  if (oddsCache.size > 5000) oddsCache.clear();
  oddsCache.set(key, p);
  return p;
}
AI.odds = odds;
// advice for a person (the tutorial, the AI helper of a solo game, the developer's audit) runs on a random stream of its
// own and must leave nothing behind in the game (ruled 15 Nov): the odds it works out stay out of the cache the game's
// own AI decisions read, so a game reads the same whether its player asked for advice or not
AI.aside = function (fn) {
  const saved = new Map(oddsCache), game = oddsGame;
  try { return fn(); } finally { oddsCache.clear(); for (const [k, v] of saved) oddsCache.set(k, v); oddsGame = game; }
};
function exploreValue(G, P) {
  const deck = G.projectDecks[G.era];
  if (!deck.length) return { v: -1e9 };
  const supply = K.freeSupply(G, P) ? 0 : typeVal(G, P, 'food');
  if (supply && K.goodsOf(P, 'food') < 1) return { v: -1e9 };
  // sample distinct cards (public composition: remaining deck contents)
  // partial Fisher-Yates: a random comparator in Array.sort is implementation-defined and broke replays
  const pool = deck.slice(), kS = Math.min(6, pool.length);
  for (let i = 0; i < kS; i++) { const j = i + Math.floor(G.aiR() * (pool.length - i)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const sample = pool.slice(0, kS);
  // หน่วยพิทักษ์พงไพร: the first lost exploration of an era takes no stigma
  const freeLoss = K.sup(P, 'wildwardens') && (P.supUsed || {}).ward !== G.era;
  let tot = 0;
  for (const c of sample) {
    const p = odds(G, P, { neutral: true }, c.d.mil, 'explore', 100);
    const half = K.exploreGain(G, c.d);
    let reward = half * (c.d.out === 'grav' ? 1 : typeVal(G, P, c.d.out));
    const an = projectNet(G, P, c, true);
    if (an.v > 0) reward += an.v * 0.85 + 3; // annexing also saves a trade action
    if (G.regime === 'ระบอบขุนศึก') reward += LV(G);
    if (G.rules.natExploreLegit && G.regime === 'ชาตินิยม') reward += LV(G);
    if (K.has(P, 'หมุดเงิน')) reward += 4;
    if (K.sup(P, 'windclans')) reward += 2 * typeVal(G, P, 'food');
    tot += p * reward - (1 - p) * (freeLoss ? 0 : LV(G));
  }
  let v = tot / sample.length;
  if (K.has(P, 'เรือเหาะสำรวจ')) v += 3;
  return { v: (v - supply) * (0.6 + 0.4 * sty(P).mil), cmd: { t: 'explore' } };
}
function attackValue(G, P) {
  let best = { v: -1e9 };
  const supply = K.freeSupply(G, P) ? 0 : typeVal(G, P, 'food');
  for (const o of K.commandOptions(G, P)) {
    if (o.disabled || o.value.t !== 'attack' || o.loot <= 0) continue;
    const p = odds(G, P, P.pb ? { P: o.S, pr: o.pr } : { P: o.S }, o.pr.d.mil, 'attack', 80);
    const lootV = o.loot * (o.pr.d.out === 'grav' ? 1 : typeVal(G, P, o.pr.d.out)) * 1.3 + (K.has(P, 'ดาบปลายปืน') ? typeVal(G, P, o.pr.d.out) : 0);
    let win = lootV + (G.regime === 'ระบอบขุนศึก' ? LV(G) : 0) + (G.rules.juntaRaidLegit && G.regime === 'รัฐบาลทหาร' ? LV(G) : 0) - (G.regime === 'ประชาธิปไตยสังคม' ? LV(G) : 0);
    // weaken leader bonus (and the bounty rule when the dataset uses it)
    const lead = K.finalScores(G)[0].P;
    if (o.S === lead && lead !== P) win += 2;
    if (G.rules && G.rules.leaderBounty && K.isLeader(G, o.S) && !K.isLeader(G, P)) win += G.rules.leaderBounty * LV(G);
    const crusade = K.sup(P, 'godhand') && o.S.stigma > P.stigma;
    if (crusade && (P.supUsed || {}).godhand !== G.era) win += LV(G);
    if (K.sup(o.S, 'crimson')) win -= LV(G);
    const v = (p * win - (1 - p) * (crusade ? 0 : LV(G)) - supply) * sty(P).aggr;
    if (v > best.v) best = { v, cmd: o.value, p };
  }
  return best;
}
function coupValue(G, P) {
  if (P.coupDone || G.regimeSetRound === G.round) return { v: -1e9 };
  const supply = K.freeSupply(G, P) ? 0 : typeVal(G, P, 'food');
  if (supply && K.goodsOf(P, 'food') < 1) return { v: -1e9 };
  // regimes that keep getting overthrown do not last: damp the horizon by the coups seen so far
  const instab = G.stats.coupWins / Math.max(1, G.round - 1);
  const k = 1 + (Math.max(1, kEff(G, true)) - 1) / (1 + 3 * instab);
  const cur = regimeValue(G, P, G.regime, k);
  let bestReg = null, bestV = -1e9;
  for (const r of K.data().regimes) if (r.set === G.regimeSet && r.name !== G.regime) {
    const v = regimeValue(G, P, r.name, k);
    if (v > bestV) { bestV = v; bestReg = r.name; }
  }
  // a new regime can be flipped or couped again: discount the gain
  const gain = (bestV - cur) * 0.8;
  if (gain <= LV(G) * 1.5) return { v: -1e9 };
  const def = K.coupDefender(G, P);
  let p = odds(G, P, def ? { P: def } : { neutral: true }, G.era + 2, 'coup', 120);
  let failCost = 2 * LV(G);
  const lunar = G.players.find(Q => Q !== P && K.sup(Q, 'lunar'));
  if (lunar) {
    // the church's holder defends when that is worse for the plotter, and a failure then costs one more stigma
    const pL = lunar === def ? p : odds(G, P, { P: lunar }, G.era + 2, 'coup', 120);
    if (pL <= p) { p = pL; failCost = 3 * LV(G); }
  }
  if (p < (AI.coupMinP || 0.5)) return { v: -1e9 };
  const v = (p * (gain - (K.sup(P, 'fozarken') ? 0 : LV(G))) - (1 - p) * failCost - supply) * sty(P).aggr;
  return { v, cmd: { t: 'coup' }, p, reg: bestReg };
}
function reformValue(G, P) {
  const deck = G.reformDecks[G.era];
  const k = P.pb ? K.reformDraws(G, P) : 3 + (K.has(P, 'กองทัพมหาชน') ? 1 : 0) + (G.regime === 'รัฐบาลทหาร' ? 1 : 0);
  const avg = armyAvg(P);
  let exp = 0;
  if (deck.length) {
    for (let s = 0; s < 12; s++) {
      let m = 0; for (let i = 0; i < k; i++) m = Math.max(m, deck[Math.floor(G.aiR() * deck.length)].d.mv);
      exp += m;
    }
    exp /= 12;
  }
  const M = milNeed(G, P);
  let v = deck.length ? Math.max(0, exp - avg) * 1.8 * M : 0;
  // rules 0.4: the cull comes only from the discard pile (cards that fought since the last diplomacy);
  // rules 0.4.1: the army deck and the discard pile (the first draft looked through the army deck only)
  const removable = (G.rules && G.rules.reformDiscOnly ? P.army.disc : G.rules && G.rules.deckReform && !G.rules.reformMerge ? P.army.deck : K.armyCards(P)).filter(c => !c.d.kw.keep);
  const weakest = removable.reduce((m, c) => Math.min(m, c.d.mv), 99);
  const armyMetric = G.regime === 'ระบอบขุนศึก';
  if (!armyMetric && weakest < avg) v += (avg - weakest) * 1.2 * M;
  if (P.pb) {
    if (deck.length && K.bldOn(P, 'โรงหล่อปืนใหญ่มานา')) v += K.bldOn(P, 'โรงหล่อปืนใหญ่มานา') * 1.2 * M;   // a second card kept
    if (!armyMetric && K.bldOn(P, 'โรงงานยุทธภัณฑ์') && removable.length > 1) {
      const second = removable.map(c => c.d.mv).sort((a, b) => a - b)[1];
      if (second < avg) v += (avg - second) * 1.2 * M;
    }
  }
  if (K.roseFirst(G, P) && !armyMetric) {
    const x = removable.map(c => c.d.mv).sort((a, b) => a - b)[1 + (P.pb ? K.bldOn(P, 'โรงงานยุทธภัณฑ์') : 0)];
    if (x != null && x < avg) v += (avg - x) * 1.2 * M;
  }
  v += metricDelta(G, P, 'army', deck.length ? 1 : 0);
  if (G.regime === 'รัฐบาลทหาร' && G.era >= 2) v += metricDelta(G, P, 'army3', 1);
  return v;
}
function researchActionValue(G, P) {
  const deck = G.researchDecks[G.era];
  const k = K.researchDraws(G, P);
  const none = K.has(P, 'ปฏิทินสิบสามห้วง') ? 4 : 2;
  const nv0 = none * gw(G, P);
  const nv = K.sup(P, 'curators') && P.supStash ? Math.max(nv0, researchNet(G, P, P.supStash)) : nv0;
  if (!deck.length) return nv;
  const vals = deck.map(c => Math.max(nv, researchNet(G, P, c)));
  let exp = 0;
  for (let s = 0; s < 16; s++) { let m = nv; for (let i = 0; i < k; i++) m = Math.max(m, vals[Math.floor(G.aiR() * vals.length)]); exp += m; }
  return exp / 16;
}

// ---------- activations ----------
function actValue(G, P, b, pr) {
  const a = K.ACT[b.d.name];
  const c = a.cost;
  let cost = (c.grav || 0) * gw(G, P);
  for (const t of GOODS) cost += (c[t] || 0) * typeVal(G, P, t);
  if (c.any) cost += c.any * uv(G) * 0.8 * resF(G);
  const M = milNeed(G, P), u = uv(G);
  let g = 0;
  switch (b.d.name) {
    case 'โรงสี': g = 4 * gw(G, P); break;
    case 'โรงทอผ้าด้วยกี่': g = 6 * gw(G, P); break;
    case 'โรงทอไหมมานา': g = 10 * gw(G, P); break;
    case 'โรงงานเครื่องใช้เวทมนตร์': g = 14 * gw(G, P); break;
    case 'ท่าเทียบเรือ': g = K.eraD(G).buy * gw(G, P); break;
    case 'เคหะนอกกำแพงเดิม': g = K.assignedWorkers(P) * gw(G, P); break;
    case 'พิพิธภัณฑ์แห่งชาติ': g = K.cultures(P) >= 3 ? 5 * gw(G, P) : 0; break;
    case 'โรงแปรธาตุ': g = 3 * typeVal(G, P, 'mat'); break;
    case 'กังหันน้ำ': g = pr.d.out === 'grav' ? 1 : Math.min(1, 6 - pr.goods) * typeVal(G, P, pr.d.out); break;
    case 'ห้องทดลองเคมี': g = pr.d.out === 'grav' ? 2 : Math.min(2, 6 - pr.goods) * typeVal(G, P, pr.d.out); break;
    case 'โรงจักรไอน้ำมานา': g = pr.d.out === 'grav' ? 3 : Math.min(3, 6 - pr.goods) * typeVal(G, P, pr.d.out); break;
    case 'ยุ้งฉาง': case 'คลังสินค้าท่าเรือ': {
      const n = Math.min(b.d.name === 'ยุ้งฉาง' ? 2 : 3, pr.goods);
      g = (K.whTotal(P) + n <= K.whCap(P)) ? n * 0.35 * (1 + G.players.filter(q => q !== P && q.hand.includes('military')).length * 0.2) : -5;
      break;
    }
    case 'โบสถ์ประจำเมือง': case 'อนุสาวรีย์แห่งชาติ': g = pushValue(G, P, 'trad', 1); break;
    case 'ศาลาประชาคม': g = pushValue(G, P, 'ppl', 1); break;
    case 'แท่นพิมพ์เวทมนตร์': case 'หอกระจายเสียงวอกโซโฟน': g = bestPush(G, P, false).v; break;
    case 'โรงรับจำนำ': g = uv(G) * 1.1; break;
    case 'ค่ายฝึกทหาร': case 'ศูนย์บัญชาการทหาร': {
      const dAvg = P.army.disc.length ? P.army.disc.reduce((s, x) => s + x.d.mv, 0) / P.army.disc.length : 0;
      const kAvg = P.army.deck.length ? P.army.deck.reduce((s, x) => s + x.d.mv, 0) / P.army.deck.length : 0;
      g = P.hand.includes('military') ? Math.max(0, dAvg - kAvg) * 2 * M : 0; break;
    }
    case 'โรงตีเหล็ก': case 'โรงหล่อปืนใหญ่มานา': case 'โรงงานยุทธภัณฑ์': g = reformValue(G, P) * 0.8 + (b.d.name === 'โรงงานยุทธภัณฑ์' ? 1 : 0); break;
    case 'โรงประจุกระสุนมานา': case 'ฐานเรือเหาะรบ': {
      const x = b.d.name === 'ฐานเรือเหาะรบ' ? 3 : 1;
      const plan = P._aiPlanned;
      g = (P.hand.includes('military') && plan && plan.mode === 'command') ? x * 3 : 0; break;
    }
    case 'ปราสาทตระกูล': case 'ป้อมบาเรียร์ริมน้ำ': g = 0; break;
    case 'สถานีรถไฟ': case 'ศูนย์กระจายสินค้า': g = 0; break;
    case 'โรงพยาบาลรัฐ': { const hc = K.hireCost(G, P); g = hc != null && hc > 2 && hireWorth(G, P) > 0 ? hc * typeVal(G, P, 'food') + hireWorth(G, P) * 0.3 : 0; break; }
    case 'ห้องปฏิบัติการวิจัย': g = researchActionValue(G, P) * 0.6; break;
  }
  return g - cost;
}

function hireWorth(G, P) {
  if (P.hired >= 8) return -1;
  const W = K.totalWorkers(P);
  const a = prodValue(G, P, P.projects, W, false).best;
  const b = prodValue(G, P, P.projects, W + 1, false).best;
  let v = (b - a) * disc(PR(G)) * 0.9;
  v += metricDelta(G, P, 'workers', 1);
  if (K.has(P, 'หม้อกลาง')) v += 2;
  if (K.has(P, 'เคหะนอกกำแพงเดิม')) v += 3;
  if (G.market.some(pr => pr.d.workers > 0) && b - a < 0.1) v += 2 * Math.min(1, PR(G) / 4); // future project
  return v;
}

// ---------- turn decision ----------
function chooseTurn(G, P, opts) {
  // 1) activations
  let bestAct = null, bav = 0.3;
  for (const a of opts.acts) {
    const x = K.buildingsOf(P).find(({ b }) => b.uid === a.uid);
    if (!x) continue;
    const v = actValue(G, P, x.b, x.p);
    if (v > bav) { bav = v; bestAct = a; }
  }
  if (bestAct) return { type: 'activate', uid: bestAct.uid };
  // 2) actions
  const s = sty(P);
  const cand = [];
  const amp = lvl(P).noise;
  const noise = amp ? () => 1 + (G.aiR() - 0.5) * amp : () => 1;
  for (const pl of opts.plays) {
    if (!pl.ok) continue;
    let v = -1e9, extra = null;
    if (pl.mode === 'build') {
      let best = null;
      for (const pr of buildPool(G, P)) { const n = projectNet(G, P, pr, false); if (!best || n.v > best.v) best = { v: n.v, uid: pr.uid }; }
      if (best) { v = best.v; extra = { uid: best.uid }; }
    } else if (pl.mode === 'commerce') { const c = planCommerce(G, P); v = c.value * s.commerce; extra = { plan: c.plan }; }
    else if (pl.mode === 'command') {
      const opts2 = [exploreValue(G, P), attackValue(G, P), coupValue(G, P)];
      const b = opts2.reduce((m, x) => x.v > m.v ? x : m, { v: -1e9 });
      v = b.v; extra = { cmd: b.cmd, reg: b.reg };
    } else if (pl.mode === 'reform') v = reformValue(G, P);
    else if (pl.mode === 'research') v = researchActionValue(G, P);
    else if (pl.mode === 'diplomacy') v = -1e8; // decided below
    cand.push({ pl, v: v * noise(), extra });
  }
  const nonDip = cand.filter(c => c.pl.mode !== 'diplomacy').sort((a, b) => b.v - a.v);
  const dip = cand.find(c => c.pl.mode === 'diplomacy');
  let choice = nonDip[0];
  if (dip) {
    const others = G.players.filter(q => q !== P && !q.diploPlayed).length;
    const lapsLeft = Math.max(0, 4 - (G.lap || 1));
    let replay = 0;
    if (P.played.length && others > 0 && lapsLeft > 0) {
      for (const card of P.played) {
        if (card === 'trade') { let best = -1e9; for (const pr of buildPool(G, P)) best = Math.max(best, projectNet(G, P, pr, false).v); replay = Math.max(replay, best, planCommerce(G, P).value); }
        if (card === 'research') replay = Math.max(replay, researchActionValue(G, P));
        if (card === 'military') replay = Math.max(replay, reformValue(G, P), exploreValue(G, P).v);
      }
    }
    const push = bestPush(G, P, false).v;
    let dv = push + replay * 0.6 + (others === 0 && K.has(P, 'นาฬิกาน้ำ') ? 2 : 0) + 0.5;
    if (!choice || dv > choice.v || choice.v < 1.0) choice = { pl: dip.pl, v: dv };
  }
  if (!choice) choice = cand[0];
  const slip = lvl(P).slip;
  if (slip && G.aiR() < slip) { const c = cand[Math.floor(G.aiR() * cand.length)]; if (c) choice = c.pl.mode === 'diplomacy' ? { pl: c.pl, v: 0 } : c; }
  P._aiPlanned = { mode: choice.pl.mode, extra: choice.extra };
  return { type: 'play', card: choice.pl.card, mode: choice.pl.mode };
}

// ---------- workers ----------
function chooseWorkers(G, P) {
  const W = K.totalWorkers(P);
  // inputs: approximate affordability
  const r = prodValue(G, P, P.projects, W, true);
  const w = {};
  let lamp = null;
  r.items.forEach((it, i) => { if (r.pick.has(i)) { w[it.pr.uid] = i === r.lampIdx ? Math.max(0, it.pr.d.workers - 1) : it.pr.d.workers; if (i === r.lampIdx) lamp = it.pr.uid; } });
  // inputs check: drop input projects we can't pay
  let fuel = K.goodsOf(P, 'fuel');
  for (const pr of P.projects) if (w[pr.uid] && pr.d.inp.fuel) { if (fuel >= pr.d.inp.fuel) fuel -= pr.d.inp.fuel; else delete w[pr.uid]; }
  // leftover workers: put on remaining projects (even if capped) to keep production flowing
  let used = Object.values(w).reduce((s, n) => s + n, 0);
  for (const pr of P.projects.slice().sort((a, b) => projGain(G, P, b, false) - projGain(G, P, a, false))) {
    if (used >= W) break;
    if (w[pr.uid]) continue;
    if (Object.keys(pr.d.inp).length) continue;
    if (pr.d.workers <= W - used) { w[pr.uid] = pr.d.workers; used += pr.d.workers; }
  }
  return { w, lamp };
}
AI.chooseWorkers = chooseWorkers;

// ---------- decide ----------
function pickOpt(options, score) {
  let best = null, bv = -1e18;
  for (const o of options) { if (o.disabled) continue; const v = score(o); if (v > bv) { bv = v; best = o; } }
  return best;
}
function regimeChoiceValue(G, P, reg, why) {
  const k = why === 'coup' ? kEff(G, true) : 3;
  let v = regimeValue(G, P, reg.name, k);
  const base = reg.base; const mine = K.symCount(P, base); const most = Math.max(...G.players.map(q => K.symCount(q, base)));
  if (mine === most && mine > 0) v += LV(G) * 0.5;
  if (reg.name === 'ระบอบขุนศึก' || reg.name === 'รัฐบาลทหาร') v += (sty(P).mil - 1) * 6;
  return v;
}

// a careless pick among the legal options (easy level only)
const SLIP_KINDS = new Set(['build', 'researchPick', 'milPick', 'exploreChoose', 'bonusPick', 'attach', 'regimeChoice', 'current', 'goodsType', 'supporterPick', 'supStash']);
AI.decide = function (G, P, req) {
  const slip = lvl(P).slip;
  if (slip && req.options && SLIP_KINDS.has(req.kind) && G.aiR() < slip * 0.5) {
    const ok = req.options.filter(o => !o.disabled);
    if (ok.length) return ok[Math.floor(G.aiR() * ok.length)].value;
  }
  return decideCore(G, P, req);
};
function decideCore(G, P, req) {
  switch (req.kind) {
    case 'turn': return chooseTurn(G, P, req.opts);
    case 'workers': return chooseWorkers(G, P);
    case 'build': {
      const pl = P._aiPlanned && P._aiPlanned.extra && P._aiPlanned.extra.uid;
      if (pl && req.options.some(o => o.value === pl && !o.disabled)) return pl;
      const b = pickOpt(req.options, o => projectNet(G, P, o.proj, false).v);
      return b ? b.value : null;
    }
    case 'commerce': {
      const pl = P._aiPlanned && P._aiPlanned.extra && P._aiPlanned.extra.plan;
      return pl || planCommerce(G, P).plan;
    }
    case 'command': {
      const c = P._aiPlanned && P._aiPlanned.extra && P._aiPlanned.extra.cmd;
      const okv = c && req.options.find(o => !o.disabled && JSON.stringify(o.value) === JSON.stringify(c));
      if (okv) return okv.value;
      const cands = [exploreValue(G, P), attackValue(G, P), coupValue(G, P)].filter(x => x.cmd).sort((a, b) => b.v - a.v);
      for (const x of cands) { const o = req.options.find(o => !o.disabled && JSON.stringify(o.value) === JSON.stringify(x.cmd)); if (o) return o.value; }
      const b = req.options.find(o => !o.disabled);
      return b ? b.value : null;
    }
    case 'milPick': {
      const fuelOk = K.goodsOf(P, 'fuel') + P.projects.filter(p => p.d.out === 'fuel').length * 2 >= 3;
      const b = pickOpt(req.options, o => o.card.d.mv - (o.card.d.kw.fuel && !fuelOk ? 1 : 0) + (G.regime === 'รัฐบาลทหาร' && !G.rules.juntaSym && o.card.d.era >= 2 ? 1 : 0) + (K.sup(P, 'sunflame') && o.card.d.era >= 2 ? 1 : 0) + milSynergy(G, P, o.card.d));
      return b.value;
    }
    case 'milRemove': {
      if (G.regime === 'ระบอบขุนศึก') return null;
      const avg = armyAvg(P);
      const b = pickOpt(req.options, o => -o.card.d.mv);
      if (b && b.card.d.mv < avg - 0.2) return b.value;
      return null;
    }
    case 'researchPick': {
      let best = null, bv = (req.none || 2) * gw(G, P);
      req.options.forEach(o => { if (o.disabled) return; const v = researchNet(G, P, o.card); if (v > bv) { bv = v; best = o; } });
      return best ? best.value : -1;
    }
    case 'attach': return chooseAttach(G, P, req);
    case 'current': {
      const mandatory = !req.allowNone;
      if (req.only) {
        // a building's push is limited to its own line, upward
        const o = req.options[0]; if (!o) return null;
        const v = pushValue(G, P, o.value.line, o.value.dir);
        return v > 0.05 || mandatory ? o.value : null;
      }
      const b = bestPush(G, P, mandatory);
      if (b.mv) return b.mv;
      if (mandatory) return req.options[0].value;
      return null;
    }
    case 'hire': return hireWorth(G, P) > (req.cost || 0) * typeVal(G, P, 'food');
    case 'regimeChoice': { const b = pickOpt(req.options, o => regimeChoiceValue(G, P, o.reg, req.why)); return b.value; }
    case 'flipTie': { const b = pickOpt(req.options, o => regimePts(G, P, o.reg.name)); return b.value; }
    case 'goodsType': {
      const tgt = bestMarketTarget(G, P);
      const b = pickOpt(req.options, o => (tgt ? Math.max(0, (tgt.c[o.value] || 0) - K.goodsOf(P, o.value)) * 3 : 0) + (o.value === 'food' ? 1 : 0) - K.goodsOf(P, o.value) * 0.3);
      return b.value;
    }
    case 'bonusPick': {
      const pri = { legit1: 9, stigma: P.stigma > 0 ? 8 : 2, goods2: 6, grav3: 5, worker: 5, mil2: 3 + sty(P).mil, projDisc: 3, current: 2 };
      const b = pickOpt(req.options, o => pri[req.cards[o.value].d.kind] || 0);
      return b.value;
    }
    case 'annex': return projectNet(G, P, req.proj, true).v > 0;
    case 'scoutDeck': return K.scoutDeckChoice(G, req.q);
    case 'scout': {
      const ans = K.scoutCardChoice(G, req.q, req.which);
      return ans ? { which: ans.which, idx: ans.idx } : null;
    }
    // rules 0.4.5: the lens may discard as well; a card weaker than what the deck would turn instead goes to the discard pile
    case 'lensDisc': {
      const cards = req.cards, k = cards.length;
      const dry = c => c.d.kw.fuel && K.goodsOf(P, 'fuel') < 1;
      const val = c => dry(c) ? 0 : (c.d.mvDef != null ? c.d.mvDef : c.d.mv != null ? c.d.mv : c.d.power);
      const rest = P.army.deck.slice(k);
      const avg = rest.length ? rest.reduce((a, c) => a + val(c), 0) / rest.length : -1;
      const keep = [], disc = [];
      cards.forEach((c, i) => (rest.length && val(c) < avg - 0.3 ? disc : keep).push(i));
      const sc = c => (c.d.kw.lead ? 5 : 0) + c.d.power + (dry(c) ? -c.d.power : 0);
      keep.sort((a, b) => sc(cards[b]) - sc(cards[a]) || a - b);
      return { order: keep, disc };
    }
    case 'voxPeek': return K.voxChoice(G, req.q);
    case 'massSurge': return K.massChoice(G, req.q);
    case 'lens': {
      // strongest first, leaders before the cards they boost
      const sc = c => (c.d.kw.lead ? 5 : 0) + c.d.power + (c.d.kw.fuel && K.goodsOf(P, 'fuel') < 1 ? -c.d.power : 0);
      const b = pickOpt(req.options, o => o.value.reduce((s, i, pos) => s + sc(req.cards[i]) * (3 - pos), 0));
      return b.value;
    }
    case 'spyglass': {
      const p = K.simOdds(G, P, { P: req.S, top: req.top }, req.pr.d.mil, 'attack', 80);
      return p >= 0.45;
    }
    case 'exploreChoose': {
      const b = pickOpt(req.options, o => {
        const c = o.proj; const p = odds(G, P, { neutral: true }, c.d.mil, 'explore', 80);
        const an = projectNet(G, P, c, true);
        return p * (K.exploreGain(G, c.d) * uv(G) + Math.max(0, an.v)) - (1 - p) * LV(G);
      });
      return b.value;
    }
    case 'cardBuy': {
      const tgt = bestMarketTarget(G, P);
      const b = pickOpt(req.options, o => (tgt ? Math.max(0, (tgt.c[o.t] || 0) - K.goodsOf(P, o.t)) * 2 : 0) + typeVal(G, P, o.t) - o.price);
      if (!b) return null;
      const gain = (tgt ? Math.max(0, (tgt.c[b.t] || 0) - K.goodsOf(P, b.t)) * 2 : 0) + typeVal(G, P, b.t) - b.price;
      return gain > 0 ? b.value : null;
    }
    case 'labResearch': return researchNet(G, P, req.card) > 0;
    case 'cmdScout': {
      const avg = armyAvg(P);
      const b = pickOpt(req.options, o => -P.army.deck[o.value].d.mv);
      if (b && P.army.deck[b.value].d.mv < avg) return b.value;
      return null;
    }
    // ---------- mode รัฐที่แตกแยก ----------
    case 'supporterPick': {
      if (AI.supRandom) return 0;   // simulations that measure each card: keep the first card drawn, a random one
      const b = pickOpt(req.options, o => supporterValue(G, P, o.card.d) + (G.aiR() - 0.5) * 3 * (1 + lvl(P).noise * 4));
      return b ? b.value : 0;
    }
    case 'supStash': {
      // keep the card worth most when it can be researched later; its cost is paid only then
      const b = pickOpt(req.options, o => cardValue(G, P, o.card.d) - costValue(G, P, o.cost || {}) * 0.6);
      return b ? b.value : null;
    }
    case 'supVolunteer': {
      // standing in costs nothing but troops that turn over; worth it when the church's army can hold
      const p = K.simOdds(G, req.plotter, { P }, G.era + 2, 'coup', 80);
      return p <= 0.65;
    }
    case 'supAscend': {
      // trade the weakest troop for the better of two new ones when the gap is worth the food (2, and 1 kept in store)
      const deck = G.reformDecks[G.era];
      const removable = K.armyCards(P).filter(c => !c.d.kw.keep);
      if (!deck.length || !removable.length || K.goodsOf(P, 'food') < K.ASCEND_FOOD + 1) return false;
      const weakest = removable.reduce((m, c) => Math.min(m, c.d.mv), 99);
      let exp = 0; for (let s = 0; s < 8; s++) exp += Math.max(deck[Math.floor(G.aiR() * deck.length)].d.mv, deck[Math.floor(G.aiR() * deck.length)].d.mv);
      return exp / 8 - weakest >= 2 + K.ASCEND_FOOD * typeVal(G, P, 'food') / 3;
    }
    case 'peek': return K.peekChoice(G, req.q);
    // ---------- rules 0.4.4: diplomacy may leave the discard pile out of the army deck ----------
    case 'dipShuffle': {
      // the troops that fought go back in unless the deck left is clearly stronger than them on average
      const deck = P.army.deck, disc = P.army.disc;
      if (!deck.length || !disc.length) return true;
      const avg = a => a.reduce((s, c) => s + c.d.mv, 0) / a.length;
      return avg(disc) >= avg(deck) - 0.3;
    }
  }
  if (req.options && req.options.length) { const o = req.options.find(x => !x.disabled); return o ? o.value : null; }
  return null;
}

// ---------- mode รัฐที่แตกแยก: how much a supporter card is worth to this AI before the game ----------
// base: 4 plus a third of how far the card's measured win rate sits from the fair share of 25% (1000 AI games of 4 states
// with random supporters, measured again after the second ruling of 11 Nov), so a card measured at 40% is worth 9 and one at
// 16% is worth 1; the styles lean to their cards
const SUP_BASE = { regulator: 7, ritter: 2.5, freemagic: 3, sunslayer: 5, windclans: 4.5, godhand: 4, curators: 4.5, bluecoats: 5, talan: 2.5, londo: 4.5, thorn: 3.5, quillan: 3, blackwood: 2.5, wildwardens: 4, cogs: 3, lunar: 5.5, fozarken: 3,
  stanter: 5, whiterose: 3, sunflame: 3, ascended: 6.5, biohazard: 2.5, cohen: 3, vendettia: 2.5, mercier: 3,
  argent: 4, corvus: 9.5, crimson: 3.5, brass: 4.5, celestia: 3.5 };
const SUP_STYLE = {
  warlord: { sunslayer: 3, godhand: 2, bluecoats: 2, windclans: 2, wildwardens: 2, fozarken: 2, whiterose: 2, sunflame: 2, cohen: 2, vendettia: 2, ascended: 1, lunar: 1 },
  merchant: { ritter: 3, mercier: 3, argent: 3, celestia: 2, cogs: 2, brass: 2, talan: 2 },
  builder: { londo: 3, blackwood: 3, thorn: 2, celestia: 2, wildwardens: 1, cogs: 1, quillan: 1 },
  scholar: { stanter: 3, curators: 3, freemagic: 2, regulator: 2, quillan: 2, blackwood: 1, ascended: 1 },
};
AI.SUP_BASE = SUP_BASE;
function supporterValue(G, P, d) { return (SUP_BASE[d.id] || 3) + ((SUP_STYLE[P.style] || {})[d.id] || 0); }
AI.supporterValue = supporterValue;

function chooseAttach(G, P, req) {
  const name = req.card.d.name;
  if (P.pb) {
    // rules 0.4: a building works only on a full project, so it goes where workers already stand, on the output it needs
    const probe = pr => bldStaffGain(G, P, Object.assign({}, pr, { buildings: [req.card] }));
    const pref = pr => {
      let s = K.staffed(P, pr) ? 4 : 0;
      s -= pr.d.workers * 0.6;
      s += probe(pr) * 2;
      if (name === 'ยุ้งฉาง') s += pr.d.out === 'grav' ? -10 : pr.d.outN;
      if (name === 'ปราสาทตระกูล') s += (pr.d.out === 'grav' ? 0 : pr.goods) + pr.d.outN * 0.5;
      return s;
    };
    const b = pickOpt(req.options, o => pref(o.pr) - (o.value.replace ? 6 + (o.rep ? probe(Object.assign({}, o.pr, { buildings: [o.rep] })) * 2 : 0) : 0));
    return b.value;
  }
  const cost = (K.ACT[name] || {}).cost || {};
  const pref = pr => {
    let s = 0;
    if (cost.food && pr.d.out === 'food') s += 5;
    if (cost.mat && pr.d.out === 'mat') s += 4;
    if (cost.fuel && pr.d.out === 'fuel') s += 4;
    if (cost.any && pr.d.out !== 'grav') s += 3 + pr.d.outN * 0.3;
    if (['กังหันน้ำ', 'ห้องทดลองเคมี', 'โรงจักรไอน้ำมานา'].includes(name)) s += (pr.d.out === 'grav' ? 1 : typeVal(G, P, pr.d.out)) * 2 + pr.d.workers;
    if (['ยุ้งฉาง', 'คลังสินค้าท่าเรือ'].includes(name)) s += pr.d.out === 'grav' ? -10 : pr.d.outN;
    return s;
  };
  const b = pickOpt(req.options, o => pref(o.pr) - (o.value.replace ? 6 + (o.rep ? 2 : 0) : 0));
  return b.value;
}

AI.describe = P => (STYLES[P.style] || STYLES.balanced).name + (P.level && P.level !== 'normal' && LEVELS[P.level] ? ' · ' + LEVELS[P.level].name : '');
})(typeof window !== 'undefined' ? window : globalThis);

const RULESETS = {
  // 0.4.7 as ruled on 12 Nov: a current flips the regime the moment a push takes it to the flip point, and the regime cards
  // of the designer's sheet (มานาเสรี lowers the high-value trade threshold, รัฐบาลทหาร counts arms symbols, rank 2 of era IV
  // with 3 states scores 3); projects push currents as in 0.4.6. The default rules
  '0.47d': { label: 'ฉบับ 0.4.7', data: () => window.KDATA047, rules: { dipChoice: true, projPush: true, instantFlip: true } },
  // mode รัฐที่แตกแยก on the 0.4.7 rules
  '0.47s': { label: 'ฉบับ 0.4.7 โหมดรัฐที่แตกแยก (ทดลอง)', data: () => window.KDATA047, rules: { supporters: true, dipChoice: true, projPush: true, instantFlip: true } },
  // 0.4.6 as ruled on 11 Nov: a project built with an ideology symbol pushes the current of that line, like a culture
  // card; the cards are those of 0.4.5. Built, never put on the web: 0.4.7 came before the upload
  '0.46d': { label: 'ฉบับ 0.4.6', data: () => window.KDATA045, rules: { dipChoice: true, projPush: true } },
  // mode รัฐที่แตกแยก on the 0.4.6 rules
  '0.46s': { label: 'ฉบับ 0.4.6 โหมดรัฐที่แตกแยก (ทดลอง)', data: () => window.KDATA045, rules: { supporters: true, dipChoice: true, projPush: true } },
  // 0.4.5 as ruled on 11 Nov: the designer's military table v3 in full (two reform cards and eight battle cards); the
  // default rules until 0.4.6 (games, rooms and hall of fame rows saved with it keep it)
  '0.45d': { label: 'ฉบับ 0.4.5', data: () => window.KDATA045, rules: { dipChoice: true } },
  // mode รัฐที่แตกแยก on the 0.4.5 cards
  '0.45s': { label: 'ฉบับ 0.4.5 โหมดรัฐที่แตกแยก (ทดลอง)', data: () => window.KDATA045, rules: { supporters: true, dipChoice: true } },
  // 0.4.4 as ruled in on 11 Nov: the designer's military table, a weaker blue cloak, legitimacy for battles, and diplomacy
  // that asks whether the discard pile goes back into the army deck; the default rules until 0.4.5 (games, rooms and hall of
  // fame rows saved with it keep it)
  '0.44d': { label: 'ฉบับ 0.4.4', data: () => window.KDATA044, rules: { dipChoice: true } },
  // mode รัฐที่แตกแยก (trial of 11 Nov): 0.4.4 with a supporter card for every state; open to every player as a mode to
  // try since 11 Nov
  '0.44s': { label: 'ฉบับ 0.4.4 โหมดรัฐที่แตกแยก (ทดลอง)', data: () => window.KDATA044, rules: { supporters: true, dipChoice: true } },
  // the 0.4.4 trial of 10 Nov (diplomacy always shuffled the discard pile back) stays readable for games saved and
  // reported with it, out of the menu
  '0.44': { label: 'ฉบับ 0.4.4 ช่วงทดลอง การทูตสับกองพักทุกครั้ง', data: () => window.KDATA044, rules: {}, hidden: true },
  // 0.4.3 as ruled on 10 Nov: the leader burden only at a scoring that leaves rank 1, 2 or 3 empty
  '0.43': { label: 'ฉบับ 0.4.3', data: () => window.KDATA043, rules: {} },
  // 0.4.2 as ruled on 9 Nov: the whole production as the explore reward, the annex still paid as in 0.4.1.
  // The key 0.42p dates from when this reading was the side variant; games saved under it keep the same rules
  '0.42p': { label: 'ฉบับ 0.4.2 ภาระผู้นำทุกการนับ', data: () => window.KDATA042, rules: {} },
  // the first draft of 0.4.2 (annex free of the card cost) stays readable for games saved with it, out of the menu
  '0.42': { label: 'ฉบับ 0.4.2 ร่างแรก ผนวกโดยไม่จ่ายต้นทุนการ์ด', data: () => window.KDATA042, rules: { annexFree: true }, hidden: true },
  '0.41m': { label: 'ฉบับ 0.4.1 บุกเบิกได้ครึ่งผลผลิต ผนวกต้องจ่าย', data: () => window.KDATA041, rules: {} },
  // the first draft of 0.4.1 (cull from the army deck only) stays readable for games saved with it, out of the menu
  '0.41': { label: 'ฉบับ 0.4.1 ร่างแรก คัดเฉพาะกองทหาร', data: () => window.KDATA041, rules: { reformMerge: false }, hidden: true },
  '0.4': { label: 'ฉบับ 0.4 ปฏิรูปทิ้งเฉพาะกองพัก', data: () => window.KDATA04, rules: {} },
  '0.4r': { label: 'ฉบับ 0.4 ปฏิรูปตรวจพล 3 ใบลงกองพักก่อนคัดทิ้ง', data: () => window.KDATA04, rules: { reformReview: 3 } },
  '0.3': { label: 'ฉบับ 0.3', data: () => window.KDATA03, rules: {} },
  '0.3t5': { label: 'ฉบับ 0.3 จุดเปลี่ยนกระแส 5 (4 คน) / 4 (3 คน)', data: () => window.KDATA03, rules: { tip4: 5, tip3: 4 } },
  '0.2': { label: 'ฉบับ 0.2', data: () => window.KDATA02 || window.KDATA, rules: {} },
};hofEngine_.m = { K: window.K, AI: window.K.AI, RULESETS: RULESETS, stamp: ENGINE_STAMP };
return hofEngine_.m;
}
