import {
  Box, Building2, Cable, CircuitBoard, Code2, Cpu, Disc3, Fan, Gpu, HardDrive, Headset, Keyboard,
  MemoryStick, Monitor, Mouse, PlugZap, Printer, Rocket, ShieldCheck, Wrench, Package, ScanSearch, Radar, BadgeCheck, Truck, type LucideIcon, type LucideProps,
} from "lucide-react";

/** Mapa estático de íconos usados en contenido dinámico (servicios, categorías). */
const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  wrench: Wrench,
  rocket: Rocket,
  "disc-3": Disc3,
  headset: Headset,
  "code-xml": Code2,
  "building-2": Building2,
  cpu: Cpu,
  "circuit-board": CircuitBoard,
  "memory-stick": MemoryStick,
  "hard-drive": HardDrive,
  gpu: Gpu,
  "plug-zap": PlugZap,
  box: Box,
  fan: Fan,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  cable: Cable,
  "scan-search": ScanSearch,
  radar: Radar,
  "badge-check": BadgeCheck,
  truck: Truck,
};

export const ICON_NAMES = Object.keys(ICONS);

export function DynamicIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Icon = (name && ICONS[name]) || Package;
  return <Icon aria-hidden {...props} />;
}
