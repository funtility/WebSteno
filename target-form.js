let formdata = false;

const TargetForm = {
  data: false,
  subDomainChkbx: null,
  subDomainInput: null,
  domainChkbx: null,
  domainInput: null,
  routeChkbx: null,
  routeInput: null,
  tagChkbx: null,
  tagInput: null,
  classesChkbx: null,
  classesInput: null,
  idChkbx: null,
  idInput: null,
  datasetChkbx: null,
  datasetInput: null,
  innerTextChkbx: null,
  innerTextTxtArea: null,

  init(data, element) {
    console.log(data);
    this.data = data;
    //#region Tab selector
    this.subDomainChkbx = document.getElementById("subDomainChkbx");
    this.subDomainInput = document.getElementById("subDomainInput");
    this.domainChkbx = document.getElementById("domainChkbx");
    this.domainInput = document.getElementById("domainInput");
    this.routeChkbx = document.getElementById("routeChkbx");
    this.routeInput = document.getElementById("routeInput");
    if (data.tabSelector.subDomain) {
      this.subDomainChkbx.checked = true;
      this.subDomainInput.value = data.tabSelector.subDomain;
    } else {
      this.subDomainInput.disabled = true;
    }
    if (data.tabSelector.domain) {
      this.domainChkbx.checked = true;
      this.domainInput.value = data.tabSelector.domain;
    } else {
      this.domainInput.disabled = true;
    }
    if (data.tabSelector.route) {
      this.routeChkbx.checked = true;
      this.routeInput.value = data.tabSelector.route;
    } else {
      this.routeInput.disabled = true;
    }
    this.subDomainChkbx.addEventListener("change", () => {
      this.subDomainInput.disabled = !this.subDomainChkbx.checked;
    });
    this.domainChkbx.addEventListener("change", () => {
      this.domainInput.disabled = !this.domainChkbx.checked;
    });
    this.routeChkbx.addEventListener("change", () => {
      this.routeInput.disabled = !this.routeChkbx.checked;
    });
    this.initQueryParams();
    //#endregion

    //#region Element selector
    this.tagChkbx = document.getElementById("tagChkbx");
    this.tagInput = document.getElementById("tagInput");
    this.classesChkbx = document.getElementById("classesChkbx");
    this.classesInput = document.getElementById("classesInput");
    this.idChkbx = document.getElementById("idChkbx");
    this.idInput = document.getElementById("idInput");
    this.datasetChkbx = document.getElementById("datasetChkbx");
    this.datasetInput = document.getElementById("datasetInput");
    if (data.elementSelector.tagName) {
      this.tagChkbx.checked = true;
      this.tagInput.value = data.elementSelector.tagName;
    } else {
      this.tagInput.disabled = true;
    }
    if (data.elementSelector.classes.length > 0) {
      this.classesChkbx.checked = true;
      this.classesInput.value = data.elementSelector.classes.join(" ");
    } else {
      this.classesChkbx.checked = false;
      this.classesInput.disabled = true;
    }
    if (data.elementSelector.id) {
      this.idChkbx.checked = true;
      this.idInput.value = data.elementSelector.id;
    } else {
      this.idInput.disabled = true;
    }
    if (data.elementSelector.dataset.length > 0) {
      this.datasetChkbx.checked = true;
      this.datasetInput.value = data.elementSelector.dataset.join(" ");
    } else {
      this.datasetInput.disabled = true;
    }
    this.tagChkbx.addEventListener("change", () => {
      this.tagInput.disabled = !this.tagChkbx.checked;
    });
    this.classesChkbx.addEventListener("change", () => {
      this.classesInput.disabled = !this.classesChkbx.checked;
    });
    this.idChkbx.addEventListener("change", () => {
      this.idInput.disabled = !this.idChkbx.checked;
    });
    this.datasetChkbx.addEventListener("change", () => {
      this.datasetInput.disabled = !this.datasetChkbx.checked;
    });
    //#endregion

    //#region Capture profile
    this.innerTextChkbx = document.getElementById("innerTextChkbx");
    this.innerTextTxtArea = document.getElementById("innerTextTxtArea");
    this.innerTextChkbx.checked = true;
    this.innerTextTxtArea.innerText = element.innerText;
    //#endregion

    document.getElementById("submit").addEventListener("click", () => {
      let cl = [];
      if (this.classesChkbx.checked) {
        cl =
          this.classesInput.value.trim() != ""
            ? this.classesInput.value
                .trim()
                .split(" ")
                .map((ele) => ele.trim())
                .filter(Boolean)
            : [];
      }
      let ds = [];
      if (this.datasetChkbx.checked) {
        ds =
          this.datasetInput.value.trim() != ""
            ? this.datasetInput.value
                .trim()
                .split(" ")
                .map((ele) => ele.trim())
                .filter(Boolean)
            : [];
      }
      let obj = {
        tabSelector: {
          subDomain: subDomainChkbx.checked ? subDomainInput.value : "",
          domain: domainChkbx.checked ? domainInput.value : "",
          route: routeChkbx.checked ? routeInput.value : "",
          queryParams: this.queryParamFormToObject(),
        },
        elementSelector: {
          tagName: tagChkbx.checked ? tagInput.value : "",
          classes: cl,
          id: idChkbx.checked ? idInput.value : "",
          dataset: ds,
        },
        captureProfile: {
          captureInnerText: innerTextChkbx.checked,
        },
      };
      chrome.runtime.sendMessage({ type: "targetFormSubmit", data: obj });
    });
  },

  show() {
    document.getElementById("loading")?.remove();
    document.getElementById("form")?.classList.remove("hidden");
  },

  initQueryParams() {
    let container = document.getElementById("query-params");
    let params = this.data.tabSelector.queryParams;
    if (params.length === 0) {
      container.innerHTML = "No query params found.";
      return;
    }
    let i = 0;
    Object.keys(params).forEach((key) => {
      i++;
      let div = document.createElement("div");
      div.classList.add("inline");

      //checkbox for key
      let keychkbx = document.createElement("input");
      keychkbx.type = "checkbox";
      keychkbx.id = `key${i}`;
      keychkbx.checked = true;
      //label for key checkox
      let keylabel = document.createElement("label");
      keylabel.innerText = "Key";
      keylabel.htmlFor = `key${i}`;
      //input for key
      let keyinput = document.createElement("input");
      keyinput.type = "text";
      keyinput.value = key;
      keychkbx.addEventListener("change", () => {
        keyinput.disabled = !keychkbx.checked;
      });

      //checkbox for value
      let valuechkbx = document.createElement("input");
      valuechkbx.type = "checkbox";
      valuechkbx.id = `value${i}`;
      valuechkbx.checked = false;
      //label for value checkox
      let valuelabel = document.createElement("label");
      valuelabel.innerText = "Value";
      valuelabel.htmlFor = `value${i}`;
      //input for value
      let valueinput = document.createElement("input");
      valueinput.type = "text";
      valueinput.value = params[key];
      valueinput.disabled = true;
      valuechkbx.addEventListener("change", () => {
        valueinput.disabled = !valuechkbx.checked;
      });

      div.appendChild(keychkbx);
      div.appendChild(keylabel);
      div.appendChild(keyinput);
      div.appendChild(valuechkbx);
      div.appendChild(valuelabel);
      div.appendChild(valueinput);

      container.appendChild(div);
    });
  },

  queryParamFormToObject() {
    let obj = {};
    let container = document.getElementById("query-params");
    let i = 0;
    container.childNodes.forEach((div) => {
      i++;
      let keychkbx = div.childNodes[0];
      let keyinput = div.childNodes[2];
      let valuechkbx = div.childNodes[3];
      let valueinput = div.childNodes[5];
      if (keychkbx.checked) {
        obj[keyinput.value] = valuechkbx.checked ? valueinput.value : "";
      }
    });
    return obj;
  },
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // console.log("target-form.js received message: ", message);
  if (message.type === "targetFormContent") {
    TargetForm.init(message.data, message.element);
    TargetForm.show();
  }
  if (message.type === "response") {
    showResponse(message);
    if (message.class === "success") {
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }
});

function showResponse(response) {
  let res = document.getElementById("response");
  res.className = "";
  res.innerText = response.data;
  res.classList.add(response.class);
}

setTimeout(() => {
  if (TargetForm.data === false) {
    document.getElementById("loading")?.remove();
    document.getElementById("error")?.classList.remove("hidden");
  }
}, 500);
