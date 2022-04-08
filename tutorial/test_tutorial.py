import pytest
import os
import re
import glob
import requests
import subprocess
from pathlib import Path

cwd = os.getcwd()
repo = "https://soya.data-container.net"
playgrond = "https://playground.data-container.net"

# ensure SOyA Repo and Playground are available
def test_repos():
    response = requests.get(repo + "/api/active")
    assert response.status_code == 200
    response = requests.get(playgrond + "/api/active")
    assert response.status_code == 200

# Tutorial tests with some input and jsonld output
@pytest.mark.parametrize('input', ["person_simple", "employee", "foaf_person", "rest_api"])
def test_tutorial01(fp, input):
    fp.allow_unregistered(True)
    cmd = "curl -s https://playground.data-container.net/" + input + " | jq -r .yml | soya init"
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    assert process.returncode == 0
    assert process.stdout.strip() == Path(cwd+"/examples/"+input+".jsonld").read_text().strip()

# Tutorial tests for overlays
@pytest.mark.parametrize('input',  glob.glob(cwd+'/examples/overlay_*.jsonld'))
def test_tutorial02(fp, input):
    fp.allow_unregistered(True)
    m = re.search('overlay_(.+?).jsonld', input)
    op = m.group(1)
    cmd = "soya template " + op + " | soya init"
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    assert process.returncode == 0
    assert process.stdout.strip() == Path(input).read_text().strip()
