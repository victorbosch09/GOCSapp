"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOwnProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ProfileCard({ bio, avatarUrl }: { bio: string | null; avatarUrl: string | null }) {
  const [editing, setEditing] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [avatarValue, setAvatarValue] = useState(avatarUrl ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Mi perfil</CardDescription>
        <CardTitle className="font-heading text-base">Bio y avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <>
            <div>
              <Label className="mb-1.5 block text-xs">URL de avatar (opcional)</Label>
              <Input
                value={avatarValue}
                onChange={(e) => setAvatarValue(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Bio</Label>
              <Textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Contá algo sobre vos como operador..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await updateOwnProfile({ bio: bioValue, avatarUrl: avatarValue });
                    if (result?.error) toast.error(result.error);
                    else {
                      toast.success("Perfil actualizado.");
                      setEditing(false);
                    }
                  })
                }
              >
                Guardar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {bio || "Todavía no escribiste nada sobre vos."}
            </p>
            <Button size="sm" variant="outline" className="self-start" onClick={() => setEditing(true)}>
              Editar perfil
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
