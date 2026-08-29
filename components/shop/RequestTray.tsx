"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { fitLabels, getCloth, getGarment } from "@/lib/data/shop";
import {
  BUNDLE_ADDED_EVENT,
  BUNDLE_LIMIT,
  releasePiece,
  updatePiece,
  useAtelierBundle,
  type HoldNotice,
} from "@/components/shop/useAtelierBundle";

function noticeCopy(detail: HoldNotice) {
  const name = getGarment(detail.slug)?.name ?? "That piece";
  if (detail.status === "added") return `${name} added to your request`;
  if (detail.status === "full") {
    return `Your request is full (${BUNDLE_LIMIT} pieces). Remove one to add another.`;
  }
  return `${name} is already in your request`;
}

export function RequestTray() {
  const pathname = usePathname();
  const { items } = useAtelierBundle();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const onShopPage = pathname === "/shop";
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [formInView, setFormInView] = useState(false);
  const [flash, setFlash] = useState(false);
  const panelId = useId();
  const trayRef = useRef<HTMLDivElement>(null);

  function goToRequest(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/shop") return;
    event.preventDefault();
    document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "/shop#request");
    setOpen(false);
  }

  useEffect(() => {
    function onAdded(event: Event) {
      const detail = (event as CustomEvent<HoldNotice>).detail;
      if (!detail) return;
      setNotice(noticeCopy(detail));
      setFlash(true);
    }
    window.addEventListener(BUNDLE_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(BUNDLE_ADDED_EVENT, onAdded);
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
    if (!onShopPage) return;
    const form = document.getElementById("request");
    if (!form) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry?.intersectionRatio ?? 0;
        const next = Boolean(entry?.isIntersecting && ratio >= 0.28);
        setFormInView((current) => (current === next ? current : next));
      },
      { threshold: [0.2, 0.28, 0.5] },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [onShopPage]);

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
    const visible = mounted && items.length > 0 && !(onShopPage && formInView);
    document.documentElement.classList.toggle("request-tray-open", visible);
    document.documentElement.classList.toggle("request-tray-expanded", visible && open);
    return () => {
      document.documentElement.classList.remove("request-tray-open", "request-tray-expanded");
    };
  }, [mounted, items.length, onShopPage, formInView, open]);

  if (!mounted || items.length === 0 || (onShopPage && formInView)) return null;

  const kinds = items.length;
  const pieceWord = kinds === 1 ? "piece" : "pieces";

  return (
    <div
      ref={trayRef}
      className={`request-tray ${flash ? "is-flash" : ""} ${open ? "is-open" : ""}`}
      role="region"
      aria-label="Your request"
    >
      <p className="request-tray__live" role="status" aria-live="polite">
        {notice || `${kinds} ${pieceWord} in your request`}
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
            {kinds}
          </span>
          <span className="request-tray__copy">
            <strong>Your request</strong>
            <span>
              {kinds} {pieceWord}
            </span>
          </span>
          <span className="request-tray__chevron" aria-hidden="true" />
        </button>
        <Link
          href="/shop#request"
          className="btn btn-plum request-tray__cta"
          aria-label="Review request"
          onClick={goToRequest}
        >
          Review
        </Link>
      </div>

      <div id={panelId} className="request-tray__panel" hidden={!open}>
        <ul>
          {items.map((item) => {
            const garment = getGarment(item.slug);
            const cloth = getCloth(item.cloth);
            return (
              <li key={item.slug}>
                <span
                  className="request-tray__swatch"
                  style={{ background: cloth?.hex ?? "#5e2063" }}
                  aria-hidden="true"
                />
                <div>
                  <p>{garment?.name ?? item.slug}</p>
                  <p>
                    {item.quantity} × {fitLabels[item.fit]} · {cloth?.name ?? "Plum"}
                  </p>
                </div>
                <div className="request-tray__qty">
                  <button
                    type="button"
                    aria-label={`Fewer ${garment?.name ?? item.slug}`}
                    disabled={item.quantity <= 1}
                    onClick={() => updatePiece(item.slug, { quantity: item.quantity - 1 })}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`More ${garment?.name ?? item.slug}`}
                    disabled={item.quantity >= 3}
                    onClick={() => updatePiece(item.slug, { quantity: item.quantity + 1 })}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="request-tray__remove"
                  onClick={() => releasePiece(item.slug)}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
        <p className="request-tray__hint">
          Nothing is charged here. Review sends the request so the workshop can confirm a fair
          price.
        </p>
      </div>
    </div>
  );
}
