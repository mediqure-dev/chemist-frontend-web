import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [banner, setBanner] = useState(null);

    const handleChange = (e) => {

        const { id, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setIsLoading(true);
        setBanner(null);

        try {

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );
            }

            const loginData =
                data.data;

            const token =
                loginData.token;

            const chemist =
                loginData.chemist;

            // Save authentication
            localStorage.setItem(
                "chemist_token",
                token
            );

            localStorage.setItem(
                "chemist_role",
                chemist.role
            );

            localStorage.setItem(
                "chemist_account",
                JSON.stringify(chemist)
            );

            setBanner({
                type: "success",
                message:
                    "Login successful! Redirecting...",
            });

            setTimeout(() => {

                navigate("/dashboard");

            }, 1000);

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            setBanner({
                type: "error",
                message:
                    error.message ||
                    "Unable to connect to the server.",
            });

        } finally {

            setIsLoading(false);

        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">

            <div className="w-full max-w-md">

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">

                    {/* Header */}

                    <div className="text-center mb-8">

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Chemist Login
                        </h1>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Sign in to manage your pharmacy
                        </p>

                    </div>

                    {/* Banner */}

                    {banner && (
                        <div
                            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                                banner.type === "error"
                                    ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                            }`}
                        >
                            {banner.message}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Email */}

                        <div>

                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="chemist@example.com"
                                className="w-full h-11 mt-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                        </div>

                        {/* Password */}

                        <div>

                            <div className="flex justify-between">

                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Forgot password?
                                </button>

                            </div>

                            <input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full h-11 mt-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                        </div>

                        {/* Login */}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50"
                        >
                            {isLoading
                                ? "Signing in..."
                                : "Sign In"}
                        </button>

                    </form>

                    {/* Register */}

                    <div className="mt-8 text-center text-sm text-slate-500">

                        Don't have a pharmacy account?{" "}

                        <Link
                            to="/register"
                            className="text-indigo-600 font-semibold hover:underline"
                        >
                            Register your pharmacy
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;
