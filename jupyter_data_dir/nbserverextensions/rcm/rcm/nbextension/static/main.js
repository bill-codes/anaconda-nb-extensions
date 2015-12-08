/**
 * ----------------------------------------------------------------------------
 * Copyright (c) 2014 - Continuum Analytics
 *
 * An extension to revision crontrol notebooks.
 * ----------------------------------------------------------------------------
 */

define ([
  'base/js/namespace',
  'base/js/events',
  'base/js/dialog',
  'base/js/utils',
  'codemirror/mode/diff/diff'], function(IPython, events, dialog, utils) {

  var execute = utils.execute;

  /**
   * Some utilities functions to generate the buttons
   */
  var generateButton = function(name, cb, options) {
    options = options || {};
    var r = {};
    r[name] = {
      "class": options.class || "btn"
    }
    if (cb) {
      r[name]["click"] = cb;
    }
    return r
  };

  var generateOkButton = function(cb, label) {
    return generateButton(label || "OK", cb, {"class": "btn-primary"});
  };

  var cancelButton = {"Cancel": {class: "btn"}};

  function rcm_ajax(type, url, data, fn) {
    data.path = IPython.notebook.notebook_path;

    return $.ajax(url, {
        type: type,
        data: data,
        cache: false,
        success: fn,
        error: utils.log_ajax_error
    });
  }

  /**
   * Get current sha
   * @params (function) callback callback to pass the sha obtained to other functions
   */
  function get_revision(callback) {
    rcm_ajax('GET', '/rcm/revision', {}, callback);
  }


  /**
   * Get the log output in a pretty and tree-view format.
   * @params (function): callback to pass the msg file content
   */
  function get_log(callback) {
    rcm_ajax('GET', '/rcm/log', {}, callback);
  }

  /**
   * @params (string) sha1 the first hash number for a revision point
   * @params (string) sha2 the second hash number for another revision point
   */
  function get_diff(sha1, sha2, callback) {
    // Save to prevent seeing no changes when there are actually changes
    // because the ipynb was not saved yet.

    IPython.notebook.save_notebook().then(function() {
      rcm_ajax('GET', '/rcm/diff', { sha1: sha1, sha2: sha2 }, callback);
    });
  }


  function commit(commit_msg, callback) {
    rcm_ajax('POST', '/rcm/commit', {
      message: commit_msg
    }, callback);
  }


  function checkout(rev, callback) {
    rcm_ajax('POST', '/rcm/checkout', { rev: rev }, callback);
  }


  function getStatus(sha1, sha2) {
    // Pull revision and diff and display them

    get_diff(sha1, sha2, function(diff) {
      get_revision(function(revision) {
        show_diff(revision, diff);
      });
    });
  }

  /**
   * Show the diff when two revision points are selected
   * @params (string) revision the git revision to be shown
   * @params (string) diff the git diff content to be shown
   */
  function show_diff(revision, diff) {
    var message = "You are now at the <b>" + revision + "</b> revision point.<br/>" +
                  "Your latest changes are on green (or red), " +
                  "everything else is just to give you some context.";

    // TODO: Investigate why replace method is not working here...
    if (diff.length === 0) {
      var cstatus = "You don't have any changes yet...";
    } else {
      var cstatus = diff.split("\\'").join("\'").split('\\n').join('\n');
    }

    var textarea = $('<textarea/>')
      .attr('rows', '13')
      .attr('cols', '80')
      .attr('name', 'shower')
      .text(cstatus);

    // TODO What options do we have for templating?  _.template maybe?
    var dialogform = $('<div/>').attr('title', 'Your latest changes')
      .append(
        $('<form/>').append(
          $('<fieldset/>').append(
            $('<label/>')
              .attr('for','shower')
              .html(message)
          )
          //.append(error_div)
          .append($('<br/>'))
          .append(textarea)
        )
      );

    var editor = CodeMirror.fromTextArea(textarea[0], {
      lineNumbers: true,
      readOnly: true,
      mode: 'text/x-diff',
    });

    var modal = dialog.modal({
      title: "Current Changes",
      body: dialogform,
      buttons: generateOkButton(),
      open: function() {
        editor.refresh();
      }
    });
  };


  /**
   * Make a checkpoint view of the sha reference points taken from git log.
   * Then, switch to the selected reference point and reload the notebook
   * @params (string): git log content
   */
  function show_log(log) {
    var empty = false;
    var slog = log.split('\n')
    var long = '';
    var oldsha;
    var logsha;
    var sha1, sha2;

    if (log.substring(0,5) === "fatal") {
      // TODO, make it more specific to capture only the initial commit fact
      long = "No commits yet. Make your initial commit soon.";
      empty = true;
    } else {
      for (i = 0; i < slog.length; i++) {
        var n = slog[i].indexOf("-")
        var ssha = slog[i].substring(n-8, n);
        var step;
        if (ssha !== "") {
          step = '<input type=\"checkbox\" value=' + ssha + ' class=\"chk\">&nbsp' + slog[i] + '<br>';
        } else {
          slog[i] = slog[i].split("\\\\").join("\\");
          step = '<span style="padding-left:21px">' + slog[i] + '<br>';
        }
        long = long + step;
      }
    }

    var dialogform = $('<div/>').html('<b>' + long + '</b>').addClass('commit_message');

    var alert = $('<div/>');
    var doc = $('<div/>').addClass('alert alert-warning');
    doc.append(
        $('<button/>').addClass('close').attr('data-dismiss','alert').html('&times;')
    ).append('Checking out any revision point will <b>destroy</b> your current work.<br/>' +
             'If you want to save it, you must <b>commit</b> your work first and then ' +
             'you can checkout safely.');
    alert.append(doc).append(dialogform)

    function getchkValue(){
      var chkArray = [];
      // look for all checkboes that have a class 'chk' attached
      // to it and check if it was checked
      $(".chk:checked").each(function() {
        chkArray.push($(this).val());
      });

      if(chkArray.length === 1){
        logsha = chkArray[0];
      } else if (chkArray.length === 2){
        sha1 = chkArray[0];
        sha2 = chkArray[1];
      }
    }

    function keepOldsha(sha) {
      oldsha = sha;
    }

    get_revision(keepOldsha);

    // TODO Extract code into help functions to better document
    var doCheckout = function() {
      if (empty === false) {
        getchkValue();
        if (logsha !== undefined) {
          IPython.notebook.save_notebook().then(function() {
            checkout(logsha, function() {

              // we need to delete the current checkpoint to avoid loading of the checkpoint
              // instead of the commited version of the ipynb file
              IPython.notebook.delete_checkpoint("checkpoint")
              events.on("checkpoint_deleted.Notebook", function () {
                window.location.reload(true);
              });
            });
          });
        } else {
            window.alert("You have to select just ONE to checkout or TWO to diff.");
        }
      }
    };

    dialog.modal({
      title: "CHECKOUT",
      body: alert,
      buttons: _.extend(
        {},
        generateButton("View Diff", function() {
          if (empty === false) {
            getchkValue();
            if (sha2 !== undefined) {
              getStatus(sha1, sha2);
            } else {
              window.alert("You have to select just ONE to checkout or TWO to diff.");
            }
          }
        }),
        cancelButton,
        generateOkButton(doCheckout, 'Checkout')
      )
    });
  };

  /**
   * Make an entry point for the user to write his/her commit message.
   * Then, switch to the selected reference point and reload the notebook
   */
  function messager() {
    var oldsha;

    var textarea = $('<textarea/>')
     .attr('rows','15')
     .attr('cols','80')
     .attr('name','commit_message')
     .addClass('commit_message');

    var dialogform = $('<div/>')
      .text("You can write you commit message below.")
      .append($('<br/>'))
      .append($('<br/>'))
      .append(textarea);

    dialog.modal({
      title: "COMMIT",
      body: dialogform,
      buttons: _.extend(
        {},
        cancelButton,
        generateOkButton(function() {
          var commit_msg = $.trim($(textarea).val());
          IPython.notebook.save_notebook().then(function() {
            commit(commit_msg);
          });
        }, 'Commit')
      ),
      keyboard_manager: IPython.keyboard_manager
    });
  }

  /**
   * Inject the needed css.
   */
  function writerCSS() {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = require.toUrl("./nbextensions/rcm/main.css");
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  //css
  writerCSS();

  // UI
  var load_ipython_extension = function() {
    IPython.toolbar.add_buttons_group([
      {
        'label'   : 'status',
        'icon'    : 'fa fa-info',
        'callback': function() {
          getStatus(null, null);
        },
        'id'      : 'gitst'
      },
      {
        'label'   : 'checkout',
        'icon'    : 'fa fa-code-fork',
        'callback': function() {
          get_log(show_log);
        },
        'id'      : 'gitck'
      },
      {
        'label'   : 'commit',
        'icon'    : 'fa fa-certificate',
        'callback': function() {
          messager();
        },
        'id'      : 'gitcm'
      },
    ]);
  };

  var extension = { load_ipython_extension : load_ipython_extension };
  return extension;
});
