document.getElementById("year").innerText = new Date().getFullYear();

function toggleAi() {
    const infinity = document.getElementById("ai");
    infinity.style.display = infinity.style.display === "block" ? "none" : "block";
}
async function loadComponents() {
    const elements = document.querySelectorAll("[data-include]");

    for (const el of elements) {
        const file = el.getAttribute("data-include");

        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`Failed to load ${file}`);

            const html = await res.text();
            el.innerHTML = html;
        } catch (err) {
            showMessage(`Error loading ${file}: ${err.message}`);
        }
    }
}

document.addEventListener("DOMContentLoaded", loadComponents);
function showMessage(msg) {
    const msgContainer = document.getElementById("msg-container");

    // Create a new message element each time
    const el = document.createElement("div");
    el.className = "msg";
    el.textContent = msg;

    msgContainer.appendChild(el);

    // Animate in
    requestAnimationFrame(() => {
        el.style.visibility = "visible";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(-10px)";
        setTimeout(() => {
            el.remove();
            if (!msgContainer.hasChildNodes()) msgContainer.remove();
        }, 400);
    }, 3000);
}

function hideMessage() {
    const el = document.getElementById("message");
    if (!el) return;

    el.style.opacity = "0";
    el.style.top = "5px";

    // Wait for CSS transition to end, then hide
    setTimeout(() => {
        el.style.visibility = "hidden";
        el.textContent = "";
    }, 500);
}

// ========== OFFLINE DETECTION & AUTO-RESTORE (Solix Approach) ==========

// Listen for online/offline events
window.addEventListener("online", () => {
    console.log("🟢 Back online - syncing queued changes...");
    const indicator = document.getElementById("persistenceStatus");
    if (indicator) {
        indicator.textContent = "Syncing...";
        indicator.className = "status-indicator status-loading";
    }
    // Sync queued changes
    syncQueuedChanges();
});

window.addEventListener("offline", () => {
    console.log("🔴 Going offline - using cached data...");
    const indicator = document.getElementById("persistenceStatus");
    if (indicator) {
        indicator.textContent = "Offline mode";
        indicator.className = "status-indicator status-offline";
    }
});

// Function to sync queued changes when back online
async function syncQueuedChanges() {
    try {
        if (typeof dashboardDB === "undefined" || !dashboardDB) return;
        
        const transaction = dashboardDB.transaction(["syncQueue"], "readonly");
        const store = transaction.objectStore("syncQueue");
        const request = store.getAll();
        
        request.onsuccess = async (event) => {
            const queuedChanges = event.target.result;
            
            if (queuedChanges.length > 0) {
                console.log(`Syncing ${queuedChanges.length} queued changes...`);
                
                for (const change of queuedChanges) {
                    try {
                        // Process each queued change (e.g., retry failed fetches)
                        if (change.type === "fresh_data_fetch") {
                            await backgroundFetchFreshData(change.data.source, change.data.inputValues);
                        }
                        // Remove from queue after processing
                        const deleteTransaction = dashboardDB.transaction(["syncQueue"], "readwrite");
                        const deleteStore = deleteTransaction.objectStore("syncQueue");
                        deleteStore.delete(change.id);
                    } catch (err) {
                        console.log("Failed to sync change:", err);
                    }
                }
                
                const indicator = document.getElementById("persistenceStatus");
                if (indicator) {
                    indicator.textContent = "Synced ✓";
                    indicator.className = "status-indicator status-success";
                }
            }
        };
    } catch (err) {
        console.log("Sync failed:", err);
    }
}

// Auto-restore dashboard on page load
document.addEventListener("DOMContentLoaded", async () => {
    await loadComponents();
    
    // Initialize IndexedDB and check for saved dashboard
    setTimeout(async () => {
        try {
            if (typeof initIndexedDB === "function") {
                await initIndexedDB();
                
                if (typeof loadLatestDashboardFromIndexedDB === "function") {
                    const savedDashboard = await loadLatestDashboardFromIndexedDB();
                    
                    if (savedDashboard) {
                        const age = new Date().getTime() - savedDashboard.timestamp;
                        const ageMinutes = Math.floor(age / (1000 * 60));
                        
                        // Show auto-restore option
                        const restoreMsg = document.createElement("div");
                        restoreMsg.id = "restorePrompt";
                        restoreMsg.className = "restore-prompt";
                        restoreMsg.innerHTML = `
                            <span>📂 Restore dashboard from ${ageMinutes}min ago?</span>
                            <button onclick="loadDashboardState()" class="restore-yes">Yes</button>
                            <button onclick="this.parentElement.remove()" class="restore-no">No</button>
                        `;
                        document.body.insertBefore(restoreMsg, document.body.firstChild);
                    }
                }
            }
        } catch (err) {
            console.log("Auto-restore check failed:", err);
        }
    }, 100);
});

// ========== END OFFLINE DETECTION & AUTO-RESTORE ==========

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then(reg => console.log("✅ Service Worker registered:", reg.scope))
            .catch(err => console.log("❌ Service Worker registration failed:", err));
    });
}

document.getElementById("themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("invert");

    document.querySelectorAll(".same").forEach(el => {
        el.classList.toggle("invert");
    });
});