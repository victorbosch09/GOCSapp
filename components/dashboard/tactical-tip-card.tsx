import { getTodayTip } from "@/lib/tactical-tips";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function TacticalTipCard() {
  const tip = getTodayTip();
  return (
    <Card className="border-gocs-red/30">
      <CardHeader className="pb-2">
        <CardDescription>Consejo táctico del día</CardDescription>
        <CardTitle className="font-heading text-base">{tip.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{tip.body}</p>
      </CardContent>
    </Card>
  );
}
