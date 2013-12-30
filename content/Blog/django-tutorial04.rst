=========================================
Django のチュートリアルをやってみるよ (4)
=========================================

:date: 2013-12-30 10:00:00
:slug: jango-tutorial04

https://docs.djangoproject.com/en/1.6/intro/tutorial04/ をやります。フォーム周りについてやるとのこと。

1. チュートリアル 4 章
======================

1-1. view 側の実装
------------------

まだ Django 流の用語に慣れていない感じで戸惑っているのだけれど、ここでいう view というのはつまり Page Controller のこと。

とりあえずテンプレートにべた書きしたフォームの送信内容をハンドルするように ``vote()`` を実装していきます。リダイレクトにちゃんと ``HttpResponseRedirect`` とか使うわけですね。素晴らしいですね。

ただ、リダイレクトで、

.. code-block:: python

    return HttpResponseRedirect(reverse('polls:results', args=(p.id,)))

とかやっているのだけれど、この ``django.core.urlresolvers.reverse`` が気になる。これ Template View 内で書いている ``url()`` と同じなのかな。 "urlresolvers" というからには、「URL -> ビュー名」を目的としたクラスなんだけれども、「ビュー名 → URL」の変換をおこなうから "reverse" なのね。

で、このメソッドの返り値が ``/polls/6/results/`` とかだったりするのだけど、 Location ヘッダはちゃんと絶対 URL になっていたので、その辺の面倒は ``HttpResponseRedirect`` がみてくれているというわけですねたぶん。

1-2. generic views
------------------

「 ``detail()`` と ``results()`` のビューの実装が似てますよねー」ということで共通化……かと思いきや、 Web アプリケーションでよく見かけるデータの扱いを Django の用意している generic views なるものに任せて、コードを書かなくて済むようにしよう！！　ということらしい。わーお。

で、 response を返すメソッドを実装する代わりに、 generic views のなかから適切なクラス (DB 内データを一覧するものであれば ``ListView`` だし、単一のデータを扱うのであれば ``DetailView`` を使う) を選ぶ、と。

若干眉唾だと思ってたけど、 https://docs.djangoproject.com/en/1.6/ref/class-based-views/generic-display/#django.views.generic.detail.DetailView とか読む限り、 ``get_context_data()`` とかのタイミングで追加で検証とかして、 ``render_to_response()`` とかでその結果に応じたレスポンスを返すみたいな感じの拡張ができたりとかそこそこ柔軟に扱える感じではありそうだ。というかビューをこういう感じで共通化できるのであれば、権限チェックとかを透過的に扱うようなビューとかも作れそうね。まあ透過的にやるならもうちょっと上のレイヤーとかもあるんだろうけど。

ってあれ、 4 章もう終わりか。

2. チュートリアル 5 章
======================

ということで https://docs.djangoproject.com/en/1.6/intro/tutorial05/ なんだけど、テストはもうこれまでに書いてしまっているので、いまの進捗状況にあわせてテストを埋めるだけ。

3. チュートリアル 6 章
======================

https://docs.djangoproject.com/en/1.6/intro/tutorial06/ である。基本的なチュートリアルはこれで最後！！　CSS とかのアセット類はどうするんじゃいというお話。えー、超どうでもいいぞ。他にもうちょっと何か知っておくべきこととかないの。

``STATICFILES_FINDERS`` で設定された複数の finder が指定された静的ファイルを探してくれるとのこと。ちらっとチュートリアル外のドキュメントの記述が目に入ったけど CDN とかを扱える奴があるらしい。へえ。

で、デフォルトの finder のうちのひとつである ``AppDirectoriesFinder`` がアプリケーションの ``static`` ディレクトリ以下からファイルを探してくれる感じになるらしいのでこれを使いましょう、ということに。

``polls/static/polls/style.css`` に CSS を置いた上で、テンプレートで ``{% static 'polls/style.css' %}`` とか書けば CSS のパスが得られるらしい。ただし、テンプレートタグ ``static`` を用いるには ``{% load staticfiles %}`` で読み込んでおく必要がある。これはデフォルトで読み込んだりとかそういうことはできないんだろうか。できるんだろうなたぶん。まあいまはいいや。

あとは CSS 内の画像ファイルパスとかどうでもいい話しか書いていないので読み飛ばす。

うお、 6 章もこれでおしまいだ。あんまり面白くなかった。

4. 次に読むべきドキュメントは？
===============================

なんかご丁寧に `What to read next <https://docs.djangoproject.com/en/1.6/intro/whatsnext/>`_ なるドキュメントがあるので読む。

とりあえず `トピック別のドキュメント群 <https://docs.djangoproject.com/en/1.6/topics/>`_ と `Tips 集的なドキュメント <https://docs.djangoproject.com/en/1.6/howto/>`_ があるのでこの辺に目を通すくらいか。

そうだなー、この辺また読んでいってもいいんだけれど、直近の開発環境とかそのあたりを準備していくほうを優先するかな。まあでも 1 日 1 トピックぐらい勉強できたらいいんかなあ (というか超いまさらなんだけど翻訳とかしていったらよかったんじゃないでしょうか)。

と思ったら翻訳プロジェクトあった。 https://github.com/django-docs-ja/django-docs-ja でも 1.4 のドキュメントに追従しているっていう感じのステータスか。と思ったら 1.4 は LTS なのか。

https://docs.djangoproject.com/en/1.6/internals/release-process/

minor release は 9 ヶ月に一回あって、えーっと、あれ、どのバージョンがいつまでサポートされるかとか書いてないぞ。

    ... but first, we need to finish (and have in public) the discussion about the LTS process, lifecycle, etc. We need to run this past django-developers for feedback.
    
    -- `Update djangoproject.com releases page to support LTS releases <https://code.djangoproject.com/ticket/21028>`_

とか見つけたけど、 LTS とかいう概念ができたのは比較的最近なのか。

あ、開発版のドキュメントには LTS について書いてあった。

    Additionally, the Django team will occasionally designate certain releases to be “Long-term support” (LTS) releases. LTS releases will get security fixes applied for a guaranteed period of time, typically 3+ years, regardless of the pace of releases afterwards.

    The follow releases have been designated for long-term support:

    * Django 1.4, supported until at least March 2015.

    -- https://docs.djangoproject.com/en/dev/internals/release-process/#long-term-support-lts-releases

うんうん、ユーザーの利用形態とか利益とか考えればこういうセキュリティリリースのためだけのバージョンも保守するのが普通だよねえ。おっと愚痴がこぼれそうになった。

1.4 の寿命は 1 年 3 ヶ月くらいか。 LTS が出る頻度は不定期なのかな。できれば次の LTS とかに向けた日本語ドキュメント作成とかには参加とかしたいなあ。

んーまあ Advent Calendar とか読みつつ日本語コミュニティの空気感みたいのを探ってみるか。
