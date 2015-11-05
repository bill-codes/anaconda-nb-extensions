define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
], function(IPython, $, utils, dialog) {
    "use strict";

    function SuccessWrapper(success_callback, error_callback) {
        return function(data, status, xhr) {
            if(data.error || data.message) {
                // Conda returned a dict with error info
                error_callback(xhr, status, data.error || data.message);
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

    function AjaxSettings(settings) {
        settings.cache = false;
        settings.dataType = 'json';

        if(! settings.type) {
            settings.type = 'GET';
        }
        return settings;
    }

    function confirm(title, msg, button_text, callback) {
        var buttons = { Cancel: {} };
        buttons[button_text] = {
            class: 'btn-danger',
            click: callback
        }

        dialog.modal({
            title: title,
            body: msg,
            buttons: buttons
        });
    }

    function pluralize(count_or_array, single_word, plural_word) {
        var count = (count_or_array instanceof Array) ? count_or_array.length : count_or_array;
        var plural = (count !== 1);
        var word;

        if(plural) {
            if(plural_word) {
                word = plural_word;
            }
            else {
                if(single_word.endsWith('s') || single_word.endsWith('sh') || single_word.endsWith('ch')) {
                    word = single_word + 'es';
                }
                else if(single_word.endsWith('y')) {
                    word = single_word.slice(0, -1) + 'ies';
                }
                else {
                    word = single_word + 's';
                }
            }
        }
        else {
            word = single_word;
        }
        return count + ' ' + word;
    }

    return {
        'MakeErrorCallback': MakeErrorCallback,
        'SuccessWrapper': SuccessWrapper,
        'icon': icon,
        'column': column,
        'button': button,
        'link': link,
        'AjaxSettings': AjaxSettings,
        'confirm': confirm,
        'pluralize': pluralize
    };
});
