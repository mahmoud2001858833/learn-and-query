CREATE OR REPLACE FUNCTION public.ak_get_public_quiz(_quiz_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN q.id IS NULL THEN NULL ELSE jsonb_build_object(
    'title', q.title,
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', x.id,
        'type', x.type,
        'prompt', x.prompt,
        'options', x.options,
        'points', x.points
      ) ORDER BY x.order_index)
      FROM public.ak_questions x
      WHERE x.quiz_id = q.id
    ), '[]'::jsonb)
  ) END
  FROM (SELECT 1) seed
  LEFT JOIN public.ak_quizzes q ON q.id = _quiz_id
$$;

REVOKE ALL ON FUNCTION public.ak_get_public_quiz(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ak_get_public_quiz(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ak_save_public_attempt(
  _quiz_id uuid,
  _guest_name text,
  _guest_phone text,
  _results jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt_id uuid;
  _max_score numeric;
  _total_score numeric;
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

  SELECT COALESCE(sum(points), 0) INTO _max_score
  FROM public.ak_questions
  WHERE quiz_id = _quiz_id;

  SELECT COALESCE(sum(
    LEAST(GREATEST(COALESCE((r.value->>'score')::numeric, 0), 0), q.points)
  ), 0) INTO _total_score
  FROM jsonb_each(_results) r
  JOIN public.ak_questions q ON q.id::text = r.key AND q.quiz_id = _quiz_id;

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
    left(COALESCE(r.value->>'answerText', ''), 5000),
    LEAST(GREATEST(COALESCE((r.value->>'score')::numeric, 0), 0), q.points),
    CASE
      WHEN r.value ? 'isCorrect' AND jsonb_typeof(r.value->'isCorrect') = 'boolean'
        THEN (r.value->>'isCorrect')::boolean
      ELSE NULL
    END,
    NULLIF(left(COALESCE(r.value->>'feedback', ''), 5000), '')
  FROM jsonb_each(_results) r
  JOIN public.ak_questions q ON q.id::text = r.key AND q.quiz_id = _quiz_id;

  RETURN _attempt_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ak_save_public_attempt(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ak_save_public_attempt(uuid, text, text, jsonb) TO anon, authenticated, service_role;