/**
 * LUC UI — public surface.
 *
 * Import styles once, at the app root:
 *   @import "tailwindcss";
 *   @import "@luc/ui/styles.css";
 */

/* Providers */
export * from "./providers/locale-provider";
export * from "./providers/luc-provider";
export * from "./providers/theme-provider";
export { lucThemeInitScript, type ThemeInitScriptOptions } from "./providers/theme-script";

/* Tokens */
export { LUC_UI_TOKEN_VERSION } from "./tokens/version";

/* Hooks */
export * from "./hooks/use-controllable-state";
export * from "./hooks/use-isomorphic-layout-effect";
export * from "./hooks/use-media-query";
export * from "./hooks/use-persistent-state";
export * from "./hooks/use-reduced-motion";
export * from "./hooks/use-scroll-spy";
export * from "./hooks/use-spotlight";
export * from "./hooks/use-flash-target";

/* Utils */
export * from "./utils/cn";
export * from "./utils/format";
export * from "./utils/storage";
export * from "./utils/time";

/* Components */
export * from "./components/accordion";
export * from "./components/ai";
export * from "./components/alert";
export * from "./components/alert-dialog";
export * from "./components/aspect-ratio";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/button-group";
export * from "./components/button-variants";
export * from "./components/card";
export * from "./components/carousel";
export * from "./components/checkbox";
export * from "./components/color-picker";
export * from "./components/context-menu";
export * from "./components/dialog";
export * from "./components/command";
export * from "./components/combobox";
export * from "./components/dropdown-menu";
export * from "./components/empty-state";
export * from "./components/field";
export * from "./components/file-upload";
export * from "./components/float-button";
export * from "./components/guided-tour";
export * from "./components/hover-card";
export * from "./components/icon";
export * from "./components/icon-button";
export * from "./components/image-compare";
export * from "./components/image-gallery";
export * from "./components/input";
export * from "./components/input-group";
export * from "./components/kanban-board";
export * from "./components/kbd";
export * from "./components/label";
export * from "./components/link";
export * from "./components/list";
export * from "./components/native-select";
export * from "./components/notification-center";
export * from "./components/pagination";
export * from "./components/panel";
export * from "./components/popover";
export * from "./components/progress";
export * from "./components/radio-group";
export * from "./components/rating";
export * from "./components/result";
export * from "./components/scroll-area";
export * from "./components/search-input";
export * from "./components/segmented-control";
export * from "./components/select";
export * from "./components/separator";
export * from "./components/sheet";
export * from "./components/skeleton";
export * from "./components/slider";
export * from "./components/sortable-list";
export * from "./components/spinner";
export * from "./components/stepper";
export * from "./components/switch";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/timeline";
export * from "./components/toast";
export * from "./components/toggle";
export * from "./components/tooltip";
export * from "./components/transfer-list";
export * from "./components/tree-view";
export * from "./components/typography";

/* Layout */
export * from "./layout/container";
export * from "./layout/grid";
export * from "./layout/inline";
export * from "./layout/section";
export * from "./layout/stack";

/* Motion & creative effects */
export * from "./motion";

/* Data UI */
export * from "./data";

/* Data table */
export * from "./table";

/* Forms and inputs (V0.4) */
export * from "./forms";

/* Date and time (V0.4) */
export * from "./datetime";

/* URL state (V0.5) — router-agnostic codecs and parameter sets */
export * from "./url-state";

/* Application shell (V0.5) */
export * from "./app-shell";

/* Workspace (V0.5) */
export * from "./workspace";

/* Chart chrome (engines are deferred — see docs/CHART_GUIDE.md) */
export * from "./charts";
