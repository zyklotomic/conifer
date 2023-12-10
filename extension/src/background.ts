import ky from "ky";

const BACKEND_URL = "http://localhost:3000";

chrome.contextMenus.create({
  id: "viewpoints-extension",
  title: "Analyze with Conifer",
  contexts: ["selection"]
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "viewpoints-extension" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'open' });
    // Send a message to the content script in the active tab
    const response = await ky.post(BACKEND_URL, { body: info.selectionText });
    const data = await response.json();
    chrome.tabs.sendMessage(tab.id, {
      type: "opinion",
      data
    });
  }
})
