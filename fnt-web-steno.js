/**
 * Listens for messages.
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // console.log("fnt-web-steno.js received message", message);
  if (!message?.type) return;
  switch (message.type) {
    case "captureClick":
      invokeClickCapturing();
      break;
    case "scrapePage":
      scrapePage(message.data);
      break;
    default:
      break;
  }
});

//#region Click capturing

function invokeClickCapturing() {
  document.addEventListener("click", handleClick, true);
  document.addEventListener("mousemove", handleMousemove, true);
}

function handleClick(event) {
  event.stopPropagation();
  event.preventDefault();
  currentElement?.classList.remove("fnt-web-steno-highlight");
  captureClick(currentElement);
  document.removeEventListener("mousemove", handleMousemove, true);
  document.removeEventListener("click", handleClick, true);
}

let currentElement;
function handleMousemove(event) {
  let element = event.target;
  if (element !== currentElement) {
    if (currentElement) {
      currentElement.classList.remove("fnt-web-steno-highlight");
    }
    element.classList.add("fnt-web-steno-highlight");
    currentElement = element;
  }
}

function captureClick(element) {
  if (element) {
    let data = [];
    if (element.dataset) {
      for (var key in element.dataset) {
        data.push(key);
      }
    }
    let obj = {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classes: element.getAttribute("class").split(" "),
      dataset: data,
      innerText: element.innerText,
    };
    obj.classes = obj.classes.filter((c) => c !== "");
    chrome.runtime.sendMessage({ type: "newTargetClicked", data: obj });
  }
}

//#endregion Click capturing

//#region Element scraping

function scrapePage(targets) {
  targets = targets.map((t) => new Target(t));
  targets.forEach((t) => {
    t.captureResults();
  });
  chrome.runtime.sendMessage({ type: "pageScrapeResults", data: targets });
}

//#endregion Element scraping

console.log("fnt-web-steno.js loaded");
