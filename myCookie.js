require('./env.js');
const moment = require('moment');
const {
    sendNotify, getEnvs
} = require('./quantum');

let user_id = process.env.user_id || '179100150'; //用户id
!(async () => {
    var cks = await getEnvs("JD_COOKIE", "pt_key", 2, user_id)
    var message = `您一共绑定了${cks.length}个狗东：`;
    for (var i = 0; i < cks.length; i++) {
        var ck = cks[i];
        var name = ck.UserRemark || cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1];
        var overdueDate = moment(ck.UpdateTime).add(30, 'days');
        var day = overdueDate.diff(new Date(), 'day');
        message += `\n${(i + 1)}，${name}，${(ck.Enable ? `有效✅，预计${day}后失效。` : '失效❌，请重新获取提交。')}`
    }
    console.log(message);
    await sendNotify(message);
})().catch((e) => {
    console.log("获取我的账号失败：" + JSON.stringify(e));
});
