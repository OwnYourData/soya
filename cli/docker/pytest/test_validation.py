import pytest
import os
import glob
import subprocess
import re
from pathlib import Path

# doc: https://pypi.org/project/pytest-subprocess/
cwd = os.getcwd()
@pytest.mark.parametrize('input', sorted(glob.glob(cwd + '/04_input/*.json')))
def test_01_simple(fp, input):
    fp.allow_unregistered(True)
    soya_structure = re.sub(r"^\d{2}-", "", Path(input).stem)
    with open(input) as f:
        content = f.read()
    output_file = input.replace("/04_input/", "/04_output/")
    output_file = str(Path(output_file).with_suffix(".json"))
    with open(output_file) as f:
        result = f.read()
    if len(content) > 0:
        # correctly escape spaces in filenames
        _input = re.sub(r"\s", "\\ ", input)
        cmd = ( "cat " + _input + 
                " | soya acquire " + soya_structure + 
                " | soya validate " + soya_structure )
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    assert process.returncode == 0

    if len(result) > 0:
        assert process.stdout.strip() == result.strip()