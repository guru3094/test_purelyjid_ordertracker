"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  OrderSortField,
  OrdersQueryState,
  SortOrder,
} from "@/lib/types/orderApi";

interface OrdersToolbarProps {
  filters: OrdersQueryState;
  loading: boolean;
  onApply: (filters: OrdersQueryState) => void;
  onReset: () => void;
}

const SORT_OPTIONS: Array<{
  value: OrderSortField;
  label: string;
}> = [
  {
    value: "orderDate",
    label: "Order date",
  },
  {
    value: "createdAt",
    label: "Created date",
  },
  {
    value: "customerName",
    label: "Customer name",
  },
  {
    value: "status",
    label: "Status",
  },
  {
    value: "courier",
    label: "Courier",
  },
];

export default function OrdersToolbar({
  filters,
  loading,
  onApply,
  onReset,
}: OrdersToolbarProps) {
  const [draftFilters, setDraftFilters] =
    useState<OrdersQueryState>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  function updateField<
    Key extends keyof OrdersQueryState,
  >(
    field: Key,
    value: OrdersQueryState[Key]
  ) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onApply({
      ...draftFilters,
      q: draftFilters.q.trim(),
      status: draftFilters.status.trim(),
      courier: draftFilters.courier.trim(),
    });
  }

  function handleReset() {
    onReset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Search
          </span>

          <input
            type="search"
            value={draftFilters.q}
            onChange={(event) =>
              updateField("q", event.target.value)
            }
            placeholder="Order ID, customer, email or mobile"
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Status
          </span>

          <input
            type="text"
            value={draftFilters.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value
              )
            }
            placeholder="Example: ORDER_RECEIVED"
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Fulfilment method
          </span>

          <select
            value={draftFilters.fulfillmentMethod}
            onChange={(event) =>
              updateField(
                "fulfillmentMethod",
                event.target.value
              )
            }
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All methods</option>
            <option value="Pickup">Pickup</option>
            <option value="Delivery">
              Delivery
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Courier
          </span>

          <input
            type="text"
            value={draftFilters.courier}
            onChange={(event) =>
              updateField(
                "courier",
                event.target.value
              )
            }
            placeholder="Example: DTDC"
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Sort by
          </span>

          <select
            value={draftFilters.sortBy}
            onChange={(event) =>
              updateField(
                "sortBy",
                event.target.value as OrderSortField
              )
            }
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Sort order
          </span>

          <select
            value={draftFilters.sortOrder}
            onChange={(event) =>
              updateField(
                "sortOrder",
                event.target.value as SortOrder
              )
            }
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="desc">
              Descending
            </option>
            <option value="asc">Ascending</option>
          </select>
        </label>

        <div className="flex items-end gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {loading
              ? "Loading..."
              : "Apply filters"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleReset}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}
