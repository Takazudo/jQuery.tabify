do ($ = jQuery, window = window, document = document) ->

  $window = $(window)
  EveEve = window.EveEve

  ns = {}
  ns.support = {}

  # switch transition support flag by transit plugin.
  ns.support.transition = do ->
    return true if $.support?.transition and $.fn.transition?
    return false

  # ============================================================
  # utils

  # treat zero length jquery object to null
  ns.normalizeEventData = (obj) ->
    $.each obj, (key, val) ->
      if val?.length? and val.length is 0
        obj[key] = null
    return obj

  # ============================================================
  # Router
  # skip this if EveEve was not loaded.

  if EveEve then class ns.Router extends EveEve

    @create = ->
      unless ns.router
        ns.router = new ns.Router
      return ns.router
    
    constructor: ->
      @_eventify()

    _eventify: ->
      $window.on 'hashchange', @onHashchange
      return this

    onHashchange: =>
      @trigger 'hashchange', @getCurrentHash()
      return this

    getCurrentHash: ->
      hash = location.hash
      if hash is ''
        hash = '#'
      hash = hash.replace /^#/, ''
      return hash

  # ============================================================
  # Tab

  class ns.Tab

    if EveEve then $.extend this::, EveEve::

    @defaults =

      # selectores related to the container
      selector_tab: '.tab'
      selector_contentwrapper: '.tabcontentwrapper' # necessary if you use fade
      selector_content: '.tabcontentdiv'

      # visual control classNames
      tab_activeClass: null # 'tab-active'
      content_activeClass: null # 'tabcontentdiv-active'

      # attr names to detect target
      attr_target: 'data-tabify-target'
      attr_id: 'data-tabify-id'

      # effect
      useFade: false
      useTransition: false
      fadeDuration: 400
      
      # others
      useHashchange: false
      allow_noactive: false # make this true to allow disabling all
    
    constructor: (@$el, options = {}) ->

      @options = $.extend {}, ns.Tab.defaults, options
      @_transitionEnabled = ns.support.transition and @options.useTransition
      @_firstTabHrefVal = @getFirstTabHrefVal()
      
      if @options.useHashchange
        ns.Router.create()
        @switchByHash ns.router.getCurrentHash(), true

      @_eventify()

    _eventify: ->

      if @options.useHashchange
        ns.router.on 'hashchange', (hash) =>
          @switchByHash hash
      else
        @$el.delegate @options.selector_tab, 'click', (e) =>
          e.preventDefault()
          @switchFromOpener $(e.currentTarget)
      return this

    _trigger: (eventName, data) ->
      @$el.trigger eventName, data
      return this unless EveEve
      @trigger eventName, data

    switchFromOpener: ($opener, noAnimation = false) ->

      $lastContentEl = @$lastContentEl or do =>
        return @$lastContentEl = @$el.find ".#{@options.content_activeClass}"
      $nextContentEl = @getRelatedContentEl $opener

      justHide = false

      if $lastContentEl[0] is $nextContentEl[0]
        if @options.allow_noactive
          justHide = true
        else
          return this

      disableFadeOutDefer = if justHide then $.Deferred() else null

      # if there's already fadeIn progress, fail it.
      @_lastFadeDefer?.reject()
      # then force it to hide
      if justHide
        @disableContentEl $lastContentEl, true, ->
          disableFadeOutDefer.resolve()
      else
        @disableContentEl $lastContentEl, false, null

      if @options.useFade and (not noAnimation)

        # we need to make elements to absolute for fading
        @makeContentElsToAbsolute()

        if justHide
          # change wrapper's height to hiding content
          @fixWrapperTo $lastContentEl
          disableFadeOutDefer.done =>
            @hideWrapper()
        else
          # change wrapper's height to next content
          @showWrapper()
          @fixWrapperTo $nextContentEl

      eventData = {}

      if justHide
        eventData.lastTabEl = $opener
        eventData.tabEl = null
        eventData.lastContentEl = $lastContentEl
        eventData.contentEl = null
      else
        eventData.lastTabEl = @getLastTab()
        eventData.tabEl = $opener
        eventData.lastContentEl = $lastContentEl
        eventData.contentEl = $nextContentEl

      eventData = ns.normalizeEventData eventData

      # save next as last
      if justHide
        @$lastContentEl = null
      else
        @$lastContentEl = $nextContentEl

      @_trigger 'tabify.switch', eventData
      @_trigger 'tabify.beforeswitchanimation', eventData unless justHide

      unless justHide

        # save defer to fail this when another fade starts
        @_lastFadeDefer = (@activateContentEl $nextContentEl, noAnimation)

        @_lastFadeDefer.done =>
          @_trigger 'tabify.afterswitchanimation', eventData

      # swtich tab
      @disableActiveTab()
      @activateTab $opener unless justHide

      return this

    # wrapper handlers
    
    getWrapperEl: ->
      return @$wrapper or do =>
        @$wrapper = @$el.find @options.selector_contentwrapper
        return @$wrapper

    fixWrapperTo: ($contentEl) ->
      @getWrapperEl().height $contentEl.outerHeight()
      return this

    hideWrapper: ->
      @getWrapperEl().hide()
      return this

    showWrapper: ->
      @getWrapperEl().show()
      return this

    adjustWrapperHeight: ->
      return this unless @$lastContentEl
      @fixWrapperTo @$lastContentEl
      return this

    # content element handlers

    makeContentElsToAbsolute: ->
      $contentEls = @$el.find @options.selector_content
      $contentEls.css
        position: 'absolute'
        left:0
        top:0
      return this

    activateContentEl: ($contentEl, noAnimation) ->

      defer = $.Deferred (defer) =>

        cls = @options.content_activeClass

        callback = =>
          $contentEl.addClass cls
          defer.resolve()

        if @options.useFade and (not noAnimation)
          d = @options.fadeDuration
          if @_transitionEnabled
            $contentEl
              .show()
              .css 'opacity', 0
              .transition { opacity: 1 }, d, callback
          else
            $contentEl
              .fadeTo d, 1, callback
        else
          callback()

      return defer

    disableContentEl: ($contentEl, animate, callback) ->

      done = =>
        $contentEl.removeClass @options.content_activeClass
        callback?()

      if @options.useFade
        if animate
          d = @options.fadeDuration
          if @_transitionEnabled
            $contentEl
              .stop()
              .transition { opacity: 0 }, d, done
          else
            $contentEl.fadeTo d, 0, done
        else
          if @_transitionEnabled
            $contentEl
              .stop()
              .css 'opacity', 0
              .hide()
          else
            $contentEl
              .stop()
              .fadeTo 0, 0
              .hide()
          done()
      else
        done()

      return this

    # tab element handlers

    getFirstTabHrefVal: ->
      $tab = (@$el.find @options.selector_tab).eq(0)
      val = $tab.attr 'href'
      unless val?
        val = $tab.attr @options.attr_target
      if val?
        val = val.replace /^#/, ''
        return val
      throw new Error 'getFirstTabHrefVal had some troubles'
      return null
    
    getLastTab: ->

      return @$lastTab or do =>
        cls = @options.tab_activeClass
        $tabs = (@$el.find @options.selector_tab)
        @$lastTab = $tabs.filter (i, el) ->
          return $(el).hasClass cls
        return @$lastTab

    activateTab: ($opener) ->

      $opener.addClass @options.tab_activeClass
      @$lastTab = $opener
      return this

    disableActiveTab: ->

      cls = @options.tab_activeClass
      @getLastTab().removeClass cls
      return this

    # helpers

    getRelatedContentEl: ($tab) ->

      $contentEls = @$el.find @options.selector_content
      hrefVal = $tab.attr 'href'
      if hrefVal?
        hrefVal = hrefVal.replace /^#/, ''
      targetDataVal = $tab.attr @options.attr_target

      $filtered = $contentEls.filter (i, el) =>
        $el = $(el)
        val = $el.attr @options.attr_id
        unless val?
          val = $el.attr 'id'
        if val? and ((val is hrefVal) or (val is targetDataVal))
          return true
        return false
      unless $filtered.length is 1
        throw new Error 'getRelatedContentEl had some troubles.'
      return $filtered

    # control methods
    
    switchByHash: (hash, noAnimation = false) ->
      if hash is ''
        hash = @_firstTabHrefVal
      @switchById hash, noAnimation
    
    switchById: (id, noAnimation = false) ->
      $opener = (@$el.find @options.selector_tab).filter (i, el) ->
        return ($(el).attr 'href') is "##{id}"
      if $opener.length
        @switchFromOpener $opener, noAnimation
      return this

    switchByTabId: (id, noAnimation = false) ->
      $opener = (@$el.find @options.selector_tab).filter (i, el) =>
        return ($(el).attr @options.attr_target) is id
      if $opener.length
        @switchFromOpener $opener, noAnimation
      return this


  # ============================================================
  # jQuery bridges

  $.fn.tabify = (options) ->

    return @each ->

      $el = $(@)
      tab = new ns.Tab $el, options
      $el.data 'tabify', tab
      return

  # ============================================================
  # globalify

  $.Tabify = ns

