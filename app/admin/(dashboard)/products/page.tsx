import { listProducts } from "@/lib/db/products";
import AddProductForm from "./AddProductForm";
import ToggleActiveButton from "./ToggleActiveButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Products</h1>

      <AddProductForm />

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.price != null ? `£${p.price}` : "—"}</td>
                <td>
                  <span className={p.active ? "badge badge-pos" : "badge badge-neutral"}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-right">
                  <ToggleActiveButton
                    productId={p.id}
                    name={p.name}
                    price={p.price}
                    active={p.active}
                  />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-[#0a0608]/50 py-6">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
