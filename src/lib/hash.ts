/** SHA-256 calculado en el navegador con Web Crypto; el archivo no sale del dispositivo. */
export async function sha256File(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const shortHash = (h: string, n = 10) => (h.length > 2 * n ? `${h.slice(0, n)}…${h.slice(-n)}` : h);
