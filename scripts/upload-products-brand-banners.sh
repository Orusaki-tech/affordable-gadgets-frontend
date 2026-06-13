#!/usr/bin/env bash
# Upload /products brand hero banners to Cloudinary (products-banners/).
#
# 1. Drop source files in public/images/banners/ (google.png, sony.jpg, …)
# 2. Ensure CLOUDINARY_* are set (reads backend .env by default)
# 3. Run: ./scripts/upload-products-brand-banners.sh google
#    Or:  ./scripts/upload-products-brand-banners.sh --write-config google
#
# Prints secure_url — paste into lib/config/products-brand-banners.ts or use --write-config.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BANNERS_DIR="$ROOT/public/images/banners"
BACKEND_ENV="${BACKEND_ENV:-$ROOT/../affordable-gadgets-backend/.env}"
WRITE_CONFIG=0
NAMES=()

for arg in "$@"; do
  case "$arg" in
    --write-config) WRITE_CONFIG=1 ;;
    --help|-h)
      sed -n '1,11p' "$0"
      exit 0
      ;;
    *) NAMES+=("$arg") ;;
  esac
done

if [[ ${#NAMES[@]} -eq 0 ]]; then
  echo "Usage: $0 [--write-config] <banner-id> [banner-id...]" >&2
  echo "Example: $0 --write-config google" >&2
  exit 1
fi

if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "Missing backend env file: $BACKEND_ENV" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source <(grep -E '^CLOUDINARY_' "$BACKEND_ENV" | sed 's/\r$//')
set +a

for var in CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing $var in $BACKEND_ENV" >&2
    exit 1
  fi
done

mkdir -p "$BANNERS_DIR"

export BANNERS_DIR WRITE_CONFIG="$WRITE_CONFIG"
export CONFIG_PATH="$ROOT/lib/config/products-brand-banners.ts"
export NAMES_JSON
NAMES_JSON="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1:]))' "${NAMES[@]}")"

python3 <<'PY'
import json
import os
import re
import sys

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True,
)

banners_dir = os.environ["BANNERS_DIR"]
names = json.loads(os.environ["NAMES_JSON"])
write_config = os.environ.get("WRITE_CONFIG") == "1"
config_path = os.environ["CONFIG_PATH"]

results = {}
dimensions = {}
missing = []

for name in names:
    path = None
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        candidate = os.path.join(banners_dir, f"{name}{ext}")
        if os.path.isfile(candidate):
            path = candidate
            break
    if not path:
        missing.append(name)
        continue

    try:
        from PIL import Image

        with Image.open(path) as img:
            dimensions[name] = img.size
    except Exception:
        dimensions[name] = (None, None)

    result = cloudinary.uploader.upload(
        path,
        folder="products-banners",
        public_id=name,
        overwrite=True,
        resource_type="image",
    )
    results[name] = result["secure_url"]
    w, h = dimensions.get(name, (None, None))
    print(f"{name}: {result['secure_url']}")
    if w and h:
        print(f"  dimensions: {w}x{h}")

if missing:
    print("\nMissing local files for:", ", ".join(missing), file=sys.stderr)
    print(f"Add images under {banners_dir}/", file=sys.stderr)

if not results:
    sys.exit(1)

if write_config and results:
    text = open(config_path, encoding="utf-8").read()
    for name, url in results.items():
        w, h = dimensions.get(name, (None, None))
        block_start = text.find(f"  {name}: {{")
        if block_start < 0:
            print(f"Could not find banner key '{name}' in config", file=sys.stderr)
            continue
        block_end = text.find("\n  },", block_start)
        if block_end < 0:
            block_end = text.find("\n};", block_start)
        block = text[block_start:block_end]

        if "backgroundImage:" in block:
            block = re.sub(
                r"backgroundImage:\s*(?:`[^`]*`|'[^']*'|\"[^\"]*\"),?",
                f"backgroundImage:\n      '{url}',",
                block,
                count=1,
            )
        else:
            block = block.rstrip() + f"\n    backgroundImage:\n      '{url}',"

        if w and h:
            if "imageWidth:" in block:
                block = re.sub(r"imageWidth:\s*\d+,?", f"imageWidth: {w},", block)
            else:
                block += f"\n    imageWidth: {w},"
            if "imageHeight:" in block:
                block = re.sub(r"imageHeight:\s*\d+,?", f"imageHeight: {h},", block)
            else:
                block += f"\n    imageHeight: {h},"

        block = re.sub(r"\n\s*backgroundColor:[^\n]*", "", block)
        text = text[:block_start] + block + text[block_end:]

    open(config_path, "w", encoding="utf-8").write(text)
    print(f"\nUpdated {config_path}")
PY
