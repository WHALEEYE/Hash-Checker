// database = {
//     [siteUrl]: {
//         url2hash: {
//             [url1]: hash,
//             [url2]: hash,
//             ..........,
//         },
//         title: String,
//         iconUrl: String,
//     },
//     ......
// }

$(document).ready(function () {
    browser.storage.local.get("Database").then((result) => {
        reset(result.Database);
    }).catch((err) => { console.log(err); });
})

var stored_database = {}

function reset(database) {

    stored_database = database;
    function logTabs(tabs) {
        let currentUrl = tabs[0].url;
        let currentTitle = tabs[0].title;
        let currentIconUrl = tabs[0].favIconUrl;
        $("#site-name").text(currentTitle);
        $("#site-icon").attr("src", currentIconUrl);
        if(database) {
            siteData = database[currentUrl]
            if(siteData) {
                refresh_hash_table(siteData);
                return
            }
        }
        hide_hash_table()
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let querying = browser.tabs.query({ currentWindow: true, active: true });
    querying.then(logTabs, onError);
}

function hide_hash_table() {
    $("#webapp-alert").show()
    $("#site-hash-table").hide()
}

function refresh_hash_table(siteData) {
    $("#webapp-alert").hide()
    let $table = $("#site-hash-table");
    $table.show()
    $table.children("tbody").remove();
    Object.entries(siteData.url2hash).forEach((value, index) => {
        let [url, hash] = value;
        let str1 = `<tbody><tr><td> ${index} </td>`;
        let str2 = `<td> ${url} </td>`;
        let str3 = `<td> ${hash} </td>`;
        let str4 = `</tr></tbody>`;
        $table.append(str1 + str2 + str3 + str4);
    })
}