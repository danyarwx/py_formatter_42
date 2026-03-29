# 42 Python Format

42 Python Format formats Python files with `autopep8` and helps keep them flake8-friendly inside VS Code.

## Features

- Format Python files with the standard VS Code formatter flow.
- Works with `Format Document` and format on save.
- Uses `autopep8` to fix formatting-related flake8 and pycodestyle issues.
- Lets you configure the formatter executable and arguments.

## Requirements

Install `autopep8` in your Python environment:

```bash
pip install autopep8
```

## Quick Start

Set this extension as the default formatter for Python:

```json
{
  "[python]": {
    "editor.defaultFormatter": "danyarwx.42-python-format"
  },
  "editor.formatOnSave": true
}
```

Then format the current file with:

- macOS: `Shift+Option+F`
- Windows/Linux: `Shift+Alt+F`

You can also use the `Format Document` command from the Command Palette.

## Settings

### `42-python-format.executable`

Path or command name for the formatter executable. Default: `autopep8`.

### `42-python-format.args`

Arguments passed to the formatter. Default: `["-"]`.

## Notes About Flake8 Compliance

`autopep8` fixes many issues that flake8 reports when they are formatting-related, especially pycodestyle errors. It will not replace flake8 itself, and it will not automatically satisfy every non-formatting plugin rule.

For best results, keep your flake8 configuration in `setup.cfg`, `tox.ini`, `.flake8`, or `pyproject.toml` and run the formatter from the project workspace.
