import { useState } from "react";

export default function HomePage() {
  const [klik, setKlik] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
          Tes Halaman dari src/pages
        </h1>
        <p style={{ color: "#cbd5e1", marginBottom: "20px" }}>
          Kalau teks dan tombol ini muncul di browser, berarti file{" "}
          <code>HomePage.jsx</code> sudah berhasil terhubung ke{" "}
          <code>App.jsx</code>.
        </p>

        <button
          type="button"
          onClick={() => setKlik(klik + 1)}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0284c7",
            color: "#ffffff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Tes Klik: {klik}
        </button>
      </div>
    </div>
  );
}