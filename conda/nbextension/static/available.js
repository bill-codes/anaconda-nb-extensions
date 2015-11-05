define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    './common',
], function(IPython, $, utils, dialog, common) {
    "use strict";

    var AvailList = function (selector, options) {
        // AvailList represents the list of Packages that can be installed

        this.selector = selector;
        this.pkg_list = options.pkg_list;

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


    AvailList.prototype.bind_events = function () {
        // Set up event handlers for PkgList components
        var that = this;
        $('#refresh_avail_list').click($.proxy(this.load_list, this));
        $('#searchbox').keyup($.proxy(this.filter_list, this));
        $('#install').click($.proxy(this.install_packages, this));
    };


    AvailList.prototype.set_environment = function(env) {
        this.env = env;
    }


    AvailList.prototype.load_list = function() {
        // Load the package list via ajax to the /packages/search endpoint
        this.do_search('');
    };


    AvailList.prototype.filter_list = function() {
        var that = this;
        var query = $('#searchbox').val();
        var count = 0;

        this.element.children('.list_item').each(function(index, elem) {
            elem = $(elem);
            var d = elem.data('item').data;
            var match = (d.name.indexOf(query) !== -1);
            if(match) {
                elem.show();
                count++;
            }
            else {
                elem.hide();
                d.selected = false;
                that.update_selection(d);
            }
        });

        this.selection = [];

        if(query === '') {
            $('#avail_list_info').text(Object.keys(this.packages).length + ' packages available');
        }
        else {
            $('#avail_list_info').text(count + ' matching packages');
        }
    };


    AvailList.prototype.do_search = function(query) {
        // Load the package list via ajax to the /environments/ENV_NAME endpoint
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(this.load_list_success, this),
            error : common.MakeErrorCallback('Error', 'An error occurred while retrieving package information')
        };
        var url = utils.url_join_encode(this.base_url, 'packages', 'search') + '?q=' + encodeURIComponent(query);
        $.ajax(url, settings);
    };


    AvailList.prototype.clear_list = function () {
        this.element.children('.list_item').remove();
        this.packages = [];
    };


    AvailList.prototype.load_list_success = function (data, status, xhr) {
        // Process response from the /packages/search endpoint

        this.clear_list();
        var len = data.length;
        for (var i=0; i<len; i++) {
            var d = data[i];
            var element = $('<div/>');
            var item = new AvailPkg(element, this, this.options);
            item.update(d);
            element.data('item', item);
            this.element.append(element);
            this.packages[d.name] = item;
        }
        this.selection = [];
        $('#avail_list_info').text(len + ' packages available');
    };


    AvailList.prototype.update_selection = function(data) {
        if(data.selected) {
            this.selection.push(data.name);
        }
        else {
            this.selection = this.selection.filter(function(pkg_name) {
                return pkg_name !== data.name;
            });
        }
    };


    AvailList.prototype.install_packages = function() {
        var that = this;
        var packages = this.selection;

        if(packages.length == 0) {
            return;
        }

        var msg = 'Are you sure you want to install ' + packages.length + ' packages in this environment?';
        var error_callback = common.MakeErrorCallback('Error Installing Packages', 'An error occurred while installing packages.');

        function install_success() {
            that.pkg_list.load_list();
        }

        dialog.modal({
            title: "Install Packages",
            body: msg,
            buttons: {
                Install: {
                    class: "btn-danger",
                    click: function() {
                        that.action('install', packages, common.SuccessWrapper(install_success), error_callback);
                    }
                },
                Cancel: {}
            }
        });
    };


    AvailList.prototype.action = function(action, packages, success_callback, error_callback) {
        // POST to /environments/ENV_NAME/packages/PACKAGE_NAME/action and handle results
        // TODO: refactor, this is a duplicate of PkgList.action
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


    var AvailPkg = function (element, owner, options) {
        // AvailPkg represents an item in the AvailList

        this.element = $(element);
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.data = null;
        this.owner = owner;
        this.element.addClass('list_item').addClass("row");
    };


    AvailPkg.prototype.update = function (data) {
        // TODO: refactor, this is almost an exact duplicate of Package.update
        var that = this;
        that.data = data;

        var pkg_url = utils.url_join_encode(that.base_url, 'environments', that.data.name);
        var export_url = utils.url_join_encode(pkg_url, 'export');

        var selected = that.data.selected ? 'check-square' : 'square';

        var name_col      = common.column('name', 5);
        var version_col   = common.column('version', 2).text(this.data.version);
        var channel_col   = common.column('channel', 5).text(this.data.channel);

        function select_click() {
            that.data.selected = ! that.data.selected;
            that.owner.update_selection(that.data);
        }

        var selected_box = $('<input/>')
                .attr('type', 'checkbox')
                .attr('title', 'Click to select this package')
                .addClass('flush-left')
                .click(select_click)
                .appendTo(name_col);

        $('<span/>').text(this.data.name).appendTo(name_col);

        this.element.empty()
            .append(name_col)
            .append(version_col)
            .append(channel_col);
    };

    return {
        'AvailList': AvailList,
        'AvailPkg':  AvailPkg
    };
});
