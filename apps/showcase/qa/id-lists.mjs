/**
 * Is this segment a list of registered ids, or is it prose?
 *
 * The runtime i18n probe needs the difference. A reference table renders
 * `element.skins.supported.join(", ")`:
 *
 *   editorial, scientific, minimal, playful, cyber, warm, swiss, blueprint, pastel
 *
 * On both language versions. That is nine registry keys, and the policy is that
 * ids stay untranslated — but the probe's sentence rule sees five words or more
 * of mostly-ASCII letters and calls it an English page. Ten of these on
 * `/visuals/docs` alone, and the temptation is to answer with an allow-list
 * entry per string, which is how a gate becomes a list nobody reads.
 *
 * So the rule lives here, where it can carry a test. It is deliberately narrow:
 * every token must be registered **and** id-shaped, and there must be at least
 * three of them. A sentence cannot satisfy it, because a sentence contains at
 * least one word that is neither — see the negative cases in the test beside this
 * file, which are the reason it is safe to exclude this class from the gate.
 */

/** A token that can only be an id: lowercase, and no spaces or punctuation. */
const ID_SHAPED = /^[a-z][a-z0-9.-]*$/;

/** Separators a `.join()` in the library actually uses. */
const SEPARATOR = /[,·/]/;

/**
 * @param {string} text one segment the probe judged English-looking
 * @param {Set<string>} registered ids the Visuals package registers
 * @returns {boolean} true when every token is a registered, id-shaped key
 */
export function isRegisteredIdList(text, registered) {
  const tokens = text
    .split(SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length < 3) return false;
  return tokens.every((token) => ID_SHAPED.test(token) && registered.has(token));
}
