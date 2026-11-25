import { useState, useEffect, useMemo } from "react";

/* ============ DATA ============ */
const STEPS = [
  { n: "Pengguna", s: "Mengisi data di aplikasi", ic: "person", what: "Kamu mendaftar dan mengisi nama, nomor HP, NIK, dan lokasi demi bonus pendaftaran.", stop: "Isi data seperlunya saja dan tolak izin yang tidak berkaitan dengan fungsi aplikasi.", hit: "Datamu mulai tersimpan di banyak server yang tidak bisa kamu pantau." },
  { n: "Aplikasi", s: "Keamanan lemah", ic: "smartphone", what: "Aplikasi menyimpan sandi dengan enkripsi lemah dan tidak mewajibkan verifikasi dua langkah.", stop: "Pakai sandi unik dan aktifkan verifikasi dua langkah di setiap akun.", hit: "Satu celah kecil sudah cukup untuk membuka pintu ke seluruh datamu." },
  { n: "Peretas", s: "Mencuri database", ic: "terminal", what: "Peretas menembus server lalu mengunduh jutaan baris data pengguna sekaligus.", stop: "Sandi unik membuat data yang bocor tidak bisa dipakai membuka akunmu yang lain.", hit: "Email, nomor HP, dan sandimu sudah berpindah tangan." },
  { n: "Pasar gelap", s: "Data dijual", ic: "sell", what: "Database dilelang di forum gelap dan dibeli banyak pelaku kejahatan sekaligus.", stop: "Makin sedikit data yang kamu bagikan, makin sedikit yang bisa dijual.", hit: "Nomor dan identitasmu beredar dan mulai dipakai untuk menarget dirimu." },
  { n: "Penipu", s: "Menyalahgunakan data", ic: "theater_comedy", what: "Penipu menghubungimu dengan menyebut nama dan datamu supaya terdengar meyakinkan.", stop: "Jangan berikan OTP, dan selalu verifikasi lewat kanal resmi.", hit: "Penipuan, pinjol atas namamu, dan data pribadi yang disebar." },
];

const COMMON = ["123456", "12345678", "123456789", "password", "qwerty", "admin", "abc123", "111111", "sandi", "indonesia", "password123", "123123"];
const WORDS = ["kopi", "sawah", "bintang", "laut", "senja", "gunung", "hujan", "angin", "pelangi", "batik", "rawon", "komodo"];
const CK = ["Minimal 12 karakter", "Huruf besar dan kecil", "Mengandung angka", "Mengandung simbol", "Bukan sandi yang umum dipakai"];
const LV = [[28, "Sangat lemah", "#c5203e"], [36, "Lemah", "#e0701b"], [60, "Cukup", "#d9a400"], [80, "Kuat", "#3aa56f"], [1e9, "Sangat kuat", "#0f7a5a"]];

const KASUS = [
  { ch: "WhatsApp", from: "+62 812-9xxx-xx21", msg: "SELAMAT! Nomormu terpilih menang undian Rp50.000.000. Klaim sekarang di bit.ly/hadiah-2026 sebelum hangus hari ini!", scam: true, why: "Kamu tidak pernah ikut undian, tautannya dipendekkan, dan ada tekanan waktu.", fl: ["Hadiah mendadak", "Tautan pendek", "Dikejar waktu"] },
  { ch: "SMS", from: "BANK-INFO", msg: "Kode OTP 482913 untuk login. Jangan berikan kode ini kepada siapa pun, termasuk pihak bank.", scam: false, why: "Aman jika kamu sendiri yang sedang login. Pesan ini tidak meminta apa pun darimu, dan kodenya tetap tidak boleh dibagikan.", fl: ["Tanpa tautan", "Tidak meminta tindakan"] },
  { ch: "WhatsApp", from: "Kurir Ekspedisi", msg: "Paketmu gagal dikirim karena alamat kurang jelas. Pasang aplikasi resi-kurir.apk untuk jadwalkan ulang.", scam: true, why: "Kurir resmi tidak meminta kamu memasang file .apk dari chat. File itu bisa menyadap SMS dan OTP-mu.", fl: ["File .apk dari chat", "Nomor tak dikenal", "Minta pasang aplikasi"] },
  { ch: "Notifikasi", from: "Aplikasi bank resmi", msg: "Transaksi Rp25.000 di Kantin Kampus berhasil. Bukan kamu? Hubungi nomor di belakang kartumu.", scam: false, why: "Pesan ini hanya memberi informasi dan mengarahkan ke kanal resmi di kartu, bukan ke tautan di pesan.", fl: ["Hanya informasi", "Rujuk kanal resmi"] },
  { ch: "WhatsApp", from: "Rina (nomor baru)", msg: "Hai, ini nomor baruku ya, HP lama hilang. Bisa tolong transfer Rp750rb dulu? Nanti kuganti, urgent banget, makasih ya", scam: true, why: "Ini modus meniru teman. Telepon nomor lama atau tanyakan hal yang hanya temanmu tahu sebelum transfer.", fl: ["Nomor baru mendadak", "Minta uang", "Mendesak"] },
];

const KEB = [
  { t: "Verifikasi dua langkah aktif", w: 25, tip: "Walau sandi bocor, pelaku masih butuh kode kedua." },
  { t: "Sandi unik di setiap akun", w: 25, tip: "Satu kebocoran tidak membuka akun lainnya." },
  { t: "Lokasi real-time dimatikan di postingan", w: 15, tip: "Orang asing tidak bisa melacak rutinitas dan rumahmu." },
  { t: "Izin aplikasi ditinjau berkala", w: 15, tip: "Cabut akses kamera, kontak, dan lokasi yang tidak perlu." },
  { t: "Akun media sosial dikunci", w: 10, tip: "Hanya orang yang kamu setujui yang bisa melihat unggahanmu." },
  { t: "Riwayat pencarian dihapus berkala", w: 10, tip: "Profil perilakumu lebih sulit dipakai untuk menarget iklan dan penipuan." },
];

const TABS = [["alur", "Perjalanan data"], ["sandi", "Uji sandi"], ["kuis", "Tebak penipuan"], ["audit", "Audit privasi"]];

/* ============ LOGIKA ============ */
function analisa(p) {
  if (!p) return { bits: 0, ok: [0, 0, 0, 0, 0] };
  const lo = /[a-z]/.test(p), up = /[A-Z]/.test(p), dg = /\d/.test(p), sy = /[^A-Za-z0-9]/.test(p);
  const pool = (lo ? 26 : 0) + (up ? 26 : 0) + (dg ? 10 : 0) + (sy ? 32 : 0);
  const com = COMMON.includes(p.toLowerCase());
  let bits = p.length * Math.log2(pool);
  if (/(.)\1{2,}/.test(p)) bits *= 0.7;
  if (com) bits = Math.min(bits, 12);
  return { bits, ok: [p.length >= 12, lo && up, dg, sy, !com] };
}

const fmt = (s) => {
  if (s < 1) return "seketika";
  if (s < 60) return Math.round(s) + " detik";
  if (s < 3600) return Math.round(s / 60) + " menit";
  if (s < 86400) return Math.round(s / 3600) + " jam";
  const y = s / 31536000;
  if (y < 1) return Math.round(s / 86400) + " hari";
  if (y < 1e3) return Math.round(y) + " tahun";
  if (y < 1e6) return Math.round(y / 1e3) + " ribu tahun";
  if (y < 1e9) return Math.round(y / 1e6) + " juta tahun";
  return "miliaran tahun";
};

const Sw = ({ on, set, label, show }) => (
  <button type="button" className={"sw" + (on ? " on" : "")} role="switch" aria-checked={on} aria-label={label} onClick={set}>
    <u />
    {show && label}
  </button>
);

const Ic = ({ n }) => <span className="ms" aria-hidden="true">{n}</span>;

/* ============ 1. PERJALANAN DATA ============ */
function Alur() {
  const [pos, setPos] = useState(0), [play, setPlay] = useState(true), [sp, setSp] = useState(1), [sh, setSh] = useState(false);
  const max = sh ? 50 : 100, done = pos >= max;

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setPos((p) => Math.min(max, p + 0.5 * sp)), 30);
    return () => clearInterval(id);
  }, [play, sp, max]);
  useEffect(() => { if (pos >= max) setPlay(false); }, [pos, max]);

  const cur = Math.min(4, Math.floor(pos / 25)), S = STEPS[cur], bad = pos >= 50 && !sh;
  const toggleShield = () => {
    const v = !sh;
    setSh(v);
    if (v) setPos((p) => Math.min(p, 50)); else setPlay(true);
  };

  return (
    <div className="card">
      <h3>Perjalanan data yang bocor</h3>
      <p className="sub">Tonton ke mana datamu pergi, lalu nyalakan perlindungan untuk memutus rantainya.</p>

      <div className="track">
        <div className="line"><div className="fill" style={{ width: pos + "%", background: bad ? "var(--r)" : "var(--g)" }} /></div>
        <div className={"pk" + (bad ? " bad" : "")} style={{ left: 10 + pos * 0.8 + "%" }} />
        {STEPS.map((s, i) => (
          <div key={i} className={"nd" + (pos >= i * 25 ? " on" : "") + (i >= 2 && !(sh && i === 2) ? " bad" : "") + (i === cur && !done ? " cur" : "") + (sh && i > 2 ? " off" : "")}>
            <i><Ic n={sh && i === 2 && pos >= 50 ? "shield" : s.ic} /></i>
            <b>{s.n}</b>
            <small>{s.s}</small>
          </div>
        ))}
      </div>

      <div className="row">
        <button type="button" className="btn p" onClick={() => { if (done) { setPos(0); setPlay(true); } else setPlay(!play); }}>
          {play ? "Jeda" : done ? "Putar ulang" : "Putar"}
        </button>
        <button type="button" className="btn" onClick={() => { setPos(0); setPlay(true); }}>Ulangi</button>
        <button type="button" className="btn" onClick={() => setSp((sp % 3) + 1)}>Kecepatan {sp}x</button>
        <Sw on={sh} set={toggleShield} label="Perlindungan aktif" show />
      </div>

      {done && (
        <div className={"bn " + (sh ? "ok" : "no")}>
          {sh ? "Berhasil! Serangan terhenti di tahap peretas, dan data yang bocor tidak bisa dipakai di akun lain." : "Data sampai ke penipu. Nyalakan perlindungan lalu putar ulang untuk melihat bedanya."}
        </div>
      )}
      <div className="now"><b>{S.n}:</b> {S.what}</div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="inf"><h4>Titik pencegahan</h4><p>{S.stop}</p></div>
        <div className="inf d"><h4>Dampak ke korban</h4><p>{S.hit}</p></div>
      </div>
    </div>
  );
}

/* ============ 2. UJI SANDI ============ */
function Sandi() {
  const [p, setP] = useState(""), [show, setShow] = useState(false);
  const a = useMemo(() => analisa(p), [p]);
  const li = LV.findIndex((l) => a.bits < l[0]), lv = LV[li];
  const secs = Math.pow(2, Math.max(a.bits - 1, 0)) / 1e10;
  const gen = () => {
    const w = () => { const x = WORDS[Math.floor(Math.random() * WORDS.length)]; return x[0].toUpperCase() + x.slice(1); };
    setP(`${w()}-${w()}-${w()}-${10 + Math.floor(Math.random() * 90)}`);
    setShow(true);
  };
  return (
    <div className="card">
      <h3>Berapa lama sandimu bertahan?</h3>
      <p className="sub">Ketik sandi contoh dan lihat perkiraan waktu penyerang membobolnya dengan komputer cepat.</p>
      <div className="grid2" style={{ marginTop: 20 }}>
        <div>
          <input className="pw" type={show ? "text" : "password"} value={p} onChange={(e) => setP(e.target.value)} placeholder="Ketik sandi contoh" autoComplete="off" spellCheck={false} aria-label="Sandi contoh" />
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn" onClick={() => setShow(!show)}>{show ? "Sembunyikan" : "Tampilkan"}</button>
            <button type="button" className="btn p" onClick={gen}><Ic n="casino" />Buat frasa sandi</button>
          </div>
          <p className="note"><Ic n="lock" />Dihitung di browsermu dan tidak dikirim ke mana pun. Tetap jangan pakai sandi aslimu.</p>
        </div>
        <div>
          <div className="note">Perkiraan waktu untuk membobol</div>
          <div className="big" style={{ color: p ? lv[2] : "var(--m)" }}>{p ? fmt(secs) : "-"}</div>
          <div className="seg">{LV.map((l, i) => <i key={i} style={p && i <= li ? { background: lv[2] } : null} />)}</div>
          <b>{p ? lv[1] : "Belum ada sandi"}</b>
          {p && <span className="note"> · sekitar {Math.round(a.bits)} bit</span>}
          <ul className="chk">{CK.map((c, i) => <li key={i} className={a.ok[i] ? "y" : ""}>{c}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

/* ============ 3. TEBAK PENIPUAN ============ */
function Kuis() {
  const [i, setI] = useState(0), [ans, setAns] = useState(null), [sc, setSc] = useState(0), [end, setEnd] = useState(false);
  const N = KASUS.length, k = KASUS[i], ok = ans === k.scam;
  const jawab = (v) => { if (ans !== null) return; setAns(v); if (v === k.scam) setSc((s) => s + 1); };
  const next = () => { if (i + 1 >= N) setEnd(true); else { setI(i + 1); setAns(null); } };
  const reset = () => { setI(0); setAns(null); setSc(0); setEnd(false); };

  if (end) {
    const g = sc === N ? "Detektif digital!" : sc >= 3 ? "Cukup waspada" : "Masih rawan";
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div className="big">{sc} dari {N} benar</div>
        <h3 style={{ margin: "8px 0" }}>{g}</h3>
        <p className="sub">Ingat: jangan klik tautan asing, jangan bagikan OTP, dan verifikasi lewat kanal resmi.</p>
        <button type="button" className="btn p" style={{ marginTop: 20 }} onClick={reset}>Main lagi</button>
      </div>
    );
  }
  return (
    <div className="card">
      <h3>Tebak: aman atau penipuan?</h3>
      <p className="sub">Baca pesan di bawah dan tentukan sebelum kamu bereaksi.</p>
      <div className="grid2" style={{ marginTop: 20, alignItems: "center" }}>
        <div className={"ph" + (ans !== null && !ok ? " shake" : "")}>
          <div className="ph-top"><div className="av">{k.from[0]}</div><div><b>{k.from}</b><div className="note">{k.ch}</div></div></div>
          <div className="bub" key={i}>{k.msg}</div>
        </div>
        <div>
          <div className="note">Pesan {i + 1} dari {N} · skor {sc}</div>
          <div className="bar"><i style={{ width: ((i + (ans !== null ? 1 : 0)) / N) * 100 + "%" }} /></div>
          <div className="row" style={{ margin: "16px 0" }}>
            <button type="button" className="btn" disabled={ans !== null} onClick={() => jawab(true)}><Ic n="warning" />Penipuan</button>
            <button type="button" className="btn" disabled={ans !== null} onClick={() => jawab(false)}><Ic n="check_circle" />Aman</button>
          </div>
          {ans !== null && (
            <div className={"bn " + (ok ? "ok" : "no")}>
              <b>{ok ? "Tepat!" : "Kurang tepat."}</b> Ini {k.scam ? "penipuan" : "pesan aman"}. {k.why}
              <div>{k.fl.map((f) => <span key={f} className={"fl" + (k.scam ? "" : " g")}>{f}</span>)}</div>
              <button type="button" className="btn p" style={{ marginTop: 14 }} onClick={next}>{i + 1 >= N ? "Lihat hasil" : "Pesan berikutnya"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ 4. AUDIT PRIVASI ============ */
function Audit() {
  const [on, setOn] = useState({});
  const sc = KEB.reduce((a, k, i) => a + (on[i] ? k.w : 0), 0);
  const L = sc < 30 ? ["Terbuka lebar", "var(--r)"] : sc < 60 ? ["Rawan", "var(--a)"] : sc < 90 ? ["Cukup aman", "#d9a400"] : ["Terlindungi", "var(--g)"];
  return (
    <div className="card">
      <h3>Audit jejak digital</h3>
      <p className="sub">Nyalakan kebiasaan aman dan lihat skor privasimu naik.</p>
      <div className="aud" style={{ marginTop: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div className="ring">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="84" fill="none" strokeWidth="16" style={{ stroke: "var(--line)" }} />
              <circle cx="100" cy="100" r="84" fill="none" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(sc / 100) * 527.8} 600`} style={{ stroke: L[1], transition: "all .5s" }} />
            </svg>
            <div><div className="big">{sc}</div><b style={{ color: L[1] }}>{L[0]}</b></div>
          </div>
          <p className="note" style={{ margin: "14px 0" }}>{sc === 100 ? "Hebat! Jejak digitalmu sudah rapi." : "Nyalakan kebiasaan di samping untuk menaikkan skor."}</p>
          <button type="button" className="btn" onClick={() => setOn({})}>Reset</button>
        </div>
        <div>
          {KEB.map((k, i) => (
            <div className="hb" key={i}>
              <div><b>{k.t}</b><p>{k.tip}</p></div>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <span className={"tg " + (on[i] ? "o" : k.w >= 15 ? "h" : "s")}>{on[i] ? "Aman" : k.w >= 15 ? "Risiko tinggi" : "Sedang"}</span>
                <Sw on={!!on[i]} set={() => setOn({ ...on, [i]: !on[i] })} label={k.t} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ HALAMAN SIMULASI ============ */
export default function SimulasiPage() {
  const [tab, setTab] = useState("alur");

  return (
    <div className="sm-page">
      <style>{CSS}</style>
      <section className="sm" id="simulasi">
      <header className="sm-head">
        <span className="sm-pill">Edukasi privasi dan simulasi interaktif</span>
        <h2>Coba sendiri bagaimana data bocor, lalu pelajari cara melindunginya.</h2>
        <p>Empat simulasi singkat yang bisa kamu mainkan langsung tanpa risiko apa pun.</p>
      </header>
      <nav className="sm-tabs" role="tablist" aria-label="Pilih simulasi">
        {TABS.map(([id, t]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{t}</button>
        ))}
      </nav>
      <div className="sm-stage" key={tab}>
        {tab === "alur" && <Alur />}
        {tab === "sandi" && <Sandi />}
        {tab === "kuis" && <Kuis />}
        {tab === "audit" && <Audit />}
      </div>
      </section>
    </div>
  );
}

/* ============ GAYA (DISESUAIKAN DENGAN TEMA HOMEPAGE) ============ */
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap");

/* Variabel warna yang sama dengan homepage (homepage tidak dirender di halaman ini) */
:root{--blue:#1D5FD1;--navy:#0B2545;--blue-soft:#DCEBFF;--green:#12805C;--mint:#34D399;--green-soft:#DDF5EA;--bg:#F4F8FB;--card:#FFFFFF;--text:#0F1F33;--text2:#4B5D73;--line:#D5DEE8;--warn:#B45309;--warn-bg:#FEF3C7;--danger:#C62828;--danger-bg:#FDE8E8;--band:#0B2545;--shadow:0 10px 30px rgba(11,37,69,.08)}
:root[data-theme="dark"]{--bg:#081A33;--card:#10325F;--text:#F1F6FC;--text2:#B8C7DC;--line:#24497D;--blue:#6FA8FF;--blue-soft:#17407A;--green:#34D399;--green-soft:#0F4A45;--warn:#FBBF77;--warn-bg:#4A3510;--danger:#FF9B9B;--danger-bg:#4D1F26;--band:#06142A;--shadow:0 10px 30px rgba(0,0,0,.35)}
body{margin:0;background:var(--bg)}
.sm-page{font-family:"Plus Jakarta Sans","Inter",system-ui,sans-serif;font-size:16px;line-height:1.6;color:var(--text);background:var(--bg);min-height:100vh;transition:background .3s,color .3s}
.sm-page *{box-sizing:border-box}
.sm-page button{font:inherit;cursor:pointer}

.sm-page :focus-visible{outline:3px solid var(--blue);outline-offset:3px;border-radius:8px}

.sm{
  --g:var(--green, #0f7a5a);
  --g2:#0b5c44;
  --gs:var(--green-soft, #e3f6ee);
  --n:var(--text, #0b1b3a);
  --m:var(--text2, #5a6b82);
  --r:var(--danger, #c5203e);
  --rs:var(--danger-bg, #fde8ec);
  --a:var(--warn, #a85a00);
  --as:var(--warn-bg, #fdf0c9);
  font-family:"Plus Jakarta Sans","Inter",system-ui,sans-serif;
  color:var(--n);
  background:transparent;
  padding:56px 24px 80px;
  max-width:1180px;
  margin:0 auto;
}
:root[data-theme="dark"] .sm{
  --g2:var(--mint, #34d399);
}
.sm *{box-sizing:border-box}
.sm h2,.sm h3,.sm h4,.sm .big{font-family:"Space Grotesk","Plus Jakarta Sans",sans-serif;font-weight:700}
.sm button{font:inherit;cursor:pointer}
.sm button:focus-visible{outline:3px solid var(--blue, var(--g));outline-offset:2px}
.ms{font-family:"Material Symbols Rounded";font-weight:400;font-style:normal;font-size:20px;line-height:1;display:inline-block;letter-spacing:normal;text-transform:none;white-space:nowrap;direction:ltr;font-feature-settings:"liga";-webkit-font-smoothing:antialiased;vertical-align:middle}
.note .ms{font-size:16px;margin-right:4px;vertical-align:-3px}
.sm-pill{display:inline-block;background:var(--gs);color:var(--g);font-weight:700;font-size:14px;padding:8px 16px;border-radius:99px}
.sm-head{text-align:center;max-width:760px;margin:0 auto 28px}
.sm-head h2{font-size:clamp(28px,4.2vw,44px);line-height:1.15;margin:16px 0 12px;letter-spacing:-.02em}
.sm-head p{color:var(--m);font-size:17px;line-height:1.6;margin:0}
.sm-tabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;background:var(--card, #fff);border:1px solid var(--line, #e2e9f1);padding:6px;border-radius:28px;width:fit-content;max-width:100%;margin:0 auto 28px}
.sm-tabs button{border:0;background:none;padding:11px 18px;border-radius:99px;font-weight:600;color:var(--m);transition:background .2s,color .2s}
.sm-tabs button:hover{color:var(--n)}
.sm-tabs .on{background:var(--navy, #0b2545);color:#fff}
:root[data-theme="dark"] .sm-tabs .on{background:var(--mint, #34d399);color:#06251c}
.sm-stage{animation:up .4s ease both}
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.sm .card{background:var(--card, #fff);border:1px solid var(--line, #e2e9f1);border-radius:24px;padding:30px;box-shadow:var(--shadow, 0 10px 30px rgba(11,27,58,.05))}
.sm .card h3{font-size:clamp(24px,3.2vw,32px);letter-spacing:-.02em;margin:0 0 6px}
.sm .sub{color:var(--m);margin:0;line-height:1.6}
.sm .note{color:var(--m);font-size:13.5px;line-height:1.5;margin:10px 0 0}
.sm .big{font-weight:700;font-size:clamp(30px,4vw,42px);letter-spacing:-.02em;line-height:1.15}
.sm .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.sm .btn{border:2px solid var(--navy, var(--n));background:transparent;color:var(--n);padding:11px 20px;border-radius:14px;font-weight:700;transition:transform .15s,background .2s;display:inline-flex;align-items:center;gap:6px}
:root[data-theme="dark"] .sm .btn{border-color:var(--line)}
.sm .btn:hover:not(:disabled){transform:translateY(-1px)}
.sm .btn:disabled{opacity:.5;cursor:default}
.sm .btn.p{background:var(--g);border-color:var(--g);color:#fff}
:root[data-theme="dark"] .sm .btn.p{color:#06251c}
.sm .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sm .aud{display:grid;grid-template-columns:.8fr 1.2fr;gap:24px}
.sm .sw{display:flex;align-items:center;gap:10px;font-weight:600;border:0;background:none;padding:0;color:inherit;text-align:left}
.sm .sw u{flex:none;width:46px;height:26px;border-radius:99px;background:var(--line, #cdd7e3);position:relative;transition:background .25s;text-decoration:none}
.sm .sw u:after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.sm .sw.on u{background:var(--g)}
.sm .sw.on u:after{left:23px}
.sm .track{position:relative;display:flex;padding:8px 0 4px;margin:26px 0}
.sm .line{position:absolute;left:10%;right:10%;top:33px;height:6px;border-radius:9px;background:var(--line, #e2e9f1)}
.sm .fill{height:100%;border-radius:9px}
.sm .pk{position:absolute;top:24px;z-index:2;width:24px;height:24px;border-radius:50%;transform:translateX(-50%);background:var(--g);box-shadow:0 0 0 6px rgba(18,128,92,.18)}
.sm .pk.bad{background:var(--r);box-shadow:0 0 0 6px rgba(198,40,40,.2)}
.sm .nd{flex:1;text-align:center;position:relative;z-index:1;padding:0 4px;transition:opacity .3s}
.sm .nd i{font-style:normal;width:56px;height:56px;border-radius:50%;margin:0 auto 10px;display:grid;place-items:center;font-size:24px;background:var(--card, #fff);border:3px solid var(--line, #e2e9f1);filter:grayscale(1);opacity:.6;transition:all .35s}
.sm .nd.on i{filter:none;opacity:1;border-color:var(--g);background:var(--gs);color:var(--g)}
.sm .nd i .ms{font-size:28px}
.sm .nd.on.bad i{border-color:var(--r);background:var(--rs);color:var(--r)}
.sm .nd.cur i{animation:pulse 1.2s infinite}
@keyframes pulse{50%{transform:scale(1.12)}}
.sm .nd.off{opacity:.35}
.sm .nd b{display:block;font-size:15px}
.sm .nd small{display:block;color:var(--m);font-size:12.5px;margin-top:2px}
.sm .bn{margin-top:16px;padding:14px 18px;border-radius:16px;line-height:1.6;animation:up .35s both}
.sm .bn.ok{background:var(--gs);color:var(--g)}
.sm .bn.no{background:var(--rs);color:var(--r)}
.sm .now{background:var(--bg, #f6f9fc);border-radius:16px;padding:14px 18px;margin-top:16px;line-height:1.6}
.sm .inf{border-radius:18px;padding:20px 22px;background:var(--bg, #f6f9fc);border:1px solid var(--line, #e2e9f1);border-top:5px solid var(--g)}
.sm .inf.d{border-top-color:var(--r)}
.sm .inf h4{font-size:18px;margin:0 0 8px}
.sm .inf p{margin:0;color:var(--m);line-height:1.6}
.sm .pw{width:100%;font:600 20px "Plus Jakarta Sans",system-ui,sans-serif;padding:16px 18px;border-radius:16px;border:2px solid var(--line, #e2e9f1);background:var(--bg, #f6f9fc);color:var(--n);outline:0}
.sm .pw:focus{border-color:var(--g)}
.sm .seg{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:14px 0 10px}
.sm .seg i{height:8px;border-radius:9px;background:var(--line, #e2e9f1);transition:background .3s}
.sm .chk{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:8px}
.sm .chk li{display:flex;gap:10px;align-items:center;color:var(--m)}
.sm .chk li:before{content:"✕";flex:none;width:22px;height:22px;border-radius:50%;background:var(--rs);color:var(--r);display:grid;place-items:center;font-size:12px;font-weight:800}
.sm .chk li.y{color:var(--n)}
.sm .chk li.y:before{content:"✓";background:var(--gs);color:var(--g)}
.sm .ph{background:var(--bg, #f6f9fc);border:1px solid var(--line, #e2e9f1);border-radius:26px;padding:16px;max-width:430px;margin:0 auto;width:100%}
.sm .ph-top{display:flex;gap:10px;align-items:center;padding:4px 4px 14px;border-bottom:1px solid var(--line, #e2e9f1);margin-bottom:14px}
.sm .av{width:40px;height:40px;border-radius:50%;background:var(--navy, var(--n));color:#fff;display:grid;place-items:center;font-weight:700}
.sm .bub{background:var(--card, #fff);border:1px solid var(--line, #e2e9f1);border-radius:4px 18px 18px 18px;padding:14px 16px;line-height:1.6;box-shadow:0 4px 14px rgba(11,27,58,.06);animation:up .4s both}
.sm .bar{height:8px;background:var(--line, #e2e9f1);border-radius:9px;overflow:hidden;margin-top:8px}
.sm .bar i{display:block;height:100%;background:var(--g);transition:width .4s}
.sm .fl{display:inline-block;background:var(--rs);color:var(--r);font-size:13px;font-weight:600;padding:5px 10px;border-radius:99px;margin:10px 6px 0 0}
.sm .fl.g{background:var(--card, #fff);color:var(--g)}
.sm .shake{animation:shk .4s}
@keyframes shk{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.sm .ring{position:relative;width:200px;height:200px;margin:0 auto}
.sm .ring svg{transform:rotate(-90deg)}
.sm .ring>div{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
.sm .hb{display:flex;gap:14px;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:16px;background:var(--bg, #f6f9fc);margin-bottom:10px}
.sm .hb p{margin:4px 0 0;font-size:13px;color:var(--m);line-height:1.5}
.sm .tg{font-size:13px;font-weight:700;padding:5px 12px;border-radius:99px;white-space:nowrap}
.sm .tg.h{background:var(--rs);color:var(--r)}
.sm .tg.s{background:var(--as);color:var(--a)}
.sm .tg.o{background:var(--gs);color:var(--g)}

@media(max-width:760px){
  .sm{padding:36px 14px 60px}
  .sm .card{padding:22px 18px}
  .sm .grid2,.sm .aud{grid-template-columns:1fr}
  .sm .nd small{display:none}
  .sm .nd b{font-size:12px}
  .sm .nd i{width:44px;height:44px}
  .sm .nd i .ms{font-size:22px}
  .sm .line{top:27px}
  .sm .pk{top:18px}
  .sm .hb{flex-direction:column;align-items:flex-start}
}
@media(prefers-reduced-motion:reduce){.sm *{animation:none!important;transition:none!important}}
`;