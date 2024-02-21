let db;

const request = window.indexedDB.open("funtility-web-steno", 1);
request.onerror = (event) => {
  db = event.target.result;
};
request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (event.oldVersion < 1) {
    const targetStore = db.createObjectStore("targets", { keyPath: "id" });
    targetStore.createIndex("id", "id", { unique: true });

    const recordStore = db.createObjectStore("records", {
      autoIncrement: true,
    });
    recordStore.createIndex("signature", "signature", { unique: false });
  }
};
request.onsuccess = (event) => {
  db = event.target.result;
};

/**
 * A collection of functions for interacting with the IndexedDB API.
 */
window.dbContext = {
  //#region Targets

  /**
   * Returns a list of all Target objects in the database to the onsuccess function.
   * @param {function} onsuccess The function to call when the targets are retrieved.
   * The targets retrieved are passed to this function.
   */
  getTargets(onsuccess) {
    const transaction = db.transaction("targets", "readonly");
    const targets = transaction.objectStore("targets");
    const request = targets.getAll();
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Target(data));
      onsuccess(result);
    };
  },

  /**
   * Adds a Target object to the database.
   * @param {Target} target The object to add to the database.
   * @param {function} onsuccess The function to call when the file is added.
   * The result of the call is passed to this function.
   */
  addTarget(target, onsuccess = () => {}) {
    const transaction = db.transaction("targets", "readwrite");
    const targets = transaction.objectStore("targets");
    const request = targets.add(target);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Updates an existing Target object in the database.
   * @param {Target} target The object to update in the database.
   * @param {function} onsuccess The function to call when the object is updated.
   * The result of the call is passed to this function.
   */
  updateTarget(target, onsuccess = () => {}) {
    const transaction = db.transaction("targets", "readwrite");
    const targets = transaction.objectStore("targets");
    const request = targets.put(target);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Deletes an existing Target object from the database.
   * @param {string} targetId The id of the object to delete.
   * @param {function} onsuccess The function to call when the file is deleted.
   * The result of the call is passed to this function.
   */
  deleteTarget(targetId, onsuccess = () => {}) {
    const transaction = db.transaction("targets", "readwrite");
    const targets = transaction.objectStore("targets");
    const request = targets.delete(targetId);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  //#endregion Targets

  //#region Records
  /**
   * Returns a list of all the Records to the onsuccess function.
   * @param {function} onsuccess The function to call when the Records are retrieved.
   * The Records retrieved are passed to this function.
   */
  getAllRecords(onsuccess) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const request = records.getAll();
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Record(data));
      onsuccess(result);
    };
  },

  /**
   * Returns a list of all the Records for a given Target to the onsuccess function.
   * @param {string} targetId The id of the Target to get Records for.
   * @param {function} onsuccess The function to call when the Records are retrieved.
   * The Records retrieved are passed to this function.
   */
  getRecordsByTargetId(targetId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const targetIndex = records.index("targetId");
    const request = targetIndex.getAll(targetId);
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Record(data));
      onsuccess(result);
    };
  },

  /**
   * Returns a list of all the Records for a given Target to the onsuccess function.
   * @param {string} signature The id of the Target to get Records for.
   * @param {function} onsuccess The function to call when the Records are retrieved.
   * The Records retrieved are passed to this function.
   */
  getRecordsBySignature(signature, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const signatureIndex = records.index("signature");
    const request = signatureIndex.getAll(signature);
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Record(data));
      onsuccess(result);
    };
  },

  /**
   * Adds a Record object to the database.
   * @param {Record} record The record to add.
   * @param {function} onsuccess The function to call when the record is saved.
   * The result of the call is passed to this function.
   */
  addRecord(record, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const request = records.add(record);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Updates an exsiting Record in the database.
   * @param {Record} record The validation range to update.
   * @param {function} onsuccess The function to call when the range is updated.
   * The result of the call is passed to this function.
   */
  updateRecord(record, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const request = records.put(record);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Deletes all Records for a given Target.
   * @param {string} targetId The id of the Target that the Records belong to.
   * @param {function} onsuccess The function to call when the records are deleted.
   * The result of the call is passed to this function.
   */
  deleteRecordsByTargetId(targetId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("ranges");
    const fileIndex = records.index("targetId");
    const destroy = fileIndex.openKeyCursor(IDBKeyRange.only(targetId));
    destroy.onsuccess = (event) => {
      let cursor = event.target.result;
      if (cursor) {
        let deleteRequest = records.delete(cursor.primaryKey);
        deleteRequest.onsuccess = (event) => {
          cursor.continue();
        };
      }
      onsuccess(event.target.result);
    };
  },

  /**
   * Deletes an exsiting Record from the database.
   * @param {string} recordId The id of the Record to delete.
   * @param {function} onsuccess The function to call when the Record is deleted.
   * The result of the call is passed to this function.
   */
  deleteRecord(recordId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("ranges");
    const request = records.delete(recordId);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  //#endregion Records
};
