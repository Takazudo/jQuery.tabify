# jQuery.tabify

tab. with fade. and with transition. also supports hashchange event.

## Demos

* [basic](http://takazudo.github.io/jQuery.tabify/demos/1/)
* [useFade](http://takazudo.github.io/jQuery.tabify/demos/2/)
* [useFade/useTransition](http://takazudo.github.io/jQuery.tabify/demos/3/)
* [methods](http://takazudo.github.io/jQuery.tabify/demos/4/)
* [option - allow\_noactive](http://takazudo.github.io/jQuery.tabify/demos/5/)
* [adjustWrapperHeight demo](http://takazudo.github.io/jQuery.tabify/demos/6/)
* [hashchange demo](http://takazudo.github.io/jQuery.tabify/demos/7/)

## Usage

See demos for details.

### no animation

```javascript
$('#tabset').tabify({
  selector_tab: '.tab',
  selector_content: '.tabcontentdiv',
  tab_activeClass: 'tab-active',
  content_activeClass: 'tabcontentdiv-active'
});
```

### with fade

```javascript
$('#tabset').tabify({
  selector_tab: '.tab',
  selector_contentwrapper: '.tabcontentwrapper',
  selector_content: '.tabcontentdiv',
  tab_activeClass: 'tab-active',
  content_activeClass: 'tabcontentdiv-active',
  useFade: true
});
```

### with transition

Load [jquery.transit](http://ricostacruz.com/jquery.transit/) before this library.  
If the browser doesn't support transition, this lib uses jQuery animation instead.

```javascript
$('#tabset').tabify({
  selector_tab: '.tab',
  selector_contentwrapper: '.tabcontentwrapper',
  selector_content: '.tabcontentdiv',
  tab_activeClass: 'tab-active',
  content_activeClass: 'tabcontentdiv-active',
  useFade: true,
  useTransition: true
});
```

### events

```javascript
var $tabset = $('#tabset');

$tabset.tabify({
  selector_tab: '.tab',
  selector_contentwrapper: '.tabcontentwrapper',
  selector_content: '.tabcontentdiv',
  tab_activeClass: 'tab-active',
  content_activeClass: 'tabcontentdiv-active',
  useFade: true,
  useTransition: true
});

$tabset.bind('tabify.switch', function(e, data) {
  console.log('switch fired.', data);
});
$tabset.bind('tabify.beforeswitchanimation', function(e, data) {
  console.log('beforeswitchanimation fired.', data);
});
$tabset.bind('tabify.afterswitchanimation', function(e, data) {
  console.log('afterswitchanimation fired.', data);
});
```

or if you loaded [EveEve](https://github.com/Takazudo/EveEve) before tabify, you can do

```
var tab = $tabset.data('tabify');

tab.on('tabify.switch', function(data) {
  console.log('switch fired.', data);
});
tab.on('tabify.beforeswitchanimation', function(data) {
  console.log('beforeswitchanimation fired.', data);
});
tab.on('tabify.afterswitchanimation', function(data) {
  console.log('afterswitchanimation fired.', data);
});

```

## Depends

* jQuery 1.9.1
* [EveEve](https://github.com/Takazudo/EveEve) - if you want to use hashchange or instance event feature.
* [jquery.transit](http://ricostacruz.com/jquery.transit/) - if you want to use transition.
* [jQuery hashchange event](http://benalman.com/projects/jquery-hashchange-plugin/) - if you want to support old browsers that lacks hashchange event support.

## Browsers

IE6+ and other new browsers.  

## License

Copyright (c) 2013 "Takazudo" Takeshi Takatsudo  
Licensed under the MIT license.

## Build

Use

 * [CoffeeScript][coffeescript]
 * [grunt][grunt]

[coffeescript]: http://coffeescript.org "CoffeeScript"
[grunt]: http://gruntjs.com "grunt"
