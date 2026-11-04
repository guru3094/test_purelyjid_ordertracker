import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { OrderResponse } from "@/lib/types/orderApi";

interface OrdersTableProps {
  orders: OrderResponse[];
  loading: boolean;
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function displayValue(
  value: string | null
): string {
  return value?.trim() || "—";
}

export default function OrdersTable({
  orders,
  loading,
}: OrdersTableProps) {
  if (loading && orders.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            📦
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No orders found
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            No orders match the selected search and
            filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-slate-100">
          <div className="h-full w-1/3 animate-pulse bg-slate-700" />
        </div>
      )}

      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order date
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fulfilment
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Courier
            </th>

            <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expected date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {orders.map((order) => (
            <tr
              key={order.orderId}
              className="transition hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-5 py-4 align-top">
                <div className="font-semibold text-slate-900">
                  {order.orderId}
                </div>

                {order.trackingNumber && (
                  <div className="mt-1 text-xs text-slate-500">
                    Tracking:{" "}
                    {order.trackingNumber}
                  </div>
                )}
              </td>

              <td className="px-5 py-4 align-top">
                <div className="font-medium text-slate-900">
                  {order.customerName}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {displayValue(order.mobileNumber)}
                </div>

                {order.email && (
                  <div className="mt-1 max-w-52 truncate text-xs text-slate-500">
                    {order.email}
                  </div>
                )}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {formatDate(order.orderDate)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <OrderStatusBadge
                  status={order.status}
                />
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {displayValue(
                  order.fulfillmentMethod
                )}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {displayValue(order.courier)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                {formatDate(
                  order.expectedDeliveryDate
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
