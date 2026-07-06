import React, { useEffect, useState } from 'react';
import { Search, Plus, Upload, Download, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Active student state
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudentId, setDeletingStudentId] = useState(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOrg, setFormOrg] = useState('');

  // Bulk CSV file states
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [page, search, statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/students', {
        params: {
          page,
          search,
          status: statusFilter
        }
      });
      setStudents(response.data.data.students);
      setTotal(response.data.data.total);
    } catch (err) {
      toast.error('Failed to retrieve students roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('Pass123!');
    setFormPhone('');
    setFormOrg('');
    setAddEditOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormName(student.fullName);
    setFormEmail(student.email);
    setFormPassword(''); // blank means do not update password
    setFormPhone(student.phone);
    setFormOrg(student.organization);
    setAddEditOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        // Edit update
        await api.patch(`/admin/students/${editingStudent._id}`, {
          fullName: formName,
          phone: formPhone,
          organization: formOrg
        });
        toast.success('Student details updated successfully.');
      } else {
        // Create new
        await api.post('/admin/students', {
          fullName: formName,
          email: formEmail,
          password: formPassword,
          phone: formPhone,
          organization: formOrg
        });
        toast.success('Student created successfully.');
      }
      setAddEditOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Error occurred while saving student.');
    }
  };

  const handleOpenDelete = (id) => {
    setDeletingStudentId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/admin/students/${deletingStudentId}`);
      toast.success('Student account deleted.');
      setDeleteOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to suspend/delete student.');
    }
  };

  // Drag and drop CSV parser mockup
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(Boolean);
      
      if (rows.length < 2) {
        setCsvError('SPREADSHEET ERROR: Sheet lacks row fields.');
        return;
      }

      // Basic parsing commas
      const headers = rows[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const parsed = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map((v) => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx];
          });
          parsed.push(rowObj);
        }
      }

      setCsvPreview(parsed);
      setCsvError(null);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    try {
      await api.post('/admin/students/bulk-import', { students: csvPreview });
      toast.success(`${csvPreview.length} students imported successfully.`);
      setImportOpen(false);
      setCsvPreview([]);
      fetchStudents();
    } catch (err) {
      toast.error('Bulk upload failed.');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/v1/admin/students/export');
  };

  const tableHeaders = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'org', label: 'Organization' },
    { key: 'exams', label: 'Exams Taken' },
    { key: 'avg', label: 'Avg Score' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6">
      {/* Header bar controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">Create student profile configurations or import rosters in bulk.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload size={14} className="mr-1" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus size={14} className="mr-1" /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters Search inputs */}
      <Card className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-blue"
          >
            <option value="All">All Students</option>
            <option value="Active">Active Only</option>
          </select>
        </div>
      </Card>

      {/* Table grid */}
      <Table
        headers={tableHeaders}
        data={students}
        loading={loading}
        emptyMessage="No students match the criteria."
        renderRow={(student) => (
          <>
            <td className="px-6 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs uppercase dark:bg-brand-blue/20 dark:text-brand-blueLight">
                {student.fullName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-900 dark:text-darkText">{student.fullName}</span>
            </td>
            <td className="px-6 py-4">{student.email}</td>
            <td className="px-6 py-4">{student.organization}</td>
            <td className="px-6 py-4 font-bold text-slate-800 dark:text-darkText">{student.examsTaken}</td>
            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-darkText">{student.averageScore}%</td>
            <td className="px-6 py-4">
              <Badge variant={student.isActive ? 'success' : 'neutral'} dot>
                {student.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td className="px-6 py-4 flex gap-2">
              <button
                onClick={() => handleOpenEdit(student)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-blue dark:hover:bg-slate-800 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleOpenDelete(student._id)}
                className="p-1.5 hover:bg-slate-150 rounded text-slate-400 hover:text-brand-red dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </td>
          </>
        )}
      />

      {/* Pagination labels */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-darkMuted pt-2 font-semibold">
        <span>Showing {students.length} of {total} records</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={students.length < 10}>
            Next
          </Button>
        </div>
      </div>

      {/* Slide Edit Modal */}
      <Modal
        isOpen={addEditOpen}
        onClose={() => setAddEditOpen(false)}
        title={editingStudent ? 'Edit Student Details' : 'Register New Student'}
        size="drawer"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <Input
            label="Student Full Name"
            id="modalName"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            id="modalEmail"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            disabled={editingStudent !== null}
            required
          />

          {!editingStudent && (
            <Input
              label="Temporary Password"
              id="modalPassword"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
            />
          )}

          <Input
            label="Institution / Group Name"
            id="modalOrg"
            value={formOrg}
            onChange={(e) => setFormOrg(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            id="modalPhone"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />

          <Button type="submit" className="w-full mt-4">
            Save Student Configuration
          </Button>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import Student Database Roster">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mx-auto">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-darkText">Drag and drop CSV template file</p>
              <p className="text-[10px] text-slate-450 dark:text-darkMuted mt-0.5">Template must contain columns: fullName, email, organization, phone</p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="text-xs text-slate-500 mx-auto max-w-xs block file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue"
            />
          </div>

          {csvError && <p className="text-xs text-brand-red font-semibold">{csvError}</p>}

          {csvPreview.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-darkMuted">Roster Preview ({csvPreview.length} rows)</p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1 bg-slate-50 dark:bg-darkBg">
                {csvPreview.slice(0, 5).map((row, idx) => (
                  <div key={idx} className="text-[10px] text-slate-500 dark:text-darkMuted truncate">
                    Row {idx + 1}: {row.fullName} ({row.email}) - {row.organization}
                  </div>
                ))}
              </div>
              <Button onClick={handleBulkImport} className="w-full">
                Verify & Import {csvPreview.length} Candidates
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Deactivate/Delete Candidate account">
        <div className="space-y-4">
          <div className="flex gap-3 items-start bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-xl text-brand-red">
            <ShieldAlert className="shrink-0" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">CAUTION: Danger Action</p>
              <p className="text-slate-500 dark:text-darkMuted mt-1">This operation deletes the student record, response history logs, and results permanently. This cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Deactivate & Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
