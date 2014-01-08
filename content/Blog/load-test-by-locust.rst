=============================================
Python 製の負荷試験ツール Locust を試してみた
=============================================

:date: 2014-01-08 17:00:00
:slug: load-test-by-locust

Web の負荷試験ツールとして代表的なのは Apache JMeter だと思いますが、 Apache JMeter 自体が結構重いのと、テストシナリオの保守が GUI ツールでは結構ツライ (シナリオファイルは XML ですが、とても人間が手を加えられるような代物じゃない) なあということで代替となるものを探していました。

で、心惹かれたのが以下のツールです。

* `Gatling <http://gatling-tool.org/>`_
* `Tsung <http://tsung.erlang-projects.org/>`_
* `Locust <http://locust.io/>`_

Gatling は非常によさそうなんですが、うーん要 JDK か……あとは複数台から負荷を掛けることができないというのもちょっとマイナスですね。まあどっちもどうにかしようと思えばどうにかなるポイントではあるんですけど。

Tsung は Erlang 製で、仕事で Erlang 使う可能性も出てくる気がするのでこれで慣れ親しんでおくのもいいかなーと思ってシナリオファイルを覗いてみたら `ド直球の XML <https://github.com/processone/tsung/blob/master/examples/http_simple.xml.in>`_ でした。 Apache JMeter の書き出す XML よりもシンプルで親しみやすいのですが、手で XML を書くのはそれはそれでキツイものがあります。

ということで Locust という Python 製のツールを今回は試してみました。 Locust の特徴が Web サイトのトップで紹介されているので拙訳付きで載せます。

    **Write test scenarios in pure Python (テストシナリオが単純な Python で書ける)**
        No need for clunky UIs or bloated XML, just plain code (使いづらい UI や肥大化した XML はいりません。必要なのはただのコードだけです)

    **Distributed & Scalable (分散型で、スケーラブル)**
         Locust supports running load tests distributed over multiple machines, and can therefore be used to simulate millions of simultaneous users (Locust は複数台による分散した負荷テストをサポートしています。同時に数百万ユーザをシミュレートすることも可能です)

    **Web based UI (Web ベースの UI)**
         Even though all tests are Python code, Locust has a neat web interface that shows relevant test details in real-time during test runs (すべてのテストが Python のコードであるとはいえ、 Locust は実行中のテストをリアルタイムで表示するためのしっかりした Web インターフェースを有しています)

    **Proven (実績)**
         Locust has been used to simulate millions of simultaneous users, swarming a single system  (Locust は単一のシステムに対する数百万ユーザのシミュレートに利用されています)

    -- `Locust - A modern load testing framework <http://locust.io/>`_

Locust のシナリオは DSL ではなく単なる Python ファイルなので、ツールが機能を提供しているかどうかを気にせずに、普通にコーディングしていけるというのは大きな魅力です。

例として、以下の Apache JMeter のシナリオを考えます。

.. code-block:: xml

    <?xml version="1.0" encoding="UTF-8"?>
    <jmeterTestPlan version="1.2" properties="2.4" jmeter="2.9 r1437961">
      <hashTree>
        <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="OpenPNE Stress Test" enabled="true">
          <stringProp name="TestPlan.comments"></stringProp>
          <boolProp name="TestPlan.functional_mode">false</boolProp>
          <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
          <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="TestPlan.user_define_classpath"></stringProp>
        </TestPlan>
        <hashTree>
          <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
            <collectionProp name="Arguments.arguments">
              <elementProp name="OPENPNE_SNS_HOST" elementType="Argument">
                <stringProp name="Argument.name">OPENPNE_SNS_HOST</stringProp>
                <stringProp name="Argument.value">${__P(openpne_sns_host)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="OPENPNE_SNS_PATH" elementType="Argument">
                <stringProp name="Argument.name">OPENPNE_SNS_PATH</stringProp>
                <stringProp name="Argument.value">${__P(openpne_sns_path, /)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="PROTOCOL" elementType="Argument">
                <stringProp name="Argument.name">PROTOCOL</stringProp>
                <stringProp name="Argument.value">http</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="PORT" elementType="Argument">
                <stringProp name="Argument.name">PORT</stringProp>
                <stringProp name="Argument.value">${__P(openpne_port)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </Arguments>
          <hashTree/>
          <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="スレッド数設定" enabled="true">
            <collectionProp name="Arguments.arguments">
              <elementProp name="thread_num" elementType="Argument">
                <stringProp name="Argument.name">thread_num</stringProp>
                <stringProp name="Argument.value">${__P(thread_num, 20)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="loop_num" elementType="Argument">
                <stringProp name="Argument.name">loop_num</stringProp>
                <stringProp name="Argument.value">${__P(loop_num, 5)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="ramp_up" elementType="Argument">
                <stringProp name="Argument.name">ramp_up</stringProp>
                <stringProp name="Argument.value">${__P(ramp_up, 200)}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </Arguments>
          <hashTree/>
          <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="CSV Data Set Config" enabled="true">
            <stringProp name="delimiter">,</stringProp>
            <stringProp name="fileEncoding"></stringProp>
            <stringProp name="filename">data/login.csv</stringProp>
            <boolProp name="quotedData">false</boolProp>
            <boolProp name="recycle">true</boolProp>
            <stringProp name="shareMode">All threads</stringProp>
            <boolProp name="stopThread">false</boolProp>
            <stringProp name="variableNames">account,password</stringProp>
          </CSVDataSet>
          <hashTree/>
          <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Main Thread" enabled="true">
            <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
            <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="ループコントローラ" enabled="true">
              <boolProp name="LoopController.continue_forever">false</boolProp>
              <stringProp name="LoopController.loops">${loop_num}</stringProp>
            </elementProp>
            <stringProp name="ThreadGroup.num_threads">${thread_num}</stringProp>
            <stringProp name="ThreadGroup.ramp_time">${ramp_up}</stringProp>
            <longProp name="ThreadGroup.start_time">1332155895000</longProp>
            <longProp name="ThreadGroup.end_time">1332155895000</longProp>
            <boolProp name="ThreadGroup.scheduler">false</boolProp>
            <stringProp name="ThreadGroup.duration"></stringProp>
            <stringProp name="ThreadGroup.delay"></stringProp>
          </ThreadGroup>
          <hashTree>
            <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP クッキーマネージャ" enabled="true">
              <collectionProp name="CookieManager.cookies"/>
              <boolProp name="CookieManager.clearEachIteration">false</boolProp>
            </CookieManager>
            <hashTree/>
            <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="Start" enabled="true"/>
            <hashTree>
              <DebugSampler guiclass="TestBeanGUI" testclass="DebugSampler" testname="Start" enabled="true">
                <boolProp name="displayJMeterProperties">true</boolProp>
                <boolProp name="displayJMeterVariables">true</boolProp>
                <boolProp name="displaySystemProperties">true</boolProp>
              </DebugSampler>
              <hashTree/>
            </hashTree>
            <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="Login" enabled="true"/>
            <hashTree>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /member/login/authMode/MailAddress" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments"/>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}member/login/authMode/MailAddress</stringProp>
                <stringProp name="HTTPSampler.method">GET</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree/>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="POST /member/login/authMode/MailAddress" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments">
                    <elementProp name="authMailAddress[mail_address]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.name">authMailAddress[mail_address]</stringProp>
                      <stringProp name="Argument.value">${account}</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                    </elementProp>
                    <elementProp name="authMailAddress[password]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.value">${password}</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                      <stringProp name="Argument.name">authMailAddress[password]</stringProp>
                    </elementProp>
                  </collectionProp>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}member/login/authMode/MailAddress</stringProp>
                <stringProp name="HTTPSampler.method">POST</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree/>
            </hashTree>
            <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="Home" enabled="true"/>
            <hashTree>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments"/>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}</stringProp>
                <stringProp name="HTTPSampler.method">GET</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <stringProp name="HTTPSampler.implementation">Java</stringProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree/>
            </hashTree>
            <GenericController guiclass="LogicControllerGui" testclass="GenericController" testname="Diary" enabled="true"/>
            <hashTree>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /diary/listMember" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments"/>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}diary/listMember</stringProp>
                <stringProp name="HTTPSampler.method">GET</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <stringProp name="HTTPSampler.implementation">Java</stringProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree/>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /diary/new" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments"/>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}diary/new</stringProp>
                <stringProp name="HTTPSampler.method">GET</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <stringProp name="HTTPSampler.implementation">Java</stringProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree>
                <XPathExtractor guiclass="XPathExtractorGui" testclass="XPathExtractor" testname="Extract CSRF Token for post" enabled="true">
                  <stringProp name="XPathExtractor.default"></stringProp>
                  <stringProp name="XPathExtractor.refname">csrf_token</stringProp>
                  <stringProp name="XPathExtractor.xpathQuery">//input[@id=&quot;diary__csrf_token&quot;]/@value</stringProp>
                  <boolProp name="XPathExtractor.validate">false</boolProp>
                  <boolProp name="XPathExtractor.tolerant">true</boolProp>
                  <boolProp name="XPathExtractor.namespace">false</boolProp>
                  <stringProp name="Scope.variable">csrf_token</stringProp>
                  <boolProp name="XPathExtractor.fragment">true</boolProp>
                  <boolProp name="XPathExtractor.show_warnings">true</boolProp>
                  <boolProp name="XPathExtractor.report_errors">true</boolProp>
                </XPathExtractor>
                <hashTree/>
              </hashTree>
              <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="POST /diary/create" enabled="true">
                <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="ユーザー定義変数" enabled="true">
                  <collectionProp name="Arguments.arguments">
                    <elementProp name="diary[title]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.value">日記タイトル by ${account}</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                      <stringProp name="Argument.name">diary[title]</stringProp>
                    </elementProp>
                    <elementProp name="diary[body]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.value">日記本文 by ${account}</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                      <stringProp name="Argument.name">diary[body]</stringProp>
                    </elementProp>
                    <elementProp name="diary[public_flag]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.value">1</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                      <stringProp name="Argument.name">diary[public_flag]</stringProp>
                    </elementProp>
                    <elementProp name="diary[_csrf_token]" elementType="HTTPArgument">
                      <boolProp name="HTTPArgument.always_encode">false</boolProp>
                      <stringProp name="Argument.value">${csrf_token}</stringProp>
                      <stringProp name="Argument.metadata">=</stringProp>
                      <boolProp name="HTTPArgument.use_equals">true</boolProp>
                      <stringProp name="Argument.name">diary[_csrf_token]</stringProp>
                    </elementProp>
                  </collectionProp>
                </elementProp>
                <stringProp name="HTTPSampler.domain">${OPENPNE_SNS_HOST}</stringProp>
                <stringProp name="HTTPSampler.port">${PORT}</stringProp>
                <stringProp name="HTTPSampler.connect_timeout"></stringProp>
                <stringProp name="HTTPSampler.response_timeout"></stringProp>
                <stringProp name="HTTPSampler.protocol">${PROTOCOL}</stringProp>
                <stringProp name="HTTPSampler.contentEncoding"></stringProp>
                <stringProp name="HTTPSampler.path">${OPENPNE_SNS_PATH}diary/create</stringProp>
                <stringProp name="HTTPSampler.method">POST</stringProp>
                <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
                <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
                <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
                <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
                <boolProp name="HTTPSampler.monitor">false</boolProp>
                <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
              </HTTPSamplerProxy>
              <hashTree/>
            </hashTree>
          </hashTree>
        </hashTree>
      </hashTree>
    </jmeterTestPlan>

このシナリオでやっていることは、

* CSV からアカウント情報を読み取り、
* ログインし、
* ホーム画面にアクセスし、
* 日記を書く

というのを 20 ユーザで 5 回繰り返すというものになります。これだけのものでも、やっぱりどうしても大仰になりますね。

このシナリオに沿う形で Locust のコードを書いてみました (未リリース版の 0.7 を前提にしています)。以下のような感じです。

.. code-block:: python

    # -*- coding: utf-8 -*-

    from locust import HttpLocust, TaskSet, task, runners, events, log
    from locust.exception import StopLocust
    from pyquery import PyQuery
    import csv, itertools
    import logging

    # 各行にアカウント情報を記載した CSV を読み込む (最終行まで到達したら先頭に戻るように itertools.cycle() でラップする)
    account_csv_reader = itertools.cycle(csv.reader(open("./data/login.csv", "r")))

    logger = logging.getLogger("my_logger")

    class MainTaskSet(TaskSet):
        count = 0
        account = ""
        password = ""

        def on_start(self):
            """
            タスクセットの開始時に呼ばれるメソッド (繰り返し時には呼ばれない)
            """

            # アカウント情報を記載した CSV から一行読み込み、その情報を用いてログイン
            self.account, self.password = account_csv_reader.next()
            self.login()

        def login(self):
            """
            ログイン処理を定義した独自のメソッド
            この例ではタスクセットの開始時のみ呼ばれる
            """

            logger.info("Login as " + self.account)

            self.client.post("/member/login/authMode/MailAddress", {
                "authMailAddress[mail_address]" : self.account,
                "authMailAddress[password]" : self.password,
            })

        @task
        def stop(self):
            """
            タスクセットの終了判定をおこなうためのタスク
            すべての hatching が開始していない状態 (state が STATE_RUNNING でない状態) の場合は何もしない
            """

            if runners.locust_runner.state != runners.STATE_RUNNING:
                return

            self.count += 1

            # hatching が完了した後の 5 回目のループが完了している場合は終了させる
            if (self.count > 5):
                logger.info("%r : stopped" % self)
                raise StopLocust()

            logger.info("%r : started round #%d" % (self, self.count))

        @task
        def home(self):
            """
            ホーム画面へのリクエストをおこなうタスク
            """

            self.client.get("/")

        @task
        def diary(self):
            """
            日記関連画面へのリクエストをおこなうタスク
            """

            self.client.get("/diary/listMember")

            # /diary/new のレスポンスをスクレイピングして CSRF 対策用トークンの値を取得する
            r = self.client.get("/diary/new")
            q = PyQuery(r.content)
            csrf_token = q("#diary__csrf_token").attr('value')

            # 取得した CSRF 対策用トークンを用いて日記を投稿する
            r = self.client.post("/diary/create", allow_redirects=False, data={
                "diary[title]" : u"日記タイトル by " + self.account,
                "diary[body]" : u"日記本文 by " + self.account,
                "diary[public_flag]" : "1",
                "diary[_csrf_token]" : csrf_token,
            })
            self.client.get(r.headers["location"], name="/diary/{id}")

    class WebsiteUser(HttpLocust):
        task_set = MainTaskSet

Locust ではタスクセット (シナリオの集まりみたいな感じです) が繰り返し実行されるため、 Apache JMeter にあわせるために、終了条件判定用のタスク ``stop()`` を記述しました。この中身を見てもらえばわかると思いますが、 hatch (同時アクセスクライアントの生成) がすべて完了するまではステータスが ``STATE_RUNNING`` にならず、組み込みのテストランナー (差し替えは可能です) が `hatching 完了時点でそれまでのすべてのテスト結果を一度クリアしてしまう <https://github.com/locustio/locust/issues/91>`_ ので、 hatch 完了後の 5 回のループ実行後に終了させるようにしています。

ただの Python スクリプトなので、以下のようにして共通処理をスーパークラスに逃がす形に変更することもできます (タスクはまったくの独立したクラスや関数に逃がしてから、属性として指定することもできます)。 CSRF 対策用トークンの抽出のように、特定のプロジェクトやフレームワークに固有の処理を共通化できるのは大きな魅力です。

.. code-block:: python

    class MainTaskSet(MyBaseTaskSet):
        @task
        def home(self):
            """
            ホーム画面へのリクエストをおこなうタスク
            """

            self.client.get("/")

        @task
        def diary(self):
            """
            日記関連画面へのリクエストをおこなうタスク
            """

            self.client.get("/diary/listMember")

            # /diary/new のレスポンスをスクレイピングして CSRF 対策用トークンの値を取得する
            r = self.client.get("/diary/new")
            csrf_token = self.extract_csrf_token(r, "diary")

            # 取得した CSRF 対策用トークンを用いて日記を投稿する
            r = self.client.post("/diary/create", allow_redirects=False, data={
                "diary[title]" : u"日記タイトル by " + self.account,
                "diary[body]" : u"日記本文 by " + self.account,
                "diary[public_flag]" : "1",
                "diary[_csrf_token]" : csrf_token,
            })
            self.client.get(r.headers["location"], name="/diary/{id}")

スクリプトは、 ``locustfile.py`` というファイル名で保存しておけば、 ``locust`` コマンドを叩くだけで実行できます (もしくは ``--locustfile`` オプションによって指定します)。

.. code-block:: console

    $ locust -H http://localhost
    [2014-01-08 15:28:13,853] localhost/INFO/locust.main: Starting web monitor at *:8089
    [2014-01-08 15:28:13,855] localhost/INFO/locust.main: Starting Locust 0.7.0

これで Web インターフェースが使えるようになります (面白いことに、この Web インターフェースも拡張可能です)。この画面で、ユーザ数と、秒間のユーザ生成数を指定して……

.. image:: /images/start-locust.png
    :alt: Locust の Web インターフェースの初期画面
    :width: 40%
    :target: /images/start-locust.png

負荷試験がはじまります。結果は逐一更新されていきます。

.. image:: /images/running-locust.png
    :alt: Locust の Web インターフェースの実行中画面
    :width: 40%
    :target: /images/running-locust.png

もちろん、 Web インターフェースを使わずにコマンドラインで完結させることもできます。 CI とかで回すときにはこっちを使うことになるでしょう。

.. code-block:: console

    $ locust -H http://localhost --no-web -c 20 -r 2
    [2014-01-08 15:57:28,910] ebisen.local/INFO/locust.main: Starting Locust 0.7.0
    [2014-01-08 15:57:28,913] ebisen.local/INFO/locust.runners: Hatching and swarming 20 clients at the rate 2 clients/s...

と、割といい感じなのですが、極めて致命的なのが試験結果の出力です。最終的に出力される結果がこんな感じで、扱いにくいことこの上ないです::

    [2014-01-08 16:31:19,114] ebisen.local/INFO/locust.main: Shutting down, bye..
     Name                                                          # reqs      # fails     Avg     Min     Max  |  Median   req/s
    --------------------------------------------------------------------------------------------------------------------------------------------
     GET /                                                            165     0(0.00%)    3603       0   47678  |    3400    0.40
     POST /diary/create                                               125     0(0.00%)     868       0    1868  |     810    0.20
     GET /diary/listMember                                            125     0(0.00%)    1755       0    3606  |    1700    0.20
     GET /diary/new                                                   125     0(0.00%)    1615       0    3935  |    1700    0.20
     GET /diary/{id}                                                  125     0(0.00%)    1664       0    3347  |    1600    0.20
    --------------------------------------------------------------------------------------------------------------------------------------------
     Total                                                            665     0(0.00%)                                       1.20
    
    Percentage of the requests completed within given times
     Name                                                           # reqs    50%    66%    75%    80%    90%    95%    98%    99%   100%
    --------------------------------------------------------------------------------------------------------------------------------------------
     /                                                                 165   3400   3900   4600   4900   5500   6100   6100   6300  47678
     /diary/create                                                     125    810   1000   1200   1200   1400   1600   1600   1600   1868
     /diary/listMember                                                 125   1700   2000   2100   2500   2700   3000   3300   3600   3606
     /diary/new                                                        125   1700   1900   2100   2200   2500   2800   2900   3000   3935
     /diary/{id}                                                       125   1600   2000   2100   2300   2600   2900   3200   3300   3347
    --------------------------------------------------------------------------------------------------------------------------------------------

というかそもそも全リクエストの統計じゃなくて各リクエスト毎の結果がほしい……欲を言えば Jenkins の Performance Plugin がパースできるように Apache JMeter か JUnit の形式で出力してほしい……

Python スクリプトからリクエスト成功時のイベントは取れるので、以下のように書けばそれっぽい XML を出力することはできそうでした。でもこの程度の機能は標準で持っていてほしいですね。 Pull Request してみるかー (といっても完全に互換なログを出すにはイベントから渡ってくる情報が足りていないのでそこからどうにかしないと)。

.. code-block:: python

    def output_request_log_as_jmeter_format(request_type, name, response_time, response_length, **kw):
        timestamp = int(time.time() * 1000)
        logfile.write("<httpSample t='%d' lt='%d' ts='%d' s='true' lb='%s %s' rc='200' rm='OK' tn='' dt='text' by='%d'/>\n" % (response_time, response_time, timestamp, request_type, name, response_length))

    events.request_success += output_request_log_as_jmeter_format

この XML 形式であればもちろん Apache JMeter で結果表示することもできるので楽しいです。

.. image:: /images/locust-result-in-jmeter.png
    :alt: 独自で書きだしたリクエストログを Apache JMeter でグラフ表示させた結果
    :width: 40%
    :target: /images/locust-result-in-jmeter.png

まあ個人的な好みで言えばあんまり全部入りみたいな感じのツールは好きじゃないですし、足りないところを自分で書くのも抵抗がないので、このくらいのツールの方が海老原には合っているのかなーと感じました。

ということでしばらく使ってみることにします。みなさんもよろしかったらどうぞ (ただしドキュメントは結構足りてません。たとえば先述のコードで ``StopLocust`` とかいう例外を普通に使っていますが、これは undocumented です。現状は、英語のドキュメントを読むよりコードを読む方が楽だわいという俺みたいな人間向けのツールといえるでしょう)。
