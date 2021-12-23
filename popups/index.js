$(document).ready(function () {
    browser.storage.local.get("url2hash").then((result) => {
        reset(result.url2hash);
    }).catch((err) => { console.log(err); });
})

var stored_url2hash = {}

function reset(url2hash) {

    stored_url2hash = url2hash

    var domain


    function logTabs(tabs) {
        for (let tab of tabs) {
            const regex = /(?:[\w-]+\.)+[\w-]+/;
            domain = regex.exec(tab.url);
            if (domain !== null) {
                domain = domain[0]
            }
            $("#domain-selector").children("[selected]").text(domain)
        }

        Object.entries(url2hash).forEach((value) => {
            if (domain === value[0]) {
                refresh_table(value[1])
            }
        })
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let querying = browser.tabs.query({ currentWindow: true, active: true });
    querying.then(logTabs, onError);
}

function refresh_table(hashtable) {
    let $table = $("#site-hash-table")
    $table.children("tbody").remove()
    Object.entries(hashtable).forEach((inner_value, index) => {
        let str1 = "<tbody><tr><td>" + index + "</td>"
        let str2 = "<td>" + inner_value[0] + "</td>"
        let str3 = "<td>" + inner_value[1] + "</td>"
        let str4 = "</tr></tbody>"
        $table.append(str1 + str2 + str3 + str4)
    })
}