import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../api/client';
import { podcastService, Podcast } from '../../api/services/podcast.service';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

const BroadcastPage: React.FC = () => {
  const user = useSelector(selectUser);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [podcastId, setPodcastId] = useState('');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await podcastService.list({ limit: 100 });
        setPodcasts(response.data || []);
      } catch {
        setPodcasts([]);
      }
    };
    fetchPodcasts();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!title.trim() || !body.trim()) {
      setError('Başlık ve mesaj zorunludur.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/push/send', {
        title: title.trim(),
        body: body.trim(),
        targetType: 'USER_IDS',
        data: podcastId ? { podcastId } : undefined,
      });
      setSuccess('Mesaj gönderildi.');
      setTitle('');
      setBody('');
      setPodcastId('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mesaj gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack spacing={1} mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Toplu Mesaj
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Takipçilerinize toplu bildirim gönderin.
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <TextField
              label="Başlık"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              inputProps={{ maxLength: 100 }}
              fullWidth
            />
            <TextField
              label="Mesaj"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              inputProps={{ maxLength: 500 }}
              fullWidth
              multiline
              minRows={4}
            />
            <TextField
              select
              label="Podcast (Opsiyonel)"
              value={podcastId}
              onChange={(event) => setPodcastId(event.target.value)}
              fullWidth
              helperText="Seçmezseniz tüm podcast takipçilerine gider."
            >
              <MenuItem value="">Tümü</MenuItem>
              {podcasts.map((podcast) => (
                <MenuItem key={podcast.id} value={podcast.id}>
                  {podcast.title}
                </MenuItem>
              ))}
            </TextField>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Gönderen: {user?.name || user?.email || 'Hoca'}
              </Typography>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Gönder'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BroadcastPage;
