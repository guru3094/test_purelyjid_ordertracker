interface OrderStatusBadgeProps {
  status: string | null;
}

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getStatusClasses(status: string): string {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus.includes("DELIVERED") ||
    normalizedStatus.includes("COMPLETED")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalizedStatus.includes("CANCELLED") ||
    normalizedStatus.includes("FAILED") ||
    normalizedStatus.includes("REJECTED")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalizedStatus.includes("SHIPPED") ||
    normalizedStatus.includes("DELIVERING") ||
    normalizedStatus.includes("TRANSIT")
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    normalizedStatus.includes("PENDING") ||
    normalizedStatus.includes("RECEIVED") ||
    normalizedStatus.includes("PROCESSING")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
        Not available
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}
