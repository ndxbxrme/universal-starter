# Documentation review — 1 November 2026

This pass makes the main development guides easier to navigate and adds a client-facing account/handover route. Application behavior, native projects, dependencies and workflows were not changed. The pre-existing edit in `src/main.js` was preserved.

## What changed

Clients start at [Getting your app ready for the stores](client-start-here.md), then follow [Apple](client-apple.md), [Google Play](client-google-play.md) or [desktop](client-desktop.md) instructions. The [handover worksheet](client-handover.md) records ownership, renewal and recovery responsibility without secret values.

The guides explain who performs each action, what to prepare, what to click, what completion looks like and when to ask the developer. Apple guidance distinguishes web account work from Mac build/signing work, explains Individual versus Organisation access, and separates signing identities from optional API keys. There is no instruction to collect unnecessary credentials or share account passwords.

README, first-run, development, Android, iOS, desktop, credentials, CI, testing-distribution, publishing, customisation, troubleshooting and release navigation were revised. The iOS guide's old claims of no location/camera/photo permissions or app UserDefaults use were removed to match the current showcase and privacy manifest. Historical build evidence remains in its dated reports.

The Android keystore illustration comes from Google's official documentation, with local source/licence information. Apple certificate screenshots are available through linked official illustrated help; no authenticated Apple account screen or Mac execution is implied.

## Verification

| Check                                                | Result  | Evidence / limit                                                                                                                                                                                          |
| ---------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script and documentation links                       | PASS    | `npm run verify:docs`: all 49 required scripts exist; documented npm commands and local links resolve                                                                                                     |
| Repository/workflow configuration                    | PASS    | `npm run verify:repository` and actionlint 1.7.12                                                                                                                                                         |
| Formatting and whitespace                            | PASS    | `npm run format:check` and `git diff --check`                                                                                                                                                             |
| Credential documentation against implementation      | PASS    | Reviewed setup/reference loading, mobile release helpers and beta/release workflows; ran all four setup `--help` paths and the read-only GitHub secret-name plan                                          |
| Public account instructions                          | PASS    | Checked official Apple/Google help for enrolment, account types, roles, invitations, signing, API keys, testing and store routes; checked Microsoft signing options and GitHub environment/Pages guidance |
| Client handout rendering                             | PASS    | Local standalone HTML and tagged A4 PDF; image loaded, zero broken internal anchors and no horizontal overflow; PDF text extracted and representative page visually inspected                             |
| Actual client account walkthrough                    | BLOCKED | No authenticated client accounts supplied; no registrations, payments, invitations, keys, secrets or account settings changed                                                                             |
| Apple/Windows signing and physical-device acceptance | BLOCKED | Appropriate hosts, credentials and devices still required; public documentation is not a substitute for runtime verification                                                                              |

No app/native rebuild or full runtime test suite was repeated for these documentation-only changes. The previous [showcase report](device-showcase-verification.md) records implementation tests and the outstanding build-tool audit findings. They are not claimed fixed by this review.

## Printable handout

The local snapshot is `artifacts/client-guides/client-account-setup.pdf`, with a standalone HTML version beside it. It combines the five client guides and the screenshot licence. It is an ignored build artifact, not a committed or published download. The Markdown above remains the editable source.

Optional regeneration instructions and snapshot exporters are in that artifact directory's `README.txt`. Export used the already-installed Python Markdown 3.5.2 plus project Playwright 1.64.1/Chromium; no application dependency was added. Rebuild the handout after editing its sources. Local developer-reference links become labelled text; client chapters and official external links remain usable in the handout.

Public screen names were checked on the date above. Stores may change labels and request account-specific evidence; the guides link official instructions and explain those limits. No publishing or external account changes were performed.
