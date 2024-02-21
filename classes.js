/**
 * A TabInfo object represents a single browser tab URL visited.
 */
class TabInfo {
  constructor(data = {}) {
    if (!data) return;
    this.id = data.hasOwnProperty("id") ? data.id : Date.now();
    this.tabId = data.hasOwnProperty("tabId") ? data.tabId : "";

    this.url = data.hasOwnProperty("url") ? data.url : "";
    this.subDomain = data.hasOwnProperty("subDomain") ? data.subDomain : "";
    this.domain = data.hasOwnProperty("domain") ? data.domain : "";
    this.route = data.hasOwnProperty("route") ? data.route : "";
    this.queryParams = data.hasOwnProperty("queryParams")
      ? data.queryParams
      : {};
    this.fragmentIdentifiers = data.hasOwnProperty("fragmentIdentifiers")
      ? data.fragmentIdentifiers
      : {};
  }

  get time() {
    return new Date(this.id).toLocaleString();
  }

  fromTab(tab) {
    this.tabId = tab.id;
    return this.fromUrl(tab.url);
  }

  fromUrl(url) {
    this.url = url;

    if (!this.url) {
      this.subDomain = "";
      this.domain = "";
      this.route = "";
      this.queryParams = {};
    } else {
      const url = new URL(this.url);
      if (url.hostname.split(".").length === 3) {
        const parts = url.hostname.split(".");
        this.subDomain = parts[0] == "www" ? "" : parts[0];
        this.domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
      } else {
        const parts = url.hostname.split(".");
        this.subDomain = parts[0];
        this.domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
      }

      this.route = url.pathname;

      if (url.search) {
        const paramString = url.search.substring(1);
        const params = paramString.split("&");
        this.queryParams = {};
        for (let i = 0; i < params.length; i++) {
          const pair = params[i].split("=");
          this.queryParams[pair[0]] = pair[1];
        }
      } else {
        this.queryParams = {};
      }

      if (url.hash) {
        const paramString = url.hash.substring(1);
        const params = paramString.split("&");
        this.fragmentIdentifiers = {};
        for (let i = 0; i < params.length; i++) {
          const pair = params[i].split("=");
          this.fragmentIdentifiers[pair[0]] = pair[1];
        }
      } else {
        this.fragmentIdentifiers = {};
      }
    }
    return this;
  }

  get isNotRestricted() {
    let result = true;
    if (this.url.includes("undefined")) {
      result = false;
    } else if (this.url.includes("newtab")) {
      result = false;
    } else if (this.url.includes("extension")) {
      result = false;
    }
    return result;
  }
}

/**
 * A Target object represents a website that the user wants to monitor.
 */
class Target {
  constructor(data = {}) {
    this.id = data.hasOwnProperty("id") ? data.id : Date.now();
    this.name = data.hasOwnProperty("name") ? data.name : "";
    this.allowUpdates = data.hasOwnProperty("allowUpdates")
      ? data.allowUpdates
      : true;
    this.tabSelector = data.hasOwnProperty("tabSelector")
      ? new TabSelector(data.tabSelector)
      : new TabSelector();
    this.elementSelector = data.hasOwnProperty("elementSelector")
      ? new ElementSelector(data.elementSelector)
      : new ElementSelector();
    this.captureProfile = data.hasOwnProperty("captureProfile")
      ? new CaptureProfile(data.captureProfile)
      : new CaptureProfile();
    this.tabInfo = data.hasOwnProperty("tabInfo")
      ? new TabInfo(data.tabInfo)
      : new TabInfo();
    this.records = data.hasOwnProperty("records") ? data.records : [];
  }

  generateElementSelector(data) {
    this.elementSelector = new ElementSelector(data);
    return this;
  }

  matchesTabInfo(tabInfo) {
    return this.tabSelector.matchesTabInfo(tabInfo);
  }

  equals(that) {
    let result = true;
    if (!this.allowUpdates === that.allowUpdates) {
      result = false;
    }
    if (!this.tabSelector.equals(that.tabSelector)) {
      result = false;
    }
    if (!this.elementSelector.equals(that.elementSelector)) {
      result = false;
    }
    if (!this.captureProfile.equals(that.captureProfile)) {
      result = false;
    }
    return result;
  }

  captureResults() {
    const query = this.elementSelector.querySelector;
    let nodes = [];
    nodes = document.querySelectorAll(query);
    if (nodes.length > 0) nodes = Array.from(nodes);
    if (this.elementSelector.id !== "") {
      let txt = "";
      nodes.forEach((n) => {
        if (n.innerText) txt += n.innerText;
      });
      nodes[0].innerText = txt;
      nodes = [nodes[0]];
    }
    if (nodes.length > 0) this.processNodeList(nodes);
  }

  processNodeList(nodeList) {
    if (nodeList.length > 0) {
      let array = Array.from(nodeList);
      this.records = array.map((element) => {
        let record = this.captureProfile.createRecord(element);
        if (this.elementSelector.id !== "") {
          record.signature = this.generateSignature(element);
        }
        record.targetId = this.id;
        return record;
      });
    }
  }

  generateSignature(element) {
    let signature = "";
    if (this.tabSelector.subDomain !== "") {
      signature += this.tabSelector.subDomain + ".";
    }
    if (this.tabSelector.domain !== "") {
      signature += this.tabSelector.domain;
    }
    if (this.tabSelector.route !== "") {
      signature += this.tabSelector.route;
    }
    const qKeys = Object.keys(this.tabSelector.queryParams);
    if (qKeys.length > 0) {
      signature += "?";
      qKeys.forEach((key) => {
        if (this.tabSelector.queryParams[key] === "") {
          signature += key + "=" + this.tabInfo.queryParams[key];
        } else {
          signature += key + "=" + this.tabSelector.queryParams[key];
        }
      });
    }

    if (this.elementSelector.tagName != "") {
      signature += "<" + this.elementSelector.tagName + ">";
    }
    if (this.elementSelector.id != "") {
      signature += "#" + this.elementSelector.id;
    }
    if (this.elementSelector.classes.length > 0) {
      signature += "." + this.elementSelector.classes.join(".");
    }
    const dKeys = Object.keys(this.elementSelector.dataset);
    if (dKeys.length > 0) {
      signature += "[" + dKeys.join("][") + "]";
    }
    return signature;
  }
}

class TabSelector {
  constructor(data = {}) {
    this.subDomain = data.hasOwnProperty("subDomain") ? data.subDomain : "";
    this.domain = data.hasOwnProperty("domain") ? data.domain : "";
    this.route = data.hasOwnProperty("route") ? data.route : "";
    this.queryParams = data.hasOwnProperty("queryParams")
      ? data.queryParams
      : {};
  }

  matchesTabInfo(tabInfo) {
    let result = true;
    if (this.domain !== "") {
      if (this.domain !== tabInfo.domain) {
        result = false;
      }
    }
    if (this.subDomain !== "") {
      if (this.subDomain !== tabInfo.subDomain) {
        result = false;
      }
    }
    if (this.route !== "") {
      if (this.route !== tabInfo.route) {
        result = false;
      }
    }
    const keys = Object.keys(this.queryParams);
    if (keys.length > 0) {
      keys.forEach((key) => {
        if (!Object.hasOwn(tabInfo.queryParams, key)) {
          result = false;
        } else {
          const val = this.queryParams[key];
          if (val.trim() !== "") {
            if (this.queryParams[key] !== tabInfo.queryParams[key]) {
              result = false;
            }
          }
        }
      });
    }
    return result;
  }

  equals(that) {
    let result = true;
    if (this.domain !== that.domain) {
      result = false;
    }
    if (this.subDomain !== that.subDomain) {
      result = false;
    }
    if (this.route !== that.route) {
      result = false;
    }
    // if (this.queryParams.toString() !== that.queryParams.toString()) {
    //   result = false;
    // }
    return result;
  }
}

class ElementSelector {
  constructor(data = {}) {
    this.classes = data.hasOwnProperty("classes") ? data.classes : [];
    this.dataset = data.hasOwnProperty("dataset") ? data.dataset : [];
    this.id = data.hasOwnProperty("id") ? data.id : "";
    this.tagName = data.hasOwnProperty("tagName") ? data.tagName : "";
  }

  /**
   * Returns a query selector string that can be used as the argument in the document.querySelectorAll method.
   */
  get querySelector() {
    let query = "";
    if (this.tagName) {
      query += this.tagName;
    }
    if (this.id) {
      query += "#" + this.id;
    }
    if (this.classes.length > 0) {
      query += "." + this.classes.join(".");
    }
    if (this.dataset.length > 0) {
      query += "[" + Object.keys(this.dataSet).join("][") + "]";
    }
    return query;
  }

  equals(that) {
    let result = true;
    if (this.tagName !== that.tagName) {
      result = false;
    }
    if (this.id !== that.id) {
      result = false;
    }
    if (this.classes.toString() !== that.classes.toString()) {
      result = false;
    }
    if (this.dataset.toString() !== that.dataset.toString()) {
      result = false;
    }
    return result;
  }
}

class CaptureProfile {
  constructor(data = {}) {
    this.captureInnerText = data.hasOwnProperty("captureInnerText")
      ? data.captureInnerText
      : false;
  }

  createRecord(element) {
    let record = new Record();
    if (this.captureInnerText) {
      record.data = element.innerText.replace(/\n/g, " ");
    }
    return record;
  }

  equals(that) {
    let result = true;
    if (this.captureInnerText !== that.captureInnerText) {
      result = false;
    }
    return result;
  }
}

/**
 * A Record object represents a single record of the state a targted element on a website.
 */
class Record {
  constructor(data = {}) {
    this.timestamp = data.hasOwnProperty("timestamp")
      ? data.timestamp
      : Date.now();
    this.timeString = data.hasOwnProperty("timeString")
      ? data.timeString
      : new Date(this.timestamp).toLocaleString();
    this.targetId = data.hasOwnProperty("targetId") ? data.targetId : "";
    this.signature = data.hasOwnProperty("signature") ? data.signature : "";
    this.data = data.hasOwnProperty("data") ? data.data : {};
  }
}
