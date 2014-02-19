/*! jQuery.tabify (https://github.com/Takazudo/jQuery.tabify)
 * lastupdate: 2014-02-19
 * version: 1.2.1
 * author: 'Takazudo' Takeshi Takatsudo <takazudo@gmail.com>
 * License: MIT */
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($, window, document) {
    var $window, EveEve, ns;
    $window = $(window);
    EveEve = window.EveEve;
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
    if (EveEve) {
      ns.Router = (function(_super) {

        __extends(Router, _super);

        Router.create = function() {
          if (!ns.router) {
            ns.router = new ns.Router;
          }
          return ns.router;
        };

        function Router() {
          this.onHashchange = __bind(this.onHashchange, this);          this._eventify();
        }

        Router.prototype._eventify = function() {
          $window.on('hashchange', this.onHashchange);
          return this;
        };

        Router.prototype.onHashchange = function() {
          this.trigger('hashchange', this.getCurrentHash());
          return this;
        };

        Router.prototype.getCurrentHash = function() {
          var hash;
          hash = location.hash;
          if (hash === '') {
            hash = '#';
          }
          hash = hash.replace(/^#/, '');
          return hash;
        };

        return Router;

      })(EveEve);
    }
    ns.Tab = (function() {

      if (EveEve) {
        $.extend(Tab.prototype, EveEve.prototype);
      }

      Tab.defaults = {
        selector_tab: '.tab',
        selector_contentwrapper: '.tabcontentwrapper',
        selector_content: '.tabcontentdiv',
        tab_activeClass: null,
        content_activeClass: null,
        attr_target: 'data-tabify-target',
        attr_id: 'data-tabify-id',
        useFade: false,
        useTransition: false,
        fadeDuration: 400,
        useHashchange: false,
        allow_noactive: false
      };

      function Tab($el, options) {
        this.$el = $el;
        if (options == null) {
          options = {};
        }
        this.options = $.extend({}, ns.Tab.defaults, options);
        this._transitionEnabled = ns.support.transition && this.options.useTransition;
        this._firstTabHrefVal = this.getFirstTabHrefVal();
        if (this.options.useHashchange) {
          ns.Router.create();
          this.switchByHash(ns.router.getCurrentHash(), true);
        }
        this._eventify();
      }

      Tab.prototype._eventify = function() {
        var _this = this;
        if (this.options.useHashchange) {
          ns.router.on('hashchange', function(hash) {
            return _this.switchByHash(hash);
          });
        } else {
          this.$el.delegate(this.options.selector_tab, 'click', function(e) {
            e.preventDefault();
            return _this.switchFromOpener($(e.currentTarget));
          });
        }
        return this;
      };

      Tab.prototype._trigger = function(eventName, data) {
        this.$el.trigger(eventName, data);
        if (!EveEve) {
          return this;
        }
        return this.trigger(eventName, data);
      };

      Tab.prototype.switchFromOpener = function($opener, noAnimation) {
        var $lastContentEl, $nextContentEl, disableFadeOutDefer, eventData, justHide, _ref,
          _this = this;
        if (noAnimation == null) {
          noAnimation = false;
        }
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
        if (this.options.useFade && (!noAnimation)) {
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
        this._trigger('tabify.switch', eventData);
        if (!justHide) {
          this._trigger('tabify.beforeswitchanimation', eventData);
        }
        if (!justHide) {
          this._lastFadeDefer = this.activateContentEl($nextContentEl, noAnimation);
          this._lastFadeDefer.done(function() {
            return _this._trigger('tabify.afterswitchanimation', eventData);
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

      Tab.prototype.activateContentEl = function($contentEl, noAnimation) {
        var defer,
          _this = this;
        defer = $.Deferred(function(defer) {
          var callback, cls, d;
          cls = _this.options.content_activeClass;
          callback = function() {
            $contentEl.addClass(cls);
            return defer.resolve();
          };
          if (_this.options.useFade && (!noAnimation)) {
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

      Tab.prototype.getFirstTabHrefVal = function() {
        var $tab, val;
        $tab = (this.$el.find(this.options.selector_tab)).eq(0);
        val = $tab.attr('href');
        if (val == null) {
          val = $tab.attr(this.options.attr_target);
        }
        if (val != null) {
          val = val.replace(/^#/, '');
          return val;
        }
        throw new Error('getFirstTabHrefVal had some troubles');
        return null;
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
        var $contentEls, $filtered, hrefVal, targetDataVal,
          _this = this;
        $contentEls = this.$el.find(this.options.selector_content);
        hrefVal = $tab.attr('href');
        if (hrefVal != null) {
          hrefVal = hrefVal.replace(/^#/, '');
        }
        targetDataVal = $tab.attr(this.options.attr_target);
        $filtered = $contentEls.filter(function(i, el) {
          var $el, val;
          $el = $(el);
          val = $el.attr(_this.options.attr_id);
          if (val == null) {
            val = $el.attr('id');
          }
          if ((val != null) && ((val === hrefVal) || (val === targetDataVal))) {
            return true;
          }
          return false;
        });
        if ($filtered.length !== 1) {
          throw new Error('getRelatedContentEl had some troubles.');
        }
        return $filtered;
      };

      Tab.prototype.switchByHash = function(hash, noAnimation) {
        if (noAnimation == null) {
          noAnimation = false;
        }
        if (hash === '') {
          hash = this._firstTabHrefVal;
        }
        return this.switchById(hash, noAnimation);
      };

      Tab.prototype.switchById = function(id, noAnimation) {
        var $opener;
        if (noAnimation == null) {
          noAnimation = false;
        }
        $opener = (this.$el.find(this.options.selector_tab)).filter(function(i, el) {
          return ($(el).attr('href')) === ("#" + id);
        });
        if ($opener.length) {
          this.switchFromOpener($opener, noAnimation);
        }
        return this;
      };

      Tab.prototype.switchByTabId = function(id, noAnimation) {
        var $opener,
          _this = this;
        if (noAnimation == null) {
          noAnimation = false;
        }
        $opener = (this.$el.find(this.options.selector_tab)).filter(function(i, el) {
          return ($(el).attr(_this.options.attr_target)) === id;
        });
        if ($opener.length) {
          this.switchFromOpener($opener, noAnimation);
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
