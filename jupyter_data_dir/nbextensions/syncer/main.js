define(['nbextensions/utils/main'], function(utils){
  var syncerFinished = function(data){
    var retval = data.content.text.trim();
    if (retval == 'changed'){
      alert("New environments detected.\nThe notebook will be reloaded now to catch them.")
      window.location.reload();
    } else {
      console.log('no new envs');
    }
  };
  var loadSyncer = function(data){
    var IPythonDirectory = data.content.text.trim();
    var script = IPythonDirectory + "/nbextensions/syncer/sync.py";
    IPython.notebook.kernel.execute(
      '%run ' + script,
      {iopub: {output: syncerFinished}
      });
  };
  var sync = function() {
    var getIPythonDirectory = 'print(get_ipython().ipython_dir)';
    IPython.notebook.kernel.execute(
      getIPythonDirectory,
      {iopub: {output: loadSyncer}},
      {silent: false}
    );
  };

  sync.load_ipython_extension = sync;

  return sync;
});

