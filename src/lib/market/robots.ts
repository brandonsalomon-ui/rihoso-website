// Minimal robots.txt check: honours Disallow/Allow rules for our user agent (or "*").
// The collector refuses to fetch any URL a source's robots.txt disallows.

export const MARKET_USER_AGENT = "RIHOSO-MarketTracker/1.0 (+https://rihoso.com/market/about)";
const AGENT_TOKEN = "rihoso-markettracker";

type Rule = { allow: boolean; pattern: string };

export function parseRobots(text: string): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (field === "disallow" && value) current.rules.push({ allow: false, pattern: value });
    if (field === "allow" && value) current.rules.push({ allow: true, pattern: value });
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && AGENT_TOKEN.includes(a)));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.rules);
}

function toRegex(pattern: string) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** Longest matching rule wins; Allow wins ties (Google's documented behaviour). */
export function isAllowed(rules: Rule[], pathWithQuery: string) {
  let best: Rule | null = null;
  for (const rule of rules) {
    if (!toRegex(rule.pattern).test(pathWithQuery)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

export async function loadRobots(origin: string): Promise<Rule[]> {
  const res = await fetch(`${origin}/robots.txt`, {
    headers: { "user-agent": MARKET_USER_AGENT },
    cache: "no-store",
  });
  if (res.status >= 400 && res.status < 500) return []; // no robots.txt: nothing disallowed
  if (!res.ok) throw new Error(`robots.txt unavailable (${res.status}); not collecting`);
  return parseRobots(await res.text());
}
