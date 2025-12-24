import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  IconCheck,
  IconX,
  IconEye,
  IconRefresh,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';

interface HocaApplication {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  bio: string | null;
  expertise: string | null;
  organization: string | null;
  position: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
}

const HocaApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<HocaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<HocaApplication | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/auth/hoca-application/admin/pending', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setApplications(response.data.applications || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Başvurular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, rowsPerPage]);

  const handleView = (application: HocaApplication) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const handleApproveClick = (application: HocaApplication) => {
    setSelectedApplication(application);
    setApproveNotes('');
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (application: HocaApplication) => {
    setSelectedApplication(application);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/auth/hoca-application/admin/${selectedApplication.id}/approve`, {
        notes: approveNotes || undefined,
      });
      setApproveDialogOpen(false);
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Onaylama işlemi başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/auth/hoca-application/admin/${selectedApplication.id}/reject`, {
        reason: rejectReason,
      });
      setRejectDialogOpen(false);
      fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reddetme işlemi başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('90') && phone.length === 12) {
      return `+90 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Hoca Başvuruları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bekleyen hoca başvurularını inceleyin ve onaylayın
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<IconRefresh size={18} />}
          onClick={fetchApplications}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ad Soyad</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Uzmanlık</TableCell>
                <TableCell>Başvuru Tarihi</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Bekleyen başvuru bulunmuyor
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{app.name}</Typography>
                    </TableCell>
                    <TableCell>{app.email || '-'}</TableCell>
                    <TableCell>{formatPhone(app.phone)}</TableCell>
                    <TableCell>{app.expertise || '-'}</TableCell>
                    <TableCell>{formatDate(app.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label="Bekliyor"
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Detayları Gör">
                        <IconButton size="small" onClick={() => handleView(app)}>
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Onayla">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveClick(app)}
                        >
                          <IconCheck size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reddet">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRejectClick(app)}
                        >
                          <IconX size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Sayfa başına:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
          }
        />
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Başvuru Detayları</DialogTitle>
        <DialogContent dividers>
          {selectedApplication && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Ad Soyad</Typography>
                <Typography>{selectedApplication.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">E-posta</Typography>
                <Typography>{selectedApplication.email || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Telefon</Typography>
                <Typography>{formatPhone(selectedApplication.phone)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Uzmanlık Alanı</Typography>
                <Typography>{selectedApplication.expertise || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Kurum</Typography>
                <Typography>{selectedApplication.organization || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pozisyon</Typography>
                <Typography>{selectedApplication.position || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Biyografi</Typography>
                <Typography>{selectedApplication.bio || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Başvuru Tarihi</Typography>
                <Typography>{formatDate(selectedApplication.createdAt)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Kapat</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setViewDialogOpen(false);
              if (selectedApplication) handleApproveClick(selectedApplication);
            }}
          >
            Onayla
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setViewDialogOpen(false);
              if (selectedApplication) handleRejectClick(selectedApplication);
            }}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Başvuruyu Onayla</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            <strong>{selectedApplication?.name}</strong> isimli kişinin hoca başvurusunu onaylamak istediğinize emin misiniz?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notlar (Opsiyonel)"
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
            placeholder="Onay ile ilgili notlarınız..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
            İptal
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Başvuruyu Reddet</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            <strong>{selectedApplication?.name}</strong> isimli kişinin hoca başvurusunu reddetmek istediğinize emin misiniz?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Red Sebebi"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Başvurunun reddedilme sebebini yazın..."
            required
            error={rejectReason.trim() === ''}
            helperText={rejectReason.trim() === '' ? 'Red sebebi zorunludur' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            İptal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Reddet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HocaApplicationsPage;
