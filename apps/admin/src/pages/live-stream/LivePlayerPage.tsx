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
  host: StreamHost;
  viewerCount: number;
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

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Yayın bilgilerini al ve bağlan
  useEffect(() => {
    if (!streamId) return;

    const init = async () => {
      try {
        const response = await apiClient.get(`/live/streams/${streamId}`);
        setStream(response.data);
        setViewerCount(response.data.viewerCount);

        if (response.data.status !== 'LIVE') {
          setError('Bu yayın şu anda canlı değil');
          setLoading(false);
          return;
        }

        // Socket bağlan
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
    };
  }, [streamId]);

  // Socket.IO bağlantısı
  const connectSocket = (streamData: StreamData) => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    socketRef.current = io(`${baseUrl}/live`, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      // Yayına katıl
      socketRef.current?.emit(
        'join-stream',
        {
          streamId: streamData.id,
          userId,
          deviceType: 'web',
        },
        (response: { success: boolean; roomNumber?: number; viewerCount?: number; error?: string }) => {
          if (response.success) {
            setRoomNumber(response.roomNumber || null);
            setViewerCount(response.viewerCount || 0);

            // HLS başlat
            if (streamData.hlsUrl) {
              initHls(streamData.hlsUrl);
            }
          } else {
            setError(response.error || 'Stream bağlantısı kurulamadı');
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
    }
  };

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
    return (
      <Box maxWidth={600} mx="auto" py={4} textAlign="center">
        <IconBroadcast size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <Typography variant="h5" mb={2}>
          {error}
        </Typography>
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
      <audio ref={audioRef} />

      {/* Canlı Badge */}
      <Box textAlign="center" mb={3}>
        <Chip
          label="🔴 CANLI YAYIN"
          color="error"
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

          {/* Ses Dalgası Animasyonu */}
          <Paper
            variant="outlined"
            sx={{
              py: 6,
              mb: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0.5,
              overflow: 'hidden',
            }}
          >
            {[...Array(30)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 4,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  transition: 'height 0.15s ease',
                  height: isPlaying ? `${Math.random() * 60 + 20}%` : '20%',
                  animation: isPlaying ? 'none' : 'none',
                }}
              />
            ))}
          </Paper>

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
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconUsers size={20} />
          <Typography>{viewerCount} dinleyici</Typography>
        </Stack>
        {roomNumber && (
          <Typography>Oda {roomNumber}</Typography>
        )}
      </Stack>
    </Box>
  );
};

export default LivePlayerPage;
