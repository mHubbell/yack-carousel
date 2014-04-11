/**
 * 
 */
(function($) {

    /**
     * Defaults
     */
    var defaults = {
            breakpoints:null,
            pagination:false
    },
    pageCount = 0,
    currentPage = 1;

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
        // extract elements
        this.$yackWindow = $(this.element).find('.yack-window');
        this.$yackWindow.css('overflow','hidden');
        this.$yackWindow.css('position','relative');
        this.$items = this.$yackWindow.find('.yack-item');
        this.$yackWrapper = $('<div class="yack-wrapper"></div>');
        this.$yackWrapper.css('position','absolute');
        this.$yackWindow.append(this.$yackWrapper);
        // init internals
        this._nativeItemWidth = 0;
        this._nativeItemHeight = 0;
        this.itemWrappers = [];
        var plugin = this;
        if (this.$items) {
            // wrap each element
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
        $(window).on('resize.yack-carousel', 
                $.debounce( 250, function(){ 
                    plugin.resize();
                }));
        // listen for swipes to go next and previous
        this.$yackWindow.swipe({
            swipe:function(event,direction) {
                if(direction == 'left') {
                    plugin.nextPage();
                } else {
                    plugin.prevPage();
                }
            },
            excludedElements:[]
        });
        // run resize to initialize sizing
        this.resize();
    };
    
    /**
     * Resize the individual items and their wrapper based on the current breakpoint
     * and recalculate pagination
     */
    YackCarousel.prototype.resize = function() {
        // if the element is display none we cant resize
        if($(this.element).css('display') == 'none') {
            return;
        }
        var breakpoint = this._getBreakpointForWidth();
        // only resize things if we are at a different breakpoint
        if (breakpoint !== this._currentBreakpoint) {
            // set current breakpoint
            this._currentBreakpoint = breakpoint;
            // get value for width and height from breakpoint
            this.itemWidth = breakpoint.itemWidth ? breakpoint.itemWidth : this._nativeItemWidth;
            this.itemHeight = breakpoint.itemHeight ? breakpoint.itemHeight : this._nativeItemHeight;
            this.totalItemWidth = 0;
            // set and total item dimensions
            var plugin = this;
            this.$yackWrapper.children().each(function(){
                $(this).width(plugin.itemWidth);
                $(this).height(plugin.itemHeight);
                plugin.totalItemWidth += plugin.itemWidth;
            });
            // set wrapper / window dimensions and reset position
            this.$yackWrapper.width(this.totalItemWidth);
            this.$yackWrapper.height(this.itemHeight);
            this.$yackWindow.height(this.itemHeight);
        }
        // show now that we are looking good.
        //$(this.element).show();
        // measure window
        this.windowWidth = this.$yackWindow.width();
        // store and generate pagination info
        this.fitsOnPage = Math.floor(this.windowWidth / this.itemWidth);
        var pCount = Math.ceil(this.totalItemWidth / (this.itemWidth * this.fitsOnPage));
        if(pCount !== this.pageCount && this.options.pagination) {
            this.pageCount = pCount;
            this._generatePagination();
            // go to page 1
            this.gotoPage(1);
        }
    };
    
    /**
     * Go to a given page
     * @param page
     */
    YackCarousel.prototype.gotoPage = function(page) {
        if(page != this.currentPage) {
            // set current page
            this.currentPage = page;
            // reset active pager
            if (this.options.pagination) {
                this.$paginationWrapper.children().each(function(){
                    $(this).removeClass('active');
                    if($(this).data('yack-page') == page){
                        $(this).addClass('active');
                    }
                });
            }
            // determine target x position for wrapper
            var xVal = 0;
            var windowWidth = this.$yackWindow.width();
            this.$yackWindow.removeClass('yack-page-first yack-page-last yack-page-middle');
            if(page === this.pageCount && this.pageCount > 1) {
                xVal = (this.totalItemWidth - windowWidth) * -1;
                if(this.pageCount > 1) {
                    this.$yackWindow.addClass('yack-page-last');
                }
            } else if(page > 1 && page < this.pageCount){
                xVal = ((this.fitsOnPage * this.itemWidth) * (page - 1)) * -1;
                this.$yackWindow.addClass('yack-page-middle');
            } else {
                xVal = 0;
                if(this.pageCount > 1) {
                    this.$yackWindow.addClass('yack-page-first');
                }
            }
            // animate it there
            this.$yackWrapper.animate({left:xVal},"fast");
        }
    };
    
    /**
     * Go to the next page
     */
    YackCarousel.prototype.nextPage = function() {
        if(this.currentPage < this.pageCount) {
            this.gotoPage(this.currentPage + 1);
        }
    }
    
    /**
     * Go to the previous page
     */
    YackCarousel.prototype.prevPage = function() {
        if(this.currentPage > 1) {
            this.gotoPage(this.currentPage - 1);
        }
    }
    
    /**
     * Destroy
     */
    YackCarousel.prototype.destroy = function() {
        $(window).off('resize.yack-carousel');
        this.$paginationWrapper.off('click');
        this.$yackWindow.swipe("destroy");
    };
    
    /**
     * @"private"
     * Return the correct breakpoint for the current browser width.
     * It is currently on the user of the plugin to make sure values in min and max
     * do not collide and dont have gaps.
     */
    YackCarousel.prototype._getBreakpointForWidth = function(){
        var windowWidth = $(window).width();
        var returnBreakpoint  = null;
        if(this.options.breakpoints && this.options.breakpoints.length){
            var plugin = this;
            this.options.breakpoints.forEach(function(element, index){
                var maxWidth = element.max ? element.max : 10000000;
                var minWidth = element.min ? element.min : 0;
                if(windowWidth <= maxWidth && windowWidth >= minWidth) {
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
    };
    
    /**
     * @"private"
     * Generate pagination elements for the current page count
     */
    YackCarousel.prototype._generatePagination = function() {
        // generate wrapper
        if(!this.$paginationWrapper) {
            this.$paginationWrapper = $('<div class="yack-pagination"></div>');
            $(this.element).append(this.$paginationWrapper);
            // listen for clicks on pagers
            var plugin = this;
            this.$paginationWrapper.on('click','.yack-pagination-page',function(){
                plugin.gotoPage($(this).data('yack-page'));
            })
        }
        // create pager buttons
        this.$paginationWrapper.empty();
        var totalPagerWidth = 0;
        if(this.pageCount > 1) {
            for(var i = 0; i < this.pageCount; i++) {
                var $pager = $('<span class="yack-pagination-page"></span>');
                $pager.data('yack-page',i + 1);
                if(i + 1 == this.currentPage) {
                    $pager.addClass('active');
                }
                this.$paginationWrapper.append($pager);
            }
            // resize wrapper
            this.$paginationWrapper.children().each(function(){
                totalPagerWidth += $(this).outerWidth(true);
            }); 
        } 
        this.$paginationWrapper.width(totalPagerWidth);
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