import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import JobPulseHome from "../components/dashboard/JobPulseHome";

/* ================================================================
   JOB PULSE v6 · CTL Plumbing · Mobile-First Command Center
   - Real weather from NWS via backend
   - Dashboard stats from backend API
   - Smooth tab transitions
   - Enhanced KPI cards
   - Smart alerts & notifications
   ================================================================ */

/* -- THEME -- */
const C = {
  bg: "#060608", bgCard: "#0E0F12", bgCardHi: "#151720",
  surface: "#1A1C24", surfaceHi: "#22252F",
  border: "rgba(255,255,255,.06)", borderHi: "rgba(255,255,255,.12)",
  text: "#EDE9E0", sub: "#A8A29E", mid: "#78716C", dim: "#44403C", faint: "#1C1917",
  accent: "#E5A31E", accentMute: "#A37514", accentBg: "rgba(229,163,30,.08)",
  green: "#34D399", greenMute: "#059669",
  blue: "#38BDF8", blueMute: "#0284C7",
  red: "#F87171", redMute: "#B91C1C",
  orange: "#FB923C", purple: "#A78BFA", pink: "#F472B6",
};
const FN = "'JetBrains Mono','IBM Plex Mono',monospace";
const FS = "'DM Sans',-apple-system,system-ui,sans-serif";

/* -- PLUMBING DATA -- */
const PHASES = [
  { id: "underground", label: "Underground", sh: "UG", icon: "\u26CF", color: "#92700C" },
  { id: "roughin", label: "Rough-In", sh: "RI", icon: "\uD83D\uDD27", color: C.accent },
  { id: "topout", label: "Top-Out", sh: "TO", icon: "\uD83D\uDCD0", color: C.blue },
  { id: "trim", label: "Trim", sh: "TR", icon: "\uD83D\uDEBF", color: "#2DD4BF" },
  { id: "final", label: "Final", sh: "FN", icon: "\u2705", color: C.green },
];

const CREWS = [
  { id: "A", name: "Team Alpha", lead: "Marco", members: ["Marco", "Luis"], phone: "(817) 555-0142", color: C.accent },
  { id: "B", name: "Team Bravo", lead: "Carlos", members: ["Carlos", "Javi"], phone: "(817) 555-0198", color: C.blue },
  { id: "C", name: "Team Charlie", lead: "Danny", members: ["Danny"], phone: "(817) 555-0231", color: C.green },
];

const BUILDERS = {
  "Horizon Homes": { pay: 18, jobs: 14, onTime: 85 },
  "Summit Builders": { pay: 32, jobs: 7, onTime: 70 },
  "Redbrick Dev": { pay: 14, jobs: 3, onTime: 95 },
  "DR Horton": { pay: 45, jobs: 22, onTime: 60 },
};

const FLAGS = {
  material: { label: "Material Hold", icon: "\uD83D\uDCE6", color: C.orange },
  inspection: { label: "Inspection", icon: "\uD83D\uDD0D", color: C.purple },
  weather: { label: "Weather Risk", icon: "\u26C8", color: C.blue },
  change: { label: "Change Order", icon: "\uD83D\uDCDD", color: C.red },
};

const REV = [
  { w: "Jan 6", b: 12400, c: 9800 }, { w: "Jan 13", b: 18200, c: 14500 },
  { w: "Jan 20", b: 8600, c: 16200 }, { w: "Jan 27", b: 22100, c: 8600 },
  { w: "Feb 3", b: 15800, c: 22100 }, { w: "Feb 10", b: 19400, c: 12400 },
  { w: "Feb 17", b: 4800, c: 19400 },
];

/* -- STATIC FALLBACK DATA -- */
const WEATHER_FALLBACK = [
  { day: "Wed", dt: 18, hi: 62, lo: 41, icon: "\u2600\uFE0F", precip: 0, forecast: "Sunny" },
  { day: "Thu", dt: 19, hi: 58, lo: 38, icon: "\u26C5", precip: 10, forecast: "Partly Cloudy" },
  { day: "Fri", dt: 20, hi: 52, lo: 34, icon: "\uD83C\uDF27\uFE0F", precip: 80, forecast: "Rain" },
  { day: "Sat", dt: 21, hi: 48, lo: 30, icon: "\uD83C\uDF27\uFE0F", precip: 60, forecast: "Showers" },
  { day: "Sun", dt: 22, hi: 55, lo: 33, icon: "\u26C5", precip: 15, forecast: "Partly Cloudy" },
  { day: "Mon", dt: 23, hi: 64, lo: 42, icon: "\u2600\uFE0F", precip: 0, forecast: "Sunny" },
  { day: "Tue", dt: 24, hi: 68, lo: 45, icon: "\u2600\uFE0F", precip: 0, forecast: "Sunny" },
];

const JOBS_DATA = [
  { id: "J-1001", addr: "4821 Westridge Dr", builder: "Horizon Homes", phase: "roughin", crew: "A", sched: "2026-02-18", est: 3200, notes: "2-story, 3.5 bath. PEX re-pipe entire 2nd floor.", flag: null, progress: 65 },
  { id: "J-1002", addr: "9310 Magnolia Blvd", builder: "Summit Builders", phase: "underground", crew: "B", sched: "2026-02-18", est: 4800, notes: "Slab on grade. 42 fixtures. Watch for gas line conflict.", flag: "material", progress: 20 },
  { id: "J-1003", addr: "1177 Crestview Ln", builder: "Horizon Homes", phase: "topout", crew: "A", sched: "2026-02-19", est: 2100, notes: "Standard top-out. Vent through roof on south side.", flag: null, progress: 40 },
  { id: "J-1004", addr: "5600 Timber Creek", builder: "DR Horton", phase: "trim", crew: "C", sched: "2026-02-18", est: 1800, notes: "Install all trim fixtures. Delta faucets per spec.", flag: "inspection", progress: 80 },
  { id: "J-1005", addr: "2244 Oakmont Pl", builder: "Redbrick Dev", phase: "final", crew: "C", sched: "2026-02-19", est: 900, notes: "Final walk. Punch list items from last inspection.", flag: null, progress: 95 },
  { id: "J-1006", addr: "8732 Preston Rd", builder: "DR Horton", phase: "roughin", crew: "B", sched: "2026-02-20", est: 3600, notes: "Duplex unit A. Mirror layout of unit B.", flag: "weather", progress: 10 },
  { id: "J-1007", addr: "3310 Riverside Way", builder: "Summit Builders", phase: "underground", crew: "A", sched: "2026-02-21", est: 5200, notes: "Large custom. 56 fixtures. Requires city variance.", flag: null, progress: 0 },
  { id: "J-1008", addr: "1450 Bluebonnet Trl", builder: "Horizon Homes", phase: "topout", crew: "B", sched: "2026-02-20", est: 2400, notes: "Top-out + water heater set.", flag: null, progress: 30 },
  { id: "J-1009", addr: "6677 Cedar Elm Dr", builder: "DR Horton", phase: "roughin", crew: "C", sched: "2026-02-22", est: 3100, notes: "Production home. Standard layout B7.", flag: null, progress: 0 },
  { id: "J-1010", addr: "990 Summit Ridge", builder: "Redbrick Dev", phase: "trim", crew: "A", sched: "2026-02-24", est: 2200, notes: "High-end trim. Kohler throughout.", flag: null, progress: 0 },
];

const MESSAGES_DATA = [
  { id: "m1", type: "email", from: "Mike Reeves", email: "mike@horizonhomes.com", subject: "Westridge Dr \u2014 Schedule Change", preview: "Hey, we need to push the rough-in inspection to Thursday. City inspector had a conflict. Can your crew be ready by 8am?", time: "7:32 AM", date: "2026-02-18", read: false, starred: true, labels: ["horizon", "urgent"],
    thread: [{ from: "Mike Reeves", body: "Hey, we need to push the rough-in inspection to Thursday. City inspector had a conflict. Can your crew be ready by 8am?", time: "7:32 AM" }] },
  { id: "m2", type: "email", from: "Sarah Chen", email: "sarah@summitbuilders.com", subject: "PO #4487 \u2014 Fixture Delivery Update", preview: "The Kohler fixtures for Magnolia Blvd are backordered. ETA now Feb 25.", time: "6:58 AM", date: "2026-02-18", read: false, starred: false, labels: ["summit", "materials"],
    thread: [{ from: "Sarah Chen", body: "The Kohler fixtures for Magnolia Blvd are backordered. ETA now Feb 25. I've attached the updated PO with alternates if you want to swap.", time: "6:58 AM" }] },
  { id: "m3", type: "sms", from: "Marco", phone: "(817) 555-0142", preview: "On site at Westridge. Found a conflict with HVAC ductwork in the master bath wall. Need you to come look at it or should I reroute?", time: "6:15 AM", date: "2026-02-18", read: false, starred: false, labels: ["crew"],
    thread: [
      { from: "Marco", body: "Boss, heading to Westridge now. Traffic on 35 is bad.", time: "5:48 AM" },
      { from: "You", body: "Copy. Take 121 to avoid it.", time: "5:52 AM" },
      { from: "Marco", body: "On site at Westridge. Found a conflict with HVAC ductwork in the master bath wall. Need you to come look at it or should I reroute?", time: "6:15 AM" },
    ] },
  { id: "m4", type: "sms", from: "Carlos", phone: "(817) 555-0198", preview: "Magnolia underground is going smooth. Should finish by 2pm. Want us to move to Bluebonnet after?", time: "5:55 AM", date: "2026-02-18", read: true, starred: false, labels: ["crew"],
    thread: [{ from: "Carlos", body: "Magnolia underground is going smooth. Should finish by 2pm. Want us to move to Bluebonnet after?", time: "5:55 AM" }] },
  { id: "m5", type: "email", from: "Tarrant County Permits", email: "permits@tarrantcounty.com", subject: "Permit #BLD-2026-0847 Approved", preview: "Your building permit for 3310 Riverside Way has been approved.", time: "Yesterday", date: "2026-02-17", read: true, starred: true, labels: ["permits"],
    thread: [{ from: "Tarrant County Permits", body: "Your building permit for 3310 Riverside Way has been approved. Please schedule your pre-pour inspection at least 48 hours in advance. Permit valid through August 2026.", time: "4:22 PM" }] },
  { id: "m6", type: "email", from: "Jenny Martinez", email: "jenny@drhorton.com", subject: "Cedar Elm Dr \u2014 Spec Sheet Revision", preview: "Updated spec sheet attached for lot 6677. They changed to a tankless water heater.", time: "Yesterday", date: "2026-02-17", read: true, starred: false, labels: ["drhorton"],
    thread: [{ from: "Jenny Martinez", body: "Updated spec sheet attached for lot 6677. They changed to a tankless water heater. Please revise your bid accordingly.", time: "3:15 PM" }] },
  { id: "m7", type: "sms", from: "Danny", phone: "(817) 555-0231", preview: "Timber Creek trim is looking good. Homeowner stopped by asking about the shower valve.", time: "Yesterday", date: "2026-02-17", read: true, starred: false, labels: ["crew"],
    thread: [
      { from: "Danny", body: "Timber Creek trim is looking good. Homeowner stopped by asking about the shower valve. I told them it's per builder spec.", time: "2:30 PM" },
      { from: "You", body: "Good call. Always refer them back to the builder.", time: "2:45 PM" },
    ] },
  { id: "m8", type: "email", from: "Ferguson Supply", email: "orders@ferguson.com", subject: "Order #FC-90122 Ready for Pickup", preview: "Your order including 2\" copper, PEX fittings, and 3 Delta shower valves is ready.", time: "Yesterday", date: "2026-02-17", read: true, starred: false, labels: ["materials"],
    thread: [{ from: "Ferguson Supply", body: "Your order #FC-90122 including 2\" copper, PEX fittings, and 3 Delta shower valves is ready for pickup at the Ft Worth branch. Pickup hours: 6AM-5PM.", time: "11:00 AM" }] },
];

/* -- HELPERS -- */
const fmt$ = n => "$" + n.toLocaleString();
const phaseMeta = id => PHASES.find(p => p.id === id) || PHASES[0];
const crewMeta = id => CREWS.find(c => c.id === id) || CREWS[0];
const dayDiff = (d, ref) => {
  const today = ref || new Date().toISOString().split("T")[0];
  const a = new Date(d + "T00:00:00"), b = new Date(today + "T00:00:00");
  return Math.round((a - b) / 864e5);
};
const schedLabel = (d, ref) => {
  const diff = dayDiff(d, ref);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff}d ago`;
  return `In ${diff}d`;
};

/* ================================================================
   SCOPED STYLES
   ================================================================ */
const ScopedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
    .jp-root *, .jp-root *::before, .jp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .jp-root ::-webkit-scrollbar { width: 4px; height: 4px; }
    .jp-root ::-webkit-scrollbar-track { background: transparent; }
    .jp-root ::-webkit-scrollbar-thumb { background: ${C.dim}; border-radius: 4px; }
    @keyframes jpFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes jpSlideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
    @keyframes jpPulse { 0%,100%{ opacity:1; } 50%{ opacity:.35; } }
    @keyframes jpSlideInLeft { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes jpSlideInRight { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
    .jp-fade-up { animation: jpFadeUp .35s ease both; }
    .jp-slide-left { animation: jpSlideInLeft .22s ease-out both; }
    .jp-slide-right { animation: jpSlideInRight .22s ease-out both; }
    .jp-touch { transition: transform .12s ease, box-shadow .12s ease; }
    .jp-touch:active { transform: scale(.97); }
    .jp-touch:hover { box-shadow: 0 2px 12px rgba(0,0,0,.3); }
  `}</style>
);

/* ================================================================
   PRIMITIVES
   ================================================================ */
const Badge = ({ text, color, icon }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 7px", fontSize: 9, fontFamily: FN, fontWeight: 600,
    color, background: color + "14", border: `1px solid ${color}30`,
    borderRadius: 4, letterSpacing: .4, textTransform: "uppercase", whiteSpace: "nowrap",
  }}>{icon && <span style={{ fontSize: 10 }}>{icon}</span>}{text}</span>
);

const ProgressBar = ({ value, color = C.accent, h = 4 }) => (
  <div style={{ width: "100%", height: h, background: C.faint, borderRadius: h, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, Math.max(0, value))}%`, height: "100%",
      background: `linear-gradient(90deg,${color}88,${color})`,
      borderRadius: h, transition: "width .5s ease",
    }} />
  </div>
);

const Pill = ({ children, active, color = C.accent, onClick }) => (
  <button onClick={onClick} style={{
    padding: "6px 14px", border: `1px solid ${active ? color + "50" : C.border}`,
    borderRadius: 20, background: active ? color + "15" : "transparent",
    color: active ? color : C.mid, fontFamily: FN, fontSize: 10, fontWeight: 600,
    cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", letterSpacing: .3,
  }}>{children}</button>
);

/* ================================================================
   SPARKLINE SVG
   ================================================================ */
const Spark = ({ data, w = 100, h = 28, color = C.accent }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * (h - 4) - 2}`);
  const id = `sf${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r={2} fill={color} />
    </svg>
  );
};

/* ================================================================
   BAR CHART SVG
   ================================================================ */
const BarChart = ({ data, w = 320, h = 120, barColor = C.accent, bar2Color = C.blue }) => {
  const max = Math.max(...data.map(d => Math.max(d.b, d.c)), 1);
  const barW = Math.floor((w - (data.length - 1) * 6) / data.length / 2);
  const gap = 6;
  return (
    <svg width={w} height={h + 20} style={{ display: "block", width: "100%" }} viewBox={`0 0 ${w} ${h + 20}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = i * (barW * 2 + gap);
        const bH = (d.b / max) * (h - 4);
        const cH = (d.c / max) * (h - 4);
        return (
          <g key={i}>
            <rect x={x} y={h - bH} width={barW} height={bH} rx={2} fill={barColor} opacity={.7} />
            <rect x={x + barW + 1} y={h - cH} width={barW} height={cH} rx={2} fill={bar2Color} opacity={.7} />
            <text x={x + barW} y={h + 14} textAnchor="middle" style={{ fontSize: 7, fontFamily: FN, fill: C.dim }}>{d.w.split(" ")[0]}</text>
          </g>
        );
      })}
      <line x1={0} y1={h} x2={w} y2={h} stroke={C.border} strokeWidth={1} />
    </svg>
  );
};

/* ================================================================
   TAB NAV
   ================================================================ */
const TAB_ITEMS = [
  { id: "dash", icon: "\u26A1", label: "Pulse" },
  { id: "jobs", icon: "\uD83D\uDD27", label: "Jobs" },
  { id: "msgs", icon: "\uD83D\uDCAC", label: "Messages" },
  { id: "money", icon: "\uD83D\uDCB0", label: "Revenue" },
];
const TAB_ORDER = { dash: 0, jobs: 1, msgs: 2, money: 3 };

const TabNav = ({ active, onChange, unread }) => (
  <nav style={{
    position: "sticky", top: 0, zIndex: 50,
    background: "rgba(6,6,8,.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
  }}>
    {TAB_ITEMS.map(n => {
      const isActive = active === n.id;
      return (
        <button key={n.id} onClick={() => onChange(n.id)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer", padding: "12px 0",
          position: "relative", borderBottom: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
          transition: "all .2s",
        }}>
          <span style={{ fontSize: 14, filter: isActive ? "none" : "grayscale(1) brightness(.6)", transition: "all .2s" }}>{n.icon}</span>
          <span style={{
            fontFamily: FN, fontSize: 10, fontWeight: isActive ? 700 : 500,
            color: isActive ? C.accent : C.dim, letterSpacing: .6, textTransform: "uppercase",
            transition: "color .2s",
          }}>{n.label}</span>
          {n.id === "msgs" && unread > 0 && (
            <div style={{
              position: "absolute", top: 6, right: "20%", minWidth: 16, height: 16, borderRadius: 8,
              background: C.red, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FN, fontSize: 8, fontWeight: 700, color: "#fff", padding: "0 4px",
            }}>{unread}</div>
          )}
        </button>
      );
    })}
  </nav>
);

/* ================================================================
   HEADER
   ================================================================ */
const Header = ({ clock }) => (
  <header style={{
    background: "rgba(6,6,8,.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: `1px solid ${C.border}`,
    padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}60`, animation: "jpPulse 2s ease infinite" }} />
      <span style={{ fontFamily: FN, fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: 2 }}>JOB PULSE</span>
      <span style={{ fontFamily: FN, fontSize: 9, fontWeight: 700, color: C.accent, background: C.accentBg, padding: "1px 5px", borderRadius: 3 }}>v5</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: FN, fontSize: 10, color: C.mid }}>
        {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
      <span style={{ fontFamily: FN, fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1 }}>
        {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </span>
    </div>
  </header>
);

/* ================================================================
   WEATHER STRIP (supports live + fallback)
   ================================================================ */
const WeatherStrip = ({ weather, isLoading }) => {
  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div style={{
        display: "flex", gap: 4, padding: "10px 8px",
        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
      }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 44, height: 72, borderRadius: 8,
            background: C.faint, animation: "jpPulse 1.5s ease infinite",
            animationDelay: `${i * 100}ms`,
          }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", gap: 4, padding: "10px 8px",
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
      overflow: "auto",
    }}>
      {weather.map((w, i) => {
        const risky = w.precip >= 60;
        const isToday = w.date === today || i === 0;
        return (
          <div key={i} style={{
            flex: 1, minWidth: 46, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "6px 2px", borderRadius: 8,
            background: isToday ? C.accentBg : risky ? C.red + "08" : "transparent",
            border: risky ? `1px solid ${C.red}20` : isToday ? `1px solid ${C.accent}20` : "1px solid transparent",
          }}>
            <span style={{ fontFamily: FN, fontSize: 8, color: isToday ? C.accent : C.dim, fontWeight: isToday ? 700 : 400 }}>{w.day}</span>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{w.icon}</span>
            <span style={{ fontFamily: FN, fontSize: 10, fontWeight: 600, color: C.text }}>{w.hi}\u00B0</span>
            {w.lo != null && <span style={{ fontFamily: FN, fontSize: 8, color: C.dim }}>{w.lo}\u00B0</span>}
            {w.precip > 0 && <span style={{ fontFamily: FN, fontSize: 7, color: risky ? C.red : C.blue }}>{w.precip}%</span>}
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================
   KPI CARD (enhanced with sparkline + trend)
   ================================================================ */
const KpiCard = ({ label, value, sub, color, glow, trend, sparkData, delay = 0 }) => (
  <div className="jp-touch jp-fade-up" style={{
    background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: "14px 14px 10px", position: "relative", overflow: "hidden",
    animationDelay: `${delay}ms`,
  }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: glow || "transparent", opacity: .04, filter: "blur(30px)" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      {trend && (
        <span style={{ fontFamily: FN, fontSize: 9, fontWeight: 700, color: trend.dir === "up" ? C.green : trend.dir === "down" ? C.red : C.mid }}>
          {trend.dir === "up" ? "\u2191" : trend.dir === "down" ? "\u2193" : "\u2192"} {trend.pct}%
        </span>
      )}
    </div>
    <div style={{ fontFamily: FN, fontSize: 22, fontWeight: 800, color, marginTop: 2, lineHeight: 1 }}>{value}</div>
    <span style={{ fontFamily: FN, fontSize: 9, color: C.mid, marginTop: 4, display: "block" }}>{sub}</span>
    {sparkData && sparkData.length > 1 && (
      <div style={{ marginTop: 6 }}>
        <Spark data={sparkData} w={120} h={20} color={color} />
      </div>
    )}
  </div>
);



/* ================================================================
   JOBS TAB
   ================================================================ */
const JobsTab = ({ jobs, onJobSelect }) => {
  const [filter, setFilter] = useState("all");
  const [crewFilter, setCrewFilter] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let f = jobs;
    if (filter !== "all") f = f.filter(j => j.phase === filter);
    if (crewFilter) f = f.filter(j => j.crew === crewFilter);
    return f.sort((a, b) => a.sched.localeCompare(b.sched));
  }, [jobs, filter, crewFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "10px 14px", display: "flex", gap: 6, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>All ({jobs.length})</Pill>
        {PHASES.map(p => {
          const c = jobs.filter(j => j.phase === p.id).length;
          return <Pill key={p.id} active={filter === p.id} color={p.color} onClick={() => setFilter(filter === p.id ? "all" : p.id)}>{p.icon} {p.sh} ({c})</Pill>;
        })}
      </div>
      <div style={{ padding: "6px 14px", display: "flex", gap: 6, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        <Pill active={!crewFilter} onClick={() => setCrewFilter(null)}>All Crews</Pill>
        {CREWS.map(c => (
          <Pill key={c.id} active={crewFilter === c.id} color={c.color} onClick={() => setCrewFilter(crewFilter === c.id ? null : c.id)}>{c.lead}</Pill>
        ))}
      </div>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((j, i) => {
          const ph = phaseMeta(j.phase); const cr = crewMeta(j.crew); const fl = j.flag ? FLAGS[j.flag] : null;
          const isToday = j.sched === today;
          return (
            <div key={j.id} className="jp-touch jp-fade-up" onClick={() => onJobSelect(j)} style={{
              background: C.bgCard, border: `1px solid ${isToday ? ph.color + "30" : C.border}`,
              borderRadius: 12, padding: "14px", cursor: "pointer",
              borderLeft: `4px solid ${ph.color}`,
              animationDelay: `${i * 40}ms`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FS, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>{j.addr}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: FN, fontSize: 9, color: C.dim }}>{j.id}</span>
                    <span style={{ fontFamily: FN, fontSize: 9, color: C.mid }}>{"\u00B7"}</span>
                    <span style={{ fontFamily: FN, fontSize: 9, color: C.mid }}>{j.builder}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FN, fontSize: 16, fontWeight: 800, color: ph.color, lineHeight: 1 }}>{j.progress}%</div>
                  <span style={{ fontFamily: FN, fontSize: 9, color: isToday ? C.accent : C.dim, fontWeight: isToday ? 700 : 400 }}>{schedLabel(j.sched)}</span>
                </div>
              </div>
              <ProgressBar value={j.progress} color={ph.color} h={4} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <Badge text={`${ph.icon} ${ph.label}`} color={ph.color} />
                <Badge text={cr.lead} color={cr.color} />
                <span style={{ fontFamily: FN, fontSize: 10, color: C.green, fontWeight: 600 }}>{fmt$(j.est)}</span>
                {fl && <Badge text={`${fl.icon} ${fl.label}`} color={fl.color} />}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, fontFamily: FN, fontSize: 11, color: C.dim }}>No jobs match filters</div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   JOB DETAIL BOTTOM SHEET
   ================================================================ */
const JobSheet = ({ job, onClose, onUpdate }) => {
  const ph = phaseMeta(job.phase); const cr = crewMeta(job.crew); const fl = job.flag ? FLAGS[job.flag] : null;
  const builder = BUILDERS[job.builder] || {};

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 300 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, maxHeight: "88vh", zIndex: 301,
        background: C.bgCard, borderTop: `2px solid ${ph.color}`,
        borderRadius: "20px 20px 0 0", overflow: "auto",
        animation: "jpSlideUp .3s ease",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>
        <div style={{ padding: "0 18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: FS, fontSize: 20, fontWeight: 800, color: C.text }}>{job.addr}</div>
              <div style={{ fontFamily: FN, fontSize: 10, color: C.mid, marginTop: 2 }}>{job.builder} {"\u00B7"} {job.id}</div>
            </div>
            <button onClick={onClose} style={{ background: C.surface, border: "none", color: C.mid, fontSize: 16, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2715"}</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: FN, fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: .8 }}>Progress</span>
              <span style={{ fontFamily: FN, fontSize: 12, fontWeight: 700, color: ph.color }}>{job.progress}%</span>
            </div>
            <ProgressBar value={job.progress} color={ph.color} h={6} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {PHASES.map(p => (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: p.id === job.phase ? 1 : .25 }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontFamily: FN, fontSize: 7, color: p.id === job.phase ? p.color : C.dim }}>{p.sh}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Crew", value: cr.name, sub: `${cr.members.join(", ")} \u00B7 ${cr.phone}`, color: cr.color },
              { label: "Schedule", value: schedLabel(job.sched), sub: job.sched, color: job.sched === new Date().toISOString().split("T")[0] ? C.accent : C.text },
              { label: "Estimate", value: fmt$(job.est), sub: "", color: C.green },
              { label: "Builder Pay", value: `${builder.pay || "\u2014"}d`, sub: `${builder.onTime || "\u2014"}% on-time`, color: builder.pay <= 15 ? C.green : builder.pay <= 30 ? C.accent : C.red },
            ].map((d, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: .8 }}>{d.label}</span>
                <div style={{ fontFamily: FN, fontSize: 16, fontWeight: 700, color: d.color, marginTop: 3 }}>{d.value}</div>
                {d.sub && <div style={{ fontFamily: FN, fontSize: 9, color: C.mid, marginTop: 2 }}>{d.sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: .8 }}>Notes</span>
            <div style={{ fontFamily: FS, fontSize: 13, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>{job.notes}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 8 }}>Flags</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(FLAGS).map(([k, f]) => (
                <Pill key={k} active={job.flag === k} color={f.color} onClick={() => onUpdate({ ...job, flag: job.flag === k ? null : k })}>{f.icon} {f.label}</Pill>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {PHASES.filter(p => p.id !== job.phase).slice(0, 2).map(p => (
              <button key={p.id} className="jp-touch" onClick={() => onUpdate({ ...job, phase: p.id, progress: Math.min(100, job.progress + 20) })} style={{
                flex: 1, padding: "12px", border: `1px solid ${p.color}40`, borderRadius: 10,
                background: p.color + "10", color: p.color, fontFamily: FN, fontSize: 10,
                fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: .5,
              }}>{`Move to ${p.label}`}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

/* ================================================================
   MESSAGES TAB
   ================================================================ */
const MessagesTab = ({ messages, onMarkRead }) => {
  const [msgFilter, setMsgFilter] = useState("all");
  const [openThread, setOpenThread] = useState(null);

  const filtered = useMemo(() => {
    if (msgFilter === "all") return messages;
    if (msgFilter === "unread") return messages.filter(m => !m.read);
    if (msgFilter === "sms") return messages.filter(m => m.type === "sms");
    if (msgFilter === "email") return messages.filter(m => m.type === "email");
    if (msgFilter === "starred") return messages.filter(m => m.starred);
    return messages;
  }, [messages, msgFilter]);

  if (openThread) {
    const m = openThread;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setOpenThread(null)} style={{ background: "none", border: "none", color: C.accent, fontFamily: FN, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>{`\u2190 Back`}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FS, fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</div>
            {m.subject && <div style={{ fontFamily: FN, fontSize: 9, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>}
          </div>
          <Badge text={m.type.toUpperCase()} color={m.type === "sms" ? C.green : C.blue} />
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {m.thread.map((t, i) => {
            const isMe = t.from === "You";
            return (
              <div key={i} style={{
                maxWidth: "85%", alignSelf: isMe ? "flex-end" : "flex-start",
                background: isMe ? C.accent + "20" : C.surface,
                border: `1px solid ${isMe ? C.accent + "30" : C.border}`,
                borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                padding: "10px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: FN, fontSize: 9, fontWeight: 700, color: isMe ? C.accent : C.sub }}>{t.from}</span>
                  <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, marginLeft: 12 }}>{t.time}</span>
                </div>
                <div style={{ fontFamily: FS, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{t.body}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, padding: "10px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: FS, fontSize: 12, color: C.dim }}>Type a reply...</div>
          <button style={{ padding: "10px 16px", background: C.accent, border: "none", borderRadius: 10, fontFamily: FN, fontSize: 10, fontWeight: 700, color: C.bg, cursor: "pointer" }}>Send</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "10px 14px", display: "flex", gap: 6, overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "all", label: `All (${messages.length})` },
          { id: "unread", label: `Unread (${messages.filter(m => !m.read).length})` },
          { id: "sms", label: "SMS" },
          { id: "email", label: "Email" },
          { id: "starred", label: "\u2B50" },
        ].map(f => (
          <Pill key={f.id} active={msgFilter === f.id} color={f.id === "unread" ? C.red : C.accent} onClick={() => setMsgFilter(f.id)}>{f.label}</Pill>
        ))}
      </div>
      <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map((m, i) => (
          <div key={m.id} className="jp-touch jp-fade-up" onClick={() => {
            if (!m.read) onMarkRead(m.id);
            setOpenThread(m);
          }} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 14px", cursor: "pointer",
            background: m.read ? C.bgCard : C.bgCardHi,
            border: `1px solid ${m.read ? C.border : C.borderHi}`, borderRadius: 10,
            borderLeft: `3px solid ${m.type === "sms" ? C.green : C.blue}`,
            animationDelay: `${i * 30}ms`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: m.type === "sms" ? C.green + "15" : C.blue + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, border: `1px solid ${m.type === "sms" ? C.green + "30" : C.blue + "30"}`,
            }}>{m.type === "sms" ? "\uD83D\uDCF1" : "\u2709\uFE0F"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: FS, fontSize: 13, fontWeight: m.read ? 500 : 700, color: C.text }}>{m.from}</span>
                  {!m.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />}
                  {m.starred && <span style={{ fontSize: 10 }}>{"\u2B50"}</span>}
                </div>
                <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, whiteSpace: "nowrap" }}>{m.time}</span>
              </div>
              {m.subject && <div style={{ fontFamily: FS, fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>}
              <div style={{ fontFamily: FS, fontSize: 11, color: C.mid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.preview}</div>
              {m.labels && (
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {m.labels.slice(0, 3).map(l => (
                    <span key={l} style={{ fontFamily: FN, fontSize: 7, color: C.dim, background: C.faint, padding: "1px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: .5 }}>{l}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, fontFamily: FN, fontSize: 11, color: C.dim }}>No messages</div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   REVENUE TAB
   ================================================================ */
const RevenueTab = ({ jobs }) => {
  const billed = REV.reduce((s, r) => s + r.b, 0);
  const collected = REV.reduce((s, r) => s + r.c, 0);
  const outstanding = billed - collected;
  const pipeline = jobs.reduce((s, j) => s + j.est, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 14px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Billed (7wk)", value: fmt$(billed), color: C.accent, spark: REV.map(r => r.b) },
          { label: "Collected", value: fmt$(collected), color: C.green, spark: REV.map(r => r.c) },
          { label: "Outstanding", value: fmt$(outstanding), color: outstanding > 0 ? C.orange : C.green },
          { label: "Pipeline", value: fmt$(pipeline), color: C.blue },
        ].map((kpi, i) => (
          <div key={i} className="jp-fade-up" style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "14px", animationDelay: `${i * 60}ms`,
          }}>
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>{kpi.label}</span>
            <div style={{ fontFamily: FN, fontSize: 20, fontWeight: 800, color: kpi.color, marginTop: 4, lineHeight: 1 }}>{kpi.value}</div>
            {kpi.spark && <div style={{ marginTop: 8 }}><Spark data={kpi.spark} w={120} h={24} color={kpi.color} /></div>}
          </div>
        ))}
      </div>

      <div className="jp-fade-up" style={{
        padding: "14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
        animationDelay: "280ms",
      }}>
        <span style={{ fontFamily: FN, fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, display: "block" }}>Weekly Billed vs Collected</span>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.accent, opacity: .7 }} />
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim }}>Billed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.blue, opacity: .7 }} />
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim }}>Collected</span>
          </div>
        </div>
        <BarChart data={REV} />
      </div>

      <div className="jp-fade-up" style={{
        padding: "14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
        animationDelay: "360ms",
      }}>
        <span style={{ fontFamily: FN, fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "block" }}>{"\uD83C\uDFD7"} Builder Breakdown</span>
        {Object.entries(BUILDERS).map(([name, b]) => {
          const builderJobs = jobs.filter(j => j.builder === name);
          const builderEst = builderJobs.reduce((s, j) => s + j.est, 0);
          const payColor = b.pay <= 15 ? C.green : b.pay <= 30 ? C.accent : C.red;
          return (
            <div key={name} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FS, fontSize: 13, fontWeight: 700, color: C.text }}>{name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: FN, fontSize: 9, color: C.dim }}>{builderJobs.length} jobs</span>
                  <span style={{ fontFamily: FN, fontSize: 9, color: C.dim }}>{"\u00B7"}</span>
                  <span style={{ fontFamily: FN, fontSize: 9, color: C.green }}>{fmt$(builderEst)}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FN, fontSize: 12, fontWeight: 700, color: payColor }}>{b.pay}d pay</div>
                <div style={{ fontFamily: FN, fontSize: 9, color: b.onTime >= 80 ? C.green : b.onTime >= 70 ? C.accent : C.red }}>{b.onTime}% on-time</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="jp-fade-up" style={{
        padding: "14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
        animationDelay: "440ms",
      }}>
        <span style={{ fontFamily: FN, fontSize: 10, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "block" }}>{"\uD83D\uDC77"} Crew Load</span>
        {CREWS.map(cr => {
          const crewJobs = jobs.filter(j => j.crew === cr.id);
          const crewEst = crewJobs.reduce((s, j) => s + j.est, 0);
          const avgProgress = crewJobs.length ? Math.round(crewJobs.reduce((s, j) => s + j.progress, 0) / crewJobs.length) : 0;
          return (
            <div key={cr.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: FS, fontSize: 12, fontWeight: 700, color: cr.color }}>{cr.name}</span>
                  <span style={{ fontFamily: FN, fontSize: 9, color: C.dim }}>{crewJobs.length} jobs</span>
                </div>
                <span style={{ fontFamily: FN, fontSize: 11, fontWeight: 700, color: C.green }}>{fmt$(crewEst)}</span>
              </div>
              <ProgressBar value={avgProgress} color={cr.color} h={4} />
              <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, marginTop: 2, display: "block" }}>{avgProgress}% avg progress</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================
   MAIN DASHBOARD
   ================================================================ */
export default function Dashboard() {
  const [tab, setTab] = useState("dash");
  const [clock, setClock] = useState(new Date());
  const [jobs, setJobs] = useState(JOBS_DATA);
  const [messages, setMessages] = useState(MESSAGES_DATA);
  const [selectedJob, setSelectedJob] = useState(null);
  const [slideClass, setSlideClass] = useState("jp-fade-up");
  const prevTab = useRef("dash");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Weather from backend (NWS proxy)
  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ["weather-forecast"],
    queryFn: () => api.weather.getForecast(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Dashboard stats from backend
  const { data: dashStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const weather = weatherData || WEATHER_FALLBACK;

  // Tab transitions
  const handleTabChange = useCallback((newTab) => {
    if (newTab === tab) return;
    const dir = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? "left" : "right";
    setSlideClass(dir === "left" ? "jp-slide-left" : "jp-slide-right");
    prevTab.current = newTab;
    setTab(newTab);
  }, [tab]);

  const handleUpdateJob = useCallback((updated) => {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
    setSelectedJob(updated);
  }, []);

  const handleMarkRead = useCallback((id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }, []);

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="jp-root" style={{
      background: C.bg, minHeight: "100%",
      display: "flex", flexDirection: "column",
      fontFamily: FS, color: C.text,
    }}>
      <ScopedStyles />
      <Header clock={clock} />
      <TabNav active={tab} onChange={handleTabChange} unread={unread} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div key={tab} className={slideClass}>
          {tab === "dash" && (
            <JobPulseHome
              jobs={jobs}
              messages={messages}
              weather={weather}
              weatherLoading={weatherLoading}
              dashStats={dashStats}
              onJobSelect={setSelectedJob}
              onNavChange={handleTabChange}
            />
          )}
          {tab === "jobs" && (
            <JobsTab
              jobs={jobs}
              onJobSelect={setSelectedJob}
            />
          )}
          {tab === "msgs" && (
            <MessagesTab
              messages={messages}
              onMarkRead={handleMarkRead}
            />
          )}
          {tab === "money" && (
            <RevenueTab jobs={jobs} />
          )}
        </div>
      </div>

      {selectedJob && (
        <JobSheet
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
        />
      )}
    </div>
  );
}
