// Trick to make exposed block work after refresh (https://drupal.org/node/2182885).
jQuery.fn.attachBehaviors = function () { Drupal.attachBehaviors(); };
;

(function($) {

/**
 * Drupal FieldGroup object.
 */
Drupal.FieldGroup = Drupal.FieldGroup || {};
Drupal.FieldGroup.Effects = Drupal.FieldGroup.Effects || {};
Drupal.FieldGroup.groupWithfocus = null;

Drupal.FieldGroup.setGroupWithfocus = function(element) {
  element.css({display: 'block'});
  Drupal.FieldGroup.groupWithfocus = element;
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processFieldset = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.fieldset', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $('legend span.fieldset-legend', $(this)).eq(0).append(' ').append($('.form-required').eq(0).clone());
        }
        if ($('.error', $(this)).length) {
          $('legend span.fieldset-legend', $(this)).eq(0).addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processAccordion = {
  execute: function (context, settings, type) {
    $('div.field-group-accordion-wrapper', context).once('fieldgroup-effects', function () {
      var wrapper = $(this);

      // Get the index to set active.
      var active_index = false;
      wrapper.find('.accordion-item').each(function(i) {
        if ($(this).hasClass('field-group-accordion-active')) {
          active_index = i;
        }
      });

      wrapper.accordion({
        heightStyle: "content",
        active: active_index,
        collapsible: true,
        changestart: function(event, ui) {
          if ($(this).hasClass('effect-none')) {
            ui.options.animated = false;
          }
          else {
            ui.options.animated = 'slide';
          }
        }
      });

      if (type == 'form') {

        var $firstErrorItem = false;

        // Add required fields mark to any element containing required fields
        wrapper.find('div.field-group-accordion-item').each(function(i) {

          if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
            $('h3.ui-accordion-header a').eq(i).append(' ').append($('.form-required').eq(0).clone());
          }
          if ($('.error', $(this)).length) {
            // Save first error item, for focussing it.
            if (!$firstErrorItem) {
              $firstErrorItem = $(this).parent().accordion("activate" , i);
            }
            $('h3.ui-accordion-header').eq(i).addClass('error');
          }
        });

        // Save first error item, for focussing it.
        if (!$firstErrorItem) {
          $('.ui-accordion-content-active', $firstErrorItem).css({height: 'auto', width: 'auto', display: 'block'});
        }

      }
    });
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processHtabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any element containing required fields
      $('fieldset.horizontal-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('horizontalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('horizontalTab').link.parent().addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
          $(this).data('horizontalTab').focus();
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processTabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {

      var errorFocussed = false;

      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.vertical-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('verticalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('verticalTab').link.parent().addClass('error');
          // Focus the first tab with error.
          if (!errorFocussed) {
            Drupal.FieldGroup.setGroupWithfocus($(this));
            $(this).data('verticalTab').focus();
            errorFocussed = true;
          }
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 *
 * TODO clean this up meaning check if this is really
 *      necessary.
 */
Drupal.FieldGroup.Effects.processDiv = {
  execute: function (context, settings, type) {

    $('div.collapsible', context).once('fieldgroup-effects', function() {
      var $wrapper = $(this);

      // Turn the legend into a clickable link, but retain span.field-group-format-toggler
      // for CSS positioning.

      var $toggler = $('span.field-group-format-toggler:first', $wrapper);
      var $link = $('<a class="field-group-format-title" href="#"></a>');
      $link.prepend($toggler.contents());

      // Add required field markers if needed
      if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
        $link.append(' ').append($('.form-required').eq(0).clone());
      }

      $link.appendTo($toggler);

      // .wrapInner() does not retain bound events.
      $link.click(function () {
        var wrapper = $wrapper.get(0);
        // Don't animate multiple times.
        if (!wrapper.animating) {
          wrapper.animating = true;
          var speed = $wrapper.hasClass('speed-fast') ? 300 : 1000;
          if ($wrapper.hasClass('effect-none') && $wrapper.hasClass('speed-none')) {
            $('> .field-group-format-wrapper', wrapper).toggle();
          }
          else if ($wrapper.hasClass('effect-blind')) {
            $('> .field-group-format-wrapper', wrapper).toggle('blind', {}, speed);
          }
          else {
            $('> .field-group-format-wrapper', wrapper).toggle(speed);
          }
          wrapper.animating = false;
        }
        $wrapper.toggleClass('collapsed');
        return false;
      });

    });
  }
};

/**
 * Behaviors.
 */
Drupal.behaviors.fieldGroup = {
  attach: function (context, settings) {
    settings.field_group = settings.field_group || Drupal.settings.field_group;
    if (settings.field_group == undefined) {
      return;
    }

    // Execute all of them.
    $.each(Drupal.FieldGroup.Effects, function (func) {
      // We check for a wrapper function in Drupal.field_group as
      // alternative for dynamic string function calls.
      var type = func.toLowerCase().replace("process", "");
      if (settings.field_group[type] != undefined && $.isFunction(this.execute)) {
        this.execute(context, settings, settings.field_group[type]);
      }
    });

    // Fixes css for fieldgroups under vertical tabs.
    $('.fieldset-wrapper .fieldset > legend').css({display: 'block'});
    $('.vertical-tabs fieldset.fieldset').addClass('default-fallback');

    // Add a new ID to each fieldset.
    $('.group-wrapper .horizontal-tabs-panes > fieldset', context).once('group-wrapper-panes-processed', function() {
      // Tats bad, but we have to keep the actual id to prevent layouts to break.
      var fieldgroupID = 'field_group-' + $(this).attr('id');
      $(this).attr('id', fieldgroupID);
    });
    // Set the hash in url to remember last userselection.
    $('.group-wrapper ul li').once('group-wrapper-ul-processed', function() {
      var fieldGroupNavigationListIndex = $(this).index();
      $(this).children('a').click(function() {
        var fieldset = $('.group-wrapper fieldset').get(fieldGroupNavigationListIndex);
        // Grab the first id, holding the wanted hashurl.
        var hashUrl = $(fieldset).attr('id').replace(/^field_group-/, '').split(' ')[0];
        window.location.hash = hashUrl;
      });
    });

  }
};

})(jQuery);
;
/*global Drupal: false, jQuery: false */
/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */
(function ($) {
  "use strict";

  /**
   * Provide the HTML to create the modal dialog.
   * Clone of function Drupal.theme.prototype.CToolsModalDialog.
   */
  Drupal.theme.prototype.HybridAuthModalDialog = function () {
    var html = '';
    html += '  <div id="ctools-modal">';
    html += '    <div id="hybridauth-modal">';
    html += '      <div class="ctools-modal-content">';
    html += '        <div class="modal-header">';
    html += '          <a class="close" href="#">';
    html += Drupal.CTools.Modal.currentSettings.closeText + Drupal.CTools.Modal.currentSettings.closeImage;
    html += '          </a>';
    html += '          <span id="modal-title" class="modal-title"></span>';
    html += '        </div>';
    html += '        <div id="modal-content" class="modal-content">';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';

    return html;
  };

})(jQuery);
;
/*global Drupal: false, jQuery: false */
/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */
(function ($) {
  "use strict";

  Drupal.behaviors.hybridauth_onclick = {};
  Drupal.behaviors.hybridauth_onclick.attach = function(context, settings) {
    $('.hybridauth-widget-provider', context).each(function() {
      // $(this).attr('href', $(this).attr('data-hybridauth-url'));
      this.href = $(this).attr('data-hybridauth-url');
    });
    $('.hybridauth-onclick-current:not(.hybridauth-onclick-processed)', context).addClass('hybridauth-onclick-processed').bind('click', function() {
      $(this).parents('.hybridauth-widget').after('<div>' + Drupal.t('Contacting @title...', {'@title': this.title}) + '</div>');
    });
    $('.hybridauth-onclick-popup:not(.hybridauth-onclick-processed)', context).addClass('hybridauth-onclick-processed').bind('click', function() {
      var width = $(this).attr('data-hybridauth-width'), height = $(this).attr('data-hybridauth-height');
      var popup_window = window.open(
        this.href,
        'hybridauth',
        'location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,titlebar=yes,toolbar=no,channelmode=yes,fullscreen=yes,width=' + width + ',height=' + height
      );
      popup_window.focus();
      return false;
    });

    // Last used provider feature.
    var last_provider = $.cookie('hybridauth_last_provider');
    if (last_provider != null) {
      $('[data-hybridauth-provider="' + last_provider + '"]', context).addClass('hybridauth-last-provider');
    }
    $('.hybridauth-widget-provider:not(.hybridauth-provider-processed)', context).addClass('hybridauth-provider-processed').bind('click', function() {
      $.cookie('hybridauth_last_provider', $(this).attr('data-hybridauth-provider'), {expires: 30, path: '/'});
    });
  };

})(jQuery);
;
(function ($) {

  Drupal.loadBlockOnAjax = function () {

    $('.load-block-on-ajax-wrapper h2').click(function () {
      if (!$(this).parent().hasClass('load-block-active-wrapper')) {
        $(this).parent().addClass('load-block-active-wrapper');
        $(this).parent().find('.load-on-ajax-img-text-center').show();
        $(this).parent().find('h2').addClass('load-block-on-ajax-wrapper-minus');
        var load_on_ajax_div_id = $(this).parent().find('div[id^=load-block-on-ajax-]').attr('id');
        var block_id = load_on_ajax_div_id.replace('load-block-on-ajax-', '');
        block_id = block_id.replace('-ajax-content', '');

        $.ajax({
          url: Drupal.settings.basePath + 'load-block-on-ajax/' + block_id + '?path=' + Drupal.settings.load_block_on_ajax_path,
          type: 'GET',
          dataType: 'json',
          cache: false,
          success: function (data) {
            var context = $('#load-block-on-ajax-' + block_id + '-ajax-content');
            Drupal.detachBehaviors(context);
            context.html(data['content']);
            if (data['ajaxblocks_settings']) {
              $.extend(true, Drupal.settings, data['ajaxblocks_settings']);
            }
            Drupal.attachBehaviors(context);
          }
        });
      } else {
        $(this).parent().find('.load-on-ajax-text-center').toggle();
        $(this).parent().find('h2').toggleClass('load-block-on-ajax-wrapper-minus');
      }
    });
  };

  $(document).ready(function () {
    Drupal.loadBlockOnAjax();
  });

})(jQuery);
;
