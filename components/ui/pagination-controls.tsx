"use client";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
  totalLabel,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalLabel?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      {totalLabel && <span className="text-muted-foreground">{totalLabel}</span>}
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          Página {page} de {pageCount}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
