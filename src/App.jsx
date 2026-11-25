import { useState } from "react";
import { flushSync } from "react-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/homepage";
import SimulasiPage from "./pages/Simulasi";
import Edukasi from "./pages/edukasi";

// Urutan halaman menentukan arah geser: maju = geser ke kiri, mundur = ke kanan
const ORDER = { home: 0, edukasi: 1, simulasi: 2 };

// Efek geser memakai View Transitions API: browser memotret layar lalu menggesernya
// di GPU, jadi tidak berat walau halamannya panjang. Navbar tidak ikut bergerak.
const CSS = `
html[data-jd-dir="fwd"]{--d:28px}
html[data-jd-dir="back"]{--d:-28px}
::view-transition-old(root){animation:jdOut .15s ease-in both;mix-blend-mode:normal}
::view-transition-new(root){animation:jdIn .25s cubic-bezier(.22,1,.36,1) both;mix-blend-mode:normal}
@keyframes jdOut{to{opacity:0;transform:translateX(calc(var(--d) * -1))}}
@keyframes jdIn{from{opacity:0;transform:translateX(var(--d))}}
::view-transition-group(jd-nav){animation:none}
::view-transition-old(jd-nav){display:none}
::view-transition-new(jd-nav){animation:none;mix-blend-mode:normal}
@media(prefers-reduced-motion:reduce){
  ::view-transition-old(root),::view-transition-new(root){animation:none}
}
`;

export default function App() {
  const [page, setPage] = useState("home");

  const scrollTo = (hash) => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const go = (target, hash = "") => {
    if (target === page) return scrollTo(hash);

    // Ganti halaman, mulai dari atas (atau langsung ke hash) tanpa scroll halus
    const swap = () => {
      flushSync(() => setPage(target));
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: "instant" });
    };

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || calm) return swap();

    document.documentElement.dataset.jdDir = ORDER[target] > ORDER[page] ? "fwd" : "back";
    document.startViewTransition(swap);
  };

  return (
    <>
      <style>{CSS}</style>
      <Navbar page={page} onNavigate={go} />
      {page === "simulasi" && <SimulasiPage />}
      {page === "edukasi" && <Edukasi />}
      {page === "home" && (
        <HomePage
          onOpenSimulasi={() => go("simulasi")}
          onOpenEdukasi={(hash) => go("edukasi", hash)}
        />
      )}
    </>
  );
}