$(document).ready(function () {
    browser.storage.local.get("url2hash").then((result) => {
        reset(result.url2hash);
    }).catch((err) => { console.log(err); });
})

var stored_url2hash = {}

function reset(url2hash) {

    stored_url2hash = url2hash
    function logTabs(tabs) {
        let current_url = tabs[0].url
        $("#domain-selector").children("[selected]").text(current_url)

        Object.entries(url2hash).forEach((value) => {
            if (current_url === value[0]) {
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
    Object.entries(hashtable).forEach((value, index) => {
        // siteUrl is key
        // content: {
        //     url1: hash,
        //     url2: hash,
        //     ..........,
        //     title: String,
        //     iconUrl: String,
        // }
        // const [siteUrl, content] = value;
        let str1 = "<tbody><tr><td>" + index + "</td>";
        // let icon = `<td> <img src=${content.iconUrl}> </td>`;
        let str2 = "<td>" + value.title + "</td>"
        let str3 = "<td>" + value[1] + "</td>"
        let str4 = "</tr></tbody>"
        $table.append(str1 + icon + str2 + str3 + str4)
        console.log(value)
    })
}