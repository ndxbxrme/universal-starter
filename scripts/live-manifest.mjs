/** Prepare an isolated debug overlay; never overwrite an app-owned source manifest. */
export function liveManifest(
  source = '<manifest xmlns:android="http://schemas.android.com/apk/res/android"></manifest>',
) {
  if (
    !/<manifest\b/.test(source) ||
    !source.includes(
      'xmlns:android="http://schemas.android.com/apk/res/android"',
    )
  )
    throw new Error(
      "Unsupported debug manifest namespace; source manifest left intact.",
    );
  let result = source;
  if (!result.includes("xmlns:tools="))
    result = result.replace(
      "<manifest",
      '<manifest xmlns:tools="http://schemas.android.com/tools"',
    );
  const application = /<application\b[^>]*>/;
  if (!application.test(result))
    result = result.replace("</manifest>", "<application /></manifest>");
  return result.replace(application, (tag) => {
    tag = /android:usesCleartextTraffic\s*=/.test(tag)
      ? tag.replace(
          /android:usesCleartextTraffic\s*=\s*(['"])[^'"]*\1/,
          'android:usesCleartextTraffic="true"',
        )
      : tag.replace(
          /\/?>$/,
          (ending) => ' android:usesCleartextTraffic="true"' + ending,
        );
    if (/tools:replace\s*=/.test(tag))
      tag = tag.replace(
        /tools:replace\s*=\s*(['"])(.*?)\1/,
        (_match, _quote, value) =>
          `tools:replace="${[...new Set([...value.split(",").map((v) => v.trim()), "android:usesCleartextTraffic"])].join(",")}"`,
      );
    else
      tag = tag.replace(
        /\/?>$/,
        (ending) => ' tools:replace="android:usesCleartextTraffic"' + ending,
      );
    return tag;
  });
}
