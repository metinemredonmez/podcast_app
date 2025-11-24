import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconBan,
  IconCheck,
  IconUserShield,
} from '@tabler/icons-react';
import { userService, User } from '../../api/services/user.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';
import { Checkbox } from '@mui/material';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    currentPageIds: users.map((u) => u.id),
    totalCount: total,
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.data || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, roleFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleBan = async () => {
    if (selectedUser) {
      try {
        if (selectedUser.status === 'banned') {
          await userService.unban(selectedUser.id);
        } else {
          await userService.ban(selectedUser.id);
        }
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update user status');
      }
    }
    handleMenuClose();
  };

  const handleChangeRole = async (role: string) => {
    if (selectedUser) {
      try {
        await userService.changeRole(selectedUser.id, role);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to change role');
      }
    }
    handleMenuClose();
  };

  const handleBulkAction = async (actionId: string) => {
    const ids = Array.from(bulkSelection.selectedIds);

    if (actionId === 'ban') {
      await Promise.all(ids.map((id) => userService.ban(id)));
      fetchUsers();
    } else if (actionId === 'unban') {
      await Promise.all(ids.map((id) => userService.unban(id)));
      fetchUsers();
    } else if (actionId === 'export') {
      console.log('Exporting users:', ids);
    } else if (actionId.startsWith('role-')) {
      const role = actionId.replace('role-', '');
      await Promise.all(ids.map((id) => userService.changeRole(id, role)));
      fetchUsers();
    } else if (actionId === 'notification') {
      console.log('Sending notification to users:', ids);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'creator':
        return 'primary';
      case 'user':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'banned':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage platform users and their roles
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Search & Filters */}
          <Stack direction="row" spacing={2} mb={3}>
            <TextField
              placeholder="Search users..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="creator">Creator</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={bulkSelection.selectedCount}
            totalCount={total}
            isAllPagesSelected={bulkSelection.isAllPagesSelected}
            onClearSelection={bulkSelection.clearSelection}
            onSelectAllPages={bulkSelection.toggleSelectAllPages}
            actions={[
              { id: 'ban', label: 'Ban Users', icon: <IconBan size={18} />, color: 'error', requiresConfirmation: true, confirmationMessage: 'Are you sure you want to ban the selected users?' },
              { id: 'unban', label: 'Unban Users', icon: <IconCheck size={18} />, color: 'success' },
              { id: 'role-admin', label: 'Make Admin', icon: <IconUserShield size={18} />, color: 'error', requiresConfirmation: true },
              { id: 'role-creator', label: 'Make Creator', icon: <IconUserShield size={18} />, color: 'warning' },
              commonBulkActions.export(),
              commonBulkActions.sendNotification(),
            ]}
            onAction={handleBulkAction}
          />

          {/* Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelection.isAllSelected}
                          indeterminate={bulkSelection.selectedCount > 0 && !bulkSelection.isAllSelected}
                          onChange={bulkSelection.toggleSelectAll}
                        />
                      </TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Podcasts</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" py={4}>
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} hover selected={bulkSelection.isSelected(user.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={bulkSelection.isSelected(user.id)}
                              onChange={() => bulkSelection.toggleSelectItem(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar src={user.avatar} sx={{ width: 40, height: 40 }}>
                                {user.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              color={getRoleColor(user.role) as any}
                            />
                          </TableCell>
                          <TableCell>{user.podcastCount || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              size="small"
                              color={getStatusColor(user.status) as any}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, user)}
                            >
                              <IconDotsVertical size={18} />
                            </IconButton>
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
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleChangeRole('admin')}>
          <IconUserShield size={18} style={{ marginRight: 8 }} />
          Make Admin
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole('creator')}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          Make Creator
        </MenuItem>
        <MenuItem
          onClick={handleBan}
          sx={{ color: selectedUser?.status === 'banned' ? 'success.main' : 'error.main' }}
        >
          {selectedUser?.status === 'banned' ? (
            <>
              <IconCheck size={18} style={{ marginRight: 8 }} />
              Unban User
            </>
          ) : (
            <>
              <IconBan size={18} style={{ marginRight: 8 }} />
              Ban User
            </>
          )}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UsersPage;
