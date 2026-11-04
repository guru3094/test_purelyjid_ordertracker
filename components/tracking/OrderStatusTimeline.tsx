import { normalizeStatus, STATUS_TO_STAGE_INDEX } from "@/lib/tracking/statusStages";

interface OrderStatusTimelineProps {
  currentStatus: string | null;
  fulfillmentMethod: string | null;
}

interface TimelineStage {
  code: string;
  label: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    code: "ORDER_RECEIVED",
    label: "Order received",
  },
  {
    code: "ORDER_CONFIRMED",
    label: "Order confirmed",
  },
  {
    code: "PROCESSING",
    label: "Processing",
  },
  {
    code: "SHIPPED",
    label: "Shipped",
  },
  {
    code: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
  },
  {
    code: "DELIVERED",
    label: "Delivered",
  },
];

const EXCEPTION_STATUSES = new Set([
  "CANCELLED",
  "ON_HOLD",
  "DELAYED",
  "RETURNED",
]);

function formatStatusLabel(status: string | null): string {
  if (!status) {
    return "Status not available";
  }

  return status
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

export default function OrderStatusTimeline({
  currentStatus,
  fulfillmentMethod,
}: OrderStatusTimelineProps) {
  const isPickup = fulfillmentMethod?.trim().toLowerCase() === "pickup";
  const normalizedStatus = normalizeStatus(currentStatus);
  const fullStageIndex = STATUS_TO_STAGE_INDEX[normalizedStatus];
  // Pickup skips the two delivery-only stages. Keep the remaining steps
  // contiguous so both the progress markers and their numbers stay correct.
  const stages = isPickup
    ? TIMELINE_STAGES.filter((stage) =>
        stage.code !== "SHIPPED" && stage.code !== "OUT_FOR_DELIVERY"
      )
    : TIMELINE_STAGES;
  const currentStageIndex = isPickup
    ? fullStageIndex === 5 ? 3
      : fullStageIndex === 3 || fullStageIndex === 4 ? undefined
        : fullStageIndex
    : fullStageIndex;

  if (EXCEPTION_STATUSES.has(normalizedStatus)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-950">
          Current status
        </p>

        <p className="mt-2 text-sm text-amber-800">
          {formatStatusLabel(currentStatus)}
        </p>

        <p className="mt-2 text-xs leading-5 text-amber-700">
          Please refer to the order remarks for more details.
        </p>
      </div>
    );
  }

  if (currentStageIndex === undefined) {
    return (
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">
          Current status
        </p>

        <p className="mt-2 text-sm text-slate-600">
          {formatStatusLabel(currentStatus)}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => {
        const checked = index <= currentStageIndex;
        const current = index === currentStageIndex;
        const connectorCompleted = index < currentStageIndex;
        const isLast = index === stages.length - 1;

        return (
          <li
            key={stage.code}
            className="relative flex gap-4"
          >
            {!isLast && (
              <div
                className={`absolute left-[11px] top-6 h-full w-0.5 ${
                  connectorCompleted
                    ? "bg-emerald-500"
                    : "bg-slate-200"
                }`}
              />
            )}

            <div
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                checked
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 bg-white text-slate-400"
              } ${
                current
                  ? "ring-4 ring-emerald-100"
                  : ""
              }`}
            >
              {checked ? "✓" : index + 1}
            </div>

            <div className="min-h-16 pb-5">
              <p
                className={`text-sm font-semibold ${
                  checked
                    ? "text-slate-950"
                    : "text-slate-400"
                }`}
              >
                {isPickup && isLast ? "Picked up" : stage.label}
              </p>

              {current && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Current status: {formatStatusLabel(currentStatus)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
