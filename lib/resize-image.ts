/**
 * Resizes/pads an image file to a rectangular (16:9) transparent PNG,
 * fitting the original inside (contain) and centering it. Runs entirely in
 * the browser via canvas — no server-side image processing needed.
 */
export async function resizeToRectPng(file: File, width = 800, height = 450): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");

  const scale = Math.min(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, x, y, drawWidth, drawHeight);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el PNG."))), "image/png");
  });

  return new File([blob], "item.png", { type: "image/png" });
}
