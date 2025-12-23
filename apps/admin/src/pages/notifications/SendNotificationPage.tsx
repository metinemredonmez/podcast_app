import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Divider,
  Paper,
  Autocomplete,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { logger } from '../../utils/logger';
import {
  IconArrowLeft,
  IconSend,
  IconEye,
  IconDeviceFloppy,
  IconUsers,
  IconClock,
} from '@tabler/icons-react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  notificationService,
  NotificationType,
  RecipientType,
  SendNotificationRequest,
  NotificationTemplate,
} from '../../api/services/notification.service';

const SendNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('push');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [tenantId, setTenantId] = useState('');
  const [role, setRole] = useState('');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [podcastId, setPodcastId] = useState('');
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(new Date());
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientCountLoading, setRecipientCountLoading] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);

  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await notificationService.getTemplates();
      setTemplates(data);
    } catch (err) {
      logger.error('Failed to load templates:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipientCount();
    }, 500);
    return () => clearTimeout(timer);
  }, [recipientType, tenantId, role, userIds, podcastId]);

  const fetchRecipientCount = async () => {
    if (!recipientType) return;
    setRecipientCountLoading(true);
    try {
      const count = await notificationService.getRecipientCount({
        recipientType,
        metadata: {
          tenantId: tenantId || undefined,
          role: role || undefined,
          userIds: userIds.length > 0 ? userIds : undefined,
          podcastId: podcastId || undefined,
        },
      });
      setRecipientCount(count);
    } catch (err) {
      logger.error('Failed to get recipient count:', err);
      setRecipientCount(null);
    } finally {
      setRecipientCountLoading(false);
    }
  };

  const handleLoadTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setType(template.type);
    setSelectedTemplate(template);
    setTemplateDialogOpen(false);
  };

  const handleSend = async () => {
    if (!title || !body) {
      setError('Title and body are required');
      return;
    }

    setLoading(true);
    setError(null);

    const data: SendNotificationRequest = {
      title,
      body,
      type,
      recipientType,
      metadata: {
        tenantId: tenantId || undefined,
        role: role || undefined,
        userIds: userIds.length > 0 ? userIds : undefined,
        podcastId: podcastId || undefined,
      },
      scheduledAt: !scheduleNow && scheduledAt ? scheduledAt.toISOString() : undefined,
      saveAsTemplate,
      templateName: saveAsTemplate ? templateName : undefined,
    };

    try {
      await notificationService.sendNotification(data);
      setSuccess(true);
      setTimeout(() => navigate('/notifications'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Page Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/notifications')}>
            Back
          </Button>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={600}>
              Send Notification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and send notifications to users
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<IconDeviceFloppy size={18} />} onClick={() => setTemplateDialogOpen(true)}>
            Load Template
          </Button>
          <Button variant="outlined" startIcon={<IconEye size={18} />} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button variant="contained" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />} onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : scheduleNow ? 'Send Now' : 'Schedule'}
          </Button>
        </Stack>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Notification sent successfully! Redirecting...
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Main Form */}
          <Box flex={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Notification Content
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    required
                  />

                  <FormControl fullWidth>
                    <InputLabel>Notification Type</InputLabel>
                    <Select value={type} onChange={(e) => setType(e.target.value as NotificationType)} label="Notification Type">
                      <MenuItem value="push">Push Notification</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="in-app">In-App Notification</MenuItem>
                      <MenuItem value="all">All Channels</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider />

                  <Typography variant="h6" fontWeight={600}>
                    Recipients
                  </Typography>

                  <FormControl component="fieldset">
                    <RadioGroup value={recipientType} onChange={(e) => setRecipientType(e.target.value as RecipientType)}>
                      <FormControlLabel value="all" control={<Radio />} label="All Users" />
                      <FormControlLabel value="tenant" control={<Radio />} label="Specific Tenant" />
                      <FormControlLabel value="role" control={<Radio />} label="By Role" />
                      <FormControlLabel value="custom" control={<Radio />} label="Custom User List" />
                      <FormControlLabel value="subscribers" control={<Radio />} label="Podcast Subscribers" />
                    </RadioGroup>
                  </FormControl>

                  {recipientType === 'tenant' && (
                    <TextField
                      label="Tenant ID"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      fullWidth
                      placeholder="Enter tenant ID"
                    />
                  )}

                  {recipientType === 'role' && (
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="editor">Editor</MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                        <MenuItem value="owner">Owner</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {recipientType === 'custom' && (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={userIds}
                      onChange={(_, value) => setUserIds(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="User IDs" placeholder="Enter user IDs" />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip label={option} size="small" {...getTagProps({ index })} />
                        ))
                      }
                    />
                  )}

                  {recipientType === 'subscribers' && (
                    <TextField
                      label="Podcast ID"
                      value={podcastId}
                      onChange={(e) => setPodcastId(e.target.value)}
                      fullWidth
                      placeholder="Enter podcast ID"
                    />
                  )}

                  <Divider />

                  <Typography variant="h6" fontWeight={600}>
                    Scheduling
                  </Typography>

                  <FormControlLabel
                    control={<Switch checked={scheduleNow} onChange={(e) => setScheduleNow(e.target.checked)} />}
                    label="Send immediately"
                  />

                  {!scheduleNow && (
                    <DateTimePicker
                      label="Schedule for"
                      value={scheduledAt}
                      onChange={(newValue) => setScheduledAt(newValue)}
                      minDateTime={new Date()}
                    />
                  )}

                  <Divider />

                  <FormControlLabel
                    control={<Switch checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />}
                    label="Save as template"
                  />

                  {saveAsTemplate && (
                    <TextField
                      label="Template Name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      fullWidth
                      placeholder="e.g., Welcome Message"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', lg: 320 } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Summary
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Type
                    </Typography>
                    <Chip label={type.toUpperCase()} color="primary" size="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Recipients
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconUsers size={16} />
                      {recipientCountLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Typography variant="body2" fontWeight={500}>
                          {recipientCount !== null ? `${recipientCount.toLocaleString()} users` : 'Unknown'}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Schedule
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconClock size={16} />
                      <Typography variant="body2">
                        {scheduleNow ? 'Immediately' : scheduledAt ? scheduledAt.toLocaleString() : 'Not scheduled'}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 2 }}>
              Users will receive this notification based on their preferences. Make sure the content is clear and actionable.
            </Alert>
          </Box>
        </Stack>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Preview Notification</DialogTitle>
          <DialogContent>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Stack spacing={1}>
                <Chip label={type.toUpperCase()} color="primary" size="small" sx={{ width: 'fit-content' }} />
                <Typography variant="h6" fontWeight={600}>
                  {title || 'Notification Title'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {body || 'Notification body will appear here...'}
                </Typography>
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Templates Dialog */}
        <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Load Template</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {templates.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No templates available
                </Typography>
              ) : (
                templates.map((template) => (
                  <Paper
                    key={template.id}
                    variant="outlined"
                    sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.title}
                        </Typography>
                      </Box>
                      <Chip label={template.type} size="small" />
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SendNotificationPage;
