ALTER TABLE public.ak_attempts
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text;

ALTER TABLE public.ak_answers ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Quiz owners can view attempts on their quizzes" ON public.ak_attempts;
CREATE POLICY "Quiz owners can view attempts on their quizzes"
ON public.ak_attempts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ak_quizzes q WHERE q.id = ak_attempts.quiz_id AND q.user_id = auth.uid()));

DROP POLICY IF EXISTS "Quiz owners can view answers on their quizzes" ON public.ak_answers;
CREATE POLICY "Quiz owners can view answers on their quizzes"
ON public.ak_answers FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.ak_attempts a
  JOIN public.ak_quizzes q ON q.id = a.quiz_id
  WHERE a.id = ak_answers.attempt_id AND q.user_id = auth.uid()
));