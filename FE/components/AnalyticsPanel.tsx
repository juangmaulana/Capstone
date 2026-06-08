import { Activity, BarChart3, CalendarDays, LineChart as LineChartIcon, MapPinned, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { fetchLocationStats, type LocationStats } from "@/lib/map-observations";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;
const DEFAULT_YEARS = ["2026", "2025", "2024"] as const;
const ALL_SPECIES = "all";
const AGGREGATE_COLOR = "hsl(122, 46%, 33%)";

type SpeciesKey = "vachellia" | "ageratum" | "lantana" | "clitoria" | "merremia";
type MonthlyObservations = Record<string, Record<SpeciesKey, (number | null)[]>>;

type SpeciesDefinition = {
  key: SpeciesKey;
  label: string;
  color: string;
  plantId?: number;
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

type IdentificationAnalytics = {
  total: number;
  monthly: Array<{
    month: number;
    count: number;
  }>;
  species: Array<{
    plantId: number;
    count: number;
  }>;
};

type PlantRecord = {
  id: number;
  scientificName?: string;
  scientific_name?: string;
};

const getSpeciesKey = (speciesName: string): SpeciesKey | null => {
  const normalized = speciesName.toLowerCase();
  if (normalized.includes("vachellia")) return "vachellia";
  if (normalized.includes("ageratum")) return "ageratum";
  if (normalized.includes("lantana")) return "lantana";
  if (normalized.includes("clitoria")) return "clitoria";
  if (normalized.includes("merremia")) return "merremia";
  return null;
};

const createEmptySpeciesMonthlyObservations = () =>
  Object.fromEntries(
    SPECIES.map((species) => [species.key, Array.from({ length: 12 }, () => null) as (number | null)[]])
  ) as Record<SpeciesKey, (number | null)[]>;

const createEmptyMonthlyObservations = (years: readonly string[] = DEFAULT_YEARS): MonthlyObservations =>
  Object.fromEntries(years.map((year) => [year, createEmptySpeciesMonthlyObservations()]));

const sortYearsDescending = (years: string[]) =>
  Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));

const EMPTY_ANALYTICS: IdentificationAnalytics = {
  total: 0,
  monthly: [],
  species: [],
};

const buildMonthlyObservationsFromAnalytics = (analytics: IdentificationAnalytics, speciesKey: SpeciesKey) => {
  const nextObservations = createEmptySpeciesMonthlyObservations();

  analytics.monthly.forEach((item) => {
    const monthIndex = item.month - 1;
    if (monthIndex < 0 || monthIndex >= MONTHS.length) return;
    nextObservations[speciesKey][monthIndex] = item.count;
  });

  return nextObservations;
};

const fetchIdentificationAnalytics = async (year: string, plantId?: number): Promise<IdentificationAnalytics> => {
  const params = new URLSearchParams({ year });
  if (plantId !== undefined) params.set("plantId", String(plantId));

  const response = await fetch(`/api/v1/identifications/analytics?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch identification analytics");

  const json = await response.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch identification analytics");

  return {
    total: Number(json.data?.total ?? 0),
    monthly: Array.isArray(json.data?.monthly) ? json.data.monthly : [],
    species: Array.isArray(json.data?.species) ? json.data.species : [],
  };
};

const fetchPlantRecords = async (): Promise<PlantRecord[]> => {
  const response = await fetch("/api/v1/plants?limit=100");
  if (!response.ok) return [];

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
};

const mergeSpeciesWithPlants = (plants: PlantRecord[]) => {
  const plantIdBySpecies = new Map<SpeciesKey, number>();

  plants.forEach((plant) => {
    const speciesName = plant.scientificName || plant.scientific_name || "";
    const speciesKey = getSpeciesKey(speciesName);
    if (speciesKey) plantIdBySpecies.set(speciesKey, plant.id);
  });

  return SPECIES.map((species) => ({
    ...species,
    plantId: plantIdBySpecies.get(species.key),
  }));
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
    monitoredLocations: "Monitored locations",
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
    monitoredLocations: "Lokasi terpantau",
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
  const [availableYears, setAvailableYears] = useState<string[]>([...DEFAULT_YEARS]);
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_YEARS[0]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesKey | typeof ALL_SPECIES>(ALL_SPECIES);
  const [trendMode, setTrendMode] = useState<"bar" | "line">("line");
  const [activeDiversityIndex, setActiveDiversityIndex] = useState<number | null>(null);
  const [monthlyObservations, setMonthlyObservations] = useState<MonthlyObservations>(() => createEmptyMonthlyObservations());
  const [analyticsData, setAnalyticsData] = useState<IdentificationAnalytics>(EMPTY_ANALYTICS);
  const [speciesDefinitions, setSpeciesDefinitions] = useState<SpeciesDefinition[]>(SPECIES);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null);
  const selectedYearObservations = monthlyObservations[selectedYear] ?? createEmptySpeciesMonthlyObservations();

  const selectedSpeciesDefinition = speciesDefinitions.find((species) => species.key === selectedSpecies);
  const trendColor = selectedSpeciesDefinition?.color ?? AGGREGATE_COLOR;

  const speciesTotals = useMemo(
    () =>
      speciesDefinitions.map((species) => ({
        ...species,
        value: analyticsData.species.find((item) => item.plantId === species.plantId)?.count ?? 0,
      })),
    [analyticsData.species, speciesDefinitions],
  );

  const totalObservations = speciesTotals.reduce((sum, species) => sum + species.value, 0);
  const visibleMonths = analyticsData.monthly.length;
  const selectedObservationTotal =
    selectedSpeciesDefinition
      ? analyticsData.total
      : totalObservations || analyticsData.total;
  const monthlyAverage = visibleMonths > 0 ? Math.round(selectedObservationTotal / visibleMonths) : 0;

  const trendData = useMemo(
    () =>
      MONTHS.map((month, monthIndex) => {
        const value = selectedYearObservations[selectedSpeciesDefinition?.key ?? "vachellia"][monthIndex];
        return { month, value };
      }),
    [selectedSpeciesDefinition?.key, selectedYearObservations],
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
    { label: copy.observedSpecies, value: selectedSpeciesDefinition ? "1" : String(speciesTotals.filter((species) => species.value > 0).length), icon: Sprout },
    { label: copy.monitoredLocations, value: (locationStats?.totalLocations ?? 0).toLocaleString("id-ID"), icon: MapPinned },
    { label: copy.monthlyAverage, value: monthlyAverage.toLocaleString("id-ID"), icon: CalendarDays },
  ];

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchPlantRecords(), fetchLocationStats()]).then(([plants, nextLocationStats]) => {
      if (!isMounted) return;
      const nextSpeciesDefinitions = mergeSpeciesWithPlants(plants);
      setSpeciesDefinitions(nextSpeciesDefinitions);
      setAvailableYears(sortYearsDescending([...DEFAULT_YEARS, String(new Date().getFullYear())]));
      setLocationStats(nextLocationStats);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const selectedPlantId = selectedSpeciesDefinition?.plantId;

    fetchIdentificationAnalytics(selectedYear, selectedPlantId)
      .then((analytics) => {
        if (!isMounted) return;
        setAnalyticsData(analytics);
        const targetSpeciesKey = selectedSpeciesDefinition?.key ?? "vachellia";
        setMonthlyObservations((current) => ({
          ...current,
          [selectedYear]: buildMonthlyObservationsFromAnalytics(analytics, targetSpeciesKey),
        }));
      })
      .catch((error) => {
        console.error("Failed to fetch identification analytics:", error);
        if (!isMounted) return;
        setAnalyticsData(EMPTY_ANALYTICS);
        setMonthlyObservations((current) => ({
          ...current,
          [selectedYear]: createEmptySpeciesMonthlyObservations(),
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSpeciesDefinition?.key, selectedSpeciesDefinition?.plantId, selectedYear]);

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
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 min-w-24 bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
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
                {speciesDefinitions.map((species) => <SelectItem key={species.key} value={species.key}>{species.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
