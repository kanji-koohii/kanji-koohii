#! /bin/bash
#
#  concat the legacy YUI2 files into a pretend module

BUILD_PATH=.
OUTFILE=$BUILD_PATH/index.min.js

# must use `var` so it is available on `window`
# echo -e "var YAHOO = {};\n\n" > $OUTFILE;

# must come first
cat $BUILD_PATH/yahoo-dom-event/yahoo-dom-event.js >> $OUTFILE;

# concat other YUI2 modules
cat $BUILD_PATH/animation/animation-min.js >> $OUTFILE;
echo -e "\n\n" >> $OUTFILE;
cat $BUILD_PATH/connection/connection-min.js >> $OUTFILE;
echo -e "\n\n" >> $OUTFILE;
cat $BUILD_PATH/container/container-min.js >> $OUTFILE;
echo -e "\n\n" >> $OUTFILE;
cat $BUILD_PATH/dragdrop/dragdrop-min.js >> $OUTFILE;
echo -e "\n\n" >> $OUTFILE;

# echo -e "export default YAHOO;" >> $OUTFILE;
