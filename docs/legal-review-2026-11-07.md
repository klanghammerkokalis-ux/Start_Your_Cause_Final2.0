# Start Your Cause legal review and corrections

Review date November 7, 2026. This is a product and source audit for the operator. It records legal content checked, corrections prepared, and issues that require additional evidence or legal judgment. The baseline and individual jurisdiction citations are in [the November 6 review](legal-accuracy-review-2026-11-06.md).

| Area | Correction in this branch | Remaining verification |
| --- | --- | --- |
| Federal formation and annual reporting | Preserved the prior corrections to Form 1023-EZ eligibility, the full Form 1023 pathway, annual return dates, extensions, and entity classifications. Used the IRS worksheet as the eligibility reference. | Attorney or exempt-organization tax review of tailored clauses and decisions for unusual entities, private foundations, and organizations with special filing obligations. |
| State and territorial formation and solicitation | Replaced legacy fee, timing, board-size, and solicitation assertions in the interactive workflow and generated documents with verification steps and regulator links. The cost calculator totals amounts entered from official sources. | Reconcile dedicated public guides and the static fee directory against current agency forms for every jurisdiction before calling those pages individually verified. Check separate formation, fundraising, tax, and renewal authorities, and territory links. |
| Paid access and recurring billing | Added clear renewal and cancellation text near hosted Checkout submission. The membership endpoint validates that Stripe's configured base price matches the disclosed $12 USD monthly plan. Aligned one-time access terms to the 365-day rule in the verifier. | In a Stripe sandbox, verify that the disclosure renders before confirmation, how assent is captured, which terms version is recorded, cancellation through the portal, renewal and acknowledgment notices, and discount/refund handling. Map state automatic-renewal requirements to the customers actually served. |
| Privacy and data handling | Updated notices for public forms, support requests, account deletion, retention exceptions, and analytics. Removed raw Stripe session references, saved project IDs, entered fee amounts and formation dates from the affected analytics events. Recorded the amount actually paid after discounts. | Inspect real network payloads, Google Analytics enhanced measurement and retention, access policies, deletion across vendor systems, logs, backup schedules, and applicable state privacy rights and consent controls. |
| Marketing and customer communications | Reviewed public signup and contact surfaces, plus the published Guided Start offer. | Verify the distinction between requested service emails and marketing, an approved business mailing address for commercial mail, unsubscribe processing, and suppression records. Confirm those controls in the welcome and follow-up automations. |
| Guided Start and customized templates | The public description limits the offer to a written planning roadmap, resource links, and a follow-up exchange. Draft generation now directs customers to the appropriate public filing authorities for variable requirements. | Have counsel evaluate the actual intake, deliverables, recommendations, and follow-up scripts under the unauthorized-practice rules of jurisdictions served. Review the paid offer's scope, delivery and refund terms before expanding fulfillment. |
| Terms and tax administration | Clarified current product price, access, renewal, and billing support terms. | Confirm the contracting entity, actual assent records, refunds and paid-access handling, and whether sales tax registration, collection, or filing applies. |

## Primary references

- [IRS Form 1023-EZ instructions and eligibility worksheet](https://www.irs.gov/instructions/i1023ez)
- [IRS directory of state charity, corporation and tax agencies](https://www.irs.gov/charities-non-profits/state-links)
- [Restore Online Shoppers' Confidence Act, 15 U.S.C. § 8403](https://www.govinfo.gov/link/uscode/15/8403)
- [FTC CAN-SPAM Act compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Stripe Checkout Session creation reference](https://docs.stripe.com/api/checkout/sessions/create)

## Verification

Local regression tests cover all 13 generated documents across supported jurisdictions, ownership and expiry of paid access, zero-dollar discounted checkout, purchase analytics payloads, and the options sent to Stripe Checkout. Hosted Checkout and Portal behavior, production network events, provider settings, and counsel review remain separate verification steps.

## Follow-up review of five public formation guides

The guides now distinguish New York’s statutory agent for service from its optional separate registered agent, and Pennsylvania’s registered office from a commercial office provider. The Pennsylvania guide also explains the incorporation-notice requirement and the corporate annual report. Texas now states the board-managed minimum and points to the member-managed option. Michigan and Florida identify the corporate annual filing separately from charity and IRS filings.

This pass checks the named formation and corporate-report topics only. The 56-jurisdiction static fee directory, solicitation exceptions, state tax procedures, and full governing-document requirements remain separate review items.

- [New York formation instructions](https://dos.ny.gov/certificate-incorporation-domestic-not-profit-corporations) and [Not-for-Profit Corporation Law § 305](https://www.nysenate.gov/legislation/laws/NPC/305)
- [Pennsylvania registered office guidance](https://www.pa.gov/agencies/dos/programs/business/information-services/commercial-registered-office-providers), [Title 15 § 5307](https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/15/00.053..HTM), and [corporate annual reports](https://www.pa.gov/agencies/dos/programs/business/types-of-filings-and-registrations/annual-reports)
- [Texas Form 202 instructions](https://www.sos.state.tx.us/corp/forms/instructions/202-boc-instructions.pdf)
- [Michigan annual reports and fees](https://www.michigan.gov/lara/bureau-list/cscl/corps/michigan-business-roadmap/annual-reports-and-annual-statements)
- [Florida Sunbiz fee schedule](https://dos.fl.gov/sunbiz/forms/fees/) and [annual report filing](https://dos.fl.gov/sunbiz/manage-business/efile/annual-report)

## Follow-up review of corporate and charitable filing cycles

The remaining six standalone state formation guides now distinguish the relevant corporate filings from charity filings. This closes the targeted corporate-reporting copy pass across the eleven standalone state formation guides. It does not validate every claim in those guides or in the separate state fee directory.

- [California public benefit corporation instructions](https://bpd.cdn.sos.ca.gov/corp/pdf/articles/arts-pb.pdf) and [charity renewal](https://oag.ca.gov/charities/renewals)
- [Georgia corporate registration](https://sos.ga.gov/how-to-guide/how-guide-register-domestic-entity) and [charity registration](https://sos.ga.gov/how-to-guide/how-guide-charities)
- [Illinois Attorney General charitable reporting rules](https://www.illinoisattorneygeneral.gov/Page-Attachments/RulesTrustAct.pdf)
- [New Jersey corporate registration guide](https://www.nj.gov/treasury/revenue/pdf/Legacy-Reg-Form-0825.pdf) and [charity registration and renewal](https://www.njconsumeraffairs.gov/charities/Pages/forms.aspx)
- [North Carolina corporate reporting guidance](https://www.sosnc.gov/manual/business_registration_Reports/Page12) and [solicitation statutes and rules](https://www.sosnc.gov/documents/guides/charities/statutes_and_rules.pdf)
- [Ohio continued existence instructions](https://www.ohiosos.gov/assets/522.pdf) and [charity registration and reporting](https://charitable.ohioago.gov/Charity-Registration)

## Fee directory follow-up

Clarified that the state fee directory covers domestic nonprofit incorporation, with separate charges possible for charitable registration, tax filings, and recurring reports. Added Minnesota’s method-specific prices and Oregon’s processing fee from their filing offices. The remaining rows labeled for verification still require a current filing-office check.

- [Minnesota Secretary of State fee schedule](https://sos.mn.gov/fees)
- [Oregon Secretary of State incorporation guide](https://sos.oregon.gov/business/documents/business-guides/start-business-guide.pdf)
