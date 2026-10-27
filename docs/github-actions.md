# GitHub Actions

Workflows are defined but have not been executed remotely without a configured repository. Actions are pinned to verified commit SHAs; exact release tags are recorded in action-pins.json. Node 24 and npm ci are used throughout. Hosted runners: Ubuntu 24.04 x64, Windows Server 2025 x64, macOS 26 arm64 with Xcode 26. Current supported labels were checked against the official actions/runner-images repository. macOS runner use can incur cost.

CI runs lint, formatting, unit tests, Chromium E2E/accessibility/subpath checks, production builds, audit and repository safeguards. Android builds a debug APK and runs instrumentation + Maestro on a hardware-accelerated API 34 emulator. iOS builds/installs/launches a simulator app and runs Maestro against the Device plugin. Desktop builds and smoke-tests all three runner OS targets. Failure screenshots/traces/logs are retained seven days; distribution artifacts/checksums fourteen days. Native compilation and wireless physical-device acceptance are separate.

Ordinary PR/main jobs use contents:read, never signing secrets or self-hosted signing runners. There is no pull_request_target. The disposable Linux desktop runner enables unprivileged sandbox namespaces; Android grants its user access to the runner KVM device. These changes apply only to disposable hosted runners, not developer machines or repository settings.

Pages runs after successful main CI for the same repository/validated commit, or manual dispatch. In repository Settings → Pages choose GitHub Actions. Enable Actions and ensure main is the intended branch. Default WEB_BASE is /repository-name/; set the WEB_BASE repository variable to / for a user site/custom domain or another explicit project path. Configure any custom domain/DNS manually. Only the deploy job receives pages:write and id-token:write; its environment is github-pages. Inspect that job's page_url/deployment link to find the actual URL. No Pages account setting or deployment has been changed by this implementation.

Beta and Release are explicit workflow_dispatch entry points on a reviewed vX.Y.Z tag. They require protected beta/production environments with required reviewers, restricted branches/tags and scoped secrets/variables, provisioned self-hosted runners labelled client-signing plus android/ios/windows/macos/linux, and RELEASE_ENABLED=true. Configure these settings only with account-owner approval. Do not reuse signing runners for untrusted PR workloads. Private keystores, certificates and profiles stay in client-controlled external paths/keychains on these runners; passwords/tokens can be supplied through protected environment secrets. See credentials.md for onboarding and recovery. No hosted runner silently creates or imports production identities.

After review and approval, example manual dispatch from an authenticated repository checkout:

```sh
gh workflow run beta.yml --ref v0.1.0 -f target=android
gh workflow run release.yml --ref v0.1.0 -f target=windows -f draft_release=true
```

These examples require replacing the template identity/version and completing release:prepare first. They are not commands to run during ordinary development. The release build verifies actual signatures before staging. Linux explicitly uses checksums without claiming universal Linux signing. Optional production draft creation receives contents:write and actions:read only in its separate approved job, downloads the exact run artifacts, and creates a draft release. It does not submit to stores or publish the draft. A draft name collision fails safely; manually review and attach further target artifacts with GitHub's UI. Store uploads/promotions remain manual, with precise platform prerequisites in store-publishing.md.

Validate locally with actionlint 1.7.12 (`actionlint -shellcheck=''`; shellcheck is optional). Custom signing labels are declared in .github/actionlint.yaml. `npm run verify:repository` checks SHA pins, implemented script targets and production config safeguards. Syntax checks cannot verify repository permissions, environment protection, SDK availability on a future runner, account access or an actual deployment.
