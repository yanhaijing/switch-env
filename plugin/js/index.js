var errorTpl = template(document.getElementById('errorTpl').innerHTML);
var emptyTpl = template(document.getElementById('emptyTpl').innerHTML);
var linksTpl = template(document.getElementById('linksTpl').innerHTML);
var updateTpl = template(document.getElementById('updateTpl').innerHTML);

function renderError(msg) {
    document.getElementById('error').innerHTML = errorTpl({msg: msg});
}
function renderEmpty(msg) {
    document.getElementById('screen').innerHTML = emptyTpl({msg: msg});
}
function render(data) {
    chrome.tabs.getSelected(null, function (tab) {
        var url = tab.url;

        var res = url.match(/^http(?:s)?:\/\/([^\/]+)/);

        if (!res) {
            renderEmpty('页面未收录');
            return;
        }

        var hostname = res[1];

        var cur;

        var res = data.filter(function (d) {
            return Object.keys(d).some(function (k) {
                if (d[k].indexOf('//' + hostname) !== -1) {
                    cur = k;
                    return true;
                }
                return false;
            })
        })[0];

        if (!res) {
            renderEmpty('页面未收录');
            return;
        }

        var path = url.match(/^http(?:s)?:\/\/[^\/]+([\s\S]*)/)[1];

        var obj = Object.keys(res).reduce(function (a, b) {
            a[b] = {
                cur: cur === b,
                url: res[b] + path
            };
            return a;
        }, {});

        document.getElementById('screen').innerHTML = linksTpl({obj: obj});

        setTimeout(function () {
            var clipboard = new ClipboardJS('.js-copy-btn');

            clipboard.on('success', function(e) {
                notie.alert({ type: 1, time: 1, text: '复制成功' })
            });
        }, 500);
    });
}

function renderUpdate(version, changeLog) {
    var curVersion = '1.2.0';

    if (version === curVersion) return;

    document.getElementById('update').innerHTML = updateTpl({
        curVersion: curVersion,
        lastVersion: version,
        changeLog: changeLog || [],
    });
}

function init() {
    // 加载本地数据
    var data = localStorage.getItem('data');

    if (data) {
        data = JSON.parse(data);

        renderUpdate(data.version, data.changeLog);
        render(data.data);
    }

    // 加载接口数据
    $.ajax({
        url: 'data.json'
    })
    .done(function(ret) {
        if (!ret || !ret.version) {
            renderError('数据格式错误');
            return;
        }

        renderUpdate(ret.version, ret.changeLog);
        render(ret.data);

        localStorage.setItem('data', JSON.stringify(ret));
    })
    .fail(function() {
        renderError('获取数据失败');
    })
}

init();
