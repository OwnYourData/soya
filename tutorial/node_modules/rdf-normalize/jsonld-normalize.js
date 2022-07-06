/**
 * A JavaScript implementation of the JSON-LD API.
 *
 * @author Dave Longley
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2011-2014 Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the Digital Bazaar, Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// constants
    var XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

    var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    var RDF_LANGSTRING = RDF + 'langString';

    /**
     * Constructs a new JSON-LD Processor.
     */
    var Processor = function() {};

    /**
     * Performs normalization on the given RDF dataset.
     *
     * @param dataset the RDF dataset to normalize.
     * @param options the normalization options.
     * @param callback(err, normalized) called once the operation completes.
     */
    Processor.prototype.normalize = function(dataset, options, callback) {
      // create quads and map bnodes to their associated quads
      var quads = [];
      var bnodes = {};
      for(var graphName in dataset) {
        var triples = dataset[graphName];
        if(graphName === '@default') {
          graphName = null;
        }
        for(var ti = 0; ti < triples.length; ++ti) {
          var quad = triples[ti];
          if(graphName !== null) {
            if(graphName.indexOf('_:') === 0) {
              quad.name = {type: 'blank node', value: graphName};
            } else {
              quad.name = {type: 'IRI', value: graphName};
            }
          }
          quads.push(quad);

          var attrs = ['subject', 'object', 'name'];
          for(var ai = 0; ai < attrs.length; ++ai) {
            var attr = attrs[ai];
            if(quad[attr] && quad[attr].type === 'blank node') {
              var id = quad[attr].value;
              if(id in bnodes) {
                bnodes[id].quads.push(quad);
              } else {
                bnodes[id] = {quads: [quad]};
              }
            }
          }
        }
      }

      // mapping complete, start canonical naming
      var namer = new UniqueNamer('_:c14n');
      return hashBlankNodes(Object.keys(bnodes));

      // generates unique and duplicate hashes for bnodes
      function hashBlankNodes(unnamed) {
        var nextUnnamed = [];
        var duplicates = {};
        var unique = {};

        // TODO: instead of N calls to setImmediate, run
        // atomic normalization parts for a specified
        // slice of time (perhaps configurable) as this
        // will better utilize CPU and improve performance
        // as JS processing speed improves

        // hash quads for each unnamed bnode
        return hashUnnamed(0);
        function hashUnnamed(i) {
          if(i === unnamed.length) {
            // done, name blank nodes
            return nameBlankNodes(unique, duplicates, nextUnnamed);
          }

          // hash unnamed bnode
          var bnode = unnamed[i];
          var hash = _hashQuads(bnode, bnodes);

          // store hash as unique or a duplicate
          if(hash in duplicates) {
            duplicates[hash].push(bnode);
            nextUnnamed.push(bnode);
          } else if(hash in unique) {
            duplicates[hash] = [unique[hash], bnode];
            nextUnnamed.push(unique[hash]);
            nextUnnamed.push(bnode);
            delete unique[hash];
          } else {
            unique[hash] = bnode;
          }

          // hash next unnamed bnode
          return hashUnnamed(i + 1);
        }
      }

      // names unique hash bnodes
      function nameBlankNodes(unique, duplicates, unnamed) {
        // name unique bnodes in sorted hash order
        var named = false;
        var hashes = Object.keys(unique).sort();
        for(var i = 0; i < hashes.length; ++i) {
          var bnode = unique[hashes[i]];
          namer.getName(bnode);
          named = true;
        }

        if(named) {
          // continue to hash bnodes if a bnode was assigned a name
          return hashBlankNodes(unnamed);
        } else {
          // name the duplicate hash bnodes
          return nameDuplicates(duplicates);
        }
      }

      // names duplicate hash bnodes
      function nameDuplicates(duplicates) {
        // enumerate duplicate hash groups in sorted order
        var hashes = Object.keys(duplicates).sort();

        // process each group
        return processGroup(0);
        function processGroup(i) {
          if(i === hashes.length) {
            // done, create JSON-LD array
            return createArray();
          }

          // name each group member
          var group = duplicates[hashes[i]];
          var results = [];
          return nameGroupMember(group, 0);
          function nameGroupMember(group, n) {
            if(n === group.length) {
              // name bnodes in hash order
              results.sort(function(a, b) {
                a = a.hash;
                b = b.hash;
                return (a < b) ? -1 : ((a > b) ? 1 : 0);
              });
              for(var r = 0; r < results.length; ++r) {
                // name all bnodes in path namer in key-entry order
                // Note: key-order is preserved in javascript
                for(var key in results[r].pathNamer.existing) {
                  namer.getName(key);
                }
              }
              return processGroup(i + 1);
            }

            // skip already-named bnodes
            var bnode = group[n];
            if(namer.isNamed(bnode)) {
              return nameGroupMember(group, n + 1);
            }

            // hash bnode paths
            var pathNamer = new UniqueNamer('_:b');
            pathNamer.getName(bnode);
            return _hashPaths(bnode, bnodes, namer, pathNamer,
              function(err, result) {
                if(err) {
                  return callback(err);
                }
                results.push(result);
                return nameGroupMember(group, n + 1);
              });
          }
        }
      }

      // creates the sorted array of RDF quads
      function createArray() {
        var normalized = [];

        /* Note: At this point all bnodes in the set of RDF quads have been
         assigned canonical names, which have been stored in the 'namer' object.
         Here each quad is updated by assigning each of its bnodes its new name
         via the 'namer' object. */

        // update bnode names in each quad and serialize
        for(var i = 0; i < quads.length; ++i) {
          var quad = quads[i];
          var attrs = ['subject', 'object', 'name'];
          for(var ai = 0; ai < attrs.length; ++ai) {
            var attr = attrs[ai];
            if(quad[attr] && quad[attr].type === 'blank node' &&
              quad[attr].value.indexOf('_:c14n') !== 0) {
              quad[attr].value = namer.getName(quad[attr].value);
            }
          }
          normalized.push(_toNQuad(quad, quad.name ? quad.name.value : null));
        }

        // sort normalized output
        return normalized.sort().join('');
      }
    };

    /**
     * Hashes all of the quads about a blank node.
     *
     * @param id the ID of the bnode to hash quads for.
     * @param bnodes the mapping of bnodes to quads.
     *
     * @return the new hash.
     */
    function _hashQuads(id, bnodes) {
      // return cached hash
      if('hash' in bnodes[id]) {
        return bnodes[id].hash;
      }

      // serialize all of bnode's quads
      var quads = bnodes[id].quads;
      var nquads = [];
      for(var i = 0; i < quads.length; ++i) {
        nquads.push(_toNQuad(
          quads[i], quads[i].name ? quads[i].name.value : null, id));
      }
      // sort serialized quads
      nquads.sort();
      // return hashed quads
      var hash = bnodes[id].hash = sha1.hash(nquads);
      return hash;
    }

    /**
     * Produces a hash for the paths of adjacent bnodes for a bnode,
     * incorporating all information about its subgraph of bnodes. This
     * method will recursively pick adjacent bnode permutations that produce the
     * lexicographically-least 'path' serializations.
     *
     * @param id the ID of the bnode to hash paths for.
     * @param bnodes the map of bnode quads.
     * @param namer the canonical bnode namer.
     * @param pathNamer the namer used to assign names to adjacent bnodes.
     * @param callback(err, result) called once the operation completes.
     */
    function _hashPaths(id, bnodes, namer, pathNamer, callback) {
      // create SHA-1 digest
      var md = sha1.create();

      // group adjacent bnodes by hash, keep properties and references separate
      var groups = {};
      var groupHashes;
      var quads = bnodes[id].quads;
      return groupNodes(0);
      function groupNodes(i) {
        if(i === quads.length) {
          // done, hash groups
          groupHashes = Object.keys(groups).sort();
          return hashGroup(0);
        }

        // get adjacent bnode
        var quad = quads[i];
        var bnode = _getAdjacentBlankNodeName(quad.subject, id);
        var direction = null;
        if(bnode !== null) {
          // normal property
          direction = 'p';
        } else {
          bnode = _getAdjacentBlankNodeName(quad.object, id);
          if(bnode !== null) {
            // reverse property
            direction = 'r';
          }
        }

        if(bnode !== null) {
          // get bnode name (try canonical, path, then hash)
          var name;
          if(namer.isNamed(bnode)) {
            name = namer.getName(bnode);
          } else if(pathNamer.isNamed(bnode)) {
            name = pathNamer.getName(bnode);
          } else {
            name = _hashQuads(bnode, bnodes);
          }

          // hash direction, property, and bnode name/hash
          var md = sha1.create();
          md.update(direction);
          md.update(quad.predicate.value);
          md.update(name);
          var groupHash = md.digest();

          // add bnode to hash group
          if(groupHash in groups) {
            groups[groupHash].push(bnode);
          } else {
            groups[groupHash] = [bnode];
          }
        }

        return groupNodes(i + 1);
      }

      // hashes a group of adjacent bnodes
      function hashGroup(i) {
        if(i === groupHashes.length) {
          // done, return SHA-1 digest and path namer
          return callback(null, {hash: md.digest(), pathNamer: pathNamer});
        }

        // digest group hash
        var groupHash = groupHashes[i];
        md.update(groupHash);

        // choose a path and namer from the permutations
        var chosenPath = null;
        var chosenNamer = null;
        var permutator = new Permutator(groups[groupHash]);
        return permutate();
        function permutate() {
          var permutation = permutator.next();
          var pathNamerCopy = pathNamer.clone();

          // build adjacent path
          var path = '';
          var recurse = [];
          for(var n in permutation) {
            var bnode = permutation[n];

            // use canonical name if available
            if(namer.isNamed(bnode)) {
              path += namer.getName(bnode);
            } else {
              // recurse if bnode isn't named in the path yet
              if(!pathNamerCopy.isNamed(bnode)) {
                recurse.push(bnode);
              }
              path += pathNamerCopy.getName(bnode);
            }

            // skip permutation if path is already >= chosen path
            if(chosenPath !== null && path.length >= chosenPath.length &&
              path > chosenPath) {
              return nextPermutation(true);
            }
          }

          // does the next recursion
          return nextRecursion(0);
          function nextRecursion(n) {
            if(n === recurse.length) {
              // done, do next permutation
              return nextPermutation(false);
            }

            // do recursion
            var bnode = recurse[n];
            return _hashPaths(bnode, bnodes, namer, pathNamerCopy,
              function(err, result) {
                if(err) {
                  return callback(err);
                }
                path += pathNamerCopy.getName(bnode) + '<' + result.hash + '>';
                pathNamerCopy = result.pathNamer;

                // skip permutation if path is already >= chosen path
                if(chosenPath !== null && path.length >= chosenPath.length &&
                  path > chosenPath) {
                  return nextPermutation(true);
                }

                // do next recursion
                return nextRecursion(n + 1);
              });
          }

          // stores the results of this permutation and runs the next
          function nextPermutation(skipped) {
            if(!skipped && (chosenPath === null || path < chosenPath)) {
              chosenPath = path;
              chosenNamer = pathNamerCopy;
            }

            // do next permutation
            if(permutator.hasNext()) {
              return permutate();
            } else {
              // digest chosen path and update namer
              md.update(chosenPath);
              pathNamer = chosenNamer;

              // hash the next group
              return hashGroup(i + 1);
            }
          }
        }
      }
    }

    /**
     * A helper function that gets the blank node name from an RDF quad node
     * (subject or object). If the node is a blank node and its value
     * does not match the given blank node ID, it will be returned.
     *
     * @param node the RDF quad node.
     * @param id the ID of the blank node to look next to.
     *
     * @return the adjacent blank node name or null if none was found.
     */
    function _getAdjacentBlankNodeName(node, id) {
      return (node.type === 'blank node' && node.value !== id ? node.value : null);
    }

    /**
     * Clones an object, array, or string/number. If a typed JavaScript object
     * is given, such as a Date, it will be converted to a string.
     *
     * @param value the value to clone.
     *
     * @return the cloned value.
     */
    function _clone(value) {
      if(value && typeof value === 'object') {
        var rval;
        if(Array.isArray(value)) {
          rval = [];
          for(var i = 0; i < value.length; ++i) {
            rval[i] = _clone(value[i]);
          }
        } else if(typeof value === 'object') {
          rval = {};
          for(var key in value) {
            rval[key] = _clone(value[key]);
          }
        } else {
          rval = value.toString();
        }
        return rval;
      }
      return value;
    }

    /**
     * Converts an RDF triple and graph name to an N-Quad string (a single quad).
     *
     * @param triple the RDF triple to convert.
     * @param graphName the name of the graph containing the triple, null for
     *          the default graph.
     * @param bnode the bnode the quad is mapped to (optional, for use
     *          during normalization only).
     *
     * @return the N-Quad string.
     */
    function _toNQuad(triple, graphName, bnode) {
      var s = triple.subject;
      var p = triple.predicate;
      var o = triple.object;
      var g = graphName;

      var quad = '';

      // subject is an IRI
      if(s.type === 'IRI') {
        quad += '<' + s.value + '>';
      } else if(bnode) {
        // bnode normalization mode
        quad += (s.value === bnode) ? '_:a' : '_:z';
      } else {
        // bnode normal mode
        quad += s.value;
      }
      quad += ' ';

      // predicate is an IRI
      if(p.type === 'IRI') {
        quad += '<' + p.value + '>';
      } else if(bnode) {
        // FIXME: TBD what to do with bnode predicates during normalization
        // bnode normalization mode
        quad += '_:p';
      } else {
        // bnode normal mode
        quad += p.value;
      }
      quad += ' ';

      // object is IRI, bnode, or literal
      if(o.type === 'IRI') {
        quad += '<' + o.value + '>';
      } else if(o.type === 'blank node') {
        // normalization mode
        if(bnode) {
          quad += (o.value === bnode) ? '_:a' : '_:z';
        } else {
          // normal mode
          quad += o.value;
        }
      } else {
        var escaped = o.value
          .replace(/\\/g, '\\\\')
          .replace(/\t/g, '\\t')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\"/g, '\\"');
        quad += '"' + escaped + '"';
        if(o.datatype === RDF_LANGSTRING) {
          if(o.language) {
            quad += '@' + o.language;
          }
        } else if(o.datatype !== XSD_STRING) {
          quad += '^^<' + o.datatype + '>';
        }
      }

      // graph
      if(g !== null) {
        if(g.indexOf('_:') !== 0) {
          quad += ' <' + g + '>';
        } else if(bnode) {
          quad += ' _:g';
        } else {
          quad += ' ' + g;
        }
      }

      quad += ' .\n';
      return quad;
    }

    /**
     * Creates a new UniqueNamer. A UniqueNamer issues unique names, keeping
     * track of any previously issued names.
     *
     * @param prefix the prefix to use ('<prefix><counter>').
     */
    function UniqueNamer(prefix) {
      this.prefix = prefix;
      this.counter = 0;
      this.existing = {};
    }

    /**
     * Copies this UniqueNamer.
     *
     * @return a copy of this UniqueNamer.
     */
    UniqueNamer.prototype.clone = function() {
      var copy = new UniqueNamer(this.prefix);
      copy.counter = this.counter;
      copy.existing = _clone(this.existing);
      return copy;
    };

    /**
     * Gets the new name for the given old name, where if no old name is given
     * a new name will be generated.
     *
     * @param [oldName] the old name to get the new name for.
     *
     * @return the new name.
     */
    UniqueNamer.prototype.getName = function(oldName) {
      // return existing old name
      if(oldName && oldName in this.existing) {
        return this.existing[oldName];
      }

      // get next name
      var name = this.prefix + this.counter;
      this.counter += 1;

      // save mapping
      if(oldName) {
        this.existing[oldName] = name;
      }

      return name;
    };

    /**
     * Returns true if the given oldName has already been assigned a new name.
     *
     * @param oldName the oldName to check.
     *
     * @return true if the oldName has been assigned a new name, false if not.
     */
    UniqueNamer.prototype.isNamed = function(oldName) {
      return (oldName in this.existing);
    };

    /**
     * A Permutator iterates over all possible permutations of the given array
     * of elements.
     *
     * @param list the array of elements to iterate over.
     */
    var Permutator = function(list) {
      // original array
      this.list = list.sort();
      // indicates whether there are more permutations
      this.done = false;
      // directional info for permutation algorithm
      this.left = {};
      for(var i = 0; i < list.length; ++i) {
        this.left[list[i]] = true;
      }
    };

    /**
     * Returns true if there is another permutation.
     *
     * @return true if there is another permutation, false if not.
     */
    Permutator.prototype.hasNext = function() {
      return !this.done;
    };

    /**
     * Gets the next permutation. Call hasNext() to ensure there is another one
     * first.
     *
     * @return the next permutation.
     */
    Permutator.prototype.next = function() {
      // copy current permutation
      var rval = this.list.slice();

      /* Calculate the next permutation using the Steinhaus-Johnson-Trotter
       permutation algorithm. */

      // get largest mobile element k
      // (mobile: element is greater than the one it is looking at)
      var k = null;
      var pos = 0;
      var length = this.list.length;
      for(var i = 0; i < length; ++i) {
        var element = this.list[i];
        var left = this.left[element];
        if((k === null || element > k) &&
          ((left && i > 0 && element > this.list[i - 1]) ||
          (!left && i < (length - 1) && element > this.list[i + 1]))) {
          k = element;
          pos = i;
        }
      }

      // no more permutations
      if(k === null) {
        this.done = true;
      } else {
        // swap k and the element it is looking at
        var swap = this.left[k] ? pos - 1 : pos + 1;
        this.list[pos] = this.list[swap];
        this.list[swap] = k;

        // reverse the direction of all elements larger than k
        for(var i = 0; i < length; ++i) {
          if(this.list[i] > k) {
            this.left[this.list[i]] = !this.left[this.list[i]];
          }
        }
      }

      return rval;
    };

// SHA-1 API
    var sha1 = {};

    var crypto = require('crypto');
    sha1.create = function() {
      var md = crypto.createHash('sha1');
      return {
        update: function(data) {
          md.update(data, 'utf8');
        },
        digest: function() {
          return md.digest('hex');
        }
      };
    };

    /**
     * Hashes the given array of quads and returns its hexadecimal SHA-1 message
     * digest.
     *
     * @param nquads the list of serialized quads to hash.
     *
     * @return the hexadecimal SHA-1 message digest.
     */
    sha1.hash = function(nquads) {
      var md = sha1.create();
      for(var i = 0; i < nquads.length; ++i) {
        md.update(nquads[i]);
      }
      return md.digest();
    };

function normalize (dataset) {
  var processor = new Processor()

  return processor.normalize(dataset)
}

module.exports = normalize
