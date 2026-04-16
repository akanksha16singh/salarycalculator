import { useState, useMemo, useEffect, useRef } from "react";

const SPJIMR_DATA = {
  overall: {
    average: 33.75,
    median: 32.85,
    highest: 75,
    top20: 45,
    top50: 35,
  },
  domains: {
    Consulting: { average: 38, median: 36, top20: 52, top50: 40, pct: 40, growth: 14, companies: ["BCG", "Accenture Strategy", "Deloitte", "KPMG", "EY Parthenon", "PwC", "Kearney"] },
    FMCG: { average: 30, median: 28, top20: 42, top50: 33, pct: 17, growth: 12, companies: ["HUL", "P&G", "Nestlé", "ITC", "Marico", "Mondelez", "L'Oréal", "Colgate"] },
    "BFSI / IB / PE": { average: 35, median: 33, top20: 55, top50: 40, pct: 15, growth: 16, companies: ["Goldman Sachs", "Morgan Stanley", "Barclays", "HSBC", "Nomura", "Kotak", "Axis Bank"] },
    "Tech / Product": { average: 32, median: 30, top20: 48, top50: 36, pct: 12, growth: 18, companies: ["Amazon", "Google", "American Express", "MakeMyTrip", "Flipkart"] },
    "General Mgmt": { average: 28, median: 26, top20: 38, top50: 30, pct: 10, growth: 11, companies: ["Aditya Birla", "TAS", "Mahindra", "RPG", "Reliance"] },
    "E-Commerce": { average: 29, median: 27, top20: 40, top50: 32, pct: 6, growth: 20, companies: ["Amazon", "Flipkart", "Zomato", "Purplle"] },
  },
  companyTypes: {
    // Percentages sum to ~93%, leaving ~7% for employer EPF + gratuity (computed separately)
    "MNC (Top Tier)":      { multiplier: 1.25, basicPct: 0.35, hraPct: 0.17, bonusPct: 0.15, esopPct: 0.12, otherPct: 0.14 },
    "MNC (Mid Tier)":      { multiplier: 1.10, basicPct: 0.38, hraPct: 0.19, bonusPct: 0.12, esopPct: 0.05, otherPct: 0.19 },
    "Indian Conglomerate": { multiplier: 1.0,  basicPct: 0.40, hraPct: 0.20, bonusPct: 0.12, esopPct: 0.03, otherPct: 0.18 },
    "Startup / Unicorn":   { multiplier: 0.95, basicPct: 0.35, hraPct: 0.17, bonusPct: 0.10, esopPct: 0.20, otherPct: 0.11 },
    "PSU / Government":    { multiplier: 0.75, basicPct: 0.45, hraPct: 0.22, bonusPct: 0.08, esopPct: 0.0,  otherPct: 0.18 },
  },
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0d0d0d",
    bgCard: "rgba(255,255,255,0.03)",
    bgInput: "rgba(255,255,255,0.06)",
    bgTab: "rgba(255,255,255,0.04)",
    bgTabActive: "rgba(232,167,88,0.15)",
    bgToggle: "rgba(255,255,255,0.15)",
    border: "rgba(255,255,255,0.06)",
    borderInput: "rgba(232,167,88,0.3)",
    text: "#f0ece4",
    textMuted: "rgba(255,255,255,0.5)",
    textFaint: "rgba(255,255,255,0.3)",
    textFaintest: "rgba(255,255,255,0.2)",
    textLabel: "rgba(255,255,255,0.35)",
    accent: "#E8A758",
    accentGreen: "#7DD3A0",
    accentBlue: "#6BB8E8",
    accentPurple: "#C490D1",
    accentRed: "#E87272",
    deductionText: "rgba(255,72,72,0.6)",
    deductionVal: "rgba(255,72,72,0.5)",
    deductionMuted: "rgba(255,72,72,0.3)",
    canvasGrid: "rgba(255,255,255,0.06)",
    canvasLabel: "rgba(255,255,255,0.4)",
    canvasDotStroke: "#1a1a1a",
    scrollThumb: "rgba(232,167,88,0.3)",
    benchmarkBg: "rgba(255,255,255,0.04)",
    benchmarkBorder: "rgba(255,255,255,0.06)",
    rowBorder: "rgba(255,255,255,0.04)",
    divider: "rgba(255,255,255,0.04)",
    barTrack: "rgba(255,255,255,0.06)",
    barInactive: "rgba(255,255,255,0.15)",
    projRowHighlight: "rgba(232,167,88,0.05)",
    projRowBorder: "rgba(255,255,255,0.03)",
    noteBox: "rgba(232,167,88,0.05)",
    noteBorder: "rgba(232,167,88,0.1)",
    tagBg: "rgba(232,167,88,0.08)",
    tagBorder: "rgba(232,167,88,0.15)",
    tagText: "rgba(255,255,255,0.6)",
    footerText: "rgba(255,255,255,0.2)",
    logoGradient: "linear-gradient(135deg, #E8A758, #D4923A)",
    logoText: "#0d0d0d",
    sectionLabel: "rgba(255,255,255,0.25)",
    greyComponent: "#888",
    cardBg: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    cardShadow: "none",
  },
  light: {
    bg: "#f5f3ef",
    bgCard: "#ffffff",
    bgInput: "#ffffff",
    bgTab: "rgba(0,0,0,0.04)",
    bgTabActive: "rgba(205,133,50,0.12)",
    bgToggle: "rgba(0,0,0,0.12)",
    border: "rgba(0,0,0,0.08)",
    borderInput: "rgba(205,133,50,0.5)",
    text: "#1a1714",
    textMuted: "rgba(0,0,0,0.55)",
    textFaint: "rgba(0,0,0,0.38)",
    textFaintest: "rgba(0,0,0,0.28)",
    textLabel: "rgba(0,0,0,0.45)",
    accent: "#C47C1A",
    accentGreen: "#2E8B57",
    accentBlue: "#2B6CB0",
    accentPurple: "#7B3FA0",
    accentRed: "#C53030",
    deductionText: "rgba(180,40,40,0.8)",
    deductionVal: "rgba(180,40,40,0.65)",
    deductionMuted: "rgba(180,40,40,0.45)",
    canvasGrid: "rgba(0,0,0,0.07)",
    canvasLabel: "rgba(0,0,0,0.45)",
    canvasDotStroke: "#f5f3ef",
    scrollThumb: "rgba(205,133,50,0.4)",
    benchmarkBg: "rgba(0,0,0,0.025)",
    benchmarkBorder: "rgba(0,0,0,0.07)",
    rowBorder: "rgba(0,0,0,0.05)",
    divider: "rgba(0,0,0,0.06)",
    barTrack: "rgba(0,0,0,0.07)",
    barInactive: "rgba(0,0,0,0.12)",
    projRowHighlight: "rgba(205,133,50,0.07)",
    projRowBorder: "rgba(0,0,0,0.04)",
    noteBox: "rgba(205,133,50,0.07)",
    noteBorder: "rgba(205,133,50,0.2)",
    tagBg: "rgba(205,133,50,0.1)",
    tagBorder: "rgba(205,133,50,0.25)",
    tagText: "rgba(0,0,0,0.65)",
    footerText: "rgba(0,0,0,0.3)",
    logoGradient: "linear-gradient(135deg, #C47C1A, #A86010)",
    logoText: "#ffffff",
    sectionLabel: "rgba(0,0,0,0.3)",
    greyComponent: "#999",
    cardBg: "#ffffff",
    cardShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
};

// ─── Tax calculator (New Regime FY 2025-26) ───────────────────────────────────
// grossCTC and employerEPF in LPA
function calcTax(grossCTC, employerEPF) {
  const std = 0.75; // standard deduction ₹75,000
  // Employer EPF is not part of taxable salary
  const taxable = Math.max(0, grossCTC - employerEPF - std);

  const slabs = [
    { upto: 4,        rate: 0    },
    { upto: 8,        rate: 0.05 },
    { upto: 12,       rate: 0.10 },
    { upto: 16,       rate: 0.15 },
    { upto: 20,       rate: 0.20 },
    { upto: 24,       rate: 0.25 },
    { upto: Infinity, rate: 0.30 },
  ];

  let tax = 0, prev = 0, remaining = taxable;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const width = slab.upto - prev;
    const amt = Math.min(remaining, width);
    tax += amt * slab.rate;
    remaining -= amt;
    prev = slab.upto;
  }

  // Section 87A rebate: full rebate if taxable income ≤ 12L
  if (taxable <= 12) tax = 0;
  return tax + tax * 0.04; // 4% Health & Education Cess
}

function fmtMonthly(lpa) {
  const monthly = (lpa * 100000) / 12;
  if (monthly >= 100000) return `₹${(monthly / 100000).toFixed(2)}L`;
  return `₹${Math.round(monthly).toLocaleString("en-IN")}`;
}
function fmtLakhs(val) { return `₹${val.toFixed(2)}L`; }

const FONT = `'Playfair Display', Georgia, serif`;
const SANS = `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`;

// ─── Theme toggle button ──────────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle, T }) {
  return (
    <button onClick={onToggle} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{ width: 40, height: 40, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: T.accent, fontSize: 18, transition: "all 0.2s", flexShrink: 0 }}>
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SPJIMRSalaryCalculator() {
  const [isDark, setIsDark] = useState(true);
  const [ctc, setCtc] = useState("");
  const [domain, setDomain] = useState("Consulting");
  const [companyType, setCompanyType] = useState("MNC (Top Tier)");
  const [activeTab, setActiveTab] = useState("breakdown");
  const [showProjection, setShowProjection] = useState(false);
  const [metro, setMetro] = useState(true);
  const canvasRef = useRef(null);

  const T = THEMES[isDark ? "dark" : "light"];
  const ctcNum = parseFloat(ctc) || SPJIMR_DATA.overall.average;
  const domainData = SPJIMR_DATA.domains[domain];
  const compData = SPJIMR_DATA.companyTypes[companyType];

  // ── Breakdown ─────────────────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const annual = ctcNum;
    const basic    = annual * compData.basicPct;
    const hra      = annual * compData.hraPct;
    const bonus    = annual * compData.bonusPct;
    const esop     = annual * compData.esopPct;
    const other    = annual * compData.otherPct;

    // EPF: both sides capped at ₹21,600/yr = 0.216 LPA → use 1.8 cap (₹1,800/mo)
    const employerEPF = Math.min(basic * 0.12, 1.8);
    const employeeEPF = Math.min(basic * 0.12, 1.8);

    // Gratuity: 4.81% of basic — part of CTC, paid after 5 yrs
    const gratuity = basic * 0.0481;

    // Cash salary actually credited = CTC − Employer EPF − Gratuity − ESOP (non-cash)
    const grossCashSalary = annual - employerEPF - gratuity - esop;

    // Tax on full CTC (employer EPF excluded from taxable base)
    const tax = calcTax(annual, employerEPF);

    const profTax = 0.024; // Professional tax ₹2,400/yr (Maharashtra)

    // Annual in-hand = gross cash − employee EPF − tax − prof tax
    const inHand = grossCashSalary - employeeEPF - tax - profTax;

    const annualBonus  = bonus;
    const fixedMonthly = (inHand - annualBonus) / 12;
    const monthly      = inHand / 12;
    const totalDeductions = tax + employeeEPF + profTax;

    return {
      annual, basic, hra, bonus, esop, other,
      employerEPF, employeeEPF, gratuity,
      grossCashSalary, tax, profTax,
      totalDeductions, inHand, monthly, fixedMonthly, annualBonus,
    };
  }, [ctcNum, compData]);

  // ── Projections ───────────────────────────────────────────────────────────
  const projections = useMemo(() => {
    const years = [];
    const baseGrowth = domainData.growth / 100;
    for (let y = 0; y <= 10; y++) {
      const growthRate = y <= 3 ? baseGrowth : y <= 6 ? baseGrowth * 0.85 : baseGrowth * 0.7;
      const c = y === 0 ? ctcNum : years[y - 1].ctc * (1 + growthRate);
      const basic       = c * compData.basicPct;
      const employerEPF = Math.min(basic * 0.12, 1.8);
      const employeeEPF = Math.min(basic * 0.12, 1.8);
      const gratuity    = basic * 0.0481;
      const esop        = c * compData.esopPct;
      const tax         = calcTax(c, employerEPF);
      const profTax     = 0.024;
      const grossCash   = c - employerEPF - gratuity - esop;
      const inHand      = grossCash - employeeEPF - tax - profTax;
      years.push({ year: y, ctc: c, tax, inHand, monthly: inHand / 12 });
    }
    return years;
  }, [ctcNum, domainData, compData]);

  // ── Canvas chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showProjection) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 40, right: 30, bottom: 50, left: 60 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const maxY = Math.ceil(Math.max(...projections.map(p => p.ctc)) / 10) * 10;

    ctx.strokeStyle = T.canvasGrid; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (cH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }
    ctx.fillStyle = T.canvasLabel; ctx.font = `11px ${SANS}`; ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = maxY - (maxY / 5) * i;
      ctx.fillText(`₹${val.toFixed(0)}L`, pad.left - 8, pad.top + (cH / 5) * i + 4);
    }
    ctx.textAlign = "center";
    projections.forEach((p, i) => ctx.fillText(`Y${p.year}`, pad.left + (cW / 10) * i, H - pad.bottom + 20));

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, isDark ? "rgba(232,167,88,0.3)" : "rgba(196,124,26,0.25)");
    grad.addColorStop(1, isDark ? "rgba(232,167,88,0.01)" : "rgba(196,124,26,0.01)");
    ctx.beginPath();
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.ctc / maxY) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cW, pad.top + cH); ctx.lineTo(pad.left, pad.top + cH);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle = T.accent; ctx.lineWidth = 2.5;
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.ctc / maxY) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }); ctx.stroke();

    ctx.beginPath(); ctx.strokeStyle = T.accentGreen; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.inHand / maxY) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }); ctx.stroke(); ctx.setLineDash([]);

    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const yCtc = pad.top + cH - (p.ctc / maxY) * cH;
      ctx.beginPath(); ctx.arc(x, yCtc, 4, 0, Math.PI * 2);
      ctx.fillStyle = T.accent; ctx.fill();
      ctx.strokeStyle = T.canvasDotStroke; ctx.lineWidth = 2; ctx.stroke();
    });

    ctx.font = `12px ${SANS}`; ctx.textAlign = "left";
    ctx.fillStyle = T.accent; ctx.fillRect(W - 160, 12, 12, 3);
    ctx.fillText("CTC", W - 142, 18);
    ctx.fillStyle = T.accentGreen; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(W - 90, 14); ctx.lineTo(W - 78, 14);
    ctx.strokeStyle = T.accentGreen; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]); ctx.fillText("In-Hand", W - 70, 18);
  }, [projections, showProjection, isDark, T]);

  const pctBarData = [
    { label: "Basic", value: compData.basicPct, color: T.accent       },
    { label: "HRA",   value: compData.hraPct,   color: T.accentGreen  },
    { label: "Bonus", value: compData.bonusPct, color: T.accentBlue   },
    { label: "ESOP",  value: compData.esopPct,  color: T.accentPurple },
    { label: "Other", value: compData.otherPct, color: T.accentRed    },
  ];

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "14px", color: T.text, fontFamily: SANS,
    fontSize: 14, cursor: "pointer", transition: "border 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: SANS, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 3px; }
        input:focus, select:focus { outline: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
        select { appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23E8A758' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "32px 24px 0", maxWidth: 880, margin: "0 auto" }}>
        <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.logoGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, fontFamily: FONT, color: T.logoText, flexShrink: 0 }}>
              SP
            </div>
            <div>
              <h1 style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                SPJIMR <span style={{ fontStyle: "italic", color: T.accent }}>Salary</span> Calculator
              </h1>
              <p style={{ fontSize: 12, color: T.textLabel, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Batch 2024–26 · Placement Data · New Tax Regime FY 2025-26
              </p>
            </div>
          </div>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} T={T} />
        </div>

        {/* Benchmark tiles — click to populate CTC */}
        <div className="fade-up" style={{ animationDelay: "0.1s", marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Average CTC", val: SPJIMR_DATA.overall.average },
            { label: "Median CTC",  val: SPJIMR_DATA.overall.median  },
            { label: "Top 50%",     val: SPJIMR_DATA.overall.top50   },
            { label: "Top 20%",     val: SPJIMR_DATA.overall.top20   },
          ].map((item, i) => (
            <div key={i} onClick={() => setCtc(item.val.toString())} className="card-hover"
              style={{ background: T.benchmarkBg, borderRadius: 10, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.benchmarkBorder}`, cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 22, color: T.accent, fontStyle: "italic" }}>{item.val}</div>
              <div style={{ fontSize: 10, color: T.textFaint }}>LPA</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inputs ── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.15s", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, display: "block", marginBottom: 6 }}>Your CTC (LPA)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.accent, fontFamily: FONT, fontSize: 18 }}>₹</span>
              <input type="number" value={ctc} onChange={e => setCtc(e.target.value)}
                placeholder={SPJIMR_DATA.overall.average.toString()}
                style={{ ...inputStyle, padding: "14px 14px 14px 34px", border: `1px solid ${T.borderInput}` }}
                onFocus={e => (e.target.style.borderColor = T.accent)}
                onBlur={e => (e.target.style.borderColor = T.borderInput)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, display: "block", marginBottom: 6 }}>Domain</label>
            <select value={domain} onChange={e => setDomain(e.target.value)} style={inputStyle}>
              {Object.keys(SPJIMR_DATA.domains).map(d => <option key={d} value={d} style={{ background: T.bg }}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, display: "block", marginBottom: 6 }}>Company Type</label>
            <select value={companyType} onChange={e => setCompanyType(e.target.value)} style={inputStyle}>
              {Object.keys(SPJIMR_DATA.companyTypes).map(c => <option key={c} value={c} style={{ background: T.bg }}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "0.18s", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div onClick={() => setMetro(!metro)}
            style={{ width: 36, height: 20, borderRadius: 10, background: metro ? T.accent : T.bgToggle, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 2, left: metro ? 18 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: 12, color: T.textMuted }}>Metro City (HRA exemption)</span>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.2s", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Monthly In-Hand",  val: fmtMonthly(breakdown.inHand),           sub: "Averaged (incl. bonus)",       color: T.accentGreen },
            { label: "Fixed Monthly",    val: fmtMonthly(breakdown.fixedMonthly * 12), sub: "Excl. annual bonus",           color: T.accentBlue  },
            { label: "Annual In-Hand",   val: fmtLakhs(breakdown.inHand),              sub: `After ${fmtLakhs(breakdown.tax)} tax`, color: T.accent },
          ].map((item, i) => (
            <div key={i} className="card-hover"
              style={{ background: T.cardBg, borderRadius: 12, padding: "18px 16px", border: `1px solid ${item.color}30`, position: "relative", overflow: "hidden", boxShadow: T.cardShadow }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${item.color}20, transparent 70%)` }} />
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 26, color: item.color, fontStyle: "italic", letterSpacing: "-0.02em" }}>{item.val}</div>
              <div style={{ fontSize: 11, color: T.textFaint, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.25s", display: "flex", gap: 4, background: T.bgTab, borderRadius: 10, padding: 3 }}>
          {[
            { id: "breakdown",  label: "Salary Breakdown" },
            { id: "domain",     label: "Domain Insights"  },
            { id: "projection", label: "10-Year Growth"   },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "projection") setShowProjection(true); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                background: activeTab === tab.id ? T.bgTabActive : "transparent",
                color: activeTab === tab.id ? T.accent : T.textMuted,
                fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 24px 40px" }}>

        {/* BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 10 }}>
                {pctBarData.map((seg, i) => (
                  <div key={i} style={{ width: `${seg.value * 100}%`, background: seg.color, transition: "width 0.4s ease" }}
                    title={`${seg.label}: ${(seg.value * 100).toFixed(0)}%`} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                {pctBarData.map((seg, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                    <span style={{ fontSize: 11, color: T.textMuted }}>{seg.label} {(seg.value * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.cardShadow }}>
              <div style={{ padding: "10px 20px 4px" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.sectionLabel }}>CTC Components</span>
              </div>
              {[
                { label: "Basic Salary",        annual: breakdown.basic,        color: T.accent,        note: null             },
                { label: "HRA",                 annual: breakdown.hra,          color: T.accentGreen,   note: null             },
                { label: "Performance Bonus",   annual: breakdown.bonus,        color: T.accentBlue,    note: "Paid annually"  },
                { label: "ESOPs / RSUs",        annual: breakdown.esop,         color: T.accentPurple,  note: "Vests over time"},
                { label: "Other Allowances",    annual: breakdown.other,        color: T.accentRed,     note: null             },
                { label: "Employer EPF",        annual: breakdown.employerEPF,  color: T.greyComponent, note: "Retirement"     },
                { label: "Gratuity",            annual: breakdown.gratuity,     color: T.greyComponent, note: "5yr vesting"    },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${T.rowBorder}`, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: row.color }} />
                    <div>
                      <div style={{ fontSize: 13, color: T.textMuted }}>{row.label}</div>
                      {row.note && <div style={{ fontSize: 10, color: T.textFaintest, marginTop: 1 }}>{row.note}</div>}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: T.textMuted, textAlign: "right" }}>{fmtLakhs(row.annual)}</span>
                  <span style={{ fontSize: 13, color: T.textFaint, textAlign: "right" }}>{fmtMonthly(row.annual)}/mo</span>
                </div>
              ))}

              <div style={{ height: 1, background: `${T.accent}44`, margin: "0 20px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "12px 20px", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>Gross CTC</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.accent, textAlign: "right" }}>{fmtLakhs(breakdown.annual)}</span>
                <span style={{ fontSize: 13, color: `${T.accent}99`, textAlign: "right" }}>{fmtMonthly(breakdown.annual)}/mo</span>
              </div>

              <div style={{ height: 1, background: T.divider, margin: "0 20px" }} />
              <div style={{ padding: "10px 20px 4px" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.sectionLabel }}>Deductions from Gross</span>
              </div>
              {[
                { label: "Income Tax + 4% Cess",       val: breakdown.tax,         note: "New Regime FY 25-26"   },
                { label: "Employee EPF (12% of Basic)", val: breakdown.employeeEPF, note: "Deducted from salary"  },
                { label: "Professional Tax",            val: breakdown.profTax,     note: "Maharashtra"          },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "10px 20px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: T.deductionText }}>− {row.label}</div>
                    {row.note && <div style={{ fontSize: 10, color: T.deductionMuted, marginTop: 1 }}>{row.note}</div>}
                  </div>
                  <span style={{ fontSize: 13, color: T.deductionVal, textAlign: "right" }}>{fmtLakhs(row.val)}</span>
                  <span style={{ fontSize: 13, color: T.deductionMuted, textAlign: "right" }}>{fmtMonthly(row.val)}/mo</span>
                </div>
              ))}

              <div style={{ height: 1, background: `${T.accentGreen}44`, margin: "0 20px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "14px 20px", background: `${T.accentGreen}08`, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.accentGreen }}>Annual In-Hand</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: T.accentGreen, textAlign: "right", fontFamily: FONT, fontStyle: "italic" }}>{fmtLakhs(breakdown.inHand)}</span>
                <span style={{ fontSize: 13, color: `${T.accentGreen}99`, textAlign: "right" }}>{fmtMonthly(breakdown.inHand)}/mo</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "10px 20px", borderTop: `1px solid ${T.rowBorder}`, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.accentBlue }}>Fixed Monthly (no bonus)</span>
                <span style={{ fontSize: 12, color: T.accentBlue, textAlign: "right", opacity: 0.6 }}>—</span>
                <span style={{ fontSize: 13, color: T.accentBlue, textAlign: "right", fontWeight: 500 }}>{fmtMonthly(breakdown.fixedMonthly * 12)}/mo</span>
              </div>
            </div>
          </div>
        )}

        {/* DOMAIN */}
        {activeTab === "domain" && (
          <div className="fade-up">
            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16, boxShadow: T.cardShadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: FONT, fontSize: 22, fontStyle: "italic", color: T.accent }}>{domain}</h3>
                  <p style={{ fontSize: 12, color: T.textLabel, marginTop: 2 }}>{domainData.pct}% of batch · ~{domainData.growth}% avg annual growth</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textFaint }}>Your Percentile</div>
                  <div style={{ fontFamily: FONT, fontSize: 28, fontStyle: "italic",
                    color: ctcNum >= domainData.top20 ? T.accentGreen : ctcNum >= domainData.median ? T.accentBlue : T.accentRed }}>
                    {ctcNum >= domainData.top20 ? "Top 20%" : ctcNum >= domainData.top50 ? "Top 50%" : ctcNum >= domainData.median ? "Above Median" : "Below Median"}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { label: "Top 20% CTC", val: domainData.top20,   color: T.accent       },
                  { label: "Top 50% CTC", val: domainData.top50,   color: T.accentBlue   },
                  { label: "Average CTC", val: domainData.average, color: T.accentGreen  },
                  { label: "Median CTC",  val: domainData.median,  color: T.accentPurple },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>₹{item.val} LPA</span>
                    </div>
                    <div style={{ height: 6, background: T.barTrack, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: `${(item.val / domainData.top20) * 100}%`, background: item.color, borderRadius: 3, transition: "width 0.6s ease" }} />
                      <div style={{ position: "absolute", top: -3, left: `${Math.min((ctcNum / domainData.top20) * 100, 100)}%`, width: 2, height: 12, background: T.text, opacity: 0.7, borderRadius: 1, transform: "translateX(-50%)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.cardShadow }}>
              <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, marginBottom: 12 }}>Top Recruiters in {domain}</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {domainData.companies.map((c, i) => (
                  <span key={i} style={{ padding: "6px 14px", borderRadius: 20, background: T.tagBg, border: `1px solid ${T.tagBorder}`, fontSize: 12, color: T.tagText }}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.cardShadow }}>
              <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLabel, marginBottom: 14 }}>All Domains — Average CTC</h4>
              {Object.entries(SPJIMR_DATA.domains).sort((a, b) => b[1].average - a[1].average).map(([name, data], i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: name === domain ? T.accent : T.textMuted, fontWeight: name === domain ? 600 : 400 }}>{name}</span>
                    <span style={{ fontSize: 12, color: name === domain ? T.accent : T.textFaint }}>₹{data.average}L</span>
                  </div>
                  <div style={{ height: 4, background: T.barTrack, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(data.average / 40) * 100}%`, background: name === domain ? T.accent : T.barInactive, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTION */}
        {activeTab === "projection" && (
          <div className="fade-up">
            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: "20px 16px 16px", marginBottom: 16, boxShadow: T.cardShadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT, fontSize: 20, fontStyle: "italic", color: T.accent }}>10-Year Projection</h3>
                  <p style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>{domain} · {companyType} · ~{domainData.growth}% base growth</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>Year 10 CTC</div>
                  <div style={{ fontFamily: FONT, fontSize: 24, color: T.accent, fontStyle: "italic" }}>{fmtLakhs(projections[10].ctc)}</div>
                </div>
              </div>
              <canvas ref={canvasRef} style={{ width: "100%", height: 260, display: "block" }} />
            </div>

            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.cardShadow }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr", padding: "12px 16px", background: T.bgTab, borderBottom: `1px solid ${T.border}` }}>
                {["Year", "CTC", "Tax", "In-Hand", "Monthly"].map(h => (
                  <span key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: T.textFaint, textAlign: h === "Year" ? "left" : "right" }}>{h}</span>
                ))}
              </div>
              {projections.map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr", padding: "10px 16px",
                  borderBottom: `1px solid ${T.projRowBorder}`, background: i === 0 ? T.projRowHighlight : "transparent" }}>
                  <span style={{ fontSize: 12, color: i === 0 ? T.accent : T.textMuted, fontWeight: i === 0 ? 600 : 400 }}>{i === 0 ? "Now" : `+${i}yr`}</span>
                  <span style={{ fontSize: 12, color: T.accent, textAlign: "right", fontFamily: FONT, fontStyle: "italic", opacity: 0.85 }}>{fmtLakhs(p.ctc)}</span>
                  <span style={{ fontSize: 12, color: T.accentRed, textAlign: "right", opacity: 0.7 }}>{fmtLakhs(p.tax)}</span>
                  <span style={{ fontSize: 12, color: T.accentGreen, textAlign: "right", fontWeight: 500, opacity: 0.85 }}>{fmtLakhs(p.inHand)}</span>
                  <span style={{ fontSize: 12, color: T.accentBlue, textAlign: "right", opacity: 0.8 }}>{fmtMonthly(p.inHand)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: "12px 16px", background: T.noteBox, borderRadius: 10, border: `1px solid ${T.noteBorder}` }}>
              <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                <span style={{ color: T.accent }}>Note:</span> Projections assume ~{domainData.growth}% annual growth for years 1–3, tapering to ~{(domainData.growth * 0.85).toFixed(0)}% for years 4–6, and ~{(domainData.growth * 0.7).toFixed(0)}% for years 7–10. Employer EPF and gratuity excluded from taxable income. Tax computed under the New Tax Regime FY 2025-26.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", padding: "12px 24px 28px", maxWidth: 880, margin: "0 auto" }}>
        <p style={{ fontSize: 10, color: T.footerText, lineHeight: 1.6 }}>
         | Made by Akanksha Singh |
          Data sourced from SPJIMR official placement reports (2024–2026). Sector-wise figures are estimates based on published trends. Tax calculations follow the New Tax Regime FY 2025-26. This is an indicative tool — actual compensation structures vary by employer.
        </p>
      </div>
    </div>
  );
}
