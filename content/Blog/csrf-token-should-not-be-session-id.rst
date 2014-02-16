=================================================================================
CSRF 対策用トークンの値にセッション ID そのものを使ってもいい時代は終わりつつある
=================================================================================

:date: 2014-02-17 08:30:00
:slug: csrf-token-should-not-be-session-id
:status: draft

CSRF 対策は攻撃者の知り得ない秘密情報をリクエストに対して要求すればよく、そのような用途としてはセッション ID がお手軽でいいよねという時代があったかと思います。

いや、もちろん、 CSRF 対策の文脈だけで言えば今も昔も間違いというわけではありません。セッション ID が秘密情報であるのは Web アプリケーションにおいて当然の前提ですので、 CSRF 対策としてリクエストに求めるべきパラメータとしての条件はたしかに満たしています。

たとえば `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版では以下のように解説されています。

    6-(i)-a. (中略) その「hidden パラメータ」に秘密情報が挿入されるよう、前のページを自動生成して、実行ページではその値が正しい場合のみ処理を実行する。 

    (中略) この秘密情報は、セッション管理に使用しているセッション ID を用いる方法の他、セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等が考えられます。

    -- `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版  p. 30 より引用

ですが、いくら CSRF 対策になるとはいっても、 CSRF 対策用トークンとしてセッション ID そのものを使うのはもうやめた方がいいですよ、というのを書いていきます。

なぜセッション ID を使ってはいけないか
======================================

理由として思いついたものを二つ挙げます。

* セッション cookie に対する HttpOnly 属性の利用が一般的になってきた [#]_
* SSL 通信に対する BREACH attack という攻撃手法が発表された

これによって、「セッション cookie は盗まれないが CSRF 対策用トークンは盗まれうる」という状況が生まれ、「CSRF 対策用トークンがセッション ID 自体であったためにセッションハイジャック攻撃に繋げられてしまう」可能性が出てくることになります。

以下にちょっとだけ詳しく解説していこうかと思いますが、ここまでで、「あー」と思った人は自分のサイトとかもろもろを再点検すればいいだけの話です。以上です。お疲れ様でした。

セッション cookie を HttpOnly 付きで発行している場合
----------------------------------------------------

セッション cookie に ``HttpOnly`` 属性が指定されていれば、サイトに XSS 脆弱性があった場合でも、スクリプト経由で cookie 値に含まれるセッション ID を盗むことはできなくなります [#]_ 。

`RFC 6265 <http://tools.ietf.org/html/rfc6265>`_ から ``HttpOnly`` 属性についての説明を引きます。

    4.1.2.6. The HttpOnly Attribute

    The HttpOnly attribute limits the scope of the cookie to HTTP requests.  In particular, the attribute instructs the user agent to omit the cookie when providing access to cookies via "non-HTTP" APIs (such as a web browser API that exposes cookies to scripts).

    (参考訳:  HttpOnly 属性は、クッキーのスコープを HTTP リクエストに制限する。 特に，この属性は、 UA が “非 HTTP” API （スクリプトにクッキーを公開するウェブブラウザ API など， UA により定義される API ）を通して，クッキーへのアクセスを提供する際に、そのクッキーはアクセス対象から除外することを UA に指示する。)

    -- `RFC 6265 - 4.1.2.6. The HttpOnly Attribute <http://tools.ietf.org/html/rfc6265#section-4.1.2.6>`_ (日本語参考訳は http://www.hcn.zaq.ne.jp/___/WEB/RFC6265-ja.html#section-4.1.2.6 より引用)

ありていに言えば、 ``HttpOnly`` 属性を指定した cookie は ``document.cookie`` には含まれなくなります。 ``document.cookie`` に cookie が含まれなくなることによって何が嬉しいのかについて、 MSDN の解説より引きます。

    To mitigate the risk of information disclosure with a cross-site scripting attack, a new attribute is introduced to cookies for Internet Explorer 6 SP1. This attribute specifies that a cookie is not accessible through script. By using HTTP-only cookies, a Web site eliminates the possibility that sensitive information contained in the cookie can be sent to a hacker's computer or Web site with script.

    (拙訳: XSS 攻撃による情報漏洩のリスクを軽減するために、 Internet Explorer 6 SP1 にて cookie に対する新しい属性が導入されました。この属性はスクリプト経由で cookie にアクセスできないよう指定するものです。 HTTP-only cookie を使用することで、 Web サイトは、 cookie に含まれる秘密情報がスクリプトによってハッカーのコンピュータもしくは Web サイトに送信される可能性を排除することができます)

    -- `Mitigating Cross-site Scripting With HTTP-only Cookies <http://msdn.microsoft.com/en-us/library/ms533046.aspx>`_

この属性は cookie 暗黒時代 (RFC 6265 以前) に Microsoft が独自に実装したのがはじまりですが、このとおり、 Microsoft としては XSS によるリスクの軽減を意図して導入したことが読み取れます。

そんなわけで、セッション cookie の値として含まれるセッション ID は明らかに秘密情報ですので、 ``HttpOnly`` 属性付きで発行するのが望ましいです。まだこの属性を付けていないようなら、副作用はほとんどないといっていい [#]_ ので是非付けましょう。

ですが、 CSRF 対策用トークンがセッション ID そのものだと、 DOM ツリー上に存在する「hidden パラメータ」に CSRF 対策用トークン (= セッション ID) が含まれることになりますので、 XSS 攻撃によってこの値を盗み取り、セッションハイジャック攻撃に繋げることができてしまいます。つまり、セッション cookie に ``HttpOnly`` 属性を指定している意味がほとんどなくなります。

当たり前の話ではあるのですが、セッション cookie 発行部分と CSRF 対策部分を別々の人間が開発していたりとか、レビュー用のチェックリストが別々の項目になっていて見逃されてたりとか、 ``php.ini`` で ``session.cookie_httponly`` が ``true`` になっているのに気がついていないとか、このあたりの足並みが揃っていないみたいのは案外ありうるんじゃないかと思って書いてみました。

BREACH attack の影響を受ける場合
--------------------------------

この記事のドラフト完成直前に思いつきましたが、 `BREACH attack <http://breachattack.com/>`_ の影響を受ける場合も CSRF トークンとしてセッション ID を使わない方がいいでしょう。

Web サイトが HTTP と HTTPS の両方でサービスを提供している場合、通信路上の攻撃者が HTTP 通信時 (平文通信時) の通信内容を盗聴して得たセッション cookie を悪用して、 HTTPS で提供されるリソースに対してセッションハイジャックされる可能性があります。サービスの性質によってはこの種の攻撃に対するリスクを受容できないとして、 HTTP 通信と HTTPS 通信時に用いるセッション cookie を分け、 HTTPS 通信時の cookie に対しては ``secure`` 属性を指定することで対策をしているのではないかと思います。

これによって、正当な利用者が HTTPS 通信上でサービスを受けている場合に必要なセッション cookie を盗聴することはできなくなりますが、 CSRF トークンと HTTPS 通信用のセッション ID が共通である場合、 BREACH attack によってセッション ID を推測されてしまうかもしれません。

BREACH attack は、 HTTPS 通信によって暗号化されたレスポンスボディ (HTTP 圧縮されたもの) に対する、サイドチャンネル攻撃の一種です。詳細は http://breachattack.com/ などを参照していただきたいのですが、以下簡単に説明します。

HTTPS 通信専用のセッション ID が CSRF 対策用トークンとしてレスポンスボディに含まれるページに対して、 ``?body=csrf_token+value%3D0`` といったクエリ文字列を指定したリクエストを攻撃者が利用者に強制できる場合 (GET など副作用のないリクエストに対しては CSRF 対策がされていない場合) に、

.. code-block:: html

    <p class=error>本文が短すぎます</p>
    <form method=post action="/">
        <input type=hidden name=csrf_token value=123456789abcdef>
        <textarea name=body>csrf_token value=0</textarea>
        <input type=submit>
    </form>

というような、リクエストの一部をそのままレスポンスの一部として返したとき (ややわざとらしい感じがありますが)、攻撃者が盗聴して得た暗号化された HTTPS レスポンスの長さが 1024 バイトであるとします。

ここで ``body+value%3D0`` の末尾の ``0`` を ``1`` に変えてリクエストを強制させると、レスポンスは ``<textarea name=body>csrf_token value=1</textarea>`` を含むことになりますが、 ``csrf_token value=1`` は hidden フィールドの一部として既に登場しているため、 HTTP 圧縮によって HTTPS レスポンスの長さが 1024 バイトよりも小さくなります。——というのは極めて単純化した話で、実際にはそう簡単にはいかないようですが (実際に検証しようとしましたが、前提となる知識が足りなすぎて力尽きました……)、レスポンスに含まれる秘密情報と同じ内容を繰り返し登場させた場合とそうでない場合で HTTP 圧縮したレスポンスの長さが変化することを利用して、平文を得ることなくリクエストの一部を推測することができる攻撃です。

これによってセッションベースの CSRF 対策用トークンは破られうるよね、ということで `Django <https://code.djangoproject.com/ticket/20869>`_ や `Rails <https://github.com/rails/rails/pull/11729>`_ なんかでは対策が検討されていたりするようです。

で、ということは、 CSRF 対策用トークンがセッション ID そのものである場合、この攻撃によってセッション ID が盗まれることになるため、セッション cookie を ``secure`` 属性付きで発行している意味がなくなります。

ただ、少なくとも海老原レベルの人間にはまだ有効な exploit code を自前で作れるに至っていない (論文をちゃんと理解できていなくて、 sniff したレスポンスの長さが期待通りに変化しないという問題にぶち当たってから抜け出せていない [#]_ ) のと、 HTML エスケープによって推測に必要な文字列がそのままレスポンスに出力されるのを阻まれることが多そうで、現実にこの攻撃による被害が出てくるのはまだまだ先になるかもしれません。

じゃあ CSRF 対策用トークンはどうしていけばいいか
================================================

まあ、どうすればいいかというと、

    6-(i)-a. (中略) その「hidden パラメータ」に秘密情報が挿入されるよう、前のページを自動生成して、実行ページではその値が正しい場合のみ処理を実行する。 

    (中略) この秘密情報は、セッション管理に使用しているセッション ID を用いる方法の他、セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等が考えられます。

    -- `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版  p. 30 より引用

「セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等」を採用すればいいわけですが、セッション ID とまったく独立した形で生成するというよりは、単にセッション ID を SHA-2 ファミリのハッシュ関数あたりを通してそれを使えばいいかと思います。鍵とか salt とか付きでハッシュ値を得る必要は、少なくともこのエントリの文脈で言えばまあないでしょう。

これによって、前述した BREACH attack を受けた場合も盗まれるのはセッション ID そのものではなくなるため、影響は CSRF どまりで済みます。 BREACH attack そのものへの対策はこのエントリのスコープ外なので、研究者自身により公表されている情報や `JVN で掲載されている情報 <http://jvn.jp/vu/JVNVU94916481/>`_ を参照してください。まあ HTTP 圧縮を無効にするのが一番簡単ですが、それが難しい場合でもお使いのライブラリやフレームワーク側の対策を待って、独自実装には走らないようにするのが無難かなとは思います。

.. [#] え、あれ、一般的ですよね？
.. [#] ブラウザが対応していれば。とはいえ、 `ほとんどのブラウザは対応済み <http://www.browserscope.org/results?category=security>`_ です。
.. [#] ``document.cookie`` にこの種の情報が格納されることを期待した機能 (ブラウザ拡張等も含まれるかもしれない) は動かなくなるくらいです。よっぽど変なブラウザを使っていない限り、 ``HttpOnly`` に未対応でも単に無視されるだけです。
.. [#] この土日結構頑張ったんですけどね……
