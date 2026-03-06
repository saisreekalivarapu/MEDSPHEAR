import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { PatientPortal } from "./pages/PatientPortal";
import { QueueDashboard } from "./pages/QueueDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { StaffLogin } from "./pages/StaffLogin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: PatientPortal },
      { path: "queue", Component: QueueDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "staff-login", Component: StaffLogin },
    ],
  },
]);
