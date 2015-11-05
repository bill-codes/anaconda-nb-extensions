define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    './common',
], function(IPython, $, utils, dialog, common) {
    "use strict";

    var PkgList = function (selector, options) {
        // PkgList represents the list of Packages in an environment

        this.selector = selector;
        if (this.selector !== undefined) {
            this.element = $(selector);
            this.bind_events();
        }
        options = options || {};
        this.options = options;
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.packages = {};
        this.selection = [];
    };


    PkgList.prototype.bind_events = function () {
        // Set up event handlers for PkgList components
        var that = this;
        $('#refresh_pkg_list').click(function() { return that.load_list(); });
        $('#check_update'    ).click($.proxy(this.check_update, this));
        $('#update_pkgs'     ).click($.proxy(this.update_pkgs,  this));
        $('#remove_pkgs'     ).click($.proxy(this.remove_pkgs,  this));
    };


    PkgList.prototype.set_environment = function(env) {
        this.clear_list();

        if(env) {
            this.env = env;
            this.load_list();
        }
    }

    PkgList.prototype.load_list = function() {
        // Load the package list via ajax to the /environments/ENV_NAME endpoint
        if(! this.env) {
            return;
        }
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(this.load_list_success, this),
            error : common.MakeErrorCallback('Error', 'An error occurred while retrieving package information')
        };
        var url = utils.url_join_encode(this.base_url, 'environments', this.env.name);
        $.ajax(url, settings);
    };


    PkgList.prototype.clear_list = function () {
        this.element.children('.list_item').remove();
        this.packages = [];
    };


    PkgList.prototype.load_list_success = function (data, status, xhr) {
        // Process response from the /environments endpoint

        this.clear_list();
        var len = data.length;
        for (var i=0; i<len; i++) {
            var d = data[i];
            var element = $('<div/>');
            var item = new Package(element, this, this.options);
            item.update(d);
            element.data('item', item);
            this.element.append(element);
            this.packages[d.name] = item;
        }
        this.selection = [];
        $('#pkg_list_info').text(len + ' packages in environment "' + this.env.name + '"');
    };


    PkgList.prototype.update_selection = function(data) {
        if(data.selected) {
            this.selection.push(data.name);
        }
        else {
            this.selection = this.selection.filter(function(pkg_name) {
                return pkg_name !== data.name;
            });
        }
    };


    PkgList.prototype.check_update = function() {
        var that = this;
        var packages = this.selection;

        if(packages.length == 0) {
            packages = ['--all'];
        }

        var error_callback = common.MakeErrorCallback('Error', 'An error occurred while checking for package updates.');

        function success_callback(data, status, xhr) {
            var len = data.length;
            for(var i = 0; i < len; i++) {
                // entries contain name, version, build
                var d = data[i];
                var entry = that.packages[d.name];

                // See if there is an existing entry.
                // Usually there will be, but an update might pull in a new package as a dependency.
                if(entry) {
                    entry.set_available(d.version, d.build);
                }
            }
        }
        this.action('check', packages, success_callback, error_callback);
    };


    PkgList.prototype.update_pkgs = function() {
        var that = this;
        var packages = this.selection;
        var msg;
        var len = packages.length;

        if(packages.length != 0) {
            msg = 'Are you sure you want to update ' + common.pluralize(len, 'package') + ' in this environment?';
        }
        else {
            msg = 'Are you sure you want to update ALL packages in this environment?';
            packages = ['--all'];
        }

        var error_callback = common.MakeErrorCallback('Error Updating Packages', 'An error occurred while updating packages.');

        dialog.modal({
            title: "Update Packages",
            body: msg,
            buttons: {
                Update: {
                    class: "btn-danger",
                    click: function() {
                        that.action('update', packages, $.proxy(that.load_list, that), error_callback);
                    }
                },
                Cancel: {}
            }
        });
    };


    PkgList.prototype.remove_pkgs = function() {
        var that = this;
        var packages = this.selection;
        if(packages.length == 0) {
            return;
        }

        var error_callback = common.MakeErrorCallback('Error Removing Packages', 'An error occurred while removing the packages.');

        dialog.modal({
            title: "Remove Packages",
            body: 'Are you sure you want to remove ' + packages.length + ' packages from this environment?',
            buttons: {
                Remove: {
                    class: "btn-danger",
                    click: function() {
                        that.action('remove', packages, $.proxy(that.load_list, that), error_callback);
                    }
                },
                Cancel: {}
            }
        });
    };


    PkgList.prototype.action = function(action, packages, success_callback, error_callback) {
        // POST to /environments/ENV_NAME/packages/PACKAGE_NAME/action and handle results
        var url = utils.url_join_encode(this.base_url, 'environments', this.env.name, 'packages', action);

        var settings = {
            cache : false,
            data : { packages: packages },
            type : "POST",
            dataType : "json",
            success : common.SuccessWrapper(success_callback, error_callback),
            error : error_callback
        };
        $.ajax(url, settings);
    }


    var Package = function (element, owner, options) {
        // Package represents an item in the PkgList

        this.element = $(element);
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.data = null;
        this.owner = owner;
        this.element.addClass('list_item').addClass("row");
    };


    Package.prototype.update = function (data) {
        var that = this;
        that.data = data;

        var pkg_url = utils.url_join_encode(that.base_url, 'environments', that.data.name);
        var export_url = utils.url_join_encode(pkg_url, 'export');

        var selected = that.data.selected ? 'check-square' : 'square';

        var name_col      = common.column('name', 5);
        var version_col   = common.column('version', 2).text(this.data.version);
        var build_col     = common.column('build', 2).text(this.data.build);
        var avail_col     = common.column('available', 3).text(this.data.avail);

        function select_click() {
            that.data.selected = ! that.data.selected;
            //that.update(that.data);
            that.owner.update_selection(that.data);
        }

        var selected_box = $('<input/>')
                .attr('type', 'checkbox')
                .attr('title', 'Click to select this package')
                .addClass('flush-left')
                .click(select_click)
                .appendTo(name_col);

        $('<span/>').text(this.data.name).appendTo(name_col);

        this.avail_col = avail_col;

        this.element.empty()
            .append(name_col)
            .append(version_col)
            .append(build_col)
            .append(avail_col);
    };

    Package.prototype.set_available = function(version, build) {
        this.avail_col.text(version + '-' + build);
    };

    return {
        'PkgList':   PkgList,
        'Package':   Package
    };
});
