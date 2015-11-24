/**
 ----------------------------------------------------------------------------
 * Copyright (c) 2014-2015 - Continuum Analytics
 *
 * A permissive locking extension for Jupyter notebooks
 ----------------------------------------------------------------------------
 */

define (['jquery'], function($){
  module = {};
  module.ui_state = 'open';
  /*
   * 'open' - no one has the lock, clicking on lock means I have the lock
   * 'locked' - I have the lock, clicking on the lock means I release it
   * 'another' - someone else has the lock, clicking on the lock means I steal it
  */

  /*************
   * Functions *
   *************/

  var old_save = IPython.notebook.save_notebook.bind(IPython.notebook);

  /**
   * Write a hidden lock file in the same path where the notebook lives.
   *
   * @params (function) fn The callback to call once the lock file is written..
   */
  function lockWriter(user, fn) {
    var url = window.location.origin + '/lock';

    $.ajax(url, {
      cache: false,
      dataType: 'text',
      data: {
        user: user,
        path: IPython.notebook.notebook_path
      },
      type: 'POST',
      success: function(data, status, xhr) {
        fn(data);
      },
      error: function(xhr, status, msg) {
        console.log('ERROR', msg);
      }
    });
  }

  /**
   * Read the hidden lock file in the same path where the notebook lives.
   *
   * @params (function) fn The callback to pass the lock file content.
   */
  function lockReader(fn) {
    var url = window.location.origin + '/lock';

    $.ajax(url, {
      cache: false,
      dataType: 'text',
      type: 'GET',
      data: {
        path: IPython.notebook.notebook_path
      },
      success: function(data, status, xhr) {
        // if the lock file content can not be read it, then allow the lock procedure
        fn(data);
        console.log("lock content", data);
      },
      error: function(xhr, status, msg) {
        // means that the lock file does not exist
        fn("");
        console.log("lock content", "");
      }
    });
  }

  function getuser(fn) {
    var user = sessionStorage.getItem('user');
    if (user !== null) {
      fn(user);
    }
    else {
      function callback(msg) {
        sessionStorage.setItem('user', msg);
        fn(msg);
      }

      var url = window.location.origin + '/whoami';

      $.ajax(url, {
        cache: false,
        dataType: 'text',
        success: function(data, status, xhr) {
          callback(data);
        },
        error: function(xhr, status, msg) {
          // means that the lock file does not exist
          console.log('ERROR', msg);
        }
      });
    }
  }

  // 3 helper "status" functions to alert the user about the current state
  var _acquire = function(){
    $('#locking').css('background','#5bc0de');
    module.wnnw.info("LOCKED by YOU", 3000);
    $('#locking').children().removeClass('fa fa-unlock-alt').addClass('fa fa-lock');
    module.ui_state = 'locked';
    window.onbeforeunload = function () {
      lockReader(releaseLock);
      return null;
    };
  };

  var _locked_by_another = function(locking_user){
    $('#locking').css('background','#f0ad4e');
    module.wnnw.warning("LOCKED by " + locking_user +  ", save is DISABLED. " +
                        "Press the LOCK button AGAIN to take it", 5000);
    $('#locking').children().removeClass('fa fa-unlock-alt').addClass('fa fa-lock');
    module.ui_state = 'another';
  };

  var _release = function(){
    $('#locking').css('background','#ffffff');
    module.wnnw.info("UNLOCKED", 3000);
    $('#locking').children().removeClass('fa fa-lock').addClass('fa fa-unlock-alt');
    module.ui_state = 'open';
  };

  /**
   * Write a lock file if nobody has the lock yet.
   *
   * @params (string) locking_user The user taking the lock.
   */
  function acquireLock(locking_user){
    var user = sessionStorage.getItem('user');
    if (locking_user === ''){
      lockWriter(user, _acquire);
    }else if (locking_user === user){
    _acquire();
      //do nothing, you already have the lock
    }else{
      _locked_by_another(locking_user);
    }
  }

  /**
   * Write empty content into the lock file to release the locked status.
   *
   * @params (string) locking_user The user currently holding the lock.
   */
  function releaseLock(locking_user){
    var user = sessionStorage.getItem('user');
    if (locking_user === ''){
      _release();
    }else if (locking_user === user){
      lockWriter('', _release);
    }else{
      _locked_by_another(locking_user);
    }
  }

  /**
   * Write a lock file despite the fact of another user holding the lock.
   *
   * @params (string) locking_user The user stealing the lock.
   */
  function stealLock(locking_user){
    var user = sessionStorage.getItem('user');
    lockWriter(user, _acquire);
  }

  /**
   * Switch between locked and unlocked state depending on the lock file content
   * @params (string) lock The lock file content.
   */
  function lockSwitcher(lock) {
    if (module.ui_state === 'another'){
      stealLock(lock);
    }else if (module.ui_state === 'locked'){
      releaseLock(lock);
    }else{ //module.ui_state == 'open'
      acquireLock(lock);
    }
  }

  /**
   * Disable saving if a save event is triggered and a lock file is detected
   * @params (string) locking_user The lock content.
   */
  function lockSave(locking_user) {
    var user = sessionStorage.getItem('user');
    if (locking_user === "" || locking_user === user) {
      // deleted our save function
      delete(IPython.notebook.save_notebook);
      // actually trigger the real save
      old_save();
      // enable our save function for the next time
      lockTriggerSave();
      // disable the blue background only if the state is "open" or "another"
      var $locking = $('#locking');
      if (module.ui_state == 'open' || module.ui_state == 'another') {
        // change button color to "white" permissive status
        $locking.css('background','#ffffff');
        $locking.children().removeClass('fa fa-lock').addClass('fa fa-unlock-alt');
      } else if (module.ui_state == 'locked' && locking_user === "") {
        $locking.css('background','#ffffff');
        $locking.children().removeClass('fa fa-lock').addClass('fa fa-unlock-alt');
      }
      console.log("Enabled patched .save_notebook method.");
    } else {
      // change button color to "orange" locked by other status
      _locked_by_another(locking_user);
      console.log("Disabled patched .save_notebook method.");
    }
  }

  /**
   * Our modified notebook save function.
   * It detects the lock file and let save when you are locking or
   * nobody has the lock.
   */
  function lockTriggerSave() {
    Object.getPrototypeOf(IPython.notebook).save_notebook = (function() {

      return function() {
        lockReader(lockSave);
      };
    }());
  }

  /********
   * Main *
   ********/
  // ping the kernel and save the notebook path and user, finally trigger
  // the lock mechanism.
  var load_ipython_extension = function() {
    getuser(function(){
      lockReader(acquireLock);
      lockTriggerSave();
      module.wnnw = IPython.notification_area.new_notification_widget('wakari')
      // UI
      IPython.toolbar.add_buttons_group([
        {
          'label'   : 'Lock/Check/Unlock',
          'icon'    : 'fa fa-lock',
          'callback': function(){ lockReader(lockSwitcher); },
          'id'      : 'locking'
        },
      ]);
    });
  };

  var extension = { load_ipython_extension : load_ipython_extension };
  return extension;
});
