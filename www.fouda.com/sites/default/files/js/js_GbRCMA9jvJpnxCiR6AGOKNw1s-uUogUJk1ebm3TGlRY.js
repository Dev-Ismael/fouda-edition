(function($) {

/**
 * jQuery debugging helper.
 *
 * Invented for Dreditor.
 *
 * @usage
 *   $.debug(var [, name]);
 *   $variable.debug( [name] );
 */
jQuery.extend({
  debug: function () {
    // Setup debug storage in global window. We want to look into it.
    window.debug = window.debug || [];

    args = jQuery.makeArray(arguments);
    // Determine data source; this is an object for $variable.debug().
    // Also determine the identifier to store data with.
    if (typeof this == 'object') {
      var name = (args.length ? args[0] : window.debug.length);
      var data = this;
    }
    else {
      var name = (args.length > 1 ? args.pop() : window.debug.length);
      var data = args[0];
    }
    // Store data.
    window.debug[name] = data;
    // Dump data into Firebug console.
    if (typeof console != 'undefined') {
      console.log(name, data);
    }
    return this;
  }
});
// @todo Is this the right way?
jQuery.fn.debug = jQuery.debug;

})(jQuery);
;
function myModule_ajax_load() {
  console.log('load Function'); 
  jQuery.ajax({

         //url: Drupal.settings.basePath + '/views/ajax',
        url: '/views/ajax',
        type: 'post',
        data: {
          view_name: 'fp_cart_blocks',
          view_display_id: 'page', //your display id
          //view_args: VIEW_ARGUMENT_HERE, // your views argument(s)
        },
        dataType: 'json',
        success: function (response) {
          if (response[1] !== undefined) {
           // console.log(response[1].data); 
            console.log('sucsessssss'); 
             // do something with the view
            //  document.getElementById("ajax-target").value= '22222222222222222222222222';
            // document.getElementById("ajax-target").value = response[1].data;
            // jQuery("#ajax-target").val(response[1].data);
            jQuery('div#cart-ajax-target').html(response[1].data);
          }
         else
         console.log('else'); 
        }        
      }); 
     console.log('Finshed load Function'); 
    //   console.log(x);
    // document.getElementById("ajax-target").value = "aaaaaaaa";
//   jQuery("#ajax-target").val('SSSSSSSSSSSSS');
// jQuery("#ajax-target").load("/node/get/ajax/11");

}
;
