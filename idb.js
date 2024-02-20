class idb {
    constructor() {
      this.db = null;
    }

    // Method to open the IndexedDB database
    static async openCostsDB(name, version) {

        // Check if the browser supports IndexedDB
        if (!window.indexedDB) {
            console.error("Your browser doesn't support IndexedDB");
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, version);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                // Create the "cost" object store if it doesn't exist
                if (!db.objectStoreNames.contains("cost")) {
                    db.createObjectStore("cost", { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = event => {
                const db = new idb();
                db.db = event.target.result;
                console.log("Database init successful");
                resolve(db);
            };
            request.onerror = event => {
                console.error("error", event.target.errorCode);
                reject(new Error("error" + event.target.error.message));
            };
        });
    }

    // Method to add a cost entry to the database
    async addCost(entry) {

        if (!this.db) {
            console.error("Database has not been init");
            return;
        }

        return new Promise((resolve, reject) => {

            const transaction = this.db.transaction(["cost"], "readwrite");
            transaction.onerror = event => {
                console.error("Transaction error", event.target.error);
            };

            // Get the "cost" object store
            const store = transaction.objectStore("cost");
            // Add the entry to the store
            const request = store.add(entry);

            request.onsuccess = () => {
                console.log("Cost added success");
                resolve(true);
            };

            request.onerror = event => {
                console.error("Error adding entry", event.target.error);
                reject(new Error("Error adding entry" + event.target.error.message));
            };
        });
    }

    // Method to fetch cost data from the database
    async fetchCostData(selectedYear, selectedMonth) {
        return new Promise((resolve, reject) => {
            // Map month names to their numerical values
            const monthMap = {
                'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
                'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
            };
            // Open a read-only transaction on the "cost" object store
            let transaction = this.db.transaction(["cost"], "readonly");
            let store = transaction.objectStore("cost");

            // Retrieve all records from the store
            let request = store.getAll();

            // Event handler for when the records are retrieved successfully
            request.onsuccess = () => {
                let data = request.result;
                // Filter records based on selectedYear and selectedMonth
                let filteredData = data.filter(entry => {
                    let entryDateComponents = entry.Date.split('-');
                    let entryYear = entryDateComponents[1];
                    let entryMonth = entryDateComponents[0];
                    // Handle both numerical and textual month representations
                    let monthValue = monthMap[selectedMonth] || selectedMonth;
                    return entryYear === selectedYear && (entryMonth === monthValue || entryMonth === selectedMonth);
                });

                // Sort the filtered records by Date
                let sortedData = filteredData.sort((a, b) => {
                    let dateA = new Date(a.Date), dateB = new Date(b.Date);
                    return dateA - dateB;
                });

                resolve(sortedData);
            };
            request.onerror = () => {
                console.error("Error fetching data from IndexedDB:", request.error);
                reject(request.error);
            };
        });

    }

}