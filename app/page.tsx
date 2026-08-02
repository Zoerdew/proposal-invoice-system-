export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-extrabold text-brand-ink">Proposals</h1>
      <p className="text-brand-ink/60">
        Proposals live at <code>/proposal/[slug]</code> — there&apos;s nothing
        to see here.
      </p>
    </main>
  );
}
