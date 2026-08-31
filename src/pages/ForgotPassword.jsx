import {
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Mail,
  User,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabaseClient";

import Background from "../assets/images/Background2.png";

import "../styles/Login.css";
import "../styles/PasswordRecovery.css";


function ForgotPassword() {
  const navigate =
    useNavigate();

  const [
    formData,
    setFormData,
  ] = useState({
    username: "",
    email: "",
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
    (
      event
    ) => {
      const {
        name,
        value,
      } = event.target;


      setFormData(
        (current) => ({
          ...current,
          [name]:
            value,
        })
      );


      setErrorMessage(
        ""
      );
    };


  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();


      const username =
        formData.username
          .trim()
          .replace(
            /^@/,
            ""
          )
          .toLowerCase();


      const email =
        formData.email
          .trim()
          .toLowerCase();


      if (
        !username ||
        !email
      ) {
        setErrorMessage(
          "Please enter your username and email."
        );

        return;
      }


      try {
        setLoading(
          true
        );

        setErrorMessage(
          ""
        );


        const {
          data,
          error,
        } =
          await supabase
            .functions
            .invoke(
              "request-password-reset",
              {
                body: {
                  username,
                  email,
                },
              }
            );


        if (error) {
          let message =
            error.message ||
            "Could not send OTP.";


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
          }


          throw new Error(
            message
          );
        }


        if (
          data?.error
        ) {
          throw new Error(
            data.error
          );
        }


        sessionStorage.setItem(
          "passwordRecoveryEmail",
          email
        );


        navigate(
          "/verify-reset-otp",
          {
            replace:
              true,

            state: {
              message:
                data?.message ||
                "Check your email for the OTP.",
            },
          }
        );
      } catch (error) {
        console.error(
          "Forgot password error:",
          error
        );


        setErrorMessage(
          error?.message ||
          "Could not send OTP."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  return (
    <div className="login-page">

      <picture className="login-picture">
        <img
          src={Background}
          alt="Bites password recovery background"
          className="login-background"
        />
      </picture>


      <div className="login-content">

        <div className="login-card recovery-card">

          <h1>
            Forgot Password
          </h1>


          <p className="login-subtitle recovery-subtitle">
            Enter your Admin / Manager username and real email to receive an OTP
          </p>


          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="input-group">

              <label htmlFor="forgot-username">
                Username
              </label>


              <div className="input-wrapper">

                <User
                  className="input-icon"
                />


                <input
                  id="forgot-username"
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


            <div className="input-group">

              <label htmlFor="forgot-email">
                Real Email
              </label>


              <div className="input-wrapper">

                <Mail
                  className="input-icon"
                />


                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  placeholder="Enter your real email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {errorMessage && (
              <p
                className="login-error-message recovery-error"
                role="alert"
              >
                {errorMessage}
              </p>
            )}


            <button
              type="submit"
              className="sign-in-btn recovery-primary-button"
              disabled={loading}
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}

              {!loading && (
                <ArrowRight
                  size={18}
                />
              )}
            </button>


            <button
              type="button"
              className="recovery-back-link"
              onClick={() =>
                navigate(
                  "/login"
                )
              }
              disabled={loading}
            >
              <ArrowLeft
                size={17}
              />

              Back to Sign In
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}


export default ForgotPassword;
