"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Attachment {
  id: string;
  fileUrl: string;
  fileName: string;
}

export default function LeadAttachments({
  leadId,
  attachments,
}: {
  leadId: string;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/leads/${leadId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="admin-card p-6">
      <h2 className="mb-2 font-heading font-[800] text-lg">Attachments</h2>
      {attachments.length === 0 && (
        <p className="mb-4 text-sm text-[#0a0608]/50">No files uploaded yet.</p>
      )}
      {attachments.length > 0 && (
        <ul className="mb-4 space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="text-sm">
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                {a.fileName || "file"}
              </a>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <input ref={fileInputRef} type="file" onChange={handleFileChange} disabled={uploading} className="text-sm" />
      {uploading && <p className="mt-2 text-xs text-[#0a0608]/50">Uploading…</p>}
    </div>
  );
}
