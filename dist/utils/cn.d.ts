import { ClassValue } from "clsx";
//#region src/utils/cn.d.ts
/**
 * Merge conditional class names and de-duplicate conflicting Tailwind
 * utilities (last one wins). Every LUC component funnels `className` here so
 * consumer overrides behave predictably.
 */
export declare function cn(...inputs: ClassValue[]): string;
//#endregion
//# sourceMappingURL=cn.d.ts.map