project := "tenyoru"

build:
    hugo

deploy project=project: build
    npm install
    wrangler pages deploy public --project-name {{project}} --commit-dirty=true

# print the prod og-image worker URL for any page (local or prod). e.g. just og http://localhost:1313/blog/hello-world/
og url:
    @curl -s "{{url}}" | grep -oE 'content="[^"]*/og-image\?[^"]*"' | head -1 | sed -E 's#^content="https?://[^/]*/og-image#https://tenyoru.io/og-image#; s#"$##'
