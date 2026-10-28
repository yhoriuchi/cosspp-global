# Verified profile-change requests

Status: implemented locally, disabled. No Cloudflare/Resend account, domain, private
queue repository, token or production endpoint has been configured. The public form
therefore displays an availability notice. This document is setup preparation, not a
claim that passcode delivery or automatic changes have been tested in production.

## Behavior and privacy

1. Enter the exact FSU email already listed on the selected profile (FSU subdomains
   accepted). The service sends a six-digit, ten-minute passcode only to that address.
2. Enter the passcode and free-text request. Requests enter a private D1 outbox and
   then a private GitHub repository. The application sends no administrator email.
   GitHub's own account notifications are controlled separately by the owner.
3. General requests remain pending review. Optionally provide a replacement research
   summary with explicit consent to publish it. Only that exact summary can be applied
   automatically, after trusted signature/identity/age checks, validation, tests and build.
   Other fields, including appointments, language and geography, retain source review.

Codes are HMAC-hashed, expire, allow five attempts and can be consumed once. Limits:
three emails per address per 15 minutes, 30 API attempts per IP per 15 minutes and
90 email attempts per UTC day. This caps requests below Resend Free's daily quota;
shared account usage and provider-side limits can still cause delivery failures.
Do not enable request-body logging or put secrets in frontend configuration. The Worker
retries pending GitHub writes hourly. Consumed codes/rate limits are cleaned up; delivered
D1 copies expire after seven days. Private GitHub requests are retained until manually
removed, including Git history; define retention before collecting real requests.

## Free-plan setup (requires owner action)

Use Cloudflare Workers Free + D1 Free and Resend Free. Keep paid upgrades disabled.
Resend requires a sender domain you control and DNS verification; purchasing a domain
is not included. Free quotas may change and do not guarantee service availability.

1. Create the service accounts and verify the sender domain. No account or DNS changes
   are authorized by this preparation alone. Approve/create the separate **private**
   `yhoriuchi/cosspp-global-requests` repository; never put requests in this public repo.
2. Copy `services/profile-requests/wrangler.example.jsonc` to ignored `wrangler.jsonc`
   in that directory. Create a D1 database, enter its ID and apply `schema.sql` remotely
   using Cloudflare Wrangler. Set a verified FROM_EMAIL and keep ENABLED=false initially.
3. Through provider secret settings set Worker OTP_SECRET and REQUEST_SIGNING_KEY
   to independent random strings of at least 32 characters; set RESEND_API_KEY.
   Set QUEUE_TOKEN to a fine-grained token with Contents write only on the private
   queue. DISPATCH_TOKEN needs Actions write only on the public site repository.
   Never paste credentials into chat, source, URLs or command arguments.
4. In the site repository, set secrets PROFILE_REQUEST_QUEUE_READ_TOKEN (private
   queue Contents read) and PROFILE_REQUEST_SIGNING_KEY (same request signing key).
   Set variable PROFILE_REQUEST_QUEUE= yhoriuchi/cosspp-global-requests.
   Leave ENABLE_PROFILE_REQUESTS unset/false until end-to-end checks pass.
5. Deploy the disabled Worker. Using a real listed faculty mailbox under owner control,
   verify email delivery, expiry, replay rejection, private queue storage, absence of
   sensitive logs, general-request handling and one expressly consented summary change.
   A failed queue delivery must remain in D1 without prompting duplicate submission.
6. Enable ENABLE_PROFILE_REQUESTS=true on GitHub, ENABLED=true on the Worker, and
   put its HTTPS origin in public/site-config.json's profileRequestsApi. Run validation,
   unit/browser tests, build and manual Pages publication. ENABLE_PAGES must remain true
   for automatic publication of future validated summary changes.

Rollback: restore profileRequestsApi=null, disable ENABLE_PROFILE_REQUESTS and Worker
ENABLED. Existing public profiles remain available. Inspect queue and deployed revision
before retrying failures. A source commit can succeed even if subsequent deployment fails.
Request signatures expire after seven days; an old pending summary requires re-verification.

## References checked 2026-10-28

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free 100,000 requests/day and CPU limits.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/): free quotas; requests stop at free limits.
- [Resend plans](https://resend.com/pricing): Free 3,000 emails/month, 100/day.
- [Sending email](https://resend.com/docs/api-reference/emails/send-email): verified sender domain.
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions): standard public-repository runners are free.
