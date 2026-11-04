"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import OrdersTable from "@/components/orders/OrdersTable";
import OrdersToolbar from "@/components/orders/OrdersToolbar";
import Pagination from "@/components/orders/Pagination";

import {
  OrdersApiResponse,
  OrdersQueryState,
} from "@/lib/types/orderApi";

const DEFAULT_FILTERS: OrdersQueryState = {
  q: "",
  status: "",
  fulfillmentMethod: "",
  courier: "",
  sortBy: "orderDate",
  sortOrder: "desc",
};

const DEFAULT_PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load orders.";
}

export default function Home() {
  const [filters, setFilters] =
    useState<OrdersQueryState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(
    DEFAULT_PAGE_SIZE
  );

  const [data, setData] =
    useState<OrdersApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const fetchOrders = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (filters.q) {
          searchParams.set("q", filters.q);
        }

        if (filters.status) {
          searchParams.set(
            "status",
            filters.status
          );
        }

        if (filters.fulfillmentMethod) {
          searchParams.set(
            "fulfillmentMethod",
            filters.fulfillmentMethod
          );
        }

        if (filters.courier) {
          searchParams.set(
            "courier",
            filters.courier
          );
        }

        const response = await fetch(
          `/api/orders?${searchParams.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const responseBody =
          await response.json();

        if (!response.ok) {
          const message =
            responseBody?.message ??
            responseBody?.error ??
            "Unable to fetch orders.";

          throw new Error(message);
        }

        setData(
          responseBody as OrdersApiResponse
        );
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          getErrorMessage(requestError)
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [filters, page, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchOrders(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchOrders]);

  function handleApplyFilters(
    nextFilters: OrdersQueryState
  ) {
    setPage(1);
    setFilters(nextFilters);
  }

  function handleResetFilters() {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  }

  function handlePageSizeChange(
    nextPageSize: number
  ) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  return (
    <main className="admin-orders-page min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2 px-5 py-6 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            PurelyJid
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Order Tracker
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Search, filter and review customer
                orders.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total orders
              </span>

              <p className="text-xl font-bold text-slate-900">
                {data?.totalRecords ?? 0}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 px-5 py-6 sm:px-8 lg:px-10">
        <OrdersToolbar
          filters={filters}
          loading={loading}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-red-800">
                Orders could not be loaded
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchOrders()}
              className="h-10 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Results are retrieved from the Orders
                API.
              </p>
            </div>

            {data?.correlationId && (
              <p className="max-w-full truncate text-xs text-slate-400">
                Request ID: {data.correlationId}
              </p>
            )}
          </div>

          <OrdersTable
            orders={data?.orders ?? []}
            loading={loading}
          />

          <Pagination
            page={data?.page ?? page}
            pageSize={pageSize}
            totalPages={data?.totalPages ?? 0}
            totalRecords={
              data?.totalRecords ?? 0
            }
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={
              handlePageSizeChange
            }
          />
        </section>
      </div>
    </main>
  );
}
