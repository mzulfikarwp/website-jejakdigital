import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

/* ============ KONFIGURASI SUPABASE ============ */
// Nilai dari Supabase Dashboard > Project Settings > API (kunci publishable memang aman dipakai di frontend)
const SUPABASE_URL = 'https://abqmojapodexopptojxq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__cKyjXhiNVG2A1H-nTddgw_neqO3xMq'
const QUIZ_TITLE = 'Kuis Kesadaran Jejak Digital'
const DEFAULT_MSG = 'Kuis akan mengambil soal langsung dari database JejakDigital.'

const isConfigured = () =>
  SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('ISI_') &&
  SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('ISI_')

let client = null
const db = () => (client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY))

/* ============ AMBIL SOAL ============ */
async function loadQuiz() {
  if (!isConfigured()) throw new Error('Koneksi Supabase belum diatur. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di kuis.jsx.')

  const { data: quizzes, error: quizError } = await db()
    .from('published_quizzes')
    .select('id,title,time_limit_seconds,points_per_correct')
    .eq('title', QUIZ_TITLE)
    .limit(1)
  if (quizError) throw quizError
  if (!quizzes?.length) throw new Error('Kuis belum ditemukan atau belum dipublikasikan di Supabase.')
  const quiz = quizzes[0]

  const { data: rows, error: questionError } = await db()
    .from('public_questions')
    .select('id,quiz_id,question_number,category,question_text')
    .eq('quiz_id', quiz.id)
    .order('question_number', { ascending: true })
  if (questionError) throw questionError
  if (!rows?.length) throw new Error('Belum ada soal di database.')

  const { data: optionRows, error: optionError } = await db()
    .from('public_question_options')
    .select('id,question_id,option_label,option_text')
    .in('question_id', rows.map((q) => q.id))
  if (optionError) throw optionError

  const questions = rows.map((q) => ({
    id: q.id,
    number: q.question_number,
    cat: q.category,
    q: q.question_text,
    options: (optionRows || [])
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.option_label.localeCompare(b.option_label))
      .map((o) => ({ id: o.id, label: o.option_label, text: o.option_text })),
  }))
  if (questions.some((q) => q.options.length !== 4)) throw new Error('Ada soal yang belum memiliki tepat empat pilihan jawaban.')

  return {
    questions,
    meta: {
      id: quiz.id,
      timeLimit: quiz.time_limit_seconds || 20,
      points: quiz.points_per_correct || 120,
    },
  }
}

const mmss = (s) => `00:${String(s).padStart(2, '0')}`

/* ============ HALAMAN KUIS ============ */
export default function KuisPage() {
  const [phase, setPhase] = useState('welcome') // welcome | quiz | result
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { text, error }
  const [failedStart, setFailedStart] = useState(false)

  const [questions, setQuestions] = useState([])
  const [meta, setMeta] = useState({ id: null, timeLimit: 20, points: 120 })
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [status, setStatus] = useState('open') // open | checking | done
  const [answer, setAnswer] = useState(null) // { selectedId, res, isRight, timeout }
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [result, setResult] = useState(null)

  const submitted = useRef([])

  /* ---- timer: jalan hanya saat soal masih terbuka ---- */
  useEffect(() => {
    if (phase !== 'quiz' || status !== 'open') return
    if (timeLeft <= 0) { choose(null, true); return }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, status, timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- mulai ---- */
  const start = async () => {
    setLoading(true)
    setFailedStart(false)
    setMsg({ text: 'Mengambil soal dari Supabase...', error: false })
    try {
      const { questions: qs, meta: m } = await loadQuiz()
      submitted.current = []
      setQuestions(qs)
      setMeta(m)
      setIndex(0); setScore(0); setStreak(0)
      setStatus('open'); setAnswer(null); setSaveFailed(false)
      setTimeLeft(m.timeLimit)
      setMsg(null)
      setPhase('quiz')
    } catch (err) {
      setMsg({ text: err.message || 'Gagal menghubungkan ke Supabase.', error: true })
      setFailedStart(true)
    } finally {
      setLoading(false)
    }
  }

  /* ---- pilih jawaban (optionId null = waktu habis) ---- */
  const choose = async (optionId, timeout = false) => {
    if (status !== 'open') return
    setStatus('checking')
    const q = questions[index]
    let res = { is_correct: false, correct_label: '', correct_text: '', explanation: '' }

    if (optionId) {
      try {
        const { data, error } = await db().rpc('check_quiz_answer', { p_question_id: q.id, p_option_id: optionId })
        if (error) throw error
        res = data
      } catch (err) {
        setStatus('open') // boleh coba lagi
        setMsg({ text: 'Gagal memeriksa jawaban: ' + (err.message || 'Kesalahan koneksi'), error: true })
        return
      }
      submitted.current.push({ question_id: q.id, option_id: optionId })
    } else {
      submitted.current.push({ question_id: q.id, option_id: null })
      try {
        const { data, error } = await db().rpc('get_question_feedback', { p_question_id: q.id })
        if (!error && data) res = data
      } catch { /* abaikan: pakai penjelasan bawaan */ }
    }

    const isRight = !!res.is_correct
    if (isRight) { setScore((s) => s + meta.points); setStreak((s) => s + 1) }
    else setStreak(0)

    setMsg(null)
    setAnswer({ selectedId: optionId, res, isRight, timeout })
    setStatus('done')
  }

  /* ---- soal berikutnya / selesai ---- */
  const next = async () => {
    if (status !== 'done' || saving) return
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setStatus('open'); setAnswer(null); setMsg(null)
      setTimeLeft(meta.timeLimit)
      return
    }
    setSaving(true)
    try {
      const { data, error } = await db().rpc('submit_quiz_attempt', {
        p_quiz_id: meta.id,
        p_answers: submitted.current,
        p_display_name: null,
      })
      if (error) throw error
      setResult(data)
      setMsg(null)
      setPhase('result')
    } catch (err) {
      setSaveFailed(true)
      setMsg({ text: 'Hasil belum tersimpan: ' + (err.message || 'Kesalahan database'), error: true })
    } finally {
      setSaving(false)
    }
  }

  const restart = () => {
    setPhase('welcome')
    setLoading(false)
    setFailedStart(false)
    setMsg(null)
  }

  /* ---- turunan tampilan ---- */
  const q = questions[index]
  const done = status === 'done'
  const progress = questions.length ? ((index + (done ? 1 : 0)) / questions.length) * 100 : 0
  const isLast = index === questions.length - 1

  const answerClass = (o) => {
    if (!answer || answer.timeout) return 'answer'
    if (o.id === answer.selectedId) return 'answer ' + (answer.isRight ? 'correct' : 'wrong')
    if (!answer.isRight && o.label === answer.res.correct_label) return 'answer correct'
    return 'answer'
  }

  const feedbackText = () => {
    if (!answer) return ''
    const { res, isRight, timeout } = answer
    const prefix = timeout ? 'Waktu untuk menjawab telah habis. ' : ''
    const correction = !isRight && res.correct_label ? `Jawaban yang tepat: ${res.correct_label}. ${res.correct_text}. ` : ''
    return prefix + correction + (res.explanation || 'Pelajari kembali materi terkait untuk memahami jawaban yang tepat.')
  }

  const pct = Number(result?.accuracy) || 0

  return (
    <div className="kz">
      <style>{CSS}</style>
      <main className="app">
        {/* ===== Selamat datang ===== */}
        {phase === 'welcome' && (
          <section className="welcome">
            <div className="case-label">KUIS INTERAKTIF</div>
            <h1>Seberapa sadar kamu menjaga jejak digital?</h1>
            <p>Jawab 15 pertanyaan seputar jejak digital, privasi data, dan keamanan akun. Setiap jawaban akan disertai penjelasan agar kamu bisa belajar sambil bermain.</p>
            <div className="info-row">
              <div className="info-chip">📝 15 soal</div>
              <div className="info-chip">⏱ Timer per soal</div>
              <div className="info-chip">⭐ Poin jawaban benar</div>
            </div>
            <p className="conn" style={{ color: msg?.error ? '#b4233b' : undefined }} aria-live="polite">
              {msg?.text || DEFAULT_MSG}
            </p>
            <button className="start-btn" onClick={start} disabled={loading}>
              {loading ? 'Menghubungkan ke database...' : failedStart ? 'Coba lagi' : 'Mulai Kuis →'}
            </button>
          </section>
        )}

        {/* ===== Soal ===== */}
        {phase === 'quiz' && q && (
          <section>
            <div className="topline">
              <div className="question-count">Soal {index + 1} dari {questions.length}</div>
              <div className="pill timer">{mmss(timeLeft)}</div>
              <div className="pill streak">Streak x{streak}</div>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

            <div className="question-card">
              <div className="case-label">{q.cat}</div>
              <h1>{q.q}</h1>
            </div>

            <div className="answers">
              {q.options.map((o) => (
                <button key={o.id} className={answerClass(o)} disabled={status !== 'open'} onClick={() => choose(o.id)}>
                  {o.label}. {o.text}
                </button>
              ))}
            </div>

            {msg?.error && <p className="err" role="alert">{msg.text}</p>}

            {done && (
              <div className={`feedback show ${answer.isRight ? 'good' : 'bad'}`} aria-live="polite">
                <strong>
                  {answer.timeout ? 'Waktu habis!' : answer.isRight ? `Benar! +${meta.points} poin` : 'Belum tepat!'}
                </strong>
                <p>{feedbackText()}</p>
                <div className="actions">
                  <span className="small-note">Total sementara: {score} poin</span>
                  <button className="next-btn" onClick={next} disabled={saving}>
                    {saving ? 'Menyimpan hasil...' : saveFailed ? 'Coba simpan lagi' : isLast ? 'Lihat hasil →' : 'Soal berikutnya →'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== Hasil ===== */}
        {phase === 'result' && result && (
          <section className="result">
            <div className="case-label">HASIL KUIS</div>
            <h1>
              {pct >= 80 ? 'Hebat! Kamu makin sadar privasi digital.'
                : pct >= 60 ? 'Bagus! Terus tingkatkan kebiasaan amanmu.'
                : 'Yuk, pelajari lagi cara menjaga jejak digital.'}
            </h1>
            <p>
              {pct >= 80
                ? 'Pemahamanmu sudah baik. Pertahankan kebiasaan menjaga data pribadi dan tetap waspada saat beraktivitas online.'
                : 'Tidak apa-apa, kuis ini adalah kesempatan untuk belajar. Baca kembali materi JejakDigital dan coba lagi.'}
            </p>
            <div className="score">{result.score} poin</div>
            <div className="result-grid">
              <div className="stat"><b>{result.correct_answers}/{result.total_questions}</b><span>Jawaban benar</span></div>
              <div className="stat"><b>{pct}%</b><span>Akurasi</span></div>
              <div className="stat"><b>{result.best_streak}</b><span>Streak terbaik</span></div>
            </div>
            <button className="restart-btn" onClick={restart}>Ulangi Kuis ↻</button>
          </section>
        )}
      </main>
    </div>
  )
}

/* ============ GAYA (semua di-scope ke .kz supaya tidak bocor ke halaman lain) ============ */
const CSS = `
.kz{
  --ink:#17243b; --muted:#65738b; --teal:#0c7778; --teal-dark:#075d60; --accent:#0c7778;
  --page:#f5f7fb; --card:#fff; --chip:#f1f4f8; --stat:#f2f5f8; --track:#dfe5ee; --title:#101d32;
  --label:#5142d9; --fb-text:#34435b; --shadow:0 8px 24px #2436530d;
  --green-bg:#e9fbf1; --green-tx:#08724c; --red-bg:#fff0f1; --red-tx:#a52d45;
  --timer-bg:#fff0c8; --timer-tx:#9c4d12; --streak-bg:#d8f4f0; --streak-tx:#087a75;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);
}
:root[data-theme="dark"] .kz{
  --ink:#F1F6FC; --muted:#B8C7DC; --accent:#34D399;
  --page:#0C2447; --card:#10325F; --chip:#17407A; --stat:#17407A; --track:#24497D; --title:#F1F6FC;
  --label:#A99BFF; --fb-text:#D5E0EE; --shadow:0 8px 24px #00000040;
  --green-bg:#0F4A45; --green-tx:#6EE7B7; --red-bg:#4D1F26; --red-tx:#FF9B9B;
  --timer-bg:#4A3510; --timer-tx:#FBBF77; --streak-bg:#0F4A45; --streak-tx:#6EE7B7;
}
.kz *{box-sizing:border-box}
.kz .app{width:min(100%,760px);min-height:calc(100vh - 77px);margin:0 auto;background:var(--page);box-shadow:0 2px 12px #17243b12;padding:28px 22px 30px;display:flex;flex-direction:column;text-align:left}
.kz .topline{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px;font-weight:750}
.kz .question-count{font-size:17px}
.kz .pill{border-radius:999px;padding:7px 14px;font-weight:800;font-size:15px;white-space:nowrap}
.kz .timer{background:var(--timer-bg);color:var(--timer-tx)}
.kz .streak{background:var(--streak-bg);color:var(--streak-tx)}
.kz .progress-track{height:8px;border-radius:99px;background:var(--track);overflow:hidden;margin-bottom:17px}
.kz .progress-fill{height:100%;width:0;background:var(--teal);border-radius:99px;transition:width .25s}
:root[data-theme="dark"] .kz .progress-fill{background:var(--accent)}
.kz .case-label{font-size:13px;letter-spacing:.02em;font-weight:800;color:var(--label);margin-bottom:9px;text-transform:uppercase}
.kz .question-card{background:var(--card);border-radius:22px;padding:22px 21px 20px;box-shadow:var(--shadow);margin-bottom:15px}
.kz .question-card h1{font-size:clamp(19px,3.4vw,23px);line-height:1.35;margin:0;font-weight:800;color:var(--title)}
.kz .answers{display:grid;gap:13px}
.kz .answer{width:100%;border:0;border-radius:16px;min-height:55px;padding:14px 18px;text-align:left;color:#fff;font:inherit;font-size:16px;font-weight:750;cursor:pointer;transition:transform .12s,filter .12s}
.kz .answer:hover:not(:disabled){filter:brightness(.97);transform:translateY(-1px)}
.kz .answer:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.kz .answer:nth-child(1){background:#0d7778}
.kz .answer:nth-child(2){background:#948ce0}
.kz .answer:nth-child(3){background:#d5a078}
.kz .answer:nth-child(4){background:#d97997}
.kz .answer:disabled{cursor:default;opacity:.78}
.kz .answer.correct{background:#0d7778;opacity:1;outline:3px solid var(--ink);outline-offset:-3px}
.kz .answer.wrong{background:#c94d62;opacity:1}
.kz .err{margin:14px 0 0;font-size:13px;color:#b4233b}
:root[data-theme="dark"] .kz .err{color:#FF9B9B}
.kz .feedback{margin-top:auto;padding:16px;border-radius:18px;min-height:100px}
.kz .answers + .feedback,.kz .err + .feedback{margin-top:16px}
.kz .feedback.good{background:var(--green-bg);color:var(--green-tx)}
.kz .feedback.bad{background:var(--red-bg);color:var(--red-tx)}
.kz .feedback strong{display:block;font-size:17px;margin-bottom:6px}
.kz .feedback p{margin:0;color:var(--fb-text);line-height:1.5;font-size:14px}
.kz .actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px}
.kz .small-note{font-size:12px;color:var(--muted)}
.kz .next-btn,.kz .restart-btn{border:0;border-radius:12px;padding:12px 20px;background:var(--teal);color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.kz .next-btn:hover:not(:disabled),.kz .restart-btn:hover{background:var(--teal-dark)}
.kz .next-btn:disabled{opacity:.45;cursor:not-allowed}
.kz .welcome,.kz .result{background:var(--card);border-radius:22px;padding:26px;box-shadow:var(--shadow)}
.kz .welcome h1,.kz .result h1{font-size:29px;line-height:1.15;margin:0 0 12px;color:var(--title)}
.kz .welcome p,.kz .result p{color:var(--muted);line-height:1.6}
.kz .info-row{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 22px}
.kz .info-chip{background:var(--chip);padding:9px 12px;border-radius:10px;font-size:13px;font-weight:700}
.kz .conn{font-size:12px;margin:0 0 14px}
.kz .start-btn{border:0;background:var(--teal);color:#fff;border-radius:13px;padding:14px 20px;font:inherit;font-size:16px;font-weight:800;cursor:pointer;width:100%}
.kz .start-btn:hover:not(:disabled){background:var(--teal-dark)}
.kz .start-btn:disabled{opacity:.7;cursor:default}
.kz .result{text-align:center;margin:auto 0}
.kz .score{font-size:48px;font-weight:900;color:var(--accent);margin:12px 0}
.kz .result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:20px 0}
.kz .stat{background:var(--stat);border-radius:13px;padding:13px 8px}
.kz .stat b{display:block;font-size:21px}
.kz .stat span{font-size:12px;color:var(--muted)}
@media(min-width:600px){.kz .app{padding:34px 28px}.kz .question-card{padding:24px}.kz .answer{min-height:57px}}
@media(max-width:380px){.kz .app{padding:20px 14px}.kz .pill{font-size:13px;padding:7px 10px}.kz .question-count{font-size:15px}.kz .answer{font-size:14px}}
@media(prefers-reduced-motion:reduce){.kz *{transition:none!important}}
`