# Run checks and builds on GitHub

GitHub Actions can check changes, build each native target on an appropriate operating system and deploy the website. Signing and releases have a separate approval path. The workflow files are included; remote runs and account settings still need to be verified in your own repository.

For a client opening mobile-store accounts, use [Client: start here](client-start-here.md). This page is for the repository owner or developer.

## What runs automatically

Ordinary pull requests and main-branch changes run validation/build workflows without production signing secrets. They use `npm ci` and pinned action versions; [action-pins.json](action-pins.json) records the exact action commits.

| Workflow | Main result                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| CI       | Lint, formatting, shared/browser/accessibility/subpath tests, production build, audit and repository checks |
| Android  | Debug APK plus instrumentation/Maestro on an accelerated API 34 emulator                                    |
| iOS      | Simulator build, install/launch and Maestro Device-plugin smoke on macOS                                    |
| Desktop  | Packages and smoke tests on Windows, Mac and Linux                                                          |

The configured hosted runners are Ubuntu 24.04 x64, Windows Server 2025 x64 and macOS 26 arm64 with Xcode 26. Check runner availability and billing for your account, particularly macOS use. Failure screenshots/traces/logs are kept seven days; distribution artifacts/checksums are kept fourteen days. Download accepted artifacts before they expire if you need longer retention.

A green build verifies only what that job actually ran. Physical-phone wireless deployment, store approval and production signing remain separate checks. The [showcase verification report](device-showcase-verification.md) also records outstanding build-tool audit findings that can prevent the security gate from passing.

## Enable the website deployment

These steps change repository settings; the repository owner should approve and perform them.

1. Confirm **main** is the branch you intend to deploy and review the CI result.
2. In the GitHub repository, open **Settings → Actions → General** and ensure Actions is permitted under your organisation's policy.
3. Open **Settings → Pages**. Under the deployment source, choose **GitHub Actions**. [GitHub's Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
4. For a normal project site, keep the default base path `/<repository-name>/`. For an owner site or configured custom domain, set the repository variable `WEB_BASE` to `/` or the intended explicit path. Domain/DNS setup is separate.
5. After a successful main CI run, inspect the **Pages** workflow. It deploys the validated commit, not an arbitrary later checkout. A manual dispatch is also available.
6. Open the URL in the deployment result or the deploy job's `page_url`. Check navigation and asset loading at that actual address.

**Finished when:** the deployment succeeds and the published page loads at its final path. A locally successful web build does not establish that GitHub permissions and Pages settings work.

Only the deploy job gets `pages:write` and `id-token:write`, using the `github-pages` environment. Custom domains must be configured deliberately; the scripts do not change account or DNS settings for you.

## Arrange protected signing before beta/release runs

The current **Beta** and **Release** workflows run only by manual dispatch on a reviewed `vX.Y.Z` tag. They expect client-controlled self-hosted signing runners; uploading keys to a new hosted runner is not part of ordinary setup.

The authorised repository owner and signing administrator need to:

1. Agree account ownership and get local signing working. Follow [Credentials](credentials.md).
2. Provision isolated signing runners labelled `client-signing` plus the relevant target: `android`, `ios`, `windows`, `macos` or `linux`. Never use these runners for untrusted pull requests.
3. Create the `beta` and `production` environments. Set the agreed reviewers and tag restrictions, and check your GitHub plan can enforce those protections. [GitHub environment guidance](https://docs.github.com/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).
4. Review the redacted `credentials:github:plan` output and configure only the named secrets/variables needed. Private files stay in protected external paths or OS/provider stores on the signing runner.
5. Validate runner access, environment policy and a signed artifact. Only then approve `RELEASE_ENABLED=true`.

Default PR/main jobs have `contents:read`, no signing secrets and no `pull_request_target` trigger. The Linux desktop job adjusts sandbox namespaces, and the Android job grants its runner user KVM access, only on disposable hosted runners. They do not alter the developer's machine or repository settings.

## Run an approved beta or release

After preparing the real app identity/version, passing `npm run release:prepare`, creating the approved matching tag and arranging the protections above, an authorised operator can dispatch, for example:

```sh
gh workflow run beta.yml --ref v0.1.0 -f target=android
gh workflow run release.yml --ref v0.1.0 -f target=windows -f draft_release=true
```

Replace the example version with the reviewed tag. These commands start external workflows; do not run them as part of ordinary local development. The release build verifies actual signatures before staging. Linux gets checksums without a claim of universal Linux signing.

Optional draft-release creation has its own approved job with `contents:write` and `actions:read`. It downloads this run's artifacts and creates a **draft** GitHub Release, failing safely on a name collision. Review and attach additional target artifacts in GitHub's UI if needed. It does not publish that draft or submit to the app stores. [Store publishing](store-publishing.md) covers manual uploads and approvals.

## Validate workflow files locally

```sh
npm run verify:repository
actionlint -shellcheck=''
```

Use actionlint 1.7.12; shellcheck is optional. The custom signing labels are declared in `.github/actionlint.yaml`. Syntax validation cannot establish live repository permissions, enforced approvals, future runner SDK availability or a successful deployment. Record those results after the real run.
