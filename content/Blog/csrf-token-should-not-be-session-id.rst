===============================================================================
CSRF 対策用トークンの値にセッション ID そのものを使ってもいい時代は終わりました
===============================================================================

:date: 2014/02/17 08:30:00
:slug: csrf-token-should-not-be-session-id
:status: Draft

さて、 CSRF 対策は攻撃者の知り得ない秘密情報をリクエストに対して要求すればよく、そのような用途としてはセッション ID がお手軽でいいよねという時代があったかと思います。

いや、もちろん、 CSRF 対策の文脈だけで言えば今も昔も間違いというわけではありません。セッション ID が秘密情報であるのは Web アプリケーションにおいて当然の前提ですので、 CSRF 対策としてリクエストに求めるべきパラメータとしての条件はたしかに満たしています。

たとえば `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版では以下のように解説されています。

    6-(i)-a. (中略) その「hidden パラメータ」に秘密情報が挿入されるよう、前のページを自動生成して、実行ページではその値が正しい場合のみ処理を実行する。 

    (中略) この秘密情報は、セッション管理に使用しているセッション ID を用いる方法の他、セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等が考えられます。

    -- `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版  p. 30 より引用

ですが、いくら CSRF 対策になるとはいっても、 CSRF 対策用トークンとしてセッション ID そのものを使うのはもうやめた方がいいですよ、というのを書いていきます。

なぜセッション ID を使ってはいけないか
======================================

理由は、 **セッション cookie に対する HttpOnly 属性の利用が一般的になってきたから** です [#]_ 。

セッション cookie に ``HttpOnly`` 属性が指定されていれば、サイトに XSS 脆弱性があった場合でも、スクリプト経由で cookie 値に含まれるセッション ID を盗むことはできなくなります [#]_ 。

ですが、 CSRF 対策用トークンがセッション ID そのものだと、 DOM ツリー上に存在する「hidden パラメータ」に CSRF 対策用トークン (= セッション ID) が含まれることになりますので、 XSS 攻撃によってこの値を盗み取り、セッションハイジャック攻撃に繋げることができてしまいます。つまり、セッション cookie に ``HttpOnly`` 属性を指定している意味がほとんどなくなります。

当たり前の話ではあるのですが、セッション cookie 発行部分と CSRF 対策部分を別々の人間が開発していたりとか、レビュー用のチェックリストが別々の項目になっていて見逃されてたりとか、 ``php.ini`` で ``session.cookie_httponly`` が ``true`` になっているのに気がついていないとか、このあたりの足並みが揃っていないみたいのは案外ありうるんじゃないかと思って書いてみました。

あと、いま思い出したんですけど、別に XSS 脆弱性がなかったとしても、 HTTPS コンテンツを gzip 圧縮していて `BREACH <http://breachattack.com/>`_ の影響を受ける場合、盗まれる CSRF 対策トークンはセッション ID なので、 SSL 用のセッション cookie に ``secure`` 属性を付けているにもかかわらず、そこからセッション ID が盗まれるみたいなことはありそうですね。試してないけど……。

まあ、とりあえず、、ここまでで、「あー」と思った人は自分のサイトとかもろもろを再点検すればいいだけの話です。以上です。お疲れ様でした。

ここからは、「 ``HttpOnly`` 属性とかなんぞや」みたいな人向けの解説を書いていこうと思います。

HttpOnly 属性とは
-----------------

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

これで ``document.cookie`` からはセッション ID は取得できなくなりますが、 CSRF 対策トークンのほうはもちろん DOM ツリー上にあるので取得することができます。で、これがセッション ID だと ``HttpOnly`` で参照できないようにしている意味があんまりなくね、というだけの話です。

じゃあ CSRF 対策用トークンはどうすればいいか
--------------------------------------------

まあ、

    6-(i)-a. (中略) その「hidden パラメータ」に秘密情報が挿入されるよう、前のページを自動生成して、実行ページではその値が正しい場合のみ処理を実行する。 

    (中略) この秘密情報は、セッション管理に使用しているセッション ID を用いる方法の他、セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等が考えられます。

    -- `『安全なウェブサイトの作り方』 <https://www.ipa.go.jp/security/vuln/websecurity.html>`_ 改訂第6版  p. 30 より引用

「セッション ID とは別のもうひとつの ID（第 2 セッション ID）をログイン時に生成して用いる方法等」なわけですが、難しいこと考えずにセッション ID を SHA-2 ファミリのハッシュ関数あたりを通してそれを使えばいいんじゃね (鼻をほじりながら)。

鍵とか salt とか付きでハッシュ値を得る必要は、少なくともこのエントリの文脈で言えばまあないと思います。前述したような BREACH の対策をしたいよみたいな人は好きにすればいいんじゃないかと思いますが、だからといって独自実装に走るのはどうかと思いますのではい。

.. [#] え、あれ、一般的ですよね？
.. [#] ブラウザが対応していれば。とはいえ、 `ほとんどのブラウザは対応済み <http://www.browserscope.org/results?category=security>`_ です。
.. [#] ``document.cookie`` にこの種の情報が格納されることを期待した機能 (ブラウザ拡張等も含まれるかもしれない) は動かなくなるくらいです。よっぽど変なブラウザを使っていない限り、 ``HttpOnly`` に未対応でも単に無視されるだけです。
