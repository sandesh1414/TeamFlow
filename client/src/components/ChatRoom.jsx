import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import { getFileIcon, formatFileSize, isImage } from '../utils/fileHelpers';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatRoom = ({ teamId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { teamId });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('message_history', (history) => setMessages(history));

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_typing', ({ name }) => setTypingUser(name));
    socket.on('user_stop_typing', () => setTypingUser(''));

    // Assistant thinking placeholder
    socket.on('assistant_thinking', ({ thinkingId }) => {
      setMessages((prev) => [
        ...prev,
        { _id: thinkingId, text: '...', sender: { name: 'Assistant ✨', isBot: true }, createdAt: new Date().toISOString(), isBot: true, isThinking: true },
      ]);
    });

    // Replace thinking placeholder with real response
    socket.on('assistant_response', ({ thinkingId, message }) => {
      setMessages((prev) => prev.map((m) => (m._id === thinkingId ? message : m)));
    });

    socket.on('message_error', (err) => console.error(err));

    return () => socket.disconnect();
  }, [teamId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { teamId, text });
    setText('');
    socketRef.current.emit('stop_typing', { teamId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current?.emit('typing', { teamId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { teamId });
    }, 1500);
  };

  const handleChatFileUploaded = (fileData) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_message', {
      teamId,
      text: fileData.filename,
      fileUrl: fileData.url,
      fileType: fileData.mimetype,
      fileSize: fileData.size,
      isFile: true,
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return !msg.isBot && senderId?.toString() === user._id?.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '620px', background: '#f8f9fa', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', background: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>💬 Team Chat</h3>
        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: connected ? '#2e7d32' : '#999' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#4caf50' : '#bbb', display: 'inline-block' }} />
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', marginTop: '60px' }}>
            <p style={{ fontSize: '32px' }}>💬</p>
            <p>No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMyMessage(msg);
          const isBot = msg.isBot === true;

          return (
            <div key={msg._id || idx} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
              <div style={{ maxWidth: '72%' }}>
                {(!mine || isBot) && (
                  <div style={{ fontSize: '11px', color: isBot ? '#7c3aed' : '#6c63ff', fontWeight: '700', marginBottom: '3px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isBot && <span>🤖</span>}
                    {msg.sender?.name}
                  </div>
                )}

                <div style={{
                  padding: '10px 14px',
                  borderRadius: mine && !isBot ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isBot ? 'linear-gradient(135deg, #f5f3ff, #fdf4ff)' : mine ? '#6c63ff' : 'white',
                  color: isBot ? '#4c1d95' : mine ? 'white' : '#333',
                  boxShadow: isBot ? '0 2px 8px rgba(108,99,255,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
                  fontSize: '14px', lineHeight: '1.5',
                  borderLeft: isBot ? '3px solid #a78bfa' : 'none',
                  opacity: msg.isThinking ? 0.7 : 1,
                }}>
                  {msg.isThinking ? (
                    // Bouncing dots thinking animation
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 4px' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                  ) : msg.isFile ? (
                    // File message
                    <div>
                      {isImage(msg.fileType) ? (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.fileUrl} alt={msg.text} style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', display: 'block' }} />
                        </a>
                      ) : (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: mine ? 'white' : '#333', textDecoration: 'none' }}>
                          <span style={{ fontSize: '24px' }}>{getFileIcon(msg.fileType, msg.text)}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{msg.text}</div>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>{formatFileSize(msg.fileSize)}</div>
                          </div>
                        </a>
                      )}
                    </div>
                  ) : (
                    // Regular or bot text message
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                  )}
                </div>

                <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px', textAlign: mine && !isBot ? 'right' : 'left', paddingLeft: '4px', paddingRight: '4px' }}>
                  {formatTime(msg.createdAt)}
                  {isBot && !msg.isThinking && <span style={{ marginLeft: '4px', color: '#a78bfa' }}>✨ AI</span>}
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', padding: '4px 0' }}>
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* @assistant hint */}
      <div style={{ padding: '5px 20px', fontSize: '11px', color: '#bbb', background: 'white', borderTop: '1px solid #f5f5f5' }}>
        💡 Type <strong style={{ color: '#a78bfa' }}>@assistant</strong> followed by any question about your tasks
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '14px 16px', background: 'white', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <FileUpload onUploadComplete={handleChatFileUploaded} compact />
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '24px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none' }}
          onBlur={() => socketRef.current?.emit('stop_typing', { teamId })}
        />
        <button type="submit" disabled={!text.trim()} style={{ padding: '10px 20px', background: text.trim() ? '#6c63ff' : '#e0e0e0', color: text.trim() ? 'white' : '#bbb', border: 'none', borderRadius: '24px', cursor: text.trim() ? 'pointer' : 'default', fontWeight: '600', transition: 'all 0.2s' }}>
          Send
        </button>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;
