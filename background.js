//#region Listeners

chrome.browserAction.onClicked.addListener(function () {
  chrome.windows.create({
    url: chrome.runtime.getURL("main.html"),
    type: "popup",
    width: 500,
    height: 600,
  });
});

let lastInfo = {};
let activeTabId;

/**
 * Listens for when a tab is activated.
 * This is for new tabs and when the user switches tabs.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  activeTabId = activeInfo.tabId;
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    if (tab.url) {
      await processTab(tab);
    }
  });
});

/**
 * This is for when the URL of a tab is changed.
 * E.G. A refresh or a new URL (such as search result is loaded) is entered.
 */
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  activeTabId = tabId;
  // If the tab's URL has been updated
  if (changeInfo.url) {
    await processTab(tab);
  }
});

/**
 * Listens for messages.
 */
chrome.runtime.onMessage.addListener(async function (message) {
  // console.log("background.js received message: ", message);
  if (!message?.type) return;
  switch (message.type) {
    case "captureClick":
      chrome.tabs.sendMessage(activeTabId, { type: "captureClick" });
      break;
    case "newTargetClicked":
      showTargetForm(message.data);
      break;
    case "targetFormSubmit":
      await processFormData(message.data);
      break;
    case "pageScrapeResults":
      processScrapedData(message.data);
      break;
    case "downloadCaptures":
      dbContext.getAllRecords((result) => {
        downloadCaptures(result);
      });
      break;
    default:
      break;
  }
});

//#endregion

//#region Target Logic

formTabId = 0;
function showTargetForm(object) {
  let obj = new Target({ tabSelector: lastInfo }).generateElementSelector(
    object
  );
  chrome.windows.create(
    {
      url: chrome.runtime.getURL("target-form.html"),
      type: "popup",
      width: 500,
      height: 740,
    },
    function (window) {
      formTabId = window.tabs[0].id;
      obj.tabId = formTabId;
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (formTabId === updatedTabId && info.status === "complete") {
          chrome.tabs.sendMessage(formTabId, {
            type: "targetFormContent",
            data: obj,
            element: object,
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
  );
}

/**
 * When the user submits the form on the target-form.html page this function is called.
 * @param {*} object Form data provided by the user from the target-form.html page.
 * @returns
 */
async function processFormData(object) {
  const target = new Target(object);
  if (!target.captureProfile.captureInnerText) {
    chrome.tabs.sendMessage(formTabId, {
      type: "response",
      class: "error",
      data: "Capture Inner Text must be checked!",
    });
    return;
  }

  let isDuplicate = await isDuplicateTarget(target);
  if (isDuplicate) {
    chrome.tabs.sendMessage(formTabId, {
      type: "response",
      class: "error",
      data: "Target already exists!",
    });
  } else {
    target.tabInfo = null;
    dbContext.addTarget(target);
    chrome.tabs.sendMessage(formTabId, {
      type: "response",
      class: "success",
      data: "Target saved!",
    });
  }
}

let matchingTargets = [];
async function processTab(tab) {
  const tabInfo = new TabInfo().fromTab(tab);
  if (tabInfo.isNotRestricted) {
    lastInfo = tabInfo;
    matchingTargets = await checkForTargets();
    if (matchingTargets.length === 0) return;
    sendTargetsToContentScript();
  }
}

async function checkForTargets() {
  return new Promise((resolve, reject) => {
    let result = [];
    dbContext.getTargets((targets) => {
      targets.forEach((target) => {
        if (!target.allowUpdates) return;
        if (target.matchesTabInfo(lastInfo)) {
          target.tabInfo = lastInfo;
          result.push(target);
        }
      });
      resolve(result);
    });
  });
}

async function isDuplicateTarget(thatTarget) {
  return new Promise((resolve, reject) => {
    let result = false;
    dbContext.getTargets((targets) => {
      targets.forEach((thisTarget) => {
        if (thisTarget.equals(thatTarget)) {
          result = true;
        }
      });
      resolve(result);
    });
  });
}

function sendTargetsToContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "scrapePage",
      data: matchingTargets,
    });
  });
  matchingTargets.forEach((target) => {
    if (target.elementSelector.id === "") {
      target.allowUpdates = false;
      dbContext.updateTarget(target);
    }
  });
}

// This script is executed when the results are passed back to be stored in the Record store
function processScrapedData(targets) {
  targets = targets.map((t) => new Target(t));
  targets.forEach((target) => {
    target.records.forEach((record) => {
      if (record.signature === "") {
        dbContext.addRecord(record);
      } else {
        dbContext.getRecordsBySignature(record.signature, (result) => {
          if (result.length === 0) {
            dbContext.addRecord(record);
          } else {
            const max = Math.max(...result.map((r) => r.timestamp));
            const latest = result.find((r) => r.timestamp === max);
            if (JSON.stringify(latest.data) !== JSON.stringify(record.data)) {
              dbContext.addRecord(record);
            }
          }
        });
      }
    });
  });
}

//#endregion

function downloadCaptures(captures) {
  const json = JSON.stringify(captures);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "records.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
