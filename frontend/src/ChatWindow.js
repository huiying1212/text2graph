// ChatWindow.js
import React, { useEffect, useRef } from 'react';

function ChatWindow({ response }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [response]); // 每当response变化时滚动到底部

  return (
    <div className="chat-window">
      {response.map((msg, index) => {
        console.log(`Message ${index} role: ${msg.role}`);

        const formattedMessage = msg.role === 'assistant' ? '可视化已完成' : msg.content;

        return (
          <div
            key={index}
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'system-message'}`}
          >
            {formattedMessage}
          </div>
        );
      })}
      <div ref={messagesEndRef} /> {/* 空的div元素作为滚动目标 */}
    </div>
  );
}

export default ChatWindow;