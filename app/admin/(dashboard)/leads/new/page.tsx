import { listProducts } from "@/lib/db/products";
import LeadForm from "../LeadForm";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">New lead</h1>
      <LeadForm mode="create" products={products} />
    </div>
  );
}
