import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  LayoutDashboard,
  CookingPot,
  Box,
  Database,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import BitesLogo from "../assets/images/bites-logo.png";

import "../styles/Sidebar.css";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Recipes",
    icon: CookingPot,
    path: "/recipes",
  },
  {
    label: "Product Master",
    icon: Box,
    path: "/product-master",
  },
  {
    label: "ERP Entry",
    icon: Database,
    path: "/erp-entry",
  },
  {
    label: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    label: "Audit Trail",
    icon: ClipboardList,
    path: "/audit-trail",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

function Sidebar({
  onNavigate,
  user = {
    name: "Chef Ahmed",
    role: "Head Chef",
    avatarUrl: null,
  },
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const profileRef =
    useRef(null);

  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);

  const initials =
    user.name
      .split(" ")
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target
          )
        ) {
          setShowProfileMenu(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleNavigation =
    (path) => {
      navigate(path);

      onNavigate?.();
    };

  const handleLogout =
    () => {
      setShowProfileMenu(
        false
      );

      navigate(
        "/login"
      );

      onNavigate?.();
    };

  return (
    <aside className="sidebar">

      <div
        className="sidebar-logo"
        onClick={() =>
          handleNavigation(
            "/dashboard"
          )
        }
      >
        <img
          src={BitesLogo}
          alt="Bites"
          className="sidebar-logo-image"
        />

        <svg
          className="sidebar-logo-curve"
          viewBox="0 0 225 76"
          preserveAspectRatio="none"
        >
          <path
            d="
              M0 18
              C18 36 43 46 72 48
              C98 50 116 45 138 46
              C171 47 201 55 225 69
              L225 76
              L0 76
              Z
            "
          />
        </svg>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(
          (item) => {
            const Icon =
              item.icon;

            const isActive =
              location.pathname ===
                item.path ||
              (
                item.path !==
                  "/dashboard" &&
                location.pathname.startsWith(
                  `${item.path}/`
                )
              );

            return (
              <button
                key={
                  item.label
                }
                type="button"
                className={`sidebar-item ${
                  isActive
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(
                    item.path
                  )
                }
              >
                <Icon />

                <span>
                  {item.label}
                </span>
              </button>
            );
          }
        )}
      </nav>

      <div
        className="sidebar-profile-wrapper"
        ref={profileRef}
      >

        {showProfileMenu && (
          <div className="sidebar-profile-dropdown">

            <button
              type="button"
              className="sidebar-logout"
              onClick={
                handleLogout
              }
            >
              <LogOut
                size={17}
              />

              <span>
                Logout
              </span>
            </button>

            <span className="sidebar-profile-pointer" />

          </div>
        )}

        <button
          type="button"
          className={`sidebar-profile ${
            showProfileMenu
              ? "profile-open"
              : ""
          }`}
          onClick={() =>
            setShowProfileMenu(
              (previous) =>
                !previous
            )
          }
        >

          {user.avatarUrl ? (
            <img
              className="sidebar-avatar"
              src={
                user.avatarUrl
              }
              alt={
                user.name
              }
            />
          ) : (
            <div className="sidebar-avatar-fallback">
              {initials}
            </div>
          )}

          <div className="sidebar-profile-info">

            <strong>
              {user.name}
            </strong>

            <span>
              {user.role}
            </span>

          </div>

          <ChevronUp
            size={15}
            className={`sidebar-profile-chevron ${
              showProfileMenu
                ? "open"
                : ""
            }`}
          />

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;