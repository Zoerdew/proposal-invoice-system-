import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import { listTodosForClient } from "@/lib/db/todos";
import { listProducts } from "@/lib/db/products";
import TodoList from "@/components/portal/TodoList";

export const dynamic = "force-dynamic";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [todos, products] = await Promise.all([listTodosForClient(client.id), listProducts()]);
  const productName = products.find((p) => p.id === client.productId)?.name ?? "Falling Forwards";

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-10">
        <span className="eyebrow-pill">{productName}</span>
        <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
          Your <span className="text-accent">to-dos</span>
        </h1>
        <p className="text-sm text-[#0a0608]/60">
          Pulled from what came up on our calls together.
        </p>
      </div>
      <TodoList token={token} initialTodos={todos} />
    </div>
  );
}
