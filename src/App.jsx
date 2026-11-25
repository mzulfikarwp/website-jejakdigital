import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/homepage";
import SimulasiPage from "./pages/Simulasi";
import Edukasi from "./pages/edukasi";

// Urutan halaman menentukan arah geser: maju = geser ke kiri, mundur = ke kanan
const ORDER = { home: 0, edukasi: 1, simulasi: 2 };
const OUT_MS = 180;
const IN_MS = 320;

const CSS = `
.jd-view{overflow-x:clip}
.jd-view.out{animation:jdOut ${OUT_MS}ms ease-in both}
.jd-view.in{animation:jdIn ${IN_MS}ms cubic-bezier(.22,1,.36,1) both}
@keyframes jdOut{to{opacity:0;transform:translateX(calc(var(--d) * -1))}}
@keyframes jdIn{from{opacity:0;transform:translateX(var(--d))}}
@media(prefers-reduced-motion:reduce){.jd-view.out,.jd-view.in{animation:none}}
`;

export default function App() {
  const [page, setPage] = useState("home");
  const [anim, setAnim] = useState({ phase: "", dir: 1 });
  const busy = useRef(false);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Halaman baru selalu mulai dari atas (instan, supaya tidak ikut scroll halus)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  const scrollTo = (hash) => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const go = (target, hash = "") => {
    if (busy.current) return;
    if (target === page) return scrollTo(hash);

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dir = ORDER[target] > ORDER[page] ? 1 : -1;
    busy.current = true;

    // 1) halaman lama geser keluar, 2) ganti halaman, 3) halaman baru geser masuk
    setAnim({ phase: "out", dir });
    later(() => {
      setPage(target);
      setAnim({ phase: "in", dir });
      if (hash) later(() => scrollTo(hash), 60);
      later(() => {
        setAnim({ phase: "", dir });
        busy.current = false;
      }, calm ? 0 : IN_MS);
    }, calm ? 0 : OUT_MS);
  };

  return (
    <>
      <style>{CSS}</style>
      {/* Navbar tetap di tempat; hanya isi halaman yang bergeser */}
      <Navbar page={page} onNavigate={go} />
      <div className={`jd-view ${anim.phase}`} style={{ "--d": `${anim.dir * 48}px` }}>
        {page === "simulasi" && <SimulasiPage />}
        {page === "edukasi" && <Edukasi />}
        {page === "home" && (
          <HomePage
            onOpenSimulasi={() => go("simulasi")}
            onOpenEdukasi={(hash) => go("edukasi", hash)}
          />
        )}
      </div>
    </>
  );
}