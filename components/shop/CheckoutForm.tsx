"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { fitLabels, fitsForSizing, getCloth, type GarmentFit } from "@/lib/data/shop";
import { formatKes } from "@/lib/shop/money";
import { productHref } from "@/lib/shop/catalog";
import { DonationPaymentPanel } from "@/components/donation/DonationPaymentPanel";
import {
  cartCount,
  cartSubtotal,
  clearCart,
  removeCartLine,
  updateCartLine,
  useShopCart,
} from "@/components/shop/useShopCart";
import type { DonationMethod } from "@/lib/data/donation";
import type { OrderChannel } from "@/lib/shop/types";

type Status = "idle" | "loading" | "success" | "error";

function openWhatsApp(url: string) {
  const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
  if (popup) {
    popup.location.replace(url);
    return;
  }
  window.location.assign(url);
}

export function CheckoutForm({
  methods,
  whatsappEnabled,
}: {
  methods: DonationMethod[];
  whatsappEnabled: boolean;
}) {
  const router = useRouter();
  const { items } = useShopCart();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [payMethod, setPayMethod] = useState<DonationMethod["id"]>(methods[0]?.id ?? "mpesa");
  const channelRef = useRef<OrderChannel>("web");
  const locked = useRef(false);
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || status === "loading" || status === "success") return;
    if (items.length === 0) {
      setStatus("error");
      setMessage("Add at least one piece before checking out.");
      return;
    }
    const channel = channelRef.current;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (channel === "whatsapp" && !String(data.phone ?? "").trim()) {
      setStatus("error");
      setMessage("Please share a phone number so the workshop can reach you on WhatsApp.");
      return;
    }

    locked.current = true;
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          gift: data.gift === "on",
          message: data.message,
          delivery: data.delivery,
          website: data.website,
          channel,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            fit: item.fit,
            cloth: item.cloth,
          })),
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message: string;
        reference?: string;
        accessKey?: string;
        whatsappUrl?: string | null;
      };
      if (!response.ok || !payload.ok || !payload.reference) {
        setStatus("error");
        setMessage(payload.message || "We could not place this order just now. Please try again.");
        locked.current = false;
        return;
      }
      setStatus("success");
      setMessage(payload.message);
      clearCart();
      trackEvent(analyticsEvents.atelierRequested, { pieces: String(count), channel });
      if (payload.whatsappUrl) openWhatsApp(payload.whatsappUrl);
      const key = payload.accessKey ? `?k=${encodeURIComponent(payload.accessKey)}` : "";
      router.push(`/shop/order/${payload.reference}${key}`);
    } catch {
      setStatus("error");
      setMessage("The network dropped the order. Check your connection and try again.");
      locked.current = false;
    }
  }

  const busy = status === "loading" || status === "success";
  const empty = items.length === 0;

  if (!mounted) {
    return (
      <div id="checkout" className="shop-checkout shop-checkout--empty">
        <div className="shop-checkout__panel">
          <p className="eyebrow">Your order</p>
          <h2 className="shop-checkout__title">Loading your pieces…</h2>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout">
      {empty ? (
        <div className="shop-checkout shop-checkout--empty">
          <div className="shop-checkout__panel">
            <p className="eyebrow">Your cart</p>
            <h2 className="shop-checkout__title">Nothing is on hold yet</h2>
            <p className="shop-checkout__lede">
              Choose a piece from the rack, then come back to send it to the workshop.
            </p>
            <p className="mt-6">
              <Link href="/shop" className="btn btn-plum">
                Return to the rack
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <form className="shop-checkout" onSubmit={onSubmit} noValidate>
          <div className="shop-checkout__main">
            <input
              type="text"
              name="website"
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <section className="shop-checkout__panel">
              <p className="eyebrow">Your details</p>
              <h2 className="shop-checkout__title">Who should we reach?</h2>
              <div className="shop-checkout__fields shop-checkout__fields--split">
                <label className="form-field">
                  <span className="form-field-label">Your name</span>
                  <input name="name" required minLength={2} autoComplete="name" disabled={busy} />
                </label>
                <label className="form-field">
                  <span className="form-field-label">Phone{whatsappEnabled ? "" : " (optional)"}</span>
                  <input name="phone" type="tel" autoComplete="tel" disabled={busy} />
                </label>
                <label className="form-field shop-checkout__span">
                  <span className="form-field-label">Email</span>
                  <input name="email" type="email" required autoComplete="email" disabled={busy} />
                </label>
              </div>
              {whatsappEnabled ? (
                <p className="shop-checkout__hint">A phone number is needed if you send the order on WhatsApp.</p>
              ) : null}
            </section>

            <section className="shop-checkout__panel">
              <p className="eyebrow">Delivery</p>
              <h2 className="shop-checkout__title">Where should it go?</h2>
              <label className="flex items-center gap-3 text-sm">
                <input name="gift" type="checkbox" disabled={busy} />
                This is a gift
              </label>
              <label className="form-field mt-4">
                <span className="form-field-label">Collection or delivery note (optional)</span>
                <textarea
                  name="delivery"
                  className="shop-checkout__note"
                  disabled={busy}
                  placeholder="Collection in Kawangware, or a Nairobi delivery note."
                />
              </label>
              <label className="form-field mt-4">
                <span className="form-field-label">Workshop notes (optional)</span>
                <textarea
                  name="message"
                  className="shop-checkout__note"
                  disabled={busy}
                  placeholder="Colour, occasion, or fit notes for the workshop."
                />
              </label>
            </section>
          </div>

          <aside className="shop-checkout__aside">
            <section className="shop-checkout__panel">
              <p className="eyebrow">Order</p>
              <h2 className="shop-checkout__title">Your pieces</h2>
              <ul className="shop-checkout__lines">
                {items.map((item) => {
                  const sizeOptions = fitsForSizing(item.sizing);
                  return (
                    <li key={`${item.productId}-${item.fit}-${item.cloth}`}>
                      <div className="shop-checkout__line-top">
                        <p>
                          <Link href={productHref(item)}>{item.name}</Link>
                        </p>
                        <button
                          type="button"
                          className="shop-checkout__remove"
                          onClick={() => removeCartLine(item.productId, item.fit, item.cloth)}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="shop-checkout__meta">
                        {item.sku} · {fitLabels[item.fit]} · {getCloth(item.cloth)?.name ?? item.cloth}
                      </p>
                      <div className="shop-checkout__line-controls">
                        <label className="form-field">
                          <span className="form-field-label">Qty</span>
                          <select
                            value={item.quantity}
                            disabled={busy}
                            onChange={(event) =>
                              updateCartLine(item.productId, item.fit, item.cloth, {
                                quantity: Number(event.target.value),
                              })
                            }
                          >
                            {Array.from({ length: 10 }, (_, index) => index + 1).map((qty) => (
                              <option key={qty} value={qty}>
                                {qty}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field">
                          <span className="form-field-label">Fit</span>
                          <select
                            value={item.fit}
                            disabled={busy}
                            onChange={(event) =>
                              updateCartLine(item.productId, item.fit, item.cloth, {
                                fit: event.target.value as GarmentFit,
                              })
                            }
                          >
                            {sizeOptions.map((value) => (
                              <option key={value} value={value}>
                                {fitLabels[value]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="shop-checkout__line-total">{formatKes(item.priceKes * item.quantity)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="shop-checkout__total">
                <span>Total</span>
                <strong>{formatKes(subtotal)}</strong>
              </p>
              <p className="shop-checkout__hint">
                {count} {count === 1 ? "piece" : "pieces"}. Prices lock when you place the order.
              </p>
            </section>

            <section className="shop-checkout__panel">
              <p className="eyebrow">Send the order</p>
              <h2 className="shop-checkout__title">How should it reach the workshop?</h2>
              <div aria-live="polite">
                {status === "success" ? <p className="form-success">{message}</p> : null}
                {status === "error" ? <p className="form-failure">{message}</p> : null}
              </div>
              <div className="shop-checkout__actions">
                {whatsappEnabled ? (
                  <button
                    className="btn btn-plum"
                    type="submit"
                    disabled={busy}
                    onClick={() => {
                      channelRef.current = "whatsapp";
                    }}
                  >
                    {status === "loading" && channelRef.current === "whatsapp"
                      ? "Opening WhatsApp…"
                      : "Order via WhatsApp"}
                  </button>
                ) : null}
                <button
                  className={whatsappEnabled ? "btn btn-ghost" : "btn btn-plum"}
                  type="submit"
                  disabled={busy}
                  onClick={() => {
                    channelRef.current = "web";
                  }}
                >
                  {status === "loading" && channelRef.current === "web"
                    ? "Placing order…"
                    : status === "success"
                      ? "Order placed"
                      : "Place order"}
                </button>
              </div>
              <p className="shop-checkout__hint">
                {whatsappEnabled
                  ? "WhatsApp saves the order first, then opens a message with your reference. If the chat does not open, you can send it from the next page. You can also place the order here and pay through the official details."
                  : "You will get a reference to use when you pay through the official details below."}
              </p>
              <p className="mt-4">
                <Link href="/shop" className="underline">
                  Continue shopping
                </Link>
              </p>
            </section>

            <details className="shop-checkout__panel shop-checkout__pay">
              <summary>How you will pay</summary>
              <DonationPaymentPanel
                method={payMethod}
                onMethodChange={setPayMethod}
                methods={methods}
                heading="Official payment details"
                id="shop-payment"
              />
            </details>
          </aside>
        </form>
      )}
    </div>
  );
}
