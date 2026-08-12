import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import {
  getFileIcon,
  formatFileSize,
  isImage
} from '../utils/fileHelpers';

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
    const socket = getSocket(user.token);

    // Store socket in ref
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);

      socket.emit('join_room', { teamId });
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.on('message_history', (history) => {
      setMessages(history);
    });

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_typing', ({ name }) => {
      setTypingUser(name);
    });

    socket.on('user_stop_typing', () => {
      setTypingUser('');
    });

    socket.on('assistant_thinking', ({ thinkingId }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: thinkingId,
          text: '...',
          sender: {
            name: 'Assistant ✨',
            isBot: true,
          },
          createdAt: new Date().toISOString(),
          isBot: true,
          isThinking: true,
        },
      ]);
    });

    socket.on('assistant_response', ({ thinkingId, message }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === thinkingId ? message : m
        )
      );
    });

    socket.on('message_error', (err) => {
      console.error('Message error:', err);
    });

    // If socket is already connected
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      socket.off('message_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('assistant_thinking');
      socket.off('assistant_response');
      socket.off('message_error');
    };
  }, [teamId, user.token]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();

    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      teamId,
      text
    });

    setText('');

    socketRef.current.emit('stop_typing', {
      teamId
    });
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    socketRef.current?.emit('typing', {
      teamId
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', {
        teamId
      });
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

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  const isMyMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;

    return (
      !msg.isBot &&
      senderId?.toString() === user._id?.toString()
    );
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '640px',
        overflow: 'hidden'
      }}
    >

      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 700
          }}
        >
          Team Chat
        </h3>

        <span
          style={{
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: connected
              ? 'var(--success-text)'
              : 'var(--text-faint)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected
                ? 'var(--success)'
                : '#cbd5e1',
              display: 'inline-block'
            }}
          />

          {connected
            ? 'Connected'
            : 'Connecting…'}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px',
          background: 'var(--bg)'
        }}
      >

        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              marginTop: '60px'
            }}
          >
            <div
              style={{
                fontSize: '34px',
                marginBottom: '10px'
              }}
            >
              💬
            </div>

            <p
              style={{
                fontSize: '14px'
              }}
            >
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMyMessage(msg);
          const isBot = msg.isBot === true;

          return (
            <div
              key={msg._id || idx}
              style={{
                display: 'flex',
                justifyContent: mine
                  ? 'flex-end'
                  : 'flex-start',
                marginBottom: '12px'
              }}
            >
              <div
                style={{
                  maxWidth: '72%'
                }}
              >

                {/* Sender name */}
                {(!mine || isBot) && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: isBot
                        ? 'var(--ai)'
                        : 'var(--primary)',
                      fontWeight: 700,
                      marginBottom: '4px',
                      paddingLeft: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isBot && <span>🤖</span>}

                    {msg.sender?.name}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  style={{
                    padding: '10px 15px',

                    borderRadius:
                      mine && !isBot
                        ? 'var(--r-lg) var(--r-lg) 4px var(--r-lg)'
                        : 'var(--r-lg) var(--r-lg) var(--r-lg) 4px',

                    background: isBot
                      ? 'var(--ai-soft)'
                      : mine
                        ? 'var(--primary)'
                        : 'var(--surface)',

                    color: isBot
                      ? 'var(--ai-text)'
                      : mine
                        ? '#fff'
                        : 'var(--text-body)',

                    border: isBot
                      ? '1px solid var(--ai-softer)'
                      : mine
                        ? 'none'
                        : '1px solid var(--border)',

                    boxShadow: 'var(--sh-xs)',

                    fontSize: '14px',

                    lineHeight: 1.55,

                    opacity: msg.isThinking
                      ? 0.85
                      : 1
                  }}
                >

                  {/* Thinking animation */}
                  {msg.isThinking ? (
                    <div
                      className="dot-typing"
                      style={{
                        padding: '2px 4px'
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            animationDelay:
                              `${i * 0.15}s`
                          }}
                        />
                      ))}
                    </div>

                  ) : msg.isFile ? (

                    /* File message */
                    <div>
                      {isImage(msg.fileType) ? (

                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.text}
                            style={{
                              maxWidth: '200px',
                              maxHeight: '150px',
                              borderRadius: 'var(--r-sm)',
                              display: 'block'
                            }}
                          />
                        </a>

                      ) : (

                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: mine
                              ? '#fff'
                              : 'var(--text-body)',
                            textDecoration: 'none'
                          }}
                        >

                          <span
                            style={{
                              fontSize: '24px'
                            }}
                          >
                            {getFileIcon(
                              msg.fileType,
                              msg.text
                            )}
                          </span>

                          <div>

                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 600
                              }}
                            >
                              {msg.text}
                            </div>

                            <div
                              style={{
                                fontSize: '11px',
                                opacity: 0.7
                              }}
                            >
                              {formatFileSize(
                                msg.fileSize
                              )}
                            </div>

                          </div>
                        </a>
                      )}
                    </div>

                  ) : (

                    /* Normal text message */
                    <span
                      style={{
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.text}
                    </span>
                  )}

                </div>

                {/* Timestamp */}
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-faint)',
                    marginTop: '4px',
                    textAlign:
                      mine && !isBot
                        ? 'right'
                        : 'left',
                    paddingLeft: '4px',
                    paddingRight: '4px'
                  }}
                >

                  {formatTime(msg.createdAt)}

                  {isBot && !msg.isThinking && (
                    <span
                      style={{
                        marginLeft: '4px',
                        color: 'var(--ai)',
                        fontWeight: 600
                      }}
                    >
                      ✨ AI
                    </span>
                  )}

                </div>

              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-faint)',
              fontStyle: 'italic',
              padding: '4px 0'
            }}
          >
            {typingUser} is typing…
          </div>
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* Assistant hint */}
      <div
        style={{
          padding: '6px 20px',
          fontSize: '11px',
          color: 'var(--text-faint)',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-soft)'
        }}
      >
        💡 Type{' '}
        <strong
          style={{
            color: 'var(--ai)',
            fontWeight: 600
          }}
        >
          @assistant
        </strong>{' '}
        followed by any question about your tasks
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '14px 18px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}
      >

        <FileUpload
          onUploadComplete={handleChatFileUploaded}
          compact
        />

        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type a message…"
          className="field"
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 'var(--r-pill)',
            border: '1px solid var(--border)'
          }}
          onBlur={() =>
            socketRef.current?.emit(
              'stop_typing',
              { teamId }
            )
          }
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="btn btn-primary"
          style={{
            borderRadius: 'var(--r-pill)'
          }}
        >
          Send
        </button>

      </form>

    </div>
  );
};

export default ChatRoom;
