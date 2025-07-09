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
    <div style={containerStyle} className="welcome-container">
      {/* 背景层 */}
      <div style={backgroundStyle} />
      
      {/* 装饰性元素 */}
      <div style={floatingElementsStyle}>
        <div style={{...floatingElement, ...floatingElement1}} />
        <div style={{...floatingElement, ...floatingElement2}} />
        <div style={{...floatingElement, ...floatingElement3}} />
      </div>
      
      {/* 内容层 */}
      <div style={contentLayerStyle} className="welcome-content">
        {/* Welcome标题 */}
        <div style={welcomeTitleContainerStyle} className="welcome-title">
          <div style={welcomeTextStyle} className="welcome-text">
            <span style={welcomeGradientTextStyle}>
              W E L C O M E
            </span>
          </div>
          <div style={subtitleStyle} className="welcome-subtitle">
            文本知识图谱生成器
          </div>
        </div>
        
        {/* 功能按钮区域 */}
        <div style={buttonContainerStyle} className="welcome-buttons">
          <button 
            style={{...buttonStyle, ...organizeButtonStyle}} 
            className="welcome-button"
            onClick={() => onModeSelect('organize')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px) scale(1.05)';
              e.target.style.boxShadow = '0 15px 35px rgba(52,152,219,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(52,152,219,0.25)';
            }}
          >
            <div style={buttonIconStyle}>📚</div>
            <div style={buttonContentStyle}>
              <span style={buttonMainTextStyle}>知识梳理</span>
              <span style={buttonSubTextStyle}>整理文本内容</span>
            </div>
          </button>
          
          <button 
            style={{...buttonStyle, ...extendButtonStyle}} 
            className="welcome-button"
            onClick={() => onModeSelect('extend')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px) scale(1.05)';
              e.target.style.boxShadow = '0 15px 35px rgba(155,89,182,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(155,89,182,0.25)';
            }}
          >
            <div style={buttonIconStyle}>🚀</div>
            <div style={buttonContentStyle}>
              <span style={buttonMainTextStyle}>知识拓展</span>
              <span style={buttonSubTextStyle}>扩展知识内容</span>
            </div>
          </button>
        </div>

        {/* 上传文件区域 */}
        <div style={uploadContainerStyle} className="welcome-upload">
          <div style={uploadWrapperStyle}>
            <button 
              style={{
                ...uploadButtonStyle, 
                opacity: uploadProgress > 0 ? 0.8 : 1,
                cursor: uploadProgress > 0 ? 'not-allowed' : 'pointer'
              }}
              className="upload-button"
              onClick={handleUploadClick}
              disabled={uploadProgress > 0}
              onMouseEnter={(e) => {
                if (uploadProgress === 0) {
                  e.target.style.transform = 'translateY(-3px) scale(1.02)';
                  e.target.style.boxShadow = '0 8px 25px rgba(52,73,94,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (uploadProgress === 0) {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 5px 15px rgba(52,73,94,0.2)';
                }
              }}
            >
              {uploadProgress > 0 ? (
                <div style={uploadContentStyle}>
                  <span style={uploadIconStyle}>📄</span>
                  <span>上传中... {uploadProgress}%</span>
                </div>
              ) : (
                <div style={uploadContentStyle}>
                  <span style={uploadIconStyle}>📁</span>
                  <span>选择文件上传</span>
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
          </div>
          
          <div style={uploadHintStyle}>
            支持 .txt .pdf .doc .docx 格式的文件
          </div>
        </div>

        {/* 底部装饰线 */}
        <div style={decorativeLineStyle} className="welcome-decorative" />
      </div>
    </div>
  );
};

// 样式定义
const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const backgroundStyle = {
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
  opacity: 0.8,
  zIndex: 0,
  filter: 'blur(1px)',
};

const floatingElementsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
  pointerEvents: 'none',
};

const floatingElement = {
  position: 'absolute',
  borderRadius: '50%',
  background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
  animation: 'float 6s ease-in-out infinite',
};

const floatingElement1 = {
  width: '80px',
  height: '80px',
  top: '20%',
  left: '10%',
  animationDelay: '0s',
};

const floatingElement2 = {
  width: '60px',
  height: '60px',
  top: '70%',
  right: '15%',
  animationDelay: '2s',
};

const floatingElement3 = {
  width: '40px',
  height: '40px',
  top: '40%',
  right: '25%',
  animationDelay: '4s',
};

const contentLayerStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  textAlign: 'center',
};

const welcomeTitleContainerStyle = {
  marginBottom: '50px',
};

const welcomeTextStyle = {
  fontSize: 'clamp(36px, 5vw, 64px)',
  fontWeight: 'bold',
  letterSpacing: '8px',
  marginBottom: '10px',
  textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
};

const welcomeGradientTextStyle = {
  background: 'linear-gradient(45deg, #3498db, #9b59b6, #e74c3c)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textShadow: 'none',
  backgroundSize: '200% 200%',
  animation: 'gradientShift 3s ease-in-out infinite',
};

const subtitleStyle = {
  fontSize: 'clamp(14px, 2vw, 18px)',
  color: '#666',
  fontWeight: '500',
  letterSpacing: '2px',
  opacity: 0.8,
};

const buttonContainerStyle = {
  display: 'flex',
  gap: 'clamp(30px, 5vw, 60px)',
  justifyContent: 'center',
  marginBottom: '50px',
  flexWrap: 'wrap',
};

const buttonStyle = {
  padding: '24px 32px',
  fontSize: 'clamp(14px, 2vw, 16px)',
  fontWeight: '600',
  color: 'white',
  border: 'none',
  borderRadius: '16px',
  cursor: 'pointer',
  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: '180px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '15px',
  backdropFilter: 'blur(10px)',
};

const buttonIconStyle = {
  fontSize: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '24px',
};

const buttonContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
};

const buttonMainTextStyle = {
  fontSize: 'clamp(14px, 2vw, 16px)',
  fontWeight: '600',
  lineHeight: '1.2',
};

const buttonSubTextStyle = {
  fontSize: 'clamp(10px, 1.5vw, 12px)',
  opacity: 0.9,
  fontWeight: '400',
  lineHeight: '1.2',
};

const organizeButtonStyle = {
  background: 'linear-gradient(135deg, #3498db, #2980b9)',
  boxShadow: '0 8px 25px rgba(52,152,219,0.25)',
};

const extendButtonStyle = {
  background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
  boxShadow: '0 8px 25px rgba(155,89,182,0.25)',
};

const uploadContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '30px',
};

const uploadWrapperStyle = {
  position: 'relative',
};

const uploadButtonStyle = {
  padding: '18px 36px',
  fontSize: 'clamp(14px, 2vw, 16px)',
  fontWeight: '600',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  boxShadow: '0 5px 15px rgba(52,73,94,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: '220px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #34495e, #2c3e50)',
  backdropFilter: 'blur(10px)',
};

const uploadContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const uploadIconStyle = {
  fontSize: '20px',
};

const uploadHintStyle = {
  fontSize: 'clamp(11px, 1.5vw, 13px)',
  color: '#666',
  fontWeight: '500',
  opacity: 0.8,
  textAlign: 'center',
};

const progressBarContainerStyle = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  height: '3px',
  background: 'rgba(255,255,255,0.3)',
  borderRadius: '0 0 12px 12px',
  overflow: 'hidden',
};

const progressBarStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #3498db, #2980b9)',
  borderRadius: '0 0 12px 12px',
  transition: 'width 0.3s ease',
};

const decorativeLineStyle = {
  width: '60px',
  height: '3px',
  background: 'linear-gradient(90deg, #3498db, #9b59b6)',
  borderRadius: '2px',
  opacity: 0.6,
};

export default WelcomePage; 