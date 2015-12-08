define(function(require) {
    var $ = require('jquery');
    var IPython = require('base/js/namespace');
    var models = require('./models');
    var views = require('./views');
    var dialog = require('base/js/dialog');
    var base_url = IPython.notebook.base_url;
    var $view = $('#conda');

    jQuery.fn.center = function () {
        this.css("position","absolute");
        this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) +
                                                    $(window).scrollTop()) + "px");
        this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) +
                                                    $(window).scrollLeft()) + "px");
        return this;
    }

    function show_conda_view($view) {
        var d = dialog.modal({
            title: 'Conda Packages',
            body: $view,
            open: function() {
                $('#searchbox').focus();
            },
            keyboard_manager: IPython.notebook.keyboard_manager
        });
        d.on('hide.bs.modal', function() {
            // detach the conda view so it isn't destroyed with the dialog box
            $view.detach();
        });
        d.find('.modal-dialog').addClass('modal-lg');
    }

    function load_conda_view() {
        if($view.length === 0) {
            // Not loaded yet
            $.ajax(base_url + 'nbextensions/condaenvs/tab.html', {
                dataType: 'html',
                success: function(tab_html, status, xhr) {
                    // Load the 'conda tab', hide the Environments portion
                    $view = $(tab_html);
                    $view.find('#conda').removeClass('tab-pane').hide();
                    $view.find('#environments').hide();
                    $('body').append($view);

                    views.AvailView.init();
                    views.InstalledView.init();

                    models.available.view = views.AvailView;
                    models.installed.view = views.InstalledView;

                    // Load the list of available packages.
                    // This is slow, so do it only the first time this is shown.
                    models.available.load();

                    // Also load environment list. Only need to do this once,
                    // then we'll know the current environment and it will
                    // also trigger a load of the installed packages.
                    models.environments.load().then(function() {
                        // Select the current environment for the running kernel.
                        // This is dependent on behavior of the 'syncer'
                        // extension, which currently creates kernels with
                        // the same name as the conda environment containing them.
                        var current_env = IPython.notebook.kernel.name;
                        if(current_env !== 'auto') {
                            models.environments.select({ name: current_env });
                        }
                    });
                    show_conda_view($view);
                }
            });
        }
        else {
            // Refresh list of installed packages.
            // This is fast, and more likely to change,
            // so do it every time the menu is shown.
            models.installed.load();
            show_conda_view($view);
        }
    }

    function create_placeholder() {
        var $placeholder = $('<div/>').attr('id', 'conda_view').hide();
        $('body').append($placeholder);
    }

    function load() {
        if (!IPython.notebook) return;
        var base_url = IPython.notebook.base_url;
        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', base_url + 'nbextensions/condaenvs/conda.css')
        );

        $.ajax(base_url + 'nbextensions/condaenvs/menu.html', {
            dataType: 'html',
            success: function(menu_html, status, xhr) {
                // Configure Conda items in Kernel menu
                $("#kernel_menu").append($(menu_html));
                $('#conda_menu_item').click(load_conda_view);
            }
        });
    }
    return {
        load_ipython_extension: load
    };
});
