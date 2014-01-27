/*
* adapt-contrib-narrative
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>, Daryl Heldey <darylhedley@hotmail.com>
*/
define(function(require) {

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");

    var Narrative = ComponentView.extend({
            
        animateSliderToIndex: function(itemIndex) {
            var extraMargin = parseInt(this.$('.narrative-slider-graphic').css('margin-right')),
                movementSize = this.$('.narrative-slide-container').width()+extraMargin,
                strapLineSize = this.$('.narrative-strapline-title').width();
            
            this.$('.narrative-slider').stop().animate({'margin-left': -(movementSize * itemIndex)});
            this.$('.narrative-strapline-header-inner').stop(true, true).animate({'margin-left': -(strapLineSize * itemIndex)});
        },
        
        calculateWidths: function() {
            var slideWidth = this.$('.narrative-slide-container').width();
            var slideCount = this.model.get('_itemCount');
            var marginRight = this.$('.narrative-slider-graphic').css('margin-right');
            var extraMargin = marginRight === "" ? 0 : parseInt(marginRight);
            var fullSlideWidth = (slideWidth + extraMargin) * slideCount;

            this.$('.narrative-slider-graphic').width(slideWidth)
            this.$('.narrative-strapline-header').width(slideWidth);
            this.$('.narrative-strapline-title').width(slideWidth);

            this.$('.narrative-slider').width(fullSlideWidth);
            this.$('.narrative-strapline-header-inner').width(fullSlideWidth);

            var stage = this.model.get('_stage');
            var margin = -(stage * slideWidth);

            this.$('.narrative-slider').css('margin-left', margin);

            this.model.set('_finalItemLeft', fullSlideWidth - slideWidth);
        },

        closePopup: function (event) {
            event.preventDefault();
            this.model.set('_active', true);

            this.$('.narrative-popup-close').blur();
            this.$('.narrative-popup').addClass('narrative-hidden');
            
            this.evaluateCompletion();
        },
        
        constrainStage: function(stage) {
            if (stage > this.model.get('items').length - 1) {
                stage = this.model.get('items').length - 1;
            } else if (stage < 0) {
                stage = 0;
            }
            return stage;
        },
        
        constrainXPosition: function(previousLeft, newLeft, deltaX) {
            if (newLeft > 0 && deltaX > 0) {
                newLeft = previousLeft + (deltaX / (newLeft * 0.1));
            }
            var finalItemLeft = this.model.get('_finalItemLeft'); 
            if (newLeft < -finalItemLeft && deltaX < 0) {
                var distance = Math.abs(newLeft + finalItemLeft);
                newLeft = previousLeft + (deltaX / (distance * 0.1));
            }
            return newLeft;
        },
        
        evaluateCompletion: function() {
            if (this.getVisitedItems().length == this.model.get('items').length) {
                this.setCompletionStatus();
            }
        },

        evaluateNavigation: function() {
            var currentStage = this.model.get('_stage');
            var itemCount = this.model.get('_itemCount');

            if (currentStage == 0) {
                this.$('.narrative-control-left').addClass('narrative-hidden');

                if (itemCount > 1) {
                    this.$('.narrative-control-right').removeClass('narrative-hidden');
                }
            } else {
                this.$('.narrative-control-left').removeClass('narrative-hidden');

                if (currentStage == itemCount - 1) {
                    this.$('.narrative-control-right').addClass('narrative-hidden');
                } else {
                    this.$('.narrative-control-right').removeClass('narrative-hidden');
                }
            }

        },

        events: {
            'touchstart .narrative-slider':'onTouchNavigationStarted',
            'click .narrative-popup-open':'openPopup',
            'click .narrative-popup-close':'closePopup',
            'click .narrative-controls':'onNavigationClicked'
        },

        getNearestItemIndex: function() {
            var currentPosition = parseInt(this.$('.narrative-slider').css('margin-left')),
                graphicWidth = this.$('.narrative-slider-graphic').width(),
                absolutePosition = currentPosition / graphicWidth,
                stage = this.model.get('_stage'),
                relativePosition = stage - Math.abs(absolutePosition);
            
            if(relativePosition < -0.3) {
                stage++;
            } else if (relativePosition > 0.3) {
                stage--;
            }
            
            return this.constrainStage(stage);
        },
        
        getVisitedItems: function() {
          return _.filter(this.model.get('items'), function(item) {
            return item.visited;
          });
        },

        moveElement: function($element, deltaX) {
            var previousLeft = parseInt($element.css('margin-left')),
                newLeft = previousLeft + deltaX;
            
            newLeft = this.constrainXPosition(previousLeft, newLeft, deltaX);

            $element.css('margin-left', newLeft + 'px');
        },
        
        openPopup: function (event) {
            event.preventDefault();
            this.model.set('_active', false);

            var outerMargin = parseFloat(this.$('.narrative-popup-inner').css('margin'));
            var innerPadding = parseFloat(this.$('.narrative-popup-inner').css('padding'));
            var toolBarHeight = this.$('.narrative-toolbar').height();

            this.$('.narrative-slider-graphic').eq(this.model.get('_stage')).addClass('visited');
            this.$('.narrative-popup-toolbar-title').addClass('narrative-hidden').eq(this.model.get('_stage')).removeClass('narrative-hidden');
            this.$('.narrative-popup-content').addClass('narrative-hidden').eq(this.model.get('_stage')).removeClass('narrative-hidden');
            this.$('.narrative-popup-inner').css('height', $(window).height() - (outerMargin * 2) - (innerPadding * 2));
            this.$('.narrative-popup').removeClass('narrative-hidden');
            this.$('.narrative-popup-content').css('height', (this.$('.narrative-popup-inner').height() - toolBarHeight));
        },

        onNavigationClicked: function(event) {
            event.preventDefault();
            
            if (!this.model.get('_active')) return;
            
            var stage = this.model.get('_stage'),
                numberOfItems = this.model.get('_itemCount');
            
            if ($(event.currentTarget).hasClass('narrative-control-right')) {
                stage++;
            } else if ($(event.currentTarget).hasClass('narrative-control-left')) {
                stage--;
            }
            stage = (stage + numberOfItems) % numberOfItems;
            this.setStage(stage);
        },

        onTouchNavigationStarted: function(event) {
            event.preventDefault();
            if (!this.model.get('_active')) return;
            
            this.$('.narrative-slider').stop();
            this.$('.narrative-strapline-header-inner').stop();
            
            this.model.set('_currentX', event.originalEvent.touches[0]['pageX']);
            this.model.set('_touchStartPosition', parseInt(this.$('.narrative-slider').css('margin-left')));
            
            this.$('.narrative-slider').on('touchmove', this.onTouchMove);
            this.$('.narrative-slider').one('touchend', this.onTouchEnd);
        },

        onTouchEnd: function(event) {
            var nextItemIndex = this.getNearestItemIndex();
            this.setStage(nextItemIndex);
            
            this.$('.narrative-slider').off('touchmove', this.onTouchMove);
        },

        onTouchMove: function(event) {
            var currentX = event.originalEvent.touches[0]['pageX'],
                previousX = this.model.get('_currentX'),
                deltaX = currentX - previousX;
            
            this.moveElement(this.$('.narrative-slider'), deltaX);
            this.moveElement(this.$('.narrative-strapline-header-inner'), deltaX);
            
            this.model.set('_currentX', currentX);
        },
        
        prepareHotgraphicModel: function() {
          var model = this.model;
          model.set('_component', 'hotgraphic');
          model.set('body', model.get('originalBody'));
          return model;
        },

        preRender: function () {
            this.listenTo(Adapt, 'device:changed', this.reRender, this);
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);
            this.setDeviceSize();
        },

        postRender: function() {
            this.$('.narrative-slider').imageready(_.bind(function(){
                this.setReadyStatus();
            }, this));
            this.setupNarrative();
        }, 

        resizeControl: function() {
            this.setDeviceSize();
            this.calculateWidths();
            this.evaluateNavigation();
        },

        reRender: function() {
            if (this.model.get('_wasHotgraphic') && Adapt.device.screenSize != 'small') {
                this.replaceWithHotgraphic();
            }
        },

        replaceWithHotgraphic: function () {
            var Hotgraphic = require('components/adapt-contrib-hotgraphic/js/adapt-contrib-hotgraphic');
            var model = this.prepareHotgraphicModel();
            var newHotgraphic = new Hotgraphic({model:model, $parent: this.options.$parent});
            this.options.$parent.append(newHotgraphic.$el);
            Adapt.trigger('device:resize');
            this.remove();
        },

        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.$el.addClass('desktop').removeClass('mobile');
                this.model.set('_isDesktop', true);
            } else {
                this.$el.addClass('mobile').removeClass('desktop');
                this.model.set('_isDesktop', false)
            }
        },

        setStage: function(stage) {
            this.model.set('_stage', stage);

            // Set the visited attribute
            var currentItem = this.model.get('items')[stage];
            currentItem.visited = true;

            this.$('.narrative-progress').removeClass('selected').eq(stage).addClass('selected');
            this.$('.narrative-slider-graphic').children('.controls').attr('tabindex', -1);
            this.$('.narrative-slider-graphic').eq(stage).children('.controls').attr('tabindex', 0);
            this.$('.narrative-content-item').addClass('narrative-hidden').eq(stage).removeClass('narrative-hidden');

            this.evaluateNavigation();
            this.evaluateCompletion();

            this.animateSliderToIndex(stage);
        },

        setupNarrative: function() {
            _.bindAll(this, 'onTouchMove', 'onTouchEnd');
            this.setDeviceSize();
            this.model.set('_itemCount', this.model.get('items').length);

            this.model.set('_active', true);

            if (this.model.get('_stage')) {
                this.setStage(this.model.get('_stage'));
            } else {
                this.setStage(0);
            }
            this.calculateWidths();
        }
    });
    
    Adapt.register("narrative", Narrative);
    
    return Narrative;

});