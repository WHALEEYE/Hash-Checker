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
const regex = /(?:[\w-]+\.)+[\w-]+/;
function getDomainPart(url) {
    return regex.exec(url);
}
$(document).ready(function () {
    $('[data-bs-toggle="tooltip"]').tooltip()
    $('[data-bs-toggle="tab"]').tab()

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
        let domain = getDomainPart(currentUrl)
        updateHeader(domain, currentTitle, currentIconUrl)
        updateAppList()
        if (database) {
            siteData = database[domain]
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
    $("#site-icon").attr("src", currentIconUrl ? currentIconUrl : "/assets/icons/wa-48.png");
    $("#site-name").text(currentTitle);
}

function hideHashTable() {
    $("#webapp-alert").show()
    $("#site-hash-table").hide()
}

function refreshHashTable(siteData) {

    $("#webapp-alert").hide()
    let $table = $("#site-hash-table");
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
        if (!result) {
            return
        }
        let SiteWithWasm = result.SiteWithWasm
        let $appList = $("#app-list")
        $appList.children("tbody").remove();
        Object.values(SiteWithWasm).forEach((value) => {
            let item = `<tbody><td> <img width="28" height="28" src=${value.iconUrl ? value.iconUrl : "/assets/icons/wa-48.png"} alt=""> ${value.title} </td>`;
            let op = `<td><button type="button" class="btn btn-danger btn-sm">Delete</button></td></tr></tbody>`
            $appList.append(item + op)
        })
        $("button.btn-danger").click(function () {
            $(this).parent().parent().parent().remove()
            remove_app($(this).parent().prev().text())
        })
    })
}

function remove_app(title) {
    title = title.trim()
    browser.storage.local.get("SiteWithWasm").then(result => {
        let SiteWithWasm = result.SiteWithWasm
        if(!SiteWithWasm) return
        let findRes = Object.entries(SiteWithWasm).find(([_key, value]) => { 
            return value.title === title
        })
        if(!result) return
        let [key, _] = findRes
        // key is the domain
        delete SiteWithWasm[key]
        browser.storage.local.set({ 'SiteWithWasm': SiteWithWasm })

        browser.storage.local.get("Database").then(result => {
            let Database = result.Database
            if(Database) {
                delete Database[key]
                browser.storage.local.set({ 'Database': Database })
            }
        })
    })
}