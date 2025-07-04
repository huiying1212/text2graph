// InputArea.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function InputArea({ setGraphData, setResponse, setLoading, loading, mode }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("请先选择模式...");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

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

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

      setResponse((prev) => [
        ...prev,
        { role: 'system', content: `📁 文件 "${file.name}" 已上传并处理成功。` },
      ]);
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadProgress(0);
      setResponse((prev) => [
        ...prev,
        { role: 'system', content: '❌ 文件上传失败，请稍后重试。' },
      ]);
    } finally {
      setLoading(false);
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
      {/* 上传进度条 */}
      {uploadProgress > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '0',
          right: '0',
          height: '3px',
          background: 'rgba(102,126,234,0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

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

      <button 
        className="upload-button" 
        onClick={handleUploadClick} 
        disabled={loading}
        title="上传文件"
        style={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {uploadProgress > 0 ? (
          <span style={{ fontSize: '16px' }}>📄</span>
        ) : (
          <span style={{ fontSize: '18px' }}>+</span>
        )}
        {uploadProgress > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            right: '2px',
            height: '3px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '2px'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              background: 'white',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx"
      />

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
