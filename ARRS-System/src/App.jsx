
import { Route, Routes } from "react-router-dom";

import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotFound from "./pages/NotFound.jsx";

//Trainer Pages
import TrainerRegister from "./pages/register_trainer.jsx";
import TrainerEnrolment from "./pages/enrolment_trainer.jsx";
import StudentsTrainer from "./pages/students_trainer.jsx";
import TrainerGroupManager from "./pages/classes_trainer.jsx";
import TrainerAttendanceRegister from "./pages/attendance_register_trainer.jsx";
import TrainerAttendanceManager from "./pages/attendance_trainer.jsx";

//Admin Pages
import UserManager from './pages/user_manage.jsx'
import GroupManager from './pages/classes.jsx'
import AdminEnrolment from "./pages/enrolment.jsx";
import AdminTimetable from "./pages/timetable_admin.jsx";
import Register from "./pages/Register.jsx";
import AdminAttendance from './pages/attendence_admin.jsx'

// Student pages
import MyAttendance from "./pages/MyAttendance.jsx";
import Timetable from "./pages/Timetable.jsx";
import MyEnrolment from "./pages/MyEnrolment.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
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

      <Route
        path='/admin/users'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <UserManager />
          </ProtectedRoute>
        }
      />

      <Route 
        path='/admin/classes'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <GroupManager />
          </ProtectedRoute>
        }
      />

      <Route 
        path='/admin/enrolment'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <AdminEnrolment />
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/timetable'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <AdminTimetable />
          </ProtectedRoute>
        }
      />

      <Route
        path='/admin/attendance'
        element={
          <ProtectedRoute allowedRoles={'admin'}>
            <AdminAttendance />
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

      <Route 
        path='/trainer/enrolment'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <TrainerEnrolment />
          </ProtectedRoute>
        }
      />

      <Route
        path='/trainer/students'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <StudentsTrainer />
          </ProtectedRoute>
        }
      />

      <Route
        path='/trainer/classes'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <TrainerGroupManager />
          </ProtectedRoute>
        }
      />

      <Route
        path='/trainer/attendance'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <TrainerAttendanceManager />
          </ProtectedRoute>
        }
      />

      <Route
        path='/trainer/attendance-register'
        element={
          <ProtectedRoute allowedRoles={'trainer'}>
            <TrainerAttendanceRegister />
          </ProtectedRoute>
        }
      />

      {/* Unknown URLs */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
