import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ============================================================
// 🔧 CONFIGURATION — Replace with your Lemon Squeezy links
// ============================================================
const LEMON_SQUEEZY = {
  pro_monthly: "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID_MONTHLY",
  pro_yearly:  "https://YOUR_STORE.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID_YEARLY",
};
const FREE_INVOICE_LIMIT = 3;
// ============================================================

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
];
const RECURRENCE = ["None","Weekly","Bi-weekly","Monthly","Quarterly","Yearly"];
const defaultItem = () => ({ id: Date.now() + Math.random(), desc: "", qty: 1, rate: 0 });

const G = {
  bg: "#0a0a0a", card: "#111", border: "#1e1e1e",
  gold: "#D4A84B", goldDim: "#D4A84B22", goldBorder: "#D4A84B44",
  text: "#e8e0d0", muted: "#666", subtle: "#999",
  input: "#161616", inputBorder: "#252525",
  red: "#ff5555", green: "#4ade80",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${G.bg}; font-family: 'Outfit', sans-serif; color: ${G.text}; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: ${G.bg}; } ::-webkit-scrollbar-thumb { background: ${G.gold}; border-radius: 3px; }
  input, select, textarea { outline: none; font-family: 'Outfit', sans-serif; }
  input::placeholder, textarea::placeholder { color: ${G.muted}; }
  button { font-family: 'Outfit', sans-serif; cursor: pointer; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 ${G.gold}44; } 50% { box-shadow: 0 0 0 12px transparent; } }
  @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .fadeUp { animation: fadeUp 0.6s ease forwards; }
  .fadeUp-1 { animation: fadeUp 0.6s 0.1s ease both; }
  .fadeUp-2 { animation: fadeUp 0.6s 0.2s ease both; }
  .fadeUp-3 { animation: fadeUp 0.6s 0.3s ease both; }
  .fadeUp-4 { animation: fadeUp 0.6s 0.4s ease both; }
  .pulse-btn { animation: pulse 2s infinite; }
  .float { animation: float 3s ease-in-out infinite; }
  .gold-shimmer {
    background: linear-gradient(90deg, ${G.gold} 0%, #f0c84a 40%, ${G.gold} 60%, #b8863c 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    .mobile-stack { flex-direction: column !important; }
    .mobile-full { width: 100% !important; }
    .mobile-grid-1 { grid-template-columns: 1fr !important; }
    .mobile-p { padding: 16px !important; }
    .mobile-text-sm { font-size: 14px !important; }
    .mobile-hide-col { display: none !important; }
  }
`;

export default function App() {
  const [page, setPage] = useState("landing"); // landing | app | pricing
  const [isPro, setIsPro] = useState(false);
  const [invoicesUsed, setInvoicesUsed] = useState(0);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleDownload = () => {
    if (!isPro && invoicesUsed >= FREE_INVOICE_LIMIT) {
      setShowUpgradeModal(true);
      return false;
    }
    setInvoicesUsed(prev => prev + 1);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
    return true;
  };

  const handleCheckout = (cycle) => {
    window.open(cycle === "yearly" ? LEMON_SQUEEZY.pro_yearly : LEMON_SQUEEZY.pro_monthly, "_blank");
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: G.bg }}>
        <Navbar page={page} setPage={setPage} isPro={isPro} />
        {page === "landing" && <LandingPage setPage={setPage} />}
        {page === "app" && (
          <InvoiceApp
            isPro={isPro}
            invoicesUsed={invoicesUsed}
            onDownload={handleDownload}
            setShowUpgradeModal={setShowUpgradeModal}
          />
        )}
        {page === "pricing" && (
          <PricingPage
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            handleCheckout={handleCheckout}
            isPro={isPro}
            setIsPro={setIsPro}
          />
        )}
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} handleCheckout={handleCheckout} setPage={setPage} />}
        {showSuccessModal && <SuccessToast />}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
function Navbar({ page, setPage, isPro }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#0a0a0acc", backdropFilter: "blur(20px)", borderBottom: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => setPage("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${G.gold}, #b8863c)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 4px 12px ${G.gold}44` }}>⚡</div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>InvoicePro</span>
          {isPro && <span style={{ fontSize: 10, background: G.gold, color: "#1a1a1a", padding: "2px 8px", borderRadius: 20, fontWeight: 600, letterSpacing: 1 }}>PRO</span>}
        </div>
        <div className="desktop-only" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[["app", "✏️ Create Invoice"], ["pricing", "💳 Pricing"]].map(([p, label]) => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: page === p ? G.goldDim : "transparent", color: page === p ? G.gold : G.muted, fontSize: 14, fontWeight: 500, transition: "all 0.2s", borderColor: page === p ? G.goldBorder : "transparent", borderStyle: "solid", borderWidth: 1 }}>
              {label}
            </button>
          ))}
          <button onClick={() => setPage("app")} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: G.gold, color: "#1a1a1a", fontSize: 14, fontWeight: 600, boxShadow: `0 4px 16px ${G.gold}44`, transition: "all 0.2s" }}>
            Start Free →
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-full" style={{ display: "none", background: "transparent", border: "none", color: G.text, fontSize: 22, maxWidth: 40 }}>☰</button>
      </div>
      {mobileOpen && (
        <div style={{ background: G.card, borderTop: `1px solid ${G.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {[["app", "✏️ Create Invoice"], ["pricing", "💳 Pricing"]].map(([p, label]) => (
            <button key={p} onClick={() => { setPage(p); setMobileOpen(false); }} style={{ padding: "12px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "transparent", color: G.text, fontSize: 14, textAlign: "left" }}>{label}</button>
          ))}
          <button onClick={() => { setPage("app"); setMobileOpen(false); }} style={{ padding: "12px 16px", borderRadius: 8, border: "none", background: G.gold, color: "#1a1a1a", fontSize: 14, fontWeight: 600 }}>Start Free →</button>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────
function LandingPage({ setPage }) {
  const features = [
    { icon: "📄", title: "PDF Export", desc: "Beautiful, professional invoices downloaded instantly as PDF" },
    { icon: "🌍", title: "10+ Currencies", desc: "Bill clients in USD, EUR, GBP, INR, PKR, AED and more" },
    { icon: "🔢", title: "Tax Calculator", desc: "Auto-calculate VAT, GST, or any custom tax rate instantly" },
    { icon: "↻", title: "Recurring Invoices", desc: "Set weekly, monthly, or quarterly recurring schedules" },
    { icon: "⚡", title: "Instant Setup", desc: "No signup needed. Fill, download, send. Done in 60 seconds." },
    { icon: "🔒", title: "100% Private", desc: "Your data never leaves your browser. No servers, no tracking." },
  ];
  const testimonials = [
    { name: "Sarah K.", role: "UI/UX Designer", text: "I switched from Wave and never looked back. So much faster.", avatar: "👩‍🎨" },
    { name: "James M.", role: "Freelance Developer", text: "The multi-currency support is a lifesaver for my international clients.", avatar: "👨‍💻" },
    { name: "Aisha R.", role: "Content Writer", text: "Finally an invoice tool that doesn't need me to create an account!", avatar: "✍️" },
  ];
  return (
    <div>
      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: `radial-gradient(circle, ${G.gold}18 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 80, left: "10%", width: 2, height: 2, borderRadius: "50%", background: G.gold, boxShadow: `0 0 20px 8px ${G.gold}44` }} />
        <div style={{ position: "absolute", bottom: 100, right: "15%", width: 2, height: 2, borderRadius: "50%", background: G.gold, boxShadow: `0 0 20px 8px ${G.gold}44` }} />
        <div className="fadeUp" style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: G.goldDim, border: `1px solid ${G.goldBorder}`, borderRadius: 20, padding: "6px 18px", fontSize: 13, color: G.gold, marginBottom: 24, letterSpacing: 1 }}>
            ✦ BUILT FOR FREELANCERS
          </div>
          <h1 className="gold-shimmer" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
            Invoices That Get<br />You Paid Faster
          </h1>
          <p style={{ fontSize: "clamp(15px, 2.5vw, 19px)", color: G.subtle, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Create stunning, professional invoices in under 60 seconds. Multi-currency, tax-ready, PDF export — no account needed.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPage("app")} className="pulse-btn" style={{ padding: "16px 36px", background: G.gold, border: "none", borderRadius: 12, color: "#1a1a1a", fontSize: 16, fontWeight: 700, boxShadow: `0 8px 32px ${G.gold}44`, transition: "transform 0.2s" }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
            >
              Create Free Invoice →
            </button>
            <button onClick={() => setPage("pricing")} style={{ padding: "16px 36px", background: "transparent", border: `1px solid ${G.border}`, borderRadius: 12, color: G.text, fontSize: 16, fontWeight: 500, transition: "border-color 0.2s" }}>
              View Pricing
            </button>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: G.muted }}>
            ✓ Free forever plan &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ No signup
          </div>
        </div>
        {/* Floating invoice card */}
        <div className="float fadeUp-2" style={{ maxWidth: 480, margin: "60px auto 0", background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, textAlign: "left", boxShadow: `0 32px 80px #000a` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${G.border}` }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>Alex Johnson</div>
              <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>alex@design.co</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: G.gold, fontWeight: 600 }}>INV-042</div>
              <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>Due: Mar 15, 2026</div>
              <div style={{ display: "inline-block", marginTop: 4, fontSize: 10, background: G.goldDim, color: G.gold, border: `1px solid ${G.goldBorder}`, padding: "2px 8px", borderRadius: 20 }}>↻ Monthly</div>
            </div>
          </div>
          {[["Brand Identity Design", "$2,400.00"], ["Logo Variations", "$800.00"], ["Style Guide", "$600.00"]].map(([d, v]) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: G.subtle }}>{d}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: G.muted }}>Tax (10%) · USD</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: G.gold }}>$4,180.00</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="fadeUp-1" style={{ borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`, padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, textAlign: "center" }}>
          {[["10,000+", "Invoices Created"], ["$2.4M+", "Billed by Users"], ["150+", "Countries"]].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, color: G.gold }}>{num}</div>
              <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Everything You Need</h2>
          <p style={{ color: G.muted, fontSize: 16 }}>No bloated features. Just what freelancers actually use.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, transition: "border-color 0.2s, transform 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G.goldBorder; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 14, color: G.muted, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ padding: "60px 24px 80px", background: G.card, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 40 }}>Loved by Freelancers</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {testimonials.map(({ name, role, text, avatar }) => (
              <div key={name} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{avatar}</div>
                <p style={{ fontSize: 14, color: G.subtle, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>"{text}"</p>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{name}</div>
                <div style={{ fontSize: 12, color: G.muted }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Start Invoicing Today</h2>
        <p style={{ color: G.muted, fontSize: 16, marginBottom: 32 }}>Free forever. Upgrade when you need more.</p>
        <button onClick={() => setPage("app")} style={{ padding: "16px 48px", background: G.gold, border: "none", borderRadius: 12, color: "#1a1a1a", fontSize: 17, fontWeight: 700, boxShadow: `0 8px 32px ${G.gold}44` }}>
          Create Your First Invoice →
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${G.border}`, padding: "24px", textAlign: "center", fontSize: 13, color: G.muted }}>
        © 2026 InvoicePro · Built for Freelancers Worldwide 🌍
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────
function PricingPage({ billingCycle, setBillingCycle, handleCheckout, isPro, setIsPro }) {
  const plans = [
    {
      name: "Free",
      price: { monthly: "$0", yearly: "$0" },
      desc: "Perfect to get started",
      color: G.muted,
      features: ["3 invoices per month", "PDF export", "All currencies", "Tax calculator", "Basic templates"],
      cta: "Get Started Free",
      action: "free",
    },
    {
      name: "Pro",
      price: { monthly: "$9", yearly: "$7" },
      perNote: { monthly: "/month", yearly: "/month, billed $84/yr" },
      desc: "For serious freelancers",
      color: G.gold,
      badge: "MOST POPULAR",
      features: ["Unlimited invoices", "Everything in Free", "Recurring invoices", "Multiple templates", "Priority support", "Remove InvoicePro branding"],
      cta: "Get Pro Now",
      action: "pro",
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>Simple Pricing</h1>
        <p style={{ color: G.muted, fontSize: 16, marginBottom: 32 }}>Start free. Upgrade when you're ready.</p>
        {/* Billing toggle */}
        <div style={{ display: "inline-flex", background: G.card, border: `1px solid ${G.border}`, borderRadius: 50, padding: 4, gap: 4 }}>
          {["monthly", "yearly"].map(c => (
            <button key={c} onClick={() => setBillingCycle(c)} style={{ padding: "8px 24px", borderRadius: 50, border: "none", background: billingCycle === c ? G.gold : "transparent", color: billingCycle === c ? "#1a1a1a" : G.muted, fontSize: 14, fontWeight: 600, transition: "all 0.2s", textTransform: "capitalize" }}>
              {c} {c === "yearly" && <span style={{ fontSize: 11, color: billingCycle === "yearly" ? "#1a1a1a" : G.green }}>Save 22%</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{ background: G.card, border: `2px solid ${plan.action === "pro" ? G.goldBorder : G.border}`, borderRadius: 20, padding: 36, position: "relative", boxShadow: plan.action === "pro" ? `0 0 60px ${G.gold}22` : "none" }}>
            {plan.badge && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: G.gold, color: "#1a1a1a", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, letterSpacing: 1, whiteSpace: "nowrap" }}>{plan.badge}</div>
            )}
            <div style={{ marginBottom: 8, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: plan.color, fontWeight: 500 }}>{plan.name}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{plan.price[billingCycle]}</span>
              {plan.perNote && <span style={{ fontSize: 13, color: G.muted, marginBottom: 8 }}>{plan.perNote[billingCycle]}</span>}
            </div>
            <div style={{ fontSize: 14, color: G.muted, marginBottom: 28 }}>{plan.desc}</div>
            <div style={{ marginBottom: 28 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, color: G.subtle }}>
                  <span style={{ color: plan.action === "pro" ? G.gold : G.green, fontSize: 16 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (plan.action === "pro") handleCheckout(billingCycle);
                else window.location.hash = "#app";
              }}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: plan.action === "pro" ? "none" : `1px solid ${G.border}`, background: plan.action === "pro" ? G.gold : "transparent", color: plan.action === "pro" ? "#1a1a1a" : G.text, fontSize: 15, fontWeight: 700, boxShadow: plan.action === "pro" ? `0 4px 20px ${G.gold}44` : "none", transition: "opacity 0.2s" }}
              onMouseEnter={e => e.target.style.opacity = "0.85"}
              onMouseLeave={e => e.target.style.opacity = "1"}
            >
              {isPro && plan.action === "pro" ? "✓ Current Plan" : plan.cta}
            </button>
            {plan.action === "pro" && (
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: G.muted }}>
                Powered by Lemon Squeezy · Cancel anytime
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 64 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 32 }}>FAQ</h2>
        {[
          ["Do I need to create an account?", "No! Free plan works entirely in your browser. No signup, no email needed."],
          ["How do I pay?", "Via Lemon Squeezy — accepts Visa, Mastercard, PayPal, Apple Pay from any country."],
          ["Can I cancel anytime?", "Yes. Cancel your Pro subscription anytime with one click, no questions asked."],
          ["Is my data safe?", "Free invoices never leave your browser. Pro user data is encrypted and secure."],
          ["What currencies are supported?", "USD, EUR, GBP, INR, PKR, AED, CAD, AUD, JPY, CHF and more."],
        ].map(([q, a]) => (
          <div key={q} style={{ borderBottom: `1px solid ${G.border}`, padding: "20px 0" }}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: 8, fontSize: 15 }}>{q}</div>
            <div style={{ color: G.muted, fontSize: 14, lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </div>

      {/* Developer note */}
      <div style={{ marginTop: 48, background: "#1a1400", border: `1px solid ${G.goldBorder}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, color: G.gold, fontWeight: 600, marginBottom: 8 }}>⚙️ Developer Note</div>
        <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.7 }}>
          Replace <code style={{ background: "#111", padding: "1px 6px", borderRadius: 4, color: G.gold }}>LEMON_SQUEEZY</code> URLs at the top of this file with your actual Lemon Squeezy product checkout links to activate payments.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// INVOICE APP
// ─────────────────────────────────────────────
function InvoiceApp({ isPro, invoicesUsed, onDownload, setShowUpgradeModal }) {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [taxRate, setTaxRate] = useState(10);
  const [recurrence, setRecurrence] = useState("None");
  const [invoiceNum, setInvoiceNum] = useState("INV-001");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [from, setFrom] = useState({ name: "", email: "", address: "", city: "" });
  const [to, setTo] = useState({ name: "", email: "", address: "", city: "" });
  const [items, setItems] = useState([defaultItem()]);
  const [notes, setNotes] = useState("Thank you for your business! Payment due within 14 days.");
  const [activeTab, setActiveTab] = useState("editor");
  const printRef = useRef();

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  const fmt = (n) => `${currency.symbol}${Number(n).toFixed(2)}`;
  const remaining = FREE_INVOICE_LIMIT - invoicesUsed;

  const addItem = () => setItems([...items, defaultItem()]);
  const removeItem = (id) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id, key, val) => setItems(items.map((i) => (i.id === id ? { ...i, [key]: val } : i)));

  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    const allowed = onDownload();
    if (!allowed) return;
    setIsGenerating(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${invoiceNum || "invoice"}.pdf`);
    } catch (err) { console.error("PDF error:", err); }
    setIsGenerating(false);
  };

  const inputStyle = { width: "100%", background: G.input, border: `1px solid ${G.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: G.text, fontSize: 14, transition: "border-color 0.2s" };
  const labelStyle = { fontSize: 11, color: G.muted, marginBottom: 6, display: "block", letterSpacing: 1, textTransform: "uppercase" };
  const sectionStyle = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 };
  const sectionTitle = { fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: G.gold, marginBottom: 20, fontWeight: 500 };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>Invoice Creator</h1>
          {!isPro && (
            <div style={{ fontSize: 13, color: remaining > 0 ? G.muted : G.red, marginTop: 4 }}>
              {remaining > 0 ? `${remaining} free invoice${remaining > 1 ? "s" : ""} remaining` : "⚠️ Free limit reached — upgrade for unlimited"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["editor", "preview"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 20px", borderRadius: 9, border: `1px solid ${activeTab === t ? G.goldBorder : G.border}`, background: activeTab === t ? G.goldDim : "transparent", color: activeTab === t ? G.gold : G.muted, fontSize: 13, fontWeight: 500, transition: "all 0.2s" }}>
              {t === "editor" ? "✏️ Editor" : "👁 Preview"}
            </button>
          ))}
          <button onClick={handlePrint} disabled={isGenerating} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: isGenerating ? "#b8863c" : G.gold, color: "#1a1a1a", fontSize: 14, fontWeight: 700, boxShadow: `0 4px 16px ${G.gold}33`, opacity: isGenerating ? 0.8 : 1 }}>
            {isGenerating ? "⏳ Generating..." : "↓ Download PDF"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: activeTab === "editor" ? "1fr 1fr" : "1fr", gap: 24 }} className={activeTab === "editor" ? "mobile-grid-1" : ""}>
        {/* Editor */}
        {activeTab === "editor" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Settings */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>⚙️ Invoice Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="mobile-grid-1">
                {[
                  ["INVOICE #", <input value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} style={inputStyle} />],
                  ["CURRENCY", <select value={currency.code} onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value))} style={inputStyle}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) — {c.name}</option>)}</select>],
                  ["ISSUE DATE", <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} />],
                  ["DUE DATE", <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />],
                  ["TAX RATE (%)", <input type="number" value={taxRate} min={0} max={100} onChange={e => setTaxRate(Number(e.target.value))} style={inputStyle} />],
                  ["RECURRING ↻", <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={inputStyle}>{RECURRENCE.map(r => <option key={r}>{r}</option>)}</select>],
                ].map(([label, field]) => (
                  <div key={label}><label style={labelStyle}>{label}</label>{field}</div>
                ))}
              </div>
            </div>

            {/* From / To */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="mobile-grid-1">
              {[["FROM (YOU)", from, setFrom], ["BILL TO", to, setTo]].map(([label, data, setter]) => (
                <div key={label} style={sectionStyle}>
                  <div style={sectionTitle}>{label}</div>
                  {["name", "email", "address", "city"].map(f => (
                    <div key={f} style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>{f}</label>
                      <input value={data[f]} onChange={e => setter({ ...data, [f]: e.target.value })} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} style={inputStyle} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Line Items */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>📋 Line Items</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 36px", gap: 8, marginBottom: 10 }}>
                {["Description", "Qty", "Rate", ""].map(h => <div key={h} style={{ fontSize: 11, color: G.muted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</div>)}
              </div>
              {items.map(item => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 36px", gap: 8, marginBottom: 8 }}>
                  <input value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} placeholder="Service description" style={{ ...inputStyle, padding: "9px 12px" }} />
                  <input type="number" value={item.qty} min={1} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} style={{ ...inputStyle, padding: "9px 8px", textAlign: "center" }} />
                  <input type="number" value={item.rate} min={0} onChange={e => updateItem(item.id, "rate", Number(e.target.value))} style={{ ...inputStyle, padding: "9px 10px" }} />
                  <button onClick={() => removeItem(item.id)} style={{ background: "#200f0f", border: `1px solid #3a2020`, borderRadius: 9, color: G.red, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
              <button onClick={addItem} style={{ marginTop: 8, padding: "10px", background: "transparent", border: `1px dashed ${G.border}`, borderRadius: 9, color: G.muted, fontSize: 13, width: "100%", transition: "all 0.2s" }}
                onMouseEnter={e => { e.target.style.borderColor = G.goldBorder; e.target.style.color = G.gold; }}
                onMouseLeave={e => { e.target.style.borderColor = G.border; e.target.style.color = G.muted; }}>
                + Add Line Item
              </button>
              <div style={{ marginTop: 24, borderTop: `1px solid ${G.border}`, paddingTop: 20 }}>
                {[["Subtotal", fmt(subtotal)], [`Tax (${taxRate}%)`, fmt(taxAmount)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: G.muted }}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${G.goldBorder}`, fontSize: 24, fontWeight: 700 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", color: "#fff" }}>Total</span>
                  <span style={{ color: G.gold }}>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>📝 Notes / Terms</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* Preview */}
        <div>
          {activeTab === "preview" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button onClick={handlePrint} disabled={isGenerating} style={{ padding: "12px 32px", background: isGenerating ? "#b8863c" : G.gold, border: "none", borderRadius: 12, color: "#1a1a1a", fontSize: 15, fontWeight: 700 }}>{isGenerating ? "⏳ Generating..." : "↓ Download PDF"}</button>
            </div>
          )}
          <div ref={printRef} style={{ background: "#fff", borderRadius: 16, padding: "clamp(24px, 4vw, 48px)", boxShadow: `0 0 60px ${G.gold}18`, color: "#1a1a1a", fontFamily: "'Outfit', sans-serif" }}>
            {/* Preview header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, paddingBottom: 28, borderBottom: "3px solid #D4A84B", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700 }}>{from.name || "Your Name"}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{from.email}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{from.address}{from.city ? ", " + from.city : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#D4A84B", fontWeight: 600 }}>{invoiceNum}</div>
                {recurrence !== "None" && <div style={{ display: "inline-block", background: "#D4A84B18", color: "#D4A84B", border: "1px solid #D4A84B", padding: "2px 10px", borderRadius: 20, fontSize: 11, marginTop: 4 }}>↻ {recurrence}</div>}
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Issued: {issueDate}</div>
                {dueDate && <div style={{ fontSize: 12, color: "#888" }}>Due: {dueDate}</div>}
              </div>
            </div>
            {/* Parties */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 36 }}>
              {[["FROM", from], ["BILL TO", to]].map(([l, d]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#D4A84B", fontWeight: 600, marginBottom: 8 }}>{l}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>{d.name || "—"}</div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 2 }}>{d.email}</div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 2 }}>{d.address}</div>
                  <div style={{ fontSize: 13, color: "#777" }}>{d.city}</div>
                </div>
              ))}
            </div>
            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28 }}>
              <thead>
                <tr>{["Description", "Qty", "Rate", "Amount"].map((h, i) => (
                  <th key={h} style={{ background: "#1a1a1a", color: "#fff", padding: "11px 14px", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", textAlign: i === 0 ? "left" : i === 1 ? "center" : "right", fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", fontSize: 14, background: idx % 2 ? "#fafafa" : "#fff" }}>{item.desc || "—"}</td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", fontSize: 14, textAlign: "center", background: idx % 2 ? "#fafafa" : "#fff" }}>{item.qty}</td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", fontSize: 14, textAlign: "right", background: idx % 2 ? "#fafafa" : "#fff" }}>{fmt(item.rate)}</td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", fontSize: 14, textAlign: "right", fontWeight: 600, background: idx % 2 ? "#fafafa" : "#fff" }}>{fmt(item.qty * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div style={{ marginLeft: "auto", width: "min(280px, 100%)" }}>
              {[["Subtotal", fmt(subtotal)], [`Tax (${taxRate}%)`, fmt(taxAmount)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 14, borderBottom: "1px solid #f0f0f0", color: "#666" }}><span>{l}</span><span>{v}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", fontSize: 22, fontWeight: 700, borderTop: "2px solid #D4A84B" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif" }}>Total</span>
                <span style={{ color: "#D4A84B" }}>{fmt(total)}</span>
              </div>
            </div>
            {notes && (
              <div style={{ marginTop: 36, padding: "18px 20px", background: "#fafafa", borderLeft: "3px solid #D4A84B", fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                <strong style={{ color: "#1a1a1a", display: "block", marginBottom: 6 }}>Notes & Terms</strong>{notes}
              </div>
            )}
            <div style={{ marginTop: 36, textAlign: "center", fontSize: 11, color: "#ccc", paddingTop: 16, borderTop: "1px solid #eee" }}>
              Generated with InvoicePro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADE MODAL
// ─────────────────────────────────────────────
function UpgradeModal({ onClose, handleCheckout, setPage }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: G.card, border: `1px solid ${G.goldBorder}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%", boxShadow: `0 0 80px ${G.gold}22`, textAlign: "center", animation: "fadeUp 0.3s ease" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8 }}>You've hit the free limit</h2>
        <p style={{ color: G.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          Free plan allows {FREE_INVOICE_LIMIT} invoices per session. Upgrade to Pro for <strong style={{ color: G.gold }}>unlimited invoices</strong> and more.
        </p>
        <button onClick={() => handleCheckout("monthly")} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: G.gold, color: "#1a1a1a", fontSize: 16, fontWeight: 700, marginBottom: 12, boxShadow: `0 4px 20px ${G.gold}44` }}>
          Upgrade to Pro — $9/month →
        </button>
        <button onClick={() => { setPage("pricing"); onClose(); }} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${G.border}`, background: "transparent", color: G.subtle, fontSize: 14, marginBottom: 12 }}>
          View All Plans
        </button>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: G.muted, fontSize: 13, cursor: "pointer" }}>Maybe later</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUCCESS TOAST
// ─────────────────────────────────────────────
function SuccessToast() {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0f1f0f", border: `1px solid ${G.green}44`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 999, animation: "fadeUp 0.3s ease", boxShadow: "0 8px 32px #000a" }}>
      <span style={{ fontSize: 20 }}>✅</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Invoice ready!</div>
        <div style={{ fontSize: 12, color: G.muted }}>Your PDF is being prepared...</div>
      </div>
    </div>
  );
}
