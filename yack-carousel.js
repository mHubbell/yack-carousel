/**
 * 
 */
(function($) {

    /**
     * Defaults
     */
    var defaults = {
            breakpoints:null
    };

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
        // hide until resized
        $(this.element).hide();
        // extract elements
        this.$yackWindow = $(this.element).find('.yack-window');
        this.$yackWindow.css('overflow','hidden');
        this.$items = this.$yackWindow.find('.yack-item');
        this.$yackWrapper = $('<div class="yack-wrapper"></div>');
        this.$yackWindow.append(this.$yackWrapper);
        // init internals
        this._nativeItemWidth = 0;
        this._nativeItemHeight = 0;
        this.itemWrappers = [];
        // add each element to a wrapper
        var plugin = this;
        if (this.$items) {
            this.$items.each(function(){
                plugin.$yackWrapper.append($(this));
                $(this).wrap('<div class="yack-item-wrapper"></div>');
            });
            // get the native dimensions of the items
            // going to assume the first one is good enough for now
            var $firstItem = this.$items.first();
            this._nativeItemWidth = $firstItem.width();
            this._nativeItemHeight = $firstItem.height();
        }
        // listen for resize to adjust
        $(window).on('resize.yack-carousel',function(){
            plugin.resize();
        })
        // run resize to initialize sizing
        this.resize();
        // show now that we are looking good.
        $(this.element).show();
    };
    
    /**
     * Resize the individual items and their wrapper based on the current breakpoint
     */
    YackCarousel.prototype.resize = function() {
        var breakpoint = this._getBreakpointForWidth();
        // only do things if we are at a different breakpoint
        if (breakpoint !== this._currentBreakpoint) {
            var itemWidth = breakpoint.itemWidth ? breakpoint.itemWidth : this._nativeItemWidth;
            var itemHeight = breakpoint.itemHeight ? breakpoint.itemHeight : this._nativeItemHeight;
            var totalItemWidth = 0;
            this.$yackWrapper.children().each(function(){
                $(this).width(itemWidth);
                $(this).height(itemHeight);
                totalItemWidth += itemWidth;
            });
            this.$yackWrapper.width(totalItemWidth);
            this.$yackWrapper.height(itemHeight);
            this._currentBreakpoint = breakpoint;
        }
    };
    
    /**
     * Destroy
     */
    YackCarousel.prototype.destroy = function() {
        $(window).off('resize.yack-carousel');
    };
    
    /**
     * @"private"
     * Return the correct breakpoint for the current browser width.
     * It is currently on the user of the plugin to make sure values in min and max
     * do not collide.
     */
    YackCarousel.prototype._getBreakpointForWidth = function(){
        var windowWidth = $(window).width();
        var returnBreakpoint  = null;
        if(this.options.breakpoints && this.options.breakpoints.length){
            var plugin = this;
            this.options.breakpoints.forEach(function(element, index){
                var maxWidth = element.max ? element.max : 10000000;
                var minWidth = element.min ? element.min : 0;
                if(windowWidth < maxWidth && windowWidth > minWidth) {
                    return returnBreakpoint = element;
                }
            });
        } else {
            if(!this._defaultBreakpoint){
                this._defaultBreakpoint = {};
            }
            returnBreakpoint = this._defaultBreakpoint;
        }
        return returnBreakpoint;
    }

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