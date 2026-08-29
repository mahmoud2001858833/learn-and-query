DROP FUNCTION IF EXISTS public.ak_save_public_attempt(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.ak_submit_public_attempt(
  _quiz_id uuid,
  _guest_name text,
  _guest_phone text,
  _answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt_id uuid;
  _max_score numeric;
  _total_score numeric;
  _results jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ak_quizzes WHERE id = _quiz_id) THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  IF char_length(btrim(_guest_name)) < 3 OR char_length(_guest_name) > 120 THEN
    RAISE EXCEPTION 'Invalid guest name';
  END IF;

  IF char_length(btrim(_guest_phone)) < 7 OR char_length(_guest_phone) > 30 THEN
    RAISE EXCEPTION 'Invalid guest phone';
  END IF;

  WITH graded AS (
    SELECT
      q.id,
      q.points,
      q.correct_answer,
      q.explanation,
      left(COALESCE(_answers->>q.id::text, ''), 5000) AS answer_text,
      lower(regexp_replace(btrim(COALESCE(_answers->>q.id::text, '')), '\s+', ' ', 'g')) =
        lower(regexp_replace(btrim(COALESCE(q.correct_answer, '')), '\s+', ' ', 'g'))
        AND btrim(COALESCE(_answers->>q.id::text, '')) <> '' AS is_correct
    FROM public.ak_questions q
    WHERE q.quiz_id = _quiz_id
  )
  SELECT
    COALESCE(sum(points), 0),
    COALESCE(sum(CASE WHEN is_correct THEN points ELSE 0 END), 0),
    COALESCE(jsonb_object_agg(id::text, jsonb_build_object(
      'score', CASE WHEN is_correct THEN points ELSE 0 END,
      'feedback', NULL,
      'isCorrect', is_correct,
      'correctAnswer', correct_answer,
      'explanation', explanation
    )), '{}'::jsonb)
  INTO _max_score, _total_score, _results
  FROM graded;

  IF _max_score = 0 THEN
    RAISE EXCEPTION 'Quiz has no questions';
  END IF;

  INSERT INTO public.ak_attempts (
    quiz_id, user_id, guest_name, guest_phone, score, max_score, submitted_at
  ) VALUES (
    _quiz_id, NULL, btrim(_guest_name), btrim(_guest_phone), _total_score, _max_score, now()
  ) RETURNING id INTO _attempt_id;

  INSERT INTO public.ak_answers (
    user_id, attempt_id, question_id, answer_text, score, is_correct, feedback
  )
  SELECT
    NULL,
    _attempt_id,
    q.id,
    left(COALESCE(_answers->>q.id::text, ''), 5000),
    CASE WHEN lower(regexp_replace(btrim(COALESCE(_answers->>q.id::text, '')), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(COALESCE(q.correct_answer, '')), '\s+', ' ', 'g')) AND btrim(COALESCE(_answers->>q.id::text, '')) <> '' THEN q.points ELSE 0 END,
    lower(regexp_replace(btrim(COALESCE(_answers->>q.id::text, '')), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(COALESCE(q.correct_answer, '')), '\s+', ' ', 'g')) AND btrim(COALESCE(_answers->>q.id::text, '')) <> '',
    NULL
  FROM public.ak_questions q
  WHERE q.quiz_id = _quiz_id;

  RETURN jsonb_build_object(
    'attemptId', _attempt_id,
    'results', _results,
    'totalScore', _total_score,
    'maxScore', _max_score
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ak_submit_public_attempt(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ak_submit_public_attempt(uuid, text, text, jsonb) TO anon, authenticated, service_role;