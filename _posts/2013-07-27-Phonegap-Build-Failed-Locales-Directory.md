---
title: Phonegap build fails with a locales directory
layout: default
---

I've recently been using [PhoneGap] (http://phonegap.com/) to compile a
[Backbone.js] (http://backbonejs.org/) app into a native iPhone app. The build
process kept working fine for all platforms except iPhone which failed every
time with this unhelpful error message: `Oh geez. Your build failed. Sorry,
but a problem occurred on the build server.`

After finding no help on Google, I tried compiling only specific parts of the
application and discovered that if I excluded the `locales` directory used by
the [i18next] (http://i18next.com/) plugin, the build process went off without
a hitch. It turns out that PhoneGap specifically looks for a locales directory
and if it contains files in an unsupported format, it fails to build.

The simplest solution to this is to use a different directory name. If you're
using the i18next plugin, you can specify the path when you initialize the
plugin:

    $.i18n.init({
        resGetPath: 'locale/__lng__/__ns__.json'
    });
