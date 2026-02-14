Chart.defaults.interaction.mode = 'nearest';
Chart.defaults.interaction.axis = 'x';
Chart.defaults.interaction.intersect = false;
Chart.defaults.plugins.tooltip.enabled = true;
const sourceSelect = document.getElementById("sourceSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("dynamicInputs");
const loader = document.getElementById("loader");

if (!sourceSelect || !loadBtn || !container) {
    showMessage("Error: Required UI elements are missing.");
}

// ========== INDEXEDDB PERSISTENCE (Solix Approach) ==========
let dashboardDB = null;
const DB_NAME = "OpenDotsDB";
const DB_VERSION = 1;
const STORE_NAME = "dashboards";
const SYNC_QUEUE_STORE = "syncQueue";

// Initialize IndexedDB
async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dashboardDB = request.result;
            resolve(dashboardDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create dashboards store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                store.createIndex("timestamp", "timestamp", { unique: false });
                store.createIndex("source", "source", { unique: false });
            }
            
            // Create sync queue store
            if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
                db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id", autoIncrement: true });
            }
        };
    });
}

// Save dashboard state to IndexedDB
async function saveDashboardToIndexedDB(dashboardData) {
    if (!dashboardDB) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = dashboardDB.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        const dashboardObject = {
            data: dashboardData.data,
            chartConfigs: dashboardData.chartConfigs || [],
            slicerValue: dashboardData.slicerValue || "all",
            sourceSelection: {
                source: dashboardData.source,
                inputs: dashboardData.inputs
            },
            timestamp: new Date().getTime(),
            status: "synced"
        };
        
        const request = store.add(dashboardObject);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            updateStatusIndicator("Saved ✓", "success");
            resolve(request.result);
        };
    });
}

// Load latest dashboard from IndexedDB
async function loadLatestDashboardFromIndexedDB() {
    if (!dashboardDB) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = dashboardDB.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("timestamp");
        
        const request = index.openCursor(null, "prev"); // Get latest first
        let latestDashboard = null;
        
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                latestDashboard = cursor.value;
                cursor.continue();
            } else {
                resolve(latestDashboard);
            }
        };
    });
}

// Clear all dashboards from IndexedDB
async function clearAllDashboards() {
    if (!dashboardDB) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = dashboardDB.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            updateStatusIndicator("Cleared ✓", "info");
            resolve();
        };
    });
}

// Queue change for sync (when offline)
async function queueSyncChange(changeData) {
    if (!dashboardDB) await initIndexedDB();
    
    return new Promise((resolve, reject) => {
        const transaction = dashboardDB.transaction([SYNC_QUEUE_STORE], "readwrite");
        const store = transaction.objectStore(SYNC_QUEUE_STORE);
        
        const syncItem = {
            type: changeData.type, // "fetch", "config_update", etc.
            timestamp: new Date().getTime(),
            data: changeData.data,
            status: "pending"
        };
        
        const request = store.add(syncItem);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Update status indicator UI
function updateStatusIndicator(message, type = "info") {
    const indicator = document.getElementById("persistenceStatus");
    if (indicator) {
        indicator.textContent = message;
        indicator.className = `status-indicator status-${type}`;
    }
}

// ========== END INDEXEDDB PERSISTENCE ==========

// Input configurations
const inputsConfig = {
    mqtt: [
        { id: "broker", placeholder: "MQTT Broker" },
        { id: "port", placeholder: "Port" },
        { id: "topic", placeholder: "Topic" }
    ],
    thingspeak: [{ id: "channelId", placeholder: "Channel ID e.g. 357142" }],
    adafruit: [
        { id: "username", placeholder: "Username" },
        { id: "key", placeholder: "AIO Key" },
        { id: "feed", placeholder: "Feed Name" }
    ],
    blynk: [
        { id: "auth", placeholder: "Auth Token" },
        { id: "pin", placeholder: "Virtual Pin (V0, V1...)" }
    ],
    grafana: [
        { id: "url", placeholder: "Grafana API URL" },
        { id: "token", placeholder: "API Token" },
        { id: "query", placeholder: "Query/Metric Name" }
    ]
};

function createDynamicSlicers(rowCount) {
    const slicerGroup = document.getElementById("slicerGroup");
    slicerGroup.innerHTML = ""; // clear old slicers

    const slicerValues = new Set(); // fixed slicer
    // generate slicers dynamically based on row count
    if (rowCount > 2) slicerValues.add(2);
    if (rowCount > 10) slicerValues.add(10);
    if (rowCount > 20) slicerValues.add(20);
    if (rowCount > 50) slicerValues.add(50);
    if (rowCount > 100) slicerValues.add(100);

    // sort numerically for neat order
    const sorted = [...slicerValues].sort((a, b) => a - b);

    // add slicer buttons
    sorted.forEach(val => {
        const id = `slicer${val}`;
        slicerGroup.innerHTML += `
      <input type="radio" id="${id}" name="slicer" value="${val}">
      <label for="${id}">${val}</label>
    `;
    });

    // always add "All" slicer last and make it default
    slicerGroup.innerHTML += `
    <input type="radio" id="slicerAll" name="slicer" value="all" checked>
    <label for="slicerAll">All</label>
  `;
    slicerGroup.style.display = "flex";
}

// ✅ Copy Function
function copyRowData(btn) {
    const row = btn.closest("tr");
    const json = row.getAttribute("data-json");
    navigator.clipboard.writeText(json);
    btn.innerHTML = `<img src="app/resrc/images/tick.png"">`;
    setTimeout(() => (btn.innerHTML = `<img src="app/resrc/images/copy.png">`), 1000);
}

// ========== DATA EXPORT FUNCTIONS ==========

/**
 * Generate filename with timestamp (format: prefix_YYYY-MM-DD.extension)
 */
function generateExportFilename(prefix, extension) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${prefix}_${dateStr}.${extension}`;
}

/**
 * Export chart as PNG image
 */
async function exportChartAsPNG(chartElement, chartTitle) {
    const exportBtn = chartElement.querySelector('.chart-export-btn');
    const originalText = exportBtn ? exportBtn.textContent : '📷 Export';
    
    try {
        // Check if required libraries are loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }
        if (typeof saveAs === 'undefined') {
            throw new Error('FileSaver library not loaded');
        }
        
        // Show loading state
        if (exportBtn) {
            exportBtn.textContent = '⏳...';
            exportBtn.disabled = true;
        }
        
        chartElement.style.opacity = '0.7';
        chartElement.style.pointerEvents = 'none';
        
        const canvas = chartElement.querySelector('canvas');
        if (!canvas) {
            throw new Error('No chart canvas found');
        }
        
        const canvasImage = await html2canvas(canvas, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false
        });
        
        // Convert to blob and trigger download
        canvasImage.toBlob((blob) => {
            try {
                if (!blob) {
                    throw new Error('Failed to generate image blob');
                }
                const filename = generateExportFilename(`chart_${chartTitle.replace(/[^a-zA-Z0-9\s\-_]/g, '_').replace(/\s+/g, '_')}`, 'png');
                saveAs(blob, filename);
                showMessage(`Chart exported as ${filename} ✓`);
            } catch (blobError) {
                console.error('Blob download failed:', blobError);
                showMessage('Failed to download chart: ' + blobError.message);
            } finally {
                // Restore button state after download
                if (exportBtn) {
                    exportBtn.textContent = originalText;
                    exportBtn.disabled = false;
                }
                // Restore chart opacity
                chartElement.style.opacity = '';
                chartElement.style.pointerEvents = '';
            }
        });
        
    } catch (error) {
        console.error('Chart export failed:', error);
        showMessage('Failed to export chart: ' + error.message);
        // Restore button state on error
        if (exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
        chartElement.style.opacity = '';
        chartElement.style.pointerEvents = '';
    }
}

/**
 * Export data as CSV file
 */
function exportDataAsCSV(data, filename) {
    const exportBtn = document.querySelector('.data-export-btn');
    const originalText = exportBtn ? exportBtn.textContent : '📊 Export Data ▼';
    
    try {
        // Check if required libraries are loaded
        if (typeof Papa === 'undefined') {
            throw new Error('PapaParse library not loaded');
        }
        if (typeof saveAs === 'undefined') {
            throw new Error('FileSaver library not loaded');
        }
        
        // Show loading state
        if (exportBtn) {
            exportBtn.textContent = '⏳ Exporting...';
            exportBtn.disabled = true;
        }
        
        if (!data || !data.feeds || !data.fields) {
            throw new Error('No data available for export');
        }
        
        const csvData = [];
        const headers = ['Time', ...data.fields.map(field => field.label)];
        csvData.push(headers);
        
        data.feeds.forEach((feed, index) => {
            const row = [data.labels[index] || ''];
            data.fields.forEach(field => {
                row.push(feed[field.key] || '');
            });
            csvData.push(row);
        });
        
        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, filename);
        
        showMessage(`Data exported as ${filename} ✓`);
        
    } catch (error) {
        console.error('CSV export failed:', error);
        showMessage('Failed to export CSV: ' + error.message);
    } finally {
        // Restore button state
        if (exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }
}

/**
 * Export data as JSON file
 */
function exportDataAsJSON(data, filename) {
    const exportBtn = document.querySelector('.data-export-btn');
    const originalText = exportBtn ? exportBtn.textContent : '📊 Export Data ▼';
    
    try {
        // Check if required libraries are loaded
        if (typeof saveAs === 'undefined') {
            throw new Error('FileSaver library not loaded');
        }
        
        // Show loading state
        if (exportBtn) {
            exportBtn.textContent = '⏳ Exporting...';
            exportBtn.disabled = true;
        }
        
        if (!data) {
            throw new Error('No data available for export');
        }
        
        const exportData = {
            metadata: {
                name: data.name || 'OpenDots Export',
                description: data.desc || '',
                created: data.created || '',
                updated: data.updated || new Date().toISOString(),
                exportedAt: new Date().toISOString(),
                totalRecords: data.feeds ? data.feeds.length : 0
            },
            fields: data.fields || [],
            data: data.feeds || [],
            labels: data.labels || []
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        saveAs(blob, filename);
        
        showMessage(`Data exported as ${filename} ✓`);
        
    } catch (error) {
        console.error('JSON export failed:', error);
        showMessage('Failed to export JSON: ' + error.message);
    } finally {
        // Restore button state
        if (exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }
}

/**
 * Toggle export dropdown visibility
 */
function toggleExportDropdown() {
    const dropdown = document.getElementById('exportOptions');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close export dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('exportOptions');
    const button = document.querySelector('.data-export-btn');
    
    if (dropdown && button && !button.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// ========== END DATA EXPORT FUNCTIONS ==========

// ---------- EVENT: Source Change ----------
sourceSelect.addEventListener("change", () => {
    resetUI();
    renderInputs();
});

// ---------- FUNCTION: Render Inputs ----------
function renderInputs() {
    const source = sourceSelect.value;
    container.innerHTML = "";

    if (!source || !inputsConfig[source]) {
        loadBtn.style.display = "none";
        return;
    }

    inputsConfig[source].forEach(inp => {
        const inputEl = document.createElement("input");
        inputEl.type = "text";
        inputEl.id = inp.id;
        inputEl.placeholder = inp.placeholder;
        container.appendChild(inputEl);
    });

    loadBtn.style.display = "flex";
}

// ---------- FUNCTION: Reset UI ----------
function resetUI() {
    const idsToClear = ["chName", "chDesc", "chCreated", "chUpdated", "chFields"];
    idsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });

    const clearSections = ["details", "chartsContainer", "tableContainer", "logSection", "slicerGroup"];
    clearSections.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === "chartsContainer" || id === "tableContainer") el.innerHTML = "";
        else el.style.display = "none";
    });
}


function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

const colors = [
    "#fde725",
    "#5ec962",
    "#21918c",
    "#3b528b",
    "#f89540",
    "#cc4778",
    "#7e03a8",
];
let charts = [];

// ---------- GLOBAL VARIABLES ----------
let data = null; // 🌍 Global variable

// ---------- DATA LOADER ----------
async function loadData() {
    loader.classList.add("visible");
    const btn = loadBtn;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<l-line-spinner size="14" stroke="1" speed="1" color="white" style="vertical-align:middle; margin-right: 10px;"></l-line-spinner> Fetching...`;
    const source = document.getElementById("sourceSelect").value;

    // Validate required fields
    for (const f of inputsConfig[source] || []) {
        const val = document.getElementById(f.id)?.value.trim();
        if (!val) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            loader.classList.remove("visible");
            resetUI();
            return showMessage(`Please enter a valid ${f.placeholder}.`);
        }
    }

    try {
        // Assign to global variable here 👇
        data =
            source === "thingspeak"
                ? await fetchThingSpeak(document.getElementById("channelId").value)
                : source === "adafruit"
                    ? await fetchAdafruit(
                        document.getElementById("username").value,
                        document.getElementById("key").value,
                        document.getElementById("feed").value
                    )
                    : source === "blynk"
                        ? await fetchBlynk(
                            document.getElementById("auth").value,
                            document.getElementById("pin").value
                        )
                        : source === "grafana"
                            ? await fetchGrafana(
                                document.getElementById("url").value,
                                document.getElementById("token").value,
                                document.getElementById("query").value
                            )
                            : null;

        if (data) {
            renderData(data);
            
            // Save dashboard state to IndexedDB (Solix approach)
            const inputValues = {};
            for (const input of inputsConfig[source] || []) {
                inputValues[input.id] = document.getElementById(input.id)?.value || "";
            }
            
            await saveDashboardToIndexedDB({
                data: data,
                chartConfigs: charts.map(c => ({ type: c.config.type, data: c.data, options: c.options })),
                slicerValue: document.querySelector('input[name="slicer"]:checked')?.value || "all",
                source: source,
                inputs: inputValues
            });
            
            // Start background fetch for fresh data
            backgroundFetchFreshData(source, inputValues);
        }
    } catch (err) {
        resetUI();
        showMessage("Error: " + err.message);
        loader.classList.remove("visible");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        loader.classList.remove("visible");
    }
}


// ---------- FETCHERS ----------
async function fetchThingSpeak(channelId) {
    const res = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json`);
    if (!res.ok) throw new Error("ThingSpeak fetch failed");
    const json = await res.json();

    const fields = [];
    for (let i = 1; i <= 8; i++) {
        const label = json.channel[`field${i}`];
        if (label) fields.push({ key: `field${i}`, label });
    }

    return {
        name: json.channel.name ?? "—",
        desc: json.channel.description ?? "—",
        created: json.channel.created_at ?? "—",
        updated: json.channel.updated_at ?? "—",
        labels: json.feeds.map(f => new Date(f.created_at).toLocaleString()),
        fields,
        feeds: json.feeds
    };
}

async function fetchAdafruit(user, key, feed) {
    const res = await fetch(`https://io.adafruit.com/api/v2/${user}/feeds/${feed}/data`, {
        headers: { "X-AIO-Key": key }
    });
    if (!res.ok) throw new Error("Adafruit fetch failed");
    const json = await res.json();
    return {
        name: feed,
        desc: "",
        created: "—",
        updated: "—",
        labels: json.map(f => new Date(f.created_at).toLocaleString()),
        fields: [{ key: "value", label: feed }],
        feeds: json.map(f => ({ value: f.value }))
    };
}

async function fetchBlynk(auth, pin) {
    const res = await fetch(`https://blynk.cloud/external/api/get?token=${auth}&${pin}`);
    if (!res.ok) throw new Error("Blynk fetch failed");
    const val = await res.text();
    return {
        name: `Pin ${pin}`,
        desc: "",
        created: "—",
        updated: new Date().toLocaleString(),
        labels: [new Date().toLocaleString()],
        fields: [{ key: "value", label: `Pin ${pin}` }],
        feeds: [{ value: val }]
    };
}

async function fetchGrafana(url, token, query) {
    const res = await fetch(`${url}/api/ds/query`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ queries: [{ expr: query, interval: "30s" }] })
    });
    if (!res.ok) throw new Error("Grafana fetch failed");
    const json = await res.json();
    const series = json.results?.A?.frames?.[0]?.data ?? {};
    return {
        name: query,
        desc: "",
        created: "—",
        updated: new Date().toLocaleString(),
        labels: series?.time?.map(t => new Date(t).toLocaleString()) ?? [],
        fields: [{ key: "value", label: query }],
        feeds: (series?.values ?? []).map(v => ({ value: v }))
    };
}

// ---------- RENDER ----------
function renderData(data) {
    console.log("Data loaded:", data);
    createDynamicSlicers(data.feeds.length);
    const getSlicerValue = () =>
        document.querySelector('input[name="slicer"]:checked')?.value || "all";

    const applySlicer = () => {
        let count = getSlicerValue();
        let feeds = data.feeds;
        let labels = data.labels;

        if (count !== "all") {
            const n = parseInt(count);
            feeds = feeds.slice(-n);
            labels = labels.slice(-n);
        }

        renderChartsAndTable({ ...data, feeds, labels });
    };

    document.querySelectorAll('input[name="slicer"]').forEach(radio => {
        radio.onchange = applySlicer;
    });

    applySlicer();
}

function renderChartsAndTable(data) {
    // Details
    document.getElementById("details").style.display = "block";
    document.getElementById("chName").textContent = data.name;
    document.getElementById("chDesc").textContent = data.desc;
    document.getElementById("chCreated").textContent = data.created;
    document.getElementById("chUpdated").textContent = data.updated;
    document.getElementById("chFields").textContent = data.fields.map(f => f.label).join(", ");

    // Reset old charts
    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = "";
    charts.forEach(c => c.destroy());
    charts = [];

    // ✅ Combined chart (All data together)
    const combinedBlock = document.createElement("div");
    combinedBlock.className = "chart-block";
    combinedBlock.innerHTML = `
        <div class="chart-header">
            <h3>All Data Overview</h3>
            <button class="export-btn chart-export-btn" onclick="exportChartAsPNG(this.closest('.chart-block'), 'All_Data_Overview')" title="Export chart as PNG" id="export-btn-combined">
                📷 Export
            </button>
        </div>
        <canvas style="width:100%; height:auto;"></canvas>
    `;
    chartsContainer.appendChild(combinedBlock);

    const combinedCtx = combinedBlock.querySelector("canvas").getContext("2d");

    const datasets = data.fields.map((field, idx) => {
        const color = colors[idx % colors.length];
        const values = data.feeds.map(f => {
            const v = f[field.key];
            const n = Number(v);
            return isFinite(n) ? n : null;
        });
        if (!values.some(v => v !== null)) return null;
        return {
            label: field.label,
            data: values,
            borderColor: color,
            borderWidth: 1,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 3
        };
    }).filter(Boolean);

    const combinedChart = new Chart(combinedCtx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5, // allow it to shrink naturally
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    align: "start"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: data.xLabel || "Timestamp"
                    },
                    ticks: {
                        maxRotation: 90,
                        minRotation: 90, // 🔥 forces exact vertical labels
                        autoSkip: true
                    },
                    grid: { color: "#2c2c2cff" }
                },
                y: {
                    title: { display: true, text: "Values" },
                    grid: { color: "#2c2c2cff" }
                }
            }
        }
    });

    charts.push(combinedChart);

    // ✅ Individual charts
    data.fields.forEach((field, idx) => {
        const values = data.feeds.map(f => {
            const v = f[field.key];
            const n = Number(v);
            return isFinite(n) ? n : null;
        });
        if (!values.some(v => v !== null)) return;

        const block = document.createElement("div");
        block.className = "chart-block";
        block.innerHTML = `
            <div class="chart-header">
                <h3>${field.label}</h3>
                <button class="export-btn chart-export-btn" onclick="exportChartAsPNG(this.closest('.chart-block'), '${field.label.replace(/'/g, "\\'")}')" title="Export chart as PNG" id="export-btn-${field.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}">
                    📷 Export
                </button>
            </div>
            <canvas style="width:100%; height:auto;"></canvas>
        `;
        chartsContainer.appendChild(block);

        const ctx = block.querySelector("canvas").getContext("2d");
        const color = colors[idx % colors.length];
        const chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: field.label,
                    data: values,
                    borderColor: color,
                    borderWidth: 1,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    backgroundColor: ctx => {
                        const { chartArea } = ctx.chart;
                        if (!chartArea) return null;
                        const gradient = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, color + "99");
                        gradient.addColorStop(1, color + "00");
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        align: "start"
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: data.xLabel || "Timestamp"
                        },
                        ticks: {
                            maxRotation: 90,
                            minRotation: 90, // 🔥 exactly vertical timestamps
                            autoSkip: true
                        },
                        grid: { color: "#2c2c2cff" }
                    },
                    y: {
                        title: { display: true, text: field.label },
                        grid: { color: "#2c2c2cff" }
                    }
                }
            }
        });

        charts.push(chart);
    });

    // ✅ Table with Serial No + Hover Copy Button
    document.getElementById("logSection").style.display = "block";

    // Table Head
    let thead = `<tr><th>#</th><th>Time</th>${data.fields.map(f => `<th>${f.label}</th>`).join("")}</tr>`;

    // Table Rows
    let rows = data.feeds
        .map((f, i) => {
            const cols = data.fields.map(field => {
                const v = f[field.key];
                return `<td>${v ? escapeHtml(String(v)) : "-"}</td>`;
            });
            const time = data.labels[i] ?? "-";
            const serial = i + 1;
            const rowData = JSON.stringify(
                Object.fromEntries([
                    ["Time", time],
                    ...data.fields.map(field => [field.label, f[field.key] ?? "-"])
                ]),
                null,
                2
            );

            return `
        <tr data-json='${escapeHtml(rowData)}'>
            <td>
                <button class="copy-btn" title="Copy JSON" onclick="copyRowData(this)"><img src="app/resrc/images/copy.png""></button>${serial}
            </td>
            <td>${time}</td>
            ${cols.join("")}
        </tr>`;
        })
        .join("");

    // Render export controls + table
    document.getElementById("tableContainer").innerHTML = `
    <div class="data-export-controls">
        <div class="export-dropdown">
            <button class="export-btn data-export-btn" onclick="toggleExportDropdown()">
                📊 Export Data ▼
            </button>
            <div class="export-options" id="exportOptions">
                <button onclick="exportDataAsCSV(data, generateExportFilename('data', 'csv'))">Export as CSV</button>
                <button onclick="exportDataAsJSON(data, generateExportFilename('data', 'json'))">Export as JSON</button>
            </div>
        </div>
    </div>
    <table class="data-table">
        <thead>${thead}</thead>
        <tbody>${rows}</tbody>
    </table>
`;

    enableChartModal();
}

const dividers = document.querySelectorAll('.divider');
let isDragging = false;
let currentDivider;

dividers.forEach(divider => {
    divider.addEventListener('mousedown', e => {
        isDragging = true;
        currentDivider = divider;
        document.body.style.cursor = 'col-resize';
    });
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const container = document.querySelector('.container');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (currentDivider.id === 'divider1') {
        const newWidth = Math.min(Math.max(x, 200), 500);
        document.getElementById('config').style.width = `${newWidth}px`;
    } else if (currentDivider.id === 'divider2') {
        const containerWidth = rect.width;
        const rightX = containerWidth - (e.clientX - rect.left);
        const newWidth = Math.min(Math.max(rightX, 200), 500);
        document.getElementById('ai').style.width = `${newWidth}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default';
});


// Attach modal behavior to every chart canvas
function enableChartModal() {
    document.querySelectorAll('.chart-block canvas').forEach(canvas => {
        canvas.addEventListener('click', () => openChartModal(canvas));
    });
}

function openChartModal(originalCanvas) {
    const modal = document.createElement('div');
    modal.className = 'chart-modal active';
    modal.innerHTML = `
    <div class="chart-modal-content">
      <span class="chart-modal-close">&times;</span>
      <canvas></canvas>
    </div>
  `;
    document.body.appendChild(modal);

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.chart-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });

    const ctx = modal.querySelector('canvas').getContext('2d');
    const chart = Chart.getChart(originalCanvas);

    if (chart) {
        // Safe manual cloning (strip functions)
        const chartData = JSON.parse(JSON.stringify(chart.data));
        const chartOptions = JSON.parse(JSON.stringify(chart.options));

        new Chart(ctx, {
            type: chart.config.type,
            data: chartData,
            options: {
                ...chartOptions,
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    }
}

// ========== PERSISTENCE CONTROL FUNCTIONS ==========

// Background fetch for fresh data (Solix approach - updates cache)
async function backgroundFetchFreshData(source, inputValues) {
    // Fetch silently in background without showing loader
    try {
        updateStatusIndicator("Syncing...", "loading");
        
        let freshData = null;
        if (source === "thingspeak") {
            freshData = await fetchThingSpeak(inputValues.channelId);
        } else if (source === "adafruit") {
            freshData = await fetchAdafruit(inputValues.username, inputValues.key, inputValues.feed);
        } else if (source === "blynk") {
            freshData = await fetchBlynk(inputValues.auth, inputValues.pin);
        } else if (source === "grafana") {
            freshData = await fetchGrafana(inputValues.url, inputValues.token, inputValues.query);
        }
        
        if (freshData && freshData !== data) {
            // Data updated, save new version and re-render
            data = freshData;
            renderData(data); // Re-render charts and table with fresh data
            await saveDashboardToIndexedDB({
                data: data,
                chartConfigs: charts.map(c => ({ type: c.config.type, data: c.data, options: c.options })),
                slicerValue: document.querySelector('input[name="slicer"]:checked')?.value || "all",
                source: source,
                inputs: inputValues
            });
            updateStatusIndicator("Updated " + new Date().toLocaleTimeString(), "success");
        } else {
            updateStatusIndicator("Up to date ✓", "success");
        }
    } catch (err) {
        console.log("Background sync failed (will retry later):", err);
        // Queue this for later sync if offline
        if (!navigator.onLine) {
            await queueSyncChange({
                type: "fresh_data_fetch",
                data: { source, inputValues }
            });
            updateStatusIndicator("Offline - will sync later", "offline");
        }
    }
}

// Manually save current dashboard state
async function saveDashboardState() {
    if (!data) {
        showMessage("No data to save. Fetch data first.");
        return;
    }
    
    try {
        const source = document.getElementById("sourceSelect").value;
        const inputValues = {};
        for (const input of inputsConfig[source] || []) {
            inputValues[input.id] = document.getElementById(input.id)?.value || "";
        }
        
        await saveDashboardToIndexedDB({
            data: data,
            chartConfigs: charts.map(c => ({ type: c.config.type, data: c.data, options: c.options })),
            slicerValue: document.querySelector('input[name="slicer"]:checked')?.value || "all",
            source: source,
            inputs: inputValues
        });
        
        showMessage("Dashboard saved successfully! ✓");
    } catch (err) {
        showMessage("Error saving dashboard: " + err.message);
    }
}

// Manually load latest saved dashboard
async function loadDashboardState() {
    try {
        const savedDashboard = await loadLatestDashboardFromIndexedDB();
        
        if (!savedDashboard) {
            showMessage("No saved dashboard found.");
            return;
        }
        
        // Check if data is recent
        const age = new Date().getTime() - savedDashboard.timestamp;
        const ageHours = Math.floor(age / (1000 * 60 * 60));
        
        if (ageHours > 24) {
            const confirmLoad = confirm(`Saved data is ${ageHours} hours old. Load it anyway?`);
            if (!confirmLoad) return;
        }
        
        // Restore data
        data = savedDashboard.data;
        const source = savedDashboard.sourceSelection.source;
        
        // Set source and input values
        document.getElementById("sourceSelect").value = source;
        resetUI();
        renderInputs();
        
        for (const [key, value] of Object.entries(savedDashboard.sourceSelection.inputs)) {
            const input = document.getElementById(key);
            if (input) input.value = value;
        }
        
        // Render data and restore slicer
        renderData(data);
        const slicerRadio = document.querySelector(`input[name="slicer"][value="${savedDashboard.slicerValue}"]`);
        if (slicerRadio) slicerRadio.checked = true;
        
        // Show when data was saved
        const savedTime = new Date(savedDashboard.timestamp).toLocaleString();
        updateStatusIndicator(`Loaded (${savedTime})`, "success");
        showMessage(`Dashboard loaded from ${savedTime} ✓`);
        
        // Start background sync for fresh data
        backgroundFetchFreshData(source, savedDashboard.sourceSelection.inputs);
    } catch (err) {
        showMessage("Error loading dashboard: " + err.message);
    }
}

// Clear all saved dashboards
async function clearDashboardState() {
    const confirmed = confirm("Delete all saved dashboards? This cannot be undone.");
    if (!confirmed) return;
    
    try {
        await clearAllDashboards();
        resetUI();
        document.getElementById("sourceSelect").value = "DataSource";
        showMessage("All saved dashboards cleared. ✓");
    } catch (err) {
        showMessage("Error clearing dashboards: " + err.message);
    }
}

// ========== END PERSISTENCE CONTROL FUNCTIONS ==========

async function ask() {
    const queryInput = document.getElementById("query");
    const query = queryInput.value.trim();
    const responseContainer = document.getElementById("response-container");
    if (!query) return showMessage("Please enter a query for Infinity AI.");

    // Reset input
    queryInput.value = "";
    responseContainer.innerHTML += `<div class="user-query">${query}</div>`;
    responseContainer.innerHTML += `<div class="ai-response typing">Thinking...</div>`;
    responseContainer.scrollTop = responseContainer.scrollHeight;

    try {
        const apiKey = "";
        const payload = {
            contents: [{
                role: "user",
                parts: [{
                    text: `
You are Infinity AI, an intelligent assistant built into OpenDots. 
Always respond in a single <div> that may contain text, tables, charts, lists, and optional <style> and <script> tags.
User query: ${query}
Data: ${JSON.stringify(data || {})}
                    `
                }]
            }]
        };

        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=" + apiKey,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );


        const json = await res.json();
        const reply = json.candidates?.[0]?.content?.parts?.[0]?.text || `I couldn't process your request.`;

        const typingDiv = document.querySelector(".ai-response.typing");
        if (typingDiv) typingDiv.remove();

        const aiDiv = document.createElement("div");
        aiDiv.className = "ai-response";
        aiDiv.innerHTML = reply;
        responseContainer.appendChild(aiDiv);
        responseContainer.scrollTop = responseContainer.scrollHeight;
    } catch (err) {
        const typingDiv = document.querySelector(".ai-response.typing");
        if (typingDiv) typingDiv.remove();
        responseContainer.innerHTML += `<div class="ai-response error">Error: ${err.message}</div>`;
        responseContainer.scrollTop = responseContainer.scrollHeight;
    }
}

function clearChat() {
    const responseContainer = document.getElementById("response-container");
    responseContainer.innerHTML = "";
}