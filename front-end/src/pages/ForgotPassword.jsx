import { useState } from "react";
import API from "../utils/api";

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3, DONE: 4 };

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!email) return setError("Please enter your email");
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setStep(STEPS.OTP);
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp) return setError("Please enter the OTP");
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email, otp });
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return setError("Please fill in both fields");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email, newPassword });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.iconWrap}>🔐</div>
        <h2 style={styles.title}>
          {step === STEPS.EMAIL && "Forgot Password"}
          {step === STEPS.OTP && "Enter OTP"}
          {step === STEPS.RESET && "New Password"}
          {step === STEPS.DONE && "All Done!"}
        </h2>
        <p style={styles.subtitle}>
          {step === STEPS.EMAIL && "Enter your email and we'll send you a reset code"}
          {step === STEPS.OTP && `We sent a 6-digit code to ${email}`}
          {step === STEPS.RESET && "Choose a strong new password"}
          {step === STEPS.DONE && "Your password has been reset successfully"}
        </p>

        {/* Step 1: Email */}
        {step === STEPS.EMAIL && (
          <div style={styles.form}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={handleSendOTP} disabled={loading} style={styles.btn}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === STEPS.OTP && (
          <div style={styles.form}>
            <label style={styles.label}>6-Digit OTP</label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              style={{ ...styles.input, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={handleVerifyOTP} disabled={loading} style={styles.btn}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: 13, color: "#aaa" }}>Resend OTP in {resendTimer}s</p>
              ) : (
                <button onClick={handleSendOTP} style={styles.linkBtn}>
                  Resend OTP
                </button>
              )}
            </div>
            <button onClick={() => { setStep(STEPS.EMAIL); setError(""); }} style={styles.backBtn}>
              ← Change Email
            </button>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === STEPS.RESET && (
          <div style={styles.form}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
            <label style={{ ...styles.label, marginTop: 12 }}>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={handleResetPassword} disabled={loading} style={styles.btn}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === STEPS.DONE && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <a href="/login" style={styles.btn}>
              Back to Login
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { background: "#fff", borderRadius: 16, padding: 36, width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" },
  iconWrap: { fontSize: 40, textAlign: "center", marginBottom: 12 },
  title: { margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1a1a2e", textAlign: "center" },
  subtitle: { margin: "0 0 24px", fontSize: 14, color: "#888", textAlign: "center", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { padding: "12px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none", marginBottom: 8, boxSizing: "border-box", width: "100%" },
  btn: { marginTop: 8, padding: "13px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" },
  linkBtn: { background: "none", border: "none", color: "#2563eb", fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "underline" },
  backBtn: { background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", marginTop: 8, textAlign: "center" },
  error: { color: "#ef4444", fontSize: 13, fontWeight: 600, margin: "4px 0 8px" },
};