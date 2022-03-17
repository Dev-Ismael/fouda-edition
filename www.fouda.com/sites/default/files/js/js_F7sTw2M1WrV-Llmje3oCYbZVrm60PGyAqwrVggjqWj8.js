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
