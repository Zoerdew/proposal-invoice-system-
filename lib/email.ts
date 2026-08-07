import { Resend } from "resend";

const FROM = "Zoë <hello@zoedew.com>";

function requireResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export interface OnboardingEmailInput {
  to: string;
  firstName: string;
  onboardingUrl: string;
}

// One transactional template, per BUILD-SPEC.md: welcome, what happens
// next, the onboarding link, what data they need to have ready.
export async function sendOnboardingEmail(input: OnboardingEmailInput): Promise<void> {
  const resend = requireResend();

  const text = `Hi ${input.firstName},

You're signed up for In Control. Here's what happens from here.

Over the next 90 days we'll work through six calls — one 90-minute kick-off, then five 60-minute strategy calls. Along the way you'll get a GOLD Report, an Evidence Dashboard, and a Commercial Scorecard, all live in your own portal.

First thing: get set up in the portal. Ten minutes now saves a lot of back-and-forth later.

${input.onboardingUrl}

It'll ask for the basics — where your revenue data lives, roughly what's coming in each month, what's already been tried, and what you're actually trying to get out of the next 90 days.

Any questions before we start, reply to this email.

Zoë`;

  const html = `<p>Hi ${input.firstName},</p>
<p>You're signed up for In Control. Here's what happens from here.</p>
<p>Over the next 90 days we'll work through six calls — one 90-minute kick-off, then five 60-minute strategy calls. Along the way you'll get a GOLD Report, an Evidence Dashboard, and a Commercial Scorecard, all live in your own portal.</p>
<p>First thing: get set up in the portal. Ten minutes now saves a lot of back-and-forth later.</p>
<p><a href="${input.onboardingUrl}">${input.onboardingUrl}</a></p>
<p>It'll ask for the basics — where your revenue data lives, roughly what's coming in each month, what's already been tried, and what you're actually trying to get out of the next 90 days.</p>
<p>Any questions before we start, reply to this email.</p>
<p>Zoë</p>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: "You're in — here's what happens next",
    text,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
