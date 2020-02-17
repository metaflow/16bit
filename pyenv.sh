#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

deactivate

deps() {
    echo installing modules
}

source $DIR/env/bin/activate && \
    deps && \
    echo "\n----------------\nrun 'deactivate' to exit python environment" && \
    return

echo env is not found installing everything

python3 -m pip install --upgrade pip
python3 -m pip install --user virtualenv
python3 -m venv env
source $DIR/env/bin/activate
deps
echo source this script next time to activate the environment
