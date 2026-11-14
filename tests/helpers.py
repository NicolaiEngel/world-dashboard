import json
import os

FIX = os.path.join(os.path.dirname(__file__), "fixtures")


def text(name):
    with open(os.path.join(FIX, name), encoding="utf-8") as f:
        return f.read()


def js(name):
    return json.loads(text(name))
