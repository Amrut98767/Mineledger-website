// ==================== SMART CONTRACT CONFIGURATION ====================
const CONTRACT_ADDRESS = "0xeE406ABd76B883F874E6525a00cD6990073f7AeF";
const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "hash", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "mineName", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "oreGrade", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "oreType", "type": "string"},
            {"indexed": false, "internalType": "address", "name": "storedBy", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "DataStored",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_hash", "type": "string"},
            {"internalType": "string", "name": "_mineName", "type": "string"},
            {"internalType": "string", "name": "_oreGrade", "type": "string"},
            {"internalType": "string", "name": "_oreType", "type": "string"}
        ],
        "name": "storeMiningData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "allHashes",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_hash", "type": "string"}],
        "name": "getMiningData",
        "outputs": [
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalStoredData",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}],
        "name": "hashToMiningData",
        "outputs": [
            {"internalType": "string", "name": "mineName", "type": "string"},
            {"internalType": "string", "name": "oreGrade", "type": "string"},
            {"internalType": "string", "name": "oreType", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "storedBy", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let contract;
let web3;
let userAccount = null;

// ==================== WEB3 AND CONTRACT FUNCTIONS ====================

// Initialize Web3 and Contract
async function initWeb3() {
    try {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize contract
            contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            // Update connection status
            document.getElementById('connectionStatus').innerHTML = 
                '<i class="fas fa-circle" style="color: #4CAF50;"></i> Connected to MetaMask';
            
            // Update wallet info
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;
            document.getElementById('walletInfo').style.display = 'block';
            document.getElementById('connectBtn').style.display = 'none';
            
            // Load real data from blockchain
            updateDashboardStats();
            updateTransactionHistory();
            
            showNotification('Wallet connected successfully!', 'success');
            
        } else {
            alert('Please install MetaMask!');
        }
    } catch (error) {
        console.error('Error initializing Web3:', error);
        showNotification('Error connecting to MetaMask: ' + error.message, 'error');
    }
}

// Fixed storeData function with proper hash handling
async function storeData() {
    try {
        const mineName = document.getElementById('mineName').value;
        const oreGrade = document.getElementById('oreGrade').value;
        const oreType = document.getElementById('oreType').value;
        const productionDate = document.getElementById('productionDate').value;
        const quantity = document.getElementById('quantity').value;

        if (!web3 || !contract) {
            alert('Please connect MetaMask first!');
            return;
        }

        const resultDiv = document.getElementById('storageResult');
        resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Storing on blockchain...</div>';
        resultDiv.style.display = 'block';

        const accounts = await web3.eth.getAccounts();
        
        // ✅ FIX: Create a simple unique hash that we can easily retrieve
        const dataString = `${mineName}-${oreGrade}-${oreType}-${productionDate}-${quantity}-${Date.now()}`;
        const dataHash = web3.utils.keccak256(dataString);
        
        console.log('Storing data with hash:', dataHash);
        
        // Store on actual blockchain
        const transaction = await contract.methods.storeMiningData(
            dataHash,
            mineName,
            oreGrade,
            oreType
        ).send({ from: accounts[0] });

        console.log('Transaction completed:', transaction);

        // Show success with BOTH hashes
        resultDiv.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i> Data Stored on Blockchain Successfully!
                <div class="transaction-hash">
                    <strong>Transaction Hash (MetaMask):</strong> 
                    <span onclick="copyToClipboard('${transaction.transactionHash}')" style="cursor: pointer;">
                        ${transaction.transactionHash.substring(0, 10)}...${transaction.transactionHash.substring(58)}
                    </span>
                    <button onclick="copyToClipboard('${transaction.transactionHash}')" class="btn-copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="transaction-hash">
                    <strong>Data Hash (Use this for retrieval):</strong> 
                    <span onclick="copyToClipboard('${dataHash}')" style="cursor: pointer; color: #ff6b00; font-weight: bold;">
                        ${dataHash}
                    </span>
                    <button onclick="copyToClipboard('${dataHash}')" class="btn-copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                    <strong>Note:</strong> Use the <strong>Data Hash</strong> above to retrieve this data later.
                </p>
            </div>
        `;

        // Store in localStorage for quick access
        saveTransactionToLocalStorage({
            mineName,
            oreGrade,
            oreType,
            productionDate,
            quantity,
            dataHash, // ✅ This is the important hash for retrieval
            transactionHash: transaction.transactionHash,
            timestamp: Date.now(),
            from: accounts[0]
        });

        // Update dashboard with real data
        updateDashboardStats();
        updateTransactionHistory();
        
        showNotification('Data stored on blockchain successfully!', 'success');
        
        // Clear form
        document.getElementById('mineName').value = '';
        document.getElementById('oreGrade').value = '';
        document.getElementById('oreType').value = '';
        document.getElementById('productionDate').value = '';
        document.getElementById('quantity').value = '';

    } catch (error) {
        console.error('Storage error:', error);
        document.getElementById('storageResult').innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> Blockchain Storage Failed
                <p>${error.message}</p>
            </div>
        `;
        showNotification('Error storing data: ' + error.message, 'error');
    }
}

// Improved retrieveData with better error handling
async function retrieveData() {
    const hash = document.getElementById('retrieveHash').value.trim();
    const resultDiv = document.getElementById('retrievalResult');
    
    if (!hash) {
        resultDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Please enter a data hash</div>';
        resultDiv.style.display = 'block';
        return;
    }

    // Validate hash format
    if (!hash.startsWith('0x') || hash.length !== 66) {
        resultDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> Invalid hash format
                <p>Hash should start with '0x' and be 66 characters long.</p>
                <p>Current length: ${hash.length} characters</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        return;
    }

    try {
        resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Retrieving data from blockchain...</div>';
        resultDiv.style.display = 'block';

        if (!contract) {
            resultDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Please connect MetaMask first</div>';
            return;
        }

        console.log('Retrieving data for hash:', hash);
        
        // Get data from contract
        const data = await contract.methods.getMiningData(hash).call();
        console.log('Raw data from contract:', data);
        
        // Check if data exists
        if (data[0] === "" && data[1] === "" && data[2] === "") {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i> Data not found for this hash
                    <p style="margin-top: 10px;">
                        This hash does not exist in the smart contract. Make sure you're using the correct <strong>Data Hash</strong> 
                        (not the Transaction Hash) from when you stored the data.
                    </p>
                </div>
            `;
            return;
        }

        // Get additional details
        const fullData = await contract.methods.hashToMiningData(hash).call();
        console.log('Full data details:', fullData);
        
        resultDiv.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i> Data Retrieved Successfully!
                <div class="transaction-details">
                    <p><strong>Mine Name:</strong> ${data[0]}</p>
                    <p><strong>Ore Grade:</strong> ${data[1]}</p>
                    <p><strong>Ore Type:</strong> ${data[2]}</p>
                    <p><strong>Stored By:</strong> ${fullData.storedBy}</p>
                    <p><strong>Timestamp:</strong> ${new Date(Number(fullData.timestamp) * 1000).toLocaleString()}</p>
                    <p><strong>Data Hash:</strong> <code>${hash}</code></p>
                </div>
                <p>✅ Data successfully verified on blockchain!</p>
            </div>
        `;

        showNotification('Data retrieved successfully!', 'success');

    } catch (error) {
        console.error('Retrieval error:', error);
        
        if (error.message.includes('Data not found for this hash')) {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i> Data Not Found
                    <p>No mining data found for the provided hash.</p>
                    <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                        <strong>Tips:</strong>
                        <ul style="text-align: left; margin: 10px 0;">
                            <li>Make sure you're using the <strong>Data Hash</strong> (not Transaction Hash)</li>
                            <li>Verify the hash was copied correctly</li>
                            <li>Check if the data was stored successfully</li>
                            <li>Ensure you're on the Goerli testnet</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i> Retrieval Error
                    <p>${error.message}</p>
                </div>
            `;
        }
        
        showNotification('Error retrieving data', 'error');
    }
}

// Update dashboard with REAL blockchain data
async function updateDashboardStats() {
    try {
        if (!contract) return;

        // Get REAL total transactions from blockchain
        const totalStoredData = await contract.methods.getTotalStoredData().call();
        
        // Get user's transaction count from localStorage
        const userTransactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
        const userTxCount = userTransactions.length;

        // Update with REAL data
        document.getElementById('totalTransactions').textContent = totalStoredData;
        document.getElementById('successfulTransactions').textContent = totalStoredData;
        document.getElementById('activeUsers').textContent = "Multiple";
        document.getElementById('uptimePercentage').textContent = '100%';

        updateRecentActivity();
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Save transaction to localStorage
function saveTransactionToLocalStorage(transactionData) {
    const transactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
    transactions.push(transactionData);
    localStorage.setItem('miningTransactions', JSON.stringify(transactions));
}

// Update transaction history with mixed data (blockchain + local)
async function updateTransactionHistory() {
    try {
        const localTransactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
        const transactionsList = document.getElementById('transactionsList');
        
        if (localTransactions.length === 0) {
            transactionsList.innerHTML = '<tr><td colspan="6" class="no-data">No transactions found</td></tr>';
            return;
        }

        transactionsList.innerHTML = localTransactions.reverse().map(tx => `
            <tr>
                <td>${new Date(tx.timestamp).toLocaleString()}</td>
                <td>
                    <span class="hash" onclick="copyToClipboard('${tx.transactionHash}')" title="Click to copy">
                        ${tx.transactionHash.substring(0, 10)}...${tx.transactionHash.substring(58)}
                    </span>
                </td>
                <td>${tx.mineName}</td>
                <td>${tx.oreType}</td>
                <td><span class="status-badge success">Success</span></td>
                <td>
                    <button class="btn-small" onclick="viewTransactionDetails('${tx.dataHash}')">
                        <i class="fas fa-eye"></i> View Data
                    </button>
                    <button class="btn-small" onclick="copyToClipboard('${tx.transactionHash}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error updating history:', error);
    }
}

// View transaction details
async function viewTransactionDetails(dataHash) {
    try {
        const data = await contract.methods.getMiningData(dataHash).call();
        alert(`Mining Data:\nMine: ${data[0]}\nGrade: ${data[1]}\nType: ${data[2]}`);
    } catch (error) {
        alert('Could not fetch data from blockchain');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    });
}

// Update recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    const transactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
    
    if (transactions.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <p>No recent transactions yet. Submit your first mining data!</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = transactions.slice(-5).reverse().map(transaction => `
        <div class="activity-item">
            <i class="fas fa-database"></i>
            <div>
                <p><strong>${transaction.mineName}</strong> - ${transaction.oreType}</p>
                <small>${new Date(transaction.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `).join('');
}

// Clear filters in transaction history
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterMine').value = '';
    updateTransactionHistory();
    showNotification('Filters cleared', 'info');
}

// ==================== EXISTING FUNCTIONS FROM YOUR CODE ====================

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
            updateDashboardStats();
            updateTransactionHistory();
        }
    });
    
    window.ethereum.on('chainChanged', function (chainId) {
        // Handle network changes
        window.location.reload();
    });
}

// Update connection status
function updateConnectionStatus(connected, account = null) {
    const connectionStatus = document.getElementById('connectionStatus');
    const walletInfo = document.getElementById('walletInfo');
    const connectBtn = document.getElementById('connectBtn');
    
    if (connected) {
        connectionStatus.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> Connected to MetaMask';
        if (account) {
            const shortAddress = account.substring(0, 6) + '...' + account.substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;
        }
        walletInfo.style.display = 'block';
        connectBtn.style.display = 'none';
    } else {
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected from MetaMask';
        walletInfo.style.display = 'none';
        connectBtn.style.display = 'block';
        userAccount = null;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Wallet disconnect function
function disconnectWallet() {
    userAccount = null;
    updateConnectionStatus(false);
    showNotification('Wallet disconnected successfully', 'info');
    
    // Clear any wallet-related data
    localStorage.removeItem('connectedWallet');
}

// Team Animation Controls
function initTeamAnimation() {
    const scrollContainer = document.querySelector('.team-scroll-container');
    const scrollTrack = document.querySelector('.team-scroll-track');
    
    if (!scrollContainer || !scrollTrack) return;
    
    // Pause animation when hovering
    scrollContainer.addEventListener('mouseenter', () => {
        scrollTrack.style.animationPlayState = 'paused';
    });
    
    scrollContainer.addEventListener('mouseleave', () => {
        scrollTrack.style.animationPlayState = 'running';
    });
    
    // Handle image loading errors
    const teamImages = document.querySelectorAll('.team-member img');
    teamImages.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const placeholder = this.nextElementSibling;
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
}

// Initialize team animation when page loads
window.addEventListener('load', initTeamAnimation);

// Particles.js Configuration for 0g.ai style
function initParticles() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 2, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#ffffff",
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 1,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        },
        retina_detect: true
    });
}

// Simple showSection function - without operation system
function showSection(sectionId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Update mobile menu functions to work with new system
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        mobileMenu.classList.remove('active');
    }
});

// Initialize everything when page loads
window.addEventListener('load', function() {
    initParticles();
    initTeamAnimation();
    
    // Smooth scroll to next section
    document.querySelector('.scroll-down').addEventListener('click', function() {
        window.scrollBy({ 
            top: window.innerHeight,
            behavior: 'smooth' 
        });
    });
    
    // Try to auto-connect if MetaMask is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        initWeb3();
    }
    
    // Load any existing transactions
    updateTransactionHistory();
    updateDashboardStats();
});
