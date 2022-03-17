(function ($) {
$(document).ready(function(){
    //slider-zoom
    $('#glasscase').glassCase({ 'thumbsPosition': 'left', 'zoomPosition': 'inner' });
    //end slider-zoom
      var textarea = document.querySelector('.add-rate-main textarea');
      if(textarea) {
      textarea.addEventListener('keydown', autosize);
    }
      function autosize() {
        var el = this;
        setTimeout(function () {
         el.style.cssText = 'height:auto; padding:0';
         el.style.cssText = 'height:' + el.scrollHeight + 'px';
      }, 0);
    }
  });
})(jQuery);