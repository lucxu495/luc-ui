import { SpringPresetName } from "./tokens.js";
import { MotionDivProps } from "./types.js";
//#region src/motion/magnetic.d.ts
export interface MagneticProps extends MotionDivProps {
  /**
   * Fraction of the pointer offset the target follows (0..1). The house
   * default is deliberately modest — a control that chases the cursor is
   * harder to click than one that leans toward it.
   */
  strength?: number;
  /** Distance, in px, beyond which the pull fades out. */
  radius?: number;
  /** Extra travel for the child slot (`1` = the body and the child move alike). */
  childDepth?: number;
  preset?: SpringPresetName;
  disabled?: boolean;
}
/**
 * LUC Magnetic — a control that leans toward the pointer and springs home.
 *
 * The travel is hard-clamped so a magnetised button can never move far enough
 * for the pointer to miss it, and the whole effect is inert on coarse pointers
 * (there is no hover) and under reduced motion. When it is inert the component
 * renders a plain wrapper with no listeners attached.
 */
export declare function Magnetic({ className, children, strength, radius, childDepth, preset, disabled, ...props }: MagneticProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=magnetic.d.ts.map