export function safeJsonParse(json: string): unknown | null {
  try {
    return JSON.parse(json);
  } catch (e: unknown) {
    console.error(e);
    return null;
  }
}
