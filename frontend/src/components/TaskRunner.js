import React, { useState, useEffect } from 'react';

function TaskRunner() {
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState('Idle');

  const startTask = async () => {
    setStatus('Starting...');
    const res = await fetch('http://localhost:8000/wormcat3/start-task', {
      method: 'POST',
    });
    const data = await res.json();
    setTaskId(data.task_id); // triggers useEffect below
    setStatus('Running');
  };

  useEffect(() => {
    if (!taskId) return;

    const ws = new WebSocket(`ws://localhost:8000/wormcat3/ws/${taskId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.state === 'COMPLETED') {
        setStatus('Completed');
        ws.close();
      }
    };

    ws.onerror = () => {
      setStatus('WebSocket error');
    };

    return () => {
      ws.close(); // clean up on component unmount or taskId change
    };
  }, [taskId]); // re-run only when taskId changes

  return (
    <div style={{ padding: 20 }}>
      <button onClick={startTask}>Start Task</button>
      <div style={{ marginTop: 20 }}>
        <p>Status: {status}</p>
        {progress !== null && <p>Progress: {progress}%</p>}
      </div>
    </div>
  );
}

export default TaskRunner;