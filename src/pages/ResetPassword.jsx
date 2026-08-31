import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
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


function ResetPassword() {
  const navigate =
    useNavigate();


  const [
    formData,
    setFormData,
  ] = useState({
    password: "",
    confirmPassword: "",
  });


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    canReset,
    setCanReset,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    let mounted =
      true;


    const checkRecoverySession =
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase
              .auth
              .getSession();


          if (error) {
            throw error;
          }


          if (mounted) {
            const allowed =
              Boolean(
                data.session
              );


            setCanReset(
              allowed
            );


            if (!allowed) {
              setErrorMessage(
                "Please verify the OTP first."
              );
            }
          }
        } catch (error) {
          console.error(
            "Reset session check error:",
            error
          );


          if (mounted) {
            setCanReset(
              false
            );


            setErrorMessage(
              "Please verify the OTP first."
            );
          }
        } finally {
          if (mounted) {
            setCheckingSession(
              false
            );
          }
        }
      };


    checkRecoverySession();


    return () => {
      mounted =
        false;
    };
  }, []);


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


      if (
        !canReset
      ) {
        setErrorMessage(
          "Please verify the OTP first."
        );

        return;
      }


      if (
        formData.password.length <
        6
      ) {
        setErrorMessage(
          "Password must contain at least 6 characters."
        );

        return;
      }


      if (
        formData.password !==
        formData.confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        const {
          error,
        } =
          await supabase
            .auth
            .updateUser({
              password:
                formData.password,
            });


        if (error) {
          throw error;
        }


        sessionStorage.removeItem(
          "passwordRecoveryEmail"
        );


        await supabase
          .auth
          .signOut();


        navigate(
          "/login",
          {
            replace:
              true,

            state: {
              passwordReset:
                true,
            },
          }
        );
      } catch (error) {
        console.error(
          "Update password error:",
          error
        );


        setErrorMessage(
          error?.message ||
          "Could not update password."
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
          alt="Bites reset password background"
          className="login-background"
        />
      </picture>


      <div className="login-content">

        <div className="login-card recovery-card">

          <h1>
            Reset Password
          </h1>


          <p className="login-subtitle recovery-subtitle">
            Create a new password for your Admin / Manager account
          </p>


          {checkingSession ? (

            <p className="recovery-info-message">
              Checking recovery session...
            </p>

          ) : (

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="input-group">

                <label htmlFor="new-password">
                  New Password
                </label>


                <div className="input-wrapper">

                  <Lock
                    className="input-icon"
                  />


                  <input
                    id="new-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter new password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="new-password"
                    disabled={
                      loading ||
                      !canReset
                    }
                    required
                  />


                  <button
                    type="button"
                    className="toggle-icon"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    disabled={
                      loading ||
                      !canReset
                    }
                  >
                    {showPassword
                      ? (
                        <EyeOff />
                      )
                      : (
                        <Eye />
                      )}
                  </button>

                </div>

              </div>


              <div className="input-group">

                <label htmlFor="confirm-password">
                  Confirm Password
                </label>


                <div className="input-wrapper">

                  <Lock
                    className="input-icon"
                  />


                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Repeat new password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="new-password"
                    disabled={
                      loading ||
                      !canReset
                    }
                    required
                  />


                  <button
                    type="button"
                    className="toggle-icon"
                    onClick={() =>
                      setShowConfirmPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    disabled={
                      loading ||
                      !canReset
                    }
                  >
                    {showConfirmPassword
                      ? (
                        <EyeOff />
                      )
                      : (
                        <Eye />
                      )}
                  </button>

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
                disabled={
                  loading ||
                  !canReset
                }
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}

                {!loading && (
                  <ArrowRight
                    size={18}
                  />
                )}
              </button>

            </form>

          )}

        </div>

      </div>

    </div>
  );
}


export default ResetPassword;
