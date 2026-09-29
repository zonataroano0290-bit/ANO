/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { LiquidCanvas } from './components/LiquidCanvas.js';
import { UploadZone } from './components/UploadZone.js';
import { MediaInspector } from './components/MediaInspector.js';
import { ProcessingView } from './components/ProcessingView.js';
import { ResultView } from './components/ResultView.js';
import { FailedProcessingPanel } from './components/FailedProcessingPanel.js';
import { DiagnosticPanel } from './components/DiagnosticPanel.js';
import { ErrorAlert } from './components/ErrorAlert.js';
import { MyWorksView } from './components/MyWorksView.js';
import { FullScreenImageViewer } from './components/FullScreenImageViewer.js';
import { FullScreenVideoViewer } from './components/FullScreenVideoViewer.js';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.js';
import { ProcessingJob, SavedWork, AnoModelId } from './types/index.js';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastApiStatus, setLastApiStatus] = useState<string>('HTTP 200 OK');
  const [lastError, setLastError] = useState<string | null>(null);

  // User private session ID
  const [userId, setUserId] = useState<string>('');
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'my-works'>('studio');

  // Media Viewers
  const [activeViewingWork, setActiveViewingWork] = useState<SavedWork | null>(null);
  const [deletingWork, setDeletingWork] = useState<SavedWork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutivePollErrorsRef = useRef<number>(0);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const userAbortedRef = useRef<boolean>(false);

  // Helper for human-readable HTTP errors
  const formatHttpError = (status: number, message?: string) => {
    switch (status) {
      case 400:
        return message || 'Invalid media request or parameters.';
      case 401:
        return 'Unauthorized: AI provider authentication failed.';
      case 403:
        return 'Forbidden: Access to AI enhancement endpoint was denied.';
      case 404:
        return 'The enhancement job was not found on the server.';
      case 408:
        return 'Request timeout: Media upload took too long. Please check your network connection.';
      case 429:
        return 'Rate limit exceeded: AI inference provider is busy. Please try again in a moment.';
      case 500:
        return message || 'Internal server error during media processing.';
      case 502:
      case 503:
        return 'AI provider gateway unavailable. Please check provider connection.';
      default:
        return message || `Request failed with HTTP status ${status}.`;
    }
  };

  // Initialize private user session ID
  useEffect(() => {
    let currentUserId = localStorage.getItem('ano_user_id');
    if (!currentUserId) {
      currentUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('ano_user_id', currentUserId);
    }
    setUserId(currentUserId);
    loadSavedWorks(currentUserId);
  }, []);

  const loadSavedWorks = async (uid: string) => {
    try {
      const res = await fetch('/api/saved', {
        headers: {
          'x-user-id': uid,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedWorks(data.works || []);
      }
    } catch (e) {
      console.warn('Could not load saved works:', e);
    }
  };

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll active job status with timeout and real error catching
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    consecutivePollErrorsRef.current = 0;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/upscale/${activeJob.id}`);
        setLastApiStatus(`HTTP ${res.status} ${res.statusText}`);

        if (!res.ok) {
          consecutivePollErrorsRef.current += 1;
          if (consecutivePollErrorsRef.current >= 4) {
            const errMsg = formatHttpError(res.status, 'Unable to retrieve enhancement job status.');
            setLastError(errMsg);
            setActiveJob((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'failed',
                    realStage: 'FAILED',
                    error: errMsg,
                    stage: 'Job Status Error',
                    stageDescription: errMsg,
                  }
                : null
            );
          }
          return;
        }

        consecutivePollErrorsRef.current = 0;
        const data = await res.json();

        if (data.job) {
          setActiveJob(data.job);
          if (data.job.status === 'failed') {
            setLastError(data.job.error || 'Pipeline failed.');
          }
        } else if (data.jobId) {
          setActiveJob((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              id: data.jobId,
              status: data.status || prev.status,
              progress: typeof data.progress === 'number' ? data.progress : prev.progress,
              stage: data.stage || prev.stage,
              stageDescription: data.stageDescription || prev.stageDescription,
              error: data.error || prev.error,
            };
          });
          if (data.status === 'failed') {
            setLastError(data.error || 'Pipeline failed.');
          }
        }
      } catch (err: any) {
        consecutivePollErrorsRef.current += 1;
        console.error('Job polling error:', err);
        if (consecutivePollErrorsRef.current >= 4) {
          const errMsg = 'Network lost while polling job status. Please check your connection.';
          setLastError(errMsg);
          setActiveJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'failed',
                  realStage: 'FAILED',
                  error: errMsg,
                  stage: 'Network Timeout',
                  stageDescription: errMsg,
                }
              : null
          );
        }
      }
    };

    pollIntervalRef.current = setInterval(pollJob, 800);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeJob?.id, activeJob?.status]);

  // Handle file select
  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setLastError(null);
    setSelectedFile(file);
    setActiveJob(null);
    setActiveTab('studio');
  };

  // Helper to record upload failure state cleanly
  const handleUploadFailure = (msg: string, model: AnoModelId) => {
    setIsSubmitting(false);
    setUploadProgress(null);
    setLastError(msg);
    setErrorMessage(msg);
    if (!selectedFile) return;

    setActiveJob({
      id: `failed_${Date.now()}`,
      createdAt: Date.now(),
      mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'image',
      modelUsed: model,
      originalFilename: selectedFile.name,
      fileSize: selectedFile.size,
      sourceMeta: {
        mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'image',
        format: 'unknown',
        width: 0,
        height: 0,
        aspectRatio: '16:9',
        aspectRatioValue: 1.77,
        fileSize: selectedFile.size,
        targetWidth: 3840,
        targetHeight: 2160,
        targetResolutionLabel: '3840 × 2160 UHD',
        isTrue4K: true,
      },
      targetMeta: {
        width: 3840,
        height: 2160,
        resolutionLabel: '3840 × 2160 UHD',
        aspectRatio: '16:9',
      },
      status: 'failed',
      realStage: 'FAILED',
      progress: 0,
      stage: 'Upload Failed',
      stageDescription: msg,
      error: msg,
    });
  };

  // Start processing in 4K with chosen ANO model
  const handleStartProcessing = (model: AnoModelId) => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setLastError(null);
    userAbortedRef.current = false;

    const formData = new FormData();
    formData.append('media', selectedFile);
    formData.append('model', model);

    const xhr = new XMLHttpRequest();
    uploadXhrRef.current = xhr;

    // Track real upload progress for large media files
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      uploadXhrRef.current = null;
      setIsSubmitting(false);
      setUploadProgress(null);
      setLastApiStatus(`HTTP ${xhr.status} ${xhr.statusText}`);

      try {
        const data = JSON.parse(xhr.responseText || '{}');

        if (xhr.status < 200 || xhr.status >= 300) {
          const errorText = formatHttpError(xhr.status, data.error);
          handleUploadFailure(errorText, model);
          return;
        }

        if (data.job) {
          setActiveJob(data.job);
        } else if (data.jobId) {
          setActiveJob({
            id: data.jobId,
            createdAt: Date.now(),
            mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'image',
            modelUsed: model,
            originalFilename: selectedFile.name,
            fileSize: selectedFile.size,
            sourceMeta: {
              mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'image',
              format: 'unknown',
              width: 1920,
              height: 1080,
              aspectRatio: '16:9',
              aspectRatioValue: 1.77,
              fileSize: selectedFile.size,
              targetWidth: 3840,
              targetHeight: 2160,
              targetResolutionLabel: '3840 × 2160 UHD',
              isTrue4K: true,
            },
            targetMeta: {
              width: 3840,
              height: 2160,
              resolutionLabel: '3840 × 2160 UHD',
              aspectRatio: '16:9',
            },
            status: data.status || 'queued',
            realStage: 'QUEUED',
            progress: 0,
            stage: data.stage || 'Job Queued',
            stageDescription: data.stageDescription || 'Initializing 4K super-resolution pipeline...',
          });
        }
      } catch (err: any) {
        handleUploadFailure('Server returned an invalid response during upload.', model);
      }
    };

    xhr.onerror = () => {
      uploadXhrRef.current = null;
      if (!userAbortedRef.current) {
        handleUploadFailure('Connection failed during media upload. Please check your internet connection.', model);
      }
    };

    xhr.onabort = () => {
      uploadXhrRef.current = null;
      setIsSubmitting(false);
      setUploadProgress(null);
      if (!userAbortedRef.current) {
        handleUploadFailure('Upload was interrupted. Please try again.', model);
      }
    };

    xhr.open('POST', '/api/upscale', true);
    xhr.setRequestHeader('x-user-id', userId);
    xhr.send(formData);
  };

  // Save completed job to user library
  const handleSaveJob = async (jobId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save media.');
      }

      const data = await res.json();
      if (data.savedWork) {
        setSavedWorks((prev) => [data.savedWork, ...prev]);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Save job error:', err);
      setErrorMessage(err.message || 'Failed to save file.');
      return false;
    }
  };

  // Delete saved work confirmation
  const handleConfirmDelete = async () => {
    if (!deletingWork) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/saved/${deletingWork.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete saved media.');
      }

      setSavedWorks((prev) => prev.filter((w) => w.id !== deletingWork.id));
      if (activeViewingWork?.id === deletingWork.id) {
        setActiveViewingWork(null);
      }
      setDeletingWork(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete file.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel processing
  const handleCancel = async () => {
    if (uploadXhrRef.current) {
      userAbortedRef.current = true;
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
    setIsSubmitting(false);
    setUploadProgress(null);

    if (activeJob) {
      try {
        await fetch(`/api/jobs/${activeJob.id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Error cancelling job:', e);
      }
    }
    setActiveJob(null);
    setSelectedFile(null);
  };

  // Reset to initial state
  const handleReset = () => {
    if (uploadXhrRef.current) {
      userAbortedRef.current = true;
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
    setIsSubmitting(false);
    setUploadProgress(null);

    if (activeJob) {
      fetch(`/api/jobs/${activeJob.id}`, { method: 'DELETE' }).catch(() => {});
    }
    setActiveJob(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setLastError(null);
  };

  const currentSelectedModel: AnoModelId = activeJob?.modelUsed || (selectedFile?.type.startsWith('video/') ? 'ANO 5.5 Flash' : 'ANO 3.1 V2');

  return (
    <div className="relative min-h-screen bg-[#050507] text-white flex flex-col justify-between selection:bg-purple-600/30 selection:text-purple-200">
      {/* 3D Liquid Canvas Background */}
      <LiquidCanvas />

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setErrorMessage(null);
        }}
        savedCount={savedWorks.length}
        onReset={handleReset}
        hasActiveJob={!!selectedFile || !!activeJob}
      />

      {/* Main Content View Switcher */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center py-6">
        {activeTab === 'my-works' ? (
          /* MY WORKS GALLERY VIEW */
          <MyWorksView
            works={savedWorks}
            onOpenItem={(work) => setActiveViewingWork(work)}
            onDeleteItem={(work) => setDeletingWork(work)}
            onNewMedia={() => {
              setActiveTab('studio');
              handleReset();
            }}
          />
        ) : (
          /* STUDIO WORKFLOW VIEWS */
          <>
            {/* State 1: Job completed - Result Before/After, Save and Download */}
            {activeJob && activeJob.status === 'completed' ? (
              <ResultView
                job={activeJob}
                onReset={handleReset}
                onSave={handleSaveJob}
                isSaved={savedWorks.some((w) => w.jobId === activeJob.id)}
              />
            ) : activeJob && activeJob.status === 'failed' ? (
              /* State 2: JOB FAILED ERROR PANEL (NO INFINITE LOADING) */
              <FailedProcessingPanel
                job={activeJob}
                onTryAgain={() => {
                  setActiveJob(null);
                }}
                onReset={handleReset}
              />
            ) : activeJob ? (
              /* State 3: Job in progress */
              <ProcessingView job={activeJob} onCancel={handleCancel} />
            ) : selectedFile ? (
              /* State 4: File selected, awaiting user confirmation to start 4K pipeline */
              <MediaInspector
                file={selectedFile}
                onProcess={handleStartProcessing}
                onRemove={handleReset}
                isSubmitting={isSubmitting}
                uploadProgress={uploadProgress}
                onError={(msg) => setErrorMessage(msg)}
              />
            ) : (
              /* State 5: Initial Screen - Direct, focused ANO 4K upload */
              <UploadZone
                onFileSelect={handleFileSelect}
                onError={(msg) => setErrorMessage(msg)}
                isLoading={isSubmitting}
              />
            )}
          </>
        )}
      </main>

      {/* Fullscreen Image Viewer Modal */}
      {activeViewingWork && activeViewingWork.mediaType === 'image' && (
        <FullScreenImageViewer
          work={activeViewingWork}
          onClose={() => setActiveViewingWork(null)}
          onDeleteRequest={(work) => setDeletingWork(work)}
        />
      )}

      {/* Fullscreen Video Viewer Modal */}
      {activeViewingWork && activeViewingWork.mediaType === 'video' && (
        <FullScreenVideoViewer
          work={activeViewingWork}
          onClose={() => setActiveViewingWork(null)}
          onDeleteRequest={(work) => setDeletingWork(work)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingWork && (
        <DeleteConfirmModal
          isOpen={!!deletingWork}
          title={deletingWork.originalFilename}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingWork(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Floating Error Dialog */}
      {errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Collapsible Development Diagnostic Panel */}
      <DiagnosticPanel
        job={activeJob}
        selectedModel={currentSelectedModel}
        lastApiStatus={lastApiStatus}
        lastError={lastError}
      />

      {/* Minimal Footer */}
      <footer className="relative z-10 py-6 px-6 text-center text-xs text-neutral-400 font-mono-code border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>ANO 4K • AI SUPER RESOLUTION STUDIO</span>
          <div className="flex items-center gap-4">
            <span>ANO 5.5 FLASH (VIDEO)</span>
            <span>•</span>
            <span>ANO 3.1 V2 (IMAGE)</span>
            <span>•</span>
            <span>3840×2160 UHD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
