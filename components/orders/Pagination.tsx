"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function Pagination({
  page,
  pageSize,
  totalPages,
  totalRecords,
  loading,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const firstRecord =
    totalRecords === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastRecord = Math.min(
    page * pageSize,
    totalRecords
  );

  const canGoPrevious = page > 1 && !loading;

  const canGoNext =
    page < totalPages && !loading;

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold text-slate-900">
          {firstRecord}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-slate-900">
          {lastRecord}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-900">
          {totalRecords}
        </span>{" "}
        orders
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Rows per page

          <select
            value={pageSize}
            disabled={loading}
            onChange={(event) =>
              onPageSizeChange(
                Number(event.target.value)
              )
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() =>
              onPageChange(page - 1)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="min-w-24 text-center text-sm text-slate-600">
            Page{" "}
            <span className="font-semibold text-slate-900">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {Math.max(totalPages, 1)}
            </span>
          </span>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() =>
              onPageChange(page + 1)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
