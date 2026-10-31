package dev.example.universalstarter;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;

@CapacitorPlugin(name = "StarterDevice", permissions = {
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class StarterDevicePlugin extends Plugin {
    static SharedPreferences preferences(Context context) { return context.getSharedPreferences("starter_preferences", Context.MODE_PRIVATE); }
    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaRecorder recorder;
    private File recording;
    private long started;
    private PluginCall pendingRecording;
    private SensorManager sensorManager;
    private SensorEventListener sensorListener;
    private PluginCall sensorCall;
    private Runnable sensorTimeout;

    @PluginMethod public void getPreferences(PluginCall call) {
        SharedPreferences prefs = preferences(getContext());
        JSObject result = new JSObject();
        result.put("highAccuracy", prefs.getBoolean("highAccuracy", true));
        result.put("distanceUnit", prefs.getString("distanceUnit", "km"));
        call.resolve(result);
    }
    @PluginMethod public void setPreferences(PluginCall call) {
        String unit = call.getString("distanceUnit");
        Boolean accuracy = call.getBoolean("highAccuracy");
        if (accuracy == null || !("mi".equals(unit) || "km".equals(unit))) { call.reject("Invalid preferences", "FAILED"); return; }
        preferences(getContext()).edit().putBoolean("highAccuracy", accuracy).putString("distanceUnit", unit).apply();
        call.resolve();
    }
    @PluginMethod public void openPreferences(PluginCall call) {
        getActivity().runOnUiThread(() -> { getActivity().startActivity(new Intent(getContext(), NativePreferencesActivity.class)); call.resolve(); });
    }
    @PluginMethod public void openAppSettings(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try { getActivity().startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()))); call.resolve(); }
            catch (Exception error) { call.reject("System settings unavailable", "UNSUPPORTED"); }
        });
    }
    @PluginMethod public void sampleMotion(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (sensorCall != null) { call.reject("A sensor request is already running", "FAILED"); return; }
            sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
            Sensor sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (sensor == null) { call.reject("No accelerometer on this device", "UNSUPPORTED"); return; }
            sensorCall = call;
            sensorListener = new SensorEventListener() {
                public void onAccuracyChanged(Sensor s, int accuracy) {}
                public void onSensorChanged(SensorEvent event) {
                    JSObject xyz = new JSObject(); xyz.put("x", event.values[0]); xyz.put("y", event.values[1]); xyz.put("z", event.values[2]);
                    JSObject result = new JSObject(); result.put("accelerationIncludingGravity", xyz); result.put("units", "m/s²");
                    PluginCall pending = sensorCall; clearSensor(); if (pending != null) pending.resolve(result);
                }
            };
            sensorTimeout = () -> { PluginCall pending = sensorCall; clearSensor(); if (pending != null) pending.reject("No motion sample arrived", "UNSUPPORTED"); };
            handler.postDelayed(sensorTimeout, 5000);
            if (!sensorManager.registerListener(sensorListener, sensor, SensorManager.SENSOR_DELAY_NORMAL, handler)) {
                clearSensor(); call.reject("Motion sensor unavailable", "UNSUPPORTED");
            }
        });
    }
    private void clearSensor() {
        if (sensorManager != null && sensorListener != null) sensorManager.unregisterListener(sensorListener);
        if (sensorTimeout != null) handler.removeCallbacks(sensorTimeout);
        sensorCall = null; sensorListener = null; sensorTimeout = null;
    }
    @PluginMethod public void startRecording(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) { pendingRecording = call; requestPermissionForAlias("microphone", call, "microphonePermission"); return; }
        getActivity().runOnUiThread(() -> beginRecording(call));
    }
    @PermissionCallback private void microphonePermission(PluginCall call) {
        if (pendingRecording != call) { call.reject("Recording cancelled", "CANCELLED"); return; }
        pendingRecording = null;
        if (getPermissionState("microphone") != PermissionState.GRANTED) { call.reject("Microphone permission denied", "PERMISSION_DENIED"); return; }
        getActivity().runOnUiThread(() -> beginRecording(call));
    }
    @SuppressWarnings("deprecation") private void beginRecording(PluginCall call) {
        if (!getActivity().getLifecycle().getCurrentState().isAtLeast(androidx.lifecycle.Lifecycle.State.STARTED)) { call.reject("App inactive", "CANCELLED"); return; }
        if (recorder != null) { call.reject("Recording already running", "FAILED"); return; }
        deleteClip();
        try {
            File dir = new File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception("Cache unavailable");
            recording = File.createTempFile("audio-note-", ".m4a", dir);
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioEncodingBitRate(96000); recorder.setAudioSamplingRate(44100);
            recorder.setMaxDuration(61000); recorder.setMaxFileSize(8 * 1024 * 1024);
            recorder.setOutputFile(recording.getAbsolutePath());
            recorder.prepare(); recorder.start(); started = android.os.SystemClock.elapsedRealtime();
            call.resolve();
        } catch (Exception error) { discard(); call.reject("Microphone recording could not start", "FAILED"); }
    }
    @PluginMethod public void stopRecording(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recorder == null) { call.reject("No active recording", "FAILED"); return; }
            try {
                recorder.stop(); recorder.release(); recorder = null;
                if (recording == null || recording.length() == 0) throw new Exception("Empty audio");
                JSObject result = new JSObject(); result.put("path", Uri.fromFile(recording).toString()); result.put("bytes", recording.length()); result.put("durationMs", android.os.SystemClock.elapsedRealtime() - started);
                call.resolve(result);
            } catch (Exception error) { discard(); call.reject("No usable audio captured; try recording for longer", "FAILED"); }
        });
    }
    @PluginMethod public void cancelRecording(PluginCall call) { getActivity().runOnUiThread(() -> { pendingRecording = null; discard(); call.resolve(); }); }
    private void deleteClip() { if (recording != null) { recording.delete(); recording = null; } }
    private void discard() { if (recorder != null) { try { recorder.stop(); } catch (Exception ignored) {} recorder.release(); recorder = null; } deleteClip(); }
    @Override protected void handleOnPause() {
        if (recorder != null) discard();
        PluginCall pending = sensorCall; clearSensor(); if (pending != null) pending.reject("Motion sample cancelled while inactive", "CANCELLED");
    }
    @Override protected void handleOnDestroy() { discard(); clearSensor(); }
}
