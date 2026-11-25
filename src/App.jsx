import { useState } from "react";
import HomePage from "./pages/homepage";
import SimulasiPage from "./pages/Simulasi";
import Edukasi from "./pages/edukasi";

export default function App() {
  const [page, setPage] = useState("home");

  const go = (p, hash = "") => {
    setPage(p);
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (page === "simulasi") {
    return (
      <SimulasiPage
        onBackHome={() => go("home")}
        onOpenEdukasi={() => go("edukasi")}
      />
    );
  }

  if (page === "edukasi") {
    return (
      <Edukasi
        onBackHome={(hash) => go("home", hash)}
        onOpenSimulasi={() => go("simulasi")}
      />
    );
  }

  return (
    <HomePage
      onOpenSimulasi={() => go("simulasi")}
      onOpenEdukasi={(hash) => go("edukasi", hash)}
    />
  );
}