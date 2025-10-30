let web3;
let contract;
let userAccount;

// Contract details
const CONTRACT_ADDRESS = "0xbCC791770d54C3Bc40d68a68b99dd9c64c3a18c7";
const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "hash",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "mineName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "oreGrade",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "oreType",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "storedBy",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "DataStored",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_hash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_mineName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_oreGrade",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_oreType",
                "type": "string"
            }
        ],
        "name": "storeMiningData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_hash",
                "type": "string"
            }
        ],
        "name": "getMiningData",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Transaction storage
let transactionHistory = JSON.parse(localStorage.getItem('mineLedgerTransactions')) || [];
let successfulTransactions = parseInt(localStorage.getItem('successfulTransactions')) || 0;

// Initialize Web3
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            userAccount = accounts[0];
            
            updateConnectionStatus(true, userAccount);
            updateDashboardStats();
            loadTransactionHistory();
            
            contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            console.log("MineLedger: Contract initialized successfully");
            
            showNotification('Wallet connected successfully!', 'success');
            return true;
        } catch (error) {
            console.error("User denied account access", error);
            updateConnectionStatus(false);
            showNotification('Failed to connect wallet', 'error');
            return false;
        }
    } else {
        showNotification('Please install MetaMask to use MineLedger!', 'error');
        updateConnectionStatus(false);
        return false;
    }
}

// Update connection status UI
function updateConnectionStatus(connected, account = null) {
    const statusElement = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectBtn');
    
    if (connected && account) {
        statusElement.innerHTML = `<i class="fas fa-circle" style="color: var(--success)"></i> Connected | ${account.substring(0, 6)}...${account.substring(38)}`;
        statusElement.classList.add('connected');
        connectBtn.textContent = 'Connected';
        connectBtn.style.background = 'var(--success)';
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: var(--error)"></i> Disconnected from MetaMask';
        statusElement.classList.remove('connected');
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.style.background = 'var(--primary)';
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('totalTransactions').textContent = transactionHistory.length;
    document.getElementById('successfulTransactions').textContent = successfulTransactions;
    document.getElementById('uptimePercentage').textContent = '100%';
    document.getElementById('activeUsers').textContent = '1';
    
    updateRecentActivity();
}

// Update recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    
    if (transactionHistory.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <p>No recent transactions yet. Submit your first mining data!</p>
            </div>
        `;
        return;
    }
    
    const recentTransactions = transactionHistory.slice(-5).reverse();
    activityList.innerHTML = recentTransactions.map(transaction => `
        <div class="activity-item">
            <i class="fas fa-database" style="color: var(--success)"></i>
            <div>
                <p><strong>${transaction.mineName}</strong> - ${transaction.oreType}</p>
                <small>${new Date(transaction.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `).join('');
}

// Store data on blockchain
async function storeData() {
    if (!contract) {
        if (!await initWeb3()) return;
    }

    const mineName = document.getElementById('mineName').value.trim();
    const oreGrade = document.getElementById('oreGrade').value;
    const oreType = document.getElementById('oreType').value;
    const productionDate = document.getElementById('productionDate').value;
    const quantity = document.getElementById('quantity').value;

    if (!mineName || !oreGrade || !oreType || !productionDate || !quantity) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    try {
        const resultDiv = document.getElementById('storageResult');
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px; color: var(--primary);">Storing data on blockchain...</p>
                <p style="font-size: 0.9rem; color: var(--gray);">This may take a few seconds</p>
            </div>
        `;
        resultDiv.className = 'result info';
        resultDiv.style.display = 'block';

        // Create unique hash
        const dataString = mineName + oreGrade + oreType + productionDate + quantity + Date.now() + userAccount;
        const hash = web3.utils.keccak256(dataString);

        // Store on blockchain
        const receipt = await contract.methods.storeMiningData(hash, mineName, oreGrade, oreType)
            .send({ from: userAccount });

        // Add to transaction history
        const transaction = {
            hash: hash,
            mineName: mineName,
            oreGrade: oreGrade,
            oreType: oreType,
            productionDate: productionDate,
            quantity: quantity,
            timestamp: Date.now(),
            transactionHash: receipt.transactionHash,
            status: 'success',
            blockNumber: receipt.blockNumber
        };
        
        transactionHistory.push(transaction);
        successfulTransactions++;
        
        // Save to localStorage
        localStorage.setItem('mineLedgerTransactions', JSON.stringify(transactionHistory));
        localStorage.setItem('successfulTransactions', successfulTransactions.toString());

        // Show success
        resultDiv.innerHTML = `
            <div style="color: var(--success);">
                <h4><i class="fas fa-check-circle"></i> Data Stored Successfully!</h4>
                <p><strong>Transaction Details:</strong></p>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <p><strong>Mine:</strong> ${mineName}</p>
                    <p><strong>Ore Type:</strong> ${oreType} (${oreGrade})</p>
                    <p><strong>Quantity:</strong> ${quantity} tons</p>
                    <p><strong>Date:</strong> ${new Date(productionDate).toLocaleDateString()}</p>
                </div>
                <p><strong>Your Unique Hash:</strong></p>
                <div class="hash-display">${hash}</div>
                <p><strong>Transaction Hash:</strong> ${receipt.transactionHash.substring(0, 20)}...</p>
                <p style="color: var(--warning); margin-top: 15px; background: #fef3c7; padding: 10px; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Save this hash to retrieve data later</strong>
                </p>
                <button onclick="copyToClipboard('${hash}')" class="btn-secondary" style="margin-top: 10px;">
                    <i class="fas fa-copy"></i> Copy Hash
                </button>
            </div>
        `;
        resultDiv.className = 'result success';

        // Clear form
        document.getElementById('mineName').value = '';
        document.getElementById('oreGrade').value = '';
        document.getElementById('oreType').value = '';
        document.getElementById('productionDate').value = '';
        document.getElementById('quantity').value = '';

        // Update dashboard
        updateDashboardStats();
        loadTransactionHistory();
        
        showNotification('Data successfully stored on blockchain!', 'success');

    } catch (error) {
        console.error("Store data error:", error);
        const resultDiv = document.getElementById('storageResult');
        resultDiv.innerHTML = `
            <div style="color: var(--error);">
                <h4><i class="fas fa-times-circle"></i> Storage Failed</h4>
                <p>Error: ${error.message}</p>
                <p style="margin-top: 10px; font-size: 0.9rem;">Make sure you're on Sepolia testnet and have test ETH.</p>
            </div>
        `;
        resultDiv.className = 'result error';
        resultDiv.style.display = 'block';
        showNotification('Failed to store data: ' + error.message, 'error');
    }
}

// Retrieve data from blockchain
async function retrieveData() {
    if (!contract) {
        if (!await initWeb3()) return;
    }

    const hash = document.getElementById('retrieveHash').value.trim();

    if (!hash) {
        showNotification('Please enter a hash!', 'error');
        return;
    }

    // Validate hash format
    if (!hash.startsWith('0x') || hash.length !== 66) {
        showNotification('Please enter a valid transaction hash (should start with 0x and be 66 characters long)', 'error');
        return;
    }

    try {
        const resultDiv = document.getElementById('retrievalResult');
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px; color: var(--primary);">Retrieving data from blockchain...</p>
            </div>
        `;
        resultDiv.className = 'result info';
        resultDiv.style.display = 'block';

        const result = await contract.methods.getMiningData(hash).call();
        
        const [mineName, oreGrade, oreType] = result;

        // Check if data exists
        if (!mineName && !oreGrade && !oreType) {
            resultDiv.innerHTML = `
                <div style="color: var(--error);">
                    <h4><i class="fas fa-search"></i> Data Not Found</h4>
                    <p>No mining data found for the provided hash.</p>
                    <p style="margin-top: 10px; font-size: 0.9rem;">Please check the hash and try again.</p>
                </div>
            `;
            resultDiv.className = 'result error';
            return;
        }

        // Find transaction details from history
        const transaction = transactionHistory.find(tx => tx.hash === hash);
        
        resultDiv.innerHTML = `
            <div style="color: var(--success);">
                <h4><i class="fas fa-check-circle"></i> Data Retrieved Successfully!</h4>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--success);">
                    <p><strong>🏔️ Mine Name:</strong> ${mineName || 'N/A'}</p>
                    <p><strong>📊 Ore Grade:</strong> ${oreGrade || 'N/A'}</p>
                    <p><strong>⚒️ Ore Type:</strong> ${oreType || 'N/A'}</p>
                    ${transaction ? `
                        <p><strong>📅 Production Date:</strong> ${new Date(transaction.productionDate).toLocaleDateString()}</p>
                        <p><strong>⚖️ Quantity:</strong> ${transaction.quantity} tons</p>
                        <p><strong>🕒 Stored On:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                    ` : ''}
                    <p><strong>🔑 Data Hash:</strong> ${hash}</p>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="copyToClipboard('${hash}')" class="btn-secondary">
                        <i class="fas fa-copy"></i> Copy Hash
                    </button>
                    <button onclick="showSection('transactionHistory')" class="btn-primary">
                        <i class="fas fa-history"></i> View History
                    </button>
                </div>
            </div>
        `;
        resultDiv.className = 'result success';

        showNotification('Data retrieved successfully!', 'success');

    } catch (error) {
        console.error("Retrieve data error:", error);
        const resultDiv = document.getElementById('retrievalResult');
        resultDiv.innerHTML = `
            <div style="color: var(--error);">
                <h4><i class="fas fa-times-circle"></i> Retrieval Failed</h4>
                <p>Error: ${error.message}</p>
                <p style="margin-top: 10px; font-size: 0.9rem;">Please check the hash and try again.</p>
            </div>
        `;
        resultDiv.className = 'result error';
        resultDiv.style.display = 'block';
        showNotification('Failed to retrieve data: ' + error.message, 'error');
    }
}

// Load transaction history
function loadTransactionHistory() {
    const transactionsList = document.getElementById('transactionsList');
    const filterMine = document.getElementById('filterMine');
    const filterDate = document.getElementById('filterDate');
    
    // Update mine filter options
    const uniqueMines = [...new Set(transactionHistory.map(tx => tx.mineName))];
    filterMine.innerHTML = '<option value="">All Mines</option>' + 
        uniqueMines.map(mine => `<option value="${mine}">${mine}</option>`).join('');
    
    let filteredTransactions = transactionHistory;
    
    // Apply filters
    if (filterDate.value) {
        filteredTransactions = filteredTransactions.filter(tx => 
            tx.productionDate === filterDate.value
        );
    }
    
    if (filterMine.value) {
        filteredTransactions = filteredTransactions.filter(tx => 
            tx.mineName === filterMine.value
        );
    }
    
    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">No transactions found</td>
            </tr>
        `;
        return;
    }
    
    // Sort by timestamp (newest first)
    filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    transactionsList.innerHTML = filteredTransactions.map(transaction => `
        <tr>
            <td>${new Date(transaction.timestamp).toLocaleString()}</td>
            <td style="font-family: 'Courier New', monospace; font-size: 0.8rem;">
                ${transaction.hash.substring(0, 10)}...${transaction.hash.substring(56)}
            </td>
            <td>${transaction.mineName}</td>
            <td>${transaction.oreType}</td>
            <td>
                <span class="status-badge status-success">Success</span>
            </td>
            <td>
                <button onclick="viewTransactionDetails('${transaction.hash}')" class="view-btn">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
}

// View transaction details
function viewTransactionDetails(hash) {
    const transaction = transactionHistory.find(tx => tx.hash === hash);
    if (transaction) {
        // Fill the hash in data review and switch to that section
        document.getElementById('retrieveHash').value = hash;
        showSection('dataReview');
        
        // Auto-retrieve the data
        setTimeout(() => {
            retrieveData();
        }, 500);
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterMine').value = '';
    loadTransactionHistory();
    showNotification('Filters cleared', 'info');
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Hash copied to clipboard!', 'success');
    }).catch(err => {
        showNotification('Failed to copy hash', 'error');
    });
}

// Section navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Special handling for certain sections
    if (sectionId === 'transactionHistory') {
        loadTransactionHistory();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        border-left: 4px solid;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.style.borderLeftColor = colors[type] || colors.info;
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}" style="font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Initialize when page loads
window.onload = function() {
    // Show dashboard by default
    showSection('dashboard');
    
    // Set default production date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('productionDate').value = today;
    
    // Auto-connect if MetaMask is already connected
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    initWeb3();
                }
            });
    }
    
    // Initialize dashboard stats
    updateDashboardStats();
    
    console.log('MineLedger website initialized successfully!');
};

// Handle MetaMask account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            // User disconnected their wallet
            updateConnectionStatus(false);
            showNotification('Wallet disconnected', 'warning');
        } else {
            // User switched accounts
            userAccount = accounts[0];
            updateConnectionStatus(true, userAccount);
            showNotification('Account switched', 'info');
        }
    });
    
    window.ethereum.on('chainChanged', function (chainId) {
        // Handle network changes
        window.location.reload();
    });
}
