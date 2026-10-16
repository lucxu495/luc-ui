import { SocialLink } from "./social-links.js";
//#region src/experiences/profile-hero.d.ts
/**
 * LUC ProfileHero — the top of a personal site.
 *
 * A career page, a research page, a portfolio and a blog all open the same way:
 * a name, what the person does, one paragraph of orientation, a portrait, a row
 * of links, and one primary action. Every one of those sites re-builds this and
 * gets the heading hierarchy slightly different, so it lives here with the
 * hierarchy fixed: the name is the page's `h1` and everything else is content.
 *
 * `variant` is the design axis, not a cosmetic one. `editorial` sets the name in
 * the display face at display scale with the lead set in a reading measure;
 * `instrument` keeps the same components at a technical scale with the facts
 * moved into a definition list. A research page and a magazine page should not
 * look the same, and one attribute is enough to make them differ.
 *
 * The professional descriptor prop is `title`, not `role`: a JSX attribute
 * named `role` makes `eslint-plugin-jsx-a11y` report an invalid ARIA role on
 * every consumer that renders one, which is a DX defect the library refuses to
 * ship. `ChatMessage` takes its author as `from` for the same reason.
 */
export interface ProfileFact {
  id: string;
  label: string;
  value: React.ReactNode;
}
export interface ProfileHeroProps extends React.ComponentPropsWithRef<"header"> {
  /** The person's name. Rendered as the page `h1`. */
  name: string;
  /** Job title, field or discipline. Rendered under the name. */
  title?: string;
  /** One paragraph of orientation. Keep it to two sentences. */
  lead?: React.ReactNode;
  /** Short line above the name — affiliation, location, availability. */
  eyebrow?: string;
  /** Portrait, monogram or illustration. Sized by the component. */
  portrait?: React.ReactNode;
  /** Facts rendered as a definition list (location, since, focus). */
  facts?: readonly ProfileFact[];
  /** Where else to find the person. */
  links?: readonly SocialLink[];
  /** Primary and secondary actions. */
  actions?: React.ReactNode;
  /** Which way round the portrait and the copy sit. Default `portrait-end`. */
  align?: "portrait-start" | "portrait-end" | "centered";
  variant?: "editorial" | "instrument";
}
export declare function ProfileHero({ name, title, lead, eyebrow, portrait, facts, links, actions, align, variant, className, ...props }: ProfileHeroProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=profile-hero.d.ts.map