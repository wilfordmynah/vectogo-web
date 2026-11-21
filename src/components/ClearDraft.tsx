"use client";

import { useEffect } from "react";

/** Forgets the saved order form once an order is paid. */
export default function ClearDraft() {
  useEffect(() => {
    try {
      localStorage.removeItem("vg-order-draft");
    } catch {}
  }, []);
  return null;
}
