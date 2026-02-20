import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

/* ================================================================
   JOB PULSE HOME v6 - Enhanced Command Center
   - Smart alerts & notifications
   - Quick action dock
   - Live crew tracking
   - Priority job cards
   - Material & inspection alerts
   ================================================================ */

/* -- THEME -- */
const C = {
  bg: "#060608",
  bgCard: "#0E0F12",
  bgCardHi: "#151720",
  surface: "#1A1C24",
  surfaceHi: "#22252F",
  border: "rgba(255,255,255,.06)",
  borderHi: "rgba(255,255,255,.12)",
  text: "#EDE9E0",
  sub: "#A8A29E",
  mid: "#78716C",
  dim: "#44403C",
  faint: "#1C1917",
  accent: "#E5A31E",
  accentMute: "#A37514",
  accentBg: "rgba(229,163,30,.08)",
  green: "#34D399",
  greenMute: "#059669",
  greenBg: "rgba(52,211,153,.08)",
  blue: "#38BDF8",
  blueMute: "#0284C7",
  blueBg: "rgba(56,189,248,.08)",
  red: "#F87171",
  redMute: "#B91C1C",
  redBg: "rgba(248,113,113,.08)",
  orange: "#FB923C",
  purple: "#A78BFA",
  pink: "#F472B6",
};
const FN = "'JetBrains Mono','IBM Plex Mono',monospace";
const FS = "'DM Sans',-apple-system,system-ui,sans-serif";

/* -- DATA CONSTANTS -- */
const PHASES = [
  { id: "underground", label: "Underground", sh: "UG", icon: "⛏", color: "#92700C", desc: "Rough grade, sewer/water taps" },
  { id: "roughin", label: "Rough-In", sh: "RI", icon: "🔧", color: C.accent, desc: "Top out walls, rough fixtures" },
  { id: "topout", label: "Top-Out", sh: "TO", icon: "📐", color: C.blue, desc: "Set water heater, final tests" },
  { id: "trim", label: "Trim", sh: "TR", icon: "🚿", color: "#2DD4BF", desc: "Install fixtures, final connections" },
  { id: "final", label: "Final", sh: "FN", icon: "✅", color: C.green, desc: "Walk through, punch list" },
];

const CREWS = [
  { id: "A", name: "Team Alpha", lead: "Marco", members: ["Marco", "Luis"], phone: "(817) 555-0142", color: C.accent, status: "on-site", location: "4821 Westridge Dr" },
  { id: "B", name: "Team Bravo", lead: "Carlos", members: ["Carlos", "Javi"], phone: "(817) 555-0198", color: C.blue, status: "traveling", location: "En route to Magnolia" },
  { id: "C", name: "Team Charlie", lead: "Danny", members: ["Danny", "Mike"], phone: "(817) 555-0231", color: C.green, status: "break", location: "Lunch break" },
];

const FLAGS = {
  material: { label: "Material Hold", icon: "📦", color: C.orange, urgency: "medium" },
  inspection: { label: "Inspection", icon: "🔍", color: C.purple, urgency: "high" },
  weather: { label: "Weather Risk", icon: "⛈", color: C.blue, urgency: "medium" },
  change: { label: "Change Order", icon: "📝", color: C.red, urgency: "high" },
  permit: { label: "Permit Issue", icon: "📋", color: C.pink, urgency: "high" },
};

const WEATHER_FALLBACK = [
  { day: "Wed", dt: 18, hi: 62, lo: 41, icon: "☀️", precip: 0, forecast: "Sunny" },
  { day: "Thu", dt: 19, hi: 58, lo: 38, icon: "⛅", precip: 10, forecast: "Partly Cloudy" },
  { day: "Fri", dt: 20, hi: 52, lo: 34, icon: "🌧️", precip: 80, forecast: "Rain" },
  { day: "Sat", dt: 21, hi: 48, lo: 30, icon: "🌧️", precip: 60, forecast: "Showers" },
  { day: "Sun", dt: 22, hi: 55, lo: 33, icon: "⛅", precip: 15, forecast: "Partly Cloudy" },
  { day: "Mon", dt: 23, hi: 64, lo: 42, icon: "☀️", precip: 0, forecast: "Sunny" },
  { day: "Tue", dt: 24, hi: 68, lo: 45, icon: "☀️", precip: 0, forecast: "Sunny" },
];

/* -- HELPERS -- */
const fmt$ = (n) => "$" + n.toLocaleString();
const phaseMeta = (id) => PHASES.find((p) => p.id === id) || PHASES[0];
const crewMeta = (id) => CREWS.find((c) => c.id === id) || CREWS[0];
const dayDiff = (d, ref) => {
  const today = ref || new Date().toISOString().split("T")[0];
  const a = new Date(d + "T00:00:00"),
    b = new Date(today + "T00:00:00");
  return Math.round((a - b) / 864e5);
};
const schedLabel = (d, ref) => {
  const diff = dayDiff(d, ref);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff}d`;
};

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

const Badge = ({ text, color, icon, size = "sm" }) => {
  const sizes = {
    sm: { padding: "2px 7px", fontSize: 9, iconSize: 10 },
    md: { padding: "4px 10px", fontSize: 10, iconSize: 12 },
    lg: { padding: "6px 14px", fontSize: 11, iconSize: 14 },
  };
  const s = sizes[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: FN,
        fontWeight: 600,
        color,
        background: color + "14",
        border: `1px solid ${color}30`,
        borderRadius: 4,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <span style={{ fontSize: s.iconSize }}>{icon}</span>}
      {text}
    </span>
  );
};

const ProgressRing = ({ value, color = C.accent, size = 48, stroke = 4 }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.faint} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
};

const ProgressBar = ({ value, color = C.accent, h = 4, animated = false }) => (
  <div style={{ width: "100%", height: h, background: C.faint, borderRadius: h, overflow: "hidden" }}>
    <div
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: "100%",
        background: `linear-gradient(90deg,${color}88,${color})`,
        borderRadius: h,
        transition: animated ? "width 1s ease-out" : "width 0.3s ease",
      }}
    />
  </div>
);

const QuickAction = ({ icon, label, onClick, color = C.accent, badge = null }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "12px 8px",
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      cursor: "pointer",
      transition: "all 0.15s",
      position: "relative",
      minWidth: 72,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = color + "50";
      e.currentTarget.style.background = color + "08";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.background = C.bgCard;
    }}
  >
    <span style={{ fontSize: 24 }}>{icon}</span>
    <span
      style={{
        fontFamily: FN,
        fontSize: 9,
        fontWeight: 600,
        color: C.sub,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </span>
    {badge && (
      <div
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          background: C.red,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FN,
          fontSize: 9,
          fontWeight: 700,
          color: "#fff",
          padding: "0 5px",
        }}
      >
        {badge}
      </div>
    )}
  </button>
);

const AlertCard = ({ type, title, message, action, onAction, time }) => {
  const config = {
    urgent: { color: C.red, bg: C.redBg, icon: "🚨" },
    warning: { color: C.orange, bg: "rgba(251,146,60,.08)", icon: "⚠️" },
    info: { color: C.blue, bg: C.blueBg, icon: "ℹ️" },
    success: { color: C.green, bg: C.greenBg, icon: "✅" },
  }[type] || config.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        background: config.bg,
        border: `1px solid ${config.color}20`,
        borderRadius: 10,
        borderLeft: `3px solid ${config.color}`,
      }}
    >
      <span style={{ fontSize: 18 }}>{config.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
          <span style={{ fontFamily: FS, fontSize: 12, fontWeight: 700, color: C.text }}>{title}</span>
          {time && (
            <span style={{ fontFamily: FN, fontSize: 8, color: C.dim }}>{time}</span>
          )}
        </div>
        <p style={{ fontFamily: FS, fontSize: 11, color: C.sub, lineHeight: 1.4, margin: 0 }}>{message}</p>
        {action && (
          <button
            onClick={onAction}
            style={{
              marginTop: 8,
              padding: "4px 10px",
              background: config.color + "15",
              border: `1px solid ${config.color}30`,
              borderRadius: 6,
              fontFamily: FN,
              fontSize: 9,
              fontWeight: 600,
              color: config.color,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
};

const CrewStatusCard = ({ crew }) => {
  const statusColors = {
    "on-site": C.green,
    traveling: C.blue,
    break: C.orange,
    off: C.dim,
  };
  const statusIcons = {
    "on-site": "🔨",
    traveling: "🚚",
    break: "☕",
    off: "😴",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: crew.color + "15",
          border: `2px solid ${crew.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FN,
          fontSize: 14,
          fontWeight: 700,
          color: crew.color,
        }}
      >
        {crew.id}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: FS, fontSize: 12, fontWeight: 700, color: C.text }}>{crew.name}</span>
          <span style={{ fontFamily: FN, fontSize: 8, color: statusColors[crew.status], textTransform: "uppercase" }}>
            {statusIcons[crew.status]} {crew.status}
          </span>
        </div>
        <span style={{ fontFamily: FN, fontSize: 9, color: C.mid, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {crew.location}
        </span>
      </div>
      <a
        href={`tel:${crew.phone}`}
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: C.green + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          textDecoration: "none",
        }}
      >
        📞
      </a>
    </div>
  );
};

const WeatherMini = ({ weather, isLoading }) => {
  if (isLoading) {
    return (
      <div style={{ display: "flex", gap: 8, padding: "10px 0" }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 8,
              background: C.faint,
              animation: "pulse 1.5s ease infinite",
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", gap: 6, overflow: "auto", padding: "2px 0" }}>
      {weather.slice(0, 5).map((w, i) => {
        const risky = w.precip >= 60;
        const isToday = i === 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 56,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 4px",
              borderRadius: 10,
              background: isToday ? C.accentBg : risky ? C.redBg : "transparent",
              border: isToday ? `1px solid ${C.accent}30` : risky ? `1px solid ${C.red}20` : `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontFamily: FN, fontSize: 8, color: isToday ? C.accent : C.dim, fontWeight: isToday ? 700 : 400 }}>
              {isToday ? "Today" : w.day}
            </span>
            <span style={{ fontSize: 20 }}>{w.icon}</span>
            <span style={{ fontFamily: FN, fontSize: 10, fontWeight: 700, color: C.text }}>{w.hi}°</span>
            {w.precip > 0 && (
              <span style={{ fontFamily: FN, fontSize: 7, color: risky ? C.red : C.blue }}>{w.precip}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const PriorityJobCard = ({ job, onClick }) => {
  const ph = phaseMeta(job.phase);
  const cr = crewMeta(job.crew);
  const fl = job.flag ? FLAGS[job.flag] : null;
  const isToday = job.sched === new Date().toISOString().split("T")[0];
  const isOverdue = dayDiff(job.sched) < 0;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px",
        background: C.bgCard,
        border: `1px solid ${isToday ? ph.color + "40" : isOverdue ? C.red + "40" : C.border}`,
        borderRadius: 12,
        borderLeft: `4px solid ${isOverdue ? C.red : ph.color}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bgCardHi;
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.bgCard;
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div style={{ position: "relative" }}>
        <ProgressRing value={job.progress} color={ph.color} size={44} stroke={3} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FN,
            fontSize: 11,
            fontWeight: 700,
            color: ph.color,
          }}
        >
          {job.progress}%
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: FS,
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {job.addr}
          </span>
          {fl && <span style={{ fontSize: 14 }} title={fl.label}>{fl.icon}</span>}
          {isOverdue && <Badge text="OVERDUE" color={C.red} size="sm" />}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Badge text={`${ph.icon} ${ph.sh}`} color={ph.color} size="sm" />
          <span style={{ fontFamily: FN, fontSize: 9, color: cr.color }}>{cr.lead}</span>
          <span style={{ fontFamily: FN, fontSize: 9, color: C.green, fontWeight: 600 }}>{fmt$(job.est)}</span>
          <span
            style={{
              fontFamily: FN,
              fontSize: 9,
              color: isToday ? C.accent : isOverdue ? C.red : C.dim,
              fontWeight: isToday || isOverdue ? 700 : 400,
            }}
          >
            {isToday ? "📅 TODAY" : schedLabel(job.sched)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function JobPulseHome({ jobs, messages, weather, weatherLoading, dashStats, onJobSelect, onNavChange }) {
  const today = new Date().toISOString().split("T")[0];

  // Computed data
  const todayJobs = useMemo(() => jobs.filter((j) => j.sched === today), [jobs, today]);
  const overdueJobs = useMemo(() => jobs.filter((j) => dayDiff(j.sched) < 0 && j.progress < 100), [jobs]);
  const flaggedJobs = useMemo(() => jobs.filter((j) => j.flag), [jobs]);
  const unreadMsgs = useMemo(() => messages.filter((m) => !m.read), [messages]);
  const pipeline = dashStats?.pipelineValue || jobs.reduce((s, j) => s + j.est, 0);

  // Priority sorting for job list
  const priorityJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => {
        // Sort: Overdue > Today > Flagged > Others
        const aOverdue = dayDiff(a.sched) < 0 ? 3 : 0;
        const bOverdue = dayDiff(b.sched) < 0 ? 3 : 0;
        const aToday = a.sched === today ? 2 : 0;
        const bToday = b.sched === today ? 2 : 0;
        const aFlag = a.flag ? 1 : 0;
        const bFlag = b.flag ? 1 : 0;
        return bOverdue + bToday + bFlag - (aOverdue + aToday + aFlag);
      })
      .slice(0, 5);
  }, [jobs, today]);

  // Generate smart alerts
  const alerts = useMemo(() => {
    const list = [];
    if (overdueJobs.length > 0) {
      list.push({
        type: "urgent",
        title: `${overdueJobs.length} Overdue Job${overdueJobs.length > 1 ? "s" : ""}`,
        message: overdueJobs.map((j) => j.addr).join(", "),
        action: "View All",
        onAction: () => onNavChange("jobs"),
      });
    }
    if (flaggedJobs.some((j) => j.flag === "inspection")) {
      list.push({
        type: "warning",
        title: "Inspection Required",
        message: `${flaggedJobs.filter((j) => j.flag === "inspection").length} job(s) waiting for inspection`,
        action: "Schedule",
      });
    }
    if (flaggedJobs.some((j) => j.flag === "material")) {
      list.push({
        type: "info",
        title: "Material Hold",
        message: "Parts on order for " + flaggedJobs.find((j) => j.flag === "material")?.addr,
        action: "Check Status",
      });
    }
    if (weather?.[0]?.precip >= 60) {
      list.push({
        type: "warning",
        title: "Weather Alert",
        message: `${weather[0].precip}% chance of rain today. Consider rescheduling outdoor work.`,
      });
    }
    return list;
  }, [overdueJobs, flaggedJobs, weather, onNavChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px", paddingBottom: 100 }}>
      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((alert, i) => (
            <AlertCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Actions Dock */}
      <div>
        <span
          style={{
            fontFamily: FN,
            fontSize: 10,
            fontWeight: 700,
            color: C.dim,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
            display: "block",
          }}
        >
          Quick Actions
        </span>
        <div style={{ display: "flex", gap: 10, overflow: "auto", padding: "2px 0" }}>
          <QuickAction icon="➕" label="New Job" onClick={() => {}} />
          <QuickAction icon="📋" label="Schedule" onClick={() => onNavChange("jobs")} />
          <QuickAction icon="💬" label="Messages" onClick={() => onNavChange("msgs")} badge={unreadMsgs.length > 0 ? unreadMsgs.length : null} />
          <QuickAction icon="📊" label="Reports" onClick={() => onNavChange("money")} />
          <QuickAction icon="👥" label="Crews" onClick={() => {}} />
          <QuickAction icon="⚙️" label="Settings" onClick={() => {}} />
        </div>
      </div>

      {/* Weather */}
      <div
        style={{
          padding: "14px",
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span
            style={{
              fontFamily: FN,
              fontSize: 10,
              fontWeight: 700,
              color: C.dim,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            🌤️ Weather Forecast
          </span>
          {weather !== undefined && weather[0]?.forecast && (
            <span style={{ fontFamily: FN, fontSize: 9, color: C.sub }}>{weather[0].forecast}</span>
          )}
        </div>
        <WeatherMini weather={weather || WEATHER_FALLBACK} isLoading={weatherLoading} />
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Today", value: todayJobs.length, sub: "jobs scheduled", color: C.accent, icon: "📅" },
          { label: "Pipeline", value: fmt$(pipeline), sub: "total value", color: C.green, icon: "💰" },
          { label: "Unread", value: unreadMsgs.length, sub: "messages", color: C.blue, icon: "✉️" },
          { label: "Flagged", value: flaggedJobs.length, sub: "need attention", color: C.orange, icon: "🚩" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "12px 8px",
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              textAlign: "center",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = stat.color + "40";
              e.currentTarget.style.background = stat.color + "08";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.bgCard;
            }}
            onClick={() => {
              if (stat.label === "Today" || stat.label === "Flagged") onNavChange("jobs");
              if (stat.label === "Unread") onNavChange("msgs");
              if (stat.label === "Pipeline") onNavChange("money");
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontFamily: FN, fontSize: 16, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontFamily: FN, fontSize: 7, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Priority Jobs */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span
            style={{
              fontFamily: FN,
              fontSize: 10,
              fontWeight: 700,
              color: C.dim,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            ⚡ Priority Jobs
          </span>
          <button
            onClick={() => onNavChange("jobs")}
            style={{
              fontFamily: FN,
              fontSize: 9,
              color: C.accent,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            View All →
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {priorityJobs.length > 0 ? (
            priorityJobs.map((job) => <PriorityJobCard key={job.id} job={job} onClick={() => onJobSelect(job)} />)
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                fontFamily: FN,
                fontSize: 11,
                color: C.dim,
                background: C.bgCard,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}
            >
              No jobs scheduled
            </div>
          )}
        </div>
      </div>

      {/* Crew Status */}
      <div>
        <span
          style={{
            fontFamily: FN,
            fontSize: 10,
            fontWeight: 700,
            color: C.dim,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
            display: "block",
          }}
        >
          👥 Crew Status
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CREWS.map((crew) => (
            <CrewStatusCard key={crew.id} crew={crew} />
          ))}
        </div>
      </div>

      {/* Recent Messages Preview */}
      {unreadMsgs.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span
              style={{
                fontFamily: FN,
                fontSize: 10,
                fontWeight: 700,
                color: C.dim,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              💬 Recent Messages
            </span>
            <button
              onClick={() => onNavChange("msgs")}
              style={{
                fontFamily: FN,
                fontSize: 9,
                color: C.accent,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Inbox →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {unreadMsgs.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onNavChange("msgs")}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: C.bgCardHi,
                  border: `1px solid ${C.borderHi}`,
                  borderRadius: 10,
                  borderLeft: `3px solid ${m.type === "sms" ? C.green : C.blue}`,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: m.type === "sms" ? C.green + "15" : C.blue + "15",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {m.type === "sms" ? "📱" : "✉️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontFamily: FS, fontSize: 12, fontWeight: 700, color: C.text }}>{m.from}</span>
                    <span style={{ fontFamily: FN, fontSize: 8, color: C.dim }}>{m.time}</span>
                  </div>
                  <div style={{ fontFamily: FS, fontSize: 11, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Pipeline */}
      <div
        style={{
          padding: "14px",
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
        }}
      >
        <span
          style={{
            fontFamily: FN,
            fontSize: 10,
            fontWeight: 700,
            color: C.dim,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
            display: "block",
          }}
        >
          🔄 Pipeline by Phase
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {PHASES.map((p) => {
            const count = jobs.filter((j) => j.phase === p.id).length;
            const maxC = Math.max(...PHASES.map((ph) => jobs.filter((j) => j.phase === ph.id).length), 1);
            return (
              <div key={p.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: FN, fontSize: 16, fontWeight: 800, color: p.color }}>{count}</span>
                <div
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 6,
                    position: "relative",
                    overflow: "hidden",
                    background: C.faint,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${(count / maxC) * 100}%`,
                      background: `linear-gradient(180deg,${p.color},${p.color}44)`,
                      borderRadius: 6,
                      transition: "height 0.5s ease",
                      minHeight: count > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <span style={{ fontFamily: FN, fontSize: 8, color: C.dim, textTransform: "uppercase" }}>{p.sh}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
