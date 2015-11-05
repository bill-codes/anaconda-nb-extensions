
define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    './common',
], function(IPython, $, utils, common) {
    "use strict";

    var NullView = {
        refresh: function() {}
    };

    var base_url = '';

    var environments = {
        all:      [],
        selected: null,
        view:     NullView,

        load: function() {
            // Load the list via ajax to the /environments endpoint
            var that = this;
            var error_callback = common.MakeErrorCallback('Error', 'An error occurred while listing Conda environments.');

            function handle_response(envs, status, xhr) {
                that.all = envs;

                // Select the default environment as current
                $.each(envs, function(index, env) {
                    if(env.is_default) {
                        that.selected = env;
                    }
                });

                that.view.refresh(envs);
            }

            var settings = common.AjaxSettings({
                success: common.SuccessWrapper(handle_response, error_callback),
                error:   error_callback
            });

            var url = utils.url_join_encode(base_url, 'environments');
            $.ajax(url, settings);
        },

        select: function(env) {
            this.selected = env;

            // refresh list of packages installed in the selected environment
            installed.load();
        }
    };

    function conda_package_action(packages, action, on_success, on_error) {
        // Helper function to access the /environments/ENV/packages/ACTION endpoint

        var settings = common.AjaxSettings({
            data:    packages,
            type:    'POST',
            success: common.SuccessWrapper(on_success, on_error),
            error:   on_error
        });

        var url = utils.url_join_encode(base_url, 'environments', environments.selected.name, action);
        $.ajax(url, settings);
    }

    var available = {
        packages: [],
        view:     NullView,

        load: function() {
            // Search for empty string will return all packaged in configured channels.
            this.conda_search('');
        },

        get_selection: function() {
            return this.packages.filter(function(pkg) {
                return pkg.selected;
            });
        },

        get_selected_names: function() {
            return this.get_selection().map(function(pkg) {
                return pkg.name;
            });
        },

        conda_search: function(query) {
            // Load the package list via ajax to the /packages/search endpoint
            var that = this;

            function handle_response(packages, status, xhr) {
                $.each(packages, function(index, pkg) {
                    pkg.selected = false;
                });

                that.packages = packages;
                that.view.refresh(that.packages);
            }

            var error_callback = common.MakeErrorCallback('Error', 'An error occurred while retrieving package information.');

            var settings = common.AjaxSettings({
                success : common.SuccessWrapper(handle_response, error_callback),
                error : error_callback
            });

            var url = utils.url_path_join(base_url, 'packages', 'search') + '?q=' + encodeURIComponent(query);
            $.ajax(url, settings);
        },

        filter: function(query) {
            // Filter the list, without querying the server.

            var filtered = this.packages.filter(function(pkg) {
                return (pkg.name.indexOf(query) !== -1);
            });
            this.view.refresh(filtered);
        },

        conda_install: function() {
            var that = this;
            var packages = this.get_selected_names();

            if(packages.length == 0) {
                return;
            }

            var error_callback = common.MakeErrorCallback('Error Installing Packages', 'An error occurred while installing packages.');

            function install_success() {
                // Refresh list of packages installed in the current environment
                installed.load();
            }
            conda_package_action(packages, 'install', install_success, error_callback);
        }
    };


    var installed = {
        packages: [],
        by_name:  {},
        view:     NullView,

        load: function() {
            if(environments.selected !== null) {
                this.conda_list(environments.selected.name);
            }
            else {
                // Need an environment in order to display installed packages.
                this.packages = [];
                this.by_name = {};
                this.view.refresh([]);
            }
        },

        get_selection: function() {
            return this.packages.filter(function(pkg) {
                return pkg.selected;
            });
        },

        get_selected_names: function() {
            return this.get_selection().map(function(pkg) {
                return pkg.name;
            });
        },

        conda_list: function(name) {
            // Load the package list via ajax to the /packages/search endpoint
            var that = this;

            function handle_response(packages, status, xhr) {
                $.each(packages, function(index, pkg) {
                    pkg.selected = false;
                    pkg.available = '';
                    by_name[pkg.name] = pkg;
                });

                that.packages = packages;
                that.by_name  = by_name;
                that.view.refresh(that.packages);
            }

            var error_callback = common.MakeErrorCallback('Error', 'An error occurred while retrieving installed packages.');

            var settings = common.AjaxSettings({
                success: common.SuccessWrapper(handle_response, error_callback),
                error:   error_callback
            });

            var url = utils.url_join_encode(base_url, 'environments', query);
            $.ajax(url, settings);
        },

        _update: function(dry_run, handler) {
            // Load the package list via ajax to the /environments/ENV/check endpoint
            var that = this;

            var packages = this.get_selected_names();

            if(packages.length == 0) {
                // If no packages are selected, update all
                packages = ['--all'];
            }

            var action;
            var msg;

            if(dry_run) {
                action = 'check';
                msg = 'An error occurred while checking for package updates.';
            }
            else {
                action = 'update';
                msg = 'An error occurred while updating packages.';
            }

            var error_callback = common.MakeErrorCallback('Error', msg);
            conda_package_action(packages, action, handler, error_callback);
        },

        conda_check_updates: function() {
            var that = this;

            function handle_response(packages, status, xhr) {
                $.each(packages, function(index, pkg) {
                    var existing = that.by_name[pkg.name];

                    // See if there is an existing entry.
                    // Usually there will be, but an update
                    // might pull in a new package as a dependency.
                    if(existing) {
                        existing.available = d.version + '-' + d.build;
                    }
                });

                that.packages = packages;
                that.view.refresh(packages);
            }

            this._update(true, handle_response);
        },

        conda_update: function() {
            var that = this;

            function handle_response(packages, status, xhr) {
                // Refresh list of packages to reflect changes
                that.load();
            }

            this._update(false, handle_response);
        },

        conda_remove: function() {
            var that = this;
            var packages = this.get_selected_names();

            if(packages.length == 0) {
                return;
            }

            var error_callback = common.MakeErrorCallback('Error Removing Packages', 'An error occurred while removing packages.');

            function remove_success() {
                // Refresh list of packages installed in the current environment
                installed.load();
            }
            conda_package_action(packages, 'remove', remove_success, error_callback);
        }
    };

    return {
        'base_url':     base_url,
        'environments': environments,
        'available':    available,
        'installed':    installed
    };
});
