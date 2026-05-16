import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  MessageSquare,
  Folder,
  Wrench,
  Plug,
  Settings,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { SettingsDialog } from "../SettingsDialog";
import { useSessionsList } from "../../hooks/useSessionsList";

export function Layout() {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecentChatsExpanded, setIsRecentChatsExpanded] = useState(true);

  const { sessions } = useSessionsList();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("agentos_sidebar_collapsed") === "true";
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem("agentos_sidebar_width") || "256", 10);
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      let newWidth = e.clientX;
      if (newWidth < 180) newWidth = 180;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem("agentos_sidebar_width", sidebarWidth.toString());
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, sidebarWidth]);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem("agentos_sidebar_collapsed", newCollapsed.toString());
  };

  const navItems = [
    { icon: MessageSquare, label: t("layout.newChat"), path: "/chats" },
    { icon: Folder, label: t("layout.projects"), path: "/projects" },
    { icon: Wrench, label: t("layout.skills"), path: "/skills" },
    { icon: Plug, label: t("layout.connectors"), path: "/connectors" },
    {
      icon: Zap,
      label: t("layout.automation", "Automation"),
      path: "/automation",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-theme-base text-theme-text font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-theme-border bg-theme-surface flex-shrink-0 z-20",
          !isDragging && "transition-all duration-300 ease-in-out",
        )}
        style={{
          width: isCollapsed ? 64 : sidebarWidth,
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 w-full border-b border-theme-border relative flex-shrink-0">
          <div
            className={cn(
              "flex items-center overflow-hidden",
              isCollapsed && "md:hidden",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-theme-accent text-black flex flex-shrink-0 items-center justify-center font-bold text-xs">
              A
            </div>
            {!isCollapsed && (
              <span className="ml-3 font-serif italic text-xl text-theme-accent tracking-tight truncate hidden md:block">
                AgentOS
              </span>
            )}
          </div>

          <button
            onClick={handleToggleCollapse}
            className={cn(
              "p-1.5 rounded-lg text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-active transition-colors hidden md:flex items-center justify-center",
              isCollapsed && "mx-auto w-full",
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 w-full py-4 flex flex-col gap-1 px-2 md:px-3 overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/chats"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-widest font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-theme-surface-hover text-theme-accent border-l-2 border-theme-accent"
                      : "text-theme-text-secondary hover:bg-theme-surface-hover hover:text-theme-text border-l-2 border-transparent",
                    isCollapsed && "md:justify-center !px-0",
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="hidden md:block transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {!isCollapsed && (
            <div className="mt-8 mb-2 flex flex-col gap-1">
              <div
                className="flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-theme-text-secondary cursor-pointer hover:text-theme-text transition-colors group"
                onClick={() => setIsRecentChatsExpanded(!isRecentChatsExpanded)}
              >
                <span>{t("layout.recentChats")}</span>
                {isRecentChatsExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {isRecentChatsExpanded && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {sessions.map((chat) => (
                    <NavLink
                      key={chat.sessionId}
                      to={`/chats/${chat.sessionId}`}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col px-3 py-2 rounded text-xs transition-colors whitespace-nowrap overflow-hidden border-l-2 border-transparent",
                          isActive
                            ? "bg-theme-surface-hover text-theme-accent border-theme-accent"
                            : "text-theme-text hover:bg-theme-surface-hover hover:text-theme-text",
                        )
                      }
                      end
                    >
                      <span className="truncate w-full block font-medium">
                        {chat.sessionName}
                      </span>
                      <span className="text-[10px] text-theme-text-secondary truncate mt-0.5">
                        {new Date(chat.lastActiveAt).toLocaleString()}
                      </span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="w-full p-2 md:p-3 border-t border-theme-border">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "flex w-full items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded text-xs uppercase tracking-widest font-medium text-theme-text-secondary hover:bg-theme-surface-hover hover:text-theme-text transition-colors border-l-2 border-transparent whitespace-nowrap",
              isCollapsed && "md:justify-center !px-0",
            )}
            title={isCollapsed ? (t("layout.settings") as string) : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="hidden md:block transition-opacity duration-300">
                {t("layout.settings")}
              </span>
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-theme-accent/50 active:bg-theme-accent transition-colors z-30"
            onMouseDown={(e) => {
              setIsDragging(true);
              e.preventDefault();
            }}
          />
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
