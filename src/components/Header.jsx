import {
  Bell,
  Plus,
  Search,
  Camera,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/Header.css";


const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;


const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];


function Header() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const avatarInputRef =
    useRef(null);


  const [
    avatar,
    setAvatar,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "recipe-profile-avatar"
      ) || ""
    );
  });


  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false);


  const path =
    location.pathname;


  /* =========================================
     PAGE INFO
  ========================================= */

  const getPageInfo = () => {

    /* DASHBOARD */

    if (
      path ===
      "/dashboard"
    ) {
      return {
        title:
          "Welcome back, Chef Ahmed 👋",

        subtitle: "",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* RECIPES */

    if (
      path ===
      "/recipes"
    ) {
      return {
        title:
          "Recipes",

        subtitle:
          "Manage and organize all your recipes.",

        actionLabel:
          "Add New Recipe",

        actionPath:
          "/recipes/new",

        actionEvent:
          null,
      };
    }


    /* CREATE RECIPE */

    if (
      path ===
      "/recipes/new"
    ) {
      return {
        title:
          "Create New Recipe",

        subtitle:
          "Create a recipe and add its ingredients.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* RECIPE DETAILS */

    if (
      path.startsWith(
        "/recipes/"
      )
    ) {
      return {
        title:
          "Recipe Details",

        subtitle:
          "View recipe information and ingredients.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* PRODUCT MASTER */

    if (
      path ===
      "/product-master"
    ) {
      return {
        title:
          "Product Master",

        subtitle:
          "Manage all products used in recipes.",

        actionLabel:
          "Add New Product",

        actionPath:
          null,

        actionEvent:
          "open-product-modal",
      };
    }


    /* ERP ENTRY */

    if (
      path ===
      "/erp-entry"
    ) {
      return {
        title:
          "ERP Entry",

        subtitle:
          "Manage recipes ready for ERP entry.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* ERP DETAILS */

    if (
      path.startsWith(
        "/erp-entry/"
      )
    ) {
      return {
        title:
          "ERP Entry Details",

        subtitle:
          "View recipe details and complete ERP entry.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* REPORTS */

    if (
      path ===
      "/reports"
    ) {
      return {
        title:
          "Reports",

        subtitle:
          "View recipe and workflow reports.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* AUDIT TRAIL */

    if (
      path ===
      "/audit-trail"
    ) {
      return {
        title:
          "Audit Trail",

        subtitle:
          "Track recipe actions and status changes.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* SETTINGS */

    if (
      path ===
      "/settings"
    ) {
      return {
        title:
          "Settings",

        subtitle:
          "Manage system settings and users.",

        actionLabel:
          null,

        actionPath:
          null,

        actionEvent:
          null,
      };
    }


    /* DEFAULT */

    return {
      title:
        "Recipe Management",

      subtitle: "",

      actionLabel:
        null,

      actionPath:
        null,

      actionEvent:
        null,
    };
  };


  const pageInfo =
    getPageInfo();


  /* =========================================
     AVATAR CLICK
  ========================================= */

  const handleAvatarClick =
    () => {

      if (
        uploadingAvatar
      ) {
        return;
      }

      avatarInputRef
        .current
        ?.click();
    };


  /* =========================================
     AVATAR CHANGE
  ========================================= */

  const handleAvatarChange =
    (event) => {

      const file =
        event
          .target
          .files?.[0];


      event.target.value =
        "";


      if (!file) {
        return;
      }


      if (
        !allowedAvatarTypes.includes(
          file.type
        )
      ) {
        alert(
          "Please choose JPG, PNG or WEBP image."
        );

        return;
      }


      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        alert(
          "Image must be less than 5 MB."
        );

        return;
      }


      try {

        setUploadingAvatar(
          true
        );


        const reader =
          new FileReader();


        reader.onload =
          () => {

            const imageUrl =
              reader.result;


            setAvatar(
              imageUrl
            );


            localStorage.setItem(
              "recipe-profile-avatar",
              imageUrl
            );


            setUploadingAvatar(
              false
            );
          };


        reader.onerror =
          () => {

            setUploadingAvatar(
              false
            );


            alert(
              "Could not load image."
            );
          };


        reader.readAsDataURL(
          file
        );

      } catch (error) {

        console.error(
          error
        );


        setUploadingAvatar(
          false
        );
      }
    };


  /* =========================================
     HEADER ACTION
  ========================================= */

  const handleHeaderAction =
    () => {

      /* EVENT ACTION */

      if (
        pageInfo.actionEvent
      ) {

        window.dispatchEvent(
          new Event(
            pageInfo.actionEvent
          )
        );

        return;
      }


      /* ROUTE ACTION */

      if (
        pageInfo.actionPath
      ) {

        navigate(
          pageInfo.actionPath
        );
      }
    };


  return (
    <header className="main-header">


      {/* =====================================
          TOP ROW
      ===================================== */}

      <div className="header-top-row">


        {/* SEARCH */}

        <div className="header-search">

          <Search
            size={20}
          />


          <input
            type="text"
            placeholder="search anything..."
          />

        </div>


        {/* RIGHT ACTIONS */}

        <div className="header-right-actions">


          {/* NOTIFICATION */}

          <button
            type="button"
            className="header-notification"
          >

            <Bell
              size={23}
            />


            <span className="notification-dot" />

          </button>


          {/* HIDDEN AVATAR INPUT */}

          <input
            ref={
              avatarInputRef
            }
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="header-avatar-input"
            onChange={
              handleAvatarChange
            }
          />


          {/* PROFILE IMAGE */}

          <button
            type="button"
            className={`header-avatar ${
              uploadingAvatar
                ? "uploading"
                : ""
            }`}
            onClick={
              handleAvatarClick
            }
            disabled={
              uploadingAvatar
            }
            title="Change profile image"
          >

            {avatar ? (

              <img
                src={avatar}
                alt="Chef Ahmed"
              />

            ) : (

              <span className="header-avatar-fallback">
                C
              </span>

            )}


            <span className="header-avatar-camera">

              <Camera
                size={13}
              />

            </span>

          </button>

        </div>

      </div>


      {/* =====================================
          BOTTOM ROW
      ===================================== */}

      <div className="header-bottom-row">


        {/* PAGE INFO */}

        <div className="header-page-info">

          <h1>
            {pageInfo.title}
          </h1>


          {pageInfo.subtitle && (

            <p>
              {
                pageInfo.subtitle
              }
            </p>

          )}

        </div>


        {/* PAGE ACTION */}

        {pageInfo.actionLabel && (

          <button
            type="button"
            className="header-action-button"
            onClick={
              handleHeaderAction
            }
          >

            <Plus
              size={17}
            />


            {
              pageInfo.actionLabel
            }

          </button>

        )}

      </div>

    </header>
  );
}


export default Header;