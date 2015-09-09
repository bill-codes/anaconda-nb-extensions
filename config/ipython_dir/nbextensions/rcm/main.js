/**
 * ----------------------------------------------------------------------------
 * Copyright (c) 2014 - Continuum Analytics
 *
 * An extension to revision crontrol notebooks.
 * ----------------------------------------------------------------------------
 */

define (['base/js/events',
         'base/js/dialog',
         'nbextensions/utils/main',
         'codemirror/mode/diff/diff'], function(events, dialog, utils) {

  var execute = utils.execute;
  var status = "merge";

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

  var generateOkButton = function(cb) {
    return generateButton("OK", cb, {"class": "btn-primary"});
  };

  var cancelButton = {"Cancel": {class: "btn"}};

  /**
   * Init/reinit the repo every time you the notebook loads.
   */
  function initGit() {

    function callback(msg) {
      console.log("init", msg);
    }

    function error(msg){
      console.log("init error", msg);
    }

    var command = "init = !git init";
    var init = "init[0]";
    execute(command, null, null);
    execute(init, callback, error);

  }

  /**
   * Get current sha
   * @params (function) fn callback to pass the sha obtained to other functions
   * @params (string) commit_msg the commig message you want to pass to other functions
   */
  function getSha(fn, commit_msg) {

    function callback(msg) {
      // TODO, make it more specific to capture only the initial commit fact
      if (msg.substring(0,5) === "fatal") {
          msg = "initial_commit";
      }
      //seven digits is enough for now...
      smsg = msg.substring(0,7);
      fn(smsg, commit_msg);
      console.log("sha", smsg);
    }

    function error(msg){
      console.log("sha error", msg);
    }

    var command = "sha = !git rev-parse HEAD";
    var sha = "sha[0]";
    execute(command, null, null);
    execute(sha, callback, error);

  }

  /**
   * Stash your current work and make a new branch over the sha reference point
   * @params (function) sha the sha reference point
   * @params (string) commit_msg the commig message you want to pass to other functions
   */
  function makeBranch(sha, commit_msg) {

    function callback_diff(msg) {
      console.log("diff", msg);
//      if (msg === '' && status === "merge") {
//          window.alert("You have nothing to commit yet.");
//      }
    }

    function callback_stash(msg) {
      // TODO, make it more specific to capture only the initial commit fact
      if (msg.substring(0,5) === "fatal") {
          msg = "initial_commit";
      }
      console.log("stash", msg);
    }

    function callback_checkout(msg) {
      // TODO, make it more specific to capture only the initial commit fact
//      if (msg.substring(0,5) === "fatal") {
//          msg = "initial_commit";
//      }
      stasher(sha, commit_msg);
      console.log("branch", msg);
    }

    function error(msg){
      console.log("stash/branch error", msg);
    }

    execute("diff = !git diff --exit-code", null, null);
    execute("diff", callback_diff, error);
    execute("stash = !git stash", null, null);
    execute("stash[0]", callback_stash, error);
    execute("checkout = !git checkout " + sha + " -b ck_" + sha, null, null);
    execute("checkout[0]", callback_checkout, error);

  }

  /**
   * Unstash or drop the current stashed reference, if you unstash then make a commit
   * @params (function) sha the sha reference point
   * @params (string) commit_msg the commig message you want to pass to other functions
   */
  function stasher (sha, commit_msg) {

    function callback_drop(msg) {
      console.log("drop", msg);
    }

    function callback_unstash(msg) {
      console.log("unstash", msg);
      makeCommit(sha, commit_msg);
    }

    function error(msg){
      console.log("stash error", msg);
    }

    if (status === "branch") {
        execute("dropstash = !git stash drop", null, null);
        execute("dropstash", callback_drop, error);
    } else if (status === "merge"){
        execute("unstash = !git stash pop", null, null);
        execute("unstash", callback_unstash, error);
    }

}

  /**
   * Delete the sha-refrenced branch
   * @params (function) sha the sha reference point
   */
  function deleteBranch(sha) {

    function callback_delete(msg) {
      if (msg.substring(0,31) === "error: rama «ck_initial_commit»") {
          msg = "initial_commit";
      }
      console.log("delete", msg);
    }

    function error(msg){
      // means that the lock file does not exist
      //fn(msg);
      console.log("error", msg);
    }

    execute("delete = !git branch -D ck_" + sha, null, null);
    execute("delete[0]", callback_delete, error);

}

  /**
   * Stage the notebook and commit the changes. Then, checkout master and
   * merge the branch we left behind, with preference for the changes introduced
   * by the branch (avoiding merge conflict, last changes win strategy).
   * @params (function) sha the sha reference point
   * @params (string) commit_msg the commig message you want to pass to other functions
   */
  function makeCommit(sha, commit_msg) {

    function callback_add(msg) {
      console.log("add", msg);
    }

    function callback_commit(msg) {
      console.log("commit", msg);
    }

    function callback_master(msg) {
      console.log("ck master", msg);
    }

    function callback_merge(msg) {
      if (msg.substring(0,24) === "merge: ck_initial_commit") {
          msg = "initial_commit";
      }
      console.log("merge", msg);
      status = "merge"
    }

    function error(msg){
      console.log("error", msg);
    }

    execute("add = !git add '" + IPython.notebook.notebook_name + "'", null, null);
    execute("add", callback_add, error);
    execute("commit = !git commit -m '" + commit_msg + "'", null, null);
    execute("commit", callback_commit, error);
    execute("master = !git checkout master", null, null);
    execute("master", callback_master, error);
    execute("merge = !git merge ck_" + sha + " -X theirs", null, null);
    execute("merge[0]", callback_merge, error);

    deleteBranch(sha);

  }

  /**
   * Get the log output in a pretty and tree-view format.
   * @params (function): callback to pass the msg file content
   */
  function getLog(fn) {

    function callback(msg) {
      fn(msg);
      // console.log("log", msg);
    }

    function error(msg){
      console.log("log error", msg);
    }

    var command = "log = !git log master --graph --pretty=format:'%h - %an, %ar : %s'"
    // var command = "log = !git log"
    var log = "'<br>'.join(log)";
    execute(command, null, null);
    execute(log, callback, error);

  }

  /**
   * Execute flatten.py so python diff function is availble for getStatus.
   * @params (string) sha1 the first hash number for a revision point
   * @params (string) sha2 the second hash number for another revision point
   */
  function getStatus(sha1, sha2) {

    //Save to prevent seeing no changes when there is actually changes
    //because the ipynb was not saved yet.
    IPython.notebook.save_notebook();

    function callback_script(msg) {
      var retval = msg.content.text.trim();
      console.log(retval);
      getDiff(shower, sha1, sha2);
    }

    function callback_dir(msg) {
      var script = msg + "/nbextensions/rcm/flatten.py"
      console.log("dir", script);
      IPython.notebook.kernel.execute("%run " + script , {iopub: {output: callback_script}});
    }

    function error(msg){
      console.log("log error", msg);
    }

    var rcm_dir = "from jupyter_core import paths; paths.jupyter_data_dir()"
    execute(rcm_dir, callback_dir, error);

  }

  /**
   * Get the git diff to see the latest changes.
   * @params (function): callback to pass the msg file content
   * @params (string) sha1 the first hash number for a revision point
   * @params (string) sha2 the second hash number for another revision point
   */
  function getDiff(fn, sha1, sha2) {

    function callback(msg) {
      fn(msg);
    }

    function error(msg){
      console.log("log error", msg);
    }

    var points;
    if (sha1 === null && sha2 === null) {
        points = "";
    } else {
        points = sha2 + ".." + sha1
    }
    var rawdiff = "_rawdiff = !git diff " + points + " --no-prefix -U1000";
    var fladiff = "d = diff(_rawdiff)";
    var current = "show = !git rev-parse HEAD";
    var diff = "show.n[:7] + d";
//    var diff = "d";
    execute(rawdiff, null, null);
    execute(fladiff, null, null);
    execute(current, null, null);
    execute(diff, callback, error);
  }

  /**
   * Show the diff when two revision points are selected
   * @params (string) status the git diff content to be shown
   */
  function shower(status) {
    var _current = status.substring(0,7); // current sha
    var _diff = status.substring(7,status.length); // diff text

    var message = "You are now at the <b>" + _current + "</b> revision point.<br/>" +
                  "Your latest changes are on green (or red), " +
                  "everything else is just to give you some context.";

    // TODO: Investigate why replace method is not working here...
    if (_diff.length === 0) {
      var cstatus = "You don't have any changes yet...";
    } else {
      var cstatus = _diff.split("\\'").join("\'").split('\\n').join('\n');
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
      buttons: generateOkButton()
      //notebook: IPython.notebook,
      //keyboard_manager: IPython.keyboard_manager,
    });

    modal.on('shown.bs.modal', function(){ editor.refresh(); });
  };


  /**
   * Make a checkpoint view of the sha reference points taken from git log.
   * Then, switch to the selected reference point and reload the notebook
   * @params (string): git log content
   */
  function writer(log) {
    var empty = false;
    var slog = log.split('<br>')
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
        //var ssha = slog[i].substring(0,7);
        var step;
        if (ssha !== "") {
          //slog[i] = slog[i].replace(" ", "&nbsp&nbsp");
          step = '<input type=\"checkbox\" value=' + ssha + ' class=\"chk\">&nbsp' + slog[i] + '<br>';
        } else {
          slog[i] = slog[i].split("\\\\").join("\\");
          step = '<span style="padding-left:21px">' + slog[i] + '<br>';
        }
        console.log("sub", step);
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
        console.log(logsha);
      } else if (chkArray.length === 2){
        sha1 = chkArray[0];
        sha2 = chkArray[1];
      }
    }

    function keepOldsha(sha) {
      oldsha = sha.substring(0,7);
      console.log(oldsha);
    }

    getSha(keepOldsha, null);

    // TODO Extract code into help functions to better document
    var doCheckout = function() {
      if (empty === false) {
        getchkValue();
        if (logsha !== undefined) {
          IPython.notebook.save_notebook();
          // WE is slow to save, so we need to delay the nexts step after saving
          // so the diff actually get something
          events.on("notebook_saved.Notebook", function () {
            status = "branch";
            makeBranch(logsha, null);
            // we need to delete the current checkpoint to avoid loading of the checkpoint
            // instead of the commited version of the ipynb file
            IPython.notebook.delete_checkpoint("checkpoint")
            events.on("checkpoint_deleted.Notebook", function () {
              deleteBranch(oldsha);
              window.location.reload(true);
            });
          });
        } else {
            window.alert("You have to select just ONE to checkout or TWO to diff.");
        }
      } else {
        console.log(empty);
      }
    };

    dialog.modal({
      title: "CHECKOUT",
      body: alert,
      buttons: _.extend(
        generateButton("View Diff", function() {
          if (empty === false) {
            getchkValue();
            if (sha2 !== undefined) {
              getStatus(sha1, sha2);
            } else {
              window.alert("You have to select just ONE to checkout or TWO to diff.");
            }
          } else {
            console.log(empty);
          }
        }),
        cancelButton,
        generateOkButton(doCheckout)
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
        cancelButton,
        generateOkButton(function() {
          var str = $.trim($(textarea).val());
          var commit_msg = str.split("\n").join(" ");
          IPython.notebook.save_notebook();
          if (status === "branch") {
            getSha(makeCommit, commit_msg);
          } else if (status === "merge") {
            getSha(makeBranch, commit_msg);
          }
        })
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

  // Git init at load
  initGit();

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
          getLog(writer);
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
