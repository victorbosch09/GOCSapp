import { GocsWordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gocs-carbon px-4 py-16">
      <GocsWordmark />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
