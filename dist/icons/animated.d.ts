import { ComponentType, HTMLAttributes } from "react";
//#region src/icons/animated.d.ts
export type AnimatedIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  size?: string | number;
  color?: string;
};
export type AnimatedIconComponentType = ComponentType<AnimatedIconProps>;
//#endregion
//# sourceMappingURL=animated.d.ts.map