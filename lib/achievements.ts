// Pure computation, safe from Client or Server Components — badges are
// derived on the fly from data already being fetched for the dashboard, no
// extra table/query needed.
import { daysSince } from "@/lib/format";

export type Achievement = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
};

export type AchievementInput = {
  joinDate: string;
  isCommandStaff: boolean;
  isInstructor: boolean;
  quizAttempts: { score: number; total: number }[];
  attendanceStreak: number;
  contractsCount: number;
  inventoryCount: number;
};

export function computeAchievements(input: AchievementInput): Achievement[] {
  const tenureDays = daysSince(input.joinDate);
  const avgScorePct =
    input.quizAttempts.length > 0
      ? (input.quizAttempts.reduce((sum, q) => sum + (q.total > 0 ? q.score / q.total : 0), 0) /
          input.quizAttempts.length) *
        100
      : 0;

  return [
    {
      id: "veterano",
      emoji: "🎖️",
      label: "Veterano",
      description: "6 meses o más en el clan.",
      earned: tenureDays >= 180,
    },
    {
      id: "decano",
      emoji: "🏛️",
      label: "Decano",
      description: "1 año o más en el clan.",
      earned: tenureDays >= 365,
    },
    {
      id: "estudioso",
      emoji: "📚",
      label: "Estudioso",
      description: "5 quizzes o más rendidos.",
      earned: input.quizAttempts.length >= 5,
    },
    {
      id: "sabio",
      emoji: "🧠",
      label: "Sabio",
      description: "Promedio de 90%+ en al menos 3 quizzes.",
      earned: input.quizAttempts.length >= 3 && avgScorePct >= 90,
    },
    {
      id: "racha",
      emoji: "🔥",
      label: "Racha de hierro",
      description: "5 eventos oficiales seguidos con asistencia real.",
      earned: input.attendanceStreak >= 5,
    },
    {
      id: "contratista",
      emoji: "📜",
      label: "Contratista",
      description: "Participó en 5 contratos o más.",
      earned: input.contractsCount >= 5,
    },
    {
      id: "arsenal",
      emoji: "🎒",
      label: "Arsenal propio",
      description: "5 ítems o más en el inventario.",
      earned: input.inventoryCount >= 5,
    },
    {
      id: "instructor",
      emoji: "🎯",
      label: "Instructor",
      description: "Forma parte del cuerpo de instructores.",
      earned: input.isInstructor,
    },
    {
      id: "mando",
      emoji: "⭐",
      label: "Mando",
      description: "Forma parte de la plana de mando.",
      earned: input.isCommandStaff,
    },
  ];
}
