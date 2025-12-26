import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Grid,
  Chip,
  Skeleton,
  Paper,
  Divider,
} from '@mui/material';
import {
  IconArrowLeft,
  IconMicrophone,
  IconPlayerPlay,
  IconClock,
} from '@tabler/icons-react';
import { episodeService, Episode } from '../../api/services/episode.service';
import { podcastService, Podcast } from '../../api/services/podcast.service';

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getYoutubeEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith('/shorts/')) {
        return `https://www.youtube.com/embed/${parsed.pathname.replace('/shorts/', '')}`;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const DEFAULT_THUMBNAIL = '/images/default-thumbnail.svg';

const EditEpisodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Episode ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const episodeData = await episodeService.get(id);
        setEpisode(episodeData);

        if (episodeData.podcastId) {
          const podcastData = await podcastService.get(episodeData.podcastId);
          setPodcast(podcastData);
        }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to load episode';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!episode?.podcastId) return;
      try {
        setRelatedLoading(true);
        const items = await episodeService.getByPodcast(episode.podcastId);
        setRelatedEpisodes(items.filter((item) => item.id !== episode.id));
      } catch {
        setRelatedEpisodes([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [episode?.id, episode?.podcastId]);

  const youtubeEmbedUrl = useMemo(() => getYoutubeEmbedUrl(episode?.youtubeUrl), [episode?.youtubeUrl]);
  const hasVideo = Boolean(episode?.videoUrl || episode?.youtubeUrl || episode?.externalVideoUrl);
  const hasAudio = Boolean(episode?.audioUrl);
  const showVideo = hasVideo;
  const showAudio = !showVideo && hasAudio;
  const mediaLabel = showVideo ? 'Video' : 'Ses';
  const heroImage = episode?.thumbnailUrl || podcast?.coverImageUrl || DEFAULT_THUMBNAIL;

  if (loading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Skeleton variant="rectangular" width={80} height={36} />
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={150} height={24} />
          </Box>
        </Stack>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  <Skeleton variant="rectangular" height={260} />
                  <Skeleton variant="rectangular" height={120} />
                  <Skeleton variant="rectangular" height={80} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={260} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error && !episode) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/episodes')}
            color="inherit"
          >
            Back
          </Button>
        </Stack>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button
          startIcon={<IconArrowLeft size={20} />}
          onClick={() => navigate('/episodes')}
          color="inherit"
        >
          Back
        </Button>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h4" fontWeight={600}>
              Episode Detail
            </Typography>
            {episode && (
              <Chip
                label={episode.isPublished ? 'Published' : 'Draft'}
                color={episode.isPublished ? 'success' : 'default'}
                size="small"
              />
            )}
            <Chip label={mediaLabel} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {episode?.title}
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'text.primary',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }} gutterBottom>
                      Oynatıcı
                    </Typography>
                    {showVideo ? (
                      youtubeEmbedUrl ? (
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '56.25%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'common.black',
                          }}
                        >
                          <Box
                            component="iframe"
                            src={youtubeEmbedUrl}
                            title={episode?.title || 'Episode video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 0,
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          component="video"
                          controls
                          poster={episode?.thumbnailUrl || undefined}
                          src={episode?.videoUrl || episode?.externalVideoUrl || undefined}
                          sx={{ width: '100%', borderRadius: 2, bgcolor: 'common.black' }}
                        />
                      )
                    ) : showAudio ? (
                      <Box>
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <Box
                            component="img"
                            src={heroImage}
                            alt={episode?.title || 'Episode'}
                            sx={{ width: '100%', height: 280, objectFit: 'cover' }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.35)',
                            }}
                          >
                            <Box
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconPlayerPlay size={32} color="#fff" />
                            </Box>
                          </Box>
                        </Box>
                        <Box mt={2}>
                          <Box
                            component="audio"
                            controls
                            src={episode?.audioUrl || undefined}
                            sx={{ width: '100%' }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Medya dosyasi bulunamadi.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {episode?.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {episode?.description || 'Aciklama yok.'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip
                    icon={<IconClock size={16} />}
                    label={episode?.duration ? formatDuration(episode.duration) : '-'}
                    size="small"
                  />
                  <Chip label={`Episode #${episode?.episodeNumber ?? '-'}`} size="small" />
                  <Chip label={`Season #${episode?.seasonNumber ?? '-'}`} size="small" />
                  {podcast?.mediaType && (
                    <Chip label={podcast.mediaType} size="small" variant="outlined" />
                  )}
                </Stack>

                {episode?.tags && episode.tags.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {episode.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'text.primary',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }} gutterBottom>
                    Podcast
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {podcast?.coverImageUrl ? (
                      <Box
                        component="img"
                        src={podcast.coverImageUrl}
                        alt={podcast.title}
                        sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconMicrophone size={24} color="#5D87FF" />
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {podcast?.title || '-'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {podcast?.mediaType || 'MEDIA'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'text.primary',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }} gutterBottom>
                    Episode Info
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Created</Typography>
                      <Typography variant="body2">{episode ? new Date(episode.createdAt).toLocaleDateString() : '-'}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Updated</Typography>
                      <Typography variant="body2">{episode ? new Date(episode.updatedAt).toLocaleDateString() : '-'}</Typography>
                    </Stack>
                    {episode?.publishedAt && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Published</Typography>
                        <Typography variant="body2">{new Date(episode.publishedAt).toLocaleDateString()}</Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box mt={4}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <IconPlayerPlay size={18} />
          <Typography variant="h6" fontWeight={600}>
            Ilgili Bolumler
          </Typography>
        </Stack>
        <Card
          sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'text.primary',
          }}
        >
          <CardContent>
            {relatedLoading ? (
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={48} />
                <Skeleton variant="rectangular" height={48} />
              </Stack>
            ) : relatedEpisodes.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Bu podcast icin baska bolum yok.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {relatedEpisodes.map((item) => {
                  const thumb = item.thumbnailUrl || podcast?.coverImageUrl || DEFAULT_THUMBNAIL;
                  const duration = item.duration ? formatDuration(item.duration) : '-';
                  return (
                    <Grid key={item.id} item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          cursor: 'pointer',
                          alignItems: 'center',
                        }}
                        onClick={() => navigate(`/episodes/${item.id}`)}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            width: 160,
                            height: 90,
                            borderRadius: 2,
                            overflow: 'hidden',
                            flexShrink: 0,
                            bgcolor: 'grey.200',
                          }}
                        >
                          <Box
                            component="img"
                            src={thumb}
                            alt={item.title}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: 12,
                            }}
                          >
                            {duration}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Episode #{item.episodeNumber ?? '-'}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                            <Chip
                              label={item.isPublished ? 'Published' : 'Draft'}
                              size="small"
                              color={item.isPublished ? 'success' : 'default'}
                            />
                          </Stack>
                        </Box>
                      </Box>
                      <Divider sx={{ mt: 2, display: { xs: 'block', sm: 'none' } }} />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EditEpisodePage;
