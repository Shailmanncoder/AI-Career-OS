import {
  Braces,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: "Overview" | "Career" | "Practice";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/resume", label: "Resume", icon: FileText, group: "Overview" },
  { href: "/skills", label: "Skills", icon: Braces, group: "Overview" },
  { href: "/careers", label: "Career Matches", icon: Target, group: "Career" },
  { href: "/simulator", label: "Career Simulator", icon: Sparkles, group: "Career" },
  { href: "/roadmap", label: "Roadmap", icon: Route, group: "Career" },
  { href: "/optimizer", label: "Resume Optimizer", icon: Wand2, group: "Practice" },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck, group: "Practice" },
  { href: "/interview", label: "Interview Coach", icon: MessagesSquare, group: "Practice" },
  { href: "/progress", label: "Progress", icon: TrendingUp, group: "Practice" },
];

export const NAV_GROUPS = ["Overview", "Career", "Practice"] as const;
