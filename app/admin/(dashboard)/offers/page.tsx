import Link from "next/link";
import { listOffers } from "@/lib/db/offers";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const offers = await listOffers();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading font-[800] text-xl">Offers</h1>
        <Link href="/admin/offers/new" className="admin-btn px-4 py-2 text-sm">
          New offer
        </Link>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Offer name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td className="text-right">
                  <Link href={`/admin/offers/${o.id}`} className="admin-btn-secondary text-xs px-3 py-1.5">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center text-[#0a0608]/50 py-6">
                  No offers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
