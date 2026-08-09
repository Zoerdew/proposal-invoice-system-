import { notFound } from "next/navigation";
import { getOffer, getOfferLineItems } from "@/lib/db/offers";
import OfferForm from "../OfferForm";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let offer;
  try {
    offer = await getOffer(id);
  } catch {
    notFound();
  }

  const lineItems = await getOfferLineItems(id);

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Edit offer</h1>
      <OfferForm
        mode="edit"
        offerId={id}
        initial={{
          name: offer.name,
          tagline: offer.tagline,
          description: offer.description,
          contractTerms: offer.contractTerms,
          paymentPlans: offer.paymentPlanOptions,
          rows: lineItems.map((item) => ({
            key: item.id,
            description: item.description,
            kind: item.kind,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }}
      />
    </div>
  );
}
