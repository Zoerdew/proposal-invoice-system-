// Silently does nothing if SLACK_WEBHOOK_URL isn't set yet, so the cron job
// keeps working even before Zoë finishes setting this up.
export async function sendSlackAlert(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("Slack alert failed to send:", err);
  }
}
