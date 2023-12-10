export {};

chrome.contextMenus.create({
  id: "viewpoints-extension",
  title: "Gather opposing viewpoints",
  contexts: ["selection"]
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "viewpoints-extension" && tab?.id) {
    chrome.tabs.query({ active: true, currentWindow: true }, function () {
      // Send a message to the content script in the active tab
      chrome.tabs.sendMessage(tab.id!, { message: "myMessage" });
    });
  }
})