import { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Logout,
  CheckCircle,
} from '@mui/icons-material';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface WalletConnectProps {
  account: InjectedAccountWithMeta | null;
  setAccount: (account: InjectedAccountWithMeta | null) => void;
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const WalletConnect = ({ account, setAccount, showNotification }: WalletConnectProps) => {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const APP_NAME = 'Kronos Prediction DApp';

  useEffect(() => {
    // 尝试从 localStorage 恢复连接
    const savedAccount = localStorage.getItem('selectedAccount');
    if (savedAccount) {
      restoreConnection(savedAccount);
    }
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

  const connectWallet = async () => {
    setLoading(true);
    try {
      // 启用 Polkadot.js 扩展
      const extensions = await web3Enable(APP_NAME);
      
      if (extensions.length === 0) {
        showNotification(
          'Please install Polkadot.js Extension',
          'error'
        );
        window.open('https://polkadot.js.org/extension/', '_blank');
        return;
      }

      // 获取所有账户
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        showNotification(
          'No accounts found. Please create an account in Polkadot.js Extension',
          'warning'
        );
        return;
      }

      setAccounts(allAccounts);
      
      // 如果只有一个账户，直接选择
      if (allAccounts.length === 1) {
        selectAccount(allAccounts[0]);
      } else {
        // 打开账户选择菜单
        setAnchorEl(document.getElementById('wallet-button'));
      }

      showNotification(
        `Found ${allAccounts.length} account(s)`,
        'success'
      );
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      showNotification(
        'Failed to connect wallet',
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!account) {
    return (
      <Button
        id="wallet-button"
        variant="contained"
        color="primary"
        startIcon={<AccountBalanceWallet />}
        onClick={connectWallet}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <>
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
                selected={acc.address === account.address}
              >
                <ListItemIcon>
                  {acc.address === account.address && <CheckCircle fontSize="small" color="primary" />}
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

export default WalletConnect;

