document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENT SELECTORS ---
    const dateEl = document.getElementById("date");
    const timeEl = document.getElementById("time");
    const quoteNumberEl = document.getElementById("quoteNumber");
    const tableBody = document.querySelector("#quotationTable tbody");
    const subtotalEl = document.getElementById("subtotal");
    const discountEl = document.getElementById("discount");
    const finalAmountEl = document.getElementById("finalAmount");
    const balanceEl = document.getElementById("balance");
    const discountInput = document.getElementById("discountInput");
    const advanceInput = document.getElementById("advanceInput");
    const addItemBtn = document.getElementById("addItem");
    const printBtn = document.getElementById("printBtn");
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const newBtn = document.getElementById("newBtn");
    
    // Customer details elements
    const customerName = document.getElementById("customerName");
    const customerAddress = document.getElementById("customerAddress");
    const customerEmail = document.getElementById("customerEmail");
    const customerPhone = document.getElementById("customerPhone");
    const validUntil = document.getElementById("validUntil");
    const projectName = document.getElementById("projectName");
    const paymentTerms = document.getElementById("paymentTerms");

    // --- FUNCTIONS ---
    
    /**
     * Generates a unique quote number based on current date and time
     */
    function generateQuoteNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `Q-${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    /**
     * Sets the current date and time in the document.
     */
    function setDateTime() {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        timeEl.textContent = now.toLocaleTimeString("en-US", { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
    }

    /**
     * Sets default valid until date (30 days from now)
     */
    function setDefaultValidUntil() {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        validUntil.value = futureDate.toISOString().split('T')[0];
    }

    // Update date and time every second
    setInterval(setDateTime, 1000);
    

    /**
     * Updates all financial calculations based on table and input values.
     */
    function updateCalculations() {
        let subtotal = 0;
        tableBody.querySelectorAll("tr").forEach(row => {
            const qty = parseFloat(row.querySelector(".qty")?.value) || 0;
            const price = parseFloat(row.querySelector(".price")?.value) || 0;
            const total = qty * price;
            row.querySelector(".total").textContent = total.toFixed(2);
            subtotal += total;
        });

        const discountPercent = parseFloat(discountInput.value) || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const finalAmount = subtotal - discountAmount;
        const advanceAmount = parseFloat(advanceInput.value) || 0;
        const balance = finalAmount - advanceAmount;

        subtotalEl.textContent = subtotal.toFixed(2);
        discountEl.textContent = discountAmount.toFixed(2);
        finalAmountEl.textContent = finalAmount.toFixed(2);
        balanceEl.textContent = balance.toFixed(2);
    }

    /**
     * Adds a new item row to the quotation table.
     */
    function addItemRow() {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="text" class="form-control form-control-sm desc" placeholder="Item Description"></td>
            <td><input type="number" class="form-control form-control-sm qty text-end" value="1" min="1"></td>
            <td><input type="number" class="form-control form-control-sm price text-end" value="0.00" min="0" step="0.01"></td>
            <td class="total text-end">0.00</td>
            <td class="action-column"><button class="btn btn-danger btn-sm remove">×</button></td>
        `;
        tableBody.appendChild(row);
        updateCalculations();
    }

    /**
     * Saves the current quotation to localStorage
     */
    function saveQuotation() {
        const quotationData = {
            quoteNumber: quoteNumberEl.textContent,
            customerName: customerName.value,
            customerAddress: customerAddress.value,
            customerEmail: customerEmail.value,
            customerPhone: customerPhone.value,
            validUntil: validUntil.value,
            projectName: projectName.value,
            paymentTerms: paymentTerms.value,
            discountPercent: discountInput.value,
            advanceAmount: advanceInput.value,
            items: []
        };

        // Save all items
        tableBody.querySelectorAll("tr").forEach(row => {
            const desc = row.querySelector(".desc")?.value || "";
            const qty = row.querySelector(".qty")?.value || "1";
            const price = row.querySelector(".price")?.value || "0.00";
            
            if (desc.trim()) {
                quotationData.items.push({ desc, qty, price });
            }
        });

        const quotationKey = `quotation_${quotationData.quoteNumber}`;
        localStorage.setItem(quotationKey, JSON.stringify(quotationData));
        
        // Save to recent quotations list
        let recentQuotations = JSON.parse(localStorage.getItem('recentQuotations') || '[]');
        recentQuotations = recentQuotations.filter(q => q.quoteNumber !== quotationData.quoteNumber);
        recentQuotations.unshift({
            quoteNumber: quotationData.quoteNumber,
            customerName: quotationData.customerName,
            date: dateEl.textContent,
            savedAt: new Date().toISOString()
        });
        recentQuotations = recentQuotations.slice(0, 10); // Keep only last 10
        localStorage.setItem('recentQuotations', JSON.stringify(recentQuotations));

        alert(`Quotation ${quotationData.quoteNumber} saved successfully!`);
    }

    /**
     * Loads a quotation from localStorage
     */
    function loadQuotation() {
        const recentQuotations = JSON.parse(localStorage.getItem('recentQuotations') || '[]');
        
        if (recentQuotations.length === 0) {
            alert('No saved quotations found!');
            return;
        }

        let options = 'Select a quotation to load:\n\n';
        recentQuotations.forEach((q, index) => {
            options += `${index + 1}. ${q.quoteNumber} - ${q.customerName || 'No Name'} (${q.date})\n`;
        });

        const selection = prompt(options + '\nEnter the number of the quotation to load:');
        const selectedIndex = parseInt(selection) - 1;

        if (selectedIndex >= 0 && selectedIndex < recentQuotations.length) {
            const selectedQuote = recentQuotations[selectedIndex];
            const quotationKey = `quotation_${selectedQuote.quoteNumber}`;
            const quotationData = JSON.parse(localStorage.getItem(quotationKey));

            if (quotationData) {
                loadQuotationData(quotationData);
                alert(`Quotation ${selectedQuote.quoteNumber} loaded successfully!`);
            } else {
                alert('Quotation data not found!');
            }
        }
    }

    /**
     * Loads quotation data into the form
     */
    function loadQuotationData(data) {
        quoteNumberEl.textContent = data.quoteNumber;
        customerName.value = data.customerName || '';
        customerAddress.value = data.customerAddress || '';
        customerEmail.value = data.customerEmail || '';
        customerPhone.value = data.customerPhone || '';
        validUntil.value = data.validUntil || '';
        projectName.value = data.projectName || '';
        paymentTerms.value = data.paymentTerms || 'Due on Receipt';
        discountInput.value = data.discountPercent || '10';
        advanceInput.value = data.advanceAmount || '0';

        // Clear existing items
        tableBody.innerHTML = '';

        // Load items
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><input type="text" class="form-control form-control-sm desc" value="${item.desc}"></td>
                    <td><input type="number" class="form-control form-control-sm qty text-end" value="${item.qty}" min="1"></td>
                    <td><input type="number" class="form-control form-control-sm price text-end" value="${item.price}" min="0" step="0.01"></td>
                    <td class="total text-end">0.00</td>
                    <td class="action-column"><button class="btn btn-danger btn-sm remove">×</button></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            addItemRow();
        }

        updateCalculations();
    }

    /**
     * Creates a new quotation
     */
    function newQuotation() {
        if (confirm('Are you sure you want to create a new quotation? Any unsaved changes will be lost.')) {
            // Reset all form fields
            quoteNumberEl.textContent = generateQuoteNumber();
            customerName.value = '';
            customerAddress.value = '';
            customerEmail.value = '';
            customerPhone.value = '';
            projectName.value = '';
            paymentTerms.value = 'Due on Receipt';
            discountInput.value = '10';
            advanceInput.value = '0';
            
            // Clear items and add one empty row
            tableBody.innerHTML = '';
            addItemRow();
            
            // Reset valid until date
            setDefaultValidUntil();
            
            updateCalculations();
        }
    }

    // --- EVENT LISTENERS ---
    addItemBtn.addEventListener("click", addItemRow);

    tableBody.addEventListener("input", updateCalculations);
    
    tableBody.addEventListener("click", e => {
        if (e.target.classList.contains("remove")) {
            if (tableBody.children.length > 1) {
                e.target.closest("tr").remove();
                updateCalculations();
            } else {
                alert("At least one item is required!");
            }
        }
    });

    discountInput.addEventListener("input", updateCalculations);
    advanceInput.addEventListener("input", updateCalculations);

    // Button event listeners
    printBtn.addEventListener("click", () => {
        window.print();
    });

    saveBtn.addEventListener("click", saveQuotation);
    loadBtn.addEventListener("click", loadQuotation);
    newBtn.addEventListener("click", newQuotation);

    // --- INITIALIZATION ---
    setDateTime();
    quoteNumberEl.textContent = generateQuoteNumber();
    setDefaultValidUntil();
    addItemRow();
});