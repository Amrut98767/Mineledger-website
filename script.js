let web3;
let contract;
let userAccount;

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
            updateStats();
            
            contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            console.log("MineLedger: Contract initialized successfully");
            
            return true;
        } catch (error) {
            console.error("User denied account access", error);
            updateConnectionStatus(false);
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
        statusElement.innerHTML = `<i class="fas fa-circle" style="color: var(--success)"></i> Connected to MetaMask | ${account.substring(0, 8)}...${account.substring(36)}`;
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

// Update stats counter
async function updateStats() {
    // Simulate stats for demo - in real app, fetch from contract
    const transactions = Math.floor(Math.random() * 100) + 50;
    const dataRecords = Math.floor(Math.random() * 500) + 200;
    
    document.getElementById('totalTransactions').textContent = transactions;
    document.getElementById('totalData').textContent = dataRecords;
}

// Store data on blockchain
async function storeData() {
    if (!contract) {
        if (!await initWeb3()) return;
    }

    const mineName = document.getElementById('mineName').value.trim();
    const oreGrade = document.getElementById('oreGrade').value.trim();
    const oreType = document.getElementById('oreType').value.trim();

    if (!mineName || !oreGrade || !oreType) {
        showNotification('Please fill all fields!', 'error');
        return;
    }

    try {
        const resultDiv = document.getElementById('storageResult');
        resultDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px; color: var(--primary);">Storing data on blockchain...</p>
            </div>
        `;
        resultDiv.style.display = 'block';

        // Create unique hash
        const dataString = mineName + oreGrade + oreType + Date.now() + userAccount;
        const hash = web3.utils.keccak256(dataString);

        // Store on blockchain
        const receipt = await contract.methods.storeMiningData(hash, mineName, oreGrade, oreType)
            .send({ from: userAccount });

        // Show success
        resultDiv.innerHTML = `
            <div style="color: var(--success);">
                <h4><i class="fas fa-check-circle"></i> Data Stored Successfully!</h4>
                <p><strong>Your Unique Hash:</strong></p>
                <div class="hash-display">${hash}</div>
                <p><strong>Transaction Hash:</strong> ${receipt.transactionHash.substring(0, 20)}...</p>
                <p style="color: var(--warning); margin-top: 15px; background: #fef3c7; padding: 10px; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Save this hash carefully - you'll need it to retrieve data</strong>
                </p>
            </div>
        `;

        // Clear form
        document.getElementById('mineName').value = '';
        document.getElementById('oreGrade').value = '';
        document.getElementById('oreType').value = '';

        // Update stats
        updateStats();
        
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
        showNotification('Please enter a valid transaction hash', 'error');
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
        resultDiv.style.display = 'block';

        const result = await contract.methods.getMiningData(hash).call();
        
        const [mineName, oreGrade, oreType] = result;

        if (!mineName && !oreGrade && !oreType) {
            resultDiv.innerHTML = `
                <div style="color: var(--error);">
                    <h4><i class="fas fa-search"></i> Data Not Found</h4>
                    <p>No mining data found for the provided hash.</p>
                    <p style="margin-top: 10px; font-size: 0.9rem;">Please check the hash and try again.</p>
                </div>
            `;
            return;
        }

        resultDiv.innerHTML = `
            <div style="color: var(--success);">
                <h4><i class="fas fa-check-circle"></i> Data Retrieved Successfully!</h4>
                <div style="background: var(--light); padding: 20px; border-radius: 10px; margin-top: 15px; border-left: 4px solid var(--success);">
                    <p><strong>🏔️ Mine Name:</strong> ${mineName || 'N/A'}</p>
                    <p><strong>📊 Ore Grade:</strong> ${oreGrade || 'N/A'}</p>
                    <p><strong>⚒️ Ore Type:</strong> ${oreType || 'N/A'}</p>
                    <p><strong>🔑 Data Hash:</strong> ${hash}</p>
                </div>
            </div>
        `;

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
        resultDiv.style.display = 'block';
        showNotification('Failed to retrieve data: ' + error.message, 'error');
    }
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

// Smooth scrolling
function scrollToDemo() {
    document.getElementById('demo').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollToIntegration() {
    document.getElementById('integration').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
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

// Add scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = `fadeInUp 0.6s ease forwards`;
            }
        });
    }, { threshold: 0.1 });

    // Observe all feature cards and use case cards
    document.querySelectorAll('.feature-card, .use-case-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
    });
}

// Initialize when page loads
window.onload = function() {
    // Auto-connect if MetaMask is already connected
    if (typeof window.ethereum !== 'undefined') {
        initWeb3();
    }
    
    // Initialize stats
    updateStats();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    console.log('MineLedger website initialized successfully!');
};
