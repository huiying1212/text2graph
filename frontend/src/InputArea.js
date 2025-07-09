// InputArea.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InputArea({ setGraphData, setResponse, setLoading, loading, mode }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("请先选择模式...");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    if (mode === 'organize') {
      setPlaceholder("📚 请输入文本进行知识梳理...");
      setIsButtonDisabled(false);
    } else if (mode === 'extend') {
      setPlaceholder("🚀 请输入文本进行知识拓展...");
      setIsButtonDisabled(false);
    } else {
      setPlaceholder("请先选择模式...");
      setIsButtonDisabled(true);
    }
  }, [mode]);

  const handleQuery = async () => {
    if (!query || !mode) return;

    setLoading(true);

    // 记录用户输入
    setResponse((prevResponse) => [...prevResponse, { role: 'user', content: query }]);

    try {
      // 根据模式选择不同的API端点
      const endpoint = mode === 'extend' ? 'http://localhost:5000/extend' : 'http://localhost:5000/chat';
      
      const res = await axios.post(endpoint, { message: query }, {
        headers: { 'Content-Type': 'application/json' },
      });

      // 提取后端返回的数据
      console.log('Backend response:', res.data);
      const { reply, data } = res.data;
      const { keyinfo, connections } = data;

      // 更新对话内容，包含助手的实际回复
      setResponse((prevResponse) => [
        ...prevResponse,
        { role: 'assistant', content: reply }
      ]);

      // 更新图形数据
      if (keyinfo && connections) {
        setGraphData({ keyinfo, connections });
      } else {
        console.warn('No keyinfo or connections in response');
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse((prevResponse) => [
        ...prevResponse,
        { role: 'system', content: '❌ 发生错误，请稍后重试。' }
      ]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isButtonDisabled && query.trim()) {
      e.preventDefault();
      handleQuery();
    }
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="loading-spinner"></div>
          <span>处理中...</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>发送</span>
        <span style={{ fontSize: '14px' }}>✨</span>
      </div>
    );
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'organize':
        return '📚';
      case 'extend':
        return '🚀';
      default:
        return '💭';
    }
  };

  return (
    <div className="input-area">
      {/* 模式指示器 */}
      {mode && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '16px',
          fontSize: '12px',
          color: '#667eea',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px',
          borderRadius: '12px',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <span>{getModeIcon()}</span>
          <span>{mode === 'organize' ? '知识梳理模式' : '知识拓展模式'}</span>
        </div>
      )}

      <input
        className="query-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading || isButtonDisabled}
        style={{
          paddingLeft: mode ? '20px' : '18px',
        }}
      />

      <button 
        onClick={handleQuery} 
        disabled={loading || !query.trim() || isButtonDisabled}
        style={{
          minWidth: '100px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {getButtonContent()}
      </button>

      {/* 快捷提示 */}
      {!loading && query.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '-25px',
          right: '16px',
          fontSize: '11px',
          color: '#94a3b8',
          fontStyle: 'italic'
        }}>
          按 Enter 发送
        </div>
      )}
    </div>
  );
}

export default InputArea;
