define(['nbextensions/utils/main'], function(utils){
  // We only want to protect
  // at the very beginning.
  // If a kernel was every run
  // or if we've already tried protecting
  // don't protect anymore
  var load_ipython_extension = function() {

    var initial_protection = true;

    var protect_broken_kernels = function(){
      $([IPython.events]).on('kernel_dead.Kernel', function(){
        if (!initial_protection){
          return;
        }
        initial_protection = false;
        if (IPython.notebook.session.kernel_name != IPython.notebook.default_kernel_name){
          IPython.notebook.metadata = {};
        }
      });
    }

    protect_broken_kernels();
    $([IPython.events]).on('kernel_ready.Kernel', function(){
      initial_protection = false;
    });
  };

  var extension = { load_ipython_extension : load_ipython_extension };
  return extension;
});
