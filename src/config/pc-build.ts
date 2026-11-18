/** Opciones del formulario "Cotizar PC completa" (compartidas por el formulario, el servidor y el panel). */
export const pcUses = {
  GAMING: "Gaming",
  OFFICE: "Oficina / estudios",
  DESIGN: "Diseño y edición de video",
  PROGRAMMING: "Programación",
  STREAMING: "Streaming / creación de contenido",
  OTHER: "Otro",
} as const;

export const pcBudgets = {
  UP_TO_2000: "Hasta S/ 2,000",
  FROM_2000_3500: "S/ 2,000 – 3,500",
  FROM_3500_5000: "S/ 3,500 – 5,000",
  FROM_5000_8000: "S/ 5,000 – 8,000",
  OVER_8000: "Más de S/ 8,000",
  UNSURE: "No estoy seguro, recomiéndenme",
} as const;

export const pcCpuPrefs = {
  ANY: "Sin preferencia",
  INTEL: "Intel",
  AMD: "AMD",
} as const;

export const pcGpuPrefs = {
  RECOMMEND: "Que me recomienden",
  NVIDIA: "Dedicada NVIDIA GeForce",
  AMD: "Dedicada AMD Radeon",
  INTEGRATED: "Gráficos integrados (sin tarjeta de video)",
} as const;

export const pcRamPrefs = {
  RECOMMEND: "Que me recomienden",
  GB8: "8 GB",
  GB16: "16 GB",
  GB32: "32 GB",
  GB64: "64 GB o más",
} as const;

export const pcStoragePrefs = {
  RECOMMEND: "Que me recomienden",
  SSD512: "SSD de 500 GB",
  SSD1TB: "SSD de 1 TB",
  SSD2TB: "SSD de 2 TB o más",
} as const;

export const pcResolutions = {
  UNSURE: "No sé / no aplica",
  FHD: "1080p (Full HD)",
  QHD: "1440p (2K)",
  UHD: "4K",
} as const;

export const pcTimelines = {
  ASAP: "Lo antes posible",
  MONTH: "Este mes",
  QUOTING: "Solo estoy cotizando",
} as const;

/** Extras que se pueden sumar a la cotización (coinciden con las categorías de la tienda). */
export const pcExtras = {
  monitor: "Monitor",
  keyboard: "Teclado",
  mouse: "Mouse",
  headset: "Audífonos",
  combo: "Combo 3 en 1",
  wifi: "Wi-Fi / Bluetooth",
  rgb: "Estética RGB",
  os: "Instalación de Windows",
} as const;

type Keys<T> = [keyof T & string, ...(keyof T & string)[]];
export const keysOf = <T extends Record<string, string>>(o: T) => Object.keys(o) as Keys<T>;
