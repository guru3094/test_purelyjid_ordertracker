"use client";

import { useRef, useState } from "react";


import BrandLogo from "@/components/branding/BrandLogo";
import OrderTrackingForm from "@/components/tracking/OrderTrackingForm";
import OrderTrackingResult from "@/components/tracking/OrderTrackingResult";

import { OrderResponse } from "@/lib/types/orderApi";
import { TrackOrderApiResponse } from "@/lib/types/trackingApi";

function getErrorMessage(
  responseBody: unknown
): string {
  if (
    typeof responseBody === "object" &&
    responseBody !== null
  ) {
    const body = responseBody as {
      message?: string;
      error?: string;
    };

    return (
      body.message ??
      body.error ??
      "We could not track your order."
    );
  }

  return "We could not track your order.";
}

export default function TrackOrderPage() {
  const [order, setOrder] =
    useState<OrderResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const controllerRef =
    useRef<AbortController | null>(null);

  async function handleTrackOrder(
    orderId: string,
    mobileNumber: string
  ) {
    controllerRef.current?.abort();

    const controller =
      new AbortController();

    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const searchParams =
        new URLSearchParams({
          orderId,
          mobileNumber,
        });

      const response = await fetch(
        `/api/track-order?${searchParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const responseBody =
        await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(responseBody)
        );
      }

      const trackingResponse =
        responseBody as TrackOrderApiResponse;

      setOrder(trackingResponse.order);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not track your order."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function handleTrackAnother() {
    setOrder(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo href="/" priority />

            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <p className="text-sm font-bold text-slate-900">
                Order Tracking
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Track your PurelyJid order
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center text-white sm:px-8 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            PurelyJid Orders
          </p>

          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Know where your order is
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Track your PurelyJid order using
            the Order ID and mobile number
            provided during purchase.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-bold text-red-800">
              Order could not be found
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {error}
            </p>
          </div>
        )}

        {order ? (
          <OrderTrackingResult
            order={order}
            onTrackAnother={handleTrackAnother}
          />
        ) : (
          <div className="mx-auto max-w-xl">
            <OrderTrackingForm
              loading={loading}
              onSubmit={handleTrackOrder}
            />
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 text-center text-xs text-slate-500 sm:px-8">
          © {new Date().getFullYear()} PurelyJid.
          All rights reserved.
        </div>
      </footer>
    </main>
  );
}
