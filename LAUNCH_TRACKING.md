# Launch Tracking Specification

Track these events in the existing analytics implementation before scaling traffic.

- readiness_view
- readiness_complete (include score band only: ready / groundwork / validate)
- readiness_cta_click
- pricing_view
- checkout_start (include plan: monthly / annual)
- checkout_success (include plan; never send sensitive questionnaire data)
- login_success
- document_generate (include document type only)
- billing_portal_open

## UTM convention
utm_source = linkedin | reddit | partner | organic | direct
utm_medium = social | referral | organic | email
utm_campaign = first10 | state_[state] | partner_[category]

## Privacy rule
Do not send names, emails, addresses, EINs, mission narratives, board-member information, or other customer questionnaire contents to analytics.