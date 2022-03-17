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
