import {
  AirVent,
  Ambulance,
  Bike,
  BookOpen,
  Building,
  Building2,
  Bus,
  CalendarCheck,
  Camera,
  Car,
  CarFront,
  CarTaxiFront,
  Carrot,
  Cctv,
  CircleDot,
  Clapperboard,
  Code,
  Droplets,
  FileText,
  Flower2,
  Gift,
  Globe,
  GraduationCap,
  Hand,
  House,
  LandPlot,
  type LucideIcon,
  MapPin,
  Megaphone,
  MessageSquarePlus,
  Milk,
  MonitorSmartphone,
  Package,
  PackageOpen,
  PaintRoller,
  Palette,
  PartyPopper,
  Pill,
  Search,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Siren,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Store,
  Truck,
  Tv,
  Users,
  Video,
  Warehouse,
  WashingMachine,
  Wrench,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Catalog `iconKey` → lucide icon. An explicit map (not a dynamic import of every lucide icon) keeps
 * the bundle small. Admins pick from these keys in P12; icon.test.ts checks seeded keys are covered.
 */
export const ICONS = {
  "air-vent": AirVent,
  ambulance: Ambulance,
  bike: Bike,
  "book-open": BookOpen,
  building: Building,
  "building-2": Building2,
  bus: Bus,
  "calendar-check": CalendarCheck,
  camera: Camera,
  car: Car,
  "car-front": CarFront,
  "car-taxi-front": CarTaxiFront,
  carrot: Carrot,
  cctv: Cctv,
  clapperboard: Clapperboard,
  code: Code,
  droplets: Droplets,
  "file-text": FileText,
  "flower-2": Flower2,
  gift: Gift,
  globe: Globe,
  "graduation-cap": GraduationCap,
  hand: Hand,
  house: House,
  "land-plot": LandPlot,
  "map-pin": MapPin,
  megaphone: Megaphone,
  "message-square-plus": MessageSquarePlus,
  milk: Milk,
  "monitor-smartphone": MonitorSmartphone,
  package: Package,
  "package-open": PackageOpen,
  "paint-roller": PaintRoller,
  palette: Palette,
  "party-popper": PartyPopper,
  pill: Pill,
  search: Search,
  "shopping-bag": ShoppingBag,
  "shopping-basket": ShoppingBasket,
  "shopping-cart": ShoppingCart,
  siren: Siren,
  smartphone: Smartphone,
  sofa: Sofa,
  sparkles: Sparkles,
  "spray-can": SprayCan,
  store: Store,
  truck: Truck,
  tv: Tv,
  users: Users,
  video: Video,
  warehouse: Warehouse,
  "washing-machine": WashingMachine,
  wrench: Wrench,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export function isIconKey(key: string): key is IconKey {
  return key in ICONS;
}

/** Decorative by default; pass `label` when the icon carries meaning on its own. */
export function Icon({
  name,
  className,
  label,
}: {
  name: string | null | undefined;
  className?: string;
  label?: string;
}) {
  const Component = name && isIconKey(name) ? ICONS[name] : CircleDot;
  return (
    <Component
      className={cn("size-6 shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
