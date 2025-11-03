import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Component Tests
 * 
 * These tests verify the UI components work correctly
 */

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useWalletClient: () => ({
    data: { writeContract: vi.fn() },
  }),
  usePublicClient: () => ({
    data: { readContract: vi.fn(), simulateContract: vi.fn() },
  }),
}));

// Mock useContract hook
vi.mock('../hooks/useContract', () => ({
  useContract: () => ({
    createGroup: vi.fn().mockResolvedValue(1),
    joinGroup: vi.fn().mockResolvedValue('0x123'),
    sendGroupMessage: vi.fn().mockResolvedValue('0x456'),
    getGroupInfo: vi.fn().mockResolvedValue({
      name: 'Test Group',
      creator: '0x1234567890123456789012345678901234567890',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      memberCount: BigInt(5),
    }),
    getGroupMembers: vi.fn().mockResolvedValue([]),
    getLatestGroupMessages: vi.fn().mockResolvedValue([]),
    getTotalGroupMessages: vi.fn().mockResolvedValue(BigInt(0)),
    getUserGroups: vi.fn().mockResolvedValue([]),
    createChannel: vi.fn().mockResolvedValue(1),
    subscribeToChannel: vi.fn().mockResolvedValue('0x789'),
    sendChannelMessage: vi.fn().mockResolvedValue('0xabc'),
    getChannelInfo: vi.fn().mockResolvedValue({
      name: 'Test Channel',
      creator: '0x1234567890123456789012345678901234567890',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      subscriberCount: BigInt(10),
    }),
    getChannelSubscribers: vi.fn().mockResolvedValue([]),
    getLatestChannelMessages: vi.fn().mockResolvedValue([]),
    getTotalChannelMessages: vi.fn().mockResolvedValue(BigInt(0)),
    getUserChannels: vi.fn().mockResolvedValue([]),
    addFriend: vi.fn().mockResolvedValue('0xdef'),
    removeFriend: vi.fn().mockResolvedValue('0xghi'),
    getFriends: vi.fn().mockResolvedValue([]),
    checkFriendship: vi.fn().mockResolvedValue(false),
    getUserProfile: vi.fn().mockResolvedValue({
      username: 'TestUser',
      avatarUrl: '',
      signature: 'Test signature',
    }),
    getAllUsers: vi.fn().mockResolvedValue([]),
    listenToGroupMessages: vi.fn().mockReturnValue(() => {}),
    listenToChannelMessages: vi.fn().mockReturnValue(() => {}),
  }),
}));

describe('Group Chat Components', () => {
  describe('GroupList Component', () => {
    it('should render create group button', async () => {
      const { default: GroupList } = await import('../components/GroupList.jsx');
      const onSelectGroup = vi.fn();
      const onClose = vi.fn();

      render(<GroupList onSelectGroup={onSelectGroup} onClose={onClose} />);

      const createButton = screen.getByText(/Create Group/i);
      expect(createButton).toBeInTheDocument();
    });

    it('should show create form when create button clicked', async () => {
      const { default: GroupList } = await import('../components/GroupList.jsx');
      const onSelectGroup = vi.fn();
      const onClose = vi.fn();

      render(<GroupList onSelectGroup={onSelectGroup} onClose={onClose} />);

      const createButton = screen.getByText(/Create Group/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter group name/i);
        expect(input).toBeInTheDocument();
      });
    });

    it('should validate group name input', async () => {
      const { default: GroupList } = await import('../components/GroupList.jsx');
      const onSelectGroup = vi.fn();
      const onClose = vi.fn();

      render(<GroupList onSelectGroup={onSelectGroup} onClose={onClose} />);

      const createButton = screen.getByText(/Create Group/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter group name/i);
        expect(input).toHaveAttribute('maxLength', '100');
      });
    });
  });

  describe('GroupChat Component', () => {
    const mockGroup = {
      groupId: BigInt(1),
      name: 'Test Group',
      creator: '0x1234567890123456789012345678901234567890',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    };

    it('should display group name', async () => {
      const { default: GroupChat } = await import('../components/GroupChat.jsx');
      const onClose = vi.fn();
      const onOpenPrivateChat = vi.fn();

      render(
        <GroupChat
          group={mockGroup}
          onClose={onClose}
          onOpenPrivateChat={onOpenPrivateChat}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Group/i)).toBeInTheDocument();
      });
    });

    it('should have message input field', async () => {
      const { default: GroupChat } = await import('../components/GroupChat.jsx');
      const onClose = vi.fn();
      const onOpenPrivateChat = vi.fn();

      render(
        <GroupChat
          group={mockGroup}
          onClose={onClose}
          onOpenPrivateChat={onOpenPrivateChat}
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Type your message/i);
        expect(input).toBeInTheDocument();
      });
    });

    it('should validate message length', async () => {
      const { default: GroupChat } = await import('../components/GroupChat.jsx');
      const onClose = vi.fn();
      const onOpenPrivateChat = vi.fn();

      render(
        <GroupChat
          group={mockGroup}
          onClose={onClose}
          onOpenPrivateChat={onOpenPrivateChat}
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Type your message/i);
        expect(input).toHaveAttribute('maxLength', '1000');
      });
    });
  });
});

describe('Channel Components', () => {
  describe('ChannelList Component', () => {
    it('should render create channel button', async () => {
      const { default: ChannelList } = await import('../components/ChannelList.jsx');
      const onSelectChannel = vi.fn();
      const onClose = vi.fn();

      render(<ChannelList onSelectChannel={onSelectChannel} onClose={onClose} />);

      const createButton = screen.getByText(/Create Channel/i);
      expect(createButton).toBeInTheDocument();
    });

    it('should show create form when create button clicked', async () => {
      const { default: ChannelList } = await import('../components/ChannelList.jsx');
      const onSelectChannel = vi.fn();
      const onClose = vi.fn();

      render(<ChannelList onSelectChannel={onSelectChannel} onClose={onClose} />);

      const createButton = screen.getByText(/Create Channel/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter channel name/i);
        expect(input).toBeInTheDocument();
      });
    });

    it('should validate channel name input', async () => {
      const { default: ChannelList } = await import('../components/ChannelList.jsx');
      const onSelectChannel = vi.fn();
      const onClose = vi.fn();

      render(<ChannelList onSelectChannel={onSelectChannel} onClose={onClose} />);

      const createButton = screen.getByText(/Create Channel/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter channel name/i);
        expect(input).toHaveAttribute('maxLength', '100');
      });
    });
  });

  describe('Channel Component', () => {
    const mockChannel = {
      channelId: BigInt(1),
      name: 'Test Channel',
      creator: '0x1234567890123456789012345678901234567890',
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    };

    it('should display channel name', async () => {
      const { default: Channel } = await import('../components/Channel.jsx');
      const onClose = vi.fn();
      const onOpenPrivateChat = vi.fn();

      render(
        <Channel
          channel={mockChannel}
          onClose={onClose}
          onOpenPrivateChat={onOpenPrivateChat}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Channel/i)).toBeInTheDocument();
      });
    });

    it('should show creator badge for channel creator', async () => {
      const { default: Channel } = await import('../components/Channel.jsx');
      const onClose = vi.fn();
      const onOpenPrivateChat = vi.fn();

      render(
        <Channel
          channel={mockChannel}
          onClose={onClose}
          onOpenPrivateChat={onOpenPrivateChat}
        />
      );

      await waitFor(() => {
        const badge = screen.getByText(/Creator/i);
        expect(badge).toBeInTheDocument();
      });
    });
  });
});

describe('Friend System Components', () => {
  describe('PrivateChat with Friend Feature', () => {
    const mockUser = {
      address: '0x5678901234567890123456789012345678901234',
      username: 'TestFriend',
      avatarUrl: '',
      signature: 'Test signature',
    };

    it('should display add friend button for non-friends', async () => {
      const { default: PrivateChat } = await import('../components/PrivateChat.jsx');
      const onClose = vi.fn();

      render(<PrivateChat user={mockUser} onClose={onClose} />);

      await waitFor(() => {
        const addButton = screen.getByText(/Add Friend/i);
        expect(addButton).toBeInTheDocument();
      });
    });

    it('should show private chat note', async () => {
      const { default: PrivateChat } = await import('../components/PrivateChat.jsx');
      const onClose = vi.fn();

      render(<PrivateChat user={mockUser} onClose={onClose} />);

      await waitFor(() => {
        const note = screen.getByText(/Private chat \(stored locally, not on-chain\)/i);
        expect(note).toBeInTheDocument();
      });
    });
  });
});

