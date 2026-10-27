# Artwork

`icon.svg` is the original geometric artwork master; `splash.svg` is generated from that same master and configured dark background. These assets are created for this starter and licensed under the repository MIT license. No external imagery or fonts are downloaded at runtime. Interface symbols use system fonts.

Run `npm run icons:generate` after editing resources/icon.svg or configured splash background. Do not hand-edit generated splash.svg. The script overwrites only these generated branding assets: resources/generated/*, public/icon-{192,512}.png, existing Android launcher/splash images and iOS AppIcon asset entries. Review generated changes before committing. For custom mobile artwork, adjust the generator rather than hand-editing its outputs. Generated desktop ICO wraps a 256px PNG; ICNS wraps a 1024px PNG. Source SVG is also copied to public/icon.svg when branding is synchronized.

Platform projects retain their own editable build configuration. The icon command does not recreate native projects or change identifiers.
