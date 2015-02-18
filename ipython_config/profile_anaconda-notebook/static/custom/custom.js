/**
 * Wakari custom javascript
 */

// we want strict javascript that fails on ambiguous syntax
"using strict";

// activate extensions only after Notebook is initialized
require(["base/js/events"], function (events) {
    events.on("app_initialized.NotebookApp", function () {
      IPython.load_extensions('defaulter/main');
    });
});

require(["base/js/events"], function (events) {
    events.on("status_started.Kernel", function () {
      IPython.load_extensions('rcm/main');
    });
});
