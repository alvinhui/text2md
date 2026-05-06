export function flashText(
  setter: (value: string) => void,
  temporaryText: string,
  originalText: string,
  durationMs = 1200
): void {
  setter(temporaryText);
  window.setTimeout(() => setter(originalText), durationMs);
}
