/** Escape editorial values before inserting them into HTML or attributes.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  const replacements = new Map([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
  ]);
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => replacements.get(char) ?? char,
  );
}
