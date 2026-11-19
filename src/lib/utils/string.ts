/**
 * Capitalizes only the first letter of a string and lowercases the rest
 * @param str - The string to capitalize
 * @returns The capitalized string
 * @example
 * capitalizeFirst("ACCEPTED") // "Accepted"
 * capitalizeFirst("pending") // "Pending"
 */
export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Name particles that stay lowercase when they are not the first word
// (e.g. "Juan de la Cruz"). Covers common Spanish/Portuguese/Dutch/German ones.
const NAME_PARTICLES = new Set([
  'de', 'del', 'de la', 'la', 'las', 'los', 'y', 'da', 'das', 'do', 'dos',
  'e', 'van', 'von', 'di', 'della', 'der', 'den',
]);

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase() + word.slice(1);
}

/**
 * Converts a (possibly all-caps) name to Title Case without mangling the data.
 *
 * Handles hyphenated surnames ("Pérez-Gómez") and keeps connective particles
 * lowercase when they are not the first word ("de la Cruz"). Unicode-aware so
 * accented characters cap correctly.
 *
 * @example toTitleCase("JUAN DE LA CRUZ")   // "Juan de la Cruz"
 * @example toTitleCase("PÉREZ-GÓMEZ")       // "Pérez-Gómez"
 */
export function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLocaleLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i !== 0 && NAME_PARTICLES.has(word)) return word;
      return word.split('-').map(capitalizeWord).join('-');
    })
    .join(' ');
}

/**
 * Gets a relative date string (e.g., "Today", "Tomorrow", "In 3 days", "In 2 weeks")
 * @param dateString - The date string to format
 * @returns The relative date string
 * @example
 * getRelativeDate("2025-11-07T10:00:00Z") // "Tomorrow"
 * getRelativeDate("2025-11-09T10:00:00Z") // "In 3 days"
 */
export function getRelativeDate(dateString: string): string {
  const targetDate = new Date(dateString);
  const today = new Date();

  // Normalize both dates to start of day for accurate comparison
  const targetDateNormalized = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const todayNormalized = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Calculate difference in days
  const diffTime = targetDateNormalized.getTime() - todayNormalized.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays > 1 && diffDays < 7) {
    return `In ${diffDays} days`;
  } else if (diffDays >= 7 && diffDays < 14) {
    return 'In 1 week';
  } else if (diffDays >= 14 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `In ${weeks} weeks`;
  } else if (diffDays >= 30 && diffDays < 60) {
    return 'In 1 month';
  } else if (diffDays >= 60) {
    const months = Math.floor(diffDays / 30);
    return `In ${months} months`;
  } else if (diffDays < 0) {
    // Past dates
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return 'Yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 14) return '1 week ago';
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    if (absDays < 60) return '1 month ago';
    return `${Math.floor(absDays / 30)} months ago`;
  }

  return '';
}
