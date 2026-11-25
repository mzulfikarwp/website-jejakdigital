import { useState } from "react";
import HomePage from "./pages/homepage";
import SimulasiPage from "./pages/Simulasi";

export default function App() {
  const [page, setPage] = useState("home");

  if (page === "simulasi") {
    return (
      <SimulasiPage
        onBackHome={() => {
          setPage("home");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <HomePage
      onOpenSimulasi={() => {
        setPage("simulasi");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}