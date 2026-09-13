"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (score: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="cursor-pointer transition-transform hover:scale-110"
          aria-label={`${n} de 5`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= shown ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            className={cn(n <= shown ? "text-gocs-red" : "text-muted-foreground")}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function StaticStars({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={n <= score ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          className={n <= score ? "text-gocs-red" : "text-muted-foreground/40"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}
