import {
  Bell,
  Plus,
  Search,
  Camera,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getNotifications,
  markNotificationAsRead,
  subscribeToNotifications,
} from "../services/notificationService";

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


  const {
    profile,
  } = useAuth();


  const avatarInputRef =
    useRef(null);

  const notificationRef =
    useRef(null);


  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);


  const [
    localAvatar,
    setLocalAvatar,
  ] = useState("");


  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false);


  const path =
    location.pathname;


  const userName =
    profile?.full_name ||
    profile?.username ||
    "User";


  const roleName =
    profile?.roles?.name ||
    "User";


  const avatar =
    localAvatar ||
    profile?.avatar_url ||
    "";


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


  useEffect(() => {
    setLocalAvatar(
      ""
    );
  }, [
    profile?.avatar_url,
    profile?.id,
  ]);


  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target
          )
        ) {
          setShowNotifications(
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


  useEffect(() => {
    if (!profile?.id) {
      setNotifications(
        []
      );

      return undefined;
    }


    let mounted = true;


    const loadNotifications =
      async (
        showLoader = false
      ) => {
        try {
          if (showLoader) {
            setNotificationsLoading(
              true
            );
          }


          const data =
            await getNotifications(
              profile.id
            );


          if (mounted) {
            setNotifications(
              data
            );
          }
        } catch (error) {
          console.error(
            "Notifications error:",
            error
          );
        } finally {
          if (
            mounted &&
            showLoader
          ) {
            setNotificationsLoading(
              false
            );
          }
        }
      };


    loadNotifications(
      true
    );


    const unsubscribe =
      subscribeToNotifications(
        profile.id,
        () => {
          loadNotifications(
            false
          );
        }
      );


    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [
    profile?.id,
  ]);


  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.isRead
    );


  const handleNotificationClick =
    async (
      notification
    ) => {
      try {
        if (
          !notification.isRead
        ) {
          await markNotificationAsRead(
            notification.id,
            profile?.id
          );


          setNotifications(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  notification.id
                    ? {
                        ...item,
                        isRead: true,
                      }
                    : item
              )
          );
        }
      } catch (error) {
        console.error(
          "Mark notification read error:",
          error
        );
      }


      setShowNotifications(
        false
      );


      if (
        notification.recipeId
      ) {
        navigate(
          `/recipes/${notification.recipeId}`
        );
      }
    };


  const getPageInfo =
    () => {

      if (
        path ===
        "/dashboard"
      ) {
        return {
          title:
            `Welcome back, ${userName} 👋`,

          subtitle: "",

          actionLabel:
            null,

          actionPath:
            null,

          actionEvent:
            null,
        };
      }


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

            setLocalAvatar(
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


  const handleHeaderAction =
    () => {
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

      <div className="header-top-row">

        <div className="header-search">

          <Search
            size={20}
          />

          <input
            type="text"
            placeholder="search anything..."
          />

        </div>


        <div className="header-right-actions">

          <div
            className="header-notification-wrapper"
            ref={
              notificationRef
            }
          >

            <button
              type="button"
              className="header-notification"
              aria-label="Notifications"
              onClick={() =>
                setShowNotifications(
                  (current) =>
                    !current
                )
              }
            >

              <Bell
                size={23}
              />

              {unreadNotifications.length >
                0 && (
                <span className="notification-dot" />
              )}

            </button>


            {showNotifications && (

              <div className="header-notification-menu">

                <div className="header-notification-menu-head">

                  <strong>
                    Notifications
                  </strong>

                </div>


                {notificationsLoading ? (

                  <div className="header-notification-empty">
                    Loading notifications...
                  </div>

                ) : notifications.length ===
                  0 ? (

                  <div className="header-notification-empty">
                    No notifications yet.
                  </div>

                ) : (

                  <div
                    style={{
                      maxHeight:
                        "320px",
                      overflowY:
                        "auto",
                    }}
                  >

                    {notifications.map(
                      (
                        notification
                      ) => (

                        <button
                          type="button"
                          key={
                            notification.id
                          }
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          style={{
                            width:
                              "100%",
                            padding:
                              "12px 14px",
                            border:
                              "none",
                            borderBottom:
                              "1px solid #f0e7e0",
                            background:
                              notification.isRead
                                ? "#ffffff"
                                : "#fff8f2",
                            textAlign:
                              "left",
                            cursor:
                              "pointer",
                            fontFamily:
                              "inherit",
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap:
                                "10px",
                            }}
                          >

                            <strong
                              style={{
                                color:
                                  "#3e2b1f",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                notification.title
                              }
                            </strong>


                            {!notification.isRead && (
                              <span
                                style={{
                                  width:
                                    "7px",
                                  height:
                                    "7px",
                                  flexShrink:
                                    0,
                                  borderRadius:
                                    "50%",
                                  background:
                                    "#b44b15",
                                }}
                              />
                            )}

                          </div>


                          <p
                            style={{
                              margin:
                                "5px 0 0",
                              color:
                                "#7c6d63",
                              fontSize:
                                "11px",
                              lineHeight:
                                1.45,
                            }}
                          >
                            {
                              notification.message
                            }
                          </p>


                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                "6px",
                              color:
                                "#aa9a8f",
                              fontSize:
                                "9px",
                            }}
                          >
                            {
                              notification.createdLabel
                            }
                          </small>

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>

            )}

          </div>


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
            title={`${
              userName
            } - ${
              roleName
            }`}
          >

            {avatar ? (

              <img
                src={avatar}
                alt={userName}
              />

            ) : (

              <span className="header-avatar-fallback">
                {initials}
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


      <div className="header-bottom-row">

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