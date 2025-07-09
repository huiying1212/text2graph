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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isButtonDisabled && query.trim()) {
      e.preventDefault();
      handleQuery();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !mode) return;

    setLoading(true);
    setUploadProgress(0);

    // 添加用户上传文件的消息
    setResponse((prevResponse) => [...prevResponse, { 
      role: 'user', 
      content: `📁 已上传文件: ${file.name}` 
    }]);

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

      // 先上传文件到服务器
      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 读取文件内容
      const fileContent = await readFileContent(file);
      
      // 将文件内容作为查询发送给处理API
      const endpoint = mode === 'extend' ? 'http://localhost:5000/extend' : 'http://localhost:5000/chat';
      
      const res = await axios.post(endpoint, { message: fileContent }, {
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

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setResponse((prevResponse) => [
        ...prevResponse,
        { role: 'system', content: '❌ 文件处理失败，请稍后重试。' }
      ]);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
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

      {/* 文件上传按钮 */}
      <button
        className="upload-button"
        onClick={handleFileUpload}
        disabled={loading || isButtonDisabled || uploadProgress > 0}
        title={uploadProgress > 0 ? '上传中...' : '上传文件'}
      >
        {uploadProgress > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <div className="loading-spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }}></div>
            {uploadProgress}%
          </div>
        ) : (
          '📁'
        )}
        
        {/* 上传进度条 */}
        {uploadProgress > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '3px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '0 0 20px 20px',
            width: `${uploadProgress}%`,
            transition: 'width 0.3s ease'
          }} />
        )}
      </button>

      {/* 隐藏的文件输入 */}
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

      {/* 文件上传提示 */}
      {!loading && uploadProgress === 0 && mode && (
        <div style={{
          position: 'absolute',
          bottom: '-25px',
          left: '16px',
          fontSize: '11px',
          color: '#94a3b8',
          fontStyle: 'italic'
        }}>
          支持 .txt .pdf .doc .docx 格式
        </div>
      )}
    </div>
  );
}

export default InputArea;
