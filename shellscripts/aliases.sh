#bin/bash

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
echo "Script directory: $SCRIPT_DIR"
alias start='$SCRIPT_DIR/start.sh'
