package dev.example.universalstarter;

import android.os.Bundle;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AdapterView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;

/** Native preference controls, also discoverable by Android's application-preferences intent. */
public class NativePreferencesActivity extends AppCompatActivity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (getSupportActionBar() != null) getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        setTitle(getApplicationInfo().loadLabel(getPackageManager()) + " preferences");
        SharedPreferences prefs = StarterDevicePlugin.preferences(this);
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL);
        int spacing = (int) (24 * getResources().getDisplayMetrics().density); layout.setPadding(spacing, spacing, spacing, spacing);
        SwitchCompat accuracy = new SwitchCompat(this); accuracy.setText("Prefer high-accuracy location"); accuracy.setChecked(prefs.getBoolean("highAccuracy", true));
        accuracy.setOnCheckedChangeListener((button, checked) -> prefs.edit().putBoolean("highAccuracy", checked).apply());
        TextView explanation = new TextView(this); explanation.setText("Used only when you request location. No background tracking. High accuracy uses more power; OS approximate permission is respected.");
        TextView label = new TextView(this); label.setText("Distance units");
        Spinner units = new Spinner(this); units.setContentDescription("Distance units");
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new String[] { "Kilometres", "Miles" }); adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item); units.setAdapter(adapter);
        units.setSelection("mi".equals(prefs.getString("distanceUnit", "km")) ? 1 : 0);
        units.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onNothingSelected(AdapterView<?> parent) {}
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) { prefs.edit().putString("distanceUnit", position == 1 ? "mi" : "km").apply(); }
        });
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(layout, (view, insets) -> { androidx.core.graphics.Insets bars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars()); view.setPadding(spacing + bars.left, spacing + bars.top, spacing + bars.right, spacing + bars.bottom); return insets; });
        layout.addView(accuracy); layout.addView(explanation); layout.addView(label); layout.addView(units); setContentView(layout);
    }
    @Override public boolean onSupportNavigateUp() { finish(); return true; }
}
