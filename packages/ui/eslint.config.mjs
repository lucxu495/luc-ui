import { sharedConfig } from "../../eslint.config.mjs";

export default [
  ...sharedConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
  },
];
