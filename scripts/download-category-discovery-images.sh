#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/images/category-discovery"
BASE="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is"

file_magic() {
  od -An -tx1 -N3 "$1" 2>/dev/null | tr -d ' \n'
}

download_one() {
  local name="$1" path="$2" query="$3"
  local tmp="$DIR/.tmp_${name}"
  local url="${BASE}/${path}?${query}"
  local headers magic ext ctype

  headers=$(curl -fsSL -D - -o "$tmp" "$url")
  ctype=$(printf '%s' "$headers" | grep -i '^content-type:' | tail -1 | sed 's/content-type: //I' | tr -d '\r')
  magic=$(file_magic "$tmp")

  case "$magic" in
    ffd8ff*) ext=jpg ;;
    89504e*) ext=png ;;
    *)
      if echo "$ctype" | grep -qi jpeg; then
        ext=jpg
      else
        ext=png
      fi
      ;;
  esac

  rm -f "$DIR/${name}.png" "$DIR/${name}.jpg"
  mv "$tmp" "$DIR/${name}.${ext}"
  echo "  ${name}.${ext} (${ctype}, ${magic})"
}

mkdir -p "$DIR"
rm -f "$DIR"/*.png "$DIR"/*.jpg "$DIR"/.tmp_* 2>/dev/null || true

echo "Downloading category discovery images..."
download_one hero-iphone-pro iphone-get-ready-iphone-17-pro-hero-202509 "wid=664&hei=840&fmt=png-alpha"
download_one hero-watch store-card-13-watch-nav-202509 "wid=400&hei=520&fmt=png-alpha"
download_one hero-airpods store-card-13-airpods-nav-202509 "wid=400&hei=520&fmt=png-alpha"
download_one iphone store-card-40-iphone-17-202509 "wid=1200&hei=1500&fmt=png-alpha"
download_one ipad store-card-40-ipad-air-202603 "wid=1200&hei=1500&fmt=jpeg&qlt=90"
download_one watch store-card-40-watch-s11-202509 "wid=1200&hei=1500&fmt=jpeg&qlt=90"
download_one airpods-pro airpods-pro-3-hero-select-202509 "wid=800&hei=800&fmt=png-alpha"
download_one airpods-max store-card-40-airpods-max-202409_GEO_US "wid=1200&hei=1500&fmt=jpeg&qlt=90"
download_one macbook-air store-card-40-macbook-air-202603 "wid=1200&hei=1500&fmt=jpeg&qlt=90"
download_one macbook-pro store-card-40-macbook-pro-202510 "wid=1200&hei=1500&fmt=jpeg&qlt=90"
download_one mac-desktop store-card-40-pro-display-202603 "wid=1200&hei=1500&fmt=jpeg&qlt=90"

echo "Done."
ls -la "$DIR"
