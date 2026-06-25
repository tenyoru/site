project := "tenyoru"

build:
    hugo

deploy project=project: build
    npm install
    wrangler pages deploy public --project-name {{project}} --commit-dirty=true
