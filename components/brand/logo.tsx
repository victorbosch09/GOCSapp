import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function GocsPatch({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/gocs-patch.png"
      alt="Escudo G.O.C.S."
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}

export function GocsWordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <GocsPatch size={34} />
      <span className="font-heading text-sm leading-tight tracking-widest text-foreground">
        G.O.C.S.
      </span>
    </Link>
  );
}
