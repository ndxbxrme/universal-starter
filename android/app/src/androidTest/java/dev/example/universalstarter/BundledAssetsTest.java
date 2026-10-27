package dev.example.universalstarter;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Checks the assets actually installed in the APK, including on API 24+. */
@RunWith(AndroidJUnit4.class)
public class BundledAssetsTest {
    private String asset(Context context, String name) throws Exception {
        try (var input = context.getAssets().open(name); var output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int length;
            while ((length = input.read(buffer)) != -1) output.write(buffer, 0, length);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    @Test public void installedAssetsAreLocalAndComplete() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject config = new JSONObject(asset(context, "capacitor.config.json"));
        assertEquals(context.getPackageName(), config.getString("appId"));
        assertFalse("Development URL must never be installed in bundled smoke tests", config.has("server"));
        String html = asset(context, "public/index.html");
        assertTrue(html.contains("Content-Security-Policy"));
        assertFalse(html.contains("/@vite/"));
        assertFalse(html.contains("unsafe-inline"));
    }
}
