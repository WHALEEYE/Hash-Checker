let Database = {}
let SiteWithWasm = {}
browser.storage.local.get("Database").then(result => {
	if (result) {
		Database = result
	}
	browser.storage.local.get("SiteWithWasm").then(result => {
		if (result) {
			SiteWithWasm = result
		}

		// Handle requests
		browser.webRequest.onHeadersReceived.addListener(
			detechWasm,
			{ urls: ['<all_urls>'], },
			['responseHeaders', 'blocking']
		)

		browser.webRequest.onBeforeSendHeaders.addListener(
			calcHash,
			{ urls: ['<all_urls>'] },
			["blocking"]
		);
	})
})

const ContentTypeRGX = /content-type/i
const WasmMimeRGX = /application\/wasm/i
const PossibleWasmMimeRGX = /binary\/octet-stream/i

function showContentChangeAlert(iconUrl, url) {
	browser.notifications.create("", {
		"type": "basic",
		"iconUrl": iconUrl,
		"title": "Web APP change alert",
		"message": `The content ${url} has changed`
	});
}

function showWasmDetectedAlert(iconUrl, url) {
	browser.notifications.create("", {
		"type": "basic",
		"iconUrl": iconUrl,
		"title": "Web APP detected alert",
		"message": `The content ${url} is wasm`
	});
}

function updateDatabase(siteUrl, url, iconUrl, title, hash) {
	if (Database[siteUrl] === undefined) {
		Database[siteUrl] = {
			'url2hash': { [url]: hash },
			'iconUrl': iconUrl,
			'title': title
		}
	}
	else {
		const oldHash = Database[siteUrl]['url2hash'][url]
		if (!oldHash) {
			Database[siteUrl]['url2hash'][url] = hash
		}
		else if (oldHash && oldHash !== hash) {
			showContentChangeAlert(iconUrl, url);
			Database[siteUrl]['url2hash'][url] = hash
			browser.storage.local.set({ 'Database': Database });
			return true
		}
	}
	return false
}

function bufferToHex(buffer) {
	return [...new Uint8Array(buffer)]
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}

function concatArrayBuffers(bufs) {
	if(bufs.length === 1) {
		return bufs[0]
	}
	const totalLen = bufs.reduce((totalSize, buf) => { 
		return totalSize + buf.byteLength
	}, 0)
	const concatBuffer = new Uint8Array(totalLen);
	bufs.reduce((offset, buf) => {
		concatBuffer.set(buf, offset)
		return offset + buf.byteLength
	}, 0)
	return concatBuffer.buffer
}

function isWasm(req, isWasmCallback) {
	// Get content type from header
	if (req.url.endsWith(".wasm")) {
		isWasmCallback()
		return
	}
	let contentType = req.responseHeaders.find(h => ContentTypeRGX.test(h.name))
	if (contentType) contentType = contentType.value

	// Check mime types
	if (contentType && WasmMimeRGX.test(contentType)) {
		isWasmCallback()
		return
	}
	if (contentType && !PossibleWasmMimeRGX.test(contentType)) return
	// Check signature
	let filter = browser.webRequest.filterResponseData(req.requestId)

	filter.ondata = e => {
		// First data-chunk is enough
		filter.write(e.data)
		filter.disconnect()

		// Ignore too small chunks
		if (e.data.byteLength < 1024) return
		const signature = new Uint8Array(e.data, 0, 4)
		// Wasm signature
		// which is .asm
		if (
			signature[0] === 0x00 &&
			signature[1] === 0x61 &&
			signature[2] === 0x73 &&
			signature[3] === 0x6d
		) {
			isWasmCallback()
			return
		}
	}
}

function updateSiteData(tabUrl, iconUrl, title) {
	SiteWithWasm[tabUrl] = {
		iconUrl: iconUrl,
		title: title
	}
	browser.storage.local.set({ "SiteWithWasm": SiteWithWasm })
}

function detechWasm(req) {
	//  The only possible way (for the moment) to load wasm is to use
	// XmlHttpRequest or fetch.
	if (req.type !== 'xmlhttprequest') return

	// Check only GET requests
	if (req.method !== 'GET') return
	isWasm(req, () => {
		browser.tabs.get(req.tabId).then(tab => {
			let siteData = SiteWithWasm[tab.url]
			if(siteData) {
				updateSiteData(tab.url, tab.favIconUrl, tab.title)
				showWasmDetectedAlert(tab.favIconUrl, req.url)
			}
			else if(siteData.iconUrl !== tab.favIconUrl || siteData.title !== tab.title) {
				// update site data
				updateSiteData(tab.url, tab.favIconUrl, tab.title)
			}
		})
	})
}

function calcHash(details) {
	let tabId = details.tabId;
	if (!tabId || tabId === browser.tabs.TAB_ID_NONE) return

	browser.tabs.get(tabId).then(tab => {
		let url = tab.url;

		// only check site with wasm
		if (!SiteWithWasm[url]) return

		let title = tab.title;
		let iconUrl = tab.favIconUrl;
		let filter = browser.webRequest.filterResponseData(details.requestId);
		let contents = [];
		filter.ondata = event => {
			// use the built in sha256 when possible.
			contents.push(event.data)
			filter.write(event.data);
		}
		filter.onstop = event => {
			filter.close();
			let fullContents = concatArrayBuffers(contents)
			crypto.subtle.digest('SHA-256', fullContents).then(hash => {
				updateDatabase(url, details.url, iconUrl, title, bufferToHex(hash))
			}).catch(_err => {
				console.log("Using fallback SHA256")
				updateDatabase(url, details.url, iconUrl, title, SHA256(fullContents))
			})
		}
	})

	return {};
}

