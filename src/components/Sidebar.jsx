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

import {
  useAuth,
} from "../context/AuthContext";

import BitesLogo from "../assets/images/bites-logo.png";

import "../styles/Sidebar.css";


const menuItems = [
  {
    label: "Dashboard",
    moduleName: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Recipes",
    moduleName: "Recipes",
    icon: CookingPot,
    path: "/recipes",
  },
  {
    label: "Product Master",
    moduleName: "Product Master",
    icon: Box,
    path: "/product-master",
  },
  {
    label: "ERP Entry",
    moduleName: "ERP Entry",
    icon: Database,
    path: "/erp-entry",
  },
  {
    label: "Reports",
    moduleName: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    label: "Audit Trail",
    moduleName: "Audit Trail",
    icon: ClipboardList,
    path: "/audit-trail",
  },
  {
    label: "Settings",
    moduleName: "Settings",
    alternateModule:
      "Users / Role",
    icon: Settings,
    path: "/settings",
  },
];


function Sidebar({
  onNavigate,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const profileRef =
    useRef(null);


  const {
    profile,
    isAdmin,
    hasPermission,
    signOut,
  } = useAuth();


  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);


  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  const userName =
    profile?.full_name ||
    profile?.username ||
    "User";


  const roleName =
    profile?.roles?.name ||
    "User";


  const avatarUrl =
    profile?.avatar_url ||
    null;


  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  const visibleMenuItems =
    menuItems.filter(
      (item) => {
        if (isAdmin) {
          return true;
        }

        if (
          hasPermission(
            item.moduleName,
            "view"
          )
        ) {
          return true;
        }

        if (
          item.alternateModule &&
          hasPermission(
            item.alternateModule,
            "view"
          )
        ) {
          return true;
        }

        return false;
      }
    );


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
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        setShowProfileMenu(
          false
        );


        const result =
          await signOut();


        if (
          result?.success ===
          false
        ) {
          throw (
            result.error ||
            new Error(
              "Logout failed."
            )
          );
        }


        navigate(
          "/login",
          {
            replace: true,
          }
        );


        onNavigate?.();
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );

        alert(
          "Could not log out. Please try again."
        );
      } finally {
        setLoggingOut(
          false
        );
      }
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

        {visibleMenuItems.map(
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
              disabled={
                loggingOut
              }
            >

              <LogOut
                size={17}
              />

              <span>
                {
                  loggingOut
                    ? "Logging out..."
                    : "Logout"
                }
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

          {avatarUrl ? (

            <img
              className="sidebar-avatar"
              src={avatarUrl}
              alt={userName}
            />

          ) : (

            <div className="sidebar-avatar-fallback">
              {initials}
            </div>

          )}


          <div className="sidebar-profile-info">

            <strong>
              {userName}
            </strong>

            <span>
              {roleName}
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