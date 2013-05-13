do ($ = jQuery, window = window, document = document) ->

  ns = {}
  ns.support = {}

  # switch transition support flag by transit plugin.
  ns.support.transition = do ->
    return true if $.support?.transition and $.fn.transition?
    return false

  # ============================================================
  # utils

  ns.taller = ($el1, $el2) ->
    height1 = $el1.outerHeight()
    height2 = $el2.outerHeight()
    if height1 > height2
      return $el1
    else
      return $el2

  # ============================================================
  # Tab

  class ns.Tab

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

      # update location or not
      changeHash: false

      # effect
      useFade: false
      useTransition: false
      fadeDuration: 400
    
    constructor: (@$el, options = {}) ->

      @options = $.extend {}, ns.Tab.defaults, options
      @_transitionEnabled = ns.support.transition and @options.useTransition
      @_eventify()

    _eventify: ->

      @$el.delegate @options.selector_tab, 'click', (e) =>
        e.preventDefault() unless @options.changeHash is true
        @switchFromOpener $(e.currentTarget)
      return this

    switchFromOpener: ($opener) ->

      $lastContentEl = @$lastContentEl or do =>
        return @$lastContentEl = @$el.find ".#{@options.content_activeClass}"
      $nextContentEl = @getRelatedContentEl $opener

      return this if $lastContentEl[0] is $nextContentEl[0]

      # if there's already fadeIn progress, fail it.
      @_lastFadeDefer?.reject()
      # then force it to hide
      @disableContentEl $lastContentEl

      if @options.useFade

        # we need to make elements to absolute for fading
        @makeContentElsToAbsolute()

        # change wrapper's height to taller content
        $taller = ns.taller $lastContentEl, $nextContentEl
        @fixWrapperTo $taller

      eventData =
        lastTabEl: @getLastTab()
        clickedTabEl: $opener
        lastContentEl: $lastContentEl
        contentEl: $nextContentEl

      @$el.trigger 'tabify.switch', eventData
      @$el.trigger 'tabify.beforeswitchanimation', eventData

      # save next as last
      @$lastContentEl = $nextContentEl

      # save defer to fail this when another fade starts
      @_lastFadeDefer = (@activateContentEl $nextContentEl)

      @_lastFadeDefer.done =>
        # change wrapper's height again
        if @options.useFade and ($taller[0] isnt $nextContentEl[0])
          @fixWrapperTo $nextContentEl
        @$el.trigger 'tabify.afterswitchanimation', eventData

      # swtich tab
      @disableActiveTab()
      @activateTab $opener

      return this

    # wrapper handlers
    
    getWrapperEl: ->
      return @$wrapper or do =>
        @$wrapper = @$el.find @options.selector_contentwrapper
        return @$wrapper

    fixWrapperTo: ($contentEl) ->
      @getWrapperEl().height $contentEl.outerHeight()
      return this

    # content element handlers

    makeContentElsToAbsolute: ->
      $contentEls = @$el.find @options.selector_content
      $contentEls.css
        position: 'absolute'
        left:0
        top:0
      return this

    activateContentEl: ($contentEl) ->

      defer = $.Deferred (defer) =>

        cls = @options.content_activeClass

        callback = =>
          $contentEl.addClass cls
          defer.resolve()

        if @options.useFade
          d = @options.fadeDuration
          if @_transitionEnabled
            $contentEl.show().css('opacity', 0).transition { opacity: 1 }, d, callback
          else
            $contentEl.fadeTo d, 1, callback
        else
          callback()

      return defer

    disableContentEl: ($contentEl) ->

      handleCls = =>
        $contentEl.removeClass @options.content_activeClass

      if @options.useFade
        if @_transitionEnabled
          $contentEl.stop().css('opacity', 0).hide()
        else
          $contentEl.stop().fadeTo(0, 0).hide()
        handleCls()
      else
        handleCls()

      return this

    # tab element handlers
    
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
      targetData = $tab.attr @options.attr_target

      # if data attr was requested, find el from data attr
      if targetData
        $filtered = $contentEls.filter (i, el) =>
          if ($(el).attr @options.attr_id) is targetData
            return true
          else
            return false
        if $filtered.length is 1
          return $filtered

      # else, use href as id selector
      href = $tab.attr 'href'
      return @$el.find href

    # control methods
    
    switchById: (id) ->
      if @options.changeHash
        location.href = "##{id}"
      $opener = (@$el.find @options.selector_tab).filter (i, el) ->
        return ($(el).attr 'href') is "##{id}"
      if $opener.length
        @switchFromOpener $opener
      return this

    switchByTabId: (id) ->
      $opener = (@$el.find @options.selector_tab).filter (i, el) =>
        return ($(el).attr @options.attr_target) is id
      if $opener.length
        @switchFromOpener $opener
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

