
define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    './common',
    './models',
], function(IPython, $, utils, common, models) {
    "use strict";

    var ListView = {
        selector:  null,
        model:     null,
        columns:   [],      // e.g., [{ heading: 'Name', attr: 'name', width: 3 }]
        label:     'item',
        selectable: true,
        transforms: {},
        bindings:   {},

        init: function() {
            this.create_header();
            this.bind();
        },

        bind: function() {
            var $root = $(this.selector);

            $.each(this.bindings, function(selector, callback) {
                $root.find(selector).click(callback);
            });
        },

        update_label: function(count) {
            $(this.selector).find('.toolbar_info').text(common.pluralize(count, this.label));
        },

        create_header: function(count) {
            var $header = $(this.selector).find('.list_header');
            $header.empty();

            $.each(this.columns, function(index, column) {
                $('<div/>')
                    .addClass('col-xs-' + column.width)
                    .text(column.heading)
                    .appendTo($header);
            });
        },

        refresh: function(data) {
            var that = this;
            var $root = $(this.selector);

            this.update_label(data.length);
            var $body = $root.find('.list_body');
            $body.empty();

            $.each(data, function(index, row) {
                var $row = $('<div/>')
                    .addClass('list_item')
                    .addClass('row')
                    .data('data', row);

                $.each(that.columns, function(index, column) {
                    var $cell = $('<div/>')
                        .addClass('col-xs-' + column.width);

                    var xform = that.transforms[column.attr];
                    if(xform) {
                        $cell.append(xform(row));
                    }
                    else {
                        // Default is to stuff text in the div
                        $cell.text(row[column.attr]);
                    }

                    // Create selection checkbox, if needed
                    if(that.selectable && index === 0) {
                        var selected_box = $('<input/>')
                            .attr('type', 'checkbox')
                            .attr('title', 'Click to select')
                            .addClass('flush-left')
                            .click(function() { row.selected = ! row.selected; })
                            .prependTo($cell);
                    }

                    $row.append($cell);
                });

                $body.append($row);
            });
        }
    }

    var EnvView = Object.create(ListView);

    $.extend(EnvView, {
        selector:   '#environments',
        label:      'Conda environment',
        selectable: false,
        model:      models.environments,
        columns:    [
            { heading: 'Name',      attr: 'name',       width: 3 },
            { heading: 'Default?',  attr: 'is_default', width: 1 },
            { heading: 'Directory', attr: 'dir',        width: 6 },
            { heading: 'Action',    attr: '_action',    width: 2 },
        ],

        transforms: {
            name: function(row) {
                return common.link('#', row.name)
                    .click(function() {
                        models.environments.select(row)
                    });
            },

            is_default: function(row) {
                return common.icon(row.is_default ? 'check' : '');
            },

            _action: function(row) {
                // This is a pseudo-attribute
                // TODO: the view should not know about this URL, need a model method
                var export_url = utils.url_join_encode(models.base_url, 'environments', row.name, 'export');

                return $('<span/>')
                    .addClass('btn-group')
                    .append(common.button('Delete', 'trash-o').click(function () {
                        var msg = 'Are you sure you want to permanently delete "' + row.name + '" ?';
                        common.confirm('Delete Environment', msg, 'Delete', function() {
                            models.environments.remove(row);
                        });
                    }))
                    .append(common.button('Clone', 'copy').click(function () {
                        common.prompt('Clone Environment', 'Create a copy of "' + row.name + '"', 'New name:', 'Clone', function(new_name) {
                            models.environments.clone(row, new_name);
                        });
                    }))
                    .append(common.link(export_url, common.button('Export', 'external-link')));
            }
        },

        bindings: {
            '#refresh_env_list': function() {
                models.environments.load();
            }
        }
    });

    var AvailView = Object.create(ListView);

    $.extend(AvailView, {
        selector:   '#available_packages',
        label:      'available package',

        columns:    [
            { heading: 'Name',     attr: 'name',    width: 5 },
            { heading: 'Version',  attr: 'version', width: 2 },
            { heading: 'Channel',  attr: 'channel', width: 5 }
        ],

        bind: function() {
            ListView.bind.call(this);

            var that = this;
            var $box = $('#searchbox');

            $box.keyup(function() {
                that.filter($box.val());
            });
        },

        bindings: {
            '#refresh_avail_list': function() { models.available.load(); },

            '#install': function() {
                var msg = 'Are you sure you want to install ' +
                            common.pluralize(models.available.get_selection().length, 'package') +
                            ' into the environment "' + models.environments.selected.name + '" ?';

                common.confirm('Install Packages', msg, 'Install', function() {
                    models.available.conda_install();
                });
            }
        },

        filter: function(query) {
            var count = 0;

            $(this.selector).find('.list_item').each(function(index, elem) {
                var $elem = $(elem);

                if($elem.data('data').name.indexOf(query) === -1) {
                    $elem.hide();
                }
                else {
                    $elem.show();
                    count++;
                }
            });

            this.update_label(count);
        }
    });

    var InstalledView = Object.create(ListView);

    $.extend(InstalledView, {
        selector:   '#installed_packages',
        label:      'installed package',

        columns:    [
            { heading: 'Name',      attr: 'name',      width: 5 },
            { heading: 'Version',   attr: 'version',   width: 2 },
            { heading: 'Build',     attr: 'build',     width: 2 },
            { heading: 'Available', attr: 'available', width: 3 }
        ],

        update_label: function(count) {
            $(this.selector)
                .find('.toolbar_info')
                .text(common.pluralize(count, this.label) +
                    ' in environment "' + models.environments.selected.name + '"');
        },

        bindings: {
            '#refresh_pkg_list': function() { models.installed.load(); },

            '#check_update': function() {
                models.installed.conda_check_updates();
            },

            '#update_pkgs': function() {
                var msg = 'Are you sure you want to update ' +
                            common.pluralize(models.installed.get_selection().length, 'package') +
                            ' in the environment "' + models.environments.selected.name + '" ?';

                common.confirm('Update Packages', msg, 'Update', function() {
                    models.installed.conda_update();
                });
            },

            '#remove_pkgs': function() {
                var msg = 'Are you sure you want to remove ' +
                            common.pluralize(models.installed.get_selection().length, 'package') +
                            ' from the environment "' + models.environments.selected.name + '" ?';

                common.confirm('Remove Packages', msg, 'Remove', function() {
                    models.installed.conda_remove();
                });
            }
        },
    });

    return {
        'EnvView':       EnvView,
        'AvailView':     AvailView,
        'InstalledView': InstalledView
    };
});
