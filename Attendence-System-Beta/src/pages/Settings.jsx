
import { useState } from "react";
import Layout from "../components/Layout.jsx";

const defaultSettings = {
  emailNotifications: true,
  attendanceAlerts: true,
  timetableUpdates: true,
  announcements: true,
  compactView: false,
};

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      return {
        ...defaultSettings,
        ...JSON.parse(
          localStorage.getItem("itca_student_settings") || "{}"
        ),
      };
    } catch {
      return defaultSettings;
    }
  });

  const [message, setMessage] = useState("");

  function updateSetting(event) {
    const { name, checked } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: checked,
    }));

    setMessage("");
  }

  function saveSettings(event) {
    event.preventDefault();

    localStorage.setItem(
      "itca_student_settings",
      JSON.stringify(settings)
    );

    setMessage("Your preferences have been saved in this browser.");
  }

  function resetSettings() {
    setSettings(defaultSettings);
    localStorage.setItem(
      "itca_student_settings",
      JSON.stringify(defaultSettings)
    );
    setMessage("Settings have been restored to their defaults.");
  }

  const options = [
    {
      name: "emailNotifications",
      label: "Email Notifications",
      description: "Receive supported notifications by email.",
    },
    {
      name: "attendanceAlerts",
      label: "Attendance Alerts",
      description: "Receive alerts about attendance records.",
    },
    {
      name: "timetableUpdates",
      label: "Timetable Updates",
      description: "Receive notices about timetable changes.",
    },
    {
      name: "announcements",
      label: "Academic Announcements",
      description: "Receive important college announcements.",
    },
    {
      name: "compactView",
      label: "Compact Display",
      description: "Use a more compact display where supported.",
    },
  ];

  return (
    <Layout role="student" title="Settings">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT PREFERENCES</span>
          <h2>Settings</h2>
          <p>Manage your preferences for the ITCA portal.</p>
        </div>
      </section>

      <section className="content-card">
        <h3>Preferences</h3>

        <form onSubmit={saveSettings}>
          {options.map((option) => (
            <div className="setting-row" key={option.name}>
              <div>
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>

              <label>
                <input
                  type="checkbox"
                  name={option.name}
                  checked={settings[option.name]}
                  onChange={updateSetting}
                />
                {settings[option.name] ? "Enabled" : "Disabled"}
              </label>
            </div>
          ))}

          <div className="button-group">
            <button type="submit">Save Settings</button>
            <button type="button" onClick={resetSettings}>
              Restore Defaults
            </button>
          </div>
        </form>

        {message && <p role="status">{message}</p>}
      </section>

      <section className="content-card">
        <h3>Account Security</h3>
        <p>
          Password changes and account security checks must be
          handled through the secure authentication service.
        </p>
        <p>
          A password-change form can be connected here when the
          authentication API is available.
        </p>
      </section>
    </Layout>
  );
}
