import {
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
  supabase,
} from "../lib/supabaseClient";

import Background from "../assets/images/Background2.png";

import "../styles/Login.css";


function Login() {
  const navigate =
    useNavigate();

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
          "Please enter your username and password."
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
            "Could not sign in.";

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
            "Could not create user session."
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
          "Incorrect username or password."
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
          src={Background}
          alt="Bites Recipe Management"
          className="login-background"
        />

      </picture>


      {/* Login Form Area */}
      <div className="login-content">

        <div className="login-card">

          <h1>
            Welcome Back
          </h1>

          <p className="login-subtitle">
            Please sign in to your account
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
              Admin / Manager
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
              Employee
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
                Username
              </label>

              <div className="input-wrapper">

                <User className="input-icon" />

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
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
                Password
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
                  placeholder="Enter your password"
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
                      ? "Hide password"
                      : "Show password"
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
                  Forgot Password?
                </button>

              </div>

            )}


            {/* Sign In */}
            <button
              type="submit"
              className="sign-in-btn"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}

              {!loading && (
                <ArrowRight
                  size={18}
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