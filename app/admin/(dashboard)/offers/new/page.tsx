import OfferForm from "../OfferForm";

export default function NewOfferPage() {
  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">New offer</h1>
      <OfferForm mode="create" />
    </div>
  );
}
