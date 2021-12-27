
const got = require('got');
//------------- 量子助手系统环境变量部分 -------------
let serverAddres = process.env.serverAddres; //服务地址
let CommunicationType = process.env.CommunicationType; //通讯类型
let CommunicationId = process.env.CommunicationId; //通讯工具ID
let TextToPicture = process.env.TextToPicture; // 是否文字转图片
let user_id = process.env.user_id; //用户id
let group_id = process.env.group_id; //群组ID
let ManagerQQ = process.env.ManagerQQ; //管理员QQ
let EnableConc = process.env.EnableConc == "True"; //是否开启并发
let IsSystem = process.env.IsSystem == "true"; //是否系统执行。
//------------- 量子助手系统环境变量部分 -------------
let prefixUrl = process.env.serverAddres || 'http://localhost:5088';

const api = got.extend({
    prefixUrl: prefixUrl,
    retry: { limit: 0 },
});

// 获取青龙面板信息
module.exports.getQLPanels = async () => {
    const body = await api({
        url: 'api/QLPanel',
        headers: {
            Accept: 'text/plain',
        },
    }).json();
    return body.Data;
};

/**
 * 获取青龙容器中的环境变量
 * @param {any} qlPanel
 */
module.exports.getQLEnvs = async (ql, searchValue) => {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        method: 'get',
        searchParams: {
            searchValue: searchValue,
            t: Date.now(),
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data.data;
};


// 同步环境变量
module.exports.syncEnv = async () => {
    const body = await api({
        url: 'api/env/sync',
        method:"get",
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json"
        },
    }).json();
    return body.Data;
};

/**
 * 删除青龙环境变量
 * @param {any} ql
 * @param {any} ids
 */
module.exports.deleteQLEnvs = async (ql, ids) => {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        body: JSON.stringify(ids),
        method: 'delete',
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    return body.Data;
};

/**
 * 直接添加环境变量到青龙容器
 * @param {any} ql
 * @param {any} envs
 */

module.exports.addQLEnvs = async (ql, envs) => {
    const body = await api({
        url: 'api/qlPanel/envs/' + ql.Id,
        body: JSON.stringify(envs),
        method: 'post'
    }).json();
    return body.Data;
};


/**
 * 添加环境变量（数组）
 * @param {any} env
 */
module.exports.addEnvs = async (env) => {
    const body = await api({
        url: 'api/env',
        method: 'post',
        body: JSON.stringify(env),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
};

/**
 * 禁用环境变量，数组
 * @param {any} envs
 */
module.exports.disableEnvs = async (envs) => {
    const body = await api({
        url: 'api/env/DisableEnvs',
        method: 'put',
        body: JSON.stringify(envs),
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body;
}

/**
 * 获取环境变量信息，包含和青龙的关系数据
 * @param {any} key
 * @param {any} envType
 * @param {any} enable
 * @param {any} qlPanelId
 */
module.exports.allEnvs = async (key, envType, enable, qlPanelId) => {
    const body = await api({
        url: 'api/env',
        method: 'get',
        searchParams: {
            key: key,
            envType: envType,
            enable: enable,
            qlPanelId: qlPanelId,
            PageIndex: 1,
            PageSize: 999999999
        },
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data.Data;
};


/**
 * 获取环境变量
 * @param {any} name 环境变量名称，全匹配 允许空
 * @param {any} key 环境变量值，模糊匹配 允许空
 * @param {any} envType 环境变量类型 允许空
 */
module.exports.getEnvs = async (name, key, envType) => {
    const body = await api({
        url: 'api/env/Query',
        method: 'get',
        searchParams: {
            key: key,
            name: name,
            envType: envType,
            t: Date.now(),
        },
        headers: {
            Accept: 'text/plain',
            "Content-Type": "application/json-patch+json"
        },
    }).json();
    return body.Data;
};

/**
 * 发送通知消息
 * @param {any} content 发送消息内容
 * @param {any} isManager 是否发送给管理员
 */
module.exports.sendNotify = async (content, isManager) => {
    if (serverAddres && CommunicationType && CommunicationId) {
        const body = await api({
            url: `api/Notifiy`,
            method: 'post',
            body: JSON.stringify({
                message: `${content}`,
                CommunicationType: CommunicationType, //通讯工具-来源于系统环境变量
                CommunicationId: CommunicationId, //通讯工具id，来源于系统环境变量
                TextToPicture: TextToPicture, //图片转文字，来源于系统环境变量
                user_id: isManager ? ManagerQQ : user_id, //图片转文字，来源于系统环境变量
                group_id: isManager ? 0 : group_id //图片转文字，来源于系统环境变量
            }),
            headers: {
                Accept: 'text/plain',
                "Content-Type": "application/json-patch+json"
            },
        }).json();
        if (body.Data) {
            console.log('发送通知消息成功🎉！');
        }
        else {
            console.log(`发送通知消息异常\n${JSON.stringify(body)}`,);
        }
    }
}

