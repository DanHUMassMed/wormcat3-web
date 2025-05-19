import { useEffect, useState } from 'react';

export function useTaskWebSocket(taskId, setTaskStatus, setIsRunning) {
    const [websocket, setWebsocket] = useState(null);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [resultUrl, setResultUrl] = useState(null);


    // Effect to handle WebSocket connection and cleanup
      useEffect(() => {
        // Clean up WebSocket connection when component unmounts
        return () => {
          if (websocket) {
            websocket.close();
          }
        };
      }, []);

      // Effect to handle WebSocket messages when taskId changes
      useEffect(() => {
        if (!taskId) return;

        // Close previous connection if exists
        if (websocket) {
          websocket.close();
        }

        // Create new WebSocket connection
        const ws = new WebSocket(`${process.env.REACT_APP_FASTAPI_BASE_WS}/wormcat3/ws/${taskId}`);
        setWebsocket(ws);

        ws.onopen = () => {
          //Handle on open of WS
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.progress !== undefined) {
            setProgress(data.progress);
          }
          if (data.message !== undefined) {
            setProgressMessage(data.message);
          }
          
          if (data.state) {
            setTaskStatus(data.state);
            
            if (data.state === 'COMPLETED') {
              setIsRunning(false);
              if (data.result_url) {
                setResultUrl(data.result_url);
              }
              ws.close();
            } else if (data.state === 'FAILED') {
              setIsRunning(false);
              ws.close();
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setTaskStatus('Error');
          setIsRunning(false);
        };

        ws.onclose = () => {
          //Handle on close of WS
        };

        return () => {
          ws.close();
        };
      }, [taskId]);

    return { progress, progressMessage, resultUrl };
}
