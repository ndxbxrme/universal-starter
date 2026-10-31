package dev.example.universalstarter;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(StarterDevicePlugin.class);
        super.onCreate(state);
    }
}
