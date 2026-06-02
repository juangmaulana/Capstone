import { Activity, BarChart3, CalendarDays, LineChart as LineChartIcon, Sprout } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type PieLabelRenderProps,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;
const YEARS = ["2026", "2025", "2024"] as const;
const ALL_SPECIES = "all";
const AGGREGATE_COLOR = "hsl(122, 46%, 33%)";

type SpeciesKey = "vachellia" | "ageratum" | "lantana" | "clitoria" | "merremia";
type MonthlyValues = readonly (number | null)[];

type SpeciesDefinition = {
  key: SpeciesKey;
  label: string;
  color: string;
};

type DiversityDatum = SpeciesDefinition & {
  value: number;
  percentage: number;
  percentageLabel: string;
};

const SPECIES: SpeciesDefinition[] = [
  { key: "vachellia", label: "Vachellia nilotica", color: "hsl(0, 66%, 47%)" },
  { key: "ageratum", label: "Ageratum conyzoides", color: "hsl(122, 46%, 33%)" },
  { key: "lantana", label: "Lantana camara", color: "hsl(212, 79%, 42%)" },
  { key: "clitoria", label: "Clitoria ternatea", color: "hsl(35, 91%, 46%)" },
  { key: "merremia", label: "Merremia hederacea", color: "hsl(271, 81%, 56%)" },
];

const MONTHLY_OBSERVATIONS: Record<(typeof YEARS)[number], Record<SpeciesKey, MonthlyValues>> = {
  "2026": {
    vachellia: [30, 34, 39, 43, 46, 51, null, null, null, null, null, null],
    ageratum: [45, 49, 56, 61, 68, 73, null, null, null, null, null, null],
    lantana: [18, 20, 22, 25, 28, 31, null, null, null, null, null, null],
    clitoria: [35, 39, 43, 48, 52, 57, null, null, null, null, null, null],
    merremia: [14, 16, 18, 20, 22, 25, null, null, null, null, null, null],
  },
  "2025": {
    vachellia: [24, 28, 31, 35, 38, 42, 45, 49, 53, 57, 61, 66],
    ageratum: [36, 40, 45, 50, 54, 59, 64, 70, 76, 82, 88, 95],
    lantana: [15, 17, 19, 22, 24, 27, 29, 32, 35, 38, 41, 45],
    clitoria: [28, 31, 35, 39, 43, 47, 51, 56, 61, 66, 71, 77],
    merremia: [11, 13, 14, 16, 18, 20, 22, 24, 26, 29, 31, 34],
  },
  "2024": {
    vachellia: [20, 22, 25, 27, 30, 33, 36, 39, 42, 45, 48, 52],
    ageratum: [31, 34, 38, 42, 46, 50, 55, 60, 65, 70, 76, 82],
    lantana: [12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39],
    clitoria: [24, 27, 30, 33, 36, 40, 44, 48, 52, 56, 61, 66],
    merremia: [9, 10, 12, 13, 15, 17, 19, 21, 23, 25, 27, 30],
  },
};

const COPY = {
  en: {
    title: "Analytics Overview",
    subtitle: "Invasive species monitoring dashboard",
    year: "Year",
    species: "Species",
    allSpecies: "All species",
    totalObservations: "Total observations",
    observedSpecies: "Observed species",
    monthlyAverage: "Monthly average",
    monthlyTrend: "Monthly observation trend",
    trendContextAll: "All species combined",
    yAxis: "Number of observations",
    yAxisShort: "Observations",
    speciesTotal: "Total by species",
    composition: "Species composition",
    observations: "observations",
    barView: "Show bar chart",
    lineView: "Show line chart",
  },
  id: {
    title: "Ringkasan Analitik",
    subtitle: "Dashboard pemantauan spesies invasif",
    year: "Tahun",
    species: "Spesies",
    allSpecies: "Semua spesies",
    totalObservations: "Total observasi",
    observedSpecies: "Spesies terpantau",
    monthlyAverage: "Rata-rata bulanan",
    monthlyTrend: "Tren observasi per bulan",
    trendContextAll: "Gabungan semua spesies",
    yAxis: "Jumlah observasi",
    yAxisShort: "Observasi",
    speciesTotal: "Total per spesies",
    composition: "Komposisi spesies",
    observations: "observasi",
    barView: "Tampilkan diagram batang",
    lineView: "Tampilkan diagram garis",
  },
} as const;

const tooltipStyle = {
  background: "hsl(0, 0%, 100%)",
  border: "1px solid hsl(150, 14%, 88%)",
  borderRadius: 6,
  fontSize: 12,
};

const RADIAN = Math.PI / 180;

const renderPercentageLabel = ({ cx, cy, innerRadius, outerRadius, midAngle, payload }: PieLabelRenderProps) => {
  const datum = payload as DiversityDatum | undefined;
  if (!datum || datum.percentage < 8) return null;

  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.56;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-white text-[10px] font-bold"
      paintOrder="stroke"
      stroke="hsl(150, 20%, 12%)"
      strokeWidth={2}
    >
      {datum.percentageLabel}
    </text>
  );
};

export function AnalyticsPanel() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [selectedYear, setSelectedYear] = useState<(typeof YEARS)[number]>("2026");
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesKey | typeof ALL_SPECIES>(ALL_SPECIES);
  const [trendMode, setTrendMode] = useState<"bar" | "line">("line");
  const [activeDiversityIndex, setActiveDiversityIndex] = useState<number | null>(null);

  const selectedSpeciesDefinition = SPECIES.find((species) => species.key === selectedSpecies);
  const trendColor = selectedSpeciesDefinition?.color ?? AGGREGATE_COLOR;

  const speciesTotals = useMemo(
    () =>
      SPECIES.map((species) => ({
        ...species,
        value: MONTHLY_OBSERVATIONS[selectedYear][species.key].reduce<number>(
          (sum, value) => sum + (value ?? 0),
          0,
        ),
      })),
    [selectedYear],
  );

  const totalObservations = speciesTotals.reduce((sum, species) => sum + species.value, 0);
  const visibleMonths = MONTHLY_OBSERVATIONS[selectedYear].vachellia.filter((value) => value !== null).length;
  const selectedObservationTotal =
    selectedSpeciesDefinition
      ? speciesTotals.find((species) => species.key === selectedSpeciesDefinition.key)?.value ?? 0
      : totalObservations;
  const monthlyAverage = visibleMonths > 0 ? Math.round(selectedObservationTotal / visibleMonths) : 0;

  const trendData = useMemo(
    () =>
      MONTHS.map((month, monthIndex) => {
        const values = SPECIES.map((species) => MONTHLY_OBSERVATIONS[selectedYear][species.key][monthIndex]);
        const hasObservation = values.some((value) => value !== null);
        const value = selectedSpeciesDefinition
          ? MONTHLY_OBSERVATIONS[selectedYear][selectedSpeciesDefinition.key][monthIndex]
          : hasObservation
            ? values.reduce<number>((sum, item) => sum + (item ?? 0), 0)
            : null;

        return { month, value };
      }),
    [selectedSpeciesDefinition, selectedYear],
  );

  const diversityData: DiversityDatum[] = speciesTotals.map((species) => {
    const percentage = totalObservations > 0 ? (species.value / totalObservations) * 100 : 0;
    return { ...species, percentage, percentageLabel: `${percentage.toFixed(1)}%` };
  });

  const chartTooltip = (
    <Tooltip
      formatter={(value) => [`${Number(value).toLocaleString("id-ID")} ${copy.observations}`, copy.yAxis]}
      contentStyle={tooltipStyle}
    />
  );

  const stats = [
    { label: copy.totalObservations, value: selectedObservationTotal.toLocaleString("id-ID"), icon: Activity },
    { label: copy.observedSpecies, value: selectedSpeciesDefinition ? "1" : String(SPECIES.length), icon: Sprout },
    { label: copy.monthlyAverage, value: monthlyAverage.toLocaleString("id-ID"), icon: CalendarDays },
  ];

  return (
    <div className="flex h-full flex-col gap-3 p-4 lg:p-5">
      <div className="flex flex-col gap-3 border-b pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{copy.title}</h1>
          <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="grid gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
            {copy.year}
            <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value as (typeof YEARS)[number])}>
              <SelectTrigger className="h-8 min-w-24 bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
            {copy.species}
            <Select value={selectedSpecies} onValueChange={(value) => setSelectedSpecies(value as SpeciesKey | typeof ALL_SPECIES)}>
              <SelectTrigger className="h-8 min-w-48 bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SPECIES}>{copy.allSpecies}</SelectItem>
                {SPECIES.map((species) => <SelectItem key={species.key} value={species.key}>{species.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold leading-5 text-card-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase text-muted-foreground">{copy.monthlyTrend}</h2>
            <p className="text-xs text-foreground">{selectedSpeciesDefinition?.label ?? copy.trendContextAll}</p>
          </div>
          <div className="flex rounded-md border bg-background p-0.5">
            <button
              type="button"
              title={copy.lineView}
              aria-label={copy.lineView}
              aria-pressed={trendMode === "line"}
              onClick={() => setTrendMode("line")}
              className={`grid h-7 w-7 place-items-center rounded-sm transition-colors ${trendMode === "line" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LineChartIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={copy.barView}
              aria-label={copy.barView}
              aria-pressed={trendMode === "bar"}
              onClick={() => setTrendMode("bar")}
              className={`grid h-7 w-7 place-items-center rounded-sm transition-colors ${trendMode === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={236}>
          {trendMode === "line" ? (
            <LineChart data={trendData} margin={{ top: 28, right: 10, left: 18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 14%, 88%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(150, 10%, 45%)"
                width={72}
                label={{ value: copy.yAxisShort, angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              {chartTooltip}
              <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2.5} dot={{ r: 3, fill: trendColor }} connectNulls={false} />
            </LineChart>
          ) : (
            <BarChart data={trendData} margin={{ top: 28, right: 10, left: 18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 14%, 88%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(150, 10%, 45%)"
                width={72}
                label={{ value: copy.yAxisShort, angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              {chartTooltip}
              <Bar dataKey="value" fill={trendColor} radius={[3, 3, 0, 0]} maxBarSize={34} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className="rounded-lg border bg-card p-3 shadow-sm">
          <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{copy.speciesTotal}</h2>
          <ResponsiveContainer width="100%" height={226}>
            <BarChart data={speciesTotals} layout="vertical" margin={{ top: 8, right: 40, left: 4, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 14%, 88%)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="hsl(150, 10%, 45%)"
                label={{ value: copy.yAxis, position: "insideBottom", offset: -8, fontSize: 11 }}
              />
              <YAxis dataKey="label" type="category" width={116} tick={{ fontSize: 10 }} stroke="hsl(150, 10%, 45%)" />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} ${copy.observations}`, copy.yAxis]} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {speciesTotals.map((species) => (
                  <Cell
                    key={species.key}
                    fill={species.color}
                    opacity={selectedSpecies === ALL_SPECIES || selectedSpecies === species.key ? 1 : 0.24}
                  />
                ))}
                <LabelList dataKey="value" position="right" className="fill-foreground text-[11px] font-semibold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border bg-card p-3 shadow-sm">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">{copy.composition}</h2>
          <ResponsiveContainer width="100%" height={172}>
            <PieChart>
              <Pie
                data={diversityData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                label={renderPercentageLabel}
                labelLine={false}
                onMouseEnter={(_, index) => setActiveDiversityIndex(index)}
                onMouseLeave={() => setActiveDiversityIndex(null)}
              >
                {diversityData.map((species, index) => (
                  <Cell
                    key={species.key}
                    fill={species.color}
                    opacity={selectedSpecies === ALL_SPECIES || selectedSpecies === species.key ? 1 : 0.24}
                    stroke={activeDiversityIndex === index ? "hsl(0, 0%, 100%)" : undefined}
                    strokeWidth={activeDiversityIndex === index ? 3 : 0}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, item) => [`${Number(value).toLocaleString("id-ID")} (${item.payload.percentageLabel})`, name]}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid gap-1">
            {diversityData.map((species) => (
              <div
                key={species.key}
                className={`flex items-center gap-2 text-[11px] ${selectedSpecies === ALL_SPECIES || selectedSpecies === species.key ? "text-foreground" : "text-muted-foreground opacity-60"}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: species.color }} />
                <span className="min-w-0 flex-1 truncate">{species.label}</span>
                <span className="font-semibold tabular-nums">{species.percentageLabel}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
