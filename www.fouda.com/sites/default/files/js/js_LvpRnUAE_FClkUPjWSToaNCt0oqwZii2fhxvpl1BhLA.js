(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.ucAjaxCartAlt = {
  attach: function (context, settings) {

    $links = $(Drupal.settings.ucAjaxCartAlt.linkSelector).not('.uc-ajax-cart-alt-processed').addClass('uc-ajax-cart-alt-processed');
    // Store original link for when cart is empty
    $links.each(function() {
      $(this).data('uc_ajax_cart_alt_original', $(this).html());
    });

    // we refresh only one time
    $refresh = $('html').not('.uc-ajax-cart-alt-processed').addClass('uc-ajax-cart-alt-processed');
    element = $refresh[0];
    if (element) {
      var element_settings = {
        url: Drupal.settings.basePath + 'uc_ajax_cart_alt/ajax/refresh',
        event: 'ucAjaxCartAltOnLoad',
        progress: {
          type: 'none'
        },
      };
      var base = 'ucAjaxCartAltOnLoad';
      var ajax = new Drupal.ajax(base, element, element_settings);
      Drupal.ajax[base] = ajax;

      $(ajax.element).trigger('ucAjaxCartAltOnLoad');
    }
  }
}

/**
 * Custom defined Drupal AJAX command that will be called when the add to cart
 * ajax call returned no error.
 *
 * This function can be overriden on the theme if necessary.
 *
 * response.messages: Drupal status messages.
 * response.status_messages: Drupal themed status messages.
 */
Drupal.ajax.prototype.commands.ucAjaxCartAltAddItemSuccess = function(ajax, response, status) {
  if (!ajax.ucAjaxCartAltMessageElement) {
    ajax.ucAjaxCartAltMessageElement = $('<div class="uc-ajax-cart-alt-status-messages"></div>');
    $(ajax.element).before(ajax.ucAjaxCartAltMessageElement);
  }
  $(ajax.ucAjaxCartAltMessageElement).html(response.status_messages);
};

/**
 * Custom defined Drupal AJAX command that will be called when the add to cart
 * ajax call returned no error.
 * *
 * This function can be overriden on the theme if necessary.
 *
 * response.messages: Drupal status messages.
 * response.status_messages: Drupal themed status messages.
 */
Drupal.ajax.prototype.commands.ucAjaxCartAltAddItemError = function(ajax, response, status) {
  if (!ajax.ucAjaxCartAltMessageElement) {
    ajax.ucAjaxCartAltMessageElement = $('<div class="uc-ajax-cart-alt-status-messages"></div>');
    $(ajax.element).before(ajax.ucAjaxCartAltMessageElement);
  }
  $(ajax.ucAjaxCartAltMessageElement).html(response.status_messages);
};

/**
 * Custom defined Drupal AJAX command that will be called after refresh.
 *
 * This function can be overriden on the theme if necessary.
 */
Drupal.ajax.prototype.commands.ucAjaxCartAltRefresh = function(ajax, response, status) {
  if (response.empty) {
    $(response.selector).each(function() {
      $(this).html($(this).data('uc_ajax_cart_alt_original'));
    });
  }
};

/**
 * Custom defined Drupal AJAX command that will be called after cart view form is refreshed.
 *
 * This function can be overriden on the theme if necessary.
 */
Drupal.ajax.prototype.commands.ucAjaxCartAltViewForm = function(ajax, response, status) {
  // This probably will work just for garland and some themes, not all.
  // You might want to replicate this in your theme and update as necessary.
  // It will depend on how theme('status_messages') is output.
  $('#messages').remove();

  if ($("#uc-cart-view-form-table .messages").length) {
    var newScroll = $("#uc-cart-view-form-table .messages").offset().top - $("#uc-cart-view-form-table .messages").outerHeight();

    if ($('body').scrollTop() > newScroll) {
      $('body').animate({
        scrollTop :newScroll
      }, 100);
    }
  }
};

})(jQuery);
;
/**
 * @file better_exposed_filters.js
 *
 * Provides some client-side functionality for the Better Exposed Filters module
 */
(function ($) {
  Drupal.behaviors.betterExposedFilters = {
    attach: function(context) {
      // Add highlight class to checked checkboxes for better theming
      $('.bef-tree input[type=checkbox], .bef-checkboxes input[type=checkbox]')
        // Highlight newly selected checkboxes
        .change(function() {
          _bef_highlight(this, context);
        })
        .filter(':checked').closest('.form-item', context).addClass('highlight')
      ;
    }
  };

  Drupal.behaviors.betterExposedFiltersSelectAllNone = {
    attach: function(context) {

      /*
       * Add Select all/none links to specified checkboxes
       */
      var selected = $('.form-checkboxes.bef-select-all-none:not(.bef-processed)');
      if (selected.length) {
        var selAll = Drupal.t('Select All');
        var selNone = Drupal.t('Select None');

        // Set up a prototype link and event handlers
        var link = $('<a class="bef-toggle" href="#">'+ selAll +'</a>')
        link.click(function(event) {
          // Don't actually follow the link...
          event.preventDefault();
          event.stopPropagation();

          if (selAll == $(this).text()) {
            // Select all the checkboxes
            $(this)
              .html(selNone)
              .siblings('.bef-checkboxes, .bef-tree')
                .find('.form-item input:checkbox').each(function() {
                  $(this).attr('checked', true);
                  _bef_highlight(this, context);
                })
              .end()

              // attr() doesn't trigger a change event, so we do it ourselves. But just on
              // one checkbox otherwise we have many spinning cursors
              .find('input[type=checkbox]:first').change()
            ;
          }
          else {
            // Unselect all the checkboxes
            $(this)
              .html(selAll)
              .siblings('.bef-checkboxes, .bef-tree')
                .find('.form-item input:checkbox').each(function() {
                  $(this).attr('checked', false);
                  _bef_highlight(this, context);
                })
              .end()

              // attr() doesn't trigger a change event, so we do it ourselves. But just on
              // one checkbox otherwise we have many spinning cursors
              .find('input[type=checkbox]:first').change()
            ;
          }
        });

        // Add link to the page for each set of checkboxes.
        selected
          .addClass('bef-processed')
          .each(function(index) {
            // Clone the link prototype and insert into the DOM
            var newLink = link.clone(true);

            newLink.insertBefore($('.bef-checkboxes, .bef-tree', this));

            // If all checkboxes are already checked by default then switch to Select None
            if ($('input:checkbox:checked', this).length == $('input:checkbox', this).length) {
              newLink.click();
            }
          })
        ;
      }

      // Check for and initialize datepickers
      var befSettings = Drupal.settings.better_exposed_filters;
      if (befSettings && befSettings.datepicker && befSettings.datepicker_options && $.fn.datepicker) {
        var opt = [];
        $.each(befSettings.datepicker_options, function(key, val) {
          if (key && val) {
            opt[key] = JSON.parse(val);
          }
        });
        $('.bef-datepicker').datepicker(opt);
      }

    }                   // attach: function() {
  };                    // Drupal.behaviors.better_exposed_filters = {

  Drupal.behaviors.betterExposedFiltersAllNoneNested = {
    attach:function (context, settings) {
      $('.form-checkboxes.bef-select-all-none-nested li').has('ul').once('bef-all-none-nested', function () {
        $(this)
          // To respect term depth, check/uncheck child term checkboxes.
          .find('input.form-checkboxes:first')
          .click(function() {
            var checkedParent = $(this).attr('checked');
            if (!checkedParent) {
              // Uncheck all children if parent is unchecked.
              $(this).parents('li:first').find('ul input.form-checkboxes').removeAttr('checked');
            }
            else {
              // Check all children if parent is checked.
              $(this).parents('li:first').find('ul input.form-checkboxes').attr('checked', $(this).attr('checked'));
            }
          })
          .end()
          // When a child term is checked or unchecked, set the parent term's
          // status.
          .find('ul input.form-checkboxes')
          .click(function() {
            var checked = $(this).attr('checked');

            // Determine the number of unchecked sibling checkboxes.
            var ct = $(this).parents('ul:first').find('input.form-checkboxes:not(:checked)').size();

            // If the child term is unchecked, uncheck the parent.
            if (!checked) {
              // Uncheck parent if any of the childres is unchecked.
              $(this).parents('li:first').parents('li:first').find('input.form-checkboxes:first').removeAttr('checked');
            }

            // If all sibling terms are checked, check the parent.
            if (!ct) {
              // Check the parent if all the children are checked.
              $(this).parents('li:first').parents('li:first').find('input.form-checkboxes:first').attr('checked', checked);
            }
          });
      });
    }
  };

  Drupal.behaviors.better_exposed_filters_slider = {
    attach: function(context, settings) {
      var befSettings = settings.better_exposed_filters;
      if (befSettings && befSettings.slider && befSettings.slider_options) {
        $.each(befSettings.slider_options, function(i, sliderOptions) {
          var containing_parent = "#" + sliderOptions.viewId + " #edit-" + sliderOptions.id + "-wrapper .views-widget";
          var $filter = $(containing_parent);

          // If the filter is placed in a secondary fieldset, we may not have
          // the usual wrapper element.
          if (!$filter.length) {
            containing_parent = "#" + sliderOptions.viewId + " .bef-slider-wrapper";
            $filter = $(containing_parent);
          }

          // Only make one slider per filter.
          $filter.once('slider-filter', function() {
            var $input = $(this).find('input[type=text]');

            // This is a "between" or "not between" filter with two values.
            if ($input.length == 2) {
              var $min = $input.parent().find('input#edit-' + sliderOptions.id + '-min'),
                  $max = $input.parent().find('input#edit-' + sliderOptions.id + '-max'),
                  default_min,
                  default_max;

              if (!$min.length || !$max.length) {
                return;
              }

              // Get the default values.
              // We use slider min & max if there are no defaults.
              default_min = parseFloat(($min.val() == '') ? sliderOptions.min : $min.val(), 10);
              default_max = parseFloat(($max.val() == '') ? sliderOptions.max : $max.val(), 10);
              // Set the element value in case we are using the slider min & max.
              $min.val(default_min);
              $max.val(default_max);

              $min.parents(containing_parent).after(
                $('<div class="bef-slider"></div>').slider({
                  range: true,
                  min: parseFloat(sliderOptions.min, 10),
                  max: parseFloat(sliderOptions.max, 10),
                  step: parseFloat(sliderOptions.step, 10),
                  animate: sliderOptions.animate ? sliderOptions.animate : false,
                  orientation: sliderOptions.orientation,
                  values: [default_min, default_max],
                  // Update the textfields as the sliders are moved
                  slide: function (event, ui) {
                    $min.val(ui.values[0]);
                    $max.val(ui.values[1]);
                  },
                  // This fires when the value is set programmatically or the
                  // stop event fires.
                  // This takes care of the case that a user enters a value
                  // into the text field that is not a valid step of the slider.
                  // In that case the slider will go to the nearest step and
                  // this change event will update the text area.
                  change: function (event, ui) {
                    $min.val(ui.values[0]);
                    $max.val(ui.values[1]);
                  },
                  // Attach stop listeners.
                  stop: function(event, ui) {
                    // Click the auto submit button.
                    $(this).parents('form').find('.ctools-auto-submit-click').click();
                  }
                })
              );

              // Update the slider when the fields are updated.
              $min.blur(function() {
                befUpdateSlider($(this), 0, sliderOptions);
              });
              $max.blur(function() {
                befUpdateSlider($(this), 1, sliderOptions);
              });
            }
            // This is single value filter.
            else if ($input.length == 1) {
              if ($input.attr('id') != 'edit-' + sliderOptions.id) {
                return;
              }

              // Get the default value. We use slider min if there is no default.
              var default_value = parseFloat(($input.val() == '') ? sliderOptions.min : $input.val(), 10);
              // Set the element value in case we are using the slider min.
              $input.val(default_value);

              $input.parents(containing_parent).after(
                $('<div class="bef-slider"></div>').slider({
                  min: parseFloat(sliderOptions.min, 10),
                  max: parseFloat(sliderOptions.max, 10),
                  step: parseFloat(sliderOptions.step, 10),
                  animate: sliderOptions.animate ? sliderOptions.animate : false,
                  orientation: sliderOptions.orientation,
                  value: default_value,
                  // Update the textfields as the sliders are moved.
                  slide: function (event, ui) {
                    $input.val(ui.value);
                  },
                  // This fires when the value is set programmatically or the
                  // stop event fires.
                  // This takes care of the case that a user enters a value
                  // into the text field that is not a valid step of the slider.
                  // In that case the slider will go to the nearest step and
                  // this change event will update the text area.
                  change: function (event, ui) {
                    $input.val(ui.value);
                  },
                  // Attach stop listeners.
                  stop: function(event, ui) {
                    // Click the auto submit button.
                    $(this).parents('form').find('.ctools-auto-submit-click').click();
                  }
                })
              );

              // Update the slider when the field is updated.
              $input.blur(function() {
                befUpdateSlider($(this), null, sliderOptions);
              });
            }
            else {
              return;
            }
          })
        });
      }
    }
  };

  // This is only needed to provide ajax functionality
  Drupal.behaviors.better_exposed_filters_select_as_links = {
    attach: function(context, settings) {

      $('.bef-select-as-links', context).once(function() {
        var $element = $(this);

        // Check if ajax submission is enabled. If it's not enabled then we
        // don't need to attach our custom submission handling, because the
        // links are already properly built.

        // First check if any ajax views are contained in the current page.
        if (typeof settings.views == 'undefined' || typeof settings.views.ajaxViews == 'undefined') {
          return;
        }

        // Now check that the view for which the current filter block is used,
        // is part of the configured ajax views.
        var $uses_ajax = false;
        $.each(settings.views.ajaxViews, function(i, item) {
          var $view_name = item.view_name.replace(/_/g, '-');
          var $view_display_id = item.view_display_id.replace(/_/g, '-');
          var $id = 'views-exposed-form-' + $view_name + '-' + $view_display_id;
          var $form_id = $element.parents('form').attr('id');
          if ($form_id == $id) {
            $uses_ajax = true;
            return;
          }
        });

        // If no ajax is used for form submission, we quit here.
        if (!$uses_ajax) {
          return;
        }

        // Attach selection toggle and form submit on click to each link.
        $(this).find('a').click(function(event) {
          var $wrapper = $(this).parents('.bef-select-as-links');
          var $options = $wrapper.find('select option');
          // We have to prevent the page load triggered by the links.
          event.preventDefault();
          event.stopPropagation();
          // Un select if previously seleted toogle is selected.
          var link_text = $(this).text();
          removed = '';
          $($options).each(function(i) {
            if ($(this).attr('selected')) {
              if (link_text == $(this).text()) {
                removed = $(this).text();
                $(this).removeAttr('selected');
              }
            }
          });

          // Set the corresponding option inside the select element as selected.
          $selected = $options.filter(function() {
            return $(this).text() == link_text && removed != link_text;
          });
          $selected.attr('selected', 'selected');
          $wrapper.find('.bef-new-value').val($selected.val());
          $wrapper.find('.bef-new-value[value=""]').attr("disabled", "disabled");
          $(this).addClass('active');
          // Submit the form.
          $wrapper.parents('form').find('.views-submit-button *[type=submit]').click();
        });

        $('.bef-select-as-link').ready(function() {
          $('.bef-select-as-link').find('a').removeClass('active');
          $('.bef-new-value').each(function(i, val) {
            id = $(this).parent().find('select').attr('id') + '-' + $(this).val();
            $('#'+id).find('a').addClass('active');
          });
        });
      });
    }
  };

  Drupal.behaviors.betterExposedFiltersRequiredFilter = {
    attach: function(context, settings) {
      // Required checkboxes should re-check all inputs if a user un-checks
      // them all.
      $('.bef-select-as-checkboxes', context).once('bef-required-filter').ajaxComplete(function (e, xhr, s) {
        var $element = $(this);

        if (typeof settings.views == 'undefined' || typeof settings.views.ajaxViews == 'undefined') {
          return;
        }

        // Now check that the view for which the current filter block is used,
        // is part of the configured ajax views.
        var $view_name;
        var $view_display_id;
        var $uses_ajax = false;
        $.each(settings.views.ajaxViews, function(i, item) {
          $view_name = item.view_name;
          $view_display_id = item.view_display_id;
          var $id = 'views-exposed-form-' + $view_name.replace(/_/g, '-') + '-' + $view_display_id.replace(/_/g, '-');
          var $form_id = $element.parents('form').attr('id');
          if ($form_id == $id) {
            $uses_ajax = true;
            return false;
          }
        });

        //Check if we have any filters at all because of Views Selective Filter
        if($('input', this).length > 0) {
          var $filter_name = $('input', this).attr('name').slice(0, -2);
          if (Drupal.settings.better_exposed_filters.views[$view_name].displays[$view_display_id].filters[$filter_name].required && $('input:checked', this).length == 0) {
            $('input', this).prop('checked', true);
          }
        }
      });
    }
  }

  /*
   * Helper functions
   */

  /**
   * Adds/Removes the highlight class from the form-item div as appropriate
   */
  function _bef_highlight(elem, context) {
    $elem = $(elem, context);
    $elem.attr('checked')
      ? $elem.closest('.form-item', context).addClass('highlight')
      : $elem.closest('.form-item', context).removeClass('highlight');
  }

  /**
   * Update a slider when a related input element is changed.
   *
   * We don't need to check whether the new value is valid based on slider min,
   * max, and step because the slider will do that automatically and then we
   * update the textfield on the slider's change event.
   *
   * We still have to make sure that the min & max values of a range slider
   * don't pass each other though, however once this jQuery UI bug is fixed we
   * won't have to. - http://bugs.jqueryui.com/ticket/3762
   *
   * @param $el
   *   A jQuery object of the updated element.
   * @param valIndex
   *   The index of the value for a range slider or null for a non-range slider.
   * @param sliderOptions
   *   The options for the current slider.
   */
  function befUpdateSlider($el, valIndex, sliderOptions) {
    var val = parseFloat($el.val(), 10),
        currentMin = $el.parents('div.views-widget').next('.bef-slider').slider('values', 0),
        currentMax = $el.parents('div.views-widget').next('.bef-slider').slider('values', 1);
    // If we have a range slider.
    if (valIndex != null) {
      // Make sure the min is not more than the current max value.
      if (valIndex == 0 && val > currentMax) {
        val = currentMax;
      }
      // Make sure the max is not more than the current max value.
      if (valIndex == 1 && val < currentMin) {
        val = currentMin;
      }
      // If the number is invalid, go back to the last value.
      if (isNaN(val)) {
        val = $el.parents('div.views-widget').next('.bef-slider').slider('values', valIndex);
      }
    }
    else {
      // If the number is invalid, go back to the last value.
      if (isNaN(val)) {
        val = $el.parents('div.views-widget').next('.bef-slider').slider('value');
      }
    }
    // Make sure we are a number again.
    val = parseFloat(val, 10);
    // Set the slider to the new value.
    // The slider's change event will then update the textfield again so that
    // they both have the same value.
    if (valIndex != null) {
      $el.parents('div.views-widget').next('.bef-slider').slider('values', valIndex, val);
    }
    else {
      $el.parents('div.views-widget').next('.bef-slider').slider('value', val);
    }
  }

}) (jQuery);
;
(function ($) {
  Drupal.behaviors.ucOutOfStock =  {
    attach: function(context) {

      if(typeof console === "undefined") {
        console = {log: function() {}};
      };

      // Your code here
      attrid = 'edit-attributes';

      function checkStock(forms) {
        var form_ids = new Array();
        var node_ids = new Array();
        var attr_ids = new Array();
        $.each(forms, function(index, form) {
          var product = new Object();
          var attributes = new Object();

          var nid = form.attr('id').match(/(?:uc-product-add-to-cart-form-|catalog-buy-it-now-form-)([0-9]+)/)[1];

          attributes.found = new Object();
          attributes.value = new Object();

          $("[name*=attributes]", form).filter(':input:not(:text):not(:checkbox)').each(function(index){
            // We are assuming the value has to be there, seems to be working for radios and checkboxes
            id = $(this).attr('name').match(/attributes\[([0-9]*)\]/)[1];
            if ($(this).is(':radio')) {
              attributes.found['attr'+id] = 1;
              if ($(this).is(':checked')) {
                if ($(this).val()) {
                  attributes.value['attr'+id] = 1;
                  attr_ids.push(nid + ':' + id + ':' + $(this).val());
                }
              }
            }
            else if ($(this).is('select')) {
              attributes.found['attr'+id] = 1;
              if ($(this).val()) {
                attributes.value['attr'+id] = 1;
                attr_ids.push(nid + ':' + id + ':' + $(this).val());
              }
            }
          });

          // find qty
          product['qty'] = 1;
          qty = $(':input[name="qty"]', form).val()
          if (qty) {
            product['qty'] = qty;
          }

          // finding if attributes are found with no value
          attributes.found.length = attributes.value.length = 0;
          for (var i in attributes.found) {
            if (i!='length') {
              attributes.found.length++;
            }
          }

          for (var i in attributes.value) {
              if (i!='length') {
              attributes.value.length++;
            }
          }

          if (Drupal.settings.uc_out_of_stock.throbber) {
            $(".uc_out_of_stock_throbbing", form).addClass('uc_oos_throbbing');
          }
          form_ids.push(form.attr('id'));
          node_ids.push(nid);
        });

        if (form_ids.length == 0) {
          return;
        }

        var post = { 'form_ids[]': form_ids, 'node_ids[]': node_ids, 'attr_ids[]': attr_ids }
        $.ajax({
          type: 'post',
          url : Drupal.settings.uc_out_of_stock.path,
          data: post,
          success : function (data, textStatus) {
            $.each(data, function(form_id, stock_level) {
              var form = $('#' + form_id);
              if (stock_level != null && parseInt(stock_level) <= 0) {
                // hide add to cart button
                $("input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart", form).hide();
                // hide qty label, field and wrapper if present and if it follows
                // default theme output
                $("label[for=" + $(":input[name=qty]", form).attr('id') + "]", form).hide();
                $(":input[name=qty]", form).hide();
                $("#" + $(":input[name=qty]", form).attr('id') + "-wrapper", form).hide();
                // Show out of stock message
                $(".uc_out_of_stock_html", form).html(Drupal.settings.uc_out_of_stock.msg);

                if (Drupal.settings.uc_out_of_stock.instock) {
                  $(".uc-out-of-stock-instock", form).hide();
                }
              }
              else {
                // Put back the normal HTML of the add to cart form
                $(".uc_out_of_stock_html", form).html('');
                // show qty elements
                $("label[for=" + $(":input[name=qty]", form).attr('id') + "]", form).show();
                $(":input[name=qty]", form).show();
                $("#" + $(":input[name=qty]", form).attr('id') + "-wrapper", form).show();
                // show add to cart button
                $("input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart", form).show();
                if (Drupal.settings.uc_out_of_stock.instock) {
                  $(".uc-out-of-stock-instock", form).html(Drupal.theme('ucOutOfStockInStock', stock_level));
                  $(".uc-out-of-stock-instock", form).show();
                }
              }

              if (Drupal.settings.uc_out_of_stock.throbber) {
                $(".uc_out_of_stock_throbbing", form).removeClass('uc_oos_throbbing');
              }
            });
          },
          error : function (jqXHR, textStatus, errorThrown) {
            console.log('uc_out_of_stock: ' + textStatus + ': ' + jqXHR.responseText);
            if (Drupal.settings.uc_out_of_stock.throbber) {
              $(".uc_out_of_stock_throbbing").removeClass('uc_oos_throbbing');
            }
          },
          dataType: 'json'
        });
      }

      var forms = new Array();
      $("form[id*=uc-product-add-to-cart-form], form[id*=uc-catalog-buy-it-now-form]").not('.uc-out-stock-processed').each(function() {
        $(this).addClass('uc-out-stock-processed');
        forms.push($(this));
        if (Drupal.settings.uc_out_of_stock.throbber) {
          $("input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart", $(this)).before('<div class="uc_out_of_stock_throbbing">&nbsp;&nbsp;&nbsp;&nbsp;</div>');
        }

        if (Drupal.settings.uc_out_of_stock.instock) {
          if ($(':input[name="qty"][type!="hidden"]', $(this)).length) {
            $(":input[name=qty]", $(this)).after('<div class="uc-out-of-stock-instock"></div>');
          }
          else {
            $("input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart", $(this)).before('<div class="uc-out-of-stock-instock"></div>');
          }
        }

        $("input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart", $(this)).after('<div class="uc_out_of_stock_html"></div>');
        var form = $(this);

        $("[name*=attributes]", $(this)).filter(':input:not(:text):not(:checkbox)').change(function(){
          checkStock([form]);
        });
        /* TODO: Feature request - support qty field, would make sense if cart
         * contents are checked in the server as well as just stock
         */
        /*
        $(":input[name=qty]", $(this)).keyup(function(){
          checkStock(eachForm);
        });
        */
      });

      checkStock(forms);
    }
  }

  Drupal.theme.prototype.ucOutOfStockInStock = function (stock) {
    if (stock == undefined) {
      return Drupal.t('In stock');
    }
    else {
      return Drupal.t('@stock in stock', {'@stock' : stock});
    }
  };
})(jQuery);
;
/**
 * @file
 *
 * Fivestar AJAX for updating fivestar widgets.
 */

/**
 * Create a degradeable star rating interface out of a simple form structure.
 */
(function($){ // Create local scope.

Drupal.ajax.prototype.commands.fivestarUpdate = function (ajax, response, status) {
  response.selector = $('.fivestar-form-item', ajax.element.form);
  ajax.commands.insert(ajax, response, status);
};

})(jQuery);
;
(function ($) {
  Drupal.behaviors.newsletter = {
    attach: function (context, settings) {
      $("input[name='email']", context).click(function () {
          if ($(this).val() == Drupal.t('user@example.com')) {
            $(this).val('');
          }
      });
      $("input[name='email']", context).blur(function () {
        if ($(this).val() == '') {
          $(this).val(Drupal.t('user@example.com'));
        }
      });
    },

    subscribeForm: function(data) {
      $.each(Drupal.settings.exposed, function(e,i) {
        if (!$('#edit-field-newsletter-list-' + Drupal.settings.lang + '-' + i).attr('checked')) {
          $('.form-item-exposed-' + i).hide();
        }

        $('#edit-field-newsletter-list-' + Drupal.settings.lang + '-' + i).click(function () {
          $('.form-item-exposed-' + i).toggle();
        });
      });
    }
  };
})(jQuery);
;
/**
 * @file
 *
 * Fivestar JavaScript behaviors integration.
 */

/**
 * Create a degradeable star rating interface out of a simple form structure.
 *
 * Originally based on the Star Rating jQuery plugin by Wil Stuckey:
 * http://sandbox.wilstuckey.com/jquery-ratings/
 */
(function($){ // Create local scope.

Drupal.behaviors.fivestar = {
  attach: function (context) {
    $(context).find('div.fivestar-form-item').once('fivestar', function() {
      var $this = $(this);
      var $container = $('<div class="fivestar-widget clearfix"></div>');
      var $select = $('select', $this);

      // Setup the cancel button
      var $cancel = $('option[value="0"]', $this);
      if ($cancel.length) {
        $('<div class="cancel"><a href="#0" title="' + $cancel.text() + '">' + $cancel.text() + '</a></div>')
          .appendTo($container);
      }

      // Setup the rating buttons
      var $options = $('option', $this).not('[value="-"], [value="0"]');
      var index = -1;
      $options.each(function(i, element) {
        var classes = 'star-' + (i+1);
        classes += (i + 1) % 2 == 0 ? ' even' : ' odd';
        classes += i == 0 ? ' star-first' : '';
        classes += i + 1 == $options.length ? ' star-last' : '';
        $('<div class="star"><a href="#' + element.value + '" title="' + element.text + '">' + element.text + '</a></div>')
          .addClass(classes)
          .appendTo($container);
        if (element.value == $select.val()) {
          index = i + 1;
        }
      });

      if (index != -1) {
        $container.find('.star').slice(0, index).addClass('on');
      }
      $container.addClass('fivestar-widget-' + ($options.length));
      $container.find('a')
        .bind('click', $this, Drupal.behaviors.fivestar.rate)
        .bind('mouseover', $this, Drupal.behaviors.fivestar.hover);

      $container.bind('mouseover mouseout', $this, Drupal.behaviors.fivestar.hover);

      // Attach the new widget and hide the existing widget.
      $select.after($container).css('display', 'none');

      // Allow other modules to modify the widget.
      Drupal.attachBehaviors($this);
    });
  },
  rate: function(event) {
    var $this = $(this);
    var $widget = event.data;
    var value = this.hash.replace('#', '');
    $('select', $widget).val(value).change();
    var $this_star = (value == 0) ? $this.parent().parent().find('.star') : $this.closest('.star');
    $this_star.prevAll('.star').andSelf().addClass('on');
    $this_star.nextAll('.star').removeClass('on');
    if(value==0){
      $this_star.removeClass('on');
    }

    event.preventDefault();
  },
  hover: function(event) {
    var $this = $(this);
    var $widget = event.data;
    var $target = $(event.target);
    var $stars = $('.star', $this);

    if (event.type == 'mouseover') {
      var index = $stars.index($target.parent());
      $stars.each(function(i, element) {
        if (i <= index) {
          $(element).addClass('hover');
        } else {
          $(element).removeClass('hover');
        }
      });
    } else {
      $stars.removeClass('hover');
    }
  }
};

})(jQuery);
;
