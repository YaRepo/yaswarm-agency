# Zettlr Automation Boundaries

What can be automated reliably by the assistant:
- File-level operations in workspace folders (create/edit/move markdown files).
- Frontmatter normalization and metadata scaffolding.
- Internal link and citation consistency checks.
- Snippet/template file generation (`*.tpl.md`) for reuse.
- Launching Zettlr with supported CLI switches.

What generally remains manual/UI-bound unless explicit UI automation is configured:
- Drag/drop split-pane arrangement and interactive pane management.
- Clicking preference screens and assigning files through dialogs.
- Interactive acceptance of autocomplete suggestions within editor text.

Known CLI switches from project documentation:
- `--launch-minimized`
- `--clear-cache`
- `--data-dir=<path>`
