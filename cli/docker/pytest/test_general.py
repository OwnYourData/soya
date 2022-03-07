import pytest
import os
import sys
import glob
import requests
import subprocess
from pathlib import Path

repo = "https://soya.data-container.net"

def test_repo():
    response = requests.get(repo + "/api/active")
    assert response.status_code == 200

# doc: https://pypi.org/project/pytest-subprocess/
cwd = os.getcwd()
@pytest.mark.parametrize('input',  glob.glob(cwd+'/01_input/*'))
def test_01_simple(fp, input):
    fp.allow_unregistered(True)
    with open(input) as f:
        content = f.read()
    with open(input.replace("_input/", "_output/")) as f:
        result = f.read()

    process = subprocess.Popen(
            ["soya", "init"], 
            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            universal_newlines=True,
        )
    out, _ = process.communicate(input=content)

    assert process.returncode == 0
    assert out == result
