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

type StreamStatus = 'idle' | 'preparing' | 'live' | 'paused' | 'ended';

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
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [duration, setDuration] = useState(0);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    socketRef.current = io(`${baseUrl}/live`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      logger.info('Socket connected');
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

    const hasMic = await checkMicPermission();
    if (!hasMic) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Yayın oluştur
      const createRes = await apiClient.post('/live/streams', {
        title,
        description,
      });
      const newStreamId = createRes.data.id;
      setStreamId(newStreamId);
      setStatus('preparing');

      // 2. Socket bağlan
      connectSocket();

      // Host olarak katıl
      socketRef.current?.emit(
        'host-join',
        { streamId: newStreamId },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            throw new Error(response.error);
          }
        },
      );

      // 3. Mikrofon aç
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = mediaStream;

      // 4. MediaRecorder başlat
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          const arrayBuffer = await event.data.arrayBuffer();
          socketRef.current.emit('audio-data', {
            streamId: newStreamId,
            audioBuffer: arrayBuffer,
          });
        }
      };

      // 5. Yayını başlat
      await apiClient.post(`/live/streams/${newStreamId}/start`);

      // Kayıt başlat (her 1 saniyede veri gönder)
      mediaRecorder.start(1000);

      setStatus('live');

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
    setError(null);
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
                    label="Açıklama"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Yayın hakkında kısa bilgi..."
                    fullWidth
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 500 }}
                  />
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

              {/* Kontrol Butonları */}
              <Stack direction="row" spacing={2}>
                {status === 'idle' && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={startBroadcast}
                    disabled={loading || !title.trim()}
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
