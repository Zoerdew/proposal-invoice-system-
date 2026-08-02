export default function XeroConnectedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-extrabold text-brand-ink">Xero connected</h1>
      <p className="text-brand-ink/60">
        This app can now create and send invoices through your Xero
        organisation. You only need to do this once — reconnect here if the
        token connection is ever revoked.
      </p>
    </main>
  );
}
