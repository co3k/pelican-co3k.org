======================================================
RedCloth における未修正の XSS 脆弱性についての注意喚起
======================================================

:date: 2014-12-11 13:10:00
:slug: redcloth-unfixed-xss

TL;DR
=====

任意のスクリプトの実行をユーザに許している場合を除き、 RedCloth によってパースしたユーザ入力値を出力するべきではありません。 RedCloth には 9 年ほど前から存在する未修正の XSS 脆弱性があり、しかもその存在が 2 年前に明らかになっています。

残念なことに、現在の開発者によるこの脆弱性の修正は期待できません。開発者は `"バグの修正や次のメジャーリリースに関する作業をおこなえない (unable to keep fixing bugs or work on the next major release)" <https://github.com/jgarber/redcloth#redcloth-needs-new-maintainers>`_ 旨を宣言しています。

もしそのようなコンテンツに対する RedCloth の利用を継続したい場合、この問題に対する修正を自分で実施するか、 RedCloth へのコントリビュートをおこなうことなどを検討してください。

RedCloth とは
=============

RedCloth は Ruby 向けの Textile パーサライブラリとして非常によく知られているものではないかと思います。

このライブラリに関する情報は http://redcloth.org/ や https://rubygems.org/gems/RedCloth から取得できます。

脆弱性について
==============

海老原は 2012/02/24 にこの問題を発見し、 https://gist.github.com/co3k/75b3cb416c342aa1414c に示すような PoC を開発者に送信しました。

読者の便宜のために、 PoC の内容を以下に転記します。

.. code-block:: ruby

    require 'redcloth'
     
    print RedCloth.new('["clickme":javascript:alert(%27XSS%27)]', [:filter_html, :filter_styles, :filter_classes, :filter_ids]).to_html
     
    # Result:
    # <p><a href="javascript:alert(%27XSS%27)">clickme</a></p> 

以上の通り、生成された `a` 要素の `href` 属性値が `javascript` スキームを含んでいます。出力されたリンクをクリックすることで、任意の JavaScript の実行がおこなわれてしまうことになります。

タイムライン
============

* 2012/02/24 : 開発者にこの問題をメールにて報告
* 2012/02/29 : 開発者がこの問題についてのチケット http://jgarber.lighthouseapp.com/projects/13054-redcloth/tickets/243-xss を公開する
* ...
* 2014/09/24 : プロジェクトの引き継ぎ先を探すための "RedCloth needs new maintainers" が RedCloth の開発者によってアナウンスされる https://github.com/jgarber/redcloth/commit/b24f03db023d1653d60dd33b28e09317cd77c6a0
* 2014/12/08 : とあるサイトに対してこの RedCloth の問題に起因する XSS 脆弱性を報告
* 2014/12/09 : 本サイトにてこの問題を告知することを決める
* 2014/12/11 : 本エントリ公開

影響を受けるバージョン
======================

以下のバージョンの RedCloth がこの問題の影響を受けることを確認しています:

* RedCloth 4.2.9 (November 27, 2011) [latest version]
* RedCloth 4.2.0 (June 10, 2009)
* RedCloth 4.1.9 (February 20, 2009)
* RedCloth 3.0.4 (September 15, 2005)
* RedCloth 3.0.3 (February 6, 2005)
* RedCloth 3.0.2 (February 3, 2005)
* RedCloth 3.0.1 (January 18, 2005)

RedCloth 3.0.0 に関しては javascript スキームを含まない形でリンクが生成されることを確認しました。したがって、 3.0.0 は影響を受けないと言えます。

また、海老原の環境では RedCloth 4.0.0 から RedCloth 4.1.1 に関するテストがおこなえませんでした。

回避策について
==============

Redmine のように、独自の RedCloth を用いることでこの種の問題を回避しているプロジェクトがあります。

Redmine は古い RedCloth 3.0.4 を用いているものの、 http://www.redmine.org/projects/redmine/repository/changes/trunk/lib/redcloth3.rb のように多くの修正が加えられています。件の XSS 脆弱性に関しても http://www.redmine.org/projects/redmine/repository/revisions/2212 にて修正が加えられていました。受け容れるスキームの種類を限定するというこの修正は適切であり、独自で修正を加える際の参考になるかと思います。

もちろん代替のライブラリや適切にメンテナンスされた RedCloth 4 の fork を用いることも、ユーザの入力値をフィルタリングすることも、 monkey patch による回避策も有効に働くかもしれません。ただ海老原は Ruby に関してそれほど明るくはないため、具体的な例を示すことが残念ながらできません……ごめんなさい。
