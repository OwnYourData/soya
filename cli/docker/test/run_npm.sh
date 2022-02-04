#!/usr/bin/env bash
docker run -it node:17 bash -c "npm i --silent -g soya-cli@latest &>/dev/null; soya pull Person_Test" > tmp.doc
soya pull Person_Test > tmp1.doc
if ! cmp - tmp.doc tmp1.doc ; then
	echo "error: npm soya install failed"
	rm tmp*.doc
	exit 1
else
	echo "passed: npm install"
fi
rm tmp*.doc