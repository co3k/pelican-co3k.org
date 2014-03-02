==================================================================
Composer のセキュリティ上の問題が直ったので PHP な方は今すぐ更新を
==================================================================

:date: 2014-02-28 08:42:00
:slug: composer-replace-security-bug-has-been-fixed

Composer の以下の問題が 2 月半ばあたりから話題になっていました。

**Limit Replace / Provides to packages required by name in root package or any dep · Issue #2690 · composer/composer**
    https://github.com/composer/composer/issues/2690

一言で言うと、 **条件によってはユーザの意図しないパッケージがインストールされてしまう** という問題です。悪意のあるパッケージをインストールしたことに気づかれなければ、攻撃者の思い通りのコードを実行させることができてしまいます。

ざっくり説明すると、

* Composer には fork したパッケージや、リネームしたパッケージ **から** 、元のパッケージを置き換えることのできる機能が存在する (本エントリでは replace と呼称)
* Packagist 上のパッケージは誰でも自由に登録ができる
* Packagist 上のパッケージを置き換えるようなパッケージを誰かが登録してしまうと、条件によっては置き換え後のパッケージが意図せずにインストールされてしまう
* そのため、広く使われているパッケージの fork に悪意のあるコードを仕込み、 fork 版を Packagist に登録することで、あらゆるプロジェクトが意図しないうちにマルウェアを利用してしまうことになるのではないか——という懸念がささやかれることになった

というものです。

で、修正されたわけですが、 Packagist ではなく Composer 自体に対する修正になるため、古い Composer を使っている場合はこの問題の影響を受ける可能性があります。

そんなわけで、まずはお使いのすべての Composer を ``self-update`` サブコマンドで更新しましょう。

.. code-block:: console

    $ composer self-update

また、 Composer の開発者の一人である Nils Adermann は、 `Composer: Replace, Conflict & Forks Explained <http://blog.naderman.de/2014/02/17/replace-conflict-forks-explained/>`_ というエントリを公開しました。善いか悪いかはともかくとして Composer 開発陣がこの問題についてどう捉えているかがわかりやすくまとまっているので、是非ご一読いただきたいです。特に最後の TL;DR は非常に直截簡明でわかりやすいので、ここだけざっくり和訳します。 [#]_

    Replace is not a bug. *(拙訳: replace はバグではありません)*
    
    Don't run composer update in automated systems. *(拙訳: composer update を自動化されたシステムが実行するべきではありません)*
    
    Forks are allowed on Packagist. Don't be an idiot when publishing a fork. *(拙訳: Packagist で fork は認められていることだけど、 fork 版を公開するときには変なことはしないでね)*
    
    Got an unexpected fork on update? Your dependencies conflict with the original package. Use conflict (syntax like require) in your composer.json to blacklist the fork and see an explanation of the dependency issue. *(拙訳: update 時に期待しない fork をインストールした？　fork 元のパッケージと依存性が衝突しているのでしょう。 conflict (require と似た構文) を composer.json で設定して、その fork をブラックリストに入れましょう。依存性の問題に関する説明も確認しておきましょう)*

    -- `Composer: Replace, Conflict & Forks Explained <http://blog.naderman.de/2014/02/17/replace-conflict-forks-explained/>`_ より一部を引用、和訳 (Insertion of new lines by me)

> Don't run composer update in automated systems. *(拙訳: composer update を自動化されたシステムが実行するべきではありません)*

についてはちょっと追加で解説が必要かもしれませんので、最初の章からも説明を引きます (and 和訳します)。

    ... it will not result in malicious code being used if you use Composer correctly. *(拙訳: Composer を正しく使っていれば、悪意のあるコードをもたらすことはないでしょう)*
    
    Most importantly you should only ever run composer update yourself manually on your development machine. *(拙訳: 最も重要なのは、 composer update は開発用のマシン上で、あなた自身の手で実行するべきだということです)*
    
    You should read its output, verify it installed and updated packages as expected (use --dry-run to check what would happen without installing anything). *(拙訳: そしてその出力結果を確認し、インストールもしくは更新されたパッケージが期待するものであるのかを検証すべきです (--dry-run を使ってインストールする前に何が起きるのかを確認しておきましょう)。)*
    
    You should then commit the generated composer.lock file to your version control system. *(拙訳: また、生成された composer.lock はお使いのバージョン管理システム上にコミットしてください。)*
    
    Continous integration, deployment tools and other automated systems should always run composer install. A composer install run will always use the exact packages that were installed by composer update which was used to generate the lock file – no surprises possible. *(拙訳: CI ツールやデプロイツールといった自動化システム上では常に composer install を実行しましょう。 composer update によって生成された lock ファイルを使うことによって、 composer install は常に的確なパッケージをインストールすることになります——びっくりさせるようなことは何も起こりません)*

    -- `Composer: Replace, Conflict & Forks Explained <http://blog.naderman.de/2014/02/17/replace-conflict-forks-explained/>`_ より一部を引用、和訳 (Insertion of new lines by me)

ということで、

* 修正版の Composer を ``self-update`` で入手しているか
* Composer でインストールしたパッケージが期待通りのものかを都度確認しているか
* 人の目の介在しないシステム上では ``composer update`` ではなく、信頼できる lock ファイルを生成した上で ``composer install`` を実行しているか

を改めて見直してください。いままでインストールしたパッケージが本当に正しいものかどうかを確認していないのであれば、この機会に可能な限り確認しておいたほうがいいでしょう。

……さて、肝心なことは書き終えたので、ここから簡単にどういう問題であったかの解説などをしていきたいと思います。ほとんどの人はここで読むのをやめていいです。この問題に対する Composer 開発陣の対応や態度、 Composer というツール自体についてとか、パッケージインストーラ系のツールが乱立しまくっている昨今の状況とか、いろいろ思うところがある人はいそうですが、趣旨から外れるのでこのエントリではあまり触れません (ということでそのあたりを期待していた人も読むのをやめていいです)。

ちなみに、海老原がこの問題に気がついたのは、 Pádraic Brady が 2/20 の 25 時頃に公開した `Composer: Downloading Random Code Is Not A Security Vulnerability? | Pádraic Brady <http://blog.astrumfutura.com/2014/02/composer-downloading-random-code-is-not-a-security-vulnerability/>`_ というエントリがきっかけでした。そのあと前述の GitHub Issue などの周辺情報を読みまくって事態のマズさを知ったときには既に 26 時、早起きして出勤前に速報をまとめようと思ったらすっかり熟睡し、良心の呵責に耐えながら Python の仕事をし、深夜に帰宅したら `直っていた <https://github.com/composer/composer/pull/2733>`_ ので、「じゃあいいやー」と熟睡し、土日に書こうと思ったら見事に 1 週間ほど体調を崩しまくり、徹夜などを織り交ぜつつ強引にまとめ上げてようやく今日公開、というハートウォーミングストーリーでした。

実際にどういう問題が起こったか
==============================

たとえば、 Packagist に対する `getting a fork of symfony installed #390 <https://github.com/composer/packagist/issues/390>`_ という Issue を見てみると、 ``symfony/symfony`` の fork である ``lenybernard/symfony`` というパッケージが意図せずにインストールされてしまった、と報告されています。

コメントにあるとおり、 @lenybernard (Leny BERNARD) と @seldaek (Jordi Boggiano) は Twitter でこの件についてやり取りをしています。

.. raw:: html

    <blockquote class="twitter-tweet" lang="en"><p>Wow There is a big bug with my repo lenybernard/symfony which seems to steal downloads to the original  <a href="https://twitter.com/packagist">@packagist</a> <a href="https://twitter.com/symfony">@symfony</a> <a href="https://twitter.com/seldaek">@seldaek</a> <a href="https://twitter.com/fabpot">@fabpot</a></p>&mdash; Leny BERNARD (@lenybernard) <a href="https://twitter.com/lenybernard/statuses/435434505395261440">February 17, 2014</a></blockquote>

*(拙訳: うお、私の lenybernard/symfony がオリジナルの symfony に対するダウンロードを奪うっつーひどいバグがあるんだけども @packagist @symfony @seldaek @fabpot)*

このツイートに対し、 Jordi Boggiano は、

.. raw:: html

    <blockquote class="twitter-tweet" data-conversation="none" lang="en"><p><a href="https://twitter.com/lenybernard">@lenybernard</a> it&#39;s not really a bug more of a mis-use, you shouldn&#39;t put forks on packagist if they&#39;re only for your use.</p>&mdash; Jordi Boggiano (@seldaek) <a href="https://twitter.com/seldaek/statuses/435458634412490752">February 17, 2014</a></blockquote>

    <blockquote class="twitter-tweet" data-conversation="none" lang="en"><p><a href="https://twitter.com/lenybernard">@lenybernard</a> I deleted it, please use <a href="https://t.co/nFrlr6MyMp">https://t.co/nFrlr6MyMp</a> instead.</p>&mdash; Jordi Boggiano (@seldaek) <a href="https://twitter.com/seldaek/statuses/435458728843026433">February 17, 2014</a></blockquote>


*(拙訳: それはバグじゃなく使い方の問題だよ。自分が使うためだけであれば fork を packagist に登録するべきでないよ)*

*(拙訳: 削除しておいたので代わりに https://getcomposer.org/doc/05-repositories.md#vcs (訳註: Packagist からではなく VCS 上のパッケージを指定する composer.json の構文に関するドキュメント) を使ってね)*

と説明しています。

そんなわけで Packagist 上からは問題となった lenybernard/symfony が削除されているわけですが、 `GitHub のリポジトリ <https://github.com/lenybernard/symfony>`_ はもちろん残っています。そのなかの ``composer.json`` に注目してみると、 https://github.com/lenybernard/symfony/commit/b684566aa24d4e54839f8503d6ff258b556c6a76 というコミットがあるのがわかります。このコミットはパッケージ名を ``symfony/symfony`` から ``lenybernard/symfony`` に置換しているだけ (Packagist への登録のためだと思われる) ですが、元々の ``composer.json`` に ``replace`` の記載があったことで、このような事態が発生してしまうことになりました。

他にも、 `JMSTranslationBundle の事例 <https://github.com/schmittjoh/JMSTranslationBundle/issues/177>`_ や `Zend Framework 2 の CI がいつの間にか fork 版に依存していたために失敗するようになった事例 <https://github.com/zendframework/zf2/issues/5832>`_ など、随所でこの問題が顕在化していた様子を見ることができます。

そもそも replace は何のための機能か
===================================

``composer.json`` のスキーマ定義にて ``replace`` というプロパティを指定することによって利用可能となる機能です。このプロパティに関する説明を Composer のドキュメントより引用、和訳します。

    Lists packages that are replaced by this package. This allows you to fork a package, publish it under a different name with its own version numbers, while packages requiring the original package continue to work with your fork because it replaces the original package. *(拙訳: このパッケージによる置き換えの対象となるパッケージの一覧です。これによって、パッケージを fork して独自のバージョン番号を持つ別な名前のものとして公開しつつも、元パッケージに対する要求は置き換え先であるその fork に対するものとして機能させ続けることができます。)*

    This is also useful for packages that contain sub-packages, for example the main symfony/symfony package contains all the Symfony Components which are also available as individual packages.  *(拙訳: これはサブパッケージを含むパッケージに対しても有効です (たとえば、 symfony/symfony のメインパッケージは、独立したパッケージとしても入手可能な Symfony Components のパッケージをすべて含んでいます)。)*

    -- https://getcomposer.org/doc/04-schema.md#replace より一部を引用、和訳

件の GitHub Issue では、

    Users may intentionally pick the fork, or if the original is poorly maintained the fork may be picked automatically. *(拙訳: ユーザは意図的に fork を使うかもしれませんし、オリジナルがあまりメンテナンスされていない場合に fork が自動的に使われることになるかもしれません)*

    -- `Limit Replace / Provides to packages required by name in root package or any dep · Issue #2690 · composer/composer <https://github.com/composer/composer/issues/2690>`_ より一部を引用、和訳

と、 replace の元々の役割について説明しています。

また、 Composer の開発者のひとりである Jordi Boggiano は、 `In Depth with Composer <http://slides.seld.be/?file=2012-09-14+In-Depth+with+Composer.html>`_ というスライドの `19 ページ目 <http://slides.seld.be/?file=2012-09-14+In-Depth+with+Composer.html#19>`_ で、 "Renaming packages safely" として ``replace`` を用いるテクニックを紹介しています。

replace を体験する
------------------

以下の ``composer.json`` を ``composer install`` すると、 ``a/a`` の代わりに ``c/c`` がインストールされることになります。

.. code-block:: json

    {
        "repositories": [
            {
                "type": "package",
                "package": [
                    {
                        "name": "a/a",
                        "version": "1.0.0",
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    },
                    {
                        "name": "b/b",
                        "version": "1.0.0",
                        "require": { "c/c": "1.*" },
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    },
                    {
                        "name": "c/c",
                        "version": "1.0.0",
                        "replace": { "a/a": "1.0.0" },
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    }
                ]
            }
        ],
        "require": {
            "a/a": "1.*",
            "b/b": "1.*"
        }
    }

なぜかというと、以下のような依存の解決がおこなわれるからです。

* ``c/c`` の依存解決
    * なし
    * このパッケージは ``a/a`` を置き換える
* ``b/b`` の依存解決
    * ``c/c`` をインストールすることによって満たせる
* ``a/a`` の依存解決
    * なし
* ``composer.json`` に記載された依存の解決
    * ``a/a`` と ``b/b`` をインストールすることによって満たせる
        * しかし、 ``a/a`` は ``c/c`` で置き換え可能である

もちろん、 ``require`` を以下のようにしても同じ結果になります。

.. code-block:: json

    {
        "require": {
            "a/a": "1.*",
            "b/b": "1.*",
            "c/c": "1.*"
        }
    }

しかし、 ``require`` を単に以下のようにするだけでは、 ``a/a`` は ``c/c`` に置き換わりません。

.. code-block:: json

    {
        "require": {
            "a/a": "1.*"
        }
    }

これは ``replace`` によって悪意のあるコードを混入させられてしまうことがないようにするための対策です。

この場合、 ``c/c`` は依存関係を解決するなかで一度も名前を指定されることがなかったため、 ``a/a`` の置き換え対象とはなりません。依存関係を見ていった結果 ``a/a`` と ``c/c`` の両方が必要であるものの ``c/c`` によって ``a/a`` に対する依存を満たせると判断できた場合のみ置き換えがおこなわれます。

……ということで、これだけ見ると、意図しない fork をインストールしてしまう問題は発生しなさそうに思えます、が、先述したように、あちこちで問題が起きてしまっていました。いったいなぜでしょうか。

どうして問題が発生したか
========================

実は、 **矛盾した依存関係を解消する際に、 replace によって指定された fork によって依存が満たせるのであれば、依存の解決のなかでその fork が一度も指定されていなかったとしても、そちらをインストールしてしまう** という問題があったのです。

しかもこの問題は、 2013/10 に報告された `Packages using replace are in need of moderating · Issue #362 · composer/packagist <https://github.com/composer/packagist/issues/362>`_ で既知の問題でした。この報告は非常にわかりやすく問題を指摘しているので、実際に再現させてみつつ解説します。

この報告に似た状況を作り出す ``composer.json`` は、以下のような感じになるでしょうか。

.. code-block:: json

    {
        "repositories": [
            {
                "type": "package",
                "package": [
                    {
                        "name": "original/bundle",
                        "version": "0.9.1",
                        "replace": { "thirdparty/lib": "*" },
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    },
                    {
                        "name": "fork/bundle",
                        "version": "0.9.1",
                        "require": { "thirdparty/lib": "1.8.3" },
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    },
                    {
                        "name": "thirdparty/lib",
                        "version": "1.8.3",
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    },
                    {
                        "name": "thirdparty/lib",
                        "version": "1.9.0",
                        "dist": { "url" : "http://example.com/index.html", "type" : "file" }
                    }
                ]
            }
        ],
        "require": {
            "fork/bundle": "~0.9",
            "thirdparty/lib": "~1.8"
        }
    }

``original/bundle`` と ``fork/bundle`` は両方とも ``thirdparty/lib`` を用いていますが、元のパッケージは自分自身に ``thirdparty/lib`` を同梱しているため、 ``replace`` で自分自身に置き換えていたようです。一方で、 ``fork/bundle`` のほうはちゃんと ``thirdparty/lib`` に依存してくれています。また、この ``composer.json`` の置かれたプロジェクト自身も ``thirdparty/lib`` に依存しています。

この状態で ``composer install`` すると、期待通りのバージョンがきちんとインストールできますね。

.. code-block:: console

    $ composer install 
    Installing dependencies (including require-dev)
      - Installing thirdparty/lib (1.8.3)
      - Installing fork/bundle (0.9.1)

さて、そのプロジェクトのほうで、 ``thirdparty/lib`` のバージョンを 1.8.x から 1.9.x に上げる必要が出てきました。ということで、 ``require`` しているバージョンを変更して、 ``composer update`` してみると……

.. code-block:: console

    $ composer update
    Updating dependencies (including require-dev)
      - Removing thirdparty/lib (1.8.3)
      - Installing original/bundle (0.9.1)

なんと、 ``original/bundle`` がインストールされてしまい、 ``thirdparty/lib`` は削除されてしまいました。 ``composer.lock`` には ``original/bundle`` と ``fork/bundle`` の両方が記されてしまっています。

これは、以下のような依存性の解決がおこなわれてしまったせいです。

* ``thirdparty/lib`` を 1.9.0 に上げようとする
* だが、 ``fork/bundle`` は ``thirdparty/lib`` の 1.8.3 に依存してしまっている
* ``original/bundle`` は ``thirdparty/lib`` のすべてのバージョンに置き換えることができる (と、 ``replace`` で主張している) ため、必要な依存性をすべて満たすパッケージなのでこれをインストール
* ``thirdparty/lib`` は不要になったので削除

報告のなかの例を踏襲したので、 ``original/bundle`` と ``fork/bundle`` は一見関連性がありそうに見えますが、 Composer 上はまったく関連しない独立したパッケージです。 ``original/bundle`` を ``thirdparty/lib`` の代替として使うかどうかの選択は、リポジトリの全パッケージのなかで依存性を満たすパッケージがないかどうかの検索のみによって成り立っています。ここには ``composer.json`` の意思も ``fork/bundle`` や ``thirdparty/lib`` の意思もなく、ただ ``original/bundle`` の主張のみによってインストールがおこなわれてしまっています。

……さて、ここまでわかったところで、先ほどの ``lenybernard/symfony`` の事例を振り返ってみましょう。

Symfony はフレームワーク本体の再利用性が高いライブラリ群を Symfony Component として独立して利用できるようにもしています。そのため、 Symfony Components として利用可能だが Symfony 自身にも含まれるパッケージは、 ``replace`` を使って自身の物に置き換えることで、重複してインストールしないようにしているのでしょう。 ``symfony/symfony`` の fork である ``lenybernard/symfony`` も同様の ``composer.json`` を持っています。

`getting a fork of symfony installed · Issue #390 · composer/packagist <https://github.com/composer/packagist/issues/390>`_ の `報告に示されている composer.json <https://gist.github.com/phiamo/9052313>`_ の内容は至って普通なので、おそらくここから読み込まれるパッケージのなかに Symfony 2.4 のコンポーネントに依存するものがあったせいで、その依存を満たすために ``lenybernard/symfony`` がインストールされてしまったのだと思われます。が、当時とリポジトリの状況が変わっているし、ここまで来るとさすがに辿りきれないですね……中途半端で申し訳ない。

`Zend Framework 2 の事例 <https://github.com/zendframework/zf2/issues/5832>`_ では、細かい原因の特定まで至っているようなので、そのあたりのコメントを引用します。
    
    backplane/zendframework showed when installing zf2.2.* and doctrine-(orm-)module 0.9.* because doctrine module bumped zf2 to 2.3.* and backplane/zendframework registered itself as alternative to zf2 - so composer instead of saying "2.2.5 not 2.3.* STOP" found alternative dev-develop.  (*拙訳: doctrine module が zf2 を 2.3.\* にバージョンアップしたのと、 backplane/zendframework が自分自身を zf2 の代替として登録しているのが理由で、 zf2.2.\* と doctrine-(orm-)module 0.9.\* のインストール時に backplane/zendframework が登場する——したがって composer は 2.2.5 は 2.3.\* ではないとして中断する代わりに dev-develop の代替を探しにいく。*)

    -- https://github.com/zendframework/zf2/issues/5832#issuecomment-35198767 より引用、和訳

https://github.com/composer/composer/pull/2733 の修正以後は、ここまでに示した例はすべてエラーとなるようになったようです。この章の最初に示した ``composer update`` の修正後の実行結果は以下のようになります。

.. code-block:: console

    $ composer update
    Updating dependencies (including require-dev)
    Your requirements could not be resolved to an installable set of packages.

      Problem 1
        - fork/bundle 0.9.1 requires thirdparty/lib 1.8.3 -> no matching package found.
        - fork/bundle 0.9.1 requires thirdparty/lib 1.8.3 -> no matching package found.
        - Installation request for fork/bundle ~0.9 -> satisfiable by fork/bundle[0.9.1].

まとめ
======

あんまりまとまりきらなかったので要点を冒頭からコピペしてお茶を濁します！　ありがとうございました！！

* 修正版の Composer を ``self-update`` で入手しているか
* Composer でインストールしたパッケージが期待通りのものかを都度確認しているか
* 人の目の介在しないシステム上では ``composer update`` ではなく、信頼できる lock ファイルを生成した上で ``composer install`` を実行しているか

参考文献
========

すべて 2014/02/22 閲覧。

* `Limit Replace / Provides to packages required by name in root package or any dep · Issue #2690 · composer/composer <https://github.com/composer/composer/issues/2690>`_
* `Whitelist packages with names matching those specified before generating rules by naderman · Pull Request #2733 · composer/composer <https://github.com/composer/composer/pull/2733>`_
* `Composer: Downloading Random Code Is Not A Security Vulnerability? | Pádraic Brady <http://blog.astrumfutura.com/2014/02/composer-downloading-random-code-is-not-a-security-vulnerability/>`_
* `Composer: Replace, Conflict & Forks Explained <http://blog.naderman.de/2014/02/17/replace-conflict-forks-explained/>`_
* `Composer is wide open with a massive security vulnerability <http://evertpot.com/composer-is-wide-open/>`_
* `Composer's bug now fixed <http://evertpot.com/composer-bug-fixed/>`_
* `Packages using replace are in need of moderating · Issue #362 · composer/packagist <https://github.com/composer/packagist/issues/362>`_ 

.. raw:: html

    <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

.. [#] 原文は 1 行で書かれていますが、拙訳と併記した場合のバランスの問題で、文意毎に改行を入れているのでご了承ください。
