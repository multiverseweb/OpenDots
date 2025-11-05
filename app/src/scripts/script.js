const sourceSelect = document.getElementById("sourceSelect");
const loadBtn = document.getElementById("loadBtn");
const container = document.getElementById("dynamicInputs");

if (!sourceSelect || !loadBtn || !container) {
    showMessage("Error: Required UI elements are missing.");
}

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

    const clearSections = ["details", "chartsContainer", "tableContainer", "logSection"];
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

// ---------- DATA LOADER ----------
async function loadData() {
    const btn = loadBtn;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<img src="app/resrc/loading.gif" style="height:15px;vertical-align:middle;" class="loading">&nbsp;Fetching...`;
    const source = document.getElementById("sourceSelect").value;

    // Validate required fields
    for (const f of inputsConfig[source] || []) {
        const val = document.getElementById(f.id)?.value.trim();
        if (!val) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            return showMessage(`Please enter a valid ${f.placeholder}.`);
        }
    }

    try {
        const data =
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

        if (data) renderData(data);
    } catch (err) {
        showMessage("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
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

    // Bind slicer events (only once)
    document.querySelectorAll('input[name="slicer"]').forEach(radio => {
        radio.onchange = applySlicer;
    });

    // Initial render
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
    combinedBlock.innerHTML = `<h3>All Data Overview</h3><canvas style="width:100%; height:auto;"></canvas>`;
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
        block.innerHTML = `<h3>${field.label}</h3><canvas style="width:100%; height:auto;"></canvas>`;
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

    // ✅ Table
    document.getElementById("logSection").style.display = "block";
    let thead = `<tr><th>Time</th>${data.fields.map(f => `<th>${f.label}</th>`).join("")}</tr>`;
    let rows = data.feeds
        .map((f, i) => {
            const cols = data.fields.map(field => {
                const v = f[field.key];
                return `<td>${v ? escapeHtml(String(v)) : "-"}</td>`;
            });
            return `<tr><td>${data.labels[i] ?? "-"}</td>${cols.join("")}</tr>`;
        })
        .join("");
    document.getElementById("tableContainer").innerHTML =
        `<table><thead>${thead}</thead><tbody>${rows}</tbody></table>`;
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
