import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, HelpCircle, Layers, CheckCircle2, ChevronRight, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Modal forms states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [qType, setQType] = useState('mcq_single'); // mcq_single, true_false, subjective, coding
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('General');
  const [defaultMarks, setDefaultMarks] = useState(5);
  const [explanation, setExplanation] = useState('');
  
  // MCQ Options list states
  const [options, setOptions] = useState([
    { text: '', isCorrect: true, order: 0 },
    { text: '', isCorrect: false, order: 1 }
  ]);

  // True/False correct states
  const [correctTF, setCorrectTF] = useState('true');

  // Coding parameters states
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [starterCode, setStarterCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', marks: 5, isHidden: false }
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [page, search, typeFilter, difficultyFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/questions', {
        params: {
          page,
          search,
          type: typeFilter,
          difficulty: difficultyFilter
        }
      });
      setQuestions(response.data.data.questions || []);
      setTotal(response.data.data.total || 0);
    } catch (err) {
      toast.error('Failed to load questions from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (type) => {
    setEditingId(null);
    setQType(type);
    setText('');
    setDifficulty('medium');
    setCategory('General');
    setDefaultMarks(5);
    setExplanation('');
    setOptions([
      { text: '', isCorrect: true, order: 0 },
      { text: '', isCorrect: false, order: 1 },
      { text: '', isCorrect: false, order: 2 },
      { text: '', isCorrect: false, order: 3 }
    ]);
    setCorrectTF('true');
    setCodeLanguage('javascript');
    setStarterCode('function solution() {\n  // write code here\n}');
    setTestCases([{ input: '()', expectedOutput: 'true', marks: 5, isHidden: false }]);
    setFormOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setQType(q.type);
    setText(q.text);
    setDifficulty(q.difficulty);
    setCategory(q.category);
    setDefaultMarks(q.defaultMarks);
    setExplanation(q.explanation || '');
    
    if (q.type === 'mcq_single' || q.type === 'mcq_multiple') {
      setOptions(q.options || []);
    } else if (q.type === 'true_false') {
      setCorrectTF(String(q.correctAnswer));
    } else if (q.type === 'coding') {
      setCodeLanguage(q.codingDetails?.language || 'javascript');
      setStarterCode(q.codingDetails?.starterCode || '');
      setTestCases(q.codingDetails?.testCases || []);
    }
    setFormOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    const payload = {
      type: qType,
      text,
      difficulty,
      category,
      defaultMarks: parseInt(defaultMarks),
      explanation
    };

    if (qType === 'mcq_single' || qType === 'mcq_multiple') {
      payload.options = options.map((opt, idx) => ({ ...opt, order: idx }));
      // Set correctAnswer mockup matching index
      payload.correctAnswer = options.findIndex((opt) => opt.isCorrect);
    } else if (qType === 'true_false') {
      payload.correctAnswer = correctTF === 'true';
    } else if (qType === 'coding') {
      payload.codingDetails = {
        language: codeLanguage,
        starterCode,
        solutionCode,
        testCases: testCases.map((tc) => ({
          ...tc,
          marks: parseInt(tc.marks)
        }))
      };
    }

    try {
      if (editingId) {
        await api.patch(`/admin/questions/${editingId}`, payload);
        toast.success('Question updated successfully.');
      } else {
        await api.post('/admin/questions', payload);
        toast.success('Question added to database repository.');
      }
      setFormOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error('Failed saving question details.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      toast.success('Question deleted.');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  const handleMcqOptionChange = (val, idx) => {
    const list = [...options];
    list[idx].text = val;
    setOptions(list);
  };

  const handleMcqCorrectToggle = (idx) => {
    const list = options.map((opt, oIdx) => ({
      ...opt,
      isCorrect: oIdx === idx
    }));
    setOptions(list);
  };

  const tableHeaders = [
    { key: 'text', label: 'Question Item' },
    { key: 'type', label: 'Type' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'marks', label: 'Marks' },
    { key: 'category', label: 'Category' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Question Repository Bank</h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">Manage centralized questions and configure compile rules.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['mcq_single', 'true_false', 'subjective', 'coding'].map((type) => (
            <Button key={type} size="sm" onClick={() => handleOpenAdd(type)}>
              + Add {type.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters Search inputs */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search questions keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-450">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="mcq_single">Single MCQ</option>
              <option value="true_false">True / False</option>
              <option value="subjective">Subjective Paragraph</option>
              <option value="coding">Code compiler</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-455">Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid Roster Table */}
      <Table
        headers={tableHeaders}
        data={questions}
        loading={loading}
        emptyMessage="No questions match search filter."
        renderRow={(q) => (
          <>
            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-darkText max-w-sm truncate">{q.text}</td>
            <td className="px-6 py-4"><Badge variant="info">{q.type.replace('_', ' ')}</Badge></td>
            <td className="px-6 py-4">
              <Badge variant={q.difficulty === 'hard' ? 'danger' : (q.difficulty === 'medium' ? 'warning' : 'success')} dot>
                {q.difficulty}
              </Badge>
            </td>
            <td className="px-6 py-4 font-bold">{q.defaultMarks}</td>
            <td className="px-6 py-4 font-semibold">{q.category}</td>
            <td className="px-6 py-4 flex gap-2">
              <button onClick={() => handleOpenEdit(q)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-blue dark:hover:bg-slate-800">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(q._id)} className="p-1.5 hover:bg-slate-150 rounded text-slate-400 hover:text-brand-red dark:hover:bg-slate-800">
                <Trash2 size={14} />
              </button>
            </td>
          </>
        )}
      />

      {/* Pagination control footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-darkMuted pt-2 font-semibold">
        <span>Showing {questions.length} of {total} records</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={questions.length < 10}>
            Next
          </Button>
        </div>
      </div>

      {/* Add / Edit Question Modal Adapt Form */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Edit ${qType.replace('_', ' ')} Question` : `Add New ${qType.replace('_', ' ')}`}
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Question prompt/text</label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-white dark:bg-darkSurface border border-slate-205 dark:border-slate-800 rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none"
              placeholder="e.g. What is the execution time limit complexity of binary search?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs mt-1.5 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <Input label="Category" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <Input label="Default Marks" id="marks" type="number" value={defaultMarks} onChange={(e) => setDefaultMarks(e.target.value)} required />
          </div>

          {/* DYNAMIC FORM LAYOUT BY TYPE */}

          {/* MCQ Options list */}
          {(qType === 'mcq_single' || qType === 'mcq_multiple') && (
            <div className="space-y-2 border-t pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multiple Choice Options</span>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    type="radio"
                    name="mcqCorrect"
                    checked={opt.isCorrect}
                    onChange={() => handleMcqCorrectToggle(idx)}
                    className="text-brand-blue"
                  />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => handleMcqOptionChange(e.target.value, idx)}
                    className="flex-1"
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* True / False correct selectors */}
          {qType === 'true_false' && (
            <div className="space-y-2 border-t pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Correct Answer Toggle</span>
              <div className="grid grid-cols-2 gap-4">
                {['true', 'false'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCorrectTF(val)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                      correctTF === val ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' : 'border-slate-200'
                    }`}
                  >
                    {val.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coding questions configuration panel */}
          {qType === 'coding' && (
            <div className="space-y-4 border-t pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Code compiler details</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Language</label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs mt-1.5 focus:outline-none"
                  >
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="python">Python 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Default starter code template</label>
                <textarea
                  rows={4}
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  className="w-full font-mono bg-slate-905 text-white border rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hidden unit testcase expected output</label>
                <textarea
                  rows={2}
                  value={solutionCode}
                  onChange={(e) => setSolutionCode(e.target.value)}
                  placeholder="e.g. Expected result comparison string"
                  className="w-full font-mono bg-slate-905 text-white border rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Grading explanation/rubrics</label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full border border-slate-205 dark:border-slate-800 dark:bg-darkSurface rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none resize-none"
              placeholder="Provide solution context for results reports..."
            />
          </div>

          <Button type="submit" className="w-full mt-4">
            Save Question Configuration
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Questions;
