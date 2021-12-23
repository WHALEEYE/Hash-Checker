function listenForClicks() {
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("reset")) {
            refresh()
        }
    });
}

function reset(url2hash) {
    let content = []
    for(const [key, value] of Object.entries(url2hash)) {
        content.push(`<div> ${key} : ${value} </div>`)
    }
    document.getElementById("popup-content").innerHTML = content.join("\n")
}

function refresh() {
    browser.storage.local.get("url2hash").then((result) => {
        reset(result.url2hash);
    }).catch((err) => { console.log(err); });
}


listenForClicks()