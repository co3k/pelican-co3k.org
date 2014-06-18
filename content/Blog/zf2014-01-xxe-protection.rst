==============================================================================
Zend Framework の XXE 脆弱性対策 (ZF2014-01) と zendframework/ZendXml のススメ
==============================================================================

:date: 2014-06-18 08:35:00
:slug: zf2014-01-xxe-protection

もはや PHP まったく書いてないのに PHP 関係のエントリばかりが増えていくというのは奇妙なものですね。

さて、今年の 2 月に Zend Framework より公開された以下のアドバイザリについては皆様すでにチェック済みのことでしょう。

ZF2014-01: Potential XXE/XEE attacks using PHP functions: simplexml_load_*, DOMDocument::loadXML, and xml_parse
    http://framework.zend.com/security/advisory/ZF2014-01

僕自身は Zend Framework を使っていなかったので、「あーなんか XXE [#]_ への対策漏れしている場所とかあったのかなー」とかなんとかでよく読まずにスルーしていたのですが、最近になって調べてみたところどうもそういう話ではなく、 `PHP::Bug #64938 <https://bugs.php.net/bug.php?id=64938>`_ のバグの影響で PHP-FPM 利用時に ``libxml_disable_entity_loader()`` が効かない (より正確には、設定値がスレッド間で共有されてしまう) ことがあるという問題への対策ということのようで。

PHP における XXE 対策としては、一般的に、外部エンティティローダの利用を意図しない XML 読み込み時に ``libxml_disable_entity_loader(true)`` のコールによって外部エンティティローダを無効にし、 XML の読み込みが完了した後には元の設定値に戻す、というようなことがおこなわれています。って言葉で説明してもわかりにくいですね。ざっくりしたコード例を示すと以下のようになります。

.. code-block:: php

    <?php
    $old = libxml_disable_entity_loader(true);  // 外部エンティティローダを無効に + 変更前の設定値 (デフォルトは false) を取得
    $xml = new SimpleXMLElement($content);  // XML コンテンツの読み込み
    libxml_disable_entity_loader($old);  // 変更前の設定値に戻す

ということで頻繁に ``libxml_disable_entity_loader()`` が ``true`` になったり ``false`` になったりするので、これがスレッド間で共有されると XXE 対策が無力化する可能性がある、というものです。うーむ、 PHP-FPM ……

んでもってこの PHP-FPM のバグが 2013-05-28 に報告されてからまったく修正される気配がないために、 Zend Framework 側で回避策を採るようにしたようです。その回避策というのが、

> We perform a search inside the XML string to find usage of any <!ENTITY" element, and, on detection, raise an exception.

ということで XML 中に ``<!ENTITY`` が含まれる場合は例外を投げるようにしたわけですね。まあ妥当な対応だと思います。

zendframework/ZendXml のススメ
==============================

んでもって、一応 ZF2014-01 の修正差分をチェックしていて気がついたのですが、 ZF1 と ZF2 だけでなく ZendService_* や ZendRest、ZendOpenId などの複数のプロジェクト間で (つまり XML を扱うプロジェクトすべてで) 対策を実施する必要があるために、 XML パース処理を独立したライブラリとして切り出し、それを利用する形に変更したようです。まあ ``<!ENTITY`` のマッチングとか泥臭いことをベタ書きしていくとかいうのはそろそろ馬鹿馬鹿しい感じですしね……。

で、そのライブラリというのが https://github.com/zendframework/ZendXml/ になります。こいつをインストールしてきて、以下のように使うだけです。依存ライブラリ等はまったくないのでお手軽でいい感じです。

.. code-block:: php

    <?php
    use ZendXml\Security as XmlSecurity;

    $xml = XmlSecurity::scan($content);  // SimpleXML
    $dom = XmlSecurity::scan($content, new \DOMDocument());  // DOMDocument

見ておわかりのとおり、渡された XML 文字列を検証した結果、問題なさそうなら、 ``SimpleXML`` か ``DOMDocument`` のインスタンスが返ってくるというだけのものですので、 XML をパースする部分をほぼコレに置き換えるのも容易かと思います。 PHP での XML 読み込みにあたっては ``simplexml_load_file()`` のように XML 文字列ではなく XML までのファイルパス (や URL) を受け付ける関数も存在しますが、 `PHP カンファレンス 2013 での海老原の発表資料にもあるように <http://www.slideshare.net/ebihara/phpcon-2013xmlphpvuln/78>`_ 外部エンティティローダを無効にしていると ``simplexml_load_file()`` のような関数も機能しなくなるため、 XXE 対策を実施しなければならない状況 (対策済みの libxml2 を使っていない環境) において、パース前に事前に XML 文字列を読み込んでおくことはもともと必須です。

いままでは XXE 対策用の独立したライブラリというのはなかったので、とりあえず人には CakePHP の https://github.com/cakephp/cakephp/blob/2.5.2/lib/Cake/Utility/Xml.php#L120-L152 を参考にすることを勧めていたりしたのですが、オプション周りが PHP らしいというか CakePHP らしいというかで、独立して流用したりするには微妙に扱いにくかったりで少々不満がないでもありませんでした。

`PHP::Bug #64938 <https://bugs.php.net/bug.php?id=64938>`_ というなんとも微妙なバグのせいで七面倒くさいことになってしまいましたが、そのおかげで zendframework/ZendXml が出てきたことは喜ばしいことです。まあ地味なライブラリではありますし、 XXE という脆弱性もマイナーなまま死にゆく運命にあるものですが、有用であることには違いないですしもっと積極的にアピールすればいいのに。

ということで、みなさんも XML をパースする際には是非 zendframework/ZendXml をご活用ください。あるいは XML をご活用するのをおやめください。

.. [#] XXE についてご存じない方は、手前味噌ではありますが `PHP カンファレンス 2013 の海老原の発表資料 <http://www.slideshare.net/ebihara/phpcon-2013xmlphpvuln>`_ をご覧いただけるとよろしいかと思います。
