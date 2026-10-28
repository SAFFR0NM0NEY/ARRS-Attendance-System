
import { useState } from "react";
import Layout from "../components/Layout.jsx";

const emptyProfile = {
  name: "",
  studentNumber: "",
  email: "",
  phone: "",
  programme: "",
  academicYear: "",
};

export default function MyProfile() {
  const [profile, setProfile] = useState(() => {
    try {
      return {
        ...emptyProfile,
        ...JSON.parse(
          localStorage.getItem("itca_student_profile") || "{}"
        ),
      };
    } catch {
      return emptyProfile;
    }
  });

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  function saveProfile(event) {
    event.preventDefault();

    if (!profile.email.trim() || !profile.email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    localStorage.setItem(
      "itca_student_profile",
      JSON.stringify(profile)
    );

    setEditing(false);
    setMessage("Profile changes saved in this browser.");
  }

  function cancelEditing() {
    try {
      setProfile({
        ...emptyProfile,
        ...JSON.parse(
          localStorage.getItem("itca_student_profile") || "{}"
        ),
      });
    } catch {
      setProfile(emptyProfile);
    }

    setEditing(false);
    setMessage("");
  }

  const fields = [
    ["name", "Full Name", "text"],
    ["studentNumber", "Student Number", "text"],
    ["email", "Email Address", "email"],
    ["phone", "Telephone Number", "tel"],
    ["programme", "Programme", "text"],
    ["academicYear", "Academic Year", "text"],
  ];

  return (
    <Layout role="student" title="My Profile">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT INFORMATION</span>
          <h2>My Profile</h2>
          <p>View and update your permitted contact details.</p>
        </div>
      </section>

      <section className="content-card">
        <h3>Personal and Academic Details</h3>

        <form onSubmit={saveProfile}>
          <div className="form-grid">
            {fields.map(([name, label, type]) => (
              <label key={name}>
                {label}
                <input
                  type={type}
                  name={name}
                  value={profile[name] || ""}
                  onChange={handleChange}
                  readOnly={
                    !editing ||
                    name === "studentNumber" ||
                    name === "programme" ||
                    name === "academicYear"
                  }
                  required={name === "email"}
                />
              </label>
            ))}
          </div>

          {editing ? (
            <div className="button-group">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={cancelEditing}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
            >
              Edit Profile
            </button>
          )}
        </form>

        {message && <p role="status">{message}</p>}

        <p>
          Official student details must be updated by authorised
          staff where required.
        </p>
      </section>
    </Layout>
  );
}
