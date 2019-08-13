#!/bin/sh

# Link all files in src/ to dist/ so that we can serve out of there.

find src -type f | while read src; do
  dist=dist/${src#src/}
  count=$(dirname "$dist")
  ts=${src%.map}
  ts=${ts%.ts}
  ts=${ts%.js}.ts
  if [ -e "$ts" ]; then
    # Don't link js/map files if a ts file exists
    continue
  fi
  # echo "src: $src ; dist: $dist ; count: $count ; ts: $ts"
  rel=$src
  while [ "$count" != "$(dirname "$count")" ]; do
    count=$(dirname "$count")
    rel=../$rel
  done
  mkdir -p "$(dirname "$dist")"
  ln -s "$rel" "$dist"
done

for file in main check tracker edit/index; do
  mkdir -p "$(dirname "dist/js/$file")"
  ln -s "$file.js" "dist/js/$file.min.js"
done
