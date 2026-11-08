# Views

`views/` contains static files shown in the shape's second modal, and optionally in an edge popup (`api.edge({ view: 'index.html' })`).

## Routing

- Base URL: `/dsh-shape/view/<shape-id>/`.
- A trailing slash or empty file maps to `index.html`.
- If `index.html` is absent, the host serves the first top-level `.html`/`.htm` file.
- Other files must be listed in the shape's `views/` inventory; `..`, absolute paths, backslashes, and NUL bytes are rejected.
- Only valid, enabled shapes serve views; otherwise the route returns 404.
- Content types cover HTML, CSS, JavaScript, JSON, SVG, PNG/JPEG/WebP/GIF, and common font/text files.
- `api.edge()` renders the same file in its window; the popup adds a title bar with a close button and sizes the frame to the window.

## Sandbox

The view is an iframe with `sandbox="allow-scripts allow-forms allow-modals allow-popups"`. It has an opaque origin and cannot access the parent DOM, parent storage, or DSH session APIs. It can load its own view assets and make network requests subject to the opaque-origin restrictions.

Because the frame is a separate document, key events inside it never reach the host page: an `Esc` pressed while the view has focus does not close an edge popup.

## Limits

Views are static; there is no server-side template rendering or direct bridge to the shape client module. Do not put behavior in a view expecting access to `api.require` or shortcuts. Use the client module for page-level behavior and the view for display.
