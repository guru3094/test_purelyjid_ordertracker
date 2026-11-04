"use client";

import {
  FormEvent,
  useState,
} from "react";

interface OrderTrackingFormProps {
  loading: boolean;
  onSubmit: (
    orderId: string,
    mobileNumber: string
  ) => void;
}

export default function OrderTrackingForm({
  loading,
  onSubmit,
}: OrderTrackingFormProps) {
  const [orderId, setOrderId] =
    useState("");

  const [mobileNumber, setMobileNumber] =
    useState("");

  const [validationError, setValidationError] =
    useState<string | null>(null);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalizedOrderId =
      orderId.trim();

    const normalizedMobileNumber =
      mobileNumber.replace(/\D/g, "");

    if (!normalizedOrderId) {
      setValidationError(
        "Please enter your Order ID."
      );

      return;
    }

    if (
      normalizedMobileNumber.length < 8
    ) {
      setValidationError(
        "Please enter a valid mobile number."
      );

      return;
    }

    setValidationError(null);

    onSubmit(
      normalizedOrderId,
      normalizedMobileNumber
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-950">
          Track your order
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the Order ID and mobile number
          used while placing your order.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Order ID
          </span>

          <input
            type="text"
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value)
            }
            placeholder="Example: PJ10001"
            autoComplete="off"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Mobile number
          </span>

          <input
            type="tel"
            inputMode="numeric"
            value={mobileNumber}
            onChange={(event) =>
              setMobileNumber(
                event.target.value
              )
            }
            placeholder="Mobile number used for the order"
            autoComplete="tel"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100"
          />
        </label>
      </div>

      {validationError && (
        <p
          role="alert"
          className="mt-4 text-sm font-medium text-red-600"
        >
          {validationError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Finding your order..."
          : "Track Order"}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        Your order information is shown only
        when both details match.
      </p>
    </form>
  );
}
