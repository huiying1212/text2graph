// ChatWindow.js
import React, { useEffect, useRef, useState } from 'react';

function ChatWindow({ response }) {
  const messagesEndRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, isTyping]);

  // 处理消息的逐步显示
  useEffect(() => {
    if (response.length > displayedMessages.length) {
      const newMessage = response[displayedMessages.length];
      
      if (newMessage.role === 'assistant') {
        setIsTyping(true);
        // 模拟打字机效果的延迟
        setTimeout(() => {
          setDisplayedMessages(prev => [...prev, newMessage]);
          setIsTyping(false);
        }, 800);
      } else {
        // 用户消息立即显示
        setDisplayedMessages(prev => [...prev, newMessage]);
      }
    }
  }, [response, displayedMessages.length]);

  const formatMessage = (msg) => {
    if (msg.role === 'assistant') {
      return '✨ 可视化已完成';
    }
    return msg.content;
  };

  const getMessageIcon = (role) => {
    switch (role) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      default:
        return '💬';
    }
  };

  return (
    <div className="chat-window">
      {/* 欢迎消息 */}
      {displayedMessages.length === 0 && (
        <div className="welcome-message" style={{
          textAlign: 'center',
          color: '#94a3b8',
          fontStyle: 'italic',
          padding: '20px',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <div>选择模式开始构建您的知识图谱</div>
        </div>
      )}

      {/* 消息列表 */}
      {displayedMessages.map((msg, index) => {
        const formattedMessage = formatMessage(msg);
        const icon = getMessageIcon(msg.role);

        return (
          <div
            key={index}
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'system-message'}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div style={{
              fontSize: '16px',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              {formattedMessage}
              {msg.role === 'assistant' && (
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  图谱已更新
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 打字指示器 */}
      {isTyping && (
        <div className="typing-indicator" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 18px',
          marginBottom: '6px',
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          <div style={{ fontSize: '16px' }}>🤖</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#94a3b8'
          }}>
            <span>AI正在思考</span>
            <div className="typing-dots" style={{
              display: 'flex',
              gap: '2px'
            }}>
              <div className="dot" style={dotStyle}></div>
              <div className="dot" style={{...dotStyle, animationDelay: '0.2s'}}></div>
              <div className="dot" style={{...dotStyle, animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* 内联样式用于动画 */}
      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
        
        .dot {
          animation: bounce 1.4s infinite;
        }
      `}</style>
    </div>
  );
}

// 点动画样式
const dotStyle = {
  width: '6px',
  height: '6px',
  backgroundColor: '#667eea',
  borderRadius: '50%',
  animation: 'bounce 1.4s infinite'
};

export default ChatWindow;