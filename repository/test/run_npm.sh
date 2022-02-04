#!/usr/bin/env bash
docker run -it node:17 bash -c "npm i --silent -g soya-cli@latest &>/dev/null; soya pull Person_Test" > tmp.doc
if ! cmp -s tmp.doc checks/person_test.jsonld ; then
	echo "error: npm soya install failed"
	rm tmp*.doc
	exit 1
else
	echo "passed: npm install"
fi
rm tmp*.doc