"use client";

import { useEffect } from "react";

export function SummitWaterTheme() {
  useEffect(() => {
    const previousTheme = document.body.dataset.waterTheme;
    document.body.dataset.waterTheme = "summit-gold";

    return () => {
      if (previousTheme) {
        document.body.dataset.waterTheme = previousTheme;
      } else {
        delete document.body.dataset.waterTheme;
      }
    };
  }, []);

  return null;
}
