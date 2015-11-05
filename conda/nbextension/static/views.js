
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

        bind: function() {
            var $root = $(this.selector);

            $.each(this.bindings, function(selector, callback) {
                $root.find(selector).click(callback);
            });
        },

        refresh: function(data) {
            var that = this;
            var len = data.length;
            var $root = $(this.selector);

            $root.find('.toolbar_info').text(common.pluralize(len, this.label));
            var $header = $root.find('.list_header');
            $header.empty();

            $.each(this.columns, function(index, column) {
                $('<div/>')
                    .addClass('col-xs-' + column.width)
                    .text(column.heading)
                    .appendTo($header);
            });

            var $body = $root.find('.list_body');
            $body.empty();

            $.each(data, function(index, row) {
                var $row = $('<div/>')
                    .addClass('list_item')
                    .addClass('row');

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
            { heading: 'Name', attr: 'name', width: 2 },
            { heading: 'Default?', attr: 'is_default', width: 1 },
            { heading: 'Directory', attr: 'dir', width: 4 }
            //,{ heading: 'Action', attr: 'name', width: 2 },
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
            var $box = $('#searchbox');

            $box.keyup(function() {
                models.available.filter($box.val());
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
        }
    });

    var InstalledView = Object.create(ListView);

    $.extend(InstalledView, {
        selector:   '#installed_packages',
        label:      'installed package',

        columns:    [
            { heading: 'Name',     attr: 'name',      width: 5 },
            { heading: 'Version',  attr: 'version',   width: 2 },
            { heading: 'Build',    attr: 'build',     width: 2 },
            { heading: 'Avail',    attr: 'available', width: 3 }
        ]
    });

    return {
        'EnvView':       EnvView,
        'AvailView':     AvailView,
        'InstalledView': InstalledView
    };
});
