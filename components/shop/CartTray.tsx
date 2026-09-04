"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { fitLabels, getCloth } from "@/lib/data/shop";
import { formatKes } from "@/lib/shop/money";
import { productHref } from "@/lib/shop/catalog";
import {
  CART_ADDED_EVENT,
  CART_LIMIT,
  cartCount,
  cartSubtotal,
  removeCartLine,
  updateCartLine,
  useShopCart,
  type CartNotice,
} from "@/components/shop/useShopCart";

function noticeCopy(detail: CartNotice) {
  if (detail.status === "added") return `${detail.name} added to your cart`;
  if (detail.status === "full") return `Your cart is full (${CART_LIMIT} lines). Remove one to add another.`;
  if (detail.status === "soldout") return `${detail.name} is sold out`;
  return `${detail.name} updated in your cart`;
}

export function CartTray({ whatsappEnabled = false }: { whatsappEnabled?: boolean }) {
  const pathname = usePathname();
  const { items } = useShopCart();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const onCheckout = pathname === "/shop/checkout";
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [flash, setFlash] = useState(false);
  const panelId = useId();
  const trayRef = useRef<HTMLDivElement>(null);
  const kinds = items.length;
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  function goToCart(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/shop") return;
    event.preventDefault();
    window.location.href = "/shop/checkout";
    setOpen(false);
  }

  useEffect(() => {
    function onAdded(event: Event) {
      const detail = (event as CustomEvent<CartNotice>).detail;
      if (!detail) return;
      setNotice(noticeCopy(detail));
      setFlash(true);
    }
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, []);

  useEffect(() => {
    if (!flash && !notice) return;
    const timer = window.setTimeout(() => {
      setFlash(false);
      setNotice("");
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [flash, notice]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!trayRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const visible = mounted && items.length > 0 && !onCheckout;
    document.documentElement.classList.toggle("request-tray-open", visible);
    document.documentElement.classList.toggle("request-tray-expanded", visible && open);
    return () => {
      document.documentElement.classList.remove("request-tray-open", "request-tray-expanded");
    };
  }, [mounted, items.length, onCheckout, open]);

  if (!mounted || items.length === 0 || onCheckout) return null;

  const pieceWord = count === 1 ? "piece" : "pieces";

  return (
    <div
      ref={trayRef}
      className={`request-tray ${flash ? "is-flash" : ""} ${open ? "is-open" : ""}`}
      role="region"
      aria-label="Your cart"
    >
      <p className="request-tray__live" role="status" aria-live="polite">
        {notice || `${count} ${pieceWord} in your cart`}
      </p>
      {notice ? <p className="request-tray__toast">{notice}</p> : null}

      <div className="request-tray__bar">
        <button
          type="button"
          className="request-tray__summary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="request-tray__count" aria-hidden="true">
            {count}
          </span>
          <span className="request-tray__copy">
            <strong>Your cart</strong>
            <span>
              {kinds} {kinds === 1 ? "line" : "lines"} · {formatKes(subtotal)}
            </span>
          </span>
          <span className="request-tray__chevron" aria-hidden="true" />
        </button>
        <Link
          href="/shop/checkout"
          className="btn btn-plum request-tray__cta"
          aria-label="Go to checkout"
          onClick={goToCart}
        >
          Checkout
        </Link>
      </div>

      <div id={panelId} className="request-tray__panel" hidden={!open}>
        <ul>
          {items.map((item) => {
            const cloth = getCloth(item.cloth);
            return (
              <li key={`${item.productId}-${item.fit}-${item.cloth}`}>
                <span
                  className="request-tray__swatch"
                  style={{ background: cloth?.hex ?? "#5e2063" }}
                  aria-hidden="true"
                />
                <div>
                  <p>
                    <Link href={productHref(item)}>{item.name}</Link>
                  </p>
                  <p>
                    {item.quantity} × {fitLabels[item.fit]} · {cloth?.name ?? "Plum"} ·{" "}
                    {formatKes(item.priceKes * item.quantity)}
                  </p>
                </div>
                <div className="request-tray__qty">
                  <button
                    type="button"
                    aria-label={`Fewer ${item.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      updateCartLine(item.productId, item.fit, item.cloth, {
                        quantity: item.quantity - 1,
                      })
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`More ${item.name}`}
                    disabled={item.quantity >= 10}
                    onClick={() =>
                      updateCartLine(item.productId, item.fit, item.cloth, {
                        quantity: item.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="request-tray__remove"
                  onClick={() => removeCartLine(item.productId, item.fit, item.cloth)}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
        <p className="request-tray__hint">
          {whatsappEnabled
            ? "Checkout locks the price, saves the order, and gives you a reference to pay — or to send on WhatsApp."
            : "Checkout locks the price and gives you a reference to use when you pay."}
        </p>
      </div>
    </div>
  );
}

export function HeaderCartLink() {
  const { count } = useShopCart();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const shown = mounted ? count : 0;
  if (shown <= 0) return null;
  return (
    <Link
      href="/shop/checkout"
      className="header-cart relative inline-flex size-11 shrink-0 items-center justify-center"
      aria-label={`Cart, ${shown} ${shown === 1 ? "piece" : "pieces"}`}
    >
      <span className="header-cart__mark" aria-hidden="true">
        <svg className="header-cart__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 4.5h1.7l2.2 10.4a1.8 1.8 0 0 0 1.8 1.4h8.2a1.8 1.8 0 0 0 1.8-1.45L21 8H7" />
          <circle cx="10" cy="19.2" r="1.15" />
          <circle cx="17.2" cy="19.2" r="1.15" />
        </svg>
      </span>
      <span className="header-cart__label sr-only">Cart</span>
      {shown > 0 ? <span className="header-cart__count">{shown}</span> : null}
    </Link>
  );
}
