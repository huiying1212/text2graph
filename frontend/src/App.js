import React, { useState } from 'react';
import './App.css';
import ChatWindow from './ChatWindow';
import CanvasBoard from './CanvasBoard';
import InputArea from './InputArea';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="App">
      <div className="main-container">
        {/* 左侧 Cytoscape Board */}
        <div className="left-board">
          <CanvasBoard graphData={graphData}/>
        </div>
        {/* 右侧 Chat Box */}
        <div className="right-chat-box">
          <ChatWindow response={response} />
          <InputArea
            setGraphData={setGraphData}
            setResponse={setResponse}
            setLoading={setLoading}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
