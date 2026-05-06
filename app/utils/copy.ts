export function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, text.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  return copied;
}

export async function copyWithFallback(text: string): Promise<boolean> {
  if (!text) return false;
  let copied = false;
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    } else {
      copied = fallbackCopyText(text);
    }
  } catch {
    copied = fallbackCopyText(text);
  }
  return copied;
}
