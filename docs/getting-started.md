# Run the app for the first time

Start with the browser version. It uses the same screens as the phone and desktop apps, and you can run it without store accounts, production certificates or native SDKs.

If you are a client setting up accounts rather than working on the code, use [Client: start here](client-start-here.md) instead.

## Before you begin

Install [Node.js](https://nodejs.org/) **24.x**, which includes npm, and Git if you need to clone the repository. Use the repository address supplied by your developer or your own GitHub repository; this template does not have a universal clone URL.

Open a terminal inside the checked-out project folder. You should be able to see `package.json` and `package-lock.json`. Check your tools:

```sh
node --version
npm --version
```

Node should report `v24.…`. [Toolchain](toolchain.md) records the exact versions used to verify this project. If you use nvm, `.nvmrc` selects the required Node major.

## Install and open the app

Run these commands one at a time:

```sh
npm ci
npm run setup
npm run doctor
npm run dev
```

`npm ci` installs the versions recorded in the lockfile. `setup` checks and synchronises template metadata, artwork and dependency notices; it does not create another project. Review any resulting file changes before committing them.

`doctor` reports tools separately for each platform. Missing Xcode or Android signing credentials does not prevent browser development. Read the platform-specific result rather than assuming every reported blocker must be fixed immediately.

When Vite prints its address, open **http://127.0.0.1:5173**. You should see the Home screen, navigation and theme controls. Leave this terminal running while you edit the app. Changes should appear automatically. Press **Ctrl+C** when finished.

If the server cannot start because port 5173 is occupied, stop the earlier development server and try again. See [Troubleshooting](troubleshooting.md) for other common problems.

## Run the checks

Install the browser used by the automated tests, then run the checks:

```sh
npx playwright install chromium
npm run check
```

The check runs lint, formatting, unit tests and browser tests. Linux may need extra browser libraries; Playwright's `npx playwright install-deps chromium` installs those system dependencies and may require administrator access. See [Testing](testing.md) for individual checks and native tests.

## Make a build

```sh
npm run build:web
```

The website files appear in `dist/web`. GitHub Pages project sites need the correct repository base path; follow [Pages setup](github-actions.md) before deploying. `npm run build` instead creates `dist/native` for the native wrappers.

## Choose a native target when you are ready

| Target                    | Read next                                                                     | Main prerequisite                   |
| ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| Android                   | [Android setup](android.md), then [wireless phone setup](android-wireless.md) | Android Studio, JDK and SDK         |
| iPhone/iPad               | [iOS](ios.md)                                                                 | A Mac with Xcode for native builds  |
| Windows/Mac/Linux desktop | [Desktop](desktop.md)                                                         | Tools for the host operating system |

On the original development machine, the optional local tool setup can be loaded with `source "$HOME/.local/share/universal-toolchain/env.sh"`. That path belongs to that machine; a new checkout should configure its own SDK paths.

Before turning the template into a client app, follow [Customisation](customisation.md) to choose its identity and a fresh provenance UUID. Signing can be added later using [Credentials](credentials.md). Keep client account ownership clear from the start.
