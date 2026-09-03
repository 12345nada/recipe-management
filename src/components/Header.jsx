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
  useTranslation,
} from "react-i18next";

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
  const {
    t,
    i18n,
  } = useTranslation();


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
    t("common.user");


  const roleName =
    profile?.roles?.name ||
    t("common.user");


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


  const handleLanguageChange =
    (event) => {
      i18n.changeLanguage(
        event.target.value
      );
    };


  const getPageInfo =
    () => {

      if (
        path ===
        "/dashboard"
      ) {
        return {
          title:
            t(
              "header.dashboard.welcomeBack",
              {
                name:
                  userName,
              }
            ),

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
            t(
              "header.recipes.title"
            ),

          subtitle:
            t(
              "header.recipes.subtitle"
            ),

          actionLabel:
            t(
              "header.recipes.addNewRecipe"
            ),

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
            t(
              "header.createRecipe.title"
            ),

          subtitle:
            t(
              "header.createRecipe.subtitle"
            ),

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
            t(
              "header.recipeDetails.title"
            ),

          subtitle:
            t(
              "header.recipeDetails.subtitle"
            ),

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
            t(
              "header.productMaster.title"
            ),

          subtitle:
            t(
              "header.productMaster.subtitle"
            ),

          actionLabel:
            t(
              "header.productMaster.addNewProduct"
            ),

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
            t(
              "header.erpEntry.title"
            ),

          subtitle:
            t(
              "header.erpEntry.subtitle"
            ),

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
            t(
              "header.erpEntryDetails.title"
            ),

          subtitle:
            t(
              "header.erpEntryDetails.subtitle"
            ),

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
            t(
              "header.reports.title"
            ),

          subtitle:
            t(
              "header.reports.subtitle"
            ),

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
            t(
              "header.auditTrail.title"
            ),

          subtitle:
            t(
              "header.auditTrail.subtitle"
            ),

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
            t(
              "header.settings.title"
            ),

          subtitle:
            t(
              "header.settings.subtitle"
            ),

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
          t(
            "header.defaultPage.title"
          ),

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
          t(
            "header.chooseImageError"
          )
        );

        return;
      }


      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        alert(
          t(
            "header.imageSizeError"
          )
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
              t(
                "header.imageLoadError"
              )
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
            placeholder={
              t(
                "header.searchAnything"
              )
            }
          />

        </div>


        <div className="header-right-actions">

          <select
            value={
              i18n.language
                ?.startsWith(
                  "ar"
                )
                ? "ar"
                : "en"
            }
            onChange={
              handleLanguageChange
            }
            aria-label="Language"
            style={{
              height:
                "38px",
              padding:
                "0 12px",
              border:
                "1px solid #eadfd8",
              borderRadius:
                "10px",
              background:
                "#ffffff",
              color:
                "#513c29",
              fontFamily:
                "inherit",
              fontSize:
                "12px",
              fontWeight:
                600,
              cursor:
                "pointer",
              outline:
                "none",
            }}
          >

            <option value="en">
              {
                t(
                  "common.english"
                )
              }
            </option>

            <option value="ar">
              {
                t(
                  "common.arabic"
                )
              }
            </option>

          </select>


          <div
            className="header-notification-wrapper"
            ref={
              notificationRef
            }
          >

            <button
              type="button"
              className="header-notification"
              aria-label={
                t(
                  "header.notifications"
                )
              }
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
                    {
                      t(
                        "header.notifications"
                      )
                    }
                  </strong>

                </div>


                {notificationsLoading ? (

                  <div className="header-notification-empty">
                    {
                      t(
                        "header.loadingNotifications"
                      )
                    }
                  </div>

                ) : notifications.length ===
                  0 ? (

                  <div className="header-notification-empty">
                    {
                      t(
                        "header.noNotifications"
                      )
                    }
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
                              i18n.language
                                ?.startsWith(
                                  "ar"
                                )
                                ? "right"
                                : "left",
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
            {
              pageInfo.title
            }
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