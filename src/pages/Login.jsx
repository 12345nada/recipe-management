import {
  useEffect,
  useState,
} from "react";

import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  supabase,
} from "../lib/supabaseClient";

import BackgroundEn from "../assets/images/Background2.png";
import BackgroundAr from "../assets/images/Araby.png";

import "../styles/Login.css";


function Login() {
  const navigate =
    useNavigate();

  const {
    t,
    i18n,
  } = useTranslation();


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    accountType,
    setAccountType,
  ] = useState("admin");

  const [
    formData,
    setFormData,
  ] = useState({
    username: "",
    password: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const [currentLanguage, setCurrentLanguage] = useState(
    () =>
      (localStorage.getItem("recipe-language") ||
        i18n.resolvedLanguage ||
        i18n.language ||
        "en")
        .toLowerCase()
        .startsWith("ar")
        ? "ar"
        : "en"
  );


  const loginBackground =
    currentLanguage === "ar"
      ? BackgroundAr
      : BackgroundEn;


  useEffect(() => {
    const syncLanguage = (language) => {
      const normalizedLanguage = language?.startsWith("ar") ? "ar" : "en";

      setCurrentLanguage(normalizedLanguage);
      localStorage.setItem("recipe-language", normalizedLanguage);
      document.documentElement.lang = normalizedLanguage;
      document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
      document.body.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
    };

    syncLanguage(i18n.resolvedLanguage || i18n.language || currentLanguage);
    i18n.on("languageChanged", syncLanguage);

    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, [i18n]);


  const handleLanguageChange =
    async (language) => {
      setCurrentLanguage(language);
      localStorage.setItem("recipe-language", language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      document.body.dir = language === "ar" ? "rtl" : "ltr";

      await i18n.changeLanguage(language);
    };


  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (previousData) => ({
          ...previousData,
          [name]: value,
        })
      );

      setErrorMessage("");
    };


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const username =
        formData.username
          .trim()
          .toLowerCase();

      const password =
        formData.password;

      if (
        !username ||
        !password
      ) {
        setErrorMessage(
          t(
            "login.errors.enterCredentials"
          )
        );

        return;
      }

      try {
        setLoading(true);

        setErrorMessage("");

        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            "login-with-username",
            {
              body: {
                username,
                password,
                accountType,
              },
            }
          );

        if (error) {
          let message =
            error.message ||
            t(
              "login.errors.couldNotSignIn"
            );

          try {
            const response =
              await error.context
                ?.json?.();

            if (
              response?.error
            ) {
              message =
                response.error;
            }
          } catch {
            // Keep default message
          }

          throw new Error(
            message
          );
        }

        if (
          !data?.session
            ?.access_token ||
          !data?.session
            ?.refresh_token
        ) {
          throw new Error(
            data?.error ||
            t(
              "login.errors.sessionError"
            )
          );
        }

        const {
          error:
            sessionError,
        } =
          await supabase.auth
            .setSession({
              access_token:
                data.session
                  .access_token,

              refresh_token:
                data.session
                  .refresh_token,
            });

        if (sessionError) {
          throw sessionError;
        }

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

      } catch (error) {
        console.error(
          "Login error:",
          error
        );

        setErrorMessage(
          error.message ||
          t(
            "login.errors.incorrectCredentials"
          )
        );

      } finally {
        setLoading(false);
      }
    };


  const handleAccountTypeChange =
    (type) => {
      if (loading) {
        return;
      }

      setAccountType(type);

      setErrorMessage("");
    };


  return (
    <div className="login-page">

      {/* Background Image */}
      <picture className="login-picture">

        <img
          key={currentLanguage}
          src={loginBackground}
          alt="Bites Recipe Management"
          className="login-background"
        />

      </picture>


      {/* Login Form Area */}
      <div className="login-content">

        <div className="login-card">


          {/* ===============================
              LANGUAGE SWITCH
          =============================== */}

          <div className="login-language-switch">

            <button
              type="button"
              className={
                currentLanguage ===
                "en"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleLanguageChange(
                  "en"
                )
              }
            >
              English
            </button>


            <button
              type="button"
              className={
                currentLanguage ===
                "ar"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleLanguageChange(
                  "ar"
                )
              }
            >
              العربية
            </button>

          </div>


          <h1>
            {
              t(
                "login.welcomeBack"
              )
            }
          </h1>

          <p className="login-subtitle">
            {
              t(
                "login.subtitle"
              )
            }
          </p>


          {/* Account Type */}
          <div className="login-account-tabs">

            <button
              type="button"
              className={
                accountType ===
                "admin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleAccountTypeChange(
                  "admin"
                )
              }
              disabled={loading}
            >
              {
                t(
                  "login.adminManager"
                )
              }
            </button>


            <button
              type="button"
              className={
                accountType ===
                "employee"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleAccountTypeChange(
                  "employee"
                )
              }
              disabled={loading}
            >
              {
                t(
                  "login.employee"
                )
              }
            </button>

          </div>


          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* Username */}
            <div className="input-group">

              <label htmlFor="username">
                {
                  t(
                    "login.username"
                  )
                }
              </label>

              <div className="input-wrapper">

                <User className="input-icon" />

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder={
                    t(
                      "login.usernamePlaceholder"
                    )
                  }
                  value={
                    formData.username
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="username"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* Password */}
            <div className="input-group">

              <label htmlFor="password">
                {
                  t(
                    "login.password"
                  )
                }
              </label>

              <div className="input-wrapper">

                <Lock className="input-icon" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder={
                    t(
                      "login.passwordPlaceholder"
                    )
                  }
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? t(
                          "login.hidePassword"
                        )
                      : t(
                          "login.showPassword"
                        )
                  }
                  disabled={loading}
                >

                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}

                </button>

              </div>

            </div>


            {/* Error Message */}
            {errorMessage && (
              <p
                className="login-error-message"
                role="alert"
              >
                {errorMessage}
              </p>
            )}


            {/* Forgot Password */}
            {accountType ===
              "admin" && (

              <div className="forgot-password-row">

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    navigate(
                      "/forgot-password"
                    )
                  }
                  disabled={loading}
                >
                  {
                    t(
                      "login.forgotPassword"
                    )
                  }
                </button>

              </div>

            )}


            {/* Sign In */}
            <button
              type="submit"
              className="sign-in-btn"
              disabled={loading}
            >

              {
                loading
                  ? t(
                      "login.signingIn"
                    )
                  : t(
                      "login.signIn"
                    )
              }

              {!loading && (
                <ArrowRight
                  size={18}
                  className="login-arrow-icon"
                />
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}


export default Login;