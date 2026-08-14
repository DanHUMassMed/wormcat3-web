import { useEffect, useRef, useState, useCallback } from 'react';
import { apiRequest } from '../api/apiRequestUtil';

export function useTaskWebSocket(taskId, setTaskStatus, setIsRunning, setErrorMessage) {
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [resultUrl, setResultUrl] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isTerminalStateRef = useRef(false);

  const handleMessage = useCallback(
    (data) => {
      if (!data) return;

      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.message !== undefined) {
        setProgressMessage(data.message);
      }
      if (data.result_url) {
        setResultUrl(data.result_url);
      }
      if (data.report_id) {
        setReportId(data.report_id);
      }
      if (data.download_url) {
        setDownloadUrl(data.download_url);
      }

      if (data.state) {
        setTaskStatus(data.state);

        if (data.state === 'COMPLETED') {
          isTerminalStateRef.current = true;
          setIsRunning(false);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        } else if (data.state === 'FAILED') {
          isTerminalStateRef.current = true;
          setIsRunning(false);
          const errorMsg = data.message || data.error_details || 'Process execution failed';
          setErrorMessage(errorMsg);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      }
    },
    [setTaskStatus, setIsRunning, setErrorMessage]
  );

  const pollStatusFallback = useCallback(async () => {
    if (!taskId || isTerminalStateRef.current) return;
    try {
      const data = await apiRequest('get', `/wormcat3/status/${taskId}`);
      if (data) {
        handleMessage(data);
      }
    } catch (err) {
      console.warn('Status poll fallback failed:', err);
    }
  }, [taskId, handleMessage]);

  useEffect(() => {
    if (!taskId) return;

    isTerminalStateRef.current = false;
    setProgress(0);
    setProgressMessage('Connecting...');
    setResultUrl(null);
    setReportId(null);
    setDownloadUrl(null);

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connect = () => {
      if (isTerminalStateRef.current) return;

      const wsBase = process.env.REACT_APP_FASTAPI_BASE_WS || 'ws://localhost:8000';
      const wsUrl = `${wsBase}/wormcat3/ws/${taskId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket encountered an error:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (!isTerminalStateRef.current && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 4000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (!isTerminalStateRef.current) {
          // Fall back to HTTP polling if WebSocket fails
          pollStatusFallback();
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [taskId, handleMessage, pollStatusFallback]);

  return { progress, progressMessage, resultUrl, reportId, downloadUrl, isConnected };
}
