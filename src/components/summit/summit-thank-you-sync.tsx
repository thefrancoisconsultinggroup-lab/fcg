"use client";

import { useEffect } from "react";

export function SummitThankYouSync({ registrationId }: { registrationId?: string }) {
  useEffect(() => {
    if (!registrationId) {
      return;
    }

    fetch(`/api/human-capacity-summit/paypal/status?registrationId=${encodeURIComponent(registrationId)}`)
      .catch(() => undefined);
  }, [registrationId]);

  return null;
}
