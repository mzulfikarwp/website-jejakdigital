import { useEffect, useRef, useState } from 'react'

const CSS = `
:root{
  --blue:#1D5FD1; --navy:#0B2545; --blue-soft:#DCEBFF;
  --green:#12805C; --mint:#34D399; --green-soft:#DDF5EA;
  --bg:#F4F8FB; --card:#FFFFFF; --text:#0F1F33; --text2:#4B5D73; --line:#D5DEE8;
  --warn:#B45309; --warn-bg:#FEF3C7; --danger:#C62828; --danger-bg:#FDE8E8;
  --band:#0B2545; --band-text:#FFFFFF; --shadow:0 10px 30px rgba(11,37,69,.08);
}
:root[data-theme="dark"]{
  --bg:#081A33; --card:#10325F; --text:#F1F6FC; --text2:#B8C7DC; --line:#24497D;
  --blue:#6FA8FF; --blue-soft:#17407A; --green:#34D399; --green-soft:#0F4A45;
  --warn:#FBBF77; --warn-bg:#4A3510; --danger:#FF9B9B; --danger-bg:#4D1F26;
  --band:#10325F; --shadow:0 10px 30px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:400 17px/1.6 Inter,system-ui,sans-serif;transition:background .3s,color .3s}
h1,h2,h3{font-family:'Space Grotesk',sans-serif;line-height:1.15;margin:0;color:inherit}
a{color:inherit}
button{font:inherit;cursor:pointer}
:focus-visible{outline:3px solid var(--blue);outline-offset:3px;border-radius:8px}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 26px;border-radius:14px;font-weight:600;border:2px solid transparent;text-decoration:none;transition:transform .15s,background .2s}
.btn:hover{transform:translateY(-2px)}
.btn-green{background:var(--green);color:#fff}
.btn-green:hover{background:#0e6a4c}
:root[data-theme="dark"] .btn-green{color:#06251C}
.btn-out{background:transparent;border-color:var(--navy);color:var(--text)}
:root[data-theme="dark"] .btn-out{border-color:var(--text2)}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;padding:72px 0 80px}
.tag{display:inline-block;background:var(--green-soft);color:var(--green);font-weight:600;font-size:15px;padding:6px 16px;border-radius:999px}
h1{font-size:clamp(38px,5.2vw,64px);margin:22px 0}
.lead{color:var(--text2);font-size:19px;max-width:560px;margin:0 0 30px}
.cta{display:flex;gap:14px;flex-wrap:wrap}
.audit{background:var(--card);border-radius:24px;padding:28px;box-shadow:var(--shadow);border:1px solid var(--line)}
.audit h2{font-size:21px;margin-bottom:16px}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;background:var(--bg);border:0;border-radius:14px;padding:14px 16px;margin-bottom:10px;color:var(--text);text-align:left;min-height:52px}
.row:hover{outline:2px solid var(--line)}
.badge{font-weight:700;font-size:15px;padding:3px 12px;border-radius:999px;white-space:nowrap}
.hi{background:var(--danger-bg);color:var(--danger)}
.mid{background:var(--warn-bg);color:var(--warn)}
.ok{background:var(--green-soft);color:var(--green)}
.meter{height:12px;border-radius:6px;background:var(--line);overflow:hidden;margin:18px 0 8px}
.meter b{display:block;height:100%;width:0;border-radius:6px;background:var(--green);transition:width .5s,background .3s}
.score{display:flex;justify-content:space-between;align-items:baseline;font-weight:600}
.score span{font:700 30px 'Space Grotesk'}
.note{color:var(--text2);font-size:14px;margin:8px 0 0}
section{padding:72px 0}
h2.title{font-size:clamp(28px,3.6vw,40px);margin-bottom:12px}
.sub{color:var(--text2);max-width:640px;margin:0 0 36px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:26px;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-5px);box-shadow:var(--shadow)}
.card.link{cursor:pointer}
.card small{font:700 17px 'Space Grotesk';color:var(--c)}
.card h3{font-size:21px;margin:8px 0}
.card p{margin:0;color:var(--text2)}
.c1,.c6{--c:var(--green)}.c2,.c4{--c:var(--blue)}.c3{--c:var(--danger)}.c5{--c:var(--warn)}
.band{background:var(--card);color:var(--text);padding:48px 0;border-block:1px solid var(--line)}
.band .wrap{display:flex;justify-content:space-between;align-items:center;gap:32px;flex-wrap:wrap}
.band h2{font-size:30px;color:var(--text)}
.band .wrap>div:first-child{text-align:left}
.band p{margin:6px 0 0;color:var(--text2)}
.stats{display:flex;gap:36px;flex-wrap:wrap}
.stats div{font-size:15px;color:var(--text2)}
.stats strong{display:block;font:700 36px 'Space Grotesk';color:var(--text)}
footer{padding:36px 0;color:var(--text2);font-size:15px;text-align:center}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s,transform .6s}
.reveal.show{opacity:1;transform:none}
@media(max-width:900px){
  .hero{grid-template-columns:1fr}
  .grid{grid-template-columns:1fr 1fr}
}
@media(max-width:560px){.grid{grid-template-columns:1fr}.hero{padding-top:40px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}html{scroll-behavior:auto}}
`

const INIT_HABITS = [
  { t: 'Lokasi real-time di postingan', risky: true, w: 30, on: true },
  { t: 'Sandi sama di banyak akun', risky: true, w: 30, on: true },
  { t: 'Riwayat pencarian tersimpan', risky: true, w: 15, mid: true, on: true },
  { t: 'Verifikasi dua langkah aktif', risky: false, w: 25, on: false },
]

const FEATURES = [
  ['01', 'Edukasi', 'Materi singkat, glosarium, dan mini kuis.', 'c1'],
  ['02', 'Simulasi', 'Pilih tindakan, lihat akibatnya langsung.', 'c2'],
  ['03', 'Animasi Kebocoran Data', 'Ikuti perjalanan data dari pengguna hingga penipu.', 'c3'],
  ['04', 'Kuis ala Wayground', 'Timer, streak, dan leaderboard dari kasus nyata.', 'c4'],
  ['05', 'Studi Kasus 2021-2026', 'Skala, dampak, dan korban tiap kasus.', 'c5'],
  ['06', 'Profil dan Badge', 'Skor privasi, progres, dan pencapaian.', 'c6'],
]

const STATS = [
  { to: 279, suf: ' jt', label: 'BPJS, 2021' },
  { to: 1.3, dec: 1, suf: ' M', label: 'Registrasi SIM, 2022' },
  { to: 15, suf: ' jt', label: 'BSI, 2023' },
]

function Counter({ to, dec = 0, suf = '' }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    let raf
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t) => {
        const p = Math.min((t - t0) / 1200, 1)
        setVal(to * (1 - (1 - p) ** 3))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.6 })

    io.observe(ref.current)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])

  return <strong ref={ref}>{val.toFixed(dec).replace('.', ',')}{suf}</strong>
}

export default function Homepage({ onOpenSimulasi, onOpenEdukasi, onOpenKuis }) {
  const [habits, setHabits] = useState(INIT_HABITS)

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target) }
    }), { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Hitung skor audit
  const isSafe = (h) => (h.risky ? !h.on : h.on)
  const score = habits.reduce((sum, h) => sum + (isSafe(h) ? h.w : 0), 0)
  const [level, barColor] = score >= 80
    ? ['Pendekar Privasi', 'var(--green)']
    : score >= 50
      ? ['Waspada', 'var(--warn)']
      : ['Terbuka Lebar', 'var(--danger)']

  // Peta aksi pindah halaman
  const routes = {
    Edukasi: () => onOpenEdukasi?.(),
    Simulasi: () => onOpenSimulasi?.(),
    Kuis: () => onOpenKuis?.(),
  }

  const go = (e, key) => {
    if (!routes[key]) return
    e?.preventDefault()
    routes[key]()
  }

  return (
    <>
      <style>{CSS}</style>
      <main id="beranda">
        <div className="wrap hero">
          <div>
            <span className="tag">Edukasi privasi dan simulasi interaktif</span>
            <h1>Setiap klik meninggalkan jejak. Kenali sebelum disalahgunakan.</h1>
            <p className="lead">Lihat langsung bagaimana data harianmu terekam dan bocor, lalu pelajari cara mengamankannya lewat simulasi, animasi, dan kuis.</p>
            <div className="cta">
              <a className="btn btn-green" href="#fitur" onClick={(e) => go(e, 'Edukasi')}>Mulai Belajar</a>
              <a className="btn btn-out" href="#simulasi" onClick={(e) => go(e, 'Simulasi')}>Coba Simulasi</a>
            </div>
          </div>

          <div className="audit">
            <h2>Jejak digital hari ini</h2>
            <div>
              {habits.map((h, i) => {
                const safe = isSafe(h)
                return (
                  <button key={h.t} className="row" role="switch" aria-checked={h.on}
                    onClick={() => setHabits((hs) => hs.map((item, idx) => (idx === i ? { ...item, on: !item.on } : item)))}>
                    <span>{h.t}</span>
                    <span className={`badge ${safe ? 'ok' : h.mid ? 'mid' : 'hi'}`}>
                      {safe ? 'Aman' : h.mid ? 'Sedang' : 'Risiko tinggi'}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="meter" aria-hidden="true"><b style={{ width: `${score}%`, background: barColor }} /></div>
            <div className="score"><span>{score}</span><em style={{ fontStyle: 'normal' }}>{level}</em></div>
            <p className="note">Klik tiap kebiasaan untuk mengubahnya dan lihat skor privasimu berubah. Contoh tampilan hasil audit jejak digital.</p>
          </div>
        </div>

        <section id="fitur" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <h2 className="title reveal">Semua yang kamu butuhkan</h2>
            <p className="sub reveal">Enam fitur untuk memahami, mencoba, dan melindungi identitas digitalmu.</p>
            <div className="grid">
              {FEATURES.map(([no, title, desc, c]) => {
                const target = no === '01' ? 'Edukasi' : no === '02' ? 'Simulasi' : no === '04' ? 'Kuis' : null
                return (
                  <article key={no} className={`card reveal ${c} ${target ? 'link' : ''}`}
                    onClick={() => target && go(null, target)}>
                    <small>{no}</small><h3>{title}</h3><p>{desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <div className="band" id="kasus">
        <div className="wrap">
          <div><h2>Kasus nyata, bukan sekadar teori</h2><p>Angka berdasarkan laporan media dan klaim pelaku</p></div>
          <div className="stats">
            {STATS.map((s) => (
              <div key={s.label}><Counter to={s.to} dec={s.dec} suf={s.suf} />{s.label}</div>
            ))}
          </div>
        </div>
      </div>
      <footer>© 2026 JejakDigital · Edukasi privasi data untuk semua</footer>
    </>
  )
}