import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Slider,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconBroadcast,
  IconUsers,
  IconArrowLeft,
  IconRefresh,
} from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Hls from 'hls.js';
import { apiClient } from '../../api/client';

interface StreamHost {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  hlsUrl: string | null;
  recordingUrl: string | null;
  duration: number | null;
  endedAt: string | null;
  host: StreamHost;
  category?: {
    id: string;
    name: string;
  } | null;
  viewerCount: number;
  roomCount: number;
}

const LivePlayerPage: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();

  // State
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [roomNumber, setRoomNumber] = useState<number | null>(null);
  const [roomCapacity, setRoomCapacity] = useState<number | null>(null);
  const [roomCurrentCount, setRoomCurrentCount] = useState<number | null>(null);
  const [switchingRoom, setSwitchingRoom] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVOD, setIsVOD] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Real-time audio streaming refs
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRealtimeRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  // Yayın bilgilerini al ve bağlan
  useEffect(() => {
    if (!streamId) return;

    const init = async () => {
      try {
        const response = await apiClient.get(`/live/streams/${streamId}`);
        setStream(response.data);
        setViewerCount(response.data.viewerCount);

        // Geçmiş yayın (VOD) kontrolü
        if (response.data.status === 'ENDED') {
          setIsVOD(true);
          if (response.data.recordingUrl) {
            // VOD için direkt audio src kullan
            if (audioRef.current) {
              audioRef.current.src = response.data.recordingUrl;
              audioRef.current.load();
            }
          } else {
            setError('Bu yayının kaydı bulunamadı');
          }
          setLoading(false);
          return;
        }

        if (response.data.status !== 'LIVE') {
          setError('Bu yayın şu anda canlı değil');
          setLoading(false);
          return;
        }

        // Socket bağlan (sadece canlı yayınlar için)
        connectSocket(response.data);

        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Yayın yüklenemedi';
        setError(message);
        setLoading(false);
      }
    };

    init();

    return () => {
      socketRef.current?.emit('leave-stream');
      socketRef.current?.disconnect();
      hlsRef.current?.destroy();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [streamId]);

  // Socket.IO bağlantısı
  const connectSocket = (streamData: StreamData) => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    // VITE_API_BASE_URL = http://localhost:3300/api -> http://localhost:3300
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
    const baseUrl = apiBaseUrl.replace('/api', '');

    console.log('[LivePlayer] Connecting to socket:', `${baseUrl}/live`);
    socketRef.current = io(`${baseUrl}/live`, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[LivePlayer] Socket connection error:', error.message);
    });

    socketRef.current.on('connect', () => {
      console.log('[LivePlayer] Socket connected, joining stream:', streamData.id);
      // Yayına katıl
      socketRef.current?.emit(
        'join-stream',
        {
          streamId: streamData.id,
          userId,
          deviceType: 'web',
        },
        (response: { success: boolean; roomNumber?: number; viewerCount?: number; roomCapacity?: number; roomCurrentCount?: number; error?: string }) => {
          if (response.success) {
            setRoomNumber(response.roomNumber || null);
            setViewerCount(response.viewerCount || 0);
            setRoomCapacity(response.roomCapacity || null);
            setRoomCurrentCount(response.roomCurrentCount || null);
            setSwitchingRoom(false);

            // HLS başlat
            if (streamData.hlsUrl) {
              initHls(streamData.hlsUrl);
            }
          } else {
            setError(response.error || 'Stream bağlantısı kurulamadı');
            setSwitchingRoom(false);
          }
        },
      );
    });

    socketRef.current.on('viewer-count', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    socketRef.current.on(
      'stream-status-changed',
      (data: { status: string }) => {
        if (data.status === 'ENDED' || data.status === 'CANCELLED') {
          setError('Yayın sona erdi');
          setIsPlaying(false);
        } else if (data.status === 'PAUSED') {
          setIsPlaying(false);
        } else if (data.status === 'LIVE') {
          setIsPlaying(true);
        }
      },
    );

    // 🔴 GERÇEK ZAMANLI SES AKIŞI: Raw PCM Audio via Web Audio API
    // PCM Int16 data olarak geliyor, Float32'ye çevir ve AudioBuffer ile çal
    let audioChunkCount = 0;
    let realtimeAudioCtx: AudioContext | null = null;
    let nextPlayTime = 0;
    let isFirstChunk = true;

    socketRef.current.on('audio-stream', async (data: { streamId: string; pcmData: number[]; sampleRate: number; timestamp: number }) => {
      if (!data.pcmData || data.pcmData.length === 0) return;

      audioChunkCount++;
      if (audioChunkCount % 20 === 0) {
        console.log(`[LivePlayer] Received ${audioChunkCount} PCM chunks (${data.pcmData.length} samples, ${data.sampleRate}Hz)`);
      }

      try {
        // AudioContext yoksa oluştur
        if (!realtimeAudioCtx) {
          realtimeAudioCtx = new AudioContext({ sampleRate: data.sampleRate || 44100 });
          console.log('[LivePlayer] Real-time AudioContext created:', realtimeAudioCtx.sampleRate, 'Hz');
        }

        // Resume if suspended (user interaction gerekebilir)
        if (realtimeAudioCtx.state === 'suspended') {
          await realtimeAudioCtx.resume();
        }

        // Int16 -> Float32 dönüşümü
        const float32Data = new Float32Array(data.pcmData.length);
        for (let i = 0; i < data.pcmData.length; i++) {
          float32Data[i] = data.pcmData[i] / 32768.0;
        }

        // AudioBuffer oluştur
        const audioBuffer = realtimeAudioCtx.createBuffer(1, float32Data.length, data.sampleRate || 44100);
        audioBuffer.getChannelData(0).set(float32Data);

        // AudioBufferSourceNode ile çal
        const sourceNode = realtimeAudioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // Volume kontrolü için gain node
        const gainNode = realtimeAudioCtx.createGain();
        gainNode.gain.value = (audioRef.current?.volume ?? 0.8);

        sourceNode.connect(gainNode);
        gainNode.connect(realtimeAudioCtx.destination);

        // Zamanlama: İlk chunk hemen çal, sonrakiler sıralı
        const currentTime = realtimeAudioCtx.currentTime;
        if (isFirstChunk || nextPlayTime < currentTime) {
          nextPlayTime = currentTime + 0.05; // 50ms buffer
          isFirstChunk = false;
        }

        sourceNode.start(nextPlayTime);
        nextPlayTime += audioBuffer.duration;

        if (!isPlaying) {
          setIsPlaying(true);
          console.log('[LivePlayer] Real-time PCM audio streaming started');
        }
      } catch (error) {
        console.error('[LivePlayer] PCM audio stream error:', error);
      }
    });

    // Cleanup için AudioContext ref'ini sakla
    (socketRef.current as any).realtimeAudioCtx = realtimeAudioCtx;
  };

  // Gerçek zamanlı waveform animasyonu
  const startRealtimeWaveform = () => {
    if (!waveformCanvasRef.current || !analyserRef.current) return;

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current) return;

      const { width, height } = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.floor(width * ratio);
      const nextHeight = Math.floor(height * ratio);
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(94, 129, 255, 0.9)';
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

      rafRef.current = requestAnimationFrame(draw);
    };

    if (!rafRef.current) {
      draw();
    }
  };

  const changeRoom = () => {
    if (!stream) return;
    setSwitchingRoom(true);
    setError(null);

    socketRef.current?.emit('leave-stream');
    socketRef.current?.disconnect();
    socketRef.current = null;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    connectSocket(stream);
  };

  // HLS Player başlat
  const initHls = (hlsUrl: string) => {
    if (!audioRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(audioRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audioRef.current?.play();
        setIsPlaying(true);
        startWaveform();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Yayın yüklenemedi');
        }
      });

      hlsRef.current = hls;
    } else if (
      audioRef.current.canPlayType('application/vnd.apple.mpegurl')
    ) {
      // Safari native HLS
      audioRef.current.src = hlsUrl;
      audioRef.current.play();
      setIsPlaying(true);
      startWaveform();
    }
  };

  const startWaveform = () => {
    if (!audioRef.current || !waveformCanvasRef.current) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
    }

    if (!analyserRef.current) {
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !analyserRef.current) return;

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.floor(width * ratio);
      const nextHeight = Math.floor(height * ratio);
      if (canvas.width !== nextWidth) canvas.width = nextWidth;
      if (canvas.height !== nextHeight) canvas.height = nextHeight;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const bufferLength = analyserRef.current!.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(94, 129, 255, 0.9)';
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

      rafRef.current = requestAnimationFrame(draw);
    };

    if (!rafRef.current) {
      draw();
    }
  };

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    } else {
      audioRef.current.play();
      if (!isVOD) {
        startWaveform();
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Time update handler for VOD
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Duration loaded handler for VOD
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Seek handler for VOD
  const handleSeek = (_: Event, value: number | number[]) => {
    const newTime = value as number;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Volume
  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const newVolume = value as number;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume / 100;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box maxWidth={600} mx="auto" py={4}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Box>
    );
  }

  // Error state
  if (error) {
    const isNoRecording = error === 'Bu yayının kaydı bulunamadı';
    return (
      <Box maxWidth={600} mx="auto" py={4} textAlign="center">
        <IconBroadcast size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <Typography variant="h5" mb={1}>
          {isNoRecording ? stream?.title || 'Yayın' : error}
        </Typography>
        {isNoRecording && (
          <Typography variant="body1" color="text.secondary" mb={3}>
            Bu yayın kaydedilmemiş. Kayıt özelliği açık olan yayınlar bittiğinde otomatik olarak dinlenebilir hale gelir.
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<IconArrowLeft />}
          onClick={() => navigate('/live')}
        >
          Yayınlara Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={700} mx="auto">
      <Button
        startIcon={<IconArrowLeft />}
        onClick={() => navigate('/live')}
        sx={{ mb: 2 }}
      >
        Geri
      </Button>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Canlı / VOD Badge */}
      <Box textAlign="center" mb={3}>
        <Chip
          label={isVOD ? '📼 KAYIT' : '🔴 CANLI YAYIN'}
          color={isVOD ? 'default' : 'error'}
          sx={{ fontSize: '1rem', px: 2, py: 2.5 }}
        />
      </Box>

      {/* Player Card */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Hoca Bilgisi */}
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <Avatar
              src={stream?.host?.avatarUrl || ''}
              sx={{ width: 64, height: 64 }}
            >
              {stream?.host?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {stream?.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stream?.host?.name}
              </Typography>
            </Box>
          </Stack>

          {/* Açıklama */}
          {stream?.description && (
            <Typography variant="body2" color="text.secondary" mb={4}>
              {stream.description}
            </Typography>
          )}

          {isVOD ? (
            /* VOD Seek Bar */
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
              <Slider
                value={currentTime}
                max={duration || 100}
                onChange={handleSeek}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(duration)}
                </Typography>
              </Stack>
            </Paper>
          ) : (
            /* Live Waveform */
            <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
              <Box
                component="canvas"
                ref={waveformCanvasRef}
                sx={{ width: '100%', height: 120, display: 'block' }}
              />
            </Paper>
          )}

          {/* Kontroller */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={3}
          >
            {/* Play/Pause */}
            <IconButton
              size="large"
              onClick={togglePlay}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {isPlaying ? (
                <IconPlayerPause size={32} />
              ) : (
                <IconPlayerPlay size={32} />
              )}
            </IconButton>

            {/* Volume */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 180 }}>
              <IconButton onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <IconVolumeOff size={24} />
                ) : (
                  <IconVolume size={24} />
                )}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                max={100}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Stack
        direction="row"
        justifyContent="center"
        spacing={4}
        mt={3}
        color="text.secondary"
      >
        {isVOD ? (
          /* VOD bilgileri */
          <>
            {stream?.category?.name && (
              <Chip label={stream.category.name} size="small" variant="outlined" />
            )}
            {stream?.endedAt && (
              <Typography variant="body2">
                {new Date(stream.endedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
            )}
          </>
        ) : (
          /* Canlı yayın bilgileri */
          <>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconUsers size={20} />
              <Typography>{viewerCount} dinleyici</Typography>
            </Stack>
            {roomNumber && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography>Oda {roomNumber}</Typography>
                {roomCapacity !== null && roomCurrentCount !== null && (
                  <Chip size="small" label={`${roomCurrentCount}/${roomCapacity}`} />
                )}
                <IconButton
                  size="small"
                  onClick={changeRoom}
                  disabled={switchingRoom}
                  aria-label="Oda değiştir"
                >
                  <IconRefresh size={16} />
                </IconButton>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default LivePlayerPage;
