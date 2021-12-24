$(document).ready(function () {
    $(".reset").click(() => {
        browser.storage.local.get("url2hash").then((result) => {
            reset(result.url2hash);
        }).catch((err) => { console.log(err); });
    });
})


function reset(url2hash) {
    let $table = $("#site-hash-table")
    $table.children("tbody").remove()
    Object.entries(url2hash).forEach((value, index) => {
        // siteUrl is key
        // content: {
        //     url1: hash,
        //     url2: hash,
        //     ..........,
        //     title: String,
        //     iconUrl: String,
        // }
        const [siteUrl, content] = value;
        let str1 = "<tbody><tr><td>" + index + "</td>";
        let icon = `<td> <img src=${content.iconUrl}> </td>`;
        let str2 = "<td>" + content.title + "</td>"
        let str3 = "<td>" + value[1] + "</td>"
        let str4 = "</tr></tbody>"
        $table.append(str1 + icon + str2 + str3 + str4)
        // console.log(value)
    })
    // document.getElementById("site-hash-table").innerHTML = content.join("\n")
}