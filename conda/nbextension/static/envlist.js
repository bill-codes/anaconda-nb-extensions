// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    './common',
], function(IPython, $, utils, dialog, common) {
    "use strict";

    var EnvList = function (selector, options) {
        // EnvList represents the list of Environments in that tab

        this.selector = selector;
        this.pkg_list = options.pkg_list;
        this.avail_list = options.avail_list;

        if (this.selector !== undefined) {
            this.element = $(selector);
            this.bind_events();
        }
        options = options || {};
        this.options = options;
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
    };


    EnvList.prototype.bind_events = function () {
        // Set up event handlers for EnvList components
        $('#refresh_env_list').click($.proxy(this.load_list, this));
    };


    EnvList.prototype.load_list = function () {
        // Load the list via ajax to the /environments endpoint

        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(this.load_list_success, this),
            error : utils.log_ajax_error,
        };
        var url = utils.url_join_encode(this.base_url, 'environments');
        $.ajax(url, settings);
    };


    EnvList.prototype.clear_list = function () {
        this.element.children('.list_item').remove();
    };


    EnvList.prototype.load_list_success = function (data, status, xhr) {
        // Process response from the /environments endpoint

        this.clear_list();
        var len = data.length;
        for (var i=0; i<len; i++) {
            var element = $('<div/>');
            var item = new EnvItem(element, this, this.options);
            item.update(data[i]);
            element.data('item', item);
            this.element.append(element);

            if(data[i].is_default) {
                this.default_env = data[i];
            }
        }
        this.pkg_list.set_environment(this.default_env);
        this.avail_list.set_environment(this.default_env);
        $('#env_list_info').text(len + ' Conda environments');
    };


    EnvList.prototype.get_default_env = function () {
        return this.default_env;
    }


    var EnvItem = function (element, owner, options) {
        // EnvItem represents an item in the EnvList

        this.element = $(element);
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.data = null;
        this.owner = owner;
        this.element.addClass('list_item').addClass("row");
    };


    EnvItem.prototype.action = function(action, status_text, err_title, err_action, data) {
        // POST to /environments/ENV_NAME/action and handle results
        // TODO: The function signature is awful, really should
        // consider dispatching progress and failures to callbacks.

        var that = this;
        var url = utils.url_join_encode(that.base_url, 'environments', that.data.name, action);
        var settings = {
            cache : false,
            data : data || {},
            type : "POST",
            dataType : "json",
            success : function (data, status, xhr) {
                //that.update(data);
                if(data.error) {
                    // Conda returned an error in the JSON
                    settings.error(xhr, status, data.error);
                }
                that.owner.load_list();
            },
            error : function (xhr, status, e) {
                dialog.modal({
                    title: err_title,
                    body: $('<div/>')
                        .text("An error occurred while " + err_action + " \"" + that.data.name + "\".")
                        .append($('<div/>')
                            .addClass('alert alert-danger')
                            .text(e.message || e)),
                    buttons: {
                        OK: {'class': 'btn-primary'}
                    }
                });
                console.warn('Error while ', err_action, that.data.name, ':' , e);
                utils.log_ajax_error(xhr, status, e);
            }
        };
        that.action_col.text(status_text);
        $.ajax(url, settings);
    }


    EnvItem.prototype.delete = function() {
        var that = this;

        dialog.modal({
            title: "Delete Environment",
            body: 'Are you sure you want to permanently delete: ' + that.data.name + '?',
            buttons: {
                Delete: {
                    class: "btn-danger",
                    click: function() {
                        that.action('delete', 'Deleting...', 'Delete Failed', 'deleting');
                    }
                },
                Cancel: {}
            }
        });
    };


    EnvItem.prototype.clone = function() {
        var that = this;

        var dialogform = $('<div/>').attr('title', 'Name of new environment:').append(
            $('<form/>').append(
                $('<fieldset/>').append(
                    $('<label/>')
                    .attr('for','name')
                    .text('Name:')
                )
                .append(
                    $('<input/>')
                    .attr('id', 'name')
                )
            )
        );

        dialog.modal({
            title: "Clone Environment",
            body: dialogform,
            buttons: {
                Cancel: {},
                Clone: {
                    class: "btn-danger",
                    click: function() {
                        that.action('clone', 'Cloning...', 'Clone Failed', 'cloning', { name: $('#name').val() });
                    }
                }
            }
        });
    }


    EnvItem.prototype.update = function (data) {
        var that = this;
        that.data = data;

        var env_link = common.link('#', this.data.name);
        env_link.click(function() {
            that.owner.pkg_list.set_environment(that.data);
            that.owner.avail_list.set_environment(that.data);
        });

        var export_url = utils.url_join_encode(that.base_url, 'environments', that.data.name, 'export');

        var name_col      = common.column('name', 2).append(env_link);
        var dir_col       = common.column('dir', 4).text(this.data.dir);
        var default_col   = common.column('default', 1).addClass('text-center');
        var action_col    = common.column('action', 2);

        var export_button = common.link(export_url, common.button('Export', 'external-link'));
        var clone_button  = common.button('Clone', 'copy');
        var delete_button = common.button('Delete', 'trash-o');

        var default_box = this.data.is_default ? 'check' : '';
        default_col.append(common.icon(default_box));

        action_col.append(
            $("<span/>").addClass("btn-group")
                .append(delete_button)
                .append(clone_button)
                .append(export_button)
        );
        this.action_col = action_col;

        this.element.empty()
            .append(name_col)
            .append(default_col)
            .append(dir_col)
            .append(action_col);

        clone_button.click(function (e) {
            that.clone();
        });

        delete_button.click(function (e) {
            that.delete();
        });
    };


    return {
        'EnvList': EnvList,
        'EnvItem': EnvItem,
    };
});
