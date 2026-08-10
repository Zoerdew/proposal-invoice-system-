import { listProducts } from "@/lib/db/products";
import NewClientForm from "./NewClientForm";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">New client</h1>
      <NewClientForm products={products} />
    </div>
  );
}
