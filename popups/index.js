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
        updateHeader(currentUrl, currentTitle, currentIconUrl)
        updateAppList()
        if (database) {
            siteData = database[currentUrl]
            if (siteData) {
                refreshHashTable(siteData);
                return
            }
        }
        hideHashTable()
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let querying = browser.tabs.query({ currentWindow: true, active: true });
    querying.then(logTabs, onError);
}

function updateHeader(currentUrl, currentTitle, currentIconUrl) {
    $("#site-icon").attr("src", currentIconUrl);
    $("#site-name").text(currentTitle);
}

function hideHashTable() {
    $("#webapp-alert").show()
    $("#site-hash-table").hide()
}

function refreshHashTable(siteData) {
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

function updateAppList() {
    browser.storage.local.get("SiteWithWasm").then(result => {
        let SiteWithWasm = result.SiteWithWasm
        let appList = $("#app-list ul")
        appList.children().remove()
        Object.entries(SiteWithWasm).forEach(([key, value]) => {
            let item = `<li><img src=${value.iconUrl} alt="">${value.title}</li>`
            console.log(item)
            appList.append(item)
        })
        console.log(appList)
    })
}