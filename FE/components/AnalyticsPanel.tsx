import { TrendingUp, AlertTriangle, Bug, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScientificNameWithAuthor } from "@/lib/plant/scientific-name-author";

const growthData = [
  { month: "Aug", obs: 120 },
  { month: "Sep", obs: 180 },
  { month: "Oct", obs: 250 },
  { month: "Nov", obs: 310 },
  { month: "Dec", obs: 280 },
  { month: "Jan", obs: 420 },
  { month: "Feb", obs: 390 },
];

const abundanceData = [
  { species: getScientificNameWithAuthor("Vachellia nilotica"), count: 156 },
  { species: getScientificNameWithAuthor("Ageratum conyzoides"), count: 234 },
  { species: getScientificNameWithAuthor("Lantana camara"), count: 89 },
  { species: getScientificNameWithAuthor("Clitoria ternatea"), count: 178 },
  { species: getScientificNameWithAuthor("Merremia hederacea"), count: 67 },
];

const PIE_COLORS = [
  "hsl(0, 66%, 47%)",
  "hsl(122, 46%, 33%)",
  "hsl(212, 79%, 42%)",
];

const ANALYTICS_COPY = {
  en: {
    title: "Analytics Overview",
    growthTrend: "Growth Trend",
    speciesAbundance: "Species Abundance",
    speciesDiversity: "Species Diversity",
    overallRisk: "Overall Risk Level",
    low: "Low",
    critical: "Critical",
    moderateHigh: "Moderate-High (68%)",
    diversity: ["Invasive", "Native", "Unknown"],
    stats: [
      { label: "Total Observations", value: "1,847", icon: Activity, trend: "+12%" },
      { label: "Active Spread Zones", value: "24", icon: AlertTriangle, trend: "+3" },
      { label: "High Risk Species", value: "8", icon: Bug, trend: "-1" },
      { label: "Growth Rate", value: "14.2%", icon: TrendingUp, trend: "+2.1%" },
    ],
  },
  id: {
    title: "Ringkasan Analitik",
    growthTrend: "Tren Pertumbuhan",
    speciesAbundance: "Kelimpahan Spesies",
    speciesDiversity: "Keanekaragaman Spesies",
    overallRisk: "Tingkat Risiko Keseluruhan",
    low: "Rendah",
    critical: "Kritis",
    moderateHigh: "Sedang-Tinggi (68%)",
    diversity: ["Invasif", "Asli", "Tidak Diketahui"],
    stats: [
      { label: "Total Observasi", value: "1,847", icon: Activity, trend: "+12%" },
      { label: "Zona Sebaran Aktif", value: "24", icon: AlertTriangle, trend: "+3" },
      { label: "Spesies Risiko Tinggi", value: "8", icon: Bug, trend: "-1" },
      { label: "Laju Pertumbuhan", value: "14.2%", icon: TrendingUp, trend: "+2.1%" },
    ],
  },
} as const;

export function AnalyticsPanel() {
  const { language } = useLanguage();
  const copy = ANALYTICS_COPY[language];
  const diversityData = copy.diversity.map((name, index) => ({
    name,
    value: [35, 45, 20][index],
  }));

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h2 className="panel-header">{copy.title}</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {copy.stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-card-foreground">{s.value}</span>
              <span className="text-xs text-primary">{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Trend */}
      <div className="stat-card">
        <p className="panel-header mb-3 text-xs">{copy.growthTrend}</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,14%,88%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(150,10%,45%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(150,10%,45%)" />
            <Tooltip
              contentStyle={{
                background: "hsl(0,0%,100%)",
                border: "1px solid hsl(150,14%,88%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="obs"
              stroke="hsl(122,46%,33%)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Abundance */}
      <div className="stat-card">
        <p className="panel-header mb-3 text-xs">{copy.speciesAbundance}</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={abundanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,14%,88%)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(150,10%,45%)" />
            <YAxis dataKey="species" type="category" tick={{ fontSize: 10 }} width={235} stroke="hsl(150,10%,45%)" />
            <Tooltip
              contentStyle={{
                background: "hsl(0,0%,100%)",
                border: "1px solid hsl(150,14%,88%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="hsl(212,79%,42%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Diversity */}
      <div className="stat-card">
        <p className="panel-header mb-3 text-xs">{copy.speciesDiversity}</p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={diversityData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {diversityData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(0,0%,100%)",
                border: "1px solid hsl(150,14%,88%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4">
          {diversityData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Meter */}
      <div className="stat-card">
        <p className="panel-header mb-3 text-xs">{copy.overallRisk}</p>
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-warning to-destructive transition-all"
              style={{ width: "68%" }}
            />
          </div>
          <div className="flex w-full justify-between text-[11px] text-muted-foreground">
            <span>{copy.low}</span>
            <span className="font-semibold text-warning">{copy.moderateHigh}</span>
            <span>{copy.critical}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
