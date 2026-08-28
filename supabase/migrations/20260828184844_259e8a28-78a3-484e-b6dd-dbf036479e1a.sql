-- Documents
CREATE TABLE public.ak_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  file_name text,
  mime_type text,
  storage_path text,
  size_bytes bigint,
  extracted_text text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ak_documents TO authenticated;
GRANT ALL ON public.ak_documents TO service_role;
ALTER TABLE public.ak_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_documents own" ON public.ak_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quizzes
CREATE TABLE public.ak_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid REFERENCES public.ak_documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  language text NOT NULL DEFAULT 'ar',
  difficulty text NOT NULL DEFAULT 'medium',
  question_count integer NOT NULL DEFAULT 10,
  type_mix jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_prompt text,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ak_quizzes TO authenticated;
GRANT ALL ON public.ak_quizzes TO service_role;
ALTER TABLE public.ak_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_quizzes own" ON public.ak_quizzes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Questions
CREATE TABLE public.ak_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.ak_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text,
  explanation text,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ak_questions TO authenticated;
GRANT ALL ON public.ak_questions TO service_role;
ALTER TABLE public.ak_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_questions own" ON public.ak_questions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Attempts
CREATE TABLE public.ak_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.ak_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ak_attempts TO authenticated;
GRANT ALL ON public.ak_attempts TO service_role;
ALTER TABLE public.ak_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_attempts own" ON public.ak_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Answers
CREATE TABLE public.ak_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.ak_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.ak_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer_text text,
  is_correct boolean,
  score numeric NOT NULL DEFAULT 0,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ak_answers TO authenticated;
GRANT ALL ON public.ak_answers TO service_role;
ALTER TABLE public.ak_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_answers own" ON public.ak_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ak_documents_user_idx ON public.ak_documents(user_id, created_at DESC);
CREATE INDEX ak_quizzes_user_idx ON public.ak_quizzes(user_id, created_at DESC);
CREATE INDEX ak_questions_quiz_idx ON public.ak_questions(quiz_id, order_index);
CREATE INDEX ak_attempts_quiz_idx ON public.ak_attempts(quiz_id, created_at DESC);
CREATE INDEX ak_answers_attempt_idx ON public.ak_answers(attempt_id);

CREATE TRIGGER ak_documents_updated BEFORE UPDATE ON public.ak_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ak_quizzes_updated BEFORE UPDATE ON public.ak_quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ak_questions_updated BEFORE UPDATE ON public.ak_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ak_attempts_updated BEFORE UPDATE ON public.ak_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ak_answers_updated BEFORE UPDATE ON public.ak_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();