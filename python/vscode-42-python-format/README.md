# 42 Python Format

42 Python Format is a VS Code formatter extension for Python projects. It follows the same lightweight idea as the C formatter example in this repository, but it delegates the actual formatting to `autopep8` so your code stays close to flake8/pycodestyle expectations.

## Features

- Formats Python files through the standard VS Code "Format Document" flow.
- Sends the file content to `autopep8` over stdin and applies the formatted result back to the editor.
- Lets you override both the executable and the CLI arguments, just like the C extension does.
- Supports `${file}` and `${workspaceFolder}` placeholders in the argument list.

## Requirements

Install `autopep8` in your Python environment:

```bash
pip install autopep8
```

If you prefer isolated installs, `pipx` also works well:

```bash
pipx install autopep8
```

## Usage

Set this extension as the default formatter for Python:

```json
{
  "[python]": {
    "editor.defaultFormatter": "danyarwx.42-python-format"
  },
  "editor.formatOnSave": true
}
```

Then run "Format Document" or save the file if format-on-save is enabled.

## Configuration

### `42-python-format.executable`

- Type: `string`
- Default: `"autopep8"`
- Description: The executable or full path used to start the formatter.

### `42-python-format.args`

- Type: `string[]`
- Default: `["-"]`
- Description: Arguments passed to the formatter. `${file}` expands to the current file path and `${workspaceFolder}` expands to the current workspace root.

## Example Configurations

Default command:

```json
{
  "42-python-format.executable": "autopep8",
  "42-python-format.args": ["-"]
}
```

Run `autopep8` as a Python module:

```json
{
  "42-python-format.executable": "python3",
  "42-python-format.args": ["-m", "autopep8", "-"]
}
```

Use a custom executable path:

```json
{
  "42-python-format.executable": "/usr/local/bin/autopep8"
}
```

## Notes About Flake8 Compliance

`autopep8` fixes many issues that flake8 reports when they are formatting-related, especially pycodestyle errors. It will not replace flake8 itself, and it will not automatically satisfy every non-formatting plugin rule.

For best results, keep your flake8 configuration in `setup.cfg`, `tox.ini`, `.flake8`, or `pyproject.toml`, and run the formatter from the project workspace so `autopep8` can discover the local config files.

If you tested an earlier version of this extension and saved a custom `42-python-format.args` value with `--stdin-filepath`, remove that override or change it to `["-"]`.

## Development

```bash
npm install
npm run compile
```

## Package For Marketplace

Create a local VSIX package:

```bash
npm run package:vsix
```

That command uses `npx @vscode/vsce package`, so you do not need a global `vsce` install.

Publish to the Marketplace once your publisher is configured:

```bash
npm run publish:vsix
```

Before publishing, make sure that:

- the `publisher` field in `package.json` matches your actual Visual Studio Marketplace publisher
- your Marketplace publisher has a valid Personal Access Token configured for `vsce`
- the repository links point to the final public repository you want users to see
