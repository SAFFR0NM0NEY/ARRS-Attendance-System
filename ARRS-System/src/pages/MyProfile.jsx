
import { useState, useEffect} from "react";
import Layout from "../components/Layout.jsx";
import {supabase} from '../supabase.js'

export default function MyProfile() {
  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setMessage(null)

    async function fetchStudentProfile(){
      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser()

        if(userError) throw userError
        if(!user) throw new Error(`Please Sign Up To View Profile`)

        const {data: profileData, error: profileError} = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if(profileError) throw profileError

        setProfile(profileData)
        setMessage(null)
      }
      catch(err) {
        console.error(`Error fetching: ${err.message}`)
        setMessage(`Problem Fetching Your Data ${err.message}`)
      }
      finally {
        setLoading(false)
      }
    }

    fetchStudentProfile();
  }, [])

  /*
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
  */
  {/*
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
  */}
  
  /*
  const fields = [
    ["name", "Full Name", "text"],
    ["studentNumber", "Student Number", "text"],
    ["email", "Email Address", "email"],
    ["phone", "Telephone Number", "tel"],
    ["programme", "Programme", "text"],
    ["academicYear", "Academic Year", "text"],
  ];
  */

  return (
    <Layout role="student" title="Profile">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT INFORMATION</span>
          <h2>My Profile</h2>
          <p>View and update your permitted contact details.</p>
        </div>
      </section>

      <section className="content-card">
        <h3>Personal and Academic Details</h3>
        {loading ? (
          <div>
            <h3>Loading...</h3>
          </div>
        ) : (
          <div className='input-grid'>
            <label>
              <strong style={{textDecorationLine: 'underline'}}>Full Name</strong>
              <h3>{profile.name} {profile.surname}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Email</strong>
              <h3>{profile.email}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Student Number</strong>
              <h3>{profile.student_nr}</h3>
              <strong style={{textDecorationLine: 'underline'}}>ID Number</strong>
              <h3>{profile.id_nr}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Contact Number</strong>
              <h3>{profile.contact_nr}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Sponsor Full Name</strong>
              <h3>{profile.sponsor_name} {profile.sponsor_surname}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Sponsor Email</strong>
              <h3>{profile.sponsor_email}</h3>
              <strong style={{textDecorationLine: 'underline'}}>Sponsor Contact</strong>
              <h3>{profile.sponsor_contact}</h3>
            </label>
          </div>
        )}
        
        {/*
        <form className='input-grid' onSubmit={saveProfile}>
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
          
          {/*
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
        */}

        {message && <p role="status">{message}</p>}

        <p>
          Student details can only be changed by authorized trainers and faculty.
        </p>
      </section>
    </Layout>
  );
}
