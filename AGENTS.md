# Codex Working Instructions — Universal Starter

Read `CODEX_PROJECT_SPEC.md` before making changes. It is the authoritative product and acceptance specification. This file defines persistent engineering rules.

## Goal

Build a reusable cross-platform starter with **one vanilla HTML/CSS/JavaScript SPA**, Vite, Capacitor (Android and iOS), Electron (Windows/macOS/Linux), GitHub Actions and GitHub Pages. Android and iOS are equal-priority. Do not introduce TypeScript or a UI framework.

## Working method

1. Inspect the repository and current tooling before modifying files. Keep existing user work intact.
2. Work through the implementation phases in §17 of the specification, verifying each phase before the next.
3. Select mutually compatible current stable tool versions; pin and document tested versions, commit the npm lockfile, and use `npm ci` in CI.
4. Implement real commands, tests, workflows, native projects and documentation—not placeholders disguised as finished features.
5. Prefer simple, readable JavaScript ES modules, JSDoc for public interfaces, minimal dependencies and portable Node.js scripts.
6. Do not split or duplicate the shared UI by platform. All native APIs must pass through the platform abstraction layer.
7. Do not change external accounts, publish releases, submit apps, purchase services, or configure privileged secrets without explicit user approval.
8. At each milestone report what actually ran, what passed, what failed and what is blocked by host OS, credentials or devices.

## Future CLI and client credentials

- Design V1 as a versioned, configurable template, but **do not implement the project-generator or updater CLI**. Maintain `universal-app.config.json`, `.universal-app.json`, clear file-ownership boundaries, and reusable setup scripts.
- Support late client-supplied signing credential onboarding via `npm run credentials:*` scripts. Do not require production certificates for ordinary development.
- Treat credentials as client-controlled assets. Never generate, rotate, overwrite, commit, log, or upload production keys/certificates without explicit informed approval. GitHub secret sync is opt-in and requires authorization and confirmation.
- Report local signing, CI signing, and store publication readiness separately; document handoff, expiration and recovery procedures.

## Security invariants

- Electron: context isolation, no renderer Node integration, restricted preload, validated IPC, restrictive CSP, safe navigation and external links.
- Mobile: least-privilege permissions; native assets bundled in release builds; never ship a LAN dev-server URL or debug-only cleartext allowances in production.
- CI: least-privilege permissions, no secrets in PR builds from forks, protected beta/production environments, no secret material committed or logged.
- Desktop auto-update is disabled until signed trusted updates are configured and verified.
- Unsupported features must be shown as unsupported; never fake native capability success.

## Testing and acceptance

Follow the explicit checklist in §16 of `CODEX_PROJECT_SPEC.md`. Every check must be labelled PASS, FAIL or BLOCKED with evidence. Do not claim iOS compilation on non-macOS hosts, signing without credentials, real-device wireless deployment without a device, or store publication without account access.

Before finishing, run all feasible checks, validate workflow syntax, ensure every documented npm script exists, verify release configuration has no dev-server URL, and produce a final verification matrix plus precise next steps for blocked items.

## Documentation

Write plain-English guides with real commands, prerequisites, expected output and troubleshooting. Keep `README.md`, `docs/commands.md`, `docs/toolchain.md` and the platform guides in sync with actual implementation. Treat documentation errors as product defects.

## Definition of done

The starter is complete only when its shared app, wrappers, tests, CI workflows, packaging and documentation meet the specification, and all unverified credential/device-dependent tasks are explicitly disclosed rather than silently assumed complete.
