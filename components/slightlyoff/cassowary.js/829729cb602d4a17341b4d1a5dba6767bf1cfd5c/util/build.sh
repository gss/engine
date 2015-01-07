#!/bin/bash

# Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
#
# Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

COMMAND='python post.py'

# To invoke in debug mode, run with a debug env variable like:
# $> DEBUG=1 ./build.sh
if [ ${DEBUG:=0} == 1 ]; then
     COMMAND='cat'
fi

# Run it through uglify.
$COMMAND ../src/c.js\
         ../src/HashTable.js\
         ../src/HashSet.js\
         ../src/Error.js\
         ../src/SymbolicWeight.js\
         ../src/Strength.js\
         ../src/Variable.js\
         ../src/Point.js\
         ../src/Expression.js\
         ../src/Constraint.js\
         ../src/EditInfo.js\
         ../src/Tableau.js\
         ../src/SimplexSolver.js\
         ../src/Timer.js\
         ../src/parser/parser.js \
         ../src/parser/api.js > out.js

cat preamble.js out.js afterward.js > ../bin/c.js

rm out.js
