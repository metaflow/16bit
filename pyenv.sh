#!/usr/bin/env bash

deactivate

deps() {
    pip3 install --upgrade pip
    pip3 install pyserial tabulate
    echo installing modules
}

source ./env/bin/activate && \
    deps && \
    echo "\n----------------\nrun 'deactivate' to exit python environment" && \
    return

echo env is not found installing everything

python3 -m pip install --upgrade pip
python3 -m pip install --user virtualenv
python3 -m venv ./env
source ./env/bin/activate
deps
echo source this script next time to activate the environment
