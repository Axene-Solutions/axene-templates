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
