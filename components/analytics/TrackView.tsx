"use client";

import { useEffect } from "react";
import { analyticsEvents, trackEvent, type AnalyticsEvent } from "@/lib/analytics";

export function TrackView({
  event,
  id,
}: {
  event: AnalyticsEvent;
  id: string;
}) {
  useEffect(() => {
    trackEvent(event, { id });
  }, [event, id]);
  return null;
}

export { analyticsEvents };
