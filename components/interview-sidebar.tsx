// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Video,
  Mic,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Circle,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Phone,
  PhoneOff,
  Camera,
  CameraOff,
  MicOff,
  MicOn,
  Monitor,
  MonitorOff,
  Share,
  ShareOff,
  Record,
  StopCircle,
  Download,
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  Copy,
  ExternalLink,
  Info,
  HelpCircle,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Zap,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Globe,
  Link as LinkIcon,
  Image,
  File,
  Folder,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  RefreshCw,
  RefreshCcw,
  RotateCw,
  RotateCcw as RotateCcwIcon,
  ZoomIn,
  ZoomOut,
  Move,
  Grid,
  List,
  Columns,
  Rows,
  Layout,
  Sidebar,
  SidebarClose,
  SidebarOpen,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Split,
  SplitSquareVertical,
  SplitSquareHorizontal,
  GripVertical,
  GripHorizontal,
  MousePointer,
  MousePointer2,
  Hand,
  HandMetal,
  HandIndex,
  HandIndexThumb,
  HandPointer,
  HandPointer2,
  HandPointer3,
  HandPointer4,
  HandPointer5,
  HandPointer6,
  HandPointer7,
  HandPointer8,
  HandPointer9,
  HandPointer10,
  HandPointer11,
  HandPointer12,
  HandPointer13,
  HandPointer14,
  HandPointer15,
  HandPointer16,
  HandPointer17,
  HandPointer18,
  HandPointer19,
  HandPointer20,
  HandPointer21,
  HandPointer22,
  HandPointer23,
  HandPointer24,
  HandPointer25,
  HandPointer26,
  HandPointer27,
  HandPointer28,
  HandPointer29,
  HandPointer30,
  HandPointer31,
  HandPointer32,
  HandPointer33,
  HandPointer34,
  HandPointer35,
  HandPointer36,
  HandPointer37,
  HandPointer38,
  HandPointer39,
  HandPointer40,
  HandPointer41,
  HandPointer42,
  HandPointer43,
  HandPointer44,
  HandPointer45,
  HandPointer46,
  HandPointer47,
  HandPointer48,
  HandPointer49,
  HandPointer50,
  HandPointer51,
  HandPointer52,
  HandPointer53,
  HandPointer54,
  HandPointer55,
  HandPointer56,
  HandPointer57,
  HandPointer58,
  HandPointer59,
  HandPointer60,
  HandPointer61,
  HandPointer62,
  HandPointer63,
  HandPointer64,
  HandPointer65,
  HandPointer66,
  HandPointer67,
  HandPointer68,
  HandPointer69,
  HandPointer70,
  HandPointer71,
  HandPointer72,
  HandPointer73,
  HandPointer74,
  HandPointer75,
  HandPointer76,
  HandPointer77,
  HandPointer78,
  HandPointer79,
  HandPointer80,
  HandPointer81,
  HandPointer82,
  HandPointer83,
  HandPointer84,
  HandPointer85,
  HandPointer86,
  HandPointer87,
  HandPointer88,
  HandPointer89,
  HandPointer90,
  HandPointer91,
  HandPointer92,
  HandPointer93,
  HandPointer94,
  HandPointer95,
  HandPointer96,
  HandPointer97,
  HandPointer98,
  HandPointer99,
  HandPointer100,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: "default" | "outline";
  };
  children?: SidebarItem[];
}

interface SidebarAction {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "secondary" | "ghost";
  onClick: () => void;
}

interface InterviewSidebarProps {
  className?: string;
  items?: SidebarItem[];
  actions?: SidebarAction[];
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
}

export function InterviewSidebar({
  className,
  items = [],
  actions = [],
  isCollapsed = false,
  onCollapse,
  user,
  onLogout,
  onProfile,
  onSettings,
}: InterviewSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const defaultItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/interview",
      icon: Home,
    },
    {
      title: "Video Interview",
      href: "/video-interview",
      icon: Video,
      badge: {
        text: "New",
        variant: "default",
      },
    },
    {
      title: "Voice Interview",
      href: "/voice-interview",
      icon: Mic,
    },
    {
      title: "Chat Interview",
      href: "/chat-interview",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const defaultActions: SidebarAction[] = [
    {
      title: "Start Interview",
      icon: Play,
      variant: "default",
      onClick: () => router.push("/interview"),
    },
    {
      title: "View History",
      icon: Clock,
      variant: "secondary",
      onClick: () => router.push("/history"),
    },
  ];

  const sidebarItems = items.length > 0 ? items : defaultItems;
  const sidebarActions = actions.length > 0 ? actions : defaultActions;

  const handleItemClick = (href: string) => {
    router.push(href);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const SidebarHeader = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("flex items-center justify-between", className)}>
      {children}
    </div>
  );

  const SidebarContent = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("flex-1 overflow-y-auto", className)}>{children}</div>
  );

  const SidebarFooter = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={cn("border-t", className)}>{children}</div>;

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border hover:bg-background/90"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          className
        )}
        initial={false}
        animate={{
          width: isCollapsed ? 64 : 256,
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <SidebarHeader className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  CB
                </span>
              </div>
              {!isCollapsed && (
                <span className="font-medium text-sidebar-foreground">
                  Interview Bakers
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCollapse?.(!isCollapsed)}
                  className="h-8 w-8 p-0 text-sidebar-foreground hover:text-sidebar-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>

          {/* Content */}
          <SidebarContent className="p-4">
            {/* Navigation Items */}
            <nav className="space-y-2">
              {sidebarItems.map((item, index) => {
                const isActiveItem = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start transition-all duration-200 group relative",
                        isActiveItem
                          ? "bg-primary/20 text-primary border-l-4 border-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      onClick={() => handleItemClick(item.href)}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0",
                          isActiveItem
                            ? "text-primary"
                            : "text-sidebar-foreground/70",
                          isCollapsed ? "h-6 w-6" : "h-5 w-5"
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="ml-3">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badge.variant}
                              className={cn(
                                "ml-auto",
                                item.badge.variant === "default" &&
                                  "bg-primary/20 text-primary",
                                item.badge.variant === "outline" &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              {item.badge.text}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </nav>

            {/* Actions */}
            {!isCollapsed && sidebarActions.length > 0 && (
              <div className="mt-8 space-y-2">
                <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  Actions
                </h3>
                {sidebarActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sidebarItems.length + index) * 0.1 }}
                  >
                    <Button
                      variant={action.variant}
                      className={cn(
                        "w-full justify-start",
                        action.variant === "default" &&
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                        action.variant === "secondary" &&
                          "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                      )}
                      onClick={action.onClick}
                    >
                      <action.icon className="h-4 w-4 mr-3" />
                      {action.title}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </SidebarContent>

          {/* Footer */}
          {user && (
            <SidebarFooter className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name || "User"}
                    </p>
                    {user.email && (
                      <p className="text-xs text-sidebar-foreground/70 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                )}
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="h-8 w-8 p-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </SidebarFooter>
          )}
        </div>
      </motion.aside>
    </>
  );
}
