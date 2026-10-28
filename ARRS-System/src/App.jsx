
import { Route, Routes } from "react-router-dom";

import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotFound from "./pages/NotFound.jsx";

//Faculty Specific Pages
import TrainerRegister from './pages/Register.jsx';

// Student pages
import MyAttendance from "./pages/MyAttendance.jsx";
import Timetable from "./pages/Timetable.jsx";
import MyEnrolment from "./pages/MyEnrolment.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import Settings from "./pages/Settings.jsx";

const roles = ["trainer", "faculty", "admin"];

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/check-in" element={<CheckIn />} />

      {/* Student dashboard - support both URLs */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard role="student" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard role="student" />
          </ProtectedRoute>
        }
      />

      {/* Student pages */}
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/timetable"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Timetable />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/enrolment"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyEnrolment />
          </ProtectedRoute>
        }
      />

      {/*
      <Route
        path="/student/reports"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      
      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      */}

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyProfile />
          </ProtectedRoute>
        }
      />

      {/*
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Settings />
          </ProtectedRoute>
        }
      />
      */}

      {/* Trainer, faculty and admin dashboards */}
      {roles.map((role) => (
        <Route
        key={role}
        path={`/${role}/*`}
        element={
          <ProtectedRoute allowedRoles={[role]}>
            <Dashboard role={role} />
          </ProtectedRoute>
        }
        />
      ))}


      {/* Admin Pages */}
      <Route
        path='/admin/register'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <Register />
          </ProtectedRoute>
        }
      />

      {/* Faculty Pages */}


      {/* Trainer Pages */}
      <Route
        path='/trainer/register'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <TrainerRegister />
          </ProtectedRoute>
        }
      />

      {/* Unknown URLs */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
