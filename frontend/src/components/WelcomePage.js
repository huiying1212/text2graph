import React, { useState, useRef } from 'react';
import axios from 'axios';

const WelcomePage = ({ onModeSelect, setResponse, setLoading }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

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

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景层 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.7,
        zIndex: 0
      }} />
      
      {/* 内容层 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <div className="welcome-text" style={welcomeTextStyle}>
          <span style={{
            background: 'linear-gradient(45deg, #3498db, #9b59b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none'
          }}>
            W E L C O M E
          </span>
        </div>
        
        <div className="welcome-buttons" style={buttonContainerStyle}>
          <button 
            style={{...buttonStyle, ...organizeButtonStyle}} 
            onClick={() => onModeSelect('organize')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)';
              e.target.style.boxShadow = '0 8px 25px rgba(52,152,219,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            <span style={{marginRight: '8px'}}>📚</span>
            知识梳理
          </button>
          
          <button 
            style={{...buttonStyle, ...extendButtonStyle}} 
            onClick={() => onModeSelect('extend')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.05)';
              e.target.style.boxShadow = '0 8px 25px rgba(191,136,165,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            <span style={{marginRight: '8px'}}>🚀</span>
            知识拓展
          </button>
        </div>

        {/* 上传文件按钮 */}
        <div style={uploadContainerStyle}>
          <button 
            style={{...uploadButtonStyle, opacity: uploadProgress > 0 ? 0.7 : 1}} 
            onClick={handleUploadClick}
            disabled={uploadProgress > 0}
            onMouseEnter={(e) => {
              if (uploadProgress === 0) {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(52,73,94,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (uploadProgress === 0) {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 12px rgba(52,73,94,0.2)';
              }
            }}
          >
            {uploadProgress > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📄</span>
                <span>上传中... {uploadProgress}%</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📁</span>
                <span>上传文件</span>
              </div>
            )}
            
            {/* 上传进度条 */}
            {uploadProgress > 0 && (
              <div style={progressBarContainerStyle}>
                <div style={{
                  ...progressBarStyle,
                  width: `${uploadProgress}%`
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
          
          <div style={uploadHintStyle}>
            支持 .txt .pdf .doc .docx 格式
          </div>
        </div>
      </div>
    </div>
  );
};

// 样式定义
const welcomeTextStyle = {
  position: 'absolute',
  top: '35%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '60px',
  fontWeight: 'bold',
  textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
  letterSpacing: '8px',
};

const buttonContainerStyle = {
  position: 'absolute',
  top: '55%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  gap: '60px',
  justifyContent: 'center',
};

const uploadContainerStyle = {
  position: 'absolute',
  top: '75%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const buttonStyle = {
  padding: '20px 40px',
  fontSize: '18px',
  fontWeight: '600',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: '160px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const uploadButtonStyle = {
  padding: '16px 32px',
  fontSize: '16px',
  fontWeight: '600',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(52,73,94,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: '200px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #34495e, #2c3e50)',
};

const uploadHintStyle = {
  fontSize: '12px',
  color: '#7f8c8d',
  fontWeight: '500',
  textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
};

const progressBarContainerStyle = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  height: '3px',
  background: 'rgba(255,255,255,0.3)',
  borderRadius: '0 0 10px 10px',
  overflow: 'hidden',
};

const progressBarStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #3498db, #2980b9)',
  borderRadius: '0 0 10px 10px',
  transition: 'width 0.3s ease',
};

const organizeButtonStyle = {
  background: 'linear-gradient(135deg, #3498db, #2980b9)',
};

const extendButtonStyle = {
  background: 'linear-gradient(135deg, #bf88a5, #9b59b6)',
};

export default WelcomePage; 