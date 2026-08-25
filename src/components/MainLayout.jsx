import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import {
  Menu,
  X,
} from "lucide-react";

import Sidebar from "./Sidebar";
import Header from "./Header";

import "../styles/MainLayout.css";
import "../styles/mobile-sidebar-offcanvas.css";


function MainLayout() {
  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);


  const openSidebar =
    () => {
      setIsSidebarOpen(true);

      document.body.classList.add(
        "recipe-sidebar-is-open"
      );
    };


  const closeSidebar =
    () => {
      setIsSidebarOpen(false);

      document.body.classList.remove(
        "recipe-sidebar-is-open"
      );
    };


  return (
    <div className="main-layout">

      <button
        type="button"
        className="recipe-mobile-menu-button"
        onClick={openSidebar}
        aria-label="Open menu"
      >
        <Menu size={21} />
      </button>


      <button
        type="button"
        className={`recipe-sidebar-overlay ${
          isSidebarOpen
            ? "show"
            : ""
        }`}
        onClick={closeSidebar}
        aria-label="Close menu"
      />


      <div
        className={`recipe-sidebar-mobile-wrapper ${
          isSidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <button
          type="button"
          className="recipe-mobile-close-button"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X size={19} />
        </button>

        <Sidebar
          onNavigate={
            closeSidebar
          }
        />
      </div>


      <div className="main-layout-content">

        <Header />

        <main className="main-page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MainLayout;