import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconUsers,
  IconClock,
  IconBroadcast,
  IconDoor,
  IconRefresh,
} from '@tabler/icons-react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../../api/client';
import { logger } from '../../utils/logger';
import { categoryService, Category } from '../../api/services/category.service';

type StreamStatus = 'idle' | 'preparing' | 'live' | 'paused' | 'ended';
type RecordingMode = 'continuous' | 'ptt'; // continuous = sürekli kayıt, ptt = bas konuş

interface RoomStats {
  roomNumber: number;
  currentCount: number;
  capacity: number;
}

interface StreamStats {
  viewerCount: number;
  roomCount: number;
  rooms: RoomStats[];
}

const LiveBroadcastPage: React.FC = () => {
  // State
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [streamId, setStreamId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [duration, setDuration] = useState(0);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('continuous');
  const [isPTTActive, setIsPTTActive] = useState(false); // Bas Konuş aktif mi

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.list();
        setCategories(data || []);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();

    return () => {
      stopBroadcast();
      socketRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Mikrofon izni kontrol
  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission(true);
      return true;
    } catch {
      setMicPermission(false);
      setError('Mikrofon izni gerekli. Tarayıcı ayarlarından izin verin.');
      return false;
    }
  };

  // Socket.IO bağlantısı
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    // VITE_API_BASE_URL = http://localhost:3300/api -> http://localhost:3300
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    console.log('[Socket] Connecting to:', `${baseUrl}/live`);

    socketRef.current = io(`${baseUrl}/live`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      logger.info('Socket connected');
      console.log('[Socket] Connected to /live namespace, socket id:', socketRef.current?.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socketRef.current.on('stream-stats', (data: StreamStats) => {
      setStats(data);
    });

    socketRef.current.on('disconnect', () => {
      logger.info('Socket disconnected');
    });
  }, []);

  // Yayın oluştur ve başlat
  const startBroadcast = async () => {
    if (!title.trim()) {
      setError('Yayın başlığı gerekli');
      return;
    }
    if (!categoryId) {
      setError('Kategori seçimi gerekli');
      return;
    }

    const hasMic = await checkMicPermission();
    if (!hasMic) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Yayın oluştur
      const createRes = await apiClient.post('/live/streams', {
        title,
        description,
        categoryId,
      });
      const newStreamId = createRes.data.id;
      setStreamId(newStreamId);
      setStatus('preparing');

      // 2. Socket bağlan
      connectSocket();

      // Socket bağlantısı async - host-join connect event'inde yapılacak
      // streamId'yi socket data'ya kaydet
      if (socketRef.current) {
        socketRef.current.once('connect', () => {
          console.log('[Broadcast] Socket connected, joining as host...');
          socketRef.current?.emit(
            'host-join',
            { streamId: newStreamId },
            (response: { success: boolean; error?: string }) => {
              if (response.success) {
                console.log('[Broadcast] Host joined successfully');
              } else {
                console.error('[Broadcast] Host join failed:', response.error);
                setError(response.error || 'Host katılımı başarısız');
              }
            },
          );
        });
      }

      // 3. Mikrofon aç
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = mediaStream;

      // 4. Web Audio API - Waveform görselleştirme için
      console.log('[Broadcast] Setting up Web Audio API for waveform...');
      const audioContext = new AudioContext({ sampleRate: 44100 });
      audioCtxRef.current = audioContext;
      console.log('[Broadcast] AudioContext state:', audioContext.state);

      // AudioContext suspended olabilir, resume et
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[Broadcast] AudioContext resumed, state:', audioContext.state);
      }

      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      console.log('[Broadcast] Analyser created, fftSize:', analyser.fftSize);

      // Waveform için bağlantı
      source.connect(analyser);
      // Sesi çıkışa vermemek için sessiz gain
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      analyser.connect(silentGain);
      silentGain.connect(audioContext.destination);
      console.log('[Broadcast] Audio graph connected: source -> analyser -> silentGain -> destination');

      // 5. Raw PCM Audio Streaming (Web Audio API ScriptProcessor)
      // WebM chunk'lar çalışmadı çünkü header gerekiyor. PCM raw data ile gönderiyoruz.
      console.log('[Broadcast] Setting up raw PCM audio streaming...');

      const BUFFER_SIZE = 4096; // ~93ms at 44100Hz
      const scriptProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

      // Source'u scriptProcessor'a bağla
      source.disconnect(); // Önce analyser'dan kopar
      source.connect(analyser); // Waveform için
      source.connect(scriptProcessor); // PCM data için
      scriptProcessor.connect(silentGain); // Sessiz çıkış

      let audioChunkCount = 0;
      scriptProcessor.onaudioprocess = (event) => {
        if (!socketRef.current?.connected) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Float32 -> Int16 dönüşümü (daha küçük boyut)
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // PCM verisini gönder
        socketRef.current.emit('audio-data', {
          streamId: newStreamId,
          pcmData: Array.from(int16Data),
          sampleRate: audioContext.sampleRate,
        });

        audioChunkCount++;
        if (audioChunkCount % 20 === 0) {
          console.log(`[Broadcast] Sent ${audioChunkCount} PCM chunks (${int16Data.length * 2} bytes, ${audioContext.sampleRate}Hz)`);
        }
      };

      // ScriptProcessor ref'ini sakla (cleanup için)
      (audioCtxRef.current as any).scriptProcessor = scriptProcessor;

      // MediaRecorder'ı sadece kayıt için kullan (HLS/VOD)
      console.log('[Broadcast] Setting up MediaRecorder for recording...');
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          const arrayBuffer = await event.data.arrayBuffer();
          // Sadece kayıt için gönder (HLS/VOD için)
          socketRef.current.emit('audio-recording', {
            streamId: newStreamId,
            audioBuffer: arrayBuffer,
          });
        }
      };

      // 5. Yayını başlat
      await apiClient.post(`/live/streams/${newStreamId}/start`);

      // MediaRecorder'ı kayıt için başlat
      mediaRecorder.start(1000); // Her saniye bir chunk
      console.log('[Broadcast] Real-time PCM audio streaming started');

      setStatus('live');

      // Waveform çizimini başlat (status live olduktan sonra, canvas görünür olacak)
      // Birden fazla deneme yap çünkü React DOM'u güncellemesi zaman alabilir
      const tryStartWaveform = (attempts = 0) => {
        if (attempts > 10) {
          console.warn('[Broadcast] Waveform canvas not found after 10 attempts');
          return;
        }
        if (waveformCanvasRef.current && analyserRef.current) {
          console.log('[Broadcast] Starting waveform visualization');
          startWaveformDraw();
        } else {
          setTimeout(() => tryStartWaveform(attempts + 1), 100);
        }
      };
      tryStartWaveform();

      // Timer başlat
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yayın başlatılamadı';
      setError(message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  // Yayını duraklat
  const pauseBroadcast = async () => {
    if (!streamId) return;

    try {
      await apiClient.post(`/live/streams/${streamId}/pause`);
      mediaRecorderRef.current?.pause();
      setStatus('paused');
      if (timerRef.current) clearInterval(timerRef.current);

      socketRef.current?.emit('stream-status', {
        streamId,
        status: 'PAUSED',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yayın duraklatılamadı';
      setError(message);
    }
  };

  // Yayını devam ettir
  const resumeBroadcast = async () => {
    if (!streamId) return;

    try {
      await apiClient.post(`/live/streams/${streamId}/resume`);
      mediaRecorderRef.current?.resume();
      setStatus('live');
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      socketRef.current?.emit('stream-status', {
        streamId,
        status: 'LIVE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yayın devam ettirilemedi';
      setError(message);
    }
  };

  // Yayını bitir
  const stopBroadcast = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // MediaRecorder durdur
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    // Mikrofonu kapat
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      gainRef.current = null;
    }

    // API'ye bildir
    if (streamId) {
      try {
        await apiClient.post(`/live/streams/${streamId}/end`);
      } catch (err) {
        logger.error('End stream error:', err);
      }

      socketRef.current?.emit('stream-status', {
        streamId,
        status: 'ENDED',
      });
    }

    // Socket kapat
    socketRef.current?.disconnect();

    setStatus('ended');
  };

  // Süre formatla
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Yeni yayın
  const resetBroadcast = () => {
    setStatus('idle');
    setStreamId(null);
    setDuration(0);
    setStats(null);
    setTitle('');
    setDescription('');
    setCategoryId('');
    setError(null);
    setIsPTTActive(false);
  };

  // PTT - Bas Konuş başlat
  const startPTT = () => {
    if (!mediaRecorderRef.current || status !== 'live' || recordingMode !== 'ptt') return;

    try {
      if (mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(250); // 🔴 250ms = düşük gecikme
        setIsPTTActive(true);
        console.log('[PTT] Recording started (250ms intervals for real-time)');
      }
    } catch (err) {
      console.error('[PTT] Start error:', err);
    }
  };

  // PTT - Bas Konuş durdur
  const stopPTT = () => {
    if (!mediaRecorderRef.current || recordingMode !== 'ptt') return;

    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsPTTActive(false);
        console.log('[PTT] Recording stopped');

        // Yeniden kullanım için mediaRecorder'ı yeniden oluştur
        if (streamRef.current) {
          const newRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000,
          });
          newRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0 && socketRef.current?.connected && streamId) {
              const arrayBuffer = await event.data.arrayBuffer();
              console.log(`[PTT] Sending audio data: ${arrayBuffer.byteLength} bytes`);
              socketRef.current.emit('audio-data', {
                streamId,
                audioBuffer: arrayBuffer,
              });
            }
          };
          mediaRecorderRef.current = newRecorder;
        }
      }
    } catch (err) {
      console.error('[PTT] Stop error:', err);
    }
  };

  // Sadece waveform çizimi (AudioContext zaten startBroadcast'te oluşturuldu)
  const startWaveformDraw = () => {
    console.log('[Waveform] startWaveformDraw called');
    console.log('[Waveform] Canvas ref:', !!waveformCanvasRef.current);
    console.log('[Waveform] Analyser ref:', !!analyserRef.current);

    if (!waveformCanvasRef.current || !analyserRef.current) {
      console.warn('[Waveform] Missing canvas or analyser ref');
      return;
    }

    const analyser = analyserRef.current;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[Waveform] Could not get 2D context');
      return;
    }

    let frameCount = 0;
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.floor(width * ratio);
      const nextHeight = Math.floor(height * ratio);
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Debug: Her 60 frame'de bir ses seviyesini logla
      frameCount++;
      if (frameCount % 60 === 0) {
        const maxVal = Math.max(...dataArray);
        const minVal = Math.min(...dataArray);
        console.log(`[Waveform] Frame ${frameCount}, Audio range: ${minVal}-${maxVal} (128 = silence)`);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(12, 19, 32, 0.6)';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(94, 129, 255, 0.95)');
      gradient.addColorStop(0.5, 'rgba(109, 200, 255, 0.95)');
      gradient.addColorStop(1, 'rgba(94, 129, 255, 0.95)');

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.shadowColor = 'rgba(94, 129, 255, 0.45)';
      ctx.shadowBlur = 12;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i += 1) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    if (!rafRef.current) {
      console.log('[Waveform] Starting animation loop');
      draw();
    }
  };

  // Eski fonksiyon - artık kullanılmıyor, geriye dönük uyumluluk için boş bırakıldı
  const startWaveform = (_mediaStream: MediaStream) => {
    // Bu fonksiyon artık kullanılmıyor
    // Waveform çizimi startBroadcast içinde yapılıyor
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={1}>
        Canlı Yayın
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Ses yayını başlatın ve dinleyicilerinize ulaşın
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sol: Yayın Kontrolü */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <IconBroadcast size={24} />
                <Typography variant="h6">Yayın Kontrolü</Typography>
              </Stack>

              {/* Durum Badge */}
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Durum:
                </Typography>
                {status === 'idle' && <Chip label="Hazır" color="default" />}
                {status === 'preparing' && (
                  <Chip label="Hazırlanıyor..." color="info" />
                )}
                {status === 'live' && (
                  <Chip
                    label="🔴 CANLI"
                    color="error"
                    sx={{ animation: 'pulse 2s infinite' }}
                  />
                )}
                {status === 'paused' && (
                  <Chip label="⏸️ Duraklatıldı" color="warning" />
                )}
                {status === 'ended' && (
                  <Chip label="Sona Erdi" color="default" />
                )}
              </Box>

              {/* Mikrofon İzni */}
              {micPermission === false && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verin.
                </Alert>
              )}

              {/* Yayın Bilgileri (Başlamadan önce) */}
              {status === 'idle' && (
                <Stack spacing={2} mb={3}>
                  <TextField
                    label="Yayın Başlığı *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bugünkü konumuz..."
                    fullWidth
                    inputProps={{ maxLength: 100 }}
                  />
                  <TextField
                    select
                    label="Kategori *"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    fullWidth
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Açıklama"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Yayın hakkında kısa bilgi..."
                    fullWidth
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 500 }}
                  />

                  {/* Kayıt Modu Seçimi */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Kayıt Modu:
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label="Sürekli Kayıt"
                        color={recordingMode === 'continuous' ? 'primary' : 'default'}
                        onClick={() => setRecordingMode('continuous')}
                        variant={recordingMode === 'continuous' ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label="Bas Konuş"
                        color={recordingMode === 'ptt' ? 'primary' : 'default'}
                        onClick={() => setRecordingMode('ptt')}
                        variant={recordingMode === 'ptt' ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" mt={1}>
                      {recordingMode === 'continuous'
                        ? 'Mikrofon sürekli açık kalır, tüm sesler kaydedilir.'
                        : 'Butona basılı tutarak konuşun, bırakınca ses kesilir.'}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Maksimum süre 45 dakika. Süre dolunca yayın otomatik kapanır.
                  </Typography>
                </Stack>
              )}

              {/* Süre (Yayındayken) */}
              {(status === 'live' || status === 'paused') && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 3, textAlign: 'center' }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <IconClock size={24} />
                    <Typography variant="h4" fontFamily="monospace">
                      {formatDuration(duration)}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {(status === 'live' || status === 'paused') && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box
                    component="canvas"
                    ref={waveformCanvasRef}
                    sx={{ width: '100%', height: 120, display: 'block' }}
                  />
                </Paper>
              )}

              {/* Bas Konuş Butonu (sadece PTT modunda ve yayın canlıyken) */}
              {status === 'live' && recordingMode === 'ptt' && (
                <Box mb={3}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onMouseDown={startPTT}
                    onMouseUp={stopPTT}
                    onMouseLeave={stopPTT}
                    onTouchStart={startPTT}
                    onTouchEnd={stopPTT}
                    sx={{
                      py: 4,
                      fontSize: '1.25rem',
                      backgroundColor: isPTTActive ? 'error.main' : 'primary.main',
                      '&:hover': {
                        backgroundColor: isPTTActive ? 'error.dark' : 'primary.dark',
                      },
                      transition: 'all 0.2s ease',
                      transform: isPTTActive ? 'scale(0.98)' : 'scale(1)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {isPTTActive ? (
                        <>
                          <IconMicrophone size={32} />
                          <span>KONUŞUYOR...</span>
                        </>
                      ) : (
                        <>
                          <IconMicrophoneOff size={32} />
                          <span>BASILI TUTARAK KONUŞ</span>
                        </>
                      )}
                    </Stack>
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
                    {isPTTActive ? '🔴 Ses kaydediliyor...' : 'Konuşmak için butona basılı tutun'}
                  </Typography>
                </Box>
              )}

              {/* Kontrol Butonları */}
              <Stack direction="row" spacing={2}>
                {status === 'idle' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={startBroadcast}
                    disabled={loading || !title.trim() || !categoryId}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconMicrophone />}
                    fullWidth
                  >
                    {loading ? 'Başlatılıyor...' : 'Yayını Başlat'}
                  </Button>
                )}

                {status === 'live' && (
                  <>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="large"
                      onClick={pauseBroadcast}
                      startIcon={<IconPlayerPause />}
                      sx={{ flex: 1 }}
                    >
                      Duraklat
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      onClick={stopBroadcast}
                      startIcon={<IconPlayerStop />}
                      sx={{ flex: 1 }}
                    >
                      Bitir
                    </Button>
                  </>
                )}

                {status === 'paused' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={resumeBroadcast}
                      startIcon={<IconPlayerPlay />}
                      sx={{ flex: 1 }}
                    >
                      Devam Et
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      onClick={stopBroadcast}
                      startIcon={<IconPlayerStop />}
                      sx={{ flex: 1 }}
                    >
                      Bitir
                    </Button>
                  </>
                )}

                {status === 'ended' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={resetBroadcast}
                    startIcon={<IconRefresh />}
                    fullWidth
                  >
                    Yeni Yayın
                  </Button>
                )}
              </Stack>

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ: İstatistikler */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <IconUsers size={24} />
                <Typography variant="h6">Dinleyici İstatistikleri</Typography>
              </Stack>

              {stats ? (
                <Stack spacing={3}>
                  {/* Toplam Dinleyici */}
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}
                  >
                    <Typography variant="h2" fontWeight={700} color="primary">
                      {stats.viewerCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Dinleyici
                    </Typography>
                  </Paper>

                  <Divider />

                  {/* Oda Listesi */}
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <IconDoor size={20} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Odalar ({stats.roomCount})
                      </Typography>
                    </Stack>

                    <Grid container spacing={1}>
                      {stats.rooms.map((room) => (
                        <Grid item xs={6} key={room.roomNumber}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body2">
                              Oda {room.roomNumber}
                            </Typography>
                            <Chip
                              label={`${room.currentCount}/${room.capacity}`}
                              size="small"
                              color={
                                room.currentCount >= room.capacity
                                  ? 'error'
                                  : room.currentCount > room.capacity * 0.7
                                    ? 'warning'
                                    : 'success'
                              }
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              ) : (
                <Box textAlign="center" py={6} color="text.secondary">
                  <IconUsers size={48} style={{ opacity: 0.3 }} />
                  <Typography variant="body2" mt={2}>
                    Yayın başladığında istatistikler burada görünecek
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveBroadcastPage;
