define(function(require) {
    var $ = require('jquery');
    var IPython = require('base/js/namespace');
    var envlist = require('./envlist');
    var pkglist = require('./pkglist');

    var env_html = $([
        '<div id="envs" class="tab-pane">',
        '  <div id="env_toolbar" class="list_toolbar row">',
        '    <div class="col-xs-7 no-padding">',
        '      <span id="env_list_info" class="toolbar_info">Conda environments</span>',
        '    </div>',
        '    <div class="col-xs-2 no-padding tree-buttons">',
        '      <span id="env_buttons" class="toolbar_buttons pull-right">',
        '      <button id="refresh_env_list" title="Refresh environment list" class="btn btn-default btn-xs"><i class="fa fa-refresh"></i></button>',
        '      </span>',
        '    </div>',
        '  </div>',
        '  <div id="env_list" class="list_container">',
        '    <div id="env_list_header" class="row list_header">',
        '      <div class="name_col    col-xs-2">Name</div>',
        '      <div class="default_col col-xs-1 text-center">Default?</div>',
        '      <div class="dir_col     col-xs-4">Directory</div>',
        '      <div class="action_col  col-xs-2">Action</div>',
        '    </div>',
        '  </div>',
        '  <div id="pkg_toolbar" class="list_toolbar row">',
        '    <div class="col-xs-6 no-padding">',
        '      <span id="pkg_list_info" class="toolbar_info">Installed Conda packages</span>',
        '    </div>',
        '    <div class="col-xs-6 no-padding tree-buttons">',
        '      <span id="pkg_buttons" class="toolbar_buttons pull-right">',
        '      <button id="refresh_pkg_list" title="Refresh package list"     class="btn btn-default btn-xs"><i class="fa fa-refresh"       ></i></button>',
        '      <button id="check_update"     title="Check for Updates"        class="btn btn-default btn-xs"><i class="fa fa-check"         ></i></button>',
        '      <button id="update_pkgs"      title="Update selected packages" class="btn btn-default btn-xs"><i class="fa fa-cloud-download"></i></button>',
        '      <button id="remove_pkgs"      title="Remove selected packages" class="btn btn-default btn-xs"><i class="fa fa-trash-o"       ></i></button>',
        '      </span>',
        '    </div>',
        '  </div>',
        '  <div id="pkg_list" class ="list_container">',
        '    <div id="pkg_list_header" class="row list_header">',
        '      <div class="name_col     col-xs-3">Name</div>',
        '      <div class="version_col  col-xs-1">Version</div>',
        '      <div class="build_col    col-xs-1">Build</div>',
        '      <div class="avail_col    col-xs-2">Available</div>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('\n'));

    function load() {
        if (!IPython.notebook_list) return;
        var base_url = IPython.notebook_list.base_url;
        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', base_url + 'nbextensions/conda-envs/envlist.css')
        );

        // Configure Conda tab
        $(".tab-content").append(env_html);
        $("#tabs").append(
            $('<li>')
            .append(
                $('<a>')
                .attr('href', '#envs')
                .attr('data-toggle', 'tab')
                .text('Conda')
                .click(function (e) {
                    window.history.pushState(null, null, '#envs');
                })
            )
        );
        var env_list = new envlist.EnvList('#env_list', {
            base_url: IPython.notebook_list.base_url,
        });
        env_list.load_list();
        var pkg_list = new pkglist.PkgList('#pkg_list', {
            base_url: IPython.notebook_list.base_url,
        });
    }
    return {
        load_ipython_extension: load
    };
});
