define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
], function(IPython, $, utils, dialog) {
    "use strict";

    function SuccessWrapper(success_callback, error_callback) {
        return function(data, status, xhr) {
            if(data.error) {
                // Conda returned a dict with error info
                error_callback(xhr, status, data.error);
            }
            else {
                success_callback(data, status, xhr);
            }
        }
    }

    function MakeErrorCallback(title, msg) {
        return function(xhr, status, e) {
            dialog.modal({
                title: title,

                body: $('<div/>')
                    .text(msg)
                    .append($('<div/>')
                        .addClass('alert alert-danger')
                        .text(e.message || e)),

                buttons: {
                    OK: {
                        'class': 'btn-primary'
                    }
                }
            });
            console.warn(msg + ' ' + e);
            utils.log_ajax_error(xhr, status, e);
        }
    }

    function icon(name) {
        return $('<i/>'  ).addClass('fa fa-' + name);
    }

    function column(name, width) {
        return $('<div/>').addClass(name + '_col col-xs-' + width)
    }

    function button(title, icon_name) {
        return $('<span class="pull-right">' +
                 '<button title="' + title + '" class="btn btn-default btn-xs">' +
                 '<i class="fa fa-' + icon_name + '"></i></button></span>');
    }

    function link(url, text) {
        return $('<a href="' + url + '"/>').html(text);
    }

    return {
        'MakeErrorCallback': MakeErrorCallback,
        'SuccessWrapper': SuccessWrapper,
        'icon': icon,
        'column': column,
        'button': button,
        'link': link,
    };
});
