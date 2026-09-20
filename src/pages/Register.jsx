import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [banner, setBanner] = useState(null);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        shopName: "",
        ownerName: "",
        email: "",
        phone: "",

        street: "",
        city: "",
        state: "",
        pincode: "",

        drugLicenseNumber: "",

        password: "",
        confirmPassword: "",
    });

    const [licenseFile, setLicenseFile] = useState(null);

    // -----------------------------
    // Handle input changes
    // -----------------------------

    const handleChange = (e) => {
        const { id, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // -----------------------------
    // Handle license upload
    // -----------------------------

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLicenseFile(e.target.files[0]);
        }
    };

    // -----------------------------
    // Next step
    // -----------------------------

    const handleNext = (e) => {
        e.preventDefault();

        setBanner(null);

        // STEP 1
        if (currentStep === 1) {
            if (
                !formData.shopName ||
                !formData.ownerName ||
                !formData.email ||
                !formData.phone ||
                !formData.password ||
                !formData.confirmPassword
            ) {
                return setBanner({
                    type: "error",
                    message:
                        "Please fill in all required pharmacy details.",
                });
            }

            if (formData.password !== formData.confirmPassword) {
                return setBanner({
                    type: "error",
                    message:
                        "Passwords do not match.",
                });
            }

            if (formData.password.length < 6) {
                return setBanner({
                    type: "error",
                    message:
                        "Password must be at least 6 characters.",
                });
            }
        }

        // STEP 2
        else if (currentStep === 2) {
            if (
                !formData.street ||
                !formData.city ||
                !formData.state ||
                !formData.pincode
            ) {
                return setBanner({
                    type: "error",
                    message:
                        "Please fill in all required address details.",
                });
            }

            if (formData.pincode.length !== 6) {
                return setBanner({
                    type: "error",
                    message:
                        "Pincode must contain 6 digits.",
                });
            }
        }

        setCurrentStep((prev) =>
            Math.min(prev + 1, 3)
        );
    };

    // -----------------------------
    // Previous step
    // -----------------------------

    const handlePrev = () => {
        setBanner(null);

        setCurrentStep((prev) =>
            Math.max(prev - 1, 1)
        );
    };

    // -----------------------------
    // Submit registration
    // -----------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();

        setBanner(null);

        if (
            !formData.drugLicenseNumber ||
            !licenseFile
        ) {
            return setBanner({
                type: "error",
                message:
                    "Please provide both the drug license number and license document.",
            });
        }

        setIsLoading(true);

        try {
            const payload = new FormData();

            payload.append(
                "shopName",
                formData.shopName
            );

            payload.append(
                "ownerName",
                formData.ownerName
            );

            payload.append(
                "email",
                formData.email
            );

            payload.append(
                "phone",
                formData.phone
            );

            payload.append(
                "password",
                formData.password
            );

            payload.append(
                "confirmPassword",
                formData.confirmPassword
            );

            // Address
            payload.append(
    "address",
    JSON.stringify({
        street: formData.street,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
    })
);

            // License
            payload.append(
                "drugLicenseNumber",
                formData.drugLicenseNumber
            );

            payload.append(
                "licenseImage",
                licenseFile
            );

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
                {
                    method: "POST",
                    body: payload,
                }
            );

            const data =
                await response.json();

            if (response.ok) {
                setBanner({
                    type: "success",
                    message:
                        "Registration successful! Your pharmacy is pending approval. Redirecting to login...",
                });

                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setBanner({
                    type: "error",
                    message:
                        data.message ||
                        "Registration failed.",
                });
            }
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            setBanner({
                type: "error",
                message:
                    "Unable to connect to the server.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">

            <div className="w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-8 ring-1 ring-slate-200 dark:ring-slate-800">

                {/* Header */}

                <div className="mb-6">

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Chemist Registration
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Step {currentStep} of 3
                    </p>

                </div>

                {/* Progress Bar */}

                <div className="flex gap-2 mb-8">

                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                                step <= currentStep
                                    ? "bg-indigo-600 dark:bg-indigo-500"
                                    : "bg-slate-200 dark:bg-slate-800"
                            }`}
                        />
                    ))}

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
                    onSubmit={
                        currentStep === 3
                            ? handleSubmit
                            : handleNext
                    }
                >

                    {/* ========================= */}
                    {/* STEP 1 */}
                    {/* ========================= */}

                    {currentStep === 1 && (
                        <div className="space-y-4">

                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                Pharmacy Information
                            </h3>

                            <div>
                                <label className="text-xs font-medium">
                                    Shop Name *
                                </label>

                                <input
                                    id="shopName"
                                    type="text"
                                    required
                                    value={formData.shopName}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Owner Name *
                                </label>

                                <input
                                    id="ownerName"
                                    type="text"
                                    required
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Email Address *
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Phone Number *
                                </label>

                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Password *
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Confirm Password *
                                </label>

                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={
                                        formData.confirmPassword
                                    }
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                        </div>
                    )}

                    {/* ========================= */}
                    {/* STEP 2 */}
                    {/* ========================= */}

                    {currentStep === 2 && (
                        <div className="space-y-4">

                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                Pharmacy Address
                            </h3>

                            <div>
                                <label className="text-xs font-medium">
                                    Street / Ward *
                                </label>

                                <input
                                    id="street"
                                    type="text"
                                    required
                                    value={formData.street}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <label className="text-xs font-medium">
                                        City *
                                    </label>

                                    <input
                                        id="city"
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium">
                                        State *
                                    </label>

                                    <input
                                        id="state"
                                        type="text"
                                        required
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Pincode *
                                </label>

                                <input
                                    id="pincode"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    required
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                        </div>
                    )}

                    {/* ========================= */}
                    {/* STEP 3 */}
                    {/* ========================= */}

                    {currentStep === 3 && (
                        <div className="space-y-4">

                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                License Verification
                            </h3>

                            <div>
                                <label className="text-xs font-medium">
                                    Drug License Number *
                                </label>

                                <input
                                    id="drugLicenseNumber"
                                    type="text"
                                    required
                                    value={
                                        formData.drugLicenseNumber
                                    }
                                    onChange={handleChange}
                                    className="w-full h-10 mt-1 px-3 rounded-lg border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium">
                                    Drug License Document *
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    required
                                    onChange={handleFileChange}
                                    className="w-full mt-1 p-2 border border-dashed rounded-lg dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                />

                                {licenseFile && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Selected:{" "}
                                        {licenseFile.name}
                                    </p>
                                )}
                            </div>

                        </div>
                    )}

                    {/* Navigation */}

                    <div className="mt-8 flex justify-between gap-4">

                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-5 h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Previous
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ml-auto px-6 h-10 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {currentStep === 3
                                ? isLoading
                                    ? "Submitting..."
                                    : "Submit Registration"
                                : "Next"}
                        </button>

                    </div>

                </form>

                <p className="mt-6 text-center text-sm text-slate-500">

                    Already registered?{" "}

                    <Link
                        to="/login"
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Sign in
                    </Link>

                </p>

            </div>
        </div>
    );
}

export default Register;
