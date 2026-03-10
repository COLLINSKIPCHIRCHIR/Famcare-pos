import { useState } from "react";
import { registerUser } from "../api/auth";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      const res = await registerUser({
        full_name: fullName,
        email,
        password,
        role: "staff",
      });
      alert("User registered successfully!");
      setFullName(""); setEmail(""); setPassword("");
    } catch (err) {
      alert(err.response?.data?.msg || "Error registering user");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
        <input
          className="border p-2 mb-2 w-full"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className="border p-2 mb-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 mb-4 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 w-full rounded"
          onClick={handleSignUp}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}