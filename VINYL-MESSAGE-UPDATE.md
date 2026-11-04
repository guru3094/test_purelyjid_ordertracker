# Vinyl text validation and artist/customer messages

Based on latest GitHub main `a142895` (Delhivery seven-day pickup-window update). The update is intended for the same repository and existing deployment pipeline.

## Customer font validation

The existing eight PF01–PF08 fonts and their Canva templates are unchanged. Character-count-based width restrictions have been removed. Customer text widths use the original 2.5–29 cm range, independently of text length. Required text and basic numeric width checks remain.

## Customer WhatsApp

Order remarks from the existing Orders sheet are included when nonempty. Both the full invoice and advance-only variants use the same helper, so this applies to Create Sale and Orders. Existing status sentences, PDF links, product-decision rules and Workshop/Raw Materials tracking exclusions remain. No remarks were added to the PDF itself.

## Resin artist flow

1. Staff clicks Artist/Resend on Orders, or creates the missing artist details first.
2. A staff dialog checks the product name before issuing an acceptance link.
3. Common currency and price notation (₹, Rs/INR, amounts with /-, labelled prices, product-line price suffixes) returns an editable product description instead of a link. Dimensions and quantities with units can remain.
4. Staff edits the artist-facing description and clicks Save corrected name & open WhatsApp. The server validates it again and persists it in the artist request before generating the token.
5. WhatsApp and the acceptance page use that same reviewed name. The link URL is an opaque token; it never contains product names, remarks, or amounts. Original customer product details in the Orders sheet/database are not rewritten by this edit.
6. On acceptance, the first artist-sheet append uses the reviewed product name. Customer order remarks are not included anywhere in the artist message, artist acknowledgement or artist acceptance page, and are not added to the artist sheet. Existing artist comments/cost columns remain as before.
7. A resend for a previously accepted request updates only the existing artist-sheet product and artist-comments cells if needed, without appending a duplicate or changing artist costs/status. The prior product/date/customer combination must uniquely identify a row. The code stops safely if the row is missing or ambiguous and restores the token for retry. If a prior sheet update succeeded but the database update failed, it can also recognize the revised description on retry.

Price recognition is a safeguard for common price formats, not a semantic guarantee for every possible unlabelled number; staff should review the final message. Existing token expiry and active-link restrictions remain. Legacy links with a detected price in their product name cannot show that description or be accepted after this code is deployed.

## Database

The additive migration in `supabase/migrations/*_artist_request_message_remarks.sql` has already been applied to the PurelyJid order-tracker Supabase project. It adds the prior sheet product-name snapshot and a pending-sheet-update flag. A reserved `remarks` column was created during preparation but is not populated or displayed by the final artist flow. No existing order/request records were edited, accepted or deleted during implementation. Existing RLS and backend grants were verified. No new environment variables or package changes are needed.

## Validation

- TypeScript and targeted ESLint for the changed modules.
- Full production build with placeholder Supabase build credentials.
- Regression tests covering removal of character-based width rules, required text, price-review gating, corrected WhatsApp and sheet content, resends, ambiguous sheet rows, customer-only remarks, private legacy links and staff authentication.
- Existing order status-sync tests included.
- Google Sheets and WhatsApp side effects were mocked in tests; no real messages were sent and no customer/artist sheet rows were written during verification. Browser visual verification was not available.

Replace files at matching paths or use the complete project archive. Deploy using the existing production deployment process.
