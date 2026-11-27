/**
 * Hands the PDF to the phone's Share menu (Files, AirDrop, Mail, Messages, Print). Where sharing files isn't
 * supported (most desktop browsers) it downloads instead. Nothing is uploaded by the app.
 */
/** 'blocked': the phone wants the share to start straight from a tap — show a Share button and call again from it. */
export async function shareReport(bytes: Uint8Array, fileName: string, title: string, type = 'application/pdf'): Promise<'shared' | 'cancelled' | 'blocked' | 'downloaded'> {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
  const file = new File([blob], fileName, { type });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled';
      if (e instanceof Error && e.name === 'NotAllowedError') return 'blocked';
      // anything else: fall through to a download
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return 'downloaded';
}
