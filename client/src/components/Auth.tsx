import React, { useState } from "react";
import { UserProfile, UserRole, MUNICIPALITIES } from "../types";
import { Leaf, Loader2, User, Lock, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface AuthProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [phone, setPhone] = useState("");
  const [primaryProducts, setPrimaryProducts] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const API = (import.meta.env.VITE_API_BASE || "http://localhost:4000").replace(/\/+$/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isForgotPassword && resetToken) {
        const res = await fetch(`${API}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Password reset failed");
        setSuccess("Password reset successfully. You can now sign in.");
        setResetToken("");
        setNewPassword("");
        setIsForgotPassword(false);
        return;
      }

      if (isForgotPassword) {
        const res = await fetch(`${API}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Password reset request failed");
        setSuccess(data.message || "If the account exists, a reset link has been requested.");
        if (data.resetToken) setResetToken(data.resetToken);
        return;
      }

      if (isLogin) {
        const res = await fetch(`${API}/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign in failed");
        // data.profile is the stored user profile in Firestore
        // persist JWT for later requests
        if (data.idToken) localStorage.setItem("idToken", data.idToken);
        onAuthSuccess({ ...(data.profile || {}), uid: data.uid });
      } else {
        const payload: any = { email, password, displayName, role, phone, photoURL: photoURL || undefined };
        if (role === "farmer") {
          payload.municipality = municipality;
          payload.phone = phone;
          payload.primaryProducts = primaryProducts
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s);
        }

        const res = await fetch(`${API}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        // show a success message for user feedback
        if (role === "farmer") {
          setSuccess("Account created successfully — pending admin approval.");
        } else {
          setSuccess("Account created successfully.");
        }

        // auto sign-in to obtain JWT and fresh profile
        try {
          const sres = await fetch(`${API}/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const sdata = await sres.json();
          if (sres.ok) {
            if (sdata.idToken) localStorage.setItem("idToken", sdata.idToken);
            const profile = {
              ...(sdata.profile || data.profile || {}),
              uid: sdata.uid || data.uid,
            };
            localStorage.setItem("profile", JSON.stringify(profile));
            onAuthSuccess(profile);
          } else {
            const profile = { ...(data.profile || {}), uid: data.uid };
            localStorage.setItem("profile", JSON.stringify(profile));
            onAuthSuccess(profile);
          }
        } catch (e) {
          const profile = { ...(data.profile || {}), uid: data.uid };
          localStorage.setItem("profile", JSON.stringify(profile));
          onAuthSuccess(profile);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side - Branding */}
        <div className="md:w-1/2 bg-emerald-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Leaf className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold tracking-tight">
                Samar Farmers
              </h1>
            </div>
            <h2 className="text-4xl font-light leading-tight mb-6">
              Empowering{" "}
              <span className="text-emerald-400 font-bold italic">
                Local Agriculture
              </span>{" "}
              in Samar.
            </h2>
            <p className="text-emerald-200 text-lg">
              Connecting farmers directly to buyers for a sustainable and
              thriving community.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 text-emerald-400">
              <div className="w-12 h-1px bg-emerald-400/30"></div>
              <span className="text-sm uppercase tracking-widest font-semibold">
                Online Marketplac
              </span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-12">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-stone-900 mb-2">
              {isForgotPassword ? (resetToken ? "Reset Password" : "Forgot Password") : isLogin ? "Welcome Back" : "Create Account"}
            </h3>
            <p className="text-stone-500">
              {isForgotPassword
                ? resetToken
                  ? "Choose a new password for your account"
                  : "Enter your email to request a password reset"
                : isLogin
                ? "Sign in to your account"
                : "Join our community of farmers and buyers"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                  <input
                    required
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                <input
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="you@gmail.com"
                />
              </div>
            </div>

            {!isForgotPassword && !resetToken && <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>}

            {isForgotPassword && resetToken && (

              // HIDE TOKEN INPUT FIELD, USE THE TOKEN RETURNED FROM THE API INSTEAD
              // Reset password
              <>
                {/* <div className="space-y-1">
                  <label className="text-sm font-semibold text-stone-700">Reset Token</label>
                  <input required type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div> */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-stone-700">New Password</label>
                  <input required minLength={8} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="At least 8 characters" />
                </div>
              </>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-stone-700">
                    I am a...
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="farmer">Farmer</option>
                  </select>
                </div>
                {role === "farmer" && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-stone-700">
                      Municipality
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <select
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        {MUNICIPALITIES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Contact Number</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="0912 345 6789" />
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Profile Photo</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    setError("Profile photo must be 2MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setPhotoURL(String(reader.result));
                  reader.readAsDataURL(file);
                }} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm" />
                {photoURL && <img src={photoURL} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border border-stone-200" />}
              </div>
            )}

            {!isLogin && !isForgotPassword && role === "farmer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-4 border-t border-stone-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Farmer Registration Details
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-stone-700">
                    Primary Products (Comma separated)
                  </label>
                  <input
                    required
                    type="text"
                    value={primaryProducts}
                    onChange={(e) => setPrimaryProducts(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Rice, Corn, Vegetables"
                  />
                </div>
              </motion.div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isForgotPassword ? (
                resetToken ? "Reset Password" : "Request Reset"
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            {isLogin && <button type="button" onClick={() => {
              setIsForgotPassword(true);
              setError("");
              setSuccess("");
            }} className="block w-full text-stone-500 hover:text-emerald-600 font-medium transition-colors">Forgot password?</button>}
            {!isForgotPassword && <button type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-stone-500 hover:text-emerald-600 font-medium transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>}
            {isForgotPassword && <button type="button" onClick={() => {
              setIsForgotPassword(false);
              setResetToken("");
              setNewPassword("");
              setError("");
              setSuccess("");
            }} className="block w-full text-stone-500 hover:text-emerald-600 font-medium transition-colors">Back to sign in</button>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
