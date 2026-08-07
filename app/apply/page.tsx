import ApplyForm from "./ApplyForm";

export const dynamic = "force-dynamic";

export default function ApplyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-pink">Apply</p>
        <h1 className="text-2xl font-extrabold text-brand-ink">Tell me about your business</h1>
        <p className="mt-2 text-brand-ink/60">
          Ten minutes now — I read every one of these myself before we talk.
        </p>
      </header>
      <ApplyForm />
    </main>
  );
}
