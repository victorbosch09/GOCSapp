-- ============================================================
-- Migration 42: Rank bonus multipliers, updated wages,
-- insurance recurring expenses, weapon rentals system
-- ============================================================

-- ── 1. Add bonus_multiplier column to ranks ──────────────────
ALTER TABLE public.ranks
  ADD COLUMN IF NOT EXISTS bonus_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00;

-- ── 2. Update wages & multipliers per Manual Económico 2026 ──
-- Identify ranks by abbreviation (case-insensitive)

UPDATE public.ranks SET weekly_wage =   750, bonus_multiplier = 0.80 WHERE abbreviation ILIKE 'ASP'  OR abbreviation ILIKE 'CAND';
UPDATE public.ranks SET weekly_wage =  1050, bonus_multiplier = 1.00 WHERE abbreviation ILIKE 'ON-1' OR abbreviation ILIKE 'CAN';
UPDATE public.ranks SET weekly_wage =  1400, bonus_multiplier = 1.30 WHERE abbreviation ILIKE 'ON-2';
UPDATE public.ranks SET weekly_wage =  2000, bonus_multiplier = 1.60 WHERE abbreviation ILIKE 'ON-S';
UPDATE public.ranks SET weekly_wage =  2500, bonus_multiplier = 1.80 WHERE abbreviation ILIKE 'EN-1';
UPDATE public.ranks SET weekly_wage =  3000, bonus_multiplier = 2.00 WHERE abbreviation ILIKE 'EN-2';
UPDATE public.ranks SET weekly_wage =  4000, bonus_multiplier = 2.20 WHERE abbreviation ILIKE 'EN-S' OR abbreviation ILIKE 'EN-3';
UPDATE public.ranks SET weekly_wage =  5000, bonus_multiplier = 2.30 WHERE abbreviation ILIKE 'LE'   OR abbreviation ILIKE 'L-E' OR abbreviation ILIKE 'LP' AND sort_order < 100;
UPDATE public.ranks SET weekly_wage =  6250, bonus_multiplier = 2.40 WHERE abbreviation ILIKE 'LP-1' OR abbreviation ILIKE 'L-P';
UPDATE public.ranks SET weekly_wage =  8500, bonus_multiplier = 2.45 WHERE abbreviation ILIKE 'DOCS';
UPDATE public.ranks SET weekly_wage = 12000, bonus_multiplier = 2.50 WHERE abbreviation ILIKE 'DECS';

-- ── 3. Insurance plans as recurring expenses ──────────────────
-- Remove old generic insurance entry if present
DELETE FROM public.recurring_expenses
  WHERE name ILIKE '%seguro%' AND name NOT ILIKE '%operador%' AND name NOT ILIKE '%premium%';

INSERT INTO public.recurring_expenses
  (name, description, category, base_amount, scales_with, scale_rate, frequency, is_active, sort_order)
VALUES
  ('Seguro Básico',
   'Cobertura básica: atención médica inicial, estabilización y reposición parcial de equipo. Destinado a candidatos y personal en etapa inicial.',
   'Seguro', 0, 'soldiers', 75, 'weekly', true, 1),
  ('Seguro de Operador',
   'Cobertura táctica: evacuación operacional, reposición de equipo reglamentario, rehabilitación e indemnización ampliada. Personal operativo regular.',
   'Seguro', 0, 'soldiers', 125, 'weekly', true, 2),
  ('Seguro Premium',
   'Cobertura total: evacuación prioritaria, atención avanzada, reposición ampliada y protección adicional para operaciones de alto riesgo.',
   'Seguro', 0, 'soldiers', 200, 'weekly', false, 3)
ON CONFLICT DO NOTHING;

-- ── 4. Weapon rentals table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weapon_rentals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lent_by_id    UUID NOT NULL REFERENCES public.profiles(id),
  item_name     TEXT NOT NULL,
  item_category TEXT NOT NULL DEFAULT 'weapons',  -- weapons / vehicles / equipment / accessories
  notes         TEXT,
  rented_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  returned_at   TIMESTAMPTZ,
  rental_fee    INT NOT NULL DEFAULT 0,           -- optional deposit/fee in credits
  status        TEXT NOT NULL DEFAULT 'active'    -- active / returned / expired
    CHECK (status IN ('active', 'returned', 'expired'))
);

CREATE INDEX IF NOT EXISTS weapon_rentals_profile_idx ON public.weapon_rentals(profile_id);
CREATE INDEX IF NOT EXISTS weapon_rentals_status_idx  ON public.weapon_rentals(status);

-- Auto-expire rentals whose expires_at has passed (checked via status computed at query time;
-- for real-time updates, a cron or server-side check is used instead of DB triggers)

-- RLS: command staff only
ALTER TABLE public.weapon_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weapon_rentals_staff_all"
  ON public.weapon_rentals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND is_command_staff = true
    )
  );

CREATE POLICY "weapon_rentals_own_read"
  ON public.weapon_rentals
  FOR SELECT
  USING (profile_id = auth.uid());
