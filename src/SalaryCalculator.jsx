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
    "MNC (Top Tier)": { multiplier: 1.25, basicPct: 0.40, hraPct: 0.20, bonusPct: 0.15, esopPct: 0.10, otherPct: 0.15 },
    "MNC (Mid Tier)": { multiplier: 1.10, basicPct: 0.42, hraPct: 0.22, bonusPct: 0.12, esopPct: 0.05, otherPct: 0.19 },
    "Indian Conglomerate": { multiplier: 1.0, basicPct: 0.45, hraPct: 0.22, bonusPct: 0.10, esopPct: 0.03, otherPct: 0.20 },
    "Startup / Unicorn": { multiplier: 0.95, basicPct: 0.38, hraPct: 0.18, bonusPct: 0.10, esopPct: 0.20, otherPct: 0.14 },
    "PSU / Government": { multiplier: 0.75, basicPct: 0.50, hraPct: 0.24, bonusPct: 0.08, esopPct: 0.0, otherPct: 0.18 },
  },
};

function calcTax(income) {
  const lakhs = income;
  const std = 0.75;
  let taxable = Math.max(0, lakhs - std);
  let tax = 0;
  const slabs = [
    { upto: 4, rate: 0 },
    { upto: 8, rate: 0.05 },
    { upto: 12, rate: 0.10 },
    { upto: 16, rate: 0.15 },
    { upto: 20, rate: 0.20 },
    { upto: 24, rate: 0.25 },
    { upto: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxable <= 0) break;
    const width = slab.upto - prev;
    const amt = Math.min(taxable, width);
    tax += amt * slab.rate;
    taxable -= amt;
    prev = slab.upto;
  }
  // Rebate u/s 87A for income up to 12L (after std deduction)
  const totalIncome = Math.max(0, lakhs - std);
  if (totalIncome <= 12) tax = 0;
  const cess = tax * 0.04;
  return tax + cess;
}

function fmt(val) {
  if (val >= 100) return `₹${(val / 100).toFixed(2)} Cr`;
  return `₹${val.toFixed(2)} LPA`;
}

function fmtMonthly(lpa) {
  const monthly = (lpa * 100000) / 12;
  if (monthly >= 100000) return `₹${(monthly / 100000).toFixed(2)}L`;
  return `₹${Math.round(monthly).toLocaleString("en-IN")}`;
}

function fmtLakhs(val) {
  return `₹${val.toFixed(2)}L`;
}

const FONT = `'Playfair Display', Georgia, serif`;
const SANS = `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`;

export default function SPJIMRSalaryCalculator() {
  const [ctc, setCtc] = useState("");
  const [domain, setDomain] = useState("Consulting");
  const [companyType, setCompanyType] = useState("MNC (Top Tier)");
  const [activeTab, setActiveTab] = useState("breakdown");
  const [showProjection, setShowProjection] = useState(false);
  const [metro, setMetro] = useState(true);
  const canvasRef = useRef(null);

  const ctcNum = parseFloat(ctc) || SPJIMR_DATA.overall.average;
  const usingDefault = !ctc || !parseFloat(ctc);
  const domainData = SPJIMR_DATA.domains[domain];
  const compData = SPJIMR_DATA.companyTypes[companyType];

  const breakdown = useMemo(() => {
    const annual = ctcNum;
    const basic = annual * compData.basicPct;
    const hra = annual * compData.hraPct;
    const bonus = annual * compData.bonusPct;
    const esop = annual * compData.esopPct;
    const other = annual * compData.otherPct;
    const tax = calcTax(annual);
    const pf = Math.min(basic * 0.12, 1.8);
    const profTax = 0.024;
    const totalDeductions = tax + pf + profTax;
    const inHand = annual - totalDeductions;
    const monthly = inHand / 12;
    return { annual, basic, hra, bonus, esop, other, tax, pf, profTax, totalDeductions, inHand, monthly };
  }, [ctcNum, compData]);

  const projections = useMemo(() => {
    const years = [];
    const baseGrowth = domainData.growth / 100;
    for (let y = 0; y <= 10; y++) {
      const growthRate = y <= 3 ? baseGrowth : y <= 6 ? baseGrowth * 0.85 : baseGrowth * 0.7;
      const prevCtc = y === 0 ? ctcNum : years[y - 1].ctc * (1 + growthRate);
      const c = y === 0 ? ctcNum : prevCtc;
      const tax = calcTax(c);
      const pf = Math.min(c * compData.basicPct * 0.12, 1.8 + y * 0.15);
      const profTax = 0.024;
      const inHand = c - tax - pf - profTax;
      years.push({ year: y, ctc: c, tax, inHand, monthly: inHand / 12 });
    }
    return years;
  }, [ctcNum, domainData, compData]);

  // Draw projection chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showProjection) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const pad = { top: 40, right: 30, bottom: 50, left: 60 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const maxCtc = Math.max(...projections.map((p) => p.ctc));
    const maxY = Math.ceil(maxCtc / 10) * 10;

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (cH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `11px ${SANS}`;
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = maxY - (maxY / 5) * i;
      const y = pad.top + (cH / 5) * i;
      ctx.fillText(`₹${val.toFixed(0)}L`, pad.left - 8, y + 4);
    }

    // X-axis labels
    ctx.textAlign = "center";
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      ctx.fillText(`Y${p.year}`, x, H - pad.bottom + 20);
    });

    // CTC area
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    gradient.addColorStop(0, "rgba(232,167,88,0.3)");
    gradient.addColorStop(1, "rgba(232,167,88,0.01)");

    ctx.beginPath();
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.ctc / maxY) * cH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cW, pad.top + cH);
    ctx.lineTo(pad.left, pad.top + cH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // CTC line
    ctx.beginPath();
    ctx.strokeStyle = "#E8A758";
    ctx.lineWidth = 2.5;
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.ctc / maxY) * cH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // In-hand line
    ctx.beginPath();
    ctx.strokeStyle = "#7DD3A0";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const y = pad.top + cH - (p.inHand / maxY) * cH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Dots
    projections.forEach((p, i) => {
      const x = pad.left + (cW / 10) * i;
      const yCtc = pad.top + cH - (p.ctc / maxY) * cH;
      ctx.beginPath();
      ctx.arc(x, yCtc, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#E8A758";
      ctx.fill();
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Legend
    ctx.font = `12px ${SANS}`;
    ctx.fillStyle = "#E8A758";
    ctx.fillRect(W - 160, 12, 12, 3);
    ctx.fillText("CTC", W - 140, 18);
    ctx.fillStyle = "#7DD3A0";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(W - 90, 14);
    ctx.lineTo(W - 78, 14);
    ctx.strokeStyle = "#7DD3A0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("In-Hand", W - 70, 18);
  }, [projections, showProjection]);

  const pctBarData = [
    { label: "Basic", value: compData.basicPct, color: "#E8A758" },
    { label: "HRA", value: compData.hraPct, color: "#7DD3A0" },
    { label: "Bonus", value: compData.bonusPct, color: "#6BB8E8" },
    { label: "ESOP", value: compData.esopPct, color: "#C490D1" },
    { label: "Other", value: compData.otherPct, color: "#E87272" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0ece4", fontFamily: SANS, padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(232,167,88,0.3); border-radius: 3px; }
        input:focus, select:focus { outline: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23E8A758' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "32px 24px 0", maxWidth: 880, margin: "0 auto" }}>
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #E8A758, #D4923A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: FONT, color: "#0d0d0d" }}>
            SP
          </div>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              SPJIMR <span style={{ fontStyle: "italic", color: "#E8A758" }}>Salary</span> Calculator
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Batch 2024–26 · Placement Data · New Tax Regime FY 2025-26
            </p>
          </div>
        </div>

        {/* Benchmark Bar */}
        <div className="fade-up" style={{ animationDelay: "0.1s", marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Average CTC", val: SPJIMR_DATA.overall.average },
            { label: "Median CTC", val: SPJIMR_DATA.overall.median },
            { label: "Top 50%", val: SPJIMR_DATA.overall.top50 },
            { label: "Top 20%", val: SPJIMR_DATA.overall.top20 },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => { setCtc(item.val.toString()); }}
              className="card-hover"
            >
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 22, color: "#E8A758", fontStyle: "italic" }}>{item.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>LPA</div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.15s", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* CTC Input */}
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>Your CTC (LPA)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#E8A758", fontFamily: FONT, fontSize: 18 }}>₹</span>
              <input
                type="number"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder={SPJIMR_DATA.overall.average.toString()}
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(232,167,88,0.3)", borderRadius: 10, padding: "14px 14px 14px 34px", color: "#f0ece4", fontFamily: SANS, fontSize: 16, transition: "border 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A758")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(232,167,88,0.3)")}
              />
            </div>
          </div>
          {/* Domain */}
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>Domain</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px", color: "#f0ece4", fontFamily: SANS, fontSize: 14, cursor: "pointer" }}>
              {Object.keys(SPJIMR_DATA.domains).map((d) => <option key={d} value={d} style={{ background: "#1a1a1a" }}>{d}</option>)}
            </select>
          </div>
          {/* Company Type */}
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>Company Type</label>
            <select value={companyType} onChange={(e) => setCompanyType(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px", color: "#f0ece4", fontFamily: SANS, fontSize: 14, cursor: "pointer" }}>
              {Object.keys(SPJIMR_DATA.companyTypes).map((c) => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Metro toggle */}
        <div className="fade-up" style={{ animationDelay: "0.18s", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div onClick={() => setMetro(!metro)}
            style={{ width: 36, height: 20, borderRadius: 10, background: metro ? "#E8A758" : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 2, left: metro ? 18 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Metro City (HRA exemption)</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.2s", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Annual In-Hand", val: fmtLakhs(breakdown.inHand), sub: "After all deductions", color: "#7DD3A0" },
            { label: "Monthly In-Hand", val: fmtMonthly(breakdown.inHand), sub: "Take-home per month", color: "#6BB8E8" },
            { label: "Total Tax", val: fmtLakhs(breakdown.tax), sub: `Effective ${((breakdown.tax / breakdown.annual) * 100).toFixed(1)}%`, color: "#E87272" },
          ].map((item, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`, borderRadius: 12, padding: "18px 16px", border: `1px solid ${item.color}22`, position: "relative", overflow: "hidden" }}
              className="card-hover" >
              <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${item.color}15, transparent 70%)` }} />
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 26, color: item.color, fontStyle: "italic", letterSpacing: "-0.02em" }}>{item.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 0" }}>
        <div className="fade-up" style={{ animationDelay: "0.25s", display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {[
            { id: "breakdown", label: "Salary Breakdown" },
            { id: "domain", label: "Domain Insights" },
            { id: "projection", label: "10-Year Growth" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "projection") setShowProjection(true); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: activeTab === tab.id ? "rgba(232,167,88,0.15)" : "transparent",
                color: activeTab === tab.id ? "#E8A758" : "rgba(255,255,255,0.4)", fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                borderBottom: activeTab === tab.id ? "2px solid #E8A758" : "2px solid transparent" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 24px 40px" }}>
        {activeTab === "breakdown" && (
          <div className="fade-up">
            {/* Composition Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 10 }}>
                {pctBarData.map((seg, i) => (
                  <div key={i} style={{ width: `${seg.value * 100}%`, background: seg.color, transition: "width 0.4s ease" }} title={`${seg.label}: ${(seg.value * 100).toFixed(0)}%`} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                {pctBarData.map((seg, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{seg.label} {(seg.value * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              {[
                { label: "Basic Salary", annual: breakdown.basic, color: "#E8A758" },
                { label: "HRA", annual: breakdown.hra, color: "#7DD3A0" },
                { label: "Performance Bonus", annual: breakdown.bonus, color: "#6BB8E8" },
                { label: "ESOPs / RSUs", annual: breakdown.esop, color: "#C490D1" },
                { label: "Other Allowances", annual: breakdown.other, color: "#E87272" },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: row.color }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "right" }}>{fmtLakhs(row.annual)}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>{fmtMonthly(row.annual)}/mo</span>
                </div>
              ))}
              {/* Divider */}
              <div style={{ height: 1, background: "rgba(232,167,88,0.2)", margin: "0 20px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "12px 20px", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#E8A758" }}>Gross CTC</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#E8A758", textAlign: "right" }}>{fmtLakhs(breakdown.annual)}</span>
                <span style={{ fontSize: 13, color: "rgba(232,167,88,0.6)", textAlign: "right" }}>{fmtMonthly(breakdown.annual)}/mo</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 20px" }} />
              {/* Deductions */}
              <div style={{ padding: "8px 20px 4px" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>Deductions</span>
              </div>
              {[
                { label: "Income Tax (New Regime)", val: breakdown.tax },
                { label: "EPF (Employee 12%)", val: breakdown.pf },
                { label: "Professional Tax", val: breakdown.profTax },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "10px 20px", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,72,72,0.6)" }}>− {row.label}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,72,72,0.5)", textAlign: "right" }}>{fmtLakhs(row.val)}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,72,72,0.3)", textAlign: "right" }}>{fmtMonthly(row.val)}/mo</span>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(125,211,160,0.2)", margin: "0 20px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "14px 20px", background: "rgba(125,211,160,0.04)", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#7DD3A0" }}>Annual In-Hand</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#7DD3A0", textAlign: "right", fontFamily: FONT, fontStyle: "italic" }}>{fmtLakhs(breakdown.inHand)}</span>
                <span style={{ fontSize: 13, color: "rgba(125,211,160,0.6)", textAlign: "right" }}>{fmtMonthly(breakdown.inHand)}/mo</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "domain" && (
          <div className="fade-up">
            {/* Domain Stats Card */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: FONT, fontSize: 22, fontStyle: "italic", color: "#E8A758" }}>{domain}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{domainData.pct}% of batch · ~{domainData.growth}% avg annual growth</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>Your Percentile</div>
                  <div style={{ fontFamily: FONT, fontSize: 28, color: ctcNum >= domainData.top20 ? "#7DD3A0" : ctcNum >= domainData.median ? "#6BB8E8" : "#E87272", fontStyle: "italic" }}>
                    {ctcNum >= domainData.top20 ? "Top 20%" : ctcNum >= domainData.top50 ? "Top 50%" : ctcNum >= domainData.median ? "Above Median" : "Below Median"}
                  </div>
                </div>
              </div>

              {/* Domain Salary Bars */}
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { label: "Top 20% CTC", val: domainData.top20, color: "#E8A758" },
                  { label: "Top 50% CTC", val: domainData.top50, color: "#6BB8E8" },
                  { label: "Average CTC", val: domainData.average, color: "#7DD3A0" },
                  { label: "Median CTC", val: domainData.median, color: "#C490D1" },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>₹{item.val} LPA</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: `${(item.val / domainData.top20) * 100}%`, background: item.color, borderRadius: 3, transition: "width 0.6s ease" }} />
                      {/* User marker */}
                      <div style={{ position: "absolute", top: -3, left: `${Math.min((ctcNum / domainData.top20) * 100, 100)}%`, width: 2, height: 12, background: "#fff", borderRadius: 1, transform: "translateX(-50%)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Companies */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 20 }}>
              <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Top Recruiters in {domain}</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {domainData.companies.map((c, i) => (
                  <span key={i} style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(232,167,88,0.08)", border: "1px solid rgba(232,167,88,0.15)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Cross Domain Comparison */}
            <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 20 }}>
              <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>All Domains — Average CTC</h4>
              {Object.entries(SPJIMR_DATA.domains).sort((a, b) => b[1].average - a[1].average).map(([name, data], i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: name === domain ? "#E8A758" : "rgba(255,255,255,0.5)", fontWeight: name === domain ? 600 : 400 }}>{name}</span>
                    <span style={{ fontSize: 12, color: name === domain ? "#E8A758" : "rgba(255,255,255,0.4)" }}>₹{data.average}L</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(data.average / 40) * 100}%`, background: name === domain ? "#E8A758" : "rgba(255,255,255,0.15)", borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "projection" && (
          <div className="fade-up">
            {/* Chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT, fontSize: 20, fontStyle: "italic", color: "#E8A758" }}>10-Year Projection</h3>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{domain} · {companyType} · ~{domainData.growth}% base growth</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Year 10 CTC</div>
                  <div style={{ fontFamily: FONT, fontSize: 24, color: "#E8A758", fontStyle: "italic" }}>{fmtLakhs(projections[10].ctc)}</div>
                </div>
              </div>
              <canvas ref={canvasRef} style={{ width: "100%", height: 260, display: "block" }} />
            </div>

            {/* Projection Table */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Year", "CTC", "Tax", "In-Hand", "Monthly"].map((h) => (
                  <span key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textAlign: h === "Year" ? "left" : "right" }}>{h}</span>
                ))}
              </div>
              {projections.map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                  background: i === 0 ? "rgba(232,167,88,0.05)" : "transparent" }}>
                  <span style={{ fontSize: 12, color: i === 0 ? "#E8A758" : "rgba(255,255,255,0.5)", fontWeight: i === 0 ? 600 : 400 }}>
                    {i === 0 ? "Now" : `+${i}yr`}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(232,167,88,0.7)", textAlign: "right", fontFamily: FONT, fontStyle: "italic" }}>{fmtLakhs(p.ctc)}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,72,72,0.5)", textAlign: "right" }}>{fmtLakhs(p.tax)}</span>
                  <span style={{ fontSize: 12, color: "rgba(125,211,160,0.7)", textAlign: "right", fontWeight: 500 }}>{fmtLakhs(p.inHand)}</span>
                  <span style={{ fontSize: 12, color: "rgba(107,184,232,0.6)", textAlign: "right" }}>{fmtMonthly(p.inHand)}</span>
                </div>
              ))}
            </div>

            {/* Growth note */}
            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(232,167,88,0.05)", borderRadius: 10, border: "1px solid rgba(232,167,88,0.1)" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                <span style={{ color: "#E8A758" }}>Note:</span> Projections assume ~{domainData.growth}% annual growth for years 1–3 (fast promotions), tapering to ~{(domainData.growth * 0.85).toFixed(0)}% for years 4–6, and ~{(domainData.growth * 0.7).toFixed(0)}% for years 7–10. Actual growth varies by performance, company, and market conditions. Tax computed under the New Tax Regime for FY 2025-26.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "12px 24px 28px", maxWidth: 880, margin: "0 auto" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
          Data sourced from SPJIMR official placement reports (2024–2026). Sector-wise figures are estimates based on published trends. Tax calculations follow the New Tax Regime FY 2025-26. This is an indicative tool — actual compensation structures vary by employer.
        </p>
      </div>
    </div>
  );
}
