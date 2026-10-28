"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelAction } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "./ui";

export function CancelBookingButton({ bookingId, dict }: { bookingId: string; dict: Dictionary["myBookings"] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    if (!window.confirm(dict.confirmCancel)) return;
    startTransition(async () => {
      const result = await cancelAction(bookingId);
      if (!result.ok) setError(dict.errors[result.error]);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button variant="danger" onClick={cancel} disabled={pending}>
        {pending ? dict.cancelling : dict.cancel}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
