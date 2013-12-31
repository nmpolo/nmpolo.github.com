---
title: Pre-Rendered Templates With Backbone Marionette
layout: default
---

In [Backbone Marionette](http://marionettejs.com/), you would normally call
`view.render();` to display a view in the browser. However, what if the server
has already returned some pre-rendered HTML that doesn't need to be rendered
by Marionette? For example, you may pre-render the HTML for the header,
navigation and footer on your website to improve the user's experience whilst
waiting for your javascript to load.

The easiest way to use pre-rendered templates is simply:
{% highlight javascript %}
var nav = new Marionette.Layout({el: $('#nav')});
nav.bindUIElements();
{% endhighlight %}
where `$('#nav')` contains your pre-rendered HTML.

Additionally, if you want to attach a pre-rendered view to a region, rather
than calling `App.region.show(view)`, instead call
`App.region.attachView(view)` as [described by Derick Bailey](https://github.com/marionettejs/backbone.marionette/issues/343#issuecomment-10411387).
