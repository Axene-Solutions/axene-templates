.PHONY: dev build logs down deploy dq

deploy:
	./scripts/deploy.sh

dq:
	./scripts/deploy.sh --quick

dev:
	docker compose up --build

build:
	docker compose build

logs:
	docker compose logs -f

down:
	docker compose down
# --- Releases (added by Axene release tooling) ------------------------------
.PHONY: release release-only
# make release            -> auto-bump patch, tag, GitHub Release, then deploy
# make release v=0.2.0    -> explicit version
# make release bump=minor -> or bump=major
release:
	VERSION_ARG="$(v)" BUMP="$(or $(bump),patch)" ./scripts/release.sh
# Tag + GitHub Release without deploying
release-only:
	VERSION_ARG="$(v)" BUMP="$(or $(bump),patch)" ./scripts/release.sh --no-deploy
