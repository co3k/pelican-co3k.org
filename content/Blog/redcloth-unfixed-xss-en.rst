=======================================================
RedCloth contains unfixed XSS vulnerability for 9 years
=======================================================

:date: 2014-12-11 13:10:00
:slug: redcloth-unfixed-xss
:lang: en

TL;DR
=====

You shouldn't use RedCloth to parse user inputted contents and output the parsed string (except that you allow your user to write arbitrary JavaScript code on your site) because it contains unfixed XSS vulnerability for 9 years, and it be also disclosed for 2 years.

Unfortunately, we may not expect fix the vulnerability by the current developer because he announced that `"unable to keep fixing bugs or work on the next major release" <https://github.com/jgarber/redcloth#redcloth-needs-new-maintainers>`_.

If you want to continue to use RedCloth for such contents, you should patch for the problem yourself, consider contributing to RedCloth, or otherwise.

What is RedCloth
================

I recognize RedCloth is a well-known converting Textile library for Ruby.

You can see some information and get the library from http://redcloth.org/ or https://rubygems.org/gems/RedCloth

The Issue
=========

I reported the PoC to a developer of RedCloth in Feb. 24, 2012: https://gist.github.com/co3k/75b3cb416c342aa1414c

For your convenience, I paste (and some modified) a PoC to the following:

.. code-block:: ruby

    require 'redcloth'
     
    print RedCloth.new('["clickme":javascript:alert(%27XSS%27)]', [:filter_html, :filter_styles, :filter_classes, :filter_ids]).to_html
     
    # Result:
    # <p><a href="javascript:alert(%27XSS%27)">clickme</a></p> 

You can see the above generated `a` element has the `href` attribute value which contains `javascript` scheme. It causes execute arbitrary JavaScript code by clicking the rendered link.

Timeline
========

* Feb. 24, 2012 : I reported the problem to a developer (by sending e-mail)
* Feb. 29, 2012 : A developer discloses the issue in this ticket: http://jgarber.lighthouseapp.com/projects/13054-redcloth/tickets/243-xss
* ...
* Sep. 24, 2014 : Announced "RedCloth needs new maintainers" to take over RedCloth by a developer: https://github.com/jgarber/redcloth/commit/b24f03db023d1653d60dd33b28e09317cd77c6a0
* Dec. 8, 2014 : I reported a site contains XSS issue caused by this RedCloth vulnerability
* Dec. 9, 2014 : I decided to disclose this problem on my site
* Dec. 11, 2014 : Published.

Affected Version
================

I've confirmed the following versions of RedCloth are affected:

* RedCloth 4.2.9 (November 27, 2011) [latest version]
* RedCloth 4.2.0 (June 10, 2009)
* RedCloth 4.1.9 (February 20, 2009)
* RedCloth 3.0.4 (September 15, 2005)
* RedCloth 3.0.3 (February 6, 2005)
* RedCloth 3.0.2 (February 3, 2005)
* RedCloth 3.0.1 (January 18, 2005)

I've confirmed that RedCloth 3.0.0 generates link without javascript scheme. So the version of 3.0.0 is not affected.

I couldn't test with RedCloth 4.0.0 to RedCloth 4.1.1 on my environment.

Workaround
==========

Some projects use their own RedCloth and avoid a type of this problem. I know the Redmine's case.

Redmine uses old RedCloth 3.0.4 but it is very patched: http://www.redmine.org/projects/redmine/repository/changes/trunk/lib/redcloth3.rb and the XSS issue is fixed in http://www.redmine.org/projects/redmine/repository/revisions/2212 . The Redmine's fix looks good to me; limited types of schemes should be accepted so it might help to create your own patch.

Of course using an alternative library or well-maintained fork of RedCloth 4, or filtering user inputted values, or some monkey patching approach might be effective. But I'm sorry too that I can't indicate specific information since I'm not Ruby-aware programmer.
