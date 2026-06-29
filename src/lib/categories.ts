import {
  DoorOpen,
  Package,
  PawPrint,
  Hammer,
  Eye,
  Footprints,
  type LucideIcon,
} from "lucide-react";
import type { IncidentCategory } from "./supabase";

export interface CategoryMeta {
  id: IncidentCategory;
  label: string;
  icon: LucideIcon;
  // tailwind tint classes for badges / accents
  badge: string;
  pinColor: string; // hex for leaflet pins
  glow: string;
}

export const CATEGORIES: Record<IncidentCategory, CategoryMeta> = {
  open_garage: {
    id: "open_garage",
    label: "Open Garage Door",
    icon: DoorOpen,
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    pinColor: "#f59e0b",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
  },
  unattended_package: {
    id: "unattended_package",
    label: "Unattended Package",
    icon: Package,
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    pinColor: "#0ea5e9",
    glow: "shadow-[0_0_12px_rgba(14,165,233,0.5)]",
  },
  lost_pet: {
    id: "lost_pet",
    label: "Lost / Found Pet",
    icon: PawPrint,
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    pinColor: "#3b82f6",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.5)]",
  },
  vandalism: {
    id: "vandalism",
    label: "Property Vandalism",
    icon: Hammer,
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    pinColor: "#f97316",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.5)]",
  },
  suspicious_activity: {
    id: "suspicious_activity",
    label: "Suspicious Activity",
    icon: Eye,
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    pinColor: "#ef4444",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.5)]",
  },
  safe_walk: {
    id: "safe_walk",
    label: "Safe Walk Request",
    icon: Footprints,
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pinColor: "#10b981",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
