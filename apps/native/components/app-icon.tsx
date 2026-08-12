import {
  Add01Icon,
  Airplane01Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BiometricAccessIcon,
  BookOpen01Icon,
  Bookmark01Icon,
  Briefcase01Icon,
  Calendar01Icon,
  Cancel01Icon,
  CheckIcon,
  CheckmarkCircle01Icon,
  ChevronRightIcon,
  Clock01Icon,
  CloudIcon,
  ConstructionIcon,
  CrownIcon,
  CrownPlusIcon,
  DashboardSquare01Icon,
  Database01Icon,
  Delete02Icon,
  Edit02Icon,
  File01Icon,
  FileSecurityIcon,
  FilterIcon,
  FolderAddIcon,
  Folder01Icon,
  FolderLibraryIcon,
  FolderOpenIcon,
  FolderSecurityIcon,
  GridViewIcon,
  HelpCircleIcon,
  Home01Icon,
  Image01Icon,
  InformationCircleIcon,
  Key01Icon,
  Leaf01Icon,
  ListViewIcon,
  LockIcon,
  MedicalFileIcon,
  MoreVerticalIcon,
  Mortarboard01Icon,
  ScanIcon,
  Search01Icon,
  Settings02Icon,
  Share01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  Sorting04Icon,
  SparklesIcon,
  ViewOffIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react-native";
import type { StyleProp, ViewStyle } from "react-native";

export type AppIconName =
  | "add"
  | "alert"
  | "back"
  | "biometric"
  | "book"
  | "bookmark"
  | "calendar"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-right"
  | "clock"
  | "cloud"
  | "close"
  | "dashboard"
  | "database"
  | "delete"
  | "document"
  | "document-security"
  | "edit"
  | "education"
  | "filter"
  | "folder"
  | "folder-add"
  | "folder-open"
  | "folder-security"
  | "grid"
  | "health"
  | "help"
  | "hidden"
  | "home"
  | "image"
  | "info"
  | "key"
  | "leaf"
  | "list"
  | "lock"
  | "more"
  | "member"
  | "next"
  | "other"
  | "phone"
  | "scan"
  | "search"
  | "settings"
  | "share"
  | "shield"
  | "sort"
  | "sparkles"
  | "upgrade"
  | "tools"
  | "travel"
  | "vault"
  | "wallet"
  | "work";

const icons = {
  add: Add01Icon,
  alert: AlertCircleIcon,
  back: ArrowLeft01Icon,
  biometric: BiometricAccessIcon,
  book: BookOpen01Icon,
  bookmark: Bookmark01Icon,
  calendar: Calendar01Icon,
  check: CheckIcon,
  "check-circle": CheckmarkCircle01Icon,
  "chevron-down": ArrowDown01Icon,
  "chevron-right": ChevronRightIcon,
  clock: Clock01Icon,
  cloud: CloudIcon,
  close: Cancel01Icon,
  dashboard: DashboardSquare01Icon,
  database: Database01Icon,
  delete: Delete02Icon,
  document: File01Icon,
  "document-security": FileSecurityIcon,
  edit: Edit02Icon,
  education: Mortarboard01Icon,
  filter: FilterIcon,
  folder: Folder01Icon,
  "folder-add": FolderAddIcon,
  "folder-open": FolderOpenIcon,
  "folder-security": FolderSecurityIcon,
  grid: GridViewIcon,
  health: MedicalFileIcon,
  help: HelpCircleIcon,
  hidden: ViewOffIcon,
  home: Home01Icon,
  image: Image01Icon,
  info: InformationCircleIcon,
  key: Key01Icon,
  leaf: Leaf01Icon,
  list: ListViewIcon,
  lock: LockIcon,
  more: MoreVerticalIcon,
  member: CrownIcon,
  next: ArrowRight01Icon,
  other: File01Icon,
  phone: SmartPhone01Icon,
  scan: ScanIcon,
  search: Search01Icon,
  settings: Settings02Icon,
  share: Share01Icon,
  shield: Shield01Icon,
  sort: Sorting04Icon,
  sparkles: SparklesIcon,
  upgrade: CrownPlusIcon,
  tools: ConstructionIcon,
  travel: Airplane01Icon,
  vault: FolderLibraryIcon,
  wallet: Wallet01Icon,
  work: Briefcase01Icon,
} satisfies Record<AppIconName, IconSvgElement>;

export function AppIcon({
  name,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.8,
  style,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      accessible={false}
    />
  );
}

export function appIconSource(name: AppIconName, strokeWidth = 1.8, _filled = false) {
  return ({ color, size }: { color: string; size: number }) => (
    <AppIcon name={name} size={size} color={color} strokeWidth={strokeWidth} />
  );
}
