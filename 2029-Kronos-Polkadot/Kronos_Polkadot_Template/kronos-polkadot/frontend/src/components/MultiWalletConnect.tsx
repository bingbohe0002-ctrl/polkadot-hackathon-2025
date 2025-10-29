import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Alert,
  Link,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Logout,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface MultiWalletConnectProps {
  account: InjectedAccountWithMeta | null;
  setAccount: (account: InjectedAccountWithMeta | null) => void;
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

// 钱包类型定义
interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  detectFunction: () => Promise<boolean>;
}

const MultiWalletConnect = ({ account, setAccount, showNotification }: MultiWalletConnectProps) => {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [noAccountDialog, setNoAccountDialog] = useState(false);
  const [keyRingLockedDialog, setKeyRingLockedDialog] = useState(false);
  const open = Boolean(anchorEl);

  const APP_NAME = 'Kronos Prediction DApp';

  // 检查 KeyRing 是否锁定
  const checkKeyRingStatus = async (): Promise<boolean> => {
    try {
      // 尝试获取账户，如果 KeyRing 锁定会抛出错误
      const accounts = await web3Accounts();
      return false; // 能获取到账户说明未锁定
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      console.log('🔍 KeyRing check error:', errorMessage);
      
      // 检查是否是 KeyRing 锁定错误
      if (errorMessage.includes('keyring') && errorMessage.includes('locked')) {
        return true;
      }
      
      // 检查控制台是否有相关错误
      if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
        return true;
      }
      
      return false;
    }
  };

  // 支持的钱包列表
  const walletOptions: WalletOption[] = [
    {
      id: 'polkadot-js',
      name: 'Polkadot{.js}',
      icon: '🔴',
      description: 'Official Polkadot extension (Recommended)',
      downloadUrl: 'https://polkadot.js.org/extension/',
      detectFunction: async () => {
        try {
          const extensions = await web3Enable(APP_NAME);
          return extensions.some(ext => ext.name === 'polkadot-js');
        } catch {
          return false;
        }
      }
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: '🟠',
      description: 'Multi-chain wallet with Polkadot support',
      downloadUrl: 'https://www.okx.com/web3',
      detectFunction: async () => {
        try {
          // OKX Wallet 也会注入 Polkadot 扩展
          const extensions = await web3Enable(APP_NAME);
          return extensions.some(ext => 
            ext.name?.toLowerCase().includes('okx') || 
            ext.name?.toLowerCase().includes('okexchain')
          );
        } catch {
          return false;
        }
      }
    },
    {
      id: 'subwallet',
      name: 'SubWallet',
      icon: '🟣',
      description: 'All-in-one Polkadot wallet',
      downloadUrl: 'https://subwallet.app/',
      detectFunction: async () => {
        try {
          const extensions = await web3Enable(APP_NAME);
          return extensions.some(ext => ext.name?.toLowerCase().includes('subwallet'));
        } catch {
          return false;
        }
      }
    },
    {
      id: 'talisman',
      name: 'Talisman',
      icon: '🌟',
      description: 'Better Web3 wallet for Polkadot & Ethereum',
      downloadUrl: 'https://talisman.xyz/',
      detectFunction: async () => {
        try {
          const extensions = await web3Enable(APP_NAME);
          return extensions.some(ext => ext.name?.toLowerCase().includes('talisman'));
        } catch {
          return false;
        }
      }
    },
  ];

  useEffect(() => {
    // 尝试从 localStorage 恢复连接
    const savedAccount = localStorage.getItem('selectedAccount');
    if (savedAccount) {
      restoreConnection(savedAccount);
    }
    
    // 定期检查账户状态
    const checkAccounts = async () => {
      try {
        const extensions = await web3Enable(APP_NAME);
        if (extensions.length > 0) {
          const accounts = await web3Accounts();
          console.log('🔄 Periodic check: Found', accounts.length, 'accounts');
        }
      } catch (error) {
        // 静默处理，避免控制台错误
      }
    };
    
    // 每5秒检查一次账户状态
    const interval = setInterval(checkAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const restoreConnection = async (address: string) => {
    try {
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length === 0) return;

      const allAccounts = await web3Accounts();
      const savedAcc = allAccounts.find(acc => acc.address === address);
      if (savedAcc) {
        setAccount(savedAcc);
      }
    } catch (error) {
      console.error('Failed to restore connection:', error);
    }
  };

  const connectWallet = async (walletId?: string) => {
    setLoading(true);
    setWalletDialogOpen(false);
    
    try {
      console.log('🔍 Starting wallet connection process...');
      
      // 启用所有可用的 Polkadot 扩展
      const extensions = await web3Enable(APP_NAME);
      
      if (extensions.length === 0) {
        console.log('❌ No extensions found');
        showNotification(
          'No wallet extension found. Please install a wallet.',
          'error'
        );
        setWalletDialogOpen(true);
        setLoading(false);
        return;
      }

      console.log('✅ Available extensions:', extensions.map(e => `${e.name} v${e.version}`));

      // 等待一小段时间确保扩展完全加载
      await new Promise(resolve => setTimeout(resolve, 500));

      // 获取所有账户 - 添加重试机制
      let allAccounts = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && allAccounts.length === 0) {
        try {
          console.log(`🔄 Attempting to get accounts (attempt ${retryCount + 1}/${maxRetries})...`);
          allAccounts = await web3Accounts();
          console.log(`📊 Found ${allAccounts.length} accounts on attempt ${retryCount + 1}`);
          
          if (allAccounts.length === 0 && retryCount < maxRetries - 1) {
            console.log('⏳ No accounts found, waiting 1 second before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error getting accounts on attempt ${retryCount + 1}:`, error);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        retryCount++;
      }
      
      console.log('📋 Final account count:', allAccounts.length);
      
      if (allAccounts.length === 0) {
        console.log('❌ No accounts found after all retries');
        
        // 检查是否是 KeyRing 锁定问题
        const isKeyRingLocked = await checkKeyRingStatus();
        if (isKeyRingLocked) {
          showNotification(
            'Polkadot.js extension is locked. Please unlock it first.',
            'error'
          );
          setKeyRingLockedDialog(true);
        } else {
          showNotification(
            'No accounts found. Please create an account first.',
            'warning'
          );
          setNoAccountDialog(true);
        }
        setLoading(false);
        return;
      }

      // 详细记录账户信息
      console.log('✅ Account details:');
      allAccounts.forEach((acc, index) => {
        console.log(`  ${index + 1}. Name: ${acc.meta.name || 'Unnamed'}`);
        console.log(`     Address: ${acc.address}`);
        console.log(`     Source: ${acc.meta.source}`);
        console.log(`     Type: ${acc.type || 'unknown'}`);
        console.log(`     Network: ${acc.address.startsWith('5') ? 'Polkadot ✅' : 'Other ⚠️'}`);
      });

      setAccounts(allAccounts);
      
      // 如果只有一个账户，直接选择
      if (allAccounts.length === 1) {
        console.log('🎯 Auto-selecting single account:', allAccounts[0].meta.name);
        selectAccount(allAccounts[0]);
      } else {
        console.log('📝 Multiple accounts found, opening selection menu');
        // 打开账户选择菜单
        setAnchorEl(document.getElementById('wallet-button'));
      }

      showNotification(
        `Found ${allAccounts.length} account(s) from ${extensions.length} wallet(s)`,
        'success'
      );
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      showNotification(
        'Failed to connect wallet: ' + (error as Error).message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (selectedAccount: InjectedAccountWithMeta) => {
    setAccount(selectedAccount);
    localStorage.setItem('selectedAccount', selectedAccount.address);
    setAnchorEl(null);
    showNotification(
      `Connected: ${selectedAccount.meta.name || 'Account'}`,
      'success'
    );
  };

  const disconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem('selectedAccount');
    setAnchorEl(null);
    showNotification('Wallet disconnected', 'info');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletSelect = async (wallet: WalletOption) => {
    const isInstalled = await wallet.detectFunction();
    
    if (!isInstalled) {
      showNotification(
        `${wallet.name} is not installed`,
        'warning'
      );
      window.open(wallet.downloadUrl, '_blank');
      return;
    }

    connectWallet(wallet.id);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={24} />
        <Typography variant="body2">Connecting...</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Connect Button */}
      {!account && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            id="wallet-button"
            variant="contained"
            color="primary"
            startIcon={<AccountBalanceWallet />}
            onClick={() => setWalletDialogOpen(true)}
          >
            Connect Wallet
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<span>🔧</span>}
            onClick={async () => {
              console.log('🔧 Force detection triggered by user');
              await connectWallet();
            }}
            disabled={loading}
            sx={{
              borderColor: '#E6007A',
              color: '#E6007A',
              '&:hover': {
                borderColor: '#c00066',
                backgroundColor: 'rgba(230, 0, 122, 0.1)',
              },
            }}
          >
            Force Detect
          </Button>
        </Box>
      )}

      {/* Connected Account Chip */}
      {account && (
        <Chip
          id="wallet-button"
          icon={<CheckCircle />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {account.meta.name || 'Account'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatAddress(account.address)}
              </Typography>
            </Box>
          }
          onClick={handleMenuOpen}
          sx={{ 
            px: 1, 
            py: 3,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(230, 0, 122, 0.1)',
            }
          }}
        />
      )}

      {/* Wallet Selection Dialog */}
      <Dialog 
        open={walletDialogOpen} 
        onClose={() => setWalletDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet />
            <Typography variant="h6">Select Wallet</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Choose your preferred wallet to connect to Kronos DApp
          </Alert>
          
          <List>
            {walletOptions.map((wallet) => (
              <ListItem key={wallet.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleWalletSelect(wallet)}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(230, 0, 122, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <Typography fontSize="2rem">{wallet.icon}</Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600}>
                        {wallet.name}
                      </Typography>
                    }
                    secondary={wallet.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Alert severity="warning" icon={<Info />}>
            <Typography variant="body2">
              Don't have a wallet?{' '}
              <Link 
                href="/wallet-setup-guide.html" 
                target="_blank" 
                underline="hover"
              >
                View setup guide
              </Link>
            </Typography>
          </Alert>
        </DialogContent>
      </Dialog>

      {/* No Account Dialog */}
      <Dialog
        open={noAccountDialog}
        onClose={() => setNoAccountDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>🔍</span>
            Account Detection Issue
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              DApp cannot detect your accounts, but you DO have accounts!
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            Based on your screenshot, you have Polkadot.js accounts with correct addresses (starting with 5). 
            This is likely a detection timing issue.
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              🔧 Quick Fixes (try in order):
            </Typography>
            
            <Box component="ol" sx={{ pl: 2 }}>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>1. Force Refresh:</strong> Press <code>Ctrl + Shift + R</code> on this page
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>2. Use Force Detect:</strong> Click the "🔧 Force Detect" button above
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>3. Check Console:</strong> Press F12 → Console tab to see detailed logs
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>4. Restart Browser:</strong> Close all windows and reopen
                </Typography>
              </li>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Still having issues?{' '}
              <Link 
                href="/force-connect.html" 
                target="_blank" 
                underline="hover"
              >
                Use the Force Connect Tool
              </Link>
              {' '}or{' '}
              <Link 
                href="/wallet-debug.html" 
                target="_blank" 
                underline="hover"
              >
                Run Full Diagnosis
              </Link>
            </Typography>
          </Alert>

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🔧 Force detection from dialog');
                await connectWallet();
                setNoAccountDialog(false);
              }}
            >
              🔧 Force Detect
            </Button>
            <Button
              variant="contained"
              onClick={() => window.open('/force-connect.html', '_blank')}
            >
              Open Diagnostic Tool
            </Button>
            <Button
              variant="outlined"
              onClick={() => setNoAccountDialog(false)}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* KeyRing Locked Dialog */}
      <Dialog
        open={keyRingLockedDialog}
        onClose={() => setKeyRingLockedDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>🔒</span>
            Polkadot.js Extension is Locked
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Your Polkadot.js extension is locked and needs to be unlocked first!
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            The extension's KeyRing (where your accounts are stored) is currently locked for security. 
            You need to unlock it before the DApp can access your accounts.
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#856404' }}>
              🔓 How to Unlock:
            </Typography>
            
            <Box component="ol" sx={{ pl: 2, color: '#856404' }}>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Click the Polkadot.js extension icon</strong> in your browser toolbar (red circle)
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Enter your password</strong> in the unlock dialog
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Click "Unlock"</strong> or "解锁" button
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Verify</strong> you can see your accounts (123, Arthur)
                </Typography>
              </li>
            </Box>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#d1ecf1', borderRadius: 1, border: '1px solid #bee5eb' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#0c5460' }}>
              🔍 Visual Guide:
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#0c5460', mb: 1 }}>
              Look for these indicators:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, color: '#0c5460' }}>
              <li>
                <Typography variant="body2">
                  <strong>Locked:</strong> 🔒 icon or "Unlock" button visible
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Unlocked:</strong> Account list visible, no lock icon
                </Typography>
              </li>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              After unlocking, come back and click "Connect Wallet" again.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyRingLockedDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              setKeyRingLockedDialog(false);
              // 等待一下让用户解锁
              setTimeout(async () => {
                await connectWallet();
              }, 2000);
            }}
          >
            🔄 Try Again After Unlocking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {accounts.length > 1 && (
          <>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Switch Account
              </Typography>
            </MenuItem>
            {accounts.map((acc) => (
              <MenuItem
                key={acc.address}
                onClick={() => selectAccount(acc)}
                selected={acc.address === account?.address}
              >
                <ListItemIcon>
                  {acc.address === account?.address && <CheckCircle fontSize="small" color="primary" />}
                </ListItemIcon>
                <ListItemText
                  primary={acc.meta.name || 'Account'}
                  secondary={formatAddress(acc.address)}
                />
              </MenuItem>
            ))}
            <MenuItem divider />
          </>
        )}
        <MenuItem onClick={disconnectWallet}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Disconnect</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default MultiWalletConnect;

