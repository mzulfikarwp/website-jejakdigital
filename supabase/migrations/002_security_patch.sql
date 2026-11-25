-- JejakDigital: patch keamanan + feedback kuis
-- Jalankan setelah script jejakdigital_supabase.sql berhasil dijalankan.

-- Hilangkan explanation dari view publik agar pembahasan tidak bisa dibaca sebelum menjawab.
drop view if exists public.public_questions;
create view public.public_questions as
select q.id, q.quiz_id, q.question_number, q.category, q.question_text
from public.questions q
join public.quizzes z on z.id = q.quiz_id
where z.is_published = true;

grant select on public.public_questions to anon, authenticated;

-- Memeriksa jawaban yang baru saja dipilih pengguna dan mengembalikan feedback.
create or replace function public.check_quiz_answer(
  p_question_id uuid,
  p_option_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'is_correct', selected.is_correct,
    'correct_label', correct.option_label,
    'correct_text', correct.option_text,
    'explanation', q.explanation
  )
  into v_result
  from public.questions q
  join public.quizzes z on z.id = q.quiz_id and z.is_published = true
  join public.question_options selected
    on selected.question_id = q.id and selected.id = p_option_id
  join public.question_options correct
    on correct.question_id = q.id and correct.is_correct = true
  where q.id = p_question_id;

  if v_result is null then
    raise exception 'Soal atau pilihan jawaban tidak valid.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.check_quiz_answer(uuid, uuid) from public;
grant execute on function public.check_quiz_answer(uuid, uuid) to anon, authenticated;

-- Mengambil pembahasan dan jawaban benar hanya saat soal habis waktu.
create or replace function public.get_question_feedback(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'is_correct', false,
    'correct_label', correct.option_label,
    'correct_text', correct.option_text,
    'explanation', q.explanation
  )
  into v_result
  from public.questions q
  join public.quizzes z on z.id = q.quiz_id and z.is_published = true
  join public.question_options correct
    on correct.question_id = q.id and correct.is_correct = true
  where q.id = p_question_id;

  if v_result is null then
    raise exception 'Soal tidak ditemukan.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_question_feedback(uuid) from public;
grant execute on function public.get_question_feedback(uuid) to anon, authenticated;

-- Ganti fungsi submit agar jawaban yang kehabisan waktu (option_id = null)
-- tetap bisa disimpan dan dihitung sebagai jawaban salah.
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
    where q.id is null or (x.option_id is not null and o.id is null)
  ) then
    raise exception 'Ada soal atau pilihan jawaban yang tidak valid.';
  end if;

  insert into public.quiz_attempts
    (quiz_id, user_id, display_name, total_questions, correct_answers, score, accuracy, best_streak)
  values
    (p_quiz_id, auth.uid(), nullif(trim(p_display_name), ''), v_total, 0, 0, 0, 0)
  returning id into v_attempt_id;

  for v_item in
    select
      q.id as question_id,
      q.question_number,
      q.explanation,
      chosen.id as selected_option_id,
      coalesce(chosen.is_correct, false) as is_correct,
      chosen.option_label as selected_label,
      chosen.option_text as selected_text,
      correct.option_label as correct_label,
      correct.option_text as correct_text
    from jsonb_to_recordset(p_answers) as x(question_id uuid, option_id uuid)
    join public.questions q on q.id = x.question_id and q.quiz_id = p_quiz_id
    left join public.question_options chosen
      on chosen.id = x.option_id and chosen.question_id = q.id
    join public.question_options correct
      on correct.question_id = q.id and correct.is_correct = true
    order by q.question_number
  loop
    v_is_correct := coalesce(v_item.is_correct, false);

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
