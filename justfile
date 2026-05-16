project := "tenyoru"

build:
    hugo

deploy project=project: build
    wrangler pages deploy public --project-name {{project}} --commit-dirty=true
