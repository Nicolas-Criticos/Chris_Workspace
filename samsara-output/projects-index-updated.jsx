/**
 * src/pages/projects/index.jsx
 *
 * Projects page — supports three view modes:
 *   "field"    → interactive node/field view (default)
 *   "table"    → ProjectDashboardTable
 *   "calendar" → ProjectCalendarView
 *
 * viewMode replaces the old dashboardOpen boolean.
 * RealmSwitch receives onViewModeChange(mode: string) instead of onDashboardToggle.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import ProjectDashboardTable from "../../components/projects/ProjectDashboardTable/ProjectDashboardTable.jsx";
import ProjectCalendarView from "../../components/projects/ProjectCalendarView/ProjectCalendarView.jsx";
import RealmSwitch from "../../components/projects/RealmSwitch/RealmSwitch.jsx";
import ProjectNodes from "../../components/projects/ProjectNodes/ProjectNodes.jsx";

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      timeline,
      image_url,
      status,
      roles_needed,
      chinese_new_year,
      created_by,
      realm,
      archived,
      created_at,
      inspiration_link,
      profiles:created_by ( full_name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p) => ({
    ...p,
    created_by_name: p.profiles?.full_name ?? "—",
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const navigate = useNavigate();

  // "field" | "table" | "calendar"
  const [viewMode, setViewMode] = useState("field");

  // Which realm is active (used by field/nodes view)
  const [activeRealm, setActiveRealm] = useState(null);

  // isVrisch derived from activeRealm; adjust this logic to match your app's convention
  const isVrisch = activeRealm === "vrischgewagt";

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 2, // 2 min
  });

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleProjectClick = useCallback(
    (project) => {
      navigate(`/projects/${project.id}`);
    },
    [navigate]
  );

  // ─── Loading / Error States ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className={`relative flex h-screen w-full items-center justify-center ${
          isVrisch ? "bg-[rgba(8,8,8,0.95)]" : "bg-[rgba(255,252,247,0.95)]"
        }`}
      >
        <div
          className={`text-sm opacity-50 ${
            isVrisch ? "text-[rgba(238,233,224,0.8)]" : "text-[rgba(43,43,43,0.7)]"
          }`}
        >
          Loading projects…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`relative flex h-screen w-full flex-col items-center justify-center gap-4 ${
          isVrisch ? "bg-[rgba(8,8,8,0.95)]" : "bg-[rgba(255,252,247,0.95)]"
        }`}
      >
        <div className="text-sm text-red-500 opacity-80">
          Failed to load projects: {error?.message ?? "Unknown error"}
        </div>
        <button
          onClick={refetch}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            isVrisch
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-[rgba(122,112,94,0.15)] text-[rgba(43,43,43,0.85)] hover:bg-[rgba(122,112,94,0.25)]"
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <div
      className={`relative h-screen w-full overflow-hidden ${
        isVrisch
          ? "bg-[rgba(8,8,8,0.95)] text-[rgba(238,233,224,0.92)]"
          : "bg-[rgba(255,252,247,0.95)] text-[rgba(43,43,43,0.86)]"
      }`}
    >
      {/* Realm switcher — always visible, controls viewMode and realm */}
      <RealmSwitch
        activeRealm={activeRealm}
        onRealmChange={setActiveRealm}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isVrisch={isVrisch}
      />

      {/* ── Field / Node View ── */}
      {viewMode === "field" && (
        <ProjectNodes
          projects={projects}
          activeRealm={activeRealm}
          isVrisch={isVrisch}
          onProjectClick={handleProjectClick}
        />
      )}

      {/* ── Table View ── */}
      {viewMode === "table" && (
        <ProjectDashboardTable
          projects={projects}
          isVrisch={isVrisch}
        />
      )}

      {/* ── Calendar View ── */}
      {viewMode === "calendar" && (
        <ProjectCalendarView
          projects={projects}
          isVrisch={isVrisch}
          onProjectClick={handleProjectClick}
        />
      )}
    </div>
  );
}
