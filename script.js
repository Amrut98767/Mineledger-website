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

// ==================== DARK MODE LOGIC ====================
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

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
            const connectionStatus = document.getElementById('connectionStatus');
            if(connectionStatus) {
                connectionStatus.innerHTML = '<i class="fas fa-circle" style="color: #10b981;"></i> Connected to MetaMask';
                connectionStatus.classList.add('connected');
            }
            
            // Update wallet info
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;
            document.getElementById('walletInfo').style.display = 'flex';
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

// Fixed storeData function with premium styling
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
        resultDiv.innerHTML = '<div class="loading" style="padding: 15px; background: rgba(99, 102, 241, 0.1); color: var(--primary); border-radius: 8px;"><i class="fas fa-spinner fa-spin"></i> Storing on blockchain...</div>';
        resultDiv.style.display = 'block';

        const accounts = await web3.eth.getAccounts();
        
        // Create a simple unique hash that we can easily retrieve
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

        // Premium success message without 'result' class conflict
        resultDiv.innerHTML = `
            <div class="success" style="padding: 20px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981;">
                <h3 style="color: #10b981; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> Data Stored on Blockchain Successfully!</h3>
                <div class="hash-display" style="background: var(--bg-main); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid var(--primary); font-family: monospace;">
                    <strong style="color: var(--text-main);">Tx Hash:</strong> <br>
                    <span onclick="copyToClipboard('${transaction.transactionHash}')" style="cursor: pointer; color: var(--primary);">
                        ${transaction.transactionHash.substring(0, 15)}...${transaction.transactionHash.substring(50)}
                    </span>
                </div>
                <div class="hash-display" style="background: var(--bg-main); padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b; font-family: monospace;">
                    <strong style="color: var(--text-main);">Data Hash (Save this!):</strong> <br>
                    <span onclick="copyToClipboard('${dataHash}')" style="cursor: pointer; color: #f59e0b;">
                        ${dataHash.substring(0, 20)}...
                    </span>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';

        // Store in localStorage for quick access
        saveTransactionToLocalStorage({
            mineName,
            oreGrade,
            oreType,
            productionDate,
            quantity,
            dataHash,
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
        const resultDiv = document.getElementById('storageResult');
        resultDiv.innerHTML = `
            <div class="error" style="padding: 20px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i> Blockchain Storage Failed
                <p>${error.message}</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        showNotification('Error storing data: ' + error.message, 'error');
    }
}

// Improved retrieveData with premium styling
async function retrieveData() {
    const hash = document.getElementById('retrieveHash').value.trim();
    const resultDiv = document.getElementById('retrievalResult');
    
    if (!hash) {
        resultDiv.innerHTML = '<div class="error" style="padding: 15px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px;"><i class="fas fa-exclamation-triangle"></i> Please enter a data hash</div>';
        resultDiv.style.display = 'block';
        return;
    }

    if (!hash.startsWith('0x') || hash.length !== 66) {
        resultDiv.innerHTML = `
            <div class="error" style="padding: 15px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle"></i> Invalid hash format
                <p>Hash should start with '0x' and be 66 characters long.</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        return;
    }

    try {
        resultDiv.innerHTML = '<div class="loading" style="padding: 15px; background: rgba(99, 102, 241, 0.1); color: var(--primary); border-radius: 8px;"><i class="fas fa-spinner fa-spin"></i> Retrieving data from blockchain...</div>';
        resultDiv.style.display = 'block';

        if (!contract) {
            resultDiv.innerHTML = '<div class="error" style="padding: 15px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px;"><i class="fas fa-exclamation-triangle"></i> Please connect MetaMask first</div>';
            return;
        }
        
        const data = await contract.methods.getMiningData(hash).call();
        
        if (data[0] === "" && data[1] === "" && data[2] === "") {
            resultDiv.innerHTML = `
                <div class="error" style="padding: 15px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> Data not found for this hash
                    <p style="margin-top: 10px; font-size: 0.9rem;">
                        Make sure you're using the correct <strong>Data Hash</strong> (not the Transaction Hash).
                    </p>
                </div>
            `;
            return;
        }

        const fullData = await contract.methods.hashToMiningData(hash).call();
        
        resultDiv.innerHTML = `
            <div class="success" style="padding: 20px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px;">
                <h3 style="margin-bottom: 15px; color: #10b981;"><i class="fas fa-check-circle"></i> Data Verified on Blockchain</h3>
                <div style="background: var(--bg-main); padding: 15px; border-radius: 8px; color: var(--text-main);">
                    <p style="margin-bottom: 8px;"><strong>Mine Name:</strong> ${data[0]}</p>
                    <p style="margin-bottom: 8px;"><strong>Ore Grade:</strong> ${data[1]}</p>
                    <p style="margin-bottom: 8px;"><strong>Ore Type:</strong> ${data[2]}</p>
                    <p style="margin-bottom: 8px;"><strong>Timestamp:</strong> ${new Date(Number(fullData.timestamp) * 1000).toLocaleString()}</p>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';

        showNotification('Data retrieved successfully!', 'success');

    } catch (error) {
        console.error('Retrieval error:', error);
        resultDiv.innerHTML = `
            <div class="error" style="padding: 15px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle"></i> Retrieval Error
                <p>${error.message}</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        showNotification('Error retrieving data', 'error');
    }
}

// Update dashboard with REAL blockchain data
async function updateDashboardStats() {
    try {
        if (!contract) return;
        const totalStoredData = await contract.methods.getTotalStoredData().call();
        document.getElementById('totalTransactions').textContent = totalStoredData;
        document.getElementById('successfulTransactions').textContent = totalStoredData;
        document.getElementById('activeUsers').textContent = "Multiple";
        document.getElementById('uptimePercentage').textContent = '100%';
        updateRecentActivity();
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function saveTransactionToLocalStorage(transactionData) {
    const transactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
    transactions.push(transactionData);
    localStorage.setItem('miningTransactions', JSON.stringify(transactions));
}

// Update transaction history
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
                    <span style="font-family: monospace; color: var(--primary); cursor: pointer;" onclick="copyToClipboard('${tx.transactionHash}')">
                        ${tx.transactionHash.substring(0, 10)}...
                    </span>
                </td>
                <td>${tx.mineName}</td>
                <td>${tx.oreType}</td>
                <td><span class="status-badge status-success">Success</span></td>
                <td>
                    <button class="view-btn" onclick="copyToClipboard('${tx.dataHash}')">
                        <i class="fas fa-copy"></i> Copy Hash
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error updating history:', error);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    });
}

function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    const transactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
    
    if (transactions.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <p>No recent transactions yet.</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = transactions.slice(-5).reverse().map(transaction => `
        <div class="activity-item">
            <i class="fas fa-database"></i>
            <div>
                <p><strong>${transaction.mineName}</strong> - ${transaction.oreType}</p>
                <small style="color: var(--text-muted);">${new Date(transaction.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `).join('');
}

function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterMine').value = '';
    updateTransactionHistory();
    showNotification('Filters cleared', 'info');
}

// Handle MetaMask account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            updateConnectionStatus(false);
            showNotification('Wallet disconnected', 'warning');
        } else {
            userAccount = accounts[0];
            updateConnectionStatus(true, userAccount);
            showNotification('Account switched', 'info');
            updateDashboardStats();
            updateTransactionHistory();
        }
    });
    
    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });
}

function updateConnectionStatus(connected, account = null) {
    const connectionStatus = document.getElementById('connectionStatus');
    const walletInfo = document.getElementById('walletInfo');
    const connectBtn = document.getElementById('connectBtn');
    
    if (connected) {
        if(connectionStatus) {
            connectionStatus.innerHTML = '<i class="fas fa-circle" style="color: #10b981;"></i> Connected to MetaMask';
            connectionStatus.classList.add('connected');
        }
        if (account) {
            const shortAddress = account.substring(0, 6) + '...' + account.substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;
        }
        walletInfo.style.display = 'flex';
        connectBtn.style.display = 'none';
    } else {
        if(connectionStatus) {
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected from MetaMask';
            connectionStatus.classList.remove('connected');
        }
        walletInfo.style.display = 'none';
        connectBtn.style.display = 'block';
        userAccount = null;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    let icon = type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info';
    let bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    notification.style.background = bgColor;
    notification.innerHTML = `<i class="fas fa-${icon}-circle"></i><span>${message}</span>`;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function disconnectWallet() {
    userAccount = null;
    updateConnectionStatus(false);
    showNotification('Wallet disconnected', 'info');
}

// Show specific section
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block'; 
    }
    window.scrollTo(0, 0);
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// Team Animation
function initTeamAnimation() {
    const scrollContainer = document.querySelector('.team-scroll-container');
    const scrollTrack = document.querySelector('.team-scroll-track');
    
    if (!scrollContainer || !scrollTrack) return;
    
    scrollContainer.addEventListener('mouseenter', () => scrollTrack.style.animationPlayState = 'paused');
    scrollContainer.addEventListener('mouseleave', () => scrollTrack.style.animationPlayState = 'running');
}

// ==================== PREMIUM BLOCKCHAIN PARTICLES ====================
function initParticles() {
    if(typeof particlesJS === 'undefined') {
        console.log("Particles.js load nahi hua!");
        return;
    }
    particlesJS('particles-js', {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#818cf8" },
            shape: { type: "circle" },
            opacity: { value: 0.4, random: false },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#818cf8",
                opacity: 0.2,
                width: 1.5
            },
            move: {
                enable: true,
                speed: 1.5,
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
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            },
            modes: {
                grab: { distance: 180, line_linked: { opacity: 0.6 } }
            }
        },
        retina_detect: true
    });
}

// ==================== INITIALIZATION ====================
window.addEventListener('load', function() {
    // 1. Check saved Dark Mode Theme
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if(themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.body.setAttribute('data-theme', 'light');
    }

    // 2. Initialize Team Animation
    initTeamAnimation();
    
    // 3. Auto-connect MetaMask if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        initWeb3();
    }
    
    // 4. Load Data
    updateTransactionHistory();
    updateDashboardStats();
    
    // 5. Make Logo clickable to go home
    const logo = document.querySelector('.nav-logo');
    if(logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => showSection('home'));
    }

    // 6. PARTICLE EFFECT START KARO
    initParticles();
});
