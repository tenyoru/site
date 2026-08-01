project := "tenyoru"

# rm -rf first: a stale public/ (e.g. left on disk by a prior `hugo server
# --renderToDisk` run) would otherwise silently survive into the deploy.
# --environment production pins prod templating regardless of any ambient
# HUGO_ENVIRONMENT in the caller's shell.
build:
    rm -rf public
    hugo --environment production

deploy project=project: build
    @grep -q livereload public/index.html && { echo "refusing to deploy: public/ contains dev-server output"; exit 1; } || true
    npm install
    wrangler pages deploy public --project-name {{project}} --commit-dirty=true

# print the prod og-image worker URL for any page (local or prod). e.g. just og http://localhost:1313/blog/hello-world/
og url:
    @curl -s "{{url}}" | grep -oE 'content="[^"]*/og-image\?[^"]*"' | head -1 | sed -E 's#^content="https?://[^/]*/og-image#https://tenyoru.io/og-image#; s#"$##'
