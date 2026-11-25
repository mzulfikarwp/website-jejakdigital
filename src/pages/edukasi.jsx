import { useState } from "react";

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap");

/* Variabel warna yang sama dengan homepage (homepage tidak dirender di halaman ini) */
:root{--blue:#1D5FD1;--navy:#0B2545;--blue-soft:#DCEBFF;--green:#12805C;--mint:#34D399;--green-soft:#DDF5EA;--bg:#F4F8FB;--card:#FFFFFF;--text:#0F1F33;--text2:#4B5D73;--line:#D5DEE8;--warn:#B45309;--warn-bg:#FEF3C7;--danger:#C62828;--danger-bg:#FDE8E8;--band:#0B2545;--shadow:0 10px 30px rgba(11,37,69,.08)}
:root[data-theme="dark"]{--bg:#081A33;--card:#10325F;--text:#F1F6FC;--text2:#B8C7DC;--line:#24497D;--blue:#6FA8FF;--blue-soft:#17407A;--green:#34D399;--green-soft:#0F4A45;--warn:#FBBF77;--warn-bg:#4A3510;--danger:#FF9B9B;--danger-bg:#4D1F26;--band:#06142A;--shadow:0 10px 30px rgba(0,0,0,.35)}
:root[data-theme="dark"] .edu{--violet:#a99bff;--navy-card:#12305b;--on:#06251C}
body{margin:0;background:var(--bg)}

.edu {
  --teal: var(--green);
  --teal-soft: var(--green-soft);
  --navy-card: #13264d;
  --ink: var(--text);
  --muted: var(--text2);
  --red: var(--danger);
  --orange: var(--warn);
  --violet: #4f35c9;
  --on: #fff;

  font-family: "Inter", system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  min-height: 100vh;
  text-align: left;
  transition: background 0.3s, color 0.3s;
}

.edu *,
.edu *::before,
.edu *::after {
  box-sizing: border-box;
}

.edu h1,
.edu h2,
.edu h3 {
  font-family: "Space Grotesk", "Inter", sans-serif;
  margin: 0;
}

.edu p {
  margin: 0;
}

.edu button {
  font-family: inherit;
  cursor: pointer;
}

.edu :focus-visible {
  outline: 3px solid var(--teal);
  outline-offset: 2px;
}

.edu-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.edu #kuis {
  scroll-margin-top: 96px;
}

/* ---------- Hero ---------- */
.edu-hero {
  padding: 48px 0 8px;
}

.edu-kicker {
  color: var(--teal);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}

.edu-hero h1 {
  font-size: clamp(30px, 5.4vw, 46px);
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.edu-lead {
  margin-top: 16px;
  max-width: 520px;
  color: var(--muted);
  line-height: 1.7;
  font-size: 15.5px;
}

.edu-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.edu-bar {
  width: 210px;
  max-width: 100%;
  height: 8px;
  border-radius: 99px;
  background: var(--line);
  overflow: hidden;
}

.edu-bar span {
  display: block;
  height: 100%;
  background: var(--teal);
  border-radius: 99px;
  transition: width 0.35s ease;
}

.edu-progress strong {
  font-size: 14px;
}

.edu-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 24px 0 28px;
}

.edu-chip {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 9px 20px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
}

.edu-chip[aria-pressed="true"] {
  background: var(--green);
  border-color: var(--green);
  color: var(--on);
}

/* ---------- Kartu materi ---------- */
.edu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-bottom: 56px;
}

.edu-card {
  --accent: var(--teal);
  background: var(--card);
  border: 0;
  border-top: 3px solid var(--accent);
  border-radius: 20px;
  padding: 18px 18px 22px;
  text-align: left;
  min-height: 138px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  display: block;
  width: 100%;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.edu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.09);
}

.edu-card-status {
  display: block;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 600;
}

.edu-card h3 {
  margin-top: 8px;
  font-size: 17px;
  font-weight: 700;
}

.edu-card p {
  margin-top: 8px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.65;
}

/* ---------- Tips dan trik ---------- */
.edu-tips {
  background: var(--band);
  color: #fff;
  padding: 36px 0 40px;
}

.edu-tips .edu-kicker {
  color: var(--mint);
  font-size: 13px;
}

.edu-tips h2 {
  font-size: clamp(24px, 4vw, 30px);
  margin-bottom: 20px;
}

.edu-tips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.edu-tip {
  background: var(--navy-card);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 16px;
}

.edu-tip b {
  display: block;
  color: var(--mint);
  font-size: 13px;
  margin-bottom: 8px;
}

.edu-tip p {
  font-size: 12.5px;
  line-height: 1.6;
  color: #dbe4f5;
}

/* ---------- Seksi umum ---------- */
.edu-section {
  padding: 44px 0 0;
}

.edu-section h2 {
  font-size: clamp(22px, 3.6vw, 27px);
  font-weight: 700;
  margin-bottom: 18px;
}

.edu-myths {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.edu-myth {
  background: var(--card);
  border-radius: 16px;
  padding: 20px 22px 22px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.edu-myth small {
  color: var(--red);
  font-weight: 600;
  font-size: 13px;
}

.edu-myth h3 {
  margin: 8px 0 12px;
  font-size: 16.5px;
}

.edu-myth p {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--muted);
}

.edu-myth p b {
  color: var(--teal);
}

.edu-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.edu-step {
  background: var(--card);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.edu-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--teal);
  color: var(--on);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 16px;
}

.edu-step h3 {
  font-size: 14.5px;
  margin-bottom: 8px;
}

.edu-step p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

/* ---------- Kuis ---------- */
.edu-quiz-cta {
  margin: 28px 0 48px;
  background: var(--teal-soft);
  border-radius: 16px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.edu-quiz-cta h2 {
  font-size: 19px;
  margin: 0 0 4px;
}

.edu-quiz-cta p {
  color: var(--teal);
  font-size: 13px;
}

.edu-primary {
  background: var(--teal);
  color: var(--on);
  border: 0;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
}

.edu-primary:hover {
  filter: brightness(0.92);
}

.edu-quiz {
  background: var(--card);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 48px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
}

.edu-quiz-meta {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 10px;
}

.edu-quiz h3 {
  font-size: 19px;
  line-height: 1.4;
  margin-bottom: 18px;
}

.edu-options {
  display: grid;
  gap: 10px;
}

.edu-option {
  text-align: left;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 14px;
  color: var(--ink);
}

.edu-option:hover:not(:disabled) {
  border-color: var(--teal);
}

.edu-option.benar {
  border-color: var(--teal);
  background: var(--teal-soft);
}

.edu-option.salah {
  border-color: var(--red);
  background: var(--danger-bg);
}

.edu-explain {
  margin-top: 16px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
}

.edu-quiz-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
}

.edu-ghost {
  background: var(--card);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 22px;
  font-weight: 600;
  font-size: 14px;
}

.edu-score {
  font-family: "Space Grotesk", sans-serif;
  font-size: 40px;
  font-weight: 700;
  color: var(--teal);
  margin: 6px 0 10px;
}

/* ---------- Responsif ---------- */
@media (max-width: 860px) {
  .edu-grid,
  .edu-tips-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .edu-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .edu-wrap {
    padding: 0 18px;
  }
  .edu-grid,
  .edu-tips-grid,
  .edu-myths,
  .edu-steps {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .edu *,
  .edu *::before,
  .edu *::after {
    transition: none !important;
  }
}
`;

const KATEGORI = ["Semua", "Akun", "Medsos", "Perangkat", "Aplikasi"];

const MATERI = [
  {
    id: 1,
    judul: "Sandi yang kuat",
    kategori: "Akun",
    warna: "var(--green)",
    isi: "Minimal 12 karakter, gunakan frasa acak, unik di tiap akun, dan simpan di password manager.",
  },
  {
    id: 2,
    judul: "Verifikasi dua langkah",
    kategori: "Akun",
    warna: "var(--green)",
    isi: "Aktifkan di email, bank, dan medsos. Pilih aplikasi autentikator dan simpan kode cadangan.",
  },
  {
    id: 3,
    judul: "Waspada phishing",
    kategori: "Akun",
    warna: "var(--danger)",
    isi: "Cek pengirim dan alamat link. Jangan beri OTP ke siapa pun, termasuk yang mengaku petugas.",
  },
  {
    id: 4,
    judul: "Privasi media sosial",
    kategori: "Medsos",
    warna: "var(--violet)",
    isi: "Atur akun privat, matikan tag lokasi, dan jangan unggah KTP, tiket, atau boarding pass.",
  },
  {
    id: 5,
    judul: "Perangkat dan WiFi",
    kategori: "Perangkat",
    warna: "var(--warn)",
    isi: "Perbarui sistem, kunci layar, hindari WiFi publik untuk transaksi, dan gunakan VPN.",
  },
  {
    id: 6,
    judul: "Izin aplikasi",
    kategori: "Aplikasi",
    warna: "var(--violet)",
    isi: "Beri izin seperlunya, cek akses lokasi dan kontak, dan hapus aplikasi yang tidak dipakai.",
  },
];

const TRIK = [
  "Pakai alias atau email terpisah untuk bank, medsos, dan belanja.",
  "Tekan lama link untuk melihat alamat aslinya sebelum membuka.",
  "Saat mengirim foto KTP, tulis tujuannya di atas foto dan sensor bagian yang tidak perlu.",
  "Hapus metadata lokasi foto sebelum diunggah ke medsos.",
  "Cek email dan nomor HP secara berkala di layanan cek kebocoran yang tepercaya.",
  "Isi jawaban pertanyaan keamanan dengan kata acak yang kamu simpan sendiri.",
];

const MITOS = [
  {
    mitos: "Akun saya tidak penting, jadi aman",
    fakta:
      "Pelaku memakai program otomatis, jadi semua akun bisa jadi target.",
  },
  {
    mitos: "Mode penyamaran membuatku anonim",
    fakta:
      "Hanya riwayat di perangkat yang tidak tersimpan. Situs dan penyedia internet tetap bisa melihat aktivitasmu.",
  },
];

const LANGKAH = [
  {
    judul: "Ganti sandi",
    isi: "Ubah sandi akun terkait dan aktifkan 2FA.",
  },
  {
    judul: "Amankan keuangan",
    isi: "Hubungi bank dan blokir kartu bila perlu.",
  },
  {
    judul: "Waspada pesan",
    isi: "Curigai telepon dan pesan yang mengaku dari lembaga resmi.",
  },
  {
    judul: "Laporkan",
    isi: "Lapor ke penyelenggara layanan dan pihak berwenang.",
  },
];

const SOAL = [
  {
    tanya:
      "Kamu menerima SMS dari \"petugas bank\" yang meminta kode OTP untuk membatalkan transaksi. Apa yang kamu lakukan?",
    opsi: [
      "Memberikan OTP agar transaksi dibatalkan",
      "Mengabaikan dan menghubungi bank lewat kontak resmi",
      "Membalas dan menanyakan nama petugas",
    ],
    benar: 1,
    jelas:
      "OTP bersifat rahasia. Bank tidak pernah memintanya, jadi hubungi layanan resmi sendiri.",
  },
  {
    tanya: "Sandi mana yang paling kuat?",
    opsi: ["Surabaya2004", "kucing-hujan-lampu-teh-biru", "P@ssw0rd!"],
    benar: 1,
    jelas:
      "Frasa acak yang panjang lebih sulit ditebak dan lebih mudah diingat daripada kata umum yang diganti simbol.",
  },
  {
    tanya: "Apa yang sebaiknya dilakukan sebelum mengunggah foto ke medsos?",
    opsi: [
      "Menambahkan lokasi agar teman tahu",
      "Menghapus metadata lokasi foto",
      "Memberi tag ke semua orang di foto",
    ],
    benar: 1,
    jelas:
      "Metadata foto bisa memuat koordinat tempatmu. Hapus dulu agar lokasi rumah atau kampus tidak terbuka.",
  },
  {
    tanya: "Mode penyamaran (incognito) pada browser membuat kamu...",
    opsi: [
      "Sepenuhnya anonim di internet",
      "Tidak meninggalkan riwayat di perangkat saja",
      "Kebal dari phishing",
    ],
    benar: 1,
    jelas:
      "Situs dan penyedia internet tetap bisa melihat aktivitasmu. Yang hilang hanya riwayat di perangkat.",
  },
  {
    tanya: "Langkah pertama saat sandi akunmu diketahui bocor?",
    opsi: [
      "Menunggu sampai ada aktivitas aneh",
      "Mengganti sandi dan mengaktifkan 2FA",
      "Menghapus aplikasinya",
    ],
    benar: 1,
    jelas:
      "Segera ganti sandi di akun terkait dan aktifkan verifikasi dua langkah untuk menutup celahnya.",
  },
];

function Kuis({ onTutup }) {
  const [no, setNo] = useState(0);
  const [pilih, setPilih] = useState(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);

  const soal = SOAL[no];

  const jawab = (i) => {
    if (pilih !== null) return;
    setPilih(i);
    if (i === soal.benar) setSkor((s) => s + 1);
  };

  const lanjut = () => {
    if (no + 1 === SOAL.length) {
      setSelesai(true);
    } else {
      setNo(no + 1);
      setPilih(null);
    }
  };

  const ulang = () => {
    setNo(0);
    setPilih(null);
    setSkor(0);
    setSelesai(false);
  };

  if (selesai) {
    return (
      <div className="edu-quiz" role="status">
        <h3>Kuis selesai</h3>
        <div className="edu-score">
          {skor} / {SOAL.length}
        </div>
        <p className="edu-explain">
          {skor === SOAL.length
            ? "Sempurna. Kebiasaan digitalmu sudah baik, tinggal dijaga."
            : "Baca lagi materi yang masih terasa asing, lalu coba ulang kuisnya."}
        </p>
        <div className="edu-quiz-actions">
          <button className="edu-primary" onClick={ulang}>
            Ulangi kuis
          </button>
          <button className="edu-ghost" onClick={onTutup}>
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edu-quiz">
      <div className="edu-quiz-meta">
        <span>
          Soal {no + 1} dari {SOAL.length}
        </span>
        <span>Skor: {skor}</span>
      </div>
      <h3>{soal.tanya}</h3>
      <div className="edu-options">
        {soal.opsi.map((o, i) => {
          let kelas = "edu-option";
          if (pilih !== null && i === soal.benar) kelas += " benar";
          else if (pilih === i) kelas += " salah";
          return (
            <button
              key={o}
              className={kelas}
              onClick={() => jawab(i)}
              disabled={pilih !== null}
            >
              {o}
            </button>
          );
        })}
      </div>
      {pilih !== null && (
        <>
          <p className="edu-explain" role="status">
            <b>{pilih === soal.benar ? "Benar. " : "Belum tepat. "}</b>
            {soal.jelas}
          </p>
          <div className="edu-quiz-actions">
            <button className="edu-primary" onClick={lanjut}>
              {no + 1 === SOAL.length ? "Lihat hasil" : "Soal berikutnya"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Edukasi() {
  const [filter, setFilter] = useState("Semua");
  const [selesai, setSelesai] = useState([1, 2]);
  const [kuisBuka, setKuisBuka] = useState(false);

  const tampil =
    filter === "Semua" ? MATERI : MATERI.filter((m) => m.kategori === filter);

  const toggle = (id) =>
    setSelesai((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const persen = (selesai.length / MATERI.length) * 100;

  return (
    <div className="edu">
      <style>{CSS}</style>
      <main>
        {/* Hero + materi */}
        <section className="edu-wrap edu-hero">
          <p className="edu-kicker">Halaman edukasi</p>
          <h1>Cegah kebocoran data dari kebiasaan kecil</h1>
          <p className="edu-lead">
            Kebocoran data sering bermula dari sandi lemah, link palsu, atau
            postingan yang terlalu terbuka. Pelajari 6 materi inti dan trik
            praktisnya.
          </p>

          <div className="edu-progress">
            <div
              className="edu-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={MATERI.length}
              aria-valuenow={selesai.length}
            >
              <span style={{ width: `${persen}%` }} />
            </div>
            <strong>
              {selesai.length} dari {MATERI.length} materi selesai
            </strong>
          </div>

          <div className="edu-filters" role="group" aria-label="Filter kategori">
            {KATEGORI.map((k) => (
              <button
                key={k}
                className="edu-chip"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="edu-grid">
            {tampil.map((m) => {
              const sudah = selesai.includes(m.id);
              return (
                <button
                  key={m.id}
                  className="edu-card"
                  style={{ "--accent": m.warna }}
                  onClick={() => toggle(m.id)}
                  aria-pressed={sudah}
                  title="Klik untuk menandai selesai atau belum"
                >
                  <span className="edu-card-status">
                    Materi {m.id} · {sudah ? "Selesai" : "Belum"}
                  </span>
                  <h3>{m.judul}</h3>
                  <p>{m.isi}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tips dan trik */}
        <section className="edu-tips">
          <div className="edu-wrap">
            <p className="edu-kicker">Tips dan trik</p>
            <h2>Trik cepat yang bisa langsung dipakai</h2>
            <div className="edu-tips-grid">
              {TRIK.map((t, i) => (
                <div className="edu-tip" key={t}>
                  <b>Trik {i + 1}</b>
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mitos atau fakta */}
        <section className="edu-wrap edu-section">
          <h2>Mitos atau fakta?</h2>
          <div className="edu-myths">
            {MITOS.map((m) => (
              <article className="edu-myth" key={m.mitos}>
                <small>Mitos</small>
                <h3>{m.mitos}</h3>
                <p>
                  <b>Fakta:</b> {m.fakta}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Jika data bocor */}
        <section className="edu-wrap edu-section">
          <h2>Jika datamu sudah bocor</h2>
          <ol className="edu-steps" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {LANGKAH.map((l, i) => (
              <li className="edu-step" key={l.judul}>
                <div className="edu-step-num">{i + 1}</div>
                <h3>{l.judul}</h3>
                <p>{l.isi}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Kuis */}
        <section className="edu-wrap" id="kuis">
          {kuisBuka ? (
            <div style={{ marginTop: 28 }}>
              <Kuis onTutup={() => setKuisBuka(false)} />
            </div>
          ) : (
            <div className="edu-quiz-cta">
              <div>
                <h2>Sudah paham? Uji dengan mini kuis</h2>
                <p>5 soal singkat dari kasus nyata</p>
              </div>
              <button className="edu-primary" onClick={() => setKuisBuka(true)}>
                Mulai Kuis
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}