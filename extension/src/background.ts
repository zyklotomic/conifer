import ky from "ky";

const BACKEND_URL = "https://4032-128-84-95-222.ngrok-free.app/";

chrome.contextMenus.create({
  id: "viewpoints-extension",
  title: "Analyze with Conifer",
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
