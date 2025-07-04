import React from 'react';

const WelcomePage = ({ onModeSelect }) => {
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
      </div>
    </div>
  );
};

// 样式定义
const welcomeTextStyle = {
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '60px',
  fontWeight: 'bold',
  textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
  letterSpacing: '8px',
};

const buttonContainerStyle = {
  position: 'absolute',
  top: '60%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  gap: '60px',
  justifyContent: 'center',
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

const organizeButtonStyle = {
  background: 'linear-gradient(135deg, #3498db, #2980b9)',
};

const extendButtonStyle = {
  background: 'linear-gradient(135deg, #bf88a5, #9b59b6)',
};

export default WelcomePage; 