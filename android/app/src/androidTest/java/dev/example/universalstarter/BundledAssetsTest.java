package dev.example.universalstarter;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Checks the assets actually installed in the APK, not the working tree. */
@RunWith(AndroidJUnit4.class)
public class BundledAssetsTest {
    @Test public void installedAssetsAreLocalAndComplete() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String configText;
        try (var input = context.getAssets().open("capacitor.config.json")) {
            configText = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
        JSONObject config = new JSONObject(configText);
        assertEquals(context.getPackageName(), config.getString("appId"));
        assertFalse("Development URL must never be installed in bundled smoke tests", config.has("server"));
        try (var input = context.getAssets().open("public/index.html")) {
            String html = new String(input.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(html.contains("Content-Security-Policy"));
            assertFalse(html.contains("/@vite/"));
            assertFalse(html.contains("unsafe-inline"));
        }
    }
}
