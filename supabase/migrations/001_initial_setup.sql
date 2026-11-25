-- JejakDigital: Supabase database setup
-- Jalankan seluruh script ini di Supabase Dashboard > SQL Editor > New query.
-- Desain ini mendukung kuis publik tanpa login. Kunci jawaban tidak diekspos melalui view publik.

create extension if not exists pgcrypto;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_published boolean not null default false,
  time_limit_seconds integer not null default 20 check (time_limit_seconds > 0),
  points_per_correct integer not null default 120 check (points_per_correct >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_number integer not null check (question_number > 0),
  category text not null,
  question_text text not null,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, question_number)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_label text not null check (option_label in ('A','B','C','D')),
  option_text text not null,
  is_correct boolean not null default false,
  unique (question_id, option_label),
  unique (question_id, id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  total_questions integer not null,
  correct_answers integer not null,
  score integer not null,
  accuracy numeric(5,2) not null,
  best_streak integer not null default 0,
  completed_at timestamptz not null default now()
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_questions_quiz_number
  on public.questions(quiz_id, question_number);
create index if not exists idx_options_question
  on public.question_options(question_id);
create index if not exists idx_attempts_quiz_score
  on public.quiz_attempts(quiz_id, score desc, completed_at desc);
create index if not exists idx_attempt_answers_attempt
  on public.attempt_answers(attempt_id);

-- Seed quiz utama. ON CONFLICT mencegah duplikasi bila script dijalankan ulang.
insert into public.quizzes (title, description, is_published, time_limit_seconds, points_per_correct)
select
  'Kuis Kesadaran Jejak Digital',
  'Kuis edukasi tentang jejak digital, privasi data, dan keamanan akun.',
  true, 20, 120
where not exists (
  select 1 from public.quizzes where title = 'Kuis Kesadaran Jejak Digital'
);

-- Seed 15 soal dan pilihan jawaban.
do $$
declare
  v_quiz_id uuid;
  v_question_id uuid;
  r record;
  v_options text[][];
  i integer;
begin
  select id into v_quiz_id
  from public.quizzes
  where title = 'Kuis Kesadaran Jejak Digital'
  limit 1;

  for r in
    select * from (values
      (1,'DASAR JEJAK DIGITAL','Apa yang dimaksud dengan jejak digital?','Jejak digital mencakup data yang tertinggal dari aktivitas internet, seperti postingan, komentar, pencarian, lokasi, dan data yang diisi pada aplikasi.','Data yang tertinggal saat seseorang menggunakan internet','File yang hanya tersimpan di komputer pribadi','Aplikasi yang dipasang pada ponsel','Pesan yang otomatis terhapus setelah dibaca','A'),
      (2,'JENIS JEJAK DIGITAL','Manakah contoh jejak digital aktif?','Jejak digital aktif berasal dari tindakan yang sengaja dilakukan pengguna, misalnya membuat postingan, menulis komentar, atau mengisi formulir online.','Cookies yang tersimpan saat membuka situs','Alamat IP yang terekam oleh layanan','Komentar yang sengaja ditulis di media sosial','Riwayat aktivitas yang dicatat otomatis','C'),
      (3,'JENIS JEJAK DIGITAL','Manakah contoh jejak digital pasif?','Jejak digital pasif terekam tanpa disadari secara langsung oleh pengguna. Contohnya cookies, alamat IP, lokasi, dan riwayat browsing.','Mengunggah foto liburan','Menulis ulasan produk','Membagikan alamat rumah','Cookies dan alamat IP yang terekam saat mengakses internet','D'),
      (4,'PRIVASI DATA','Apa arti privasi data bagi seorang pengguna internet?','Privasi data adalah hak pengguna untuk mengontrol siapa yang boleh mengakses, memakai, dan menyimpan data pribadinya.','Kebebasan menyebarkan semua informasi pribadi','Hak untuk mengontrol siapa yang dapat mengakses dan menggunakan data pribadi','Hak untuk melihat seluruh data milik pengguna lain','Cara agar semua aktivitas internet tidak tercatat','B'),
      (5,'KASUS 2021 · BPJS KESEHATAN','Data peserta BPJS Kesehatan diklaim bocor dan dijual di forum peretas. Apa risiko utama bagi korban?','Data identitas dan kontak dapat dimanfaatkan untuk penipuan atau pencurian identitas. Dokumen JejakDigital mencatat angka sekitar 279 juta sebagai klaim yang perlu diverifikasi.','Baterai ponsel cepat habis','Sinyal internet menjadi lambat','Pencurian identitas dan penipuan','Layar ponsel mengalami kerusakan','C'),
      (6,'RISIKO KEBOCORAN DATA','Penipu menghubungi korban menggunakan data pribadi asli agar pesannya terlihat meyakinkan. Tindakan ini termasuk contoh ...','Phishing dan social engineering memanfaatkan manipulasi serta informasi tertentu untuk membuat korban percaya dan menyerahkan informasi atau melakukan tindakan berisiko.','Phishing atau social engineering','Optimasi mesin pencari','Kompresi data','Pembaruan sistem operasi','A'),
      (7,'KEAMANAN AKUN','Apa praktik terbaik untuk membuat kata sandi akun yang lebih aman?','Kata sandi yang kuat dan berbeda untuk setiap akun mengurangi risiko ketika salah satu akun mengalami kebocoran. Password manager dapat membantu menyimpannya.','Menggunakan tanggal lahir agar mudah diingat','Menggunakan kata sandi yang sama di semua akun','Membagikan kata sandi kepada teman dekat','Menggunakan kata sandi kuat dan unik untuk setiap akun','D'),
      (8,'KEAMANAN AKUN','Apa fungsi utama verifikasi dua langkah (2FA)?','2FA menambahkan tahap verifikasi ketika pengguna masuk ke akun. Jadi, kata sandi saja tidak menjadi satu-satunya lapisan perlindungan.','Mengganti nama pengguna secara otomatis','Menambahkan lapisan verifikasi selain kata sandi','Menghapus seluruh riwayat pencarian','Membuat koneksi internet lebih cepat','B'),
      (9,'KEAMANAN INFORMASI','Kamu menerima pesan berisi tautan hadiah yang meminta kode OTP. Apa tindakan paling aman?','OTP bersifat rahasia. Jangan pernah membagikannya kepada orang lain. Periksa informasi melalui aplikasi atau kanal resmi penyedia layanan.','Segera mengirimkan OTP agar hadiah tidak hangus','Meneruskan tautan ke semua kontak','Tidak membagikan OTP dan memeriksa kebenaran pesan melalui kanal resmi','Membalas pesan dengan data pribadi lain','C'),
      (10,'PRIVASI MEDIA SOSIAL','Saat mengunggah foto tiket perjalanan, informasi apa yang sebaiknya tidak ditampilkan secara terbuka?','Nomor pemesanan dan kode tiket dapat memuat informasi yang bisa disalahgunakan. Hindari membagikan tiket dan lokasi real-time secara sembarangan.','Nomor pemesanan dan kode tiket','Warna latar belakang foto','Jenis filter yang digunakan','Nama aplikasi edit foto','A'),
      (11,'IZIN APLIKASI','Sebuah aplikasi sederhana meminta akses lokasi, kamera, dan kontak. Apa yang sebaiknya kamu lakukan?','Batasi izin aplikasi sesuai kebutuhan. Akses lokasi, kamera, dan kontak sebaiknya diberikan hanya jika relevan dengan fungsi aplikasi.','Menyetujui semua izin tanpa membaca','Memeriksa apakah setiap izin memang diperlukan oleh fitur aplikasi','Memberikan izin karena aplikasi tersedia di toko resmi','Mengirim daftar kontak kepada pengembang','B'),
      (12,'JARINGAN INTERNET','Saat terhubung ke Wi-Fi publik, tindakan apa yang dianjurkan untuk mengurangi risiko?','Hindari Wi-Fi publik ketika melakukan transaksi penting, atau gunakan VPN sebagai langkah perlindungan tambahan.','Melakukan semua transaksi penting tanpa pemeriksaan','Menggunakan kata sandi yang sama untuk semua layanan','Membagikan akses hotspot kepada siapa saja','Menghindari transaksi penting atau menggunakan VPN','D'),
      (13,'PENCEGAHAN KEBOCORAN','Mengapa pengguna perlu menghapus atau menonaktifkan akun lama yang sudah tidak digunakan?','Akun lama yang tidak digunakan dapat tetap menyimpan data pribadi. Menghapus akun yang tidak diperlukan membantu mengurangi paparan data.','Agar semua akun baru otomatis aman','Untuk mengurangi jumlah akun dan data pribadi yang masih tersimpan pada layanan','Supaya alamat IP tidak pernah tercatat','Agar perangkat tidak membutuhkan pembaruan','B'),
      (14,'PERLINDUNGAN DATA','Jika mengetahui akunmu mungkin terdampak kebocoran data, langkah awal yang tepat adalah ...','Segera ganti kata sandi jika ada indikasi kebocoran. Aktifkan 2FA dan periksa aktivitas akun yang mencurigakan.','Mengabaikan pemberitahuan tersebut','Menggunakan kembali kata sandi lama','Segera mengganti kata sandi dan mengamankan akun','Menyebarkan informasi login untuk meminta bantuan','C'),
      (15,'PERLINDUNGAN DATA','Peraturan Indonesia yang disebut dalam materi sebagai dasar pelindungan data pribadi adalah ...','Materi JejakDigital menyebut UU Pelindungan Data Pribadi Nomor 27 Tahun 2022 sebagai salah satu dasar pengelolaan data pribadi oleh institusi.','UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi','UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional','UU No. 22 Tahun 2009 tentang Lalu Lintas','UU No. 8 Tahun 1999 tentang Perlindungan Konsumen','A')
    ) as t(num,cat,q,ex,a,b,c,d,correct)
    order by num
  loop
    -- Jika soal dengan nomor tersebut sudah ada, jangan membuat duplikat.
    select id into v_question_id
    from public.questions
    where quiz_id = v_quiz_id and question_number = r.num;

    if v_question_id is null then
      insert into public.questions (quiz_id, question_number, category, question_text, explanation)
      values (v_quiz_id, r.num, r.cat, r.q, r.ex)
      returning id into v_question_id;

      v_options := array[
        array['A',r.a,case when r.correct='A' then 'true' else 'false' end],
        array['B',r.b,case when r.correct='B' then 'true' else 'false' end],
        array['C',r.c,case when r.correct='C' then 'true' else 'false' end],
        array['D',r.d,case when r.correct='D' then 'true' else 'false' end]
      ];

      for i in 1..4 loop
        insert into public.question_options(question_id, option_label, option_text, is_correct)
        values (v_question_id, v_options[i][1], v_options[i][2], v_options[i][3]::boolean);
      end loop;
    end if;
  end loop;
end $$;

-- View publik: hanya menampilkan isi soal dan opsi, tanpa kolom is_correct.
create or replace view public.published_quizzes as
select id, title, description, time_limit_seconds, points_per_correct
from public.quizzes
where is_published = true;

create or replace view public.public_questions as
select q.id, q.quiz_id, q.question_number, q.category, q.question_text, q.explanation
from public.questions q
join public.quizzes z on z.id = q.quiz_id
where z.is_published = true;

create or replace view public.public_question_options as
select o.id, o.question_id, o.option_label, o.option_text
from public.question_options o
join public.questions q on q.id = o.question_id
join public.quizzes z on z.id = q.quiz_id
where z.is_published = true;

-- RLS aktif. Akses publik diberikan melalui view dan RPC yang dibatasi.
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;

-- Cabut akses langsung ke tabel sumber dari role browser.
revoke all on public.quizzes from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.question_options from anon, authenticated;
revoke all on public.quiz_attempts from anon, authenticated;
revoke all on public.attempt_answers from anon, authenticated;

grant select on public.published_quizzes to anon, authenticated;
grant select on public.public_questions to anon, authenticated;
grant select on public.public_question_options to anon, authenticated;

-- RPC memeriksa jawaban di server, menghitung skor/streak, lalu menyimpan hasil.
create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb,
  p_display_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_total integer;
  v_correct integer := 0;
  v_score integer := 0;
  v_streak integer := 0;
  v_best_streak integer := 0;
  v_attempt_id uuid;
  v_points integer;
  v_item record;
  v_is_correct boolean;
  v_result jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Jawaban harus berupa array JSON.';
  end if;

  select count(*), z.points_per_correct
  into v_total, v_points
  from public.questions q
  join public.quizzes z on z.id = q.quiz_id
  where q.quiz_id = p_quiz_id and z.is_published = true
  group by z.points_per_correct;

  if v_total is null or v_total = 0 then
    raise exception 'Kuis tidak ditemukan atau belum dipublikasikan.';
  end if;

  if jsonb_array_length(p_answers) <> v_total then
    raise exception 'Jumlah jawaban harus sama dengan jumlah soal.';
  end if;

  -- Pastikan setiap soal dijawab tepat satu kali dan opsi milik soal tersebut.
  if (
    select count(distinct x.question_id)
    from jsonb_to_recordset(p_answers) as x(question_id uuid, option_id uuid)
  ) <> v_total then
    raise exception 'Setiap soal harus dijawab tepat satu kali.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as x(question_id uuid, option_id uuid)
    left join public.questions q
      on q.id = x.question_id and q.quiz_id = p_quiz_id
    left join public.question_options o
      on o.id = x.option_id and o.question_id = x.question_id
    where q.id is null or o.id is null
  ) then
    raise exception 'Ada soal atau pilihan jawaban yang tidak valid.';
  end if;

  insert into public.quiz_attempts
    (quiz_id, user_id, display_name, total_questions, correct_answers, score, accuracy, best_streak)
  values
    (p_quiz_id, auth.uid(), nullif(trim(p_display_name), ''), v_total, 0, 0, 0, 0)
  returning id into v_attempt_id;

  for v_item in
    select q.id as question_id, q.question_number, q.explanation,
           o.id as selected_option_id, o.is_correct,
           chosen.option_label as selected_label,
           chosen.option_text as selected_text,
           correct.option_label as correct_label,
           correct.option_text as correct_text
    from jsonb_to_recordset(p_answers) as x(question_id uuid, option_id uuid)
    join public.questions q on q.id = x.question_id and q.quiz_id = p_quiz_id
    join public.question_options o on o.id = x.option_id and o.question_id = q.id
    join public.question_options chosen on chosen.id = x.option_id
    join public.question_options correct on correct.question_id = q.id and correct.is_correct = true
    order by q.question_number
  loop
    v_is_correct := v_item.is_correct;
    if v_is_correct then
      v_correct := v_correct + 1;
      v_score := v_score + v_points;
      v_streak := v_streak + 1;
      v_best_streak := greatest(v_best_streak, v_streak);
    else
      v_streak := 0;
    end if;

    insert into public.attempt_answers
      (attempt_id, question_id, selected_option_id, is_correct)
    values
      (v_attempt_id, v_item.question_id, v_item.selected_option_id, v_is_correct);

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'question_id', v_item.question_id,
      'question_number', v_item.question_number,
      'is_correct', v_is_correct,
      'selected_label', v_item.selected_label,
      'selected_text', v_item.selected_text,
      'correct_label', v_item.correct_label,
      'correct_text', v_item.correct_text,
      'explanation', v_item.explanation
    ));
  end loop;

  update public.quiz_attempts
  set correct_answers = v_correct,
      score = v_score,
      accuracy = round((v_correct::numeric / v_total) * 100, 2),
      best_streak = v_best_streak
  where id = v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'total_questions', v_total,
    'correct_answers', v_correct,
    'score', v_score,
    'accuracy', round((v_correct::numeric / v_total) * 100, 2),
    'best_streak', v_best_streak,
    'answers', v_result
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb, text) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb, text) to anon, authenticated;

-- View ringkasan leaderboard. Nama anonim ditampilkan bila pengguna tidak mengisi nama.
create or replace view public.quiz_leaderboard as
select
  a.id as attempt_id,
  a.quiz_id,
  coalesce(a.display_name, 'Pengguna JejakDigital') as display_name,
  a.score,
  a.correct_answers,
  a.total_questions,
  a.accuracy,
  a.best_streak,
  a.completed_at
from public.quiz_attempts a
join public.quizzes z on z.id = a.quiz_id
where z.is_published = true;

grant select on public.quiz_leaderboard to anon, authenticated;

-- Catatan: leaderboard publik hanya menampilkan nama tampilan dan statistik,
-- bukan email, user_id, atau jawaban individu.
