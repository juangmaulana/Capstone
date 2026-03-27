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
  { species: "A. mangium", count: 156 },
  { species: "L. camara", count: 234 },
  { species: "M. micrantha", count: 89 },
  { species: "C. odorata", count: 178 },
  { species: "S. molesta", count: 67 },
];

const diversityData = [
  { name: "Invasive", value: 35 },
  { name: "Native", value: 45 },
  { name: "Unknown", value: 20 },
];

const PIE_COLORS = [
  "hsl(0, 66%, 47%)",
  "hsl(122, 46%, 33%)",
  "hsl(212, 79%, 42%)",
];

const stats = [
  { label: "Total Observations", value: "1,847", icon: Activity, trend: "+12%" },
  { label: "Active Spread Zones", value: "24", icon: AlertTriangle, trend: "+3" },
  { label: "High Risk Species", value: "8", icon: Bug, trend: "-1" },
  { label: "Growth Rate", value: "14.2%", icon: TrendingUp, trend: "+2.1%" },
];

export function AnalyticsPanel() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h2 className="panel-header">Analytics Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
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
        <p className="panel-header mb-3 text-xs">Growth Trend</p>
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
        <p className="panel-header mb-3 text-xs">Species Abundance</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={abundanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,14%,88%)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(150,10%,45%)" />
            <YAxis dataKey="species" type="category" tick={{ fontSize: 10 }} width={75} stroke="hsl(150,10%,45%)" />
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
        <p className="panel-header mb-3 text-xs">Species Diversity</p>
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
        <p className="panel-header mb-3 text-xs">Overall Risk Level</p>
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-warning to-destructive transition-all"
              style={{ width: "68%" }}
            />
          </div>
          <div className="flex w-full justify-between text-[11px] text-muted-foreground">
            <span>Low</span>
            <span className="font-semibold text-warning">Moderate-High (68%)</span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
