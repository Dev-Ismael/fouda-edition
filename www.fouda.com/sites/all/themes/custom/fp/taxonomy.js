(function ($) {
    $(document).ready(function() { 

    $('.fillter-toggle').click(function() {
    $( '.fillter-main' ).toggleClass('open-fillter');
    $( this ).toggleClass('colse-btn');
    });
    });
}(jQuery));