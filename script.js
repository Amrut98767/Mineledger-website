// Contract Configuration
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
            const shortAddress = accounts[0].substring(0, 6) + '...' + accounts[0].substring(38);
            document.getElementById('walletAddress').textContent = shortAddress;
            document.getElementById('walletInfo').style.display = 'block';
            document.getElementById('connectBtn').style.display = 'none';
            
            // Load real data from blockchain
            updateDashboardStats();
            updateTransactionHistory();
            
            console.log('Connected to contract:', contract);
            
        } else {
            alert('Please install MetaMask!');
        }
    } catch (error) {
        console.error('Error initializing Web3:', error);
        alert('Error connecting to MetaMask: ' + error.message);
    }
}

// Store data on actual blockchain
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

        const accounts = await web3.eth.getAccounts();
        
        // Generate unique hash for this data
        const dataHash = web3.utils.sha3(mineName + oreGrade + oreType + productionDate + quantity + Date.now());
        
        // Store on actual blockchain
        const transaction = await contract.methods.storeMiningData(
            dataHash,
            mineName,
            oreGrade,
            oreType
        ).send({ from: accounts[0] });

        // Show success with actual transaction hash
        resultDiv.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i> Data Stored on Blockchain Successfully!
                <div class="transaction-hash">
                    <strong>Transaction Hash:</strong> 
                    <span onclick="copyToClipboard('${transaction.transactionHash}')" style="cursor: pointer;">
                        ${transaction.transactionHash.substring(0, 10)}...${transaction.transactionHash.substring(58)}
                    </span>
                    <button onclick="copyToClipboard('${transaction.transactionHash}')" class="btn-copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="transaction-hash">
                    <strong>Data Hash:</strong> 
                    <span onclick="copyToClipboard('${dataHash}')" style="cursor: pointer;">
                        ${dataHash.substring(0, 10)}...${dataHash.substring(58)}
                    </span>
                    <button onclick="copyToClipboard('${dataHash}')" class="btn-copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p>Your mining data has been securely stored on the blockchain.</p>
            </div>
        `;

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
    }
}

// Retrieve data from actual blockchain
async function retrieveData() {
    const hash = document.getElementById('retrieveHash').value.trim();
    const resultDiv = document.getElementById('retrievalResult');
    
    if (!hash) {
        resultDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Please enter a data hash</div>';
        return;
    }

    try {
        resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Retrieving data from blockchain...</div>';
        
        // Get data from actual blockchain contract
        const data = await contract.methods.getMiningData(hash).call();
        
        if (data[0] === "" && data[1] === "" && data[2] === "") {
            resultDiv.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Data not found on blockchain</div>';
            return;
        }

        // Get additional details from mapping
        const fullData = await contract.methods.hashToMiningData(hash).call();
        
        resultDiv.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i> Data Retrieved Successfully!
                <div class="transaction-details">
                    <p><strong>Mine Name:</strong> ${data[0]}</p>
                    <p><strong>Ore Grade:</strong> ${data[1]}</p>
                    <p><strong>Ore Type:</strong> ${data[2]}</p>
                    <p><strong>Stored By:</strong> ${fullData.storedBy}</p>
                    <p><strong>Timestamp:</strong> ${new Date(Number(fullData.timestamp) * 1000).toLocaleString()}</p>
                </div>
                <p>Data successfully retrieved from blockchain contract.</p>
            </div>
        `;

    } catch (error) {
        console.error('Retrieval error:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> Error retrieving data
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Update dashboard with REAL blockchain data
async function updateDashboardStats() {
    try {
        if (!contract) return;

        // Get REAL total transactions from blockchain
        const totalStoredData = await contract.methods.getTotalStoredData().call();
        
        // Get user's transaction count from localStorage (for demo)
        const userTransactions = JSON.parse(localStorage.getItem('miningTransactions') || '[]');
        const userTxCount = userTransactions.length;

        // Update with REAL data
        document.getElementById('totalTransactions').textContent = totalStoredData;
        document.getElementById('successfulTransactions').textContent = totalStoredData; // All are successful if stored
        document.getElementById('activeUsers').textContent = "Multiple"; // Since contract is public
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
        alert('Copied to clipboard!');
    });
}

// Initialize when page loads
window.addEventListener('load', function() {
    initParticles();
    // Try to auto-connect if MetaMask is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        initWeb3();
    }
});
