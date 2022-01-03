require('./env.js');
const moment = require('moment');
const {
    sendNotify, getEnvs
} = require('./quantum');

let user_id = process.env.user_id; //用户id
!(async () => {
    if (!user_id) {
        return;
    }
    console.log("user_id:" + user_id);
    var cks = await getEnvs("JD_COOKIE", "pt_key", 2, user_id)
    var message = "";
    if (cks.length > 0)
        message = `您一共绑定了${cks.length}个狗东：`;
    else
        message = "您没有绑定账号。"
    for (var i = 0; i < cks.length; i++) {
        var ck = cks[i];
        console.log(ck);
        var name = ck.UserRemark || ck.Value.match(/pt_pin=([^; ]+)(?=;?)/) && ck.Value.match(/pt_pin=([^; ]+)(?=;?)/)[1];
        console.log(name);
        var overdueDate = moment(ck.UpdateTime).add(30, 'days');
        console.log(overdueDate);
        var day = overdueDate.diff(new Date(), 'day');
        console.log(day);
        message += `\n${(i + 1)}：${name}，${(ck.Enable ? `有效✅，预计${day}后失效。` : '失效❌，请重新获取提交。')}`
        console.log(message);
    }
    console.log(message);
    await sendNotify(message);
})().catch((e) => {
    console.log(e);
});