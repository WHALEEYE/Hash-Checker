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
const PortSend = browser.runtime.connect({name:"port-from-index"});
function getDomainPart(url) {
	let domain = regex.exec(url);
	if (domain) {
		return domain[0]
	} else {
		return null
	}
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
        if(!domain) {
            return
        }
        updateHeader(domain, currentTitle, currentIconUrl)
        updateAppList()
        if (database) {
            siteData = database[domain]
            console.log(siteData)
            console.log(domain)
            console.log(database)
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
    let $table = $("#site-hash-table tbody");
    $table.empty();
    Object.entries(siteData.url2hash).forEach((value, index) => {
        let [url, hash] = value;
        let str1 = `<tr><td> ${index} </td>`;
        let str2 = `<td> ${url} </td>`;
        let str3 = `<td> ${hash} </td>`;
        let str4 = `</tr>`;
        $table.append(str1 + str2 + str3 + str4);
    })
}

function updateAppList() {
    browser.storage.local.get("SiteWithWasm").then(result => {
        if (!result) {
            return
        }
        let SiteWithWasm = result.SiteWithWasm
        let $appList = $("#app-list tbody")
        $appList.empty();
        Object.values(SiteWithWasm).forEach((value) => {
            let item = `<tr><td> <img width="28" height="28" src=${value.iconUrl ? value.iconUrl : "/assets/icons/wa-48.png"} alt=""> ${value.title} </td>`;
            let op = `<td><button type="button" class="btn btn-danger btn-sm">Delete</button></td></tr>`
            $appList.append(item + op)
        })
        $("button.btn-danger").click(function () {
            $(this).parent().parent().empty()
            removeApp($(this).parent().prev().text())
        })
    })
}

function removeApp(title) {
    PortSend.postMessage(title.trim())
}