import Link from "next/link";
import { listOffers } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const offers = await listOffers();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Offers</h1>
        <Link
          href="/admin/offers/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          New offer
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Offer name</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{o.fields["Offer Name"]}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/offers/${o.id}`} className="text-gray-700 underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
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
