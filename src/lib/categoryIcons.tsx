import {
  Pencil,
  Armchair,
  BookOpen,
  NotebookText,
  HeartPulse,
  Dumbbell,
  Laptop,
  Printer,
  Shirt,
  Package,
  type LucideIcon,
} from "lucide-react";

// One icon per ProductCategory enum value — keeps the marketplace's category
// chips/pills recognizable at a glance instead of text-only.
export const PRODUCT_CATEGORY_ICONS: Record<string, LucideIcon> = {
  STATIONERY: Pencil,
  FURNITURE: Armchair,
  EDUCATIONAL_CONTENT: BookOpen,
  NOTEBOOKS: NotebookText,
  HEALTH_HYGIENE: HeartPulse,
  SPORTS: Dumbbell,
  IT_ELECTRONICS: Laptop,
  EXAM_PRINT_STATIONERY: Printer,
  UNIFORM_MERCHANDISE: Shirt,
  OTHER: Package,
};
