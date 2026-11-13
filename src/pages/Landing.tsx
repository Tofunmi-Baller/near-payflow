import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FileText, Share2, CreditCard, Zap, ArrowRight, Github, ChevronRight } from "lucide-react";
import "./landing.css";

const HERO_INVOICE_ID = "hero_invoice_1";

// ── Hooks ────────────────────────────────────────────────

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return ref;
}

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { value, ref: elRef };
}

// ── Landing Page ─────────────────────────────────────────

export default function Landing() {
  const revealRef = useScrollReveal();

  return (
    <div
      ref={revealRef}
      className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden"
      style={{ scrollBehavior: "smooth" }}
    >
      <GradientMesh />
      <Navbar />
      <Hero />
      <FlowDiagram />
      <Comparison />
      <HowItWorks />
      <Stats />
      <DemoLogin />
      <Footer />
    </div>
  );
}

// ── Gradient Mesh Background ─────────────────────────────

function GradientMesh() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="blob-1 absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
      <div className="blob-2 absolute -top-1/3 -right-1/4 w-[700px] h-[700px] rounded-full bg-violet-500/[0.06] blur-[120px]" />
      <div className="blob-3 absolute -bottom-1/4 left-1/3 w-[900px] h-[900px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,#0a0a0f_70%)]" />
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-bold">
            Pay<span className="text-indigo-400">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Tofunmi-Baller/near-payflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <Link
            to="/app"
            className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            Open Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center px-6 pt-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="hero-enter inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-300 text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          NEAR Hackathon 2026 · Real-World Money
        </div>

        <h1 className="hero-enter hero-enter-delay-1 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Invoice in dollars.
          <br />
          <span className="gradient-text">Settle in seconds.</span>
        </h1>

        <p className="hero-enter hero-enter-delay-2 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Freelancers create invoices. Clients pay in any crypto token.
          <br className="hidden sm:block" />
          NEAR Intents routes it all to USDC — <span className="text-emerald-400 font-medium">instantly</span>.
        </p>

        <div className="hero-enter hero-enter-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            to="/app"
            className="cta-glow group relative bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all flex items-center gap-2"
          >
            Open Live Demo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to={`/pay/${HERO_INVOICE_ID}`}
            className="group border border-white/20 hover:border-white/40 hover:bg-white/[0.04] text-white font-medium text-lg px-8 py-4 rounded-xl transition-all flex items-center gap-2"
          >
            Pay a Sample Invoice
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="hero-enter hero-enter-delay-3 text-sm text-gray-500">
          No signup required · Demo data pre-loaded
        </p>

        {/* Floating mock invoice card */}
        <div className="mt-16 relative">
          <div className="float-1 max-w-md mx-auto bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 text-left shadow-2xl shadow-indigo-500/[0.05]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Invoice</p>
                <p className="text-sm font-mono text-gray-300">INV-0038</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                Pending
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500">Northwind Labs</p>
                <p className="text-2xl font-bold tabular-nums text-white mt-0.5">$4,800.00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Due in 5 days</p>
                <p className="text-xs text-emerald-400 mt-1">→ mayachen.near</p>
              </div>
            </div>
          </div>
          {/* Decorative token pills floating around the card */}
          <div className="absolute top-4 -left-4 sm:left-8 float-2">
            <TokenPill symbol="ETH" color="#627EEA" />
          </div>
          <div className="absolute -top-2 -right-2 sm:right-12 float-3">
            <TokenPill symbol="NEAR" color="#000" border />
          </div>
          <div className="absolute bottom-4 -right-4 sm:right-4 float-1">
            <TokenPill symbol="BTC" color="#F7931A" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
        <span className="text-xs">Scroll</span>
        <div className="w-5 h-8 border border-gray-600 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-gray-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function TokenPill({ symbol, color, border }: { symbol: string; color: string; border?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${
        border ? "border border-white/20 bg-white/[0.06]" : "bg-white/[0.06]"
      }`}
    >
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-gray-300">{symbol}</span>
    </div>
  );
}

// ── Flow Diagram ─────────────────────────────────────────

function FlowDiagram() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div data-reveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            From invoice to <span className="text-indigo-400">settlement</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            One flow. Any token. Instant finality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-0 relative">
          {/* Connecting lines (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[33%] right-[33%] h-px -translate-y-1/2">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-emerald-500/40" />
            <div className="flow-particle absolute top-0 left-0 w-2 h-2 bg-indigo-400 rounded-full -translate-y-1/2" />
            <div className="flow-particle absolute top-0 left-0 w-2 h-2 bg-violet-400 rounded-full -translate-y-1/2" />
            <div className="flow-particle absolute top-0 left-0 w-2 h-2 bg-emerald-400 rounded-full -translate-y-1/2" />
          </div>

          <FlowStep
            delay="1"
            number="01"
            title="Create Invoice"
            description="Professional invoice with line items, tax, and terms"
          >
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Frontend dev · 40h</span>
                <span className="tabular-nums text-gray-300">$6,000</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>API integration · 20h</span>
                <span className="tabular-nums text-gray-300">$3,000</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2 flex justify-between font-medium text-white">
                <span>Total</span>
                <span className="tabular-nums">$9,000</span>
              </div>
            </div>
          </FlowStep>

          <FlowStep
            delay="2"
            number="02"
            title="Client Pays Any Token"
            description="NEAR, ETH, BTC — clients choose their wallet"
          >
            <div className="mt-4 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300">
                    PAY
                  </div>
                </div>
                <div className="orbit-1 absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#627EEA] flex items-center justify-center text-[8px] font-bold">E</div>
                </div>
                <div className="orbit-2 absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#F7931A] flex items-center justify-center text-[8px] font-bold">B</div>
                </div>
                <div className="orbit-3 absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/90 text-black flex items-center justify-center text-[8px] font-bold">N</div>
                </div>
              </div>
            </div>
          </FlowStep>

          <FlowStep
            delay="3"
            number="03"
            title="USDC Arrives Instantly"
            description="Settled to your wallet via NEAR Intents"
          >
            <div className="mt-4 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg p-3 text-center">
              <p className="text-emerald-400 text-xs font-medium mb-1">Settled</p>
              <p className="text-xl font-bold tabular-nums text-white">$9,000.00</p>
              <p className="text-[11px] text-emerald-400/70 mt-1">USDC · 23 seconds · $0.10 fee</p>
            </div>
          </FlowStep>
        </div>
      </div>
    </section>
  );
}

function FlowStep({
  delay,
  number,
  title,
  description,
  children,
}: {
  delay: string;
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div data-reveal={delay} className="relative z-10 px-4">
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] rounded-2xl p-6 h-full">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 mb-4 step-pulse">
          {number}
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
        {children}
      </div>
    </div>
  );
}

// ── Comparison ───────────────────────────────────────────

function Comparison() {
  const settleCounter = useCountUp(23, 1200);
  const feeCounter = useCountUp(10, 1200);

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <div data-reveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why this <span className="text-emerald-400">matters</span>
          </h2>
          <p className="text-gray-400">
            Cross-border freelancer payments are broken. We fixed them.
          </p>
        </div>

        <div className="space-y-4">
          {/* Wire Transfer */}
          <div data-reveal="1" className="relative overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Wire Transfer</p>
                <p className="text-xl font-bold text-gray-400 mt-1">3–5 business days</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums text-gray-500">$25–45</span>
                <span className="text-sm text-gray-600 ml-1">per transfer</span>
              </div>
            </div>
          </div>

          {/* Credit Card */}
          <div data-reveal="2" className="relative overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-amber-500/70 text-sm font-medium uppercase tracking-wider">Credit Card</p>
                <p className="text-xl font-bold text-gray-300 mt-1">2–3 business days</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums text-amber-400/70">2.9%</span>
                <span className="text-sm text-gray-500 ml-1">+ $0.30</span>
              </div>
            </div>
          </div>

          {/* PayFlow */}
          <div data-reveal="3" className="row-glow relative overflow-hidden bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-6 shimmer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-indigo-400 text-sm font-medium uppercase tracking-wider">PayFlow</p>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                    Instant
                  </span>
                </div>
                <p className="text-xl font-bold text-white mt-1">
                  ~<span ref={settleCounter.ref} className="tabular-nums">{settleCounter.value}</span> seconds
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums text-emerald-400">
                  $0.<span>{feeCounter.value.toString().padStart(2, "0")}</span>
                </span>
                <span className="text-sm text-indigo-300 ml-1">avg fee</span>
              </div>
            </div>
          </div>
        </div>

        <div data-reveal="4" className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            On a $10,000 invoice, you save <span className="text-emerald-400 font-semibold">$285+</span> vs credit cards
          </p>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────

const steps = [
  {
    icon: FileText,
    title: "Create",
    description: "Build a professional invoice with line items, tax, and payment terms. Takes under a minute.",
    accent: "indigo",
  },
  {
    icon: Share2,
    title: "Share",
    description: "Send a payment link to your client via email, Slack, or any channel. They don't need an account.",
    accent: "violet",
  },
  {
    icon: CreditCard,
    title: "Pay",
    description: "Your client pays with any token — NEAR, ETH, BTC, or stablecoins. NEAR Intents handles the swap.",
    accent: "blue",
  },
  {
    icon: Zap,
    title: "Settle",
    description: "You receive USDC in your wallet. ~23 seconds. ~$0.10. No intermediaries, no delays.",
    accent: "emerald",
  },
] as const;

const accentMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400", glow: "shadow-indigo-500/10" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", glow: "shadow-violet-500/10" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", glow: "shadow-blue-500/10" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
};

function HowItWorks() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div data-reveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Four steps. <span className="text-indigo-400">Zero friction.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const a = accentMap[step.accent];
            return (
              <div
                key={step.title}
                data-reveal={String(i + 1)}
                className={`relative group ${a.bg} border ${a.border} rounded-2xl p-6 transition-all hover:shadow-xl hover:${a.glow} hover:-translate-y-1`}
              >
                <div
                  className={`w-12 h-12 ${a.bg} border ${a.border} rounded-xl flex items-center justify-center mb-4`}
                >
                  <step.icon className={`w-6 h-6 ${a.text}`} />
                </div>
                <div className={`text-xs font-bold ${a.text} uppercase tracking-wider mb-2`}>
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────

function Stats() {
  const tokens = useCountUp(5, 1000);
  const settle = useCountUp(23, 1200);
  const fee = useCountUp(10, 1000);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div data-reveal className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <NearLogo />
            <span className="text-lg font-semibold text-gray-300">Built on NEAR Protocol</span>
          </div>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Powered by NEAR Intents for cross-chain token routing and instant stablecoin settlement
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox
            label="Tokens Supported"
            suffix="+"
            refEl={tokens.ref}
            value={tokens.value}
          />
          <StatBox
            prefix="~"
            label="Avg Settlement"
            suffix="s"
            refEl={settle.ref}
            value={settle.value}
          />
          <StatBox
            prefix="$0."
            label="Avg Fee"
            refEl={fee.ref}
            value={fee.value}
            pad
          />
          <StatBox label="Finality" staticValue="Instant" />
        </div>
      </div>
    </section>
  );
}

function StatBox({
  label,
  value,
  prefix,
  suffix,
  staticValue,
  refEl,
  pad,
}: {
  label: string;
  value?: number;
  prefix?: string;
  suffix?: string;
  staticValue?: string;
  refEl?: React.RefObject<HTMLSpanElement | null>;
  pad?: boolean;
}) {
  return (
    <div data-reveal className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
      <p className="text-3xl font-bold tabular-nums text-white mb-1">
        {staticValue ?? (
          <>
            {prefix}
            <span ref={refEl}>{pad ? String(value).padStart(2, "0") : value}</span>
            {suffix}
          </>
        )}
      </p>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function NearLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.1" />
      <path
        d="M21.5 10L18.1 15.1C17.9 15.4 18.3 15.7 18.5 15.4L21.9 10.3C22 10.1 22.3 10.2 22.3 10.4V21.5C22.3 21.7 22 21.8 21.9 21.6L11.1 10.2C10.8 9.8 10.3 9.6 9.7 9.6H9.5C8.7 9.6 8 10.3 8 11.1V21C8 21.8 8.7 22.5 9.5 22.5C10 22.5 10.4 22.2 10.7 21.8L14.1 16.7C14.3 16.4 13.9 16.1 13.7 16.4L10.3 21.5C10.2 21.7 9.9 21.6 9.9 21.4V10.3C9.9 10.1 10.2 10 10.3 10.2L21.1 21.6C21.4 22 21.9 22.2 22.5 22.2H22.7C23.5 22.2 24.2 21.5 24.2 20.7V10.8C24.2 10 23.5 9.3 22.7 9.3C22.2 9.3 21.7 9.6 21.5 10Z"
        fill="white"
        fillOpacity="0.7"
      />
    </svg>
  );
}

// ── Demo Login ───────────────────────────────────────────

function DemoLogin() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-lg mx-auto">
        <div
          data-reveal
          className="relative overflow-hidden bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center shimmer"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl font-bold text-indigo-300">MC</span>
            </div>

            <h2 className="text-2xl font-bold mb-2">See it in action</h2>
            <p className="text-gray-400 text-sm mb-6">
              Jump into a fully populated demo account.
              <br />
              42 invoices, 8 clients, 12 months of data.
            </p>

            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Demo Account</p>
              <p className="font-semibold text-white">Maya Chen Studio</p>
              <p className="text-sm text-gray-400">maya@mayachen.studio</p>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                mayachen.near · USDC
              </div>
            </div>

            <Link
              to="/app"
              className="cta-glow group inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-lg w-full justify-center"
            >
              Enter Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to={`/pay/${HERO_INVOICE_ID}`}
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mt-4"
            >
              Or pay a sample invoice
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">P</span>
            </div>
            <span className="text-sm font-semibold text-gray-400">
              PayFlow
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-500">
              NEAR Hackathon 2026, Track 08
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a
              href="https://github.com/Tofunmi-Baller/near-payflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              Source
            </a>
            <span className="text-gray-700">|</span>
            <span>Demo mode · Testnet simulation</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-gray-600">
            Built with NEAR Intents · Chain Signatures · Stablecoin Infrastructure
          </p>
        </div>
      </div>
    </footer>
  );
}
