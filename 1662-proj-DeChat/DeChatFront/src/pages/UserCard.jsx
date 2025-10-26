
import { motion } from 'framer-motion'; // ✅ 正确的导入
import './UserCard.css';

const UserCard = ({ user, action, reward, delay }) => {
  // 使用简单可靠的卡通头像生成
  const getCartoonAvatar = (username) => {
   // 使用 public 文件夹中的本地 SVG 文件，确保每个用户有独特的头像
  const avatars = ['/avatar11.svg', '/avatar10.svg', '/avatar38.svg', '/avatar40.svg'];
  const avatarIndex = username.length % avatars.length;
  
  // 返回选中的本地 SVG 文件路径
  return avatars[avatarIndex];
  };
  
  const avatarUrl = getCartoonAvatar(user);

  return (
    // 使用 motion.div 包裹整个卡片
    <motion.div
      className="user-card"
      // 初始状态：透明度为0，位置在下方20px
      initial={{ opacity: 0, y: 20 }}
      // 动画结束状态：透明度为1，位置恢复
      animate={{ opacity: 1, y: 0 }}
      // 过渡效果：设置动画曲线和延迟时间
      transition={{
        type: 'spring',
        stiffness: 100,
        delay: delay || 0, // 接收一个延迟时间 prop
      }}
      // 悬停时的动画效果
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      }}
    >
      <img
        src={avatarUrl}
        alt={`${user}'s Avatar`}
        className="user-avatar"
      />
      <div className="message-bubble">
        <div className="message-content">
          <p className="user-name">{user}</p>
          <p className="card-description">
            {action}
            <span className="reward">{reward}</span>
          </p>
        </div>
        {/* 消息气泡的小尾巴 */}
        <div className="message-tail"></div>
      </div>
    </motion.div>
  );
};

export default UserCard;