/*! jQuery.tabify (https://github.com/Takazudo/jQuery.tabify)
 * lastupdate: 2013-09-09
 * version: 1.2.1
 * author: 'Takazudo' Takeshi Takatsudo <takazudo@gmail.com>
 * License: MIT */
(function() {

  (function($, window, document) {
    var ns;
    ns = {};
    ns.support = {};
    ns.support.transition = (function() {
      var _ref;
      if (((_ref = $.support) != null ? _ref.transition : void 0) && ($.fn.transition != null)) {
        return true;
      }
      return false;
    })();
    ns.normalizeEventData = function(obj) {
      $.each(obj, function(key, val) {
        if (((val != null ? val.length : void 0) != null) && val.length === 0) {
          return obj[key] = null;
        }
      });
      return obj;
    };
    ns.Tab = (function() {

      Tab.defaults = {
        selector_tab: '.tab',
        selector_contentwrapper: '.tabcontentwrapper',
        selector_content: '.tabcontentdiv',
        tab_activeClass: null,
        content_activeClass: null,
        attr_target: 'data-tabify-target',
        attr_id: 'data-tabify-id',
        changeHash: false,
        useFade: false,
        useTransition: false,
        fadeDuration: 400,
        allow_noactive: false
      };

      function Tab($el, options) {
        this.$el = $el;
        if (options == null) {
          options = {};
        }
        this.options = $.extend({}, ns.Tab.defaults, options);
        this._transitionEnabled = ns.support.transition && this.options.useTransition;
        this._eventify();
      }

      Tab.prototype._eventify = function() {
        var _this = this;
        this.$el.delegate(this.options.selector_tab, 'click', function(e) {
          if (_this.options.changeHash !== true) {
            e.preventDefault();
          }
          return _this.switchFromOpener($(e.currentTarget));
        });
        return this;
      };

      Tab.prototype.switchFromOpener = function($opener) {
        var $lastContentEl, $nextContentEl, disableFadeOutDefer, eventData, justHide, _ref,
          _this = this;
        $lastContentEl = this.$lastContentEl || (function() {
          return _this.$lastContentEl = _this.$el.find("." + _this.options.content_activeClass);
        })();
        $nextContentEl = this.getRelatedContentEl($opener);
        justHide = false;
        if ($lastContentEl[0] === $nextContentEl[0]) {
          if (this.options.allow_noactive) {
            justHide = true;
          } else {
            return this;
          }
        }
        disableFadeOutDefer = justHide ? $.Deferred() : null;
        if ((_ref = this._lastFadeDefer) != null) {
          _ref.reject();
        }
        if (justHide) {
          this.disableContentEl($lastContentEl, true, function() {
            return disableFadeOutDefer.resolve();
          });
        } else {
          this.disableContentEl($lastContentEl, false, null);
        }
        if (this.options.useFade) {
          this.makeContentElsToAbsolute();
          if (justHide) {
            this.fixWrapperTo($lastContentEl);
            disableFadeOutDefer.done(function() {
              return _this.hideWrapper();
            });
          } else {
            this.showWrapper();
            this.fixWrapperTo($nextContentEl);
          }
        }
        eventData = {};
        if (justHide) {
          eventData.lastTabEl = $opener;
          eventData.tabEl = null;
          eventData.lastContentEl = $lastContentEl;
          eventData.contentEl = null;
        } else {
          eventData.lastTabEl = this.getLastTab();
          eventData.tabEl = $opener;
          eventData.lastContentEl = $lastContentEl;
          eventData.contentEl = $nextContentEl;
        }
        eventData = ns.normalizeEventData(eventData);
        if (justHide) {
          this.$lastContentEl = null;
        } else {
          this.$lastContentEl = $nextContentEl;
        }
        this.$el.trigger('tabify.switch', eventData);
        if (!justHide) {
          this.$el.trigger('tabify.beforeswitchanimation', eventData);
        }
        if (!justHide) {
          this._lastFadeDefer = this.activateContentEl($nextContentEl);
          this._lastFadeDefer.done(function() {
            return _this.$el.trigger('tabify.afterswitchanimation', eventData);
          });
        }
        this.disableActiveTab();
        if (!justHide) {
          this.activateTab($opener);
        }
        return this;
      };

      Tab.prototype.getWrapperEl = function() {
        var _this = this;
        return this.$wrapper || (function() {
          _this.$wrapper = _this.$el.find(_this.options.selector_contentwrapper);
          return _this.$wrapper;
        })();
      };

      Tab.prototype.fixWrapperTo = function($contentEl) {
        this.getWrapperEl().height($contentEl.outerHeight());
        return this;
      };

      Tab.prototype.hideWrapper = function() {
        this.getWrapperEl().hide();
        return this;
      };

      Tab.prototype.showWrapper = function() {
        this.getWrapperEl().show();
        return this;
      };

      Tab.prototype.adjustWrapperHeight = function() {
        if (!this.$lastContentEl) {
          return this;
        }
        this.fixWrapperTo(this.$lastContentEl);
        return this;
      };

      Tab.prototype.makeContentElsToAbsolute = function() {
        var $contentEls;
        $contentEls = this.$el.find(this.options.selector_content);
        $contentEls.css({
          position: 'absolute',
          left: 0,
          top: 0
        });
        return this;
      };

      Tab.prototype.activateContentEl = function($contentEl) {
        var defer,
          _this = this;
        defer = $.Deferred(function(defer) {
          var callback, cls, d;
          cls = _this.options.content_activeClass;
          callback = function() {
            $contentEl.addClass(cls);
            return defer.resolve();
          };
          if (_this.options.useFade) {
            d = _this.options.fadeDuration;
            if (_this._transitionEnabled) {
              return $contentEl.show().css('opacity', 0).transition({
                opacity: 1
              }, d, callback);
            } else {
              return $contentEl.fadeTo(d, 1, callback);
            }
          } else {
            return callback();
          }
        });
        return defer;
      };

      Tab.prototype.disableContentEl = function($contentEl, animate, callback) {
        var d, done,
          _this = this;
        done = function() {
          $contentEl.removeClass(_this.options.content_activeClass);
          return typeof callback === "function" ? callback() : void 0;
        };
        if (this.options.useFade) {
          if (animate) {
            d = this.options.fadeDuration;
            if (this._transitionEnabled) {
              $contentEl.stop().transition({
                opacity: 0
              }, d, done);
            } else {
              $contentEl.fadeTo(d, 0, done);
            }
          } else {
            if (this._transitionEnabled) {
              $contentEl.stop().css('opacity', 0).hide();
            } else {
              $contentEl.stop().fadeTo(0, 0).hide();
            }
            done();
          }
        } else {
          done();
        }
        return this;
      };

      Tab.prototype.getLastTab = function() {
        var _this = this;
        return this.$lastTab || (function() {
          var $tabs, cls;
          cls = _this.options.tab_activeClass;
          $tabs = _this.$el.find(_this.options.selector_tab);
          _this.$lastTab = $tabs.filter(function(i, el) {
            return $(el).hasClass(cls);
          });
          return _this.$lastTab;
        })();
      };

      Tab.prototype.activateTab = function($opener) {
        $opener.addClass(this.options.tab_activeClass);
        this.$lastTab = $opener;
        return this;
      };

      Tab.prototype.disableActiveTab = function() {
        var cls;
        cls = this.options.tab_activeClass;
        this.getLastTab().removeClass(cls);
        return this;
      };

      Tab.prototype.getRelatedContentEl = function($tab) {
        var $contentEls, $filtered, href, targetData,
          _this = this;
        $contentEls = this.$el.find(this.options.selector_content);
        targetData = $tab.attr(this.options.attr_target);
        if (targetData) {
          $filtered = $contentEls.filter(function(i, el) {
            if (($(el).attr(_this.options.attr_id)) === targetData) {
              return true;
            } else {
              return false;
            }
          });
          if ($filtered.length === 1) {
            return $filtered;
          }
        }
        href = $tab.attr('href');
        return this.$el.find(href);
      };

      Tab.prototype.switchById = function(id) {
        var $opener;
        if (this.options.changeHash) {
          location.href = "#" + id;
        }
        $opener = (this.$el.find(this.options.selector_tab)).filter(function(i, el) {
          return ($(el).attr('href')) === ("#" + id);
        });
        if ($opener.length) {
          this.switchFromOpener($opener);
        }
        return this;
      };

      Tab.prototype.switchByTabId = function(id) {
        var $opener,
          _this = this;
        $opener = (this.$el.find(this.options.selector_tab)).filter(function(i, el) {
          return ($(el).attr(_this.options.attr_target)) === id;
        });
        if ($opener.length) {
          this.switchFromOpener($opener);
        }
        return this;
      };

      return Tab;

    })();
    $.fn.tabify = function(options) {
      return this.each(function() {
        var $el, tab;
        $el = $(this);
        tab = new ns.Tab($el, options);
        $el.data('tabify', tab);
      });
    };
    return $.Tabify = ns;
  })(jQuery, window, document);

}).call(this);
