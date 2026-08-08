"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RosterEntry } from "@/types/database";

function OperatorChip({ r }: { r: RosterEntry }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-sm">
      <Avatar size="sm">
        {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.callsign} />}
        <AvatarFallback>{r.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">
          {r.callsign}
          {r.is_command_staff && <span className="ml-1.5 text-xs text-gocs-red">Mando</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {r.rank_abbreviation ?? r.rank_name ?? "Sin rango"}
        </p>
      </div>
    </div>
  );
}

export function RosterSearch({ roster }: { roster: RosterEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (r) =>
        r.callsign.toLowerCase().includes(q) ||
        (r.squad ?? "").toLowerCase().includes(q) ||
        (r.rank_name ?? "").toLowerCase().includes(q)
    );
  }, [roster, query]);

  const bySquad = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();
    for (const r of filtered) {
      const key = r.squad ?? "Sin escuadra";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Sin escuadra") return 1;
      if (b === "Sin escuadra") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por callsign, rango o escuadra..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="escuadras">Por escuadra</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Rango</TableHead>
                <TableHead>Escuadra</TableHead>
                <TableHead className="text-right">Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Avatar size="sm">
                      {r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.callsign} />}
                      <AvatarFallback>{r.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {r.callsign}
                    {r.is_command_staff && (
                      <Badge variant="secondary" className="text-gocs-red">
                        Mando
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.rank_name ?? "—"}
                    {r.rank_abbreviation ? ` (${r.rank_abbreviation})` : ""}
                  </TableCell>
                  <TableCell>{r.squad ?? "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(r.join_date)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="escuadras">
          {bySquad.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bySquad.map(([squad, members]) => (
                <Card key={squad}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-base">{squad}</CardTitle>
                    <CardDescription>
                      {members.length} operador{members.length === 1 ? "" : "es"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5">
                    {members.map((m) => (
                      <OperatorChip key={m.id} r={m} />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
