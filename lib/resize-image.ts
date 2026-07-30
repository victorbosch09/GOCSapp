/**
 * Resizes/pads an image file to a square transparent PNG of `size` px,
 * fitting the original inside (contain) and centering it. Runs entirely in
 * the browser via canvas — no server-side image processing needed.
 */
export async function resizeToSquarePng(file: File, size = 512): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");

  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(bitmap, x, y, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el PNG."))), "image/png");
  });

  return new File([blob], "item.png", { type: "image/png" });
}
