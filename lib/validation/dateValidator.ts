export function validateDate(date: string): void {
  if (!date) {
    throw new Error("Date is required");
  }

  if (isNaN(Date.parse(date))) {
    throw new Error(`Invalid date: ${date}`);
  }
}
