export function nowUtc(): string {

    return new Date().toISOString();

}

export function toIsoString(
    value: Date
): string {

    return value.toISOString();

}
