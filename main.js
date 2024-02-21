document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("file-menu-button")
    .addEventListener("click", function () {
      document.getElementById("file-menu-dropdown").classList.toggle("hidden");
    });

  window.addEventListener("click", function (event) {
    if (!event.target.matches("#file-menu-button")) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (!openDropdown.classList.contains("hidden")) {
          openDropdown.classList.add("hidden");
        }
      }
    }
  });

  document
    .getElementById("capture-element")
    .addEventListener("click", function () {
      chrome.tabs.query({ active: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "captureClick" });
        window.close();
      });
    });

  document
    .getElementById("download-captures")
    .addEventListener("click", function () {
      chrome.runtime.sendMessage({ type: "downloadCaptures" });
    });
});
