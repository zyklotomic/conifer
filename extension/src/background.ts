import ky from "ky";

const BACKEND_URL = "http://localhost:8000";

chrome.contextMenus.create({
  id: "viewpoints-extension",
  title: "Gather opposing viewpoints",
  contexts: ["selection"]
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "viewpoints-extension" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'open' });
    // Send a message to the content script in the active tab
    const data = await ky.post(BACKEND_URL,
      { 
        json: { 'content_to_embed': info.selectionText }
      }
    ).json();
    chrome.tabs.sendMessage(tab.id, {
      type: "opinion",
      data
    });
  }
})
