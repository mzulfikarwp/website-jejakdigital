import { useState } from "react";
import HomePage from "./pages/homepage";
import SimulasiPage from "./pages/Simulasi";
import Edukasi from "./pages/edukasi";

export default function App() {
  const [page, setPage] = useState("home");

  const go = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <EdukasiPage
        onBackHome={() => go("home")}
        onOpenSimulasi={() => go("simulasi")}
      />
    );
  }

  return (
    <HomePage
      onOpenSimulasi={() => go("simulasi")}
      onOpenEdukasi={() => go("edukasi")}
    />
  );
}