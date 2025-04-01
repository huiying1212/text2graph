// InputArea.js
import React, { useState } from 'react';
import axios from 'axios';

function InputArea({ setGraphData, setResponse, setLoading, loading }) {
  const [query, setQuery] = useState("");

  const handleQuery = async () => {
    if (!query) return;

    setLoading(true);

    // 记录用户输入
    setResponse((prevResponse) => [...prevResponse, { role: 'user', content: query }]);

    try {
      const res = await axios.post('http://localhost:5000/chat', { message: query }, {
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
        { role: 'system', content: '发生错误，请稍后重试。' }
      ]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="input-area">
      <input
        className="query-input"
        type="text"
        placeholder="请输入文本信息...."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') handleQuery(); }}
        disabled={loading}
      />
      <button onClick={handleQuery} disabled={loading || !query}>
        {loading ? "加载中..." : "发送"}
      </button>
    </div>
  );
}

export default InputArea;
