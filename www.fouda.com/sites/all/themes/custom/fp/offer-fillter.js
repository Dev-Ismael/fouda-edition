$(document).ready(function() {
    $( ".more-less-btn" ).click(function() {
      $( '.fillter-links' ).toggleClass( "height-normal");
      $(".less").toggle();
      $(".more").toggle();
    });
  });