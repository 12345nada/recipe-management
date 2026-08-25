import { useState } from "react";

import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import Background from "../assets/images/Background2.png";

import "../styles/Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [accountType, setAccountType] = useState("admin");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log({
      ...formData,
      accountType,
    });
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

          <h1>Welcome Back</h1>

          <p className="login-subtitle">
            Please sign in to your account
          </p>

          {/* Account Type */}
          <div className="login-account-tabs">

            <button
              type="button"
              className={
                accountType === "admin"
                  ? "active"
                  : ""
              }
              onClick={() => setAccountType("admin")}
            >
              Admin / Manager
            </button>

            <button
              type="button"
              className={
                accountType === "employee"
                  ? "active"
                  : ""
              }
              onClick={() => setAccountType("employee")}
            >
              Employee
            </button>

          </div>

          <form onSubmit={handleSubmit}>

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
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
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
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}
                </button>

              </div>

            </div>

            {/* Forgot Password */}
            {accountType === "admin" && (
  <div className="forgot-password-row">
    <button
      type="button"
      className="forgot-password"
    >
      Forgot Password?
    </button>
  </div>
)}
            {/* Sign In */}
            <button
              type="submit"
              className="sign-in-btn"
            >
              Sign In

              <ArrowRight size={18} />
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;