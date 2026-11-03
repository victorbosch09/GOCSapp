-- Update promotion requirements for all ranks
-- Matches by abbreviation (case-insensitive). Adjust if abbreviations differ in your DB.

-- ASP → CAN: 4 asistencias a días oficiales
UPDATE public.ranks SET
  promotion_requirement = '4 asistencias a días oficiales.',
  requirements_json = '{"attendance_days": 4}'::jsonb
WHERE abbreviation ILIKE 'CAN';

-- CAN → ON-1: Módulos 1-4 + 8 asistencias
UPDATE public.ranks SET
  promotion_requirement = 'Módulos 1 al 4 y 8 asistencias obligatorias a días oficiales.',
  requirements_json = '{"modules": [1,2,3,4], "attendance_days": 8}'::jsonb
WHERE abbreviation ILIKE 'ON-1';

-- ON-1 → ON-2: Módulos 1-8 + 16 asistencias
UPDATE public.ranks SET
  promotion_requirement = 'Módulos 1 al 8 y 16 asistencias obligatorias a días oficiales.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8], "attendance_days": 16}'::jsonb
WHERE abbreviation ILIKE 'ON-2';

-- ON-2 → ON-S: Módulos 1-12 + 25 asistencias
UPDATE public.ranks SET
  promotion_requirement = 'Módulos 1 al 12 y 25 asistencias obligatorias a días oficiales.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25}'::jsonb
WHERE abbreviation ILIKE 'ON-S';

-- ON-S → EN-1: Requisitos ON-S + 1 curso especializado + 4 días de misión de prueba
UPDATE public.ranks SET
  promotion_requirement = 'Todos los requisitos de ON-S, más 1 curso de rol especializado y 4 días de misión de prueba con la especialidad.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25, "specialty_courses": 1, "mission_days": 4}'::jsonb
WHERE abbreviation ILIKE 'EN-1';

-- EN-1 → EN-2
UPDATE public.ranks SET
  promotion_requirement = 'Todos los requisitos de EN-1, más evaluación de desempeño en misiones de especialidad.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25, "specialty_courses": 1, "mission_days": 4}'::jsonb
WHERE abbreviation ILIKE 'EN-2';

-- EN-2 → EN-3
UPDATE public.ranks SET
  promotion_requirement = 'Todos los requisitos de EN-2, más evaluación avanzada de especialidad por el mando.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25, "specialty_courses": 1, "mission_days": 4}'::jsonb
WHERE abbreviation ILIKE 'EN-3';

-- EN-3 → LP (Líder de Equipo): +30 contratos + cursos especializados + curso de liderazgo
UPDATE public.ranks SET
  promotion_requirement = 'Todos los requisitos de EN-3, más 30 contratos realizados, cursos de rol especializado y Curso Líder de Equipo.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25, "specialty_courses": 1, "mission_days": 4, "contracts": 30, "leadership_course": "Curso Líder de Equipo"}'::jsonb
WHERE abbreviation ILIKE 'LP' OR abbreviation ILIKE 'L-E' OR abbreviation ILIKE 'LE';

-- LP → LS (Líder de Pelotón): +50 contratos + cursos de liderazgo, mando y RTO
UPDATE public.ranks SET
  promotion_requirement = 'Todos los requisitos de LP, más 50 contratos, Curso Líder de Escuadra, curso de mando y RTO. No se puede postular directamente — asignación por el Alto Mando.',
  requirements_json = '{"modules": [1,2,3,4,5,6,7,8,9,10,11,12], "attendance_days": 25, "specialty_courses": 1, "mission_days": 4, "contracts": 50, "leadership_course": "Curso Líder de Escuadra", "requires_vote": true, "note": "Asignación exclusiva por el Alto Mando."}'::jsonb
WHERE abbreviation ILIKE 'LP-1' OR abbreviation ILIKE 'LS' OR abbreviation ILIKE 'L-P';

-- Ranks above squad leader: no direct application
UPDATE public.ranks SET
  promotion_requirement = 'Designación exclusiva por el Alto Mando. No se puede postular.',
  requirements_json = '{"requires_vote": true, "note": "Designación exclusiva por el Alto Mando."}'::jsonb
WHERE abbreviation ILIKE 'B-1' OR abbreviation ILIKE 'DECS' OR abbreviation ILIKE 'DG'
   OR abbreviation ILIKE 'CAP' OR abbreviation ILIKE 'MAY' OR abbreviation ILIKE 'TEN'
   OR abbreviation ILIKE 'SGT' OR abbreviation ILIKE 'OC' OR abbreviation ILIKE 'C-1';
