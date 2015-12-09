define(
  function(){
    var module = {};
    var output_strip = function(input_string){
      if (input_string === ''){
        return '';
      } else if (input_string[0] == 'u'){
        return input_string.substring(2, input_string.length - 1);
      } else {
        return input_string.substring(1, input_string.length - 1);
      }
    };

    module.execute = function(command, success, error){
      /**
         Utility function for executing an ipynb command, and
         receiving a string as an output of that function.
         handles output stripping of the result to remove quotes
      **/
      var val;
      var default_success_handler = function(msg){
        console.log('SUCCESS', msg);
      };

      var default_error_handler = function(msg){
        console.log('ERROR', msg);
      };

      if (success === undefined){
        success = default_success_handler;
      }
      if (error === undefined){
        error = default_error_handler;
      }
      var callback = function(msg){
        if (msg.msg_type === 'error'){
          error(msg);
        }else{
          val = output_strip(msg.content.data['text/plain']);
          success(val);
        }
      };

      IPython.notebook.kernel.execute(command,
                                      {iopub: {output: callback}},
                                      {silent: false});
    };

    module.getpath = function(fn) {
      /**
       * Get the pwd which is also the starting notebook path
       * @params (function): callback to pass the pwd from the pather to the storer
       */
      var pwd = sessionStorage.getItem("pwd");
      if (pwd !== null){
        fn(pwd);
      }else{
        var pwd_callback = function(pwd) {
          sessionStorage.setItem("pwd", pwd);
          fn(pwd);
          console.log("path: ", pwd);
        };
        pwd_callback(pwd);
      }
    };
    module.getuser = function(fn){
      var user = sessionStorage.getItem('user');
      if (user !== null){
        fn(user);
      }else{
        var callback = function(msg) {
          user = msg;
          sessionStorage.setItem('user', user);
          fn(user);
        };

        var command = "import getpass;" +
          "getpass.getuser()";
        module.execute(command, callback);
      }
    };

    return module;
  }
);

