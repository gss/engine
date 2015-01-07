all: parser test build

build:
	cd util; ./build.sh

debug:
	cd util; DEBUG=1 ./build.sh

test:
	npm test

dist: build
	rm -rf dist/cassowary/
	mkdir -p dist/cassowary/
	cp -r LICENSE bin package.json README.md dist/cassowary/
	cd dist; tar -zcf cassowary.tar.gz cassowary

parser:
	./node_modules/pegjs/bin/pegjs \
		-e "this.c.parser" \
		src/parser/grammar.pegjs src/parser/parser.js

.PHONY: test
