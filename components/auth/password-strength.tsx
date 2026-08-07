"use client";

function scorePassword(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const meetsMinimum = password.length >= 8 && hasLetter && hasNumber;

  let score = 0;
  if (password.length >= 8) score++;
  if (hasLetter && hasNumber) score++;
  if (hasSpecial || hasMixedCase) score++;
  if (password.length >= 12) score++;

  if (!meetsMinimum) return { score: 1, label: "Débil — mínimo 8 caracteres, letra y número", color: "bg-destructive" };
  if (score <= 2) return { score: 2, label: "Aceptable", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Buena", color: "bg-emerald-500" };
  return { score: 4, label: "Muy fuerte", color: "bg-emerald-400" };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = scorePassword(password);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= score ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
