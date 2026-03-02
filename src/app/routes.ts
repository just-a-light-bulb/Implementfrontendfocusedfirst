import { createBrowserRouter, redirect } from "react-router";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./components/DashboardPage";
import { EditorPage } from "./components/EditorPage";

// Helper to check auth from Zustand store persisted in localStorage
function getUser() {
  try {
    const raw = localStorage.getItem("comic-trans-studio-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user ?? null;
  } catch {
    return null;
  }
}

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      const user = getUser();
      return user ? redirect("/dashboard") : redirect("/login");
    },
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    loader: () => {
      const user = getUser();
      return user ? null : redirect("/login");
    },
    Component: DashboardPage,
  },
  {
    path: "/project/:id",
    loader: () => {
      const user = getUser();
      return user ? null : redirect("/login");
    },
    Component: EditorPage,
  },
  {
    path: "*",
    loader: () => redirect("/"),
  },
]);
