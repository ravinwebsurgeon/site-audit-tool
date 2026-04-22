import type { AccessibilityAuditData } from '@/types';
import type { PageFetchResult } from '@/lib/fetcher';

export async function auditAccessibility(
  _url: string,
  page: PageFetchResult
): Promise<AccessibilityAuditData> {
  const html = page.html;

  // ── Images ─────────────────────────────────────────────────────────────────
  const imgTags = [...html.matchAll(/<img\b([^>]*)>/gi)];
  const totalImages = imgTags.length;
  const imagesWithoutAlt = imgTags.filter((m) => {
    const attrs = m[1];
    const altMatch = /\balt\s*=\s*["']([^"']*)["']/i.exec(attrs);
    return !altMatch || altMatch[1].trim() === '';
  }).length;

  // ── Buttons ────────────────────────────────────────────────────────────────
  const buttonMatches = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  const totalButtons = buttonMatches.length;
  const buttonsWithoutText = buttonMatches.filter((m) => {
    const attrs = m[1];
    const inner = m[2].replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs);
    const hasAriaLabelledby = /\baria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs);
    return inner === '' && !hasAriaLabel && !hasAriaLabelledby;
  }).length;

  // ── Links ──────────────────────────────────────────────────────────────────
  const anchorMatches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const totalLinks = anchorMatches.length;
  const linksWithoutText = anchorMatches.filter((m) => {
    const attrs = m[1];
    const inner = m[2].replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs);
    const hasTitle = /\btitle\s*=\s*["'][^"']+["']/i.test(attrs);
    return inner === '' && !hasAriaLabel && !hasTitle;
  }).length;

  // ── Form inputs & labels ────────────────────────────────────────────────────
  const inputTags = [...html.matchAll(/<input\b([^>]*)>/gi)].filter((m) => {
    const type = /\btype\s*=\s*["']([^"']*)["']/i.exec(m[1]);
    if (!type) return true;
    return !['hidden', 'submit', 'reset', 'button', 'image'].includes(type[1].toLowerCase());
  });
  const totalFormInputs = inputTags.length;

  const labelIds = new Set<string>();
  for (const m of html.matchAll(/\bfor\s*=\s*["']([^"']+)["']/gi)) {
    labelIds.add(m[1]);
  }
  const formInputsWithoutLabel = inputTags.filter((m) => {
    const id = /\bid\s*=\s*["']([^"']+)["']/i.exec(m[1]);
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(m[1]);
    const hasAriaLabelledby = /\baria-labelledby\s*=\s*["'][^"']+["']/i.test(m[1]);
    if (hasAriaLabel || hasAriaLabelledby) return false;
    if (id && labelIds.has(id[1])) return false;
    return true;
  }).length;

  // ── Skip link ──────────────────────────────────────────────────────────────
  const hasSkipLink = /href\s*=\s*["']#(?:main|content|skip|maincontent)["']/i.test(html);

  // ── ARIA labels ─────────────────────────────────────────────────────────────
  const ariaLabelMatches = [...html.matchAll(/\baria-label\s*=/gi)];
  const hasAriaLabels = ariaLabelMatches.length > 0;
  const ariaLabelCount = ariaLabelMatches.length;

  // ── Role attributes ─────────────────────────────────────────────────────────
  const roleMatches = [...html.matchAll(/\brole\s*=\s*["'][^"']+["']/gi)];
  const hasRoleAttributes = roleMatches.length > 0;
  const roleAttributeCount = roleMatches.length;

  // ── Heading hierarchy ───────────────────────────────────────────────────────
  const headingLevels: number[] = [];
  for (const m of html.matchAll(/<h([1-6])\b[^>]*>/gi)) {
    headingLevels.push(parseInt(m[1]));
  }
  const headingLevelsFound = [...new Set(headingLevels)].sort();
  let headingHierarchyValid = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      headingHierarchyValid = false;
      break;
    }
  }

  // ── Language attribute ──────────────────────────────────────────────────────
  const langMatch = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(html);
  const hasLangAttribute = langMatch !== null;
  const langAttribute = langMatch ? langMatch[1] : null;

  // ── Tabindex ────────────────────────────────────────────────────────────────
  const tabindexCount = [...html.matchAll(/\btabindex\s*=/gi)].length;
  const hasFocusableElements = tabindexCount > 0 || totalButtons > 0 || totalLinks > 0;

  return {
    totalImages,
    imagesWithoutAlt,
    buttonsWithoutText,
    totalButtons,
    linksWithoutText,
    totalLinks,
    formInputsWithoutLabel,
    totalFormInputs,
    hasSkipLink,
    hasAriaLabels,
    ariaLabelCount,
    hasRoleAttributes,
    roleAttributeCount,
    headingHierarchyValid,
    headingLevelsFound,
    hasLangAttribute,
    langAttribute,
    tabindexCount,
    hasFocusableElements,
  };
}
