import { HeaderSkeleton, ListSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
