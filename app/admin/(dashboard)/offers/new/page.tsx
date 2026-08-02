import OfferForm from "../OfferForm";

export default function NewOfferPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New offer</h1>
      <OfferForm mode="create" />
    </div>
  );
}
