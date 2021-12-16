//console.log('Hello from -> Devtool');
chrome.devtools.panels.create(
	"CS315-Checker",
	"icon.gif",
	"content.html",
	function(panel) { 
		console.log("Content is loaded to panel"); 
	}
);