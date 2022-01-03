/**
 * 本脚本支持环境变量 及 说明
 * ADD_COOKIE_NOTIFY   （有用户提交新的CK时是否通知管理员，不配置默认通知，不需要通知请添加环境变量值为 false）
 * UPDATE_COOKIE_NOTIFY （有用户更新的CK时是否通知管理员，不配置默认不通知，不需要通知请添加环境变量值为 true）
 * NVJDC_URL   (Nolan JDC 服务地址，短信登录时需要 配置示例： http://192.168.2.1:9999  )
 * NVJDCQLKey (Nolan JDC 中配置的青龙的QLKey，如果nvjdc没有配置，则不需要配置。)
 **/
require('./env.js');
const $ = new Env('添加并验证Cookie');
let ADD_COOKIE = process.env.ADD_COOKIE;

//用户提交新CK是否通知管理员，默认通知，如果不想通知，添加量子环境变量：ADD_COOKIE_NOTIFY 值 false
let ADD_COOKIE_NOTIFY = true
if (process.env.ADD_COOKIE_NOTIFY) {
    ADD_COOKIE_NOTIFY = process.env.ADD_COOKIE_NOTIFY == "true"
}

//用户更新CK是否通知管理员 量子环境变量：UPDATE_COOKIE_NOTIFY:true
let UPDATE_COOKIE_NOTIFY = false
if (process.env.UPDATE_COOKIE_NOTIFY) {
    UPDATE_COOKIE_NOTIFY = process.env.UPDATE_COOKIE_NOTIFY == "true"
}

let NVJDCStart = process.env.NVJDCStart;
let Phone = process.env.NVJDCPhone;
let VerifyCode = process.env.NVJDCVerifyCode;
let user_id = process.env.user_id;

//nvjdc 服务地址，请添加量子变量或公共变量
let NVJDC_URL = process.env.NVJDC_URL;

// nvjdc 中配置的青龙id
let NVJDCQLKey = process.env.NVJDCQLKey || 0;

$.SendSMSSuccess = false;
$.AutoCaptchaSuccess = false;
$.VerifyCodeSuccess = false;
$.NVJDCMessage = "";
let jdCookies = []
if (process.env.JD_COOKIE) {
    jdCookies = process.env.JD_COOKIE.split("&");
}

var cookies = [];

const { addEnvs, getEnvs, allEnvs, sendNotify
} = require('./quantum');

var pt_key = null;
var pt_pin = null;

!(async () => {
    cookies = ADD_COOKIE.split("&");
    if (NVJDCStart) {
        console.log("NVJDC_URL：" + NVJDC_URL);
        console.log("NVJDCQLKey：" + NVJDCQLKey);
        console.log("NVJDCStart：" + NVJDCStart);
        console.log("Phone：" + Phone);
        console.log("VerifyCode：" + VerifyCode);
        if (!NVJDC_URL) {
            var t = "未配置NVJDC_URL环境变量，无法使用短信登陆服务。";
            console.log(t);
            await sendNotify(t);
            return;
        }
        if (Phone && VerifyCode) {
            var message = `手机号：${Phone}，短信验证码：${VerifyCode}，验证中请骚等。。`
            await sendNotify(message);
            console.log(message)
            await verifyCode();
            if (!$.VerifyCodeSuccess) {
                await sendNotify("短信验证失败，请尝试其他获取方法。");
                return false;
            }
        } else if (Phone) {
            console.log(`收到${user_id}手机号,${Phone}，开始请求nvjdc 服务。`);
            await sendNotify("收到您的手机号了，正在请求。。。");
            await SendSMS();
            for (var i = 0; i < 5; i++) {
                console.log("请求验证滑块第" + (i + 1) + "次。")
                if ($.AutoCaptchaSuccess) {
                    break;
                } else {
                    await AutoCaptcha();
                }
                if ($.NVJDCMessage) {
                    await sendNotify($.NVJDCMessage);
                    return false;
                }
            }
            if (!$.AutoCaptchaSuccess) {
                await sendNotify("获取失败了，请尝试其他CK获取方法吧！");
            }
            else {
                await sendNotify("很好，请回复6位验证码：");
            }
            return false;
        } else {
            await sendNotify("OK，请输入您的手机号码：");
            return;
        }
    } else {
        await sendNotify(`机器人已经收到你提交的CK\r正在进行验证中，请稍后！`)
    }
    console.log("用户指令：" + ADD_COOKIE);
    for (let i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        if (cookie) {
            try {

                pt_key = cookie.match(/pt_key=([^; ]+)(?=;?)/)[1]
                pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
            }
            catch (e) {
                console.log("CK： " + cookie + "格式不对，已跳过");
                continue;
            }
            if (!pt_key || !pt_pin) {
                continue;
            }
            user_id = cookie.match(/qq=([^; ]+)(?=;?)/)
            if (user_id) {
                user_id = user_id[1];
            } else {
                user_id = process.env.user_id;
            }
            //处理pt_pin中带中文的问题
            var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
            if (reg.test(pt_pin)) {
                pt_pin = encodeURI(pt_pin);
            }
            cookie = `pt_key=${pt_key};pt_pin=${pt_pin};`
            $.UserName = pt_pin
            $.UserName2 = decodeURI($.UserName);
            $.index = i + 1;
            $.isLogin = true;
            $.error = '';
            $.NoReturn = '';
            $.nickName = $.UserName2;
            console.log(`开始检测【京东账号${$.index}】${$.UserName2} ....\n`);
            await TotalBean(cookie);
            if ($.NoReturn) {
                await isLoginByX1a0He(cookie);
            } else {
                if ($.isLogin) {
                    if (!$.nickName) {
                        console.log(`获取的别名为空，尝试使用接口2验证....\n`);
                        await isLoginByX1a0He();
                    } else {
                        console.log(`成功获取到别名: ${$.nickName},Pass!\n`);
                    }
                }
            }
            if ($.error) {
                console.log(`Cookie检测请求 有错误，跳出....`);
                TempOErrorMessage = $.error;
                await sendNotify("CK检查异常，请稍后重试！", false)
            } else {
                if ($.isLogin) {
                    cookie = `pt_key=${pt_key};pt_pin=${pt_pin};`
                    var beanNum = ($.beanNum && $.beanNum > 0) ? "\r剩余豆豆：" + $.beanNum : "";
                    var data1 = await allEnvs(pt_key, 2);
                    if (data1.length > 0) {
                        console.log("pt_key重复，已跳过写入环境变量。");
                        await sendNotify(`提交的CK重复啦！`)
                        return;
                    } else {
                        var data2 = await allEnvs(pt_pin, 2);
                        var c = {
                            Name: "JD_COOKIE",
                            Enable: true,
                            Value: cookie,
                            UserRemark: $.nickName,
                            UserId: user_id,
                            EnvType: 2,
                            CommunicationType: 1
                        }
                        if (data2.length > 0) {
                            console.log("pt_pin存在，尝试更新JD_COOKIE");
                            c.Id = data2[0].Id;
                            c.Weight = data2[0].Weight;
                            c.UserRemark = $.nickName;
                            c.QLPanelEnvs = data2[0].QLPanelEnvs;
                            if (UPDATE_COOKIE_NOTIFY) {
                                await sendNotify(`Cookie更新通知
用户ID：${user_id}
pt_pin：${pt_pin}`, true)
                            }
                        } else {
                            c.Id = null;
                            if (ADD_COOKIE_NOTIFY) {
                                await sendNotify(`Cookie新增通知
用户ID：${user_id}
pt_pin：${pt_pin}`, true)
                            }
                            jdCookies.push(cookie)
                            console.log("全新韭菜上线拉！");
                        }
                        console.log("开始提交CK到量子数据库");
                        var data = await addEnvs([c]);
                        console.log("提交结果：" + JSON.stringify(data));
                        if (data.Code != 200) {
                            console.log("addEnvs Error ：" + JSON.stringify(data));
                            await sendNotify(`提交失败辣，pt_pin=${pt_pin}：发生异常，已通知管理员处理啦！`)
                            await sendNotify(`用户ID：${user_id}提交CK pt_pin=${pt_pin}
发生异常，系统错误：${data.Message}。`, true)
                            continue;
                        }
                    }
                    await sendNotify("提交成功啦！\r京东昵称：" + $.nickName + beanNum + '\r京东数量：' + (jdCookies.length), false);
                }
                else {
                    await sendNotify(`提交失败，Cookie无效或已过期，请重新获取后发送。`)
                }
            }
        }
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())


function verifyCode() {
    return new Promise(async resolve => {
        const options = {
            url: NVJDC_URL + "/api/VerifyCode",
            body: JSON.stringify({
                Phone: Phone,
                code: VerifyCode,
                qlkey: NVJDCQLKey,
                QQ: ""
            }),
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log("VerifyCode 请求异常：" + JSON.stringify(err))
                } else {
                    data = JSON.parse(data);
                    if (data.success) {
                        $.VerifyCodeSuccess = true;
                        cookies = [];
                        cookies.push(JSON.stringify(data.data.ck));
                        console.log("VerifyCode Cookie：" + JSON.stringify(data.data.ck))
                        console.log("VerifyCode Success！")
                    } else {
                        console.log("VerifyCode Failed：" + JSON.stringify(err))
                        $.VerifyCodeSuccess = false;
                    }
                }
            } catch (e) {
                sendNotify("请求登录失败了，尝试其他CK获取方式吧！");
                console.log("VerifyCode 请求异常：" + JSON.stringify(e))
            } finally {
                resolve();
            }
        });
    });
}


function SendSMS() {
    return new Promise(async resolve => {
        const options = {
            url: NVJDC_URL + "/api/SendSMS",
            body: JSON.stringify({
                Phone: Phone,
                qlkey: NVJDCQLKey
            }),
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log("SendSMS 请求异常：" + JSON.stringify(err))
                } else {
                    if (data.success) {
                        console.log("NVJDC SendSMS Success")
                        $.AutoCaptchaSuccess = true;
                    } else {
                        console.log("NVJDC SendSMS Failed")
                        $.AutoCaptchaSuccess = false;
                    }
                }
            } catch (e) {
                console.log("SendSMS 请求异常：" + JSON.stringify(e))
            } finally {
                resolve();
            }
        });
    });
}

//nvjdc 自动滑块验证
function AutoCaptcha() {
    return new Promise(async resolve => {
        const options = {
            url: NVJDC_URL + "/api/AutoCaptcha",
            body: JSON.stringify({
                Phone: Phone
            }),
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log("NVJDC AutoCaptcha Error" + JSON.stringify(err))
                } else {
                    data = JSON.parse(data)
                    if (data.success) {
                        console.log("NVJDC AutoCaptcha Success")
                        $.AutoCaptchaSuccess = true;
                    } else {
                        if (data.data.status == 505) {
                            $.NVJDCMessage = data.message;
                        }
                        console.log("NVJDC AutoCaptcha Failed" + JSON.stringify(data))
                        $.AutoCaptchaSuccess = false;
                    }
                }
            } catch (e) {
                console.log("NVJDC AutoCaptcha Exception " + JSON.stringify(e))
            } finally {
                resolve();
            }
        });
    });
}

function TotalBean(cookie) {
    return new Promise(async resolve => {
        const options = {
            url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
            headers: {
                Host: "me-api.jd.com",
                Accept: "*/*",
                Connection: "keep-alive",
                Cookie: cookie,
                "User-Agent": "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                "Accept-Language": "zh-cn",
                "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err)
                    $.nickName = decodeURIComponent($.UserName);
                    $.NoReturn = `${$.nickName} :` + `${JSON.stringify(err)}\n`;
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === "1001") {
                            console.log("TotalBean 检测 CK 过期");
                            $.isLogin = false; //cookie过期
                            $.nickName = decodeURIComponent($.UserName);
                            return;
                        }
                        if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
                            console.log("TotalBean 检测有效");
                            console.log(JSON.stringify(data.data));
                            $.nickName = (data.data.userInfo.baseInfo.nickname) || data.data.userInfo.baseInfo.curPin || $.nickName;
                            pt_pin = data.data.userInfo.baseInfo.curPin || pt_pin;
                        } else {
                            $.nickName = decodeURIComponent($.UserName);
                            console.log("Debug Code:" + data['retcode']);
                            $.NoReturn = `${$.nickName} :` + `服务器返回未知状态，不做变动\n`;
                        }
                        if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("assetInfo")) {
                            $.beanNum = (data.data.assetInfo.beanNum);
                        }
                    } else {
                        $.nickName = decodeURIComponent($.UserName);
                        $.log('京东服务器返回空数据');
                        $.NoReturn = `${$.nickName} :` + `服务器返回空数据，不做变动\n`;
                    }
                }
            } catch (e) {
                $.nickName = decodeURIComponent($.UserName);
                $.logErr(e)
                $.NoReturn = `${$.nickName} : 检测出错，不做变动\n`;
            } finally {
                resolve();
            }
        })
    })
}

function isLoginByX1a0He(cookie) {
    return new Promise((resolve) => {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": cookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
        }
        $.get(options, (err, resp, data) => {
            try {
                if (data) {
                    console.log("isLoginByX1a0He 检测返回数据：" + data)
                    data = JSON.parse(data);
                    if (data.islogin === "1") {
                        $.isLogin = true;
                    } else if (data.islogin === "0") {
                        $.isLogin = false;
                    } else {
                        $.error = `${$.nickName} :` + `使用X1a0He写的接口加强检测: 未知返回...\n`
                    }
                }
            } catch (e) {
                console.log(e);
            } finally {
                resolve();
            }
        });
    });
}

// prettier-ignore
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            } :
                t;
            let s = this.get;
            return "POST" === e && (s = this.post),
                new Promise((e, i) => {
                    s.call(this, t, (t, s, r) => {
                        t ? i(t) : e(s)
                    })
                })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t,
                this.http = new s(this),
                this.data = null,
                this.dataFile = "box.dat",
                this.logs = [],
                this.isMute = !1,
                this.isNeedRewrite = !1,
                this.logSeparator = "\n",
                this.startTime = (new Date).getTime(),
                Object.assign(this, e),
                this.log("", `🔔${this.name}, 开始!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i)
                try {
                    s = JSON.parse(this.getdata(t))
                } catch { }
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20,
                    r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"),
                    n = {
                        url: `http://${h}/v1/scripting/evaluate`,
                        body: {
                            script_text: t,
                            mock_type: "cron",
                            timeout: r
                        },
                        headers: {
                            "X-Key": o,
                            Accept: "*/*"
                        }
                    };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode())
                return {}; {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i)
                    return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r)
                    return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
                    r = s ? this.getval(s) : "";
                if (r)
                    try {
                        const t = JSON.parse(r);
                        e = t ? this.lodash_get(t, i, "") : e
                    } catch (t) {
                        e = ""
                    }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
                    o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t),
                        s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t),
                        s = this.setval(JSON.stringify(o), i)
                }
            } else
                s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"),
                this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
                this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
                t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => { })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
                this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.get(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                    try {
                        if (t.headers["set-cookie"]) {
                            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                            s && this.ckjar.setCookieSync(s, null),
                                e.cookieJar = this.ckjar
                        }
                    } catch (t) {
                        this.logErr(t)
                    }
                }).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                }))
        }
        post(t, e = (() => { })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon())
                this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.post(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                });
            else if (this.isQuanX())
                t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i)
                new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t)
                    return t;
                if ("string" == typeof t)
                    return this.isLoon() ? t : this.isQuanX() ? {
                        "open-url": t
                    } :
                        this.isSurge() ? {
                            url: t
                        } :
                            void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e),
                    s && t.push(s),
                    i && t.push(i),
                    console.log(t.join("\n")),
                    this.logs = this.logs.concat(t)
            }
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]),
                console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
                this.log(),
                (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }
        (t, e)
}

