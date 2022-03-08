#!/usr/bin/env bash

# 01-person_test: test pushing a YML
cat inputs/person_test.yml | soya init | soya push > tmp.doc
if ! cmp -s tmp.doc checks/push.txt ; then
	echo "error: pushing base layer from YML failed"
	rm tmp.doc
	exit 1
fi

# 02-person_validation:
cat inputs/person_validation_test.yml | soya init | soya push > tmp.doc
if ! cmp -s tmp.doc checks/push_overlay.txt ; then
	echo "error: pushing overlay layer from YML failed"
	rm tmp.doc
	exit 1
fi

# 03-person_overlay:
soya pull PersonOverlay_Test > tmp.doc
if ! cmp -s tmp.doc inputs/person_overlay.jsonld ; then
	echo "error: validating overlay layer after push failed"
	rm tmp.doc
	exit 1
fi
echo "passed: pushing from YML"
rm tmp.doc

# 04-flat_json: test validating flat JSON
echo '{"hello": "world"}' | soya validate Person_Test > tmp.doc
if ! cmp -s tmp.doc checks/flat.txt ; then
	echo "error: validating flat JSON failed"
	rm tmp.doc
	exit 1
else
	echo "passed: flat JSON validation"
fi
rm tmp.doc

# 05-validation_overlay: test validation overlay
curl -k -s "https://playground.data-container.net/Person2instance_test" | soya validate Person_Test > tmp.doc
if ! cmp -s tmp.doc checks/invalidPerson.json ; then
	echo "error: invalidPerson validation failed"
	rm tmp.doc
	exit 1
fi
rm tmp.doc

# 06-valdidation_mixed
curl -k -s "https://playground.data-container.net/Person2instance" | soya validate Person_Test > tmp.doc
if ! cmp -s tmp.doc checks/mixedPersonClasses.json ; then
	echo "error: mixed Person classes validation failed"
	rm tmp.doc
	exit 1
fi
rm tmp.doc

# 07-validation_valid
curl -k -s "https://playground.data-container.net/PersonValid" | soya validate Person_Test > tmp.doc
if ! cmp -s tmp.doc checks/validPerson.json ; then
	echo "error: validPerson validation failed"
	rm tmp.doc
	exit 1
else
	echo "passed: validation layer checks"
fi
rm tmp.doc

# test transformation overlay
# 08x-transformation_setup
cat inputs/person_a.yml | soya init | soya push > /dev/null
cat inputs/person_b.yml | soya init | soya push > /dev/null
cat inputs/person_b_jolt.yml | soya init | soya push > /dev/null

# 09-transformation_jq
curl -k -s https://playground.data-container.net/PersonAinstance | soya transform PersonB | soya validate PersonB > tmp.doc
if ! cmp -s tmp.doc checks/PersonBjq.json ; then
	echo "error: transform with jq failed"
	rm tmp.doc
	exit 1
fi
rm tmp.doc

# 10-transform_jolt
curl -k -s https://playground.data-container.net/PersonAinstance | soya transform PersonBjolt | soya validate PersonB > tmp.doc
if ! cmp -s tmp.doc checks/PersonBjolt.json ; then
	echo "error: transform with jolt failed"
	rm tmp.doc
	exit 1
else
	echo "passed: transformation layer checks"
fi
rm tmp.doc

# 11-acquisition: test acquistion
curl -k -s https://playground.data-container.net/cfa | soya acquire Employee > tmp.doc
if ! cmp -s tmp.doc checks/acquire.jsonld ; then
	echo "error: acquire failed"
	rm tmp.doc
	exit 1
fi

# 11a-acquisition
cat inputs/team.json | soya acquire Employee > tmp.doc
if ! cmp -s tmp.doc checks/acquire_array.jsonld ; then
	echo "error: acquire array failed"
	rm tmp.doc
	exit 1
else
	echo "passed: acquistion checks"
fi
rm tmp.doc

# 12-instance_push
cat inputs/team.json | soya acquire Employee | soya push --repo https://playground.data-container.net | jq '.["responses"]' > tmp.doc
if ! cmp -s tmp.doc checks/instance.json ; then
	echo "error: pushing instance failed"
	rm tmp.doc
	exit 1
else
	echo "passed: pushing instance"
fi
rm tmp.doc
