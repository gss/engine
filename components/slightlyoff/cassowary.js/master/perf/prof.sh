#!/bin/bash

# Use of this source code is governed by
#     http://www.apache.org/licenses/LICENSE-2.0
# Copyright (C) 2014, Alex Russell (slightlyoff@chromium.org)

D8PATH=$(type -P d8)
D8DIR=$(dirname ${D8PATH})
BENCH_FILES=run-perf.js


if   [ $D8PATH ]  && [ -x $D8PATH ]; then
  D8DIR=$(dirname ${D8PATH})
else
  echo "FAILED: No d8/v8 directory found! Please add v8_edge to your \$PATH and build d8"
  exit 1;
fi

rm -rf v8.log
rm -rf test.prof

$D8PATH --harmony $BENCH_FILES

$D8PATH --harmony --prof --trace-opt --trace-deopt --code-comments $BENCH_FILES > deopts.log
$D8DIR/tools/mac-tick-processor v8.log > test.prof

$D8PATH --trace-hydrogen --trace-phase=Z --trace-deopt --code-comments --hydrogen-track-positions --redirect-code-traces --redirect-code-traces-to=code.asm --print-opt-code $BENCH_FILES

