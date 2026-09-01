ALTER TABLE public.ak_questions ADD COLUMN IF NOT EXISTS asset jsonb;

CREATE OR REPLACE FUNCTION public.ak_get_public_quiz(_quiz_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN q.id IS NULL THEN NULL ELSE jsonb_build_object(
    'title', q.title,
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', x.id,
        'type', x.type,
        'prompt', x.prompt,
        'options', x.options,
        'points', x.points,
        'asset', x.asset
      ) ORDER BY x.order_index)
      FROM public.ak_questions x
      WHERE x.quiz_id = q.id
    ), '[]'::jsonb)
  ) END
  FROM (SELECT 1) seed
  LEFT JOIN public.ak_quizzes q ON q.id = _quiz_id
$function$;