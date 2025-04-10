require('dotenv').config();
const { ethers } = require('ethers');
const blessed = require('blessed');
const fs = require('fs');
const path = require('path');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Cap.app Testnet CUSD Claimer'
});

const colors = {
  red: (text) => `{red-fg}${text}{/red-fg}`,
  green: (text) => `{green-fg}${text}{/green-fg}`,
  yellow: (text) => `{yellow-fg}${text}{/yellow-fg}`,
  white: (text) => `{white-fg}${text}{/white-fg}`,
  gray: (text) => `{grey-fg}${text}{/grey-fg}`,
  bold: (text) => `{bold}${text}{/bold}`
};

const CONTRACT_ADDRESS = '0xe9b6e75c243b6100ffcb1c66e8f78f96feea727f';
const MINT_FUNCTION_SIGNATURE = '0x40c10f19'; 

const TOKEN_AMOUNT = ethers.parseEther('1000');

const RPC_URL = 'https://carrot.megaeth.com/rpc';
const CHAIN_ID = 6342;
const NETWORK_NAME = 'MegaETH';
const EXPLORER_URL = 'https://megaexplorer.xyz';

const layout = {
  header: blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '15%',
    content: '',
    tags: true,
    style: {
      fg: 'white',
      bg: 'black'
    }
  }),
  
  info: blessed.box({
    top: '15%',
    left: 0,
    width: '100%',
    height: '10%',
    content: '',
    tags: true,
    style: {
      fg: 'white'
    }
  }),
  
  log: blessed.log({
    top: '25%',
    left: 0,
    width: '100%',
    height: '55%',
    border: {
      type: 'line'
    },
    tags: true,
    scrollable: true,
    label: ' Activity Log ',
    style: {
      fg: 'white',
      border: {
        fg: 'green'
      }
    }
  }),
  
  progressBar: blessed.progressbar({
    top: '80%',
    left: 0,
    width: '100%',
    height: 3,
    orientation: 'horizontal',
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'green'
      },
      bar: {
        bg: 'green'
      }
    }
  }),
  
  statusBar: blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: '10%',
    content: '',
    tags: true,
    style: {
      fg: 'white',
      bg: 'black'
    }
  }),
  
  input: blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    inputOnFocus: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'green'
      }
    }
  }),
  
  menu: blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    border: {
      type: 'line'
    },
    tags: true,
    label: ' Main Menu ',
    keys: true,
    vi: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'green'
      },
      selected: {
        fg: 'black',
        bg: 'green'
      }
    },
    items: [
      'Start Faucet Claims',
      'Change Wallet',
      'View Network Info',
      'Exit Program'
    ]
  })
};

Object.values(layout).forEach(element => screen.append(element));

layout.menu.hide();

let successCount = 0;
let failCount = 0;
let claimCount = 0;
let currentClaim = 0;
let currentWallet = null;
let currentProvider = null;

function generateModernBanner() {
  const title = "Cap.app Testnet CUSD Claimer";
  const subtitle = "Earn & Point ";
  const subtitle2 = "Join Us : https://t.me/Earnpoint10";
  
  const bannerContent = 
    `{center}{bold}${colors.green('═══════════════════════════════════════════')}{/bold}{/center}\n` +
    `{center}{bold}${colors.green('')}           ${title}           ${colors.green('')}{/bold}{/center}\n` +
    `{center}{bold}${colors.green('')}             ${subtitle}             ${colors.green('')}{/bold}{/center}\n` +
    `{center}{bold}${colors.green('')}             ${subtitle2}             ${colors.green('')}{/bold}{/center}\n` +
    `{center}{bold}${colors.green('')}    Chain ID: ${CHAIN_ID} | Network: ${NETWORK_NAME}    ${colors.green('')}{/bold}{/center}\n` +
    `{center}{bold}${colors.green('═══════════════════════════════════════════')}{/bold}{/center}`;
  
  layout.header.setContent(bannerContent);
  screen.render();
}

function updateInfo(walletAddress, balance) {
  layout.info.setContent(`{bold}Wallet:{/bold} ${walletAddress || 'Not set'}\n{bold}Balance:{/bold} ${balance ? ethers.formatEther(balance) : '0'} ETH | {bold}Token Amount:{/bold} 1000 testnet cUSD per claim`);
  screen.render();
}

function updateStatusBar() {
  layout.statusBar.setContent(`{center}Success: {green-fg}${successCount}{/green-fg} | Failed: {red-fg}${failCount}{/red-fg} | Progress: ${currentClaim}/${claimCount} | Press {bold}m{/bold} for menu{/center}`);
  screen.render();
}

function updateProgressBar() {
  if (claimCount > 0) {
    const progress = currentClaim / claimCount;
    layout.progressBar.setProgress(progress * 100);
    screen.render();
  }
}

function log(message, colorKey = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  const colorFn = colors[colorKey] || colors.white;
  layout.log.log(`${colorFn(`[${timestamp}] ${message}`)}`);
  screen.render();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function resetCounters() {
  successCount = 0;
  failCount = 0;
  claimCount = 0;
  currentClaim = 0;
  updateStatusBar();
  updateProgressBar();
}

function updateEnvFile(privateKey) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('PRIVATE_KEY=')) {
        envContent = envContent.replace(/PRIVATE_KEY=.*/g, `PRIVATE_KEY=${privateKey}`);
      } else {
        envContent += `\nPRIVATE_KEY=${privateKey}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      log('Updated .env file with new private key', 'green');
      
      process.env.PRIVATE_KEY = privateKey;
      
      return true;
    } else {
      fs.writeFileSync(envPath, `PRIVATE_KEY=${privateKey}`);
      log('Created new .env file with private key', 'green');
      
      process.env.PRIVATE_KEY = privateKey;
      
      return true;
    }
  } catch (error) {
    log(`Error updating .env file: ${error.message}`, 'red');
    return false;
  }
}

async function claimFaucet(wallet, provider) {
  try {
    const walletAddress = wallet.address;
    
    const balanceBefore = await provider.getBalance(walletAddress);
    log(`Current wallet balance: ${ethers.formatEther(balanceBefore)} ETH`, 'gray');
    updateInfo(walletAddress, balanceBefore);
    
    const abiCoder = new ethers.AbiCoder();
    const encodedParams = abiCoder.encode(
      ['address', 'uint256'], 
      [walletAddress, TOKEN_AMOUNT]
    ).slice(2); 
    
    const data = MINT_FUNCTION_SIGNATURE + encodedParams;
    
    const gasPrice = (await provider.getFeeData()).gasPrice;
    const adjustedGasPrice = (gasPrice * BigInt(110)) / BigInt(100); 
    
    const tx = {
      to: CONTRACT_ADDRESS,
      data: data,
      gasLimit: 100000,
      gasPrice: adjustedGasPrice
    };
    
    log('Sending transaction...', 'yellow');
    log(`Claiming 1000 testnet cUSD tokens...`, 'yellow');
    
    const txResponse = await wallet.sendTransaction(tx);
    log(`Transaction sent! Hash: ${txResponse.hash}`, 'green');
    log(`View on explorer: ${EXPLORER_URL}/tx/${txResponse.hash}`, 'gray');
    
    log('Waiting for transaction to be mined...', 'yellow');
    const receipt = await txResponse.wait();
    
    log(`Transaction confirmed in block ${receipt.blockNumber}`, 'green');
    log(`Gas used: ${receipt.gasUsed.toString()}`, 'gray');
    
    if (receipt.status === 1) {
      log('Faucet claim SUCCESSFUL! 🎉', 'green');
      
      const balanceAfter = await provider.getBalance(walletAddress);
      log(`New wallet balance: ${ethers.formatEther(balanceAfter)} ETH`, 'gray');
      updateInfo(walletAddress, balanceAfter);
      log('Token claim successful. Check your wallet for the 1000 testnet cUSD tokens!', 'green');
      successCount++;
      return true;
    } else {
      log('Transaction failed!', 'red');
      failCount++;
      return false;
    }
  } catch (error) {
    log(`Error claiming from faucet: ${error.message}`, 'red');
    if (error.data) {
      log(`Error data: ${error.data}`, 'red');
    }
    failCount++;
    return false;
  }
}

function promptForPrivateKey() {
  layout.input.setFront();
  layout.input.show();
  layout.input.focus();
  layout.input.setValue('');
  layout.input.readInput();
  log('Enter your private key (without 0x prefix):', 'yellow');
  screen.render();
  
  return new Promise((resolve) => {
    layout.input.once('submit', (value) => {
      const privateKey = value.trim();
      if (!privateKey || privateKey.length !== 64) {
        log('Invalid private key format. Please enter a valid 64-character private key without 0x prefix.', 'red');
        resolve(promptForPrivateKey());
      } else {
        layout.input.hide();
        screen.render();
        
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        resolve(formattedKey);
      }
    });
  });
}

function promptForClaimCount() {
  layout.input.setFront();
  layout.input.show();
  layout.input.focus();
  layout.input.setValue('');
  layout.input.readInput();
  log('Enter the number of faucet claims you want to perform:', 'yellow');
  screen.render();
  
  return new Promise((resolve) => {
    layout.input.once('submit', (value) => {
      const count = parseInt(value.trim());
      if (isNaN(count) || count <= 0) {
        log('Please enter a valid positive number.', 'red');
        resolve(promptForClaimCount());
      } else {
        layout.input.hide();
        screen.render();
        resolve(count);
      }
    });
  });
}

async function initializeWallet() {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      log('Private key not found. Please enter your private key:', 'yellow');
      const newPrivateKey = await promptForPrivateKey();
      updateEnvFile(newPrivateKey);
      return initializeWallet(); 
    }
    
    const provider = new ethers.JsonRpcProvider(RPC_URL, {
      name: NETWORK_NAME,
      chainId: CHAIN_ID
    });
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const walletAddress = wallet.address;
    
    log(`Using wallet address: ${walletAddress}`, 'gray');
    
    currentWallet = wallet;
    currentProvider = provider;
    
    return wallet;
  } catch (error) {
    log(`Error initializing wallet: ${error.message}`, 'red');
    if (error.message.includes('invalid private key')) {
      log('The private key in your .env file is invalid. Please update it.', 'red');
      const newPrivateKey = await promptForPrivateKey();
      updateEnvFile(newPrivateKey);
      return initializeWallet(); 
    }
    return null;
  }
}

async function runClaims() {
  try {
    resetCounters();
    
    claimCount = await promptForClaimCount();
    log(`Will attempt ${claimCount} faucet claims with 10 second delays between each...`, 'yellow');
    
    for (let i = 1; i <= claimCount; i++) {
      currentClaim = i;
      updateStatusBar();
      updateProgressBar();
      
      log(`\n--- Starting claim ${i} of ${claimCount} ---`, 'gray');
      const startTime = Date.now();
      const success = await claimFaucet(currentWallet, currentProvider);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; 
      
      log(`Claim ${i} ${success ? 'completed successfully' : 'failed'} in ${duration.toFixed(2)} seconds`, success ? 'green' : 'red');
      
      if (i < claimCount) {
        log(`Waiting 10 seconds before next claim...`, 'yellow');
        await delay(10000); 
      }
    }
    
    log(`\n--- Faucet Claim Summary ---`, 'gray');
    log(`Total attempts: ${claimCount}`, 'white');
    log(`Successful claims: ${successCount}`, 'green');
    log(`Failed claims: ${failCount}`, 'red');
    log(`Total tokens claimed: ${successCount * 1000} testnet cUSD`, 'green');
    
    updateStatusBar();
    updateProgressBar();
    
    log('\nPress m to open the main menu', 'yellow');
  } catch (error) {
    log(`An error occurred: ${error.message}`, 'red');
  }
}

async function changeWallet() {
  try {
    log('Please enter your new private key:', 'yellow');
    const newPrivateKey = await promptForPrivateKey();

    const updated = updateEnvFile(newPrivateKey);
    
    if (updated) {
      log('Reinitializing wallet with new private key...', 'yellow');
      const wallet = await initializeWallet();
      
      if (wallet) {
        updateInfo(wallet.address, null);
        log('Wallet updated successfully!', 'green');
      } else {
        log('Failed to initialize wallet with new private key.', 'red');
      }
    } else {
      log('Failed to update private key.', 'red');
    }
  } catch (error) {
    log(`Error changing wallet: ${error.message}`, 'red');
  }
}

function showNetworkInfo() {
  log(`\n--- Network Information ---`, 'gray');
  log(`Network Name: ${NETWORK_NAME}`, 'white');
  log(`Chain ID: ${CHAIN_ID}`, 'white');
  log(`RPC URL: ${RPC_URL}`, 'white');
  log(`Contract Address: ${CONTRACT_ADDRESS}`, 'white');
  log(`Explorer URL: ${EXPLORER_URL}`, 'white');
  log(`Token Amount: 1000 testnet cUSD per claim`, 'white');
  
  log('\nPress m to open the main menu', 'yellow');
}

function showMainMenu() {
  layout.log.hide();
  layout.info.hide();
  layout.progressBar.hide();
  layout.statusBar.hide();
  layout.input.hide();

  layout.menu.show();
  layout.menu.focus();
  screen.render();

  layout.menu.once('select', async (item, index) => {
    layout.menu.hide();
    layout.log.show();
    layout.info.show();
    layout.progressBar.show();
    layout.statusBar.show();
    screen.render();
    
    switch(index) {
      case 0: 
        if (!currentWallet) {
          const wallet = await initializeWallet();
          if (wallet) {
            updateInfo(wallet.address, null);
            await runClaims();
          } else {
            log('Unable to initialize wallet. Please check your private key.', 'red');
          }
        } else {
          updateInfo(currentWallet.address, null);
          await runClaims();
        }
        break;
      case 1: 
        await changeWallet();
        break;
      case 2: 
        showNetworkInfo();
        break;
      case 3: 
        process.exit(0);
        break;
    }
  });
}

async function startApp() {
  generateModernBanner(); 
  updateStatusBar();
  
  log('Welcome to Cap.app Testnet CUSD Claimer!', 'green');
  log('Earn & POINT ', 'yellow');
  log('This tool helps you claim testnet cUSD tokens.', 'white');

  showMainMenu();
}

screen.key(['q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['m'], () => {
  showMainMenu();
});

startApp();
