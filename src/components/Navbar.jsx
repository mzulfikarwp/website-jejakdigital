import { useEffect, useState } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap');
:root{--blue:#1D5FD1;--navy:#0B2545;--green:#12805C;--mint:#34D399;--bg:#F4F8FB;--card:#FFFFFF;--text:#0F1F33;--line:#D5DEE8}
:root[data-theme="dark"]{--bg:#081A33;--card:#10325F;--text:#F1F6FC;--line:#24497D;--blue:#6FA8FF;--green:#34D399}
html{scroll-padding-top:92px}
.jd-spacer{height:77px}
.jd-top{position:fixed;top:0;left:0;right:0;z-index:50;text-align:left;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);font:400 17px/1.6 Inter,system-ui,sans-serif;color:var(--text)}
.jd-top *{box-sizing:border-box}
.jd-top button{font:inherit;cursor:pointer}
.jd-top :focus-visible{outline:3px solid var(--blue);outline-offset:3px;border-radius:8px}
.jd-nav{max-width:1180px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:76px;gap:16px}
.jd-logo{display:flex;align-items:center;gap:10px;font:700 21px 'Space Grotesk',sans-serif;text-decoration:none;color:inherit}
.jd-logo i{width:34px;height:34px;border-radius:10px;background:var(--green);color:#fff;display:grid;place-items:center;font-style:normal}
:root[data-theme="dark"] .jd-logo i{color:#06251C}
.jd-menu{display:flex;gap:30px}
.jd-menu a{text-decoration:none;font-weight:500;padding:6px 0;border-bottom:2px solid transparent;color:inherit;transition:color .2s,border-color .2s}
.jd-menu a:hover,.jd-menu a[aria-current="page"]{border-color:var(--green);color:var(--green)}
.jd-actions{display:flex;gap:10px;align-items:center}
.jd-top .jd-icon{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--text)}
.jd-top .jd-burger{display:none}
.jd-top .jd-login{background:var(--navy);color:#fff;border:0;border-radius:999px;padding:0 24px;min-height:44px;font-weight:600}
:root[data-theme="dark"] .jd-top .jd-login{background:var(--mint);color:#06251C}
@media(max-width:900px){
  .jd-menu{position:absolute;top:76px;left:0;right:0;flex-direction:column;gap:0;background:var(--card);border-bottom:1px solid var(--line);padding:8px 24px;
    visibility:hidden;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s}
  .jd-menu.open{visibility:visible;opacity:1;transform:none;pointer-events:auto}
  .jd-menu a{padding:14px 0}
  .jd-top .jd-burger{display:inline-block}
}
@media(max-width:560px){.jd-top .jd-login{display:none}.jd-nav{padding:0 18px}}
@media(prefers-reduced-motion:reduce){.jd-menu{transition:none}}
`

// [label, halaman tujuan, hash opsional]
const NAV = [
  ['Beranda', 'home', ''],
  ['Edukasi', 'edukasi', ''],
  ['Simulasi', 'simulasi', ''],
  ['Kuis', 'edukasi', '#kuis'],
  ['Profil', 'home', '#kasus'],
]

// Menu yang menyala untuk tiap halaman
const ACTIVE = { home: 'Beranda', edukasi: 'Edukasi', simulasi: 'Simulasi' }

export default function Navbar({ page, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Tema dipakai bersama semua halaman (kunci localStorage yang sama)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('jd-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') }
    catch { return 'light' }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('jd-theme', theme) } catch {}
  }, [theme])

  const go = (e, target, hash) => {
    e.preventDefault()
    setMenuOpen(false)
    onNavigate(target, hash)
  }

  return (
    <>
    <style>{CSS}</style>
    <header className="jd-top">
      <div className="jd-nav">
        <a className="jd-logo" href="#beranda" onClick={(e) => go(e, 'home', '')}><i>J</i>JejakDigital</a>
        <nav className={`jd-menu ${menuOpen ? 'open' : ''}`} aria-label="Menu utama">
          {NAV.map(([label, target, hash]) => (
            <a key={label} href={hash || `#${target === 'home' ? 'beranda' : target}`}
              aria-current={ACTIVE[page] === label ? 'page' : undefined}
              onClick={(e) => go(e, target, hash)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="jd-actions">
          <button type="button" className="jd-icon" aria-label="Ganti mode terang/gelap"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>◐</button>
          <button type="button" className="jd-icon jd-burger" aria-label="Buka menu" aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <button type="button" className="jd-login">Masuk</button>
        </div>
      </div>
    </header>
    <div className="jd-spacer" aria-hidden="true" />
    </>
  )
}