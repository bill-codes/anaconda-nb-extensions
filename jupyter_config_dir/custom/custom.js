// we want strict javascript that fails on ambiguous syntax
"using strict";

// activate extensions only after Notebook is initialized
define(["base/js/utils", "base/js/events"], function (utils, events) {
    events.on("app_initialized.NotebookApp", function () {
      utils.load_extensions('defaulter/main');
    });
    events.one("kernel_ready.Kernel", function () {
      utils.load_extensions('syncer/main');
    });
});
