import Footer from "./components/Footer";
import { useMemo, useState } from "react";
import {
  Home,
  Map as MapIcon,
  Settings as SettingsIcon,
  BarChart3,
  Plus,
  Search,
  Shield,
  Trash2,
  MapPin,
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
  Info,
} from "lucide-react";
import { useWatchTowerData } from "./lib/useWatchTowerData";
import { useAuth } from "./lib/useAuth";
import { CATEGORY_LIST } from "./lib/categories";
import IncidentCard from "./components/IncidentCard";
import ReportModal from "./components/ReportModal";
import MapView from "./components/MapView";
import AuthModal from "./components/AuthModal";

type View = "feed" | "map" | "zones" | "analytics" | "about";

const NAV: { id: View; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "map", label: "Live Map", icon: MapIcon },
  { id: "zones", label: "Watch Zones", icon: SettingsIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "about", label: "About", icon: Info },
];

export default function App() {
  const auth = useAuth();
  const data = useWatchTowerData(auth.user?.id ?? null);
  const [view, setView] = useState<View>("feed");
  const [activeZip, setActiveZip] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("active");

  const zoneOptions = data.zones;

  // ✅ Fixed: Now properly filters incidents based on user's watch zones
    const filteredIncidents = useMemo(() => {
  let list = [...data.incidents];

  if (activeZip) {
    list = list.filter((i) => i.zip_code === activeZip);
  } else if (data.zones.length > 0) {
    const watchedZips = data.zones.map((z) => z.zip_code);
    list = list.filter((i) => watchedZips.includes(i.zip_code));
  }

  // Status + Search filters...
  if (statusFilter !== "all") {
    list = list.filter((i) => i.status === statusFilter);
  }
if (search.trim()) {
  const q = search.toLowerCase();
  list = list.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      (i.description || "").toLowerCase().includes(q) ||
      (i.location_description || "").toLowerCase().includes(q) ||
      i.zip_code.includes(q)
  );
}

  return list;
}, [data.incidents, data.zones, activeZip, statusFilter, search]);

  const activeCount = data.incidents.filter((i) => i.status === "active").length;
  const resolvedCount = data.incidents.filter((i) => i.status === "resolved").length;

  const handleSignOut = async () => {
    await auth.signOut();
    setStatusFilter("active");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/40 backdrop-blur-sm md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900">
    <Shield size={20} />
  </span>
  <div>
    <h1 className="text-base font-semibold tracking-tight text-white">SafeLoudoun</h1>
    <p className="text-[11px] text-slate-400">Real-time neighborhood safety</p>
  </div>
</div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          {auth.user ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-semibold text-white">
                    {(data.profile?.display_name || auth.user.email || "N").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {data.profile?.display_name || "Neighbor"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {data.profile?.karma ?? 0} karma · {zoneOptions.length} zones
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-slate-200"
            >
              <LogIn size={16} /> Sign in
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-md md:px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 md:hidden">
            <Shield size={16} />
          </span>

          {view === "feed" && (
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts, locations, zip…"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-slate-600 focus:ring-2 focus:ring-slate-700/30"
              />
            </div>
          )}

          {view !== "feed" && (
            <h2 className="text-base font-semibold text-white md:text-lg">
              {NAV.find((n) => n.id === view)?.label}
            </h2>
          )}

          <div className="ml-auto flex items-center gap-2">
            {!auth.user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:bg-slate-800 md:hidden"
              >
                <LogIn size={16} />
              </button>
            )}
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-slate-200 md:px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">File a Report</span>
            </button>
          </div>
        </header>

        {/* Zip Filter Bar */}
        {view !== "zones" && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4 py-2.5 md:px-6">
            <button
  onClick={() => setActiveZip(null)}
  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
    activeZip === null
      ? "border-white bg-white text-slate-900"
      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
  }`}
>
  All Zip Codes
</button>

            {zoneOptions.map((z) => {
              const active = activeZip === z.zip_code;
              return (
                <button
                  key={z.zip_code}
                  onClick={() => setActiveZip(active ? null : z.zip_code)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "border-white bg-white text-slate-900"
                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                  }`}
                >
                  <MapPin size={11} />
                  {z.zip_code}
                  {z.label && <span className="opacity-60">· {z.label}</span>}
                </button>
              );
            })}

            {zoneOptions.length === 0 && (
              <span className="text-xs text-slate-500">
                No zones yet — add one in Watch Zones to start filtering.
              </span>
            )}
          </div>
        )}

        {/* Content */}
                {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
                    {data.loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-slate-500">Loading your community…</div>
            </div>
          ) : data.error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-red-400">{data.error}</div>
            </div>
          ) : view === "feed" ? (
            <FeedView
              incidents={filteredIncidents}
              comments={data.comments}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onResolve={data.resolveIncident}
              onVerify={data.verifyIncident}
              onComment={data.addComment}
              authorName={data.profile?.display_name || "Neighbor"}
            />
          ) : view === "map" ? (
            <div className="h-[calc(100vh-13rem)] w-full overflow-hidden rounded-2xl border border-slate-800 md:h-[calc(100vh-9.5rem)]">
              <MapView incidents={filteredIncidents} activeZip={activeZip} onResolve={data.resolveIncident} />
            </div>
          ) : view === "zones" ? (
            <ZonesView
              zones={data.zones}
              karma={data.profile?.karma ?? 0}
              displayName={data.profile?.display_name || ""}
              onAddZone={data.addZone}
              onRemoveZone={data.removeZone}
              onUpdateName={data.updateProfileName}
            />
          ) : view === "analytics" ? (
            <AnalyticsView
              incidents={activeZip ? filteredIncidents : data.incidents}
              activeCount={activeCount}
              resolvedCount={resolvedCount}
              zones={data.zones}
            />
          ) : view === "about" ? (
            // ==================== ABOUT PAGE ====================
            <div className="mx-auto max-w-2xl p-6 space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">About SafeLoudoun</h1>
                <p className="text-slate-400">
                  SafeLoudoun is a community-driven safety platform that helps neighbors
                  stay informed and look out for each other in real time. While we designed this app for Loudoun, we designed it to work in any U.S. community.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">How it works</h2>
                <ul className="space-y-2 text-slate-300 list-disc list-inside">
                  <li>Neighbors post reports about local incidents</li>
                  <li>Others can verify reports and add updates</li>
                  <li>Everyone sees incidents only in their watch zones</li>
                  <li>Earn karma by contributing to your community</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Our Mission</h2>
                <p className="text-slate-300">
                  We believe that safer neighborhoods start with better information.
                  By sharing what we see, we can all look out for each other.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">About Us</h2>
                <p className="text-slate-300">
                  You may be wondering, “What exactly is this project?” To answer your question, SafeLoudoun is a project created for the Step Up Loudoun Youth Competition by 9th graders Aarmaan Pahuja and Aditya Ghosh, along with 7th graders Abhir Pahuja and Ayaan Priyal.
We all live in communities where neighbors look out for each other, but we noticed that there was not an easy way for people to quickly share important local updates. Whether it is an unattended package, a lost pet, suspicious activity, vandalism, or a request for a safe walk, important information can easily go unnoticed. We wanted to create a platform that helps communities stay connected, informed, and safer.
SafeLoudoun is a real-time neighborhood safety platform where residents can report and track local incidents within their community. Users can view active reports, receive updates, communicate through comments, verify incidents, and monitor specific watch zones that matter to them. By making it easier for neighbors to work together, SafeLoudoun helps communities respond faster and support each other.
However, technology alone cannot create a safer community. SafeLoudoun is designed to encourage awareness, responsibility, and cooperation between neighbors. The goal is not to expose problems, but to give communities the tools they need to help one another and prevent small issues from becoming bigger ones.
Through this project, we hope to show how technology can bring people together and create stronger, more connected neighborhoods.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ✅ Footer added here */}
        <Footer />

        {/* Mobile Bottom Nav */}
        <nav className="flex items-stretch border-t border-slate-800 bg-slate-900/95 backdrop-blur-md md:hidden">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-all duration-200 ${
                  active ? "text-white" : "text-slate-500"
                }`}
              >
                <Icon size={20} className={active ? "text-white" : "text-slate-500"} />
                {n.label}
              </button>
            );
          })}
        </nav>
      </main>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        zones={zoneOptions}
        onSubmit={data.addIncident}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
      />
    </div>
  );
}

/* ---------- Feed View ---------- */
function FeedView({
  incidents,
  comments,
  statusFilter,
  setStatusFilter,
  onResolve,
  onVerify,
  onComment,
  authorName,
}: {
  incidents: ReturnType<typeof useWatchTowerData>["incidents"];
  comments: ReturnType<typeof useWatchTowerData>["comments"];
  statusFilter: "all" | "active" | "resolved";
  setStatusFilter: (s: "all" | "active" | "resolved") => void;
  onResolve: ReturnType<typeof useWatchTowerData>["resolveIncident"];
  onVerify: ReturnType<typeof useWatchTowerData>["verifyIncident"];
  onComment: (incidentId: string, body: string, authorName: string) => Promise<unknown>;
  authorName: string;
}) {
  const tabs: { id: "active" | "resolved" | "all"; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "resolved", label: "Resolved" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              statusFilter === t.id
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{incidents.length} alerts</span>
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
          <Shield size={32} className="text-slate-700" />
          <p className="mt-3 text-sm text-slate-400">No alerts here yet.</p>
          <p className="text-xs text-slate-600">Be the first to file a report in this community.</p>
        </div>
      ) : (
        incidents.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            comments={comments}
            onResolve={onResolve}
            onVerify={onVerify}
            onComment={onComment}
            authorName={authorName}
          />
        ))
      )}
    </div>
  );
}

/* ---------- Zones View ---------- */
function ZonesView({
  zones,
  karma,
  displayName,
  onAddZone,
  onRemoveZone,
  onUpdateName,
}: {
  zones: ReturnType<typeof useWatchTowerData>["zones"];
  karma: number;
  displayName: string;
  onAddZone: ReturnType<typeof useWatchTowerData>["addZone"];
  onRemoveZone: ReturnType<typeof useWatchTowerData>["removeZone"];
  onUpdateName: ReturnType<typeof useWatchTowerData>["updateProfileName"];
}) {
  const [zip, setZip] = useState("");
  const [label, setLabel] = useState("");
  const [name, setName] = useState(displayName);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const validZip = /^\d{5}$/.test(zip);

  const add = async () => {
    if (!validZip) return;
    setBusy(true);
    setErr(null);
    try {
      await onAddZone(zip, label.trim());
      setZip("");
      setLabel("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add zone");
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    if (name.trim() === displayName) return;
    setBusy(true);
    try {
      await onUpdateName(name.trim() || "Neighbor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Karma */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/40 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <TrendingUp size={26} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Neighbor Karma Score</p>
            <p className="mt-0.5 text-3xl font-bold text-white">{karma}</p>
            <p className="text-xs text-slate-500">+10 for every report you file</p>
          </div>
        </div>
      </div>

      {/* Profile Name */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Your identity</h3>
        <p className="mt-0.5 text-xs text-slate-500">Shown on comments you post.</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-slate-500"
          />
          <button
            onClick={saveName}
            disabled={busy}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-slate-200 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {/* Add Zone */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Add a new watch zone</h3>
        <p className="mt-0.5 text-xs text-slate-500">Monitor any US zip code community.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Zip code (5 digits)"
            inputMode="numeric"
            className={`flex-1 rounded-lg border bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-slate-700/30 ${
              zip && !validZip ? "border-red-500/50" : "border-slate-700 focus:border-slate-500"
            }`}
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Home, Work)"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-slate-500"
          />
          <button
            onClick={add}
            disabled={!validZip || busy}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-all duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} /> Add
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
      </div>

      {/* Zone List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Your watch zones</h3>
        {zones.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No zones yet. Add one above to start monitoring a community.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                  <MapPin size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{z.zip_code}</p>
                  {z.label && <p className="text-xs text-slate-500">{z.label}</p>}
                </div>
                <button
                  onClick={() => onRemoveZone(z.id)}
                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition-all duration-200 hover:bg-red-500/20"
                >
                  <Trash2 size={13} /> Leave
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Analytics View ---------- */
function AnalyticsView({
  incidents,
  activeCount,
  resolvedCount,
  zones,
}: {
  incidents: ReturnType<typeof useWatchTowerData>["incidents"];
  activeCount: number;
  resolvedCount: number;
  zones: ReturnType<typeof useWatchTowerData>["zones"];
}) {
  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of incidents) counts[i.category] = (counts[i.category] || 0) + 1;
    return CATEGORY_LIST.map((c) => ({ meta: c, count: counts[c.id] || 0 })).sort((a, b) => b.count - a.count);
  }, [incidents]);

  const byZip = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of incidents) counts[i.zip_code] = (counts[i.zip_code] || 0) + 1;
    return Object.entries(counts)
      .map(([zip, count]) => ({ zip, count }))
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));
  const maxZip = Math.max(1, ...byZip.map((z) => z.count));

  const stats = [
    { label: "Total Reports", value: incidents.length, icon: Activity, tint: "text-sky-300 bg-sky-500/15" },
    { label: "Active Alerts", value: activeCount, icon: Clock, tint: "text-red-300 bg-red-500/15" },
    { label: "Resolved", value: resolvedCount, icon: ShieldCheck, tint: "text-emerald-300 bg-emerald-500/15" },
    { label: "Watch Zones", value: zones.length, icon: MapPin, tint: "text-amber-300 bg-amber-500/15" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tint}`}>
                <Icon size={18} />
              </span>
              <p className="mt-3 text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Reports by category</h3>
        <div className="mt-4 space-y-3">
          {byCategory.map((c) => {
            const Icon = c.meta.icon;
            return (
              <div key={c.meta.id} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${c.meta.badge}`}>
                  <Icon size={15} />
                </span>
                <span className="w-32 shrink-0 truncate text-xs text-slate-300">{c.meta.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(c.count / maxCat) * 100}%`, backgroundColor: c.meta.pinColor }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium text-slate-400">{c.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Reports by zip code</h3>
        <div className="mt-4 space-y-3">
          {byZip.length === 0 ? (
            <p className="text-xs text-slate-500">No data yet.</p>
          ) : (
            byZip.map((z) => (
              <div key={z.zip} className="flex items-center gap-3">
                <span className="flex h-8 w-14 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-xs font-medium text-slate-300">
                  {z.zip}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-slate-400 transition-all duration-500"
                    style={{ width: `${(z.count / maxZip) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium text-slate-400">{z.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
