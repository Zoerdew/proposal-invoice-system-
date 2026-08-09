import { getClientOffers } from "@/lib/db/clientOffers";
import ClientTabs from "../ClientTabs";
import ClientOffersTable from "./ClientOffersTable";

export const dynamic = "force-dynamic";

export default async function ClientOffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offers = await getClientOffers(id);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">Offers</h1>
      <ClientTabs clientId={id} />
      <ClientOffersTable
        clientId={id}
        initialRows={offers.map((o) => ({
          key: o.id,
          name: o.name,
          price: o.price != null ? String(o.price) : "",
          stillLive: o.stillLive,
          deliveryHours: o.deliveryHours != null ? String(o.deliveryHours) : "",
        }))}
      />
    </div>
  );
}
