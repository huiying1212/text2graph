// InputArea.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function InputArea({ setGraphData, setResponse, setLoading, loading, mode }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("请先选择模式...");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'organize') {
      setPlaceholder("请输入文本进行知识梳理...");
      setIsButtonDisabled(false);
    } else if (mode === 'extend') {
      setPlaceholder("请输入文本进行知识拓展...");
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
        { role: 'system', content: '发生错误，请稍后重试。' }
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
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResponse((prev) => [
        ...prev,
        { role: 'system', content: `文件 "${file.name}" 已上传并处理。` },
      ]);
    } catch (error) {
      console.error('文件上传失败:', error);
      setResponse((prev) => [
        ...prev,
        { role: 'system', content: '文件上传失败，请稍后重试。' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-area">
      <button className="upload-button" onClick={handleUploadClick} disabled={loading}>
        +
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        className="query-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter' && !isButtonDisabled) handleQuery(); }}
        disabled={loading || isButtonDisabled}
      />
      <button onClick={handleQuery} disabled={loading || !query || isButtonDisabled}>
        {loading ? "加载中..." : "发送"}
      </button>
    </div>
  );
}

export default InputArea;
