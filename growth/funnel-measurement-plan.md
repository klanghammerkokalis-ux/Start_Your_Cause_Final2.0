# Start Your Cause funnel measurement plan

## Funnel

1. Discovery: `page_view`, `resource_view`, `resource_75_percent`
2. Engagement: `resource_click`, `quiz_start`, `quiz_complete`, `document_preview_open`, `comparison_open`
3. Lead: `generate_lead` with `lead_source`
4. Intent: `form_start`, `form_step_view`, intake completion, and document-generation events
5. Revenue: `begin_checkout`, Stripe purchase or verified checkout success, `checkout_cancel`, `checkout_error`

## GA4 conversions to mark

- `generate_lead`
- intake completion or document-generation event used by the application
- `begin_checkout`
- `purchase` or the verified-checkout success event

## Required dimensions

`source`, `resource_slug`, `lead_source`, `quiz_name`, `possible_disqualifiers`, `form_id`, `step_number`, `plan_id`, and `checkout_source`.

## Weekly scorecard

Report users, resource views, 75% readers, quiz starts/completions, leads, intake starts/completions, checkouts, purchases, and revenue. Calculate each step-to-step conversion rate and compare by landing page/source. The primary acquisition KPI is qualified intake starts; the primary business KPI is purchases.

## QA

Use GA4 DebugView after deployment. Complete one clean test path from resource page through quiz, intake, and test checkout. Confirm events fire once, parameters populate, Stripe success maps to a purchase or verified success event, and internal/test traffic is filtered from operating reports.
