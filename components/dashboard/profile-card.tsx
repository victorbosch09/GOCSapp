"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { updateOwnProfile } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileCard({
  bio,
  avatarUrl,
  discordUsername,
  callsign,
  profileId,
}: {
  bio: string | null;
  avatarUrl: string | null;
  discordUsername: string | null;
  callsign: string;
  profileId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [avatarValue, setAvatarValue] = useState(avatarUrl ?? "");
  const [discordValue, setDiscordValue] = useState(discordUsername ?? "");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = callsign.slice(0, 2).toUpperCase();

  async function handleFileUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${profileId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { toast.error(upErr.message); return; }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarValue(data.publicUrl + `?t=${Date.now()}`);
      toast.success("Foto cargada. Guardá el perfil para confirmar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Mi perfil</CardDescription>
        <CardTitle className="font-heading text-base">Bio y avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <>
            {/* Avatar preview + upload */}
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={avatarValue || undefined} alt={callsign} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-xs">Foto de perfil</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? "Subiendo…" : "Subir foto"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />
                </div>
                <Input
                  value={avatarValue}
                  onChange={(e) => setAvatarValue(e.target.value)}
                  placeholder="o pegá un link https://…"
                  className="text-xs"
                />
              </div>
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
            <div>
              <Label className="mb-1.5 block text-xs">Usuario de Discord (opcional)</Label>
              <Input
                value={discordValue}
                onChange={(e) => setDiscordValue(e.target.value)}
                placeholder="tu_usuario"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Se usa para vincular tu asistencia marcada en Discord con tu perfil acá.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={pending || uploading}
                onClick={() =>
                  startTransition(async () => {
                    const result = await updateOwnProfile({
                      bio: bioValue,
                      avatarUrl: avatarValue,
                      discordUsername: discordValue,
                    });
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
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={avatarUrl ?? undefined} alt={callsign} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground flex-1">
                {bio || "Todavía no escribiste nada sobre vos."}
              </p>
            </div>
            {discordUsername && (
              <p className="text-xs text-muted-foreground">Discord: {discordUsername}</p>
            )}
            <Button size="sm" variant="outline" className="self-start" onClick={() => setEditing(true)}>
              Editar perfil
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
