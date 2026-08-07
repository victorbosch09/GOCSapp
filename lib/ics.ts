/** Genera y descarga un archivo .ics de un solo evento — sin dependencias externas. */
export function downloadIcsEvent(event: {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
}) {
  const toIcsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = event.end_at ?? new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString();
  const escape = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GOCS//Calendario//ES",
    "BEGIN:VEVENT",
    `UID:${event.id}@gocs`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.start_at)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^\w\-]+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
