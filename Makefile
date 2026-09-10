.PHONY: help build up up-prod down logs test tag

SHELL := /bin/sh

REGISTRY ?= ghcr.io
IMAGE ?= claudiovargas/node-demo-typescript
TAG ?= latest

help:
	@echo "Objetivos disponibles:"
	@echo "  make build      -> construye la imagen Docker (target runtime)"
	@echo "  make dev        -> levanta app + MySQL en modo desarrollo"
	@echo "  make up         -> despliegue estándar (compose.yaml)"
	@echo "  make up-prod    -> despliegue de producción (compose.prod.yaml)"
	@echo "  make down       -> detiene y elimina los contenedores"
	@echo "  make logs       -> logs en vivo de la API"
	@echo "  make test       -> ejecuta los tests de Jest en local"
	@echo "  make tag        -> imprime el nombre completo de la imagen OCI"

build:
	docker compose build

dev:
	docker compose up -d

up:
	docker compose up -d

up-prod:
	docker compose -f compose.prod.yaml up -d --build

down:
	docker compose down

logs:
	docker compose logs -f app

# La imagen runtime NO trae devDependencies (jest), por lo que los tests se
# ejecutan en local igual que en CI (el job `test` del workflow).
test:
	npm test

tag:
	@echo "$(REGISTRY)/$(IMAGE):$(TAG)"