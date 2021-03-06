/*
 * Dirty 
 * jquery plugin to detect when a form is modified
 * (c) 2016 Simon Taite - https://github.com/simontaite/jquery.dirty
 * originally based on jquery.dirrty by Ruben Torres - https://github.com/rubentd/dirrty
 * Released under the MIT license
 */

(function($) {

    //Save dirty instances
    var singleDs = [];
    var dirty = "dirty";
    var clean = "clean";
    var dataInitialValue = "dirtyInitialValue";
    var dataIsDirty = "isDirty";

    var getSingleton = function(id) {
        var result;
        singleDs.forEach(function(e) {
            if (e.id === id) {
                result = e;
            }
        });
        return result;
    };

    var setSubmitEvents = function(d) {
        d.form.on("submit", function() {
            d.submitting = true;
        });

        if (d.options.preventLeaving) {
            $(window).on("beforeunload", function() {
                if (d.isDirty && !d.submitting) {
                    return d.options.leavingMessage;
                }
            });
        }
    };

    var setNamespacedEventTriggers = function(d) {

        d.form.find("input, select, textarea").on("change click keyup keydown blur", function(e) {
            $(this).trigger(e.type + ".dirty");
        });
    };

    var setNamespacedEvents = function(d) {

        d.form.find("input, select, textarea").on("change.dirty click.dirty keyup.dirty keydown.dirty blur.dirty", function(e) {
            d.checkValues(e);
        });

        d.form.on("dirty", function() {
            d.options.onDirty();
        });

        d.form.on("clean", function() {
            d.options.onClean();
        });
    };

    var clearNamespacedEvents = function(d) {
        d.form.find("input, select, textarea").off("change.dirty click.dirty keyup.dirty keydown.dirty blur.dirty");

        d.form.off("dirty");

        d.form.off("clean");
    };

    var Dirty = function(form, options) {
        this.form = form;
        this.isDirty = false;
        this.options = options;
        this.history = [clean, clean]; //Keep track of last statuses
        this.id = $(form).attr("id");
        singleDs.push(this);
    };

    Dirty.prototype = {
        init: function() {
            this.saveInitialValues();
            this.setEvents();
        },

        isRadioOrCheckbox: function(el){
            return $(el).is(":radio, :checkbox");
        },

        saveInitialValues: function() {
            var d = this;
            this.form.find("input, select, textarea").each(function(_, e) {

                var isRadioOrCheckbox = d.isRadioOrCheckbox(e);

                if (isRadioOrCheckbox) {
                    var isChecked = $(e).is(":checked") ? "checked" : "unchecked";
                    $(e).data(dataInitialValue, isChecked);
                } else {
                    $(e).data(dataInitialValue, $(e).val() || '');
                }
            });
        },

        refreshEvents: function () {
            var d = this;
            clearNamespacedEvents(d);
            setNamespacedEvents(d);
        },

        showDirtyFields: function() {
            var d = this;

            return d.form.find("input, select, textarea").filter(function(_, e){
                return $(e).data("isDirty");
            });
        },

        setEvents: function() {
            var d = this;

            setSubmitEvents(d);
            setNamespacedEvents(d);
            setNamespacedEventTriggers(d);
        },

        isFieldDirty: function($field) {
            var initialValue = $field.data(dataInitialValue);
             // Explicitly check for null/undefined here as value may be `false`, so ($field.data(dataInitialValue) || '') would not work
            if (initialValue == null) { initialValue = ''; }
            var currentValue = $field.val();
            if (currentValue == null) { currentValue = ''; }

            // Boolean values can be encoded as "true/false" or "True/False" depending on underlying frameworks so we need a case insensitive comparison
            var boolRegex = /^(true|false)$/i;
            var isBoolValue = boolRegex.test(initialValue) && boolRegex.test(currentValue);
            if (isBoolValue) {
                var regex = new RegExp("^" + initialValue + "$", "i");
                return !regex.test(currentValue);
            }

            return currentValue !== initialValue;
        },

        isCheckboxDirty: function($field) {
            var initialValue = $field.data(dataInitialValue);
            var currentValue = $field.is(":checked") ? "checked" : "unchecked";

            return initialValue !== currentValue;
        },

        checkValues: function(e) {
            var d = this;
            
            var el = e.target;
            var isRadioOrCheckbox = d.isRadioOrCheckbox(e);
            var $el = $(el);

            var thisIsDirty = isRadioOrCheckbox ? d.isCheckboxDirty($el) : d.isFieldDirty($el);
            $el.data(dataIsDirty, thisIsDirty);

            var formIsDirty = thisIsDirty;

            if (formIsDirty) {
                d.setDirty();
            } else {
                d.setClean();
            }

            d.fireEvents();
            e.stopImmediatePropagation();
        },

        fireEvents: function() {

            if (this.isDirty && (this.options.fireEventsOnEachChange || this.wasJustClean())) {
                this.form.trigger("dirty");
            }

            if (!this.isDirty && (this.options.fireEventsOnEachChange || this.wasJustDirty())) {
                this.form.trigger("clean");
            }
        },

        setDirty: function() {
            this.isDirty = true;
            this.history[0] = this.history[1];
            this.history[1] = dirty;
        },

        setClean: function() {
            this.isDirty = false;
            this.history[0] = this.history[1];
            this.history[1] = clean;
        },

        //Lets me know if the previous status of the form was dirty
        wasJustDirty: function() {
            return (this.history[0] === dirty);
        },

        //Lets me know if the previous status of the form was clean
        wasJustClean: function() {
            return (this.history[0] === clean);
        },

        setAsClean: function(){
            this.saveInitialValues();
            this.setClean();
        },

        resetForm: function(){
            var d = this;
            this.form.find("input, select, textarea").each(function(_, e) {

                var $e = $(e);
                var isRadioOrCheckbox = d.isRadioOrCheckbox(e);

                if (isRadioOrCheckbox) {
                    var initialCheckedState = $e.data(dataInitialValue);
                    var isChecked = initialCheckedState === "checked";

                    $e.prop("checked", isChecked);
                } else {
                    var value = $e.data(dataInitialValue);
                    $e.val(value);
                }
            });

            this.checkValues();
        }
    };

    $.fn.dirty = function(options) {

        if (typeof options === "string" && /^(isDirty|isClean|refreshEvents|resetForm|setAsClean|showDirtyFields)$/i.test(options)) {
            //Check if we have an instance of dirty for this form
            // TODO: check if this is DOM or jQuery object
            var d = getSingleton($(this).attr("id"));

            if (!d) {
                d = new Dirty($(this), options);
                d.init();
            }
            var optionsLowerCase = options.toLowerCase();

            switch (optionsLowerCase) {
            case "isclean":
                return !d.isDirty;
            case "isdirty":
                return d.isDirty;
            case "refreshevents":
                d.refreshEvents();
            case "resetform":
                d.resetForm();
            case "setasclean":
                return d.setAsClean();
            case "showdirtyfields":
                return d.showDirtyFields();            
            }

        } else if (typeof options === "object" || !options) {

            return this.each(function(_, e) {
                options = $.extend({}, $.fn.dirty.defaults, options);
                var dirty = new Dirty($(e), options);
                dirty.init();
            });

        }
    };

    $.fn.dirty.defaults = {
        preventLeaving: false,
        leavingMessage: "There are unsaved changes on this page which will be discarded if you continue.",
        onDirty: $.noop, //This function is fired when the form gets dirty
        onClean: $.noop, //This funciton is fired when the form gets clean again
        fireEventsOnEachChange: false, // Fire onDirty/onClean on each modification of the form
    };

})(jQuery);