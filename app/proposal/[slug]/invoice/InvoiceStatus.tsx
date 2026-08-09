"use client";

import { useEffect, useRef, useState } from "react";
import { currency } from "@/lib/currency";

type ViewStatus = "Signed" | "Invoiced" | "Paid";

interface InvoiceInfo {
  sequence: number;
  amount: number;
  dueDate: string;
  url: string | null;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function InvoiceStatus({
  slug,
  initialStatus,
  initialInvoices,
}: {
  slug: string;
  initialStatus: ViewStatus;
  initialInvoices: InvoiceInfo[];
}) {
  const [status, setStatus] = useState<ViewStatus>(initialStatus);
  const [invoices, setInvoices] = useState<InvoiceInfo[]>(initialInvoices);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "Signed") return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/proposal-status?slug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "Invoiced" || data.status === "Paid") {
        setStatus(data.status);
        setInvoices(data.invoices ?? []);
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, slug]);

  if (status === "Invoiced" || status === "Paid") {
    return (
      <div className="card-brutal-blush p-6">
        <p className="mb-4 text-center font-heading font-[800]">
          Signed and invoiced — your invoice{invoices.length > 1 ? "s are" : " is"} ready.
        </p>
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.sequence}
                className="flex items-center justify-between card-brutal p-4"
              >
                <div className="text-sm flex flex-col gap-1.5">
                  {invoices.length > 1 && (
                    <span className="badge badge-neutral self-start">
                      Payment {invoice.sequence} of {invoices.length}
                    </span>
                  )}
                  <p className="text-[#0a0608]/60">
                    {currency.format(invoice.amount)} — due{" "}
                    {dateFormat.format(new Date(invoice.dueDate))}
                  </p>
                </div>
                {invoice.url ? (
                  <a href={invoice.url} target="_blank" rel="noreferrer" className="btn-pill px-4 py-2 text-xs">
                    View & pay
                  </a>
                ) : (
                  <p className="text-xs text-[#0a0608]/50">
                    Will be sent closer to its due date
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[#0a0608]/60">
            Invoice link is on its way — refresh in a moment if it doesn&apos;t appear.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card-brutal p-6 text-center">
      <p className="font-heading font-[800]">Signed — invoice on its way.</p>
      <p className="mt-1 text-sm text-[#0a0608]/60">
        This page will update automatically once it&apos;s ready.
      </p>
    </div>
  );
}
