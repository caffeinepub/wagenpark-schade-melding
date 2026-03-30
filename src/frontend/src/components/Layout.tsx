import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Truck,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsAdmin } from "../hooks/useQueries";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/melden", icon: <Plus size={18} />, label: "Schade Melden" },
  {
    to: "/mijn-meldingen",
    icon: <ClipboardList size={18} />,
    label: "Mijn Meldingen",
  },
  {
    to: "/voertuigen",
    icon: <Truck size={18} />,
    label: "Voertuigen",
    adminOnly: true,
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const displayName =
    profile?.name ??
    identity?.getPrincipal().toString().slice(0, 8) ??
    "Gebruiker";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Truck size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-semibold text-sm leading-tight">
              WagenPark
            </p>
            <p className="text-sidebar-foreground/50 text-xs">Schadebeheer</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive =
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "sidebar-nav-active" : "sidebar-nav-item"
                }`}
                data-ocid={`nav.${item.label.toLowerCase().replace(/ /g, "_")}.link`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User area */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            {isAdmin ? (
              <ShieldCheck
                size={14}
                className="text-sidebar-accent-foreground"
              />
            ) : (
              <User size={14} className="text-sidebar-accent-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">
              {displayName}
            </p>
            <p className="text-sidebar-foreground/50 text-xs">
              {isAdmin ? "Beheerder" : "Medewerker"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm sidebar-nav-item"
          data-ocid="nav.logout.button"
        >
          <LogOut size={16} />
          Uitloggen
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Sluit menu"
              className="absolute inset-0 w-full bg-black/50 cursor-default"
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
            />
            <motion.aside
              className="relative w-64 h-full bg-sidebar flex flex-col"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <button
                type="button"
                aria-label="Sluit navigatie"
                className="absolute top-4 right-4 text-sidebar-foreground/70"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-foreground"
            data-ocid="nav.menu.button"
            aria-label="Open navigatie"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-sidebar-primary" />
            <span className="text-sidebar-foreground font-semibold text-sm">
              WagenPark
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
