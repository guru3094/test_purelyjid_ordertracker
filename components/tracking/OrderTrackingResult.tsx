import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderStatusTimeline from "@/components/tracking/OrderStatusTimeline";
import { OrderResponse } from "@/lib/types/orderApi";

interface OrderTrackingResultProps {
  order: OrderResponse;
  onTrackAnother: () => void;
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}


function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function displayValue(
  value: string | null
): string {
  return value?.trim() || "Not available";
}

export default function OrderTrackingResult({
  order,
  onTrackAnother,
}: OrderTrackingResultProps) {
  const hasRemarks = Boolean(
    order.remarks?.trim()
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Order status
        </p>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {order.orderId}
            </h2>

            <p className="mt-1 text-sm text-slate-300">
              Ordered on{" "}
              {formatDate(order.orderDate)}
            </p>
          </div>

          <OrderStatusBadge
            status={order.status}
          />
        </div>
      </div>

      {hasRemarks && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
              ℹ
            </div>

            <div>
              <p className="text-sm font-bold text-amber-950">
                Latest order update
              </p>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-amber-900">
                {order.remarks}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <h3 className="text-lg font-bold text-slate-950">
            Tracking progress
          </h3>

          <div className="mt-6">
            <OrderStatusTimeline
              currentStatus={order.status}
              fulfillmentMethod={order.fulfillmentMethod}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-950">
            Order details
          </h3>

          <dl className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-5">
            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {order.customerName}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product name / Order details
              </dt>

              <dd className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-900">
                {displayValue(order.productName)}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product category
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {displayValue(order.productCategory)}
              </dd>
            </div>

            <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
              <div className="py-4 sm:pr-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product cost
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(order.productCost)}
                </dd>
              </div>

              <div className="py-4 sm:px-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Advance paid
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(order.advancePaid)}
                </dd>
              </div>

              <div className="py-4 sm:pl-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Balance to be paid
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(order.balanceToBePaid)}
                </dd>
              </div>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current stage
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {displayValue(order.status)}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fulfilment
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {displayValue(
                  order.fulfillmentMethod
                )}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Courier
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {displayValue(order.courier)}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tracking number
              </dt>

              <dd className="mt-1 break-all text-sm font-semibold text-slate-900">
                {displayValue(
                  order.trackingNumber
                )}
              </dd>
            </div>

            <div className="py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expected delivery
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(
                  order.expectedDeliveryDate
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {!hasRemarks && (
        <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:mx-8 sm:mb-8">
          <p className="text-sm font-bold text-slate-900">
            Latest order update
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            No additional update is currently available
            for this order.
          </p>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={onTrackAnother}
          className="text-sm font-bold text-slate-700 transition hover:text-slate-950"
        >
          ← Track another order
        </button>
      </div>
    </div>
  );
}
