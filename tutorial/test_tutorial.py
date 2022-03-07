import pytest
import os
import glob
import requests
import subprocess
from pathlib import Path

cwd = os.getcwd()
repo = "https://soya.data-container.net"

def test_repo():
    response = requests.get(repo + "/api/active")
    assert response.status_code == 200

# Tutorial tests
@pytest.mark.parametrize('input', ["person_simple", "employee", "foaf_person"])
def test_tutorial01(fp, input):
    fp.allow_unregistered(True)
    cmd = "curl -s https://playground.data-container.net/" + input + " | jq -r .yml | soya init"
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    assert process.returncode == 0
    assert process.stdout.strip() == Path(cwd+"/examples/"+input+".jsonld").read_text().strip()
