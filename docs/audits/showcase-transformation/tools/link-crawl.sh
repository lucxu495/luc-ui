#!/usr/bin/env bash
# READ-ONLY reachability crawl of the running Showcase.
# Usage: bash tools/link-crawl.sh > /dev/null   (writes into the evidence root)
set -u
base="http://127.0.0.1:3000"
here="$(cd "$(dirname "$0")" && pwd)"
app="$here/../../../../apps/showcase"
evidence="$here/../../../../artifacts/screenshots/showcase-transformation"
mkdir -p "$evidence/crawl"

# 1. static routes from the real app tree
find "$app/app" -name page.tsx \
  | sed -e "s|$app/app||" -e 's|/page.tsx$||' -e 's|^$|/|' \
  | grep -v '\[' | sort -u > "$evidence/crawl/routes-static.txt"

# 2. canonical routes from the generated docs registry (entry pages)
grep -oE '"r": "[^"]+"' "$app/lib/docs/generated/nav.ts" | sed 's/"r": "//; s/"$//' | sort -u >> "$evidence/crawl/routes-static.txt"
sort -u "$evidence/crawl/routes-static.txt" -o "$evidence/crawl/routes-static.txt"

# 3. fetch each route once and record status + outgoing internal links
: > "$evidence/crawl/edges.tsv"
while read -r route; do
  html="$(curl -sS --max-time 12 "$base$route" 2>/dev/null)"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 "$base$route" 2>/dev/null)"
  echo -e "$route\t$code" >> "$evidence/crawl/status.tsv"
  printf '%s' "$html" \
    | grep -oE 'href="/[^"#?]*"' \
    | sed -e 's/href="//' -e 's/"$//' \
    | sort -u \
    | sed "s|^|$route\t|" >> "$evidence/crawl/edges.tsv"
done < "$evidence/crawl/routes-static.txt"

echo "routes: $(wc -l < "$evidence/crawl/routes-static.txt")  edges: $(wc -l < "$evidence/crawl/edges.tsv")"
