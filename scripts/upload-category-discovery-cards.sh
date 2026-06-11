#!/usr/bin/env bash
# Upload Discover category card images to Cloudinary.
#
# 1. Drop source files in public/images/category-discovery/cards/
#    (iphone.jpg, ipad.jpg, watch.jpg, airpods.jpg, mac-laptops.jpg, mac-desktops.jpg)
# 2. Ensure CLOUDINARY_* are set (reads backend .env by default)
# 3. Run: ./scripts/upload-category-discovery-cards.sh
#
# Prints secure_url for each card — paste into lib/config/category-discovery.ts
# or pass --write-config to update backgroundImage URLs automatically.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CARDS_DIR="$ROOT/public/images/category-discovery/cards"
BACKEND_ENV="${BACKEND_ENV:-$ROOT/../affordable-gadgets-backend/.env}"
WRITE_CONFIG=0

for arg in "$@"; do
  case "$arg" in
    --write-config) WRITE_CONFIG=1 ;;
    --help|-h)
      sed -n '1,12p' "$0"
      exit 0
      ;;
  esac
done

if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "Missing backend env file: $BACKEND_ENV" >&2
  echo "Set BACKEND_ENV to a file containing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source <(grep -E '^CLOUDINARY_' "$BACKEND_ENV" | sed 's/\r$//')
set +a

for var in CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing $var in $BACKEND_ENV" >&2
    exit 1
  fi
done

mkdir -p "$CARDS_DIR"

CARD_IDS=(iphone ipad watch airpods mac-laptops mac-desktops)
export CARDS_DIR WRITE_CONFIG="$WRITE_CONFIG"
export CONFIG_PATH="$ROOT/lib/config/category-discovery.ts"
export CARD_IDS_JSON
CARD_IDS_JSON="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1:]))' "${CARD_IDS[@]}")"

python3 <<'PY'
import json
import os
import sys

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True,
)

cards_dir = os.environ["CARDS_DIR"]
card_ids = json.loads(os.environ["CARD_IDS_JSON"])
write_config = os.environ.get("WRITE_CONFIG") == "1"
config_path = os.environ["CONFIG_PATH"]

results = {}
missing = []

for name in card_ids:
    path = None
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        candidate = os.path.join(cards_dir, f"{name}{ext}")
        if os.path.isfile(candidate):
            path = candidate
            break
    if not path:
        missing.append(name)
        continue
    result = cloudinary.uploader.upload(
        path,
        folder="category-discovery/cards",
        public_id=name,
        overwrite=True,
        resource_type="image",
    )
    results[name] = result["secure_url"]
    print(f"{name}: {result['secure_url']}")

if missing:
    print("\nMissing local files for:", ", ".join(missing), file=sys.stderr)
    print(f"Add images under {cards_dir}/", file=sys.stderr)

if not results:
    sys.exit(1)

if write_config and results:
    text = open(config_path, encoding="utf-8").read()
    for name, url in results.items():
        needle = f"id: '{name}'"
        idx = text.find(needle)
        if idx < 0:
            print(f"Could not find card id '{name}' in config", file=sys.stderr)
            continue
        start = text.find("backgroundImage:", idx)
        if start < 0:
            continue
        line_end = text.find("\n", start)
        line = text[start:line_end]
        prefix = line.split("'")[0]
        text = text[:start] + f"{prefix}'{url}'," + text[line_end + 1 :]
    open(config_path, "w", encoding="utf-8").write(text)
    print(f"\nUpdated {config_path}")
PY
