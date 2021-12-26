let Database = {};
let SiteWithWasm = {}
// const WATabs = {}
const Methods = {
	signature: true,
	mime: true,
}
const ContentTypeRGX = /content-type/i
const WasmMimeRGX = /application\/wasm/i
const PossibleWasmMimeRGX = /binary\/octet-stream/i

function detectWasm(req, isWasmCallback) {
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
	if (!Methods.signature) return
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

// Handle requests
browser.webRequest.onHeadersReceived.addListener(
	req => {
		//  The only possible way (for the moment) to load wasm is to use
		// XmlHttpRequest or fetch.
		if (req.type !== 'xmlhttprequest') return

		// Check only GET requests
		if (req.method !== 'GET') return
		detectWasm(req, () => {
			browser.tabs.get(req.tabId).then(tab => {
				SiteWithWasm[tab.url] = {
					iconUrl: tab.favIconUrl,
					title: tab.title
				}
				browser.storage.local.set({ "SiteWithWasm": SiteWithWasm })
			})
		})
	},
	{ urls: ['<all_urls>'], },
	['responseHeaders', 'blocking']
)

// function get_domain(requestHeaders) {
// 	let host_part = requestHeaders.find(header => {
// 		return header.name === 'Host' || header.name === 'host';
// 	});

// 	let referer_part = requestHeaders.find(header => {
// 		return header.name === 'Referer' || header.name === 'Referer';
// 	});
// 	let domain = referer_part === undefined ? host_part : referer_part;
// 	const regex = /(?:[\w-]+\.)+[\w-]+/;
// 	return regex.exec(domain.value);
// }

function updateDatabase(siteUrl, url, iconUrl, title, hash) {
	if (Database[siteUrl] === undefined) {
		Database[siteUrl] = {
			'url2hash': { [url]: hash },
			'iconUrl': iconUrl,
			'title': title
		}
	}
	else {
		Object.assign(Database[siteUrl]['url2hash'], {
			[url]: hash,
		})
	}
	browser.storage.local.set({ 'Database': Database });
}

function bufferToHex(buffer) {
	return [...new Uint8Array(buffer)]
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}


browser.webRequest.onBeforeSendHeaders.addListener(
	details => {
		let tabId = details.tabId;
		if (!tabId || tabId === browser.tabs.TAB_ID_NONE) return

		browser.tabs.get(tabId).then(tab => {
			let url = tab.url;

			// only check site with wasm
			if (!SiteWithWasm[url]) return

			let title = tab.title;
			let iconUrl = tab.favIconUrl;
			let filter = browser.webRequest.filterResponseData(details.requestId);

			filter.ondata = event => {
				// use the built in sha256 when possible.
				crypto.subtle.digest('SHA-256', event.data).then(hash => {
					updateDatabase(url, details.url, iconUrl, title, bufferToHex(hash))
				}).catch(_err => {
					console.log("Using fallback SHA256")
					updateDatabase(url, details.url, iconUrl, title, SHA256(event.data))
				})

				filter.write(event.data);
				filter.disconnect();
			}
		})

		return {};
	},
	{ urls: ['<all_urls>'] },
	["blocking"]
);


// Get stored settings
browser.storage.local.get('methods').then(stored => {
	if (!stored.methods) return
	Methods.signature = stored.methods.signature
	Methods.mime = stored.methods.mime
})

// Handle settings change
browser.storage.onChanged.addListener(changes => {
	if (!changes.methods) return
	Methods.signature = changes.methods.newValue.signature
	Methods.mime = changes.methods.newValue.mime
})
