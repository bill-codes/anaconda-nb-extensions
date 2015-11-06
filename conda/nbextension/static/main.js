define(function(require) {
    var $ = require('jquery');
    var IPython = require('base/js/namespace');
    var models = require('./models');
    var views = require('./views');

    function load() {
        if (!IPython.notebook_list) return;
        var base_url = IPython.notebook_list.base_url;
        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', base_url + 'nbextensions/conda-envs/conda.css')
        );

        $.ajax(base_url + 'nbextensions/conda-envs/tab.html', {
            dataType: 'html',
            success: function(env_html, status, xhr) {
                // Configure Conda tab
                $(".tab-content").append($(env_html));
                $("#tabs").append(
                    $('<li>')
                    .append(
                        $('<a>')
                        .attr('href', '#conda')
                        .attr('data-toggle', 'tab')
                        .text('Conda')
                        .click(function (e) {
                            window.history.pushState(null, null, '#conda');
                        })
                    )
                );

                models.base_url = IPython.notebook_list.base_url;
                views.EnvView.init();
                views.AvailView.init();
                views.InstalledView.init();

                models.environments.view = views.EnvView;
                models.available.view = views.AvailView;
                models.installed.view = views.InstalledView;
                models.environments.load();

                setTimeout(function() {
                    models.available.load();
                }, 2000);
            }
        });
    }
    return {
        load_ipython_extension: load
    };
});
