export function toIsoTimestamp(
  date: string | undefined,
  time?: string | undefined
): string {
  if (!date || date.trim() === "") {
    return new Date().toISOString();
  }

  // Already ISO
  if (date.includes("T")) {
    return new Date(date).toISOString();
  }

  // Date only
  if (!time || time.trim() === "") {
    return new Date(date).toISOString();
  }

  // Date + time
  return new Date(`${date} ${time}`).toISOString();
}

export function toNullableIsoTimestamp(
  value: string | undefined
): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  return new Date(value).toISOString();
}
