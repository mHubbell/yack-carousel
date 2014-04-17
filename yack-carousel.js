/**
 * 
 */
(function($) {

    /**
     * Defaults
     */
    var defaults = {
            breakpoints:null,
            pagination:false,
            paddles:false,
            allowSlivers:false,
            allowHalfs:false,
            maintainAspectRatio:false,
            debounceDelay:500,
            pageAnimationSpeed:"fast",
            swipable:true
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
                $.debounce( plugin.options.debounceDelay, function(){ 
                    plugin.resize();
                }));
        // use hammer to listen for swipes
        if(this.options.swipable){
            this.hammer = Hammer(this.$yackWindow.get(0));
            this.hammer.on("swipeleft",function(){
                plugin.nextPage();
            });
            this.hammer.on("swiperight",function(){
                plugin.prevPage();
            }); 
        }
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
            if(this.options.allowSlivers) {
                // if we allow slivers we can size the items based on the breakpoint directly
                // and only on breakpoint change
                this.itemWidth = breakpoint.itemWidth ? breakpoint.itemWidth : this._nativeItemWidth;
                this.itemHeight = breakpoint.itemHeight ? breakpoint.itemHeight : this._nativeItemHeight;
                this._sizeItemsAndWrapper();
            } else {
                // otherwise we keep track the width and height as a "preferred" size
                // but will adjust for the exact width of items below
                this.preferredItemWidth = breakpoint.itemWidth ? breakpoint.itemWidth : this._nativeItemWidth;
                this.preferredItemHeight = breakpoint.itemHeight ? breakpoint.itemHeight : this._nativeItemHeight;
            }  
        }
        // measure window
        this.windowWidth = this.$yackWindow.width();
        // if we dont allow slivers we need to adjust the width and height of items
        if(!this.options.allowSlivers) {
            // based our measurements on chunks so that we can support visible halfs
            var preferredChunkWidth = this.options.allowHalfs ? (this.preferredItemWidth / 2): this.preferredItemWidth;  
            var chunksFit = Math.floor(this.windowWidth / preferredChunkWidth);
            if(chunksFit < 1) {
                chunksFit = 1;
            }
            // if the leftover sliver is more than half a chunk, we add another chunk
            var diff = (this.windowWidth / preferredChunkWidth) - chunksFit;
            if (diff > .5) {
                chunksFit += 1;
            }
            // recalculate width and height
            this.itemWidth = this.options.allowHalfs ? 
                    Math.floor( this.windowWidth / chunksFit ) * 2 :
                        Math.floor( this.windowWidth / chunksFit );
            // TODO:: MATH to maintain non-square aspect ratios...
            this.itemHeight = this.options.maintainAspectRatio ?
                    this.itemWidth :
                        this.preferredItemHeight;
            this._sizeItemsAndWrapper();
        }
        // store and generate pagination info
        this.fitsOnPage = Math.floor(this.windowWidth / this.itemWidth);
        if(this.fitsOnPage < 1){
            this.fitsOnPage = 1;
        }
        var pCount = Math.ceil(this.totalItemWidth / (this.itemWidth * this.fitsOnPage));
        if(pCount !== this.pageCount && this.options.pagination) {
            this.pageCount = pCount;
            // create paginator elements if we paginate
            if(this.options.pagination || this.options.paddles) {
                this._generatePagination();
            }
            // go to page 1 on page count change
            this.gotoPage(1);
        } else {
            // go to the current page
            this.gotoPage(this.currentPage);
        }
    };
    
    /**
     * Go to a given page
     * @param page
     */
    YackCarousel.prototype.gotoPage = function(page) {
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
        this.$yackWrapper.animate({left:xVal},this.options.pageAnimationSpeed);
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
        this.$paddleNext.off('click');
        this.$paddlePrev.off('click');
        this.$paginationWrapper.off('click');
        if(this.options.swipable){
            this.hammer.off("swipeleft");
            this.hammer.off("swiperight");
        }
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
        // plugin reference
        var plugin = this;
        // generate paginator dots
        if(this.options.pagination) {
            // generate wrapper
            if(!this.$paginationWrapper) {
                this.$paginationWrapper = $('<div class="yack-pagination"></div>');
                $(this.element).append(this.$paginationWrapper);
                // listen for clicks on pagers
                
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
        }
        // add paddle elements
        if(this.options.paddles) {
            if(!this.$paddleNext) {
                this.$paddleNext = $('<div class="yack-paddle yack-paddle-next"></div>');
                $(this.element).append(this.$paddleNext);
                this.$paddleNext.on('click',function(){
                    plugin.nextPage();
                });
            }
            if(!this.$paddlePrev) {
                this.$paddlePrev = $('<div class="yack-paddle yack-paddle-prev"></div>');
                $(this.element).append(this.$paddlePrev);
                this.$paddlePrev.on('click',function(){
                    plugin.prevPage();
                });
            }
        }
        
    };
    
    /**
     * Size the items and the wrapper based on the determined item width and height
     */
    YackCarousel.prototype._sizeItemsAndWrapper = function() {
        this.totalItemWidth = 0;
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