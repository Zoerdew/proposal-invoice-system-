import { notFound } from "next/navigation";
import { getOffer, getOfferLineItems } from "@/lib/airtable";
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

  const lineItems = await getOfferLineItems(offer);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit offer</h1>
      <OfferForm
        mode="edit"
        offerId={id}
        initial={{
          name: offer.fields["Offer Name"] ?? "",
          tagline: offer.fields.Tagline ?? "",
          description: offer.fields.Description ?? "",
          contractTerms: offer.fields["Default Contract Terms"] ?? "",
          paymentPlans: offer.fields["Payment Plan Options"] ?? [],
          rows: lineItems.map((item) => ({
            key: item.id,
            description: item.fields.Description ?? "",
            kind: item.fields.Kind ?? "Fixed",
            quantity: item.fields.Quantity ?? 1,
            unitPrice: item.fields["Unit Price"] ?? 0,
          })),
        }}
      />
    </div>
  );
}
