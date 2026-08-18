# Readiness Funnel QA Before Merge

This branch adds a standalone `/nonprofit-readiness.html` acquisition page plus first-customer operating assets.

Before merging:
1. Open the Netlify Deploy Preview on desktop and phone.
2. Complete all three result bands by varying answers.
3. Confirm the CTA returns to the current Start Your Cause home/product flow.
4. Confirm no questionnaire data is sent to analytics.
5. Add analytics events from `LAUNCH_TRACKING.md` using the site's existing analytics implementation.
6. Decide whether email capture is desired. The included readiness lead endpoint validates input but intentionally does not persist leads until an approved CRM/email destination is configured.
7. Add a visible link to the readiness assessment from the home page only after QA.

Do not merge solely because the page builds. This is a conversion funnel and should be preview-tested first.