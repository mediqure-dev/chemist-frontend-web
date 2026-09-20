import { Link } from "react-router-dom";

function ChemistLanding() {
  const onlineFeatures = [
    {
      title: "Get Your Pharmacy Online",
      description: "Create your digital storefront in minutes and build your brand presence.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      title: "Reach Local Customers",
      description: "Connect directly with patients and customers in your neighborhood.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Online Medicine Orders",
      description: "Accept, process, and track medicine orders seamlessly.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      title: "Custom Delivery Radius",
      description: "Define your service zones and manage delivery reach efficiently.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      title: "Secure Prescription Handling",
      description: "Safely receive and verify uploaded patient prescriptions digitally.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Pharmacy Digital Profile",
      description: "Showcase license status, operating hours, and contact details online.",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const operationalFeatures = [
    {
      title: "POS & Offline Billing",
      description: "Fast billing for walk-in customers with auto-stock updates.",
      icon: "💳",
    },
    {
      title: "Barcode-Based Billing",
      description: "Scan product barcodes directly for instant queue-free checkout.",
      icon: "🏷️",
    },
    {
      title: "Smart Inventory Control",
      description: "Track expiry dates, low stock alerts, and automated reorders.",
      icon: "📦",
    },
    {
      title: "Digital Invoices",
      description: "Generate and email invoices straight to customers.",
      icon: "📄",
    },
    {
      title: "Purchase & Suppliers",
      description: "Manage distributor invoices, payables, and stock entries easily.",
      icon: "🚚",
    },
    {
      title: "Delivery Integration",
      description: "Assign local delivery staff and monitor order dispatch status.",
      icon: "🛵",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Mediqure
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#online-growth" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Online Growth</a>
            <a href="#store-management" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Store Ops</a>
            <a href="#analytics" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Analytics</a>
            <a href="#ai-tools" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">AI Tools</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition"
            >
              Register Pharmacy
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
                ⚡ Complete Pharmacy Operating System
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                Get Your Pharmacy Online & Grow Sales.
              </h1>

              <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Transform your traditional medical store into a smart digital pharmacy. Receive online orders, manage stock, execute POS billing, and expand your local reach effortlessly.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 transition"
                >
                  Start Free Trial
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <a
                  href="#store-management"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Explore Features
                </a>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 blur-2xl opacity-20 dark:opacity-30"></div>
              <div className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">Live Dashboard Preview</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">New Online Order Received</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Rx Order #ORD-8492</div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-full">Pending Delivery</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Today's Billing</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹ 24,850</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Low Stock Alert</div>
                      <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">12 Items</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Online Growth Section */}
      <section id="online-growth" className="py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Expand Beyond Your Physical Counter
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Everything you need to accept online orders and deliver medicines locally.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineFeatures.map((feat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 dark:hover:border-indigo-400 transition">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{feat.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Operations Section */}
      <section id="store-management" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manage Your Pharmacy Digitally
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Speed up daily operations with integrated POS billing, inventory, and supplier workflows.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {operationalFeatures.map((feat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-2xl mb-3">{feat.icon}</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{feat.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics & AI Features */}
      <section id="analytics" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Advanced Intelligence</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">
                Sales Analytics & Future AI Tools
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Track revenue performance, top-selling medications, supplier trends, and inventory turnover in real-time with automatic visual insights.
              </p>

              <div id="ai-tools" className="mt-8 p-6 rounded-2xl bg-slate-800/80 border border-indigo-500/30">
                <div className="flex items-center gap-3 text-indigo-400 font-bold text-sm">
                  <span>✨ Coming Soon</span>
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                </div>
                <h4 className="mt-2 text-lg font-bold text-white">Future AI-Powered Pharmacy Tools</h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Automated OCR prescription scanner, smart stock reorder prediction models, and AI customer chat assistant for medication inquiries.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-3xl font-extrabold text-indigo-400">100%</div>
                <div className="mt-2 text-sm text-slate-300">Digital Stock Precision</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-3xl font-extrabold text-indigo-400">3x</div>
                <div className="mt-2 text-sm text-slate-300">Faster Billing Speed</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-3xl font-extrabold text-indigo-400">0%</div>
                <div className="mt-2 text-sm text-slate-300">Expired Stock Waste</div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="text-3xl font-extrabold text-indigo-400">24/7</div>
                <div className="mt-2 text-sm text-slate-300">Online Store Visibility</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ready to digitize your medical store?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Join hundreds of pharmacies managing inventory, billing, and online orders effortlessly.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition"
            >
              Register Your Pharmacy Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 Mediqure. All rights reserved.
      </footer>
    </div>
  );
}

export default ChemistLanding;
