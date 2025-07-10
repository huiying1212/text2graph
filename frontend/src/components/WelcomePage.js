import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const WelcomePage = ({ onModeSelect, setResponse, setLoading }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [vectorizedFiles, setVectorizedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const fileInputRef = useRef(null);

  // 获取已向量化的文件信息
  const fetchVectorizedFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await axios.get('http://localhost:5000/vectorized-files');
      if (response.data.success) {
        setVectorizedFiles(response.data.files);
      }
    } catch (error) {
      console.error('获取向量化文件失败:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // 组件挂载时获取文件信息
  useEffect(() => {
    fetchVectorizedFiles();
  }, []);

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

      // 重新获取文件列表
      fetchVectorizedFiles();
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadProgress(0);
      // 可以考虑在文件管理面板中显示错误提示，而不是在聊天窗口
    } finally {
      setLoading(false);
    }
  };

  const handleFileIconClick = () => {
    setShowFiles(!showFiles);
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化上传时间
  const formatUploadTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取文件类型图标
  const getFileTypeIcon = (type, isSystemFile) => {
    if (isSystemFile) return '⚙️';
    switch (type) {
      case 'text': return '📄';
      case 'pdf': return '📕';
      case 'word': return '📘';
      case 'json': return '🔧';
      default: return '📎';
    }
  };

  return (
    <div style={containerStyle} className="welcome-container">
      {/* 背景层 */}
      <div style={backgroundStyle} />
      
      {/* 装饰性几何元素 */}
      <div style={decorativeElementsStyle}>
        <div style={{...geometricShape, ...shape1}} />
        <div style={{...geometricShape, ...shape2}} />
        <div style={{...geometricShape, ...shape3}} />
        <div style={{...geometricShape, ...shape4}} />
        <div style={{...geometricShape, ...shape5}} />
      </div>
      
      {/* 浮动装饰元素 */}
      <div style={floatingElementsStyle}>
        <div style={{...floatingElement, ...floatingElement1}} />
        <div style={{...floatingElement, ...floatingElement2}} />
        <div style={{...floatingElement, ...floatingElement3}} />
        <div style={{...floatingElement, ...floatingElement4}} />
      </div>
      
      {/* 主内容层 */}
      <div style={contentLayerStyle} className="welcome-content">
        {/* 欢迎标题区域 */}
        <div style={heroSectionStyle}>
          <div style={titleContainerStyle} className="welcome-title">
            <div style={titleRowStyle}>
              <div style={logoAndTitleStyle}>
                {/* 移除链接图标 */}
                <div style={titleTextContainerStyle}>
                  <h1 style={mainTitleStyle} className="welcome-text">
                    <span style={gradientTextStyle}>
                      Textualink
                    </span>
                  </h1>
                </div>
              </div>
              
              {/* 文件管理按钮 - 移到右上角 */}
              <div style={fileManagementStyle}>
                <button 
                  style={fileIconButtonStyle}
                  onClick={handleFileIconClick}
                  title={showFiles ? "收起文件列表" : "查看文件列表"}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 8px 25px rgba(52,152,219,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(52,152,219,0.2)';
                  }}
                >
                  <span style={fileIconStyle}>📚</span>
                </button>
              </div>
            </div>

            {/* 移除功能介绍文本 */}
          </div>

          {/* 文件管理面板 */}
          {showFiles && (
            <div style={fileManagementPanelStyle}>
              <div style={panelHeaderStyle}>
                <div style={panelTitleStyle}>
                  <span>知识库管理</span>
                </div>
                <button 
                  style={closePanelButtonStyle}
                  onClick={() => setShowFiles(false)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(231,76,60,0.1)';
                    e.target.style.color = '#e74c3c';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#7f8c8d';
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={panelContentStyle}>
                {/* 添加文件按钮 */}
                <div style={addFileContainerStyle}>
                  <button 
                    style={{
                      ...addFileButtonStyle,
                      opacity: uploadProgress > 0 ? 0.7 : 1,
                      cursor: uploadProgress > 0 ? 'not-allowed' : 'pointer'
                    }}
                    onClick={handleUploadClick}
                    disabled={uploadProgress > 0}
                    onMouseEnter={(e) => {
                      if (uploadProgress === 0) {
                        e.target.style.transform = 'translateY(-2px) scale(1.02)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102,126,234,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadProgress === 0) {
                        e.target.style.transform = 'translateY(0) scale(1)';
                        e.target.style.boxShadow = '0 2px 8px rgba(102,126,234,0.2)';
                      }
                    }}
                  >
                    {uploadProgress > 0 ? (
                      <div style={buttonContentStyle}>
                        <div style={uploadingIconStyle}>📤</div>
                        <div style={buttonTextStyle}>
                          <span style={buttonMainTextStyle}>上传中...</span>
                          <span style={buttonSubTextStyle}>{uploadProgress}% 已完成</span>
                        </div>
                      </div>
                    ) : (
                      <div style={buttonContentStyle}>
                        <div style={addIconStyle}>
                          <span>+</span>
                        </div>
                        <div style={buttonTextStyle}>
                          <span style={buttonMainTextStyle}>添加新文件</span>
                          <span style={buttonSubTextStyle}>支持 TXT、PDF、DOC、DOCX 格式</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 进度条 */}
                    {uploadProgress > 0 && (
                      <div style={progressContainerStyle}>
                        <div style={{
                          ...progressBarStyle,
                          width: `${uploadProgress}%`
                        }} />
                      </div>
                    )}
                  </button>
                </div>

                {/* 文件列表区域 */}
                {vectorizedFiles.length > 0 && (
                  <>
                    <div style={fileListHeaderStyle}>
                      <span>已上传的文件 ({vectorizedFiles.length})</span>
                    </div>
                    <div style={fileListStyle}>
                      {loadingFiles ? (
                        <div style={loadingStyle}>
                          <div style={spinnerStyle}></div>
                          <span>正在加载文件列表...</span>
                        </div>
                      ) : (
                        vectorizedFiles.map((file, index) => (
                          <div key={index} style={fileItemStyle}>
                            <div style={fileContentStyle}>
                              <span style={fileTypeIconStyle}>
                                {getFileTypeIcon(file.type, file.isSystemFile)}
                              </span>
                              <div style={fileDetailsStyle}>
                                <div style={fileNameStyle}>
                                  {file.filename}
                                  {file.isSystemFile && (
                                    <span style={systemBadgeStyle}>系统文件</span>
                                  )}
                                </div>
                                <div style={fileMetaInfoStyle}>
                                  {formatFileSize(file.size)} • {formatUploadTime(file.uploadTime)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {vectorizedFiles.length === 0 && !loadingFiles && (
                  <div style={emptyFileStateStyle}>
                    <div style={emptyIconStyle}>📂</div>
                    <div style={emptyTextStyle}>暂无向量化文件</div>
                    <div style={emptySubTextStyle}>点击上方按钮添加您的第一个文件</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 移除分隔装饰 */}
        
        {/* 功能选择区域 */}
        <div style={actionsContainerStyle}>
          {/* 移除区域标题 */}
          <div style={buttonsGridStyle} className="welcome-buttons">
            <button 
              style={{...actionButtonStyle, ...organizeButtonStyle}} 
              className="welcome-button"
              onClick={() => onModeSelect('organize')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 30px rgba(52,152,219,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = '';
                e.target.style.boxShadow = '';
              }}
            >
              <div style={buttonIconContainerStyle}>
                <div style={buttonIconStyle}>📚</div>
              </div>
              <div style={buttonInfoStyle}>
                <span style={buttonTitleStyle}>知识梳理</span>
                <span style={buttonDescStyle}>整理和结构化您的文本内容</span>
              </div>
              <div style={buttonArrowStyle}>→</div>
            </button>
            
            <button 
              style={{...actionButtonStyle, ...extendButtonStyle}} 
              className="welcome-button"
              onClick={() => onModeSelect('extend')}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 30px rgba(155,89,182,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = '';
                e.target.style.boxShadow = '';
              }}
            >
              <div style={buttonIconContainerStyle}>
                <div style={buttonIconStyle}>🚀</div>
              </div>
              <div style={buttonInfoStyle}>
                <span style={buttonTitleStyle}>知识拓展</span>
                <span style={buttonDescStyle}>扩展和深化您的文本内容</span>
              </div>
              <div style={buttonArrowStyle}>→</div>
            </button>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

// 样式定义
const containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
  borderRadius: '12px',
};

const backgroundStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: 'url(/background.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  opacity: 0.15,
  zIndex: 0,
};

const decorativeElementsStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
  pointerEvents: 'none',
};

const geometricShape = {
  position: 'absolute',
  background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  borderRadius: '20px',
  animation: 'float 8s ease-in-out infinite',
};

const shape1 = {
  width: '80px',
  height: '80px',
  top: '10%',
  left: '8%',
  animationDelay: '0s',
  transform: 'rotate(15deg)',
};

const shape2 = {
  width: '120px',
  height: '60px',
  top: '20%',
  right: '10%',
  animationDelay: '2s',
  transform: 'rotate(-10deg)',
};

const shape3 = {
  width: '60px',
  height: '100px',
  bottom: '15%',
  left: '15%',
  animationDelay: '4s',
  transform: 'rotate(25deg)',
};

const shape4 = {
  width: '90px',
  height: '90px',
  bottom: '20%',
  right: '8%',
  animationDelay: '6s',
  transform: 'rotate(-20deg)',
};

const shape5 = {
  width: '40px',
  height: '80px',
  top: '60%',
  left: '5%',
  animationDelay: '1s',
  transform: 'rotate(45deg)',
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
  background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
  animation: 'float 6s ease-in-out infinite',
};

const floatingElement1 = {
  width: '20px',
  height: '20px',
  top: '25%',
  left: '20%',
  animationDelay: '0s',
};

const floatingElement2 = {
  width: '15px',
  height: '15px',
  top: '70%',
  right: '25%',
  animationDelay: '2s',
};

const floatingElement3 = {
  width: '25px',
  height: '25px',
  top: '40%',
  right: '15%',
  animationDelay: '4s',
};

const floatingElement4 = {
  width: '18px',
  height: '18px',
  bottom: '30%',
  left: '25%',
  animationDelay: '3s',
};

const contentLayerStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '900px',
  height: '100%',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '20px',
  textAlign: 'center',
  gap: '80px',
  boxSizing: 'border-box',
};

const heroSectionStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '25px',
  marginTop: '20vh',
};

const titleContainerStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
};

const titleRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '40px',
  width: '100%',
  flexWrap: 'wrap',
  position: 'relative',
};

const logoAndTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
};

const titleTextContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
};

const mainTitleStyle = {
  fontSize: 'clamp(48px, 8vw, 72px)',
  fontWeight: '700',
  letterSpacing: '3px',
  margin: 0,
  textShadow: '2px 2px 12px rgba(0,0,0,0.3)',
  textAlign: 'center',
};

const gradientTextStyle = {
  background: 'linear-gradient(45deg, #667eea, #764ba2)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  letterSpacing: 'inherit',
  textShadow: 'none',
};

const fileManagementStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  position: 'absolute',
  top: '-5px',
  right: '100px',
};

const fileIconButtonStyle = {
  position: 'relative',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
  border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(52,152,219,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(10px)',
};

const fileIconStyle = {
  fontSize: '16px',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
};

const fileCountStyle = {
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
  color: 'white',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  fontSize: '10px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
};

const fileButtonLabelStyle = {
  fontSize: '10px',
  color: 'rgba(52,152,219,0.8)',
  fontWeight: '500',
  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
};

const fileManagementPanelStyle = {
  position: 'absolute',
  top: '58%',
  left: '56%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '300px',
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.3)',
  backdropFilter: 'blur(20px)',
  animation: 'popIn 0.3s ease-out',
  overflow: 'hidden',
  zIndex: 10,
};

const panelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 15px',
  background: 'linear-gradient(135deg, rgba(52,152,219,0.1), rgba(155,89,182,0.05))',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
};

const panelTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  fontWeight: '600',
  color: '#2c3e50',
};

const panelIconStyle = {
  fontSize: '16px',
};

const closePanelButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  cursor: 'pointer',
  color: '#7f8c8d',
  padding: '4px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelContentStyle = {
  padding: '15px',
};

const addFileContainerStyle = {
  marginBottom: '15px',
};

const addFileButtonStyle = {
  width: '100%',
  padding: '12px 15px',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(102,126,234,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const buttonContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
};

const addIconStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '50%',
  color: 'white',
  flexShrink: 0,
};

const uploadingIconStyle = {
  fontSize: '18px',
  color: 'white',
  flexShrink: 0,
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const buttonTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
  flex: 1,
};

const buttonMainTextStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: 'white',
  lineHeight: '1.2',
};

const buttonSubTextStyle = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.9)',
  fontWeight: '400',
  lineHeight: '1.2',
};

const progressContainerStyle = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  height: '4px',
  background: 'rgba(255,255,255,0.3)',
  borderRadius: '0 0 15px 15px',
  overflow: 'hidden',
};

const progressBarStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #f39c12, #e67e22)',
  borderRadius: '0 0 15px 15px',
  transition: 'width 0.3s ease',
};

const fileListHeaderStyle = {
  padding: '10px 0 6px 0',
  fontSize: '12px',
  fontWeight: '600',
  color: '#34495e',
  borderBottom: '2px solid rgba(52,152,219,0.1)',
  marginBottom: '10px',
};

const fileListStyle = {
  maxHeight: '150px',
  overflowY: 'auto',
  paddingRight: '3px',
};

const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '30px',
  color: '#7f8c8d',
  fontSize: '14px',
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '3px solid #ecf0f1',
  borderTopColor: '#3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const fileItemStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'rgba(248,249,250,0.8)',
  marginBottom: '6px',
  border: '1px solid rgba(0,0,0,0.05)',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

const fileContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const fileTypeIconStyle = {
  fontSize: '24px',
  minWidth: '24px',
};

const fileDetailsStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
};

const fileNameStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#2c3e50',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  wordBreak: 'break-all',
  lineHeight: '1.3',
};

const systemBadgeStyle = {
  fontSize: '10px',
  padding: '3px 8px',
  background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
  color: 'white',
  borderRadius: '12px',
  fontWeight: '500',
};

const fileMetaInfoStyle = {
  fontSize: '10px',
  color: '#7f8c8d',
  fontWeight: '500',
  lineHeight: '1.2',
};

const emptyFileStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  padding: '25px 12px',
  color: '#95a5a6',
};

const emptyIconStyle = {
  fontSize: '30px',
  opacity: 0.7,
};

const emptyTextStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#7f8c8d',
};

const emptySubTextStyle = {
  fontSize: '10px',
  color: '#95a5a6',
  textAlign: 'center',
};

const actionsContainerStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '25px',
  marginTop: '10vh',
  marginBottom: '20px',
};

const actionsSectionTitleStyle = {
  fontSize: 'clamp(20px, 4vw, 24px)',
  fontWeight: '600',
  color: 'rgba(52,152,219,0.95)',
  textShadow: '1px 1px 6px rgba(0,0,0,0.3)',
  margin: 0,
};

const buttonsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '25px',
  width: '100%',
  maxWidth: '700px',
};

const actionButtonStyle = {
  padding: '25px 30px',
  fontSize: '16px',
  fontWeight: '600',
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
};

const buttonIconContainerStyle = {
  width: '50px',
  height: '50px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const buttonIconStyle = {
  fontSize: '24px',
};

const buttonInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
  flex: 1,
  textAlign: 'left',
};

const buttonTitleStyle = {
  fontSize: 'clamp(16px, 2.5vw, 18px)',
  fontWeight: '700',
  lineHeight: '1.2',
};

const buttonDescStyle = {
  fontSize: 'clamp(12px, 2vw, 14px)',
  opacity: 0.9,
  fontWeight: '400',
  lineHeight: '1.3',
};

const buttonArrowStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  opacity: 0.8,
  transition: 'transform 0.3s ease',
};

const organizeButtonStyle = {
  background: 'linear-gradient(135deg, rgba(52,152,219,0.9), rgba(41,128,185,0.8))',
  boxShadow: '0 6px 20px rgba(52,152,219,0.2)',
};

const extendButtonStyle = {
  background: 'linear-gradient(135deg, rgba(155,89,182,0.9), rgba(142,68,173,0.8))',
  boxShadow: '0 6px 20px rgba(155,89,182,0.2)',
};

export default WelcomePage; 