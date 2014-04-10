/**
 * 
 */
(function($) {

    /**
     * Defaults
     */
    var defaults = {};

    /**
     * Constructor
     */
    function YackCarousel(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this.init();
    }

    /**
     * Init
     */
    YackCarousel.prototype.init = function() {

    };
    
    /**
     * Destroy
     */
    YackCarousel.prototype.destroy = function() {

    };

    /**
     * Add to jquery
     */
    $.fn.yackCarousel = function(options) {
        return this.each(function() {
            if (!$.data(this, 'mh_yackCarousel')) {
                $.data(this, 'mh_yackCarousel', new YackCarousel(this,options));
            }
        });
    };

})(jQuery);