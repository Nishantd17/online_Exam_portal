import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, HelpCircle, Layers, CheckCircle2, ChevronRight, X, AlertTriangle, Upload, FileText } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const parseBulkQuestions = (rawText) => {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map(l => l.trim());
  
  const questions = [];
  let currentQuestion = null;

  // Matches start of a question: Q1. or 1. or Question 2: or 2)
  const questionStartRegex = /^(?:Q(?:uestion)?\s*)?(\d+)[\.\:\)\-\]]\s*(.*)/i;
  // Matches A) Option or a. Option or 1) Option
  const optionRegex = /^(?:([A-Za-z]|\d+))[\.\)\-\]]\s*(.*)/;
  // Matches true/false keywords
  const tfRegex = /^(true|false)$/i;

  lines.forEach((line) => {
    if (!line) return; // ignore empty lines

    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        text: qMatch[2].trim(),
        rawLines: [line],
        options: [],
        type: 'subjective',
        difficulty: 'medium',
        category: 'General',
        defaultMarks: 5,
        explanation: ''
      };
      return;
    }

    if (!currentQuestion) {
      // Create a default question if there's text before any question numbering starts
      currentQuestion = {
        text: line,
        rawLines: [line],
        options: [],
        type: 'subjective',
        difficulty: 'medium',
        category: 'General',
        defaultMarks: 5,
        explanation: ''
      };
      return;
    }

    currentQuestion.rawLines.push(line);
  });

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  // Parse lines of each question block
  const parsedQuestions = questions.map((q) => {
    const rawLines = q.rawLines;
    let qText = q.text;
    let optionsList = [];
    let isCoding = false;
    let codeLines = [];
    let inCodeBlock = false;

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (line.startsWith('```')) {
        isCoding = true;
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      const optMatch = line.match(optionRegex);
      const isTF = tfRegex.test(line);

      if (optMatch) {
        let optVal = optMatch[2].trim();
        let isCorrect = false;
        if (optVal.endsWith('*')) {
          isCorrect = true;
          optVal = optVal.slice(0, -1).trim();
        } else if (line.toLowerCase().includes('(correct)') || optVal.toLowerCase().includes('(correct)')) {
          isCorrect = true;
          optVal = optVal.replace(/\(correct\)/i, '').trim();
        }
        optionsList.push({
          text: optVal,
          isCorrect,
          label: optMatch[1]
        });
      } else if (isTF) {
        let isCorrect = false;
        let optVal = line;
        if (line.endsWith('*')) {
          isCorrect = true;
          optVal = line.slice(0, -1).trim();
        } else if (line.toLowerCase().includes('(correct)')) {
          isCorrect = true;
          optVal = line.replace(/\(correct\)/i, '').trim();
        }
        optionsList.push({
          text: optVal,
          isCorrect,
          label: optVal.toUpperCase()
        });
      } else {
        if (optionsList.length === 0 && !isCoding) {
          qText += '\n' + line;
        } else if (isCoding) {
          codeLines.push(line);
        }
      }
    }

    let finalType = 'subjective';
    let correctAnswer = undefined;
    let codingDetails = undefined;

    const fullRawText = rawLines.join('\n');
    if (isCoding || fullRawText.includes('```') || fullRawText.toLowerCase().includes('function ') || fullRawText.toLowerCase().includes('def ') || fullRawText.toLowerCase().includes('return ')) {
      finalType = 'coding';
      codingDetails = {
        language: fullRawText.toLowerCase().includes('def ') ? 'python' : 'javascript',
        starterCode: codeLines.join('\n') || '// write code here\n',
        solutionCode: '// Run checks\n',
        testCases: [{ input: '()', expectedOutput: 'true', marks: 5, isHidden: false }]
      };
    } else if (optionsList.length === 2 && 
               optionsList.some(o => o.text.toLowerCase() === 'true') && 
               optionsList.some(o => o.text.toLowerCase() === 'false')) {
      finalType = 'true_false';
      const correctOpt = optionsList.find(o => o.isCorrect);
      correctAnswer = correctOpt ? (correctOpt.text.toLowerCase() === 'true') : true;
    } else if (optionsList.length > 0) {
      finalType = 'mcq_single';
      optionsList = optionsList.map((opt, idx) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: idx
      }));
      if (!optionsList.some(o => o.isCorrect)) {
        optionsList[0].isCorrect = true;
      }
    }

    return {
      text: qText.trim(),
      type: finalType,
      difficulty: q.difficulty,
      category: q.category,
      defaultMarks: q.defaultMarks,
      options: finalType === 'mcq_single' ? optionsList : [],
      correctAnswer: finalType === 'true_false' ? correctAnswer : undefined,
      codingDetails: finalType === 'coding' ? codingDetails : undefined,
      explanation: ''
    };
  });

  return parsedQuestions;
};

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

  // Bulk import states
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [importing, setImporting] = useState(false);

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
          <Button size="sm" variant="outline" onClick={() => {
            setImportText('');
            setParsedQuestions([]);
            setImportOpen(true);
          }} className="gap-1">
            📥 Bulk Import
          </Button>
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

      {/* Bulk Import Questions Modal */}
      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="📥 Bulk Import Questions (Text File Analyzer)">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Import multiple questions using raw text</h3>
            <p className="text-[10px] text-slate-400 dark:text-darkMuted leading-relaxed">
              Paste your questions below or load a text file. Separate questions with a **blank line**. 
              Use markers like `A) Option text` or `A. Option text` for MCQs, and suffix the correct option with `*` or `(correct)`. Code blocks in triple backticks (\`\`\`) are parsed as coding questions.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Example format:

Q1. What is the value of 2 + 2?
A) 3
B) 4*
C) 5
D) 6

Q2. Python is a compiled language.
True
False*

Q3. Write a JavaScript function to sum.
\`\`\`javascript
function sum(a, b) {
  return a + b;
}
\`\`\``}
              className="w-full font-mono bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white rounded-xl px-4 py-3 text-xs focus:outline-none"
            />
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept=".txt,.md,.csv"
                id="bulkFileLoader"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setImportText(event.target.result);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('bulkFileLoader').click()}
                className="text-xs gap-1"
              >
                <Upload size={13} /> Load Text File
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!importText.trim()) {
                    return toast.error('Please enter or load some text to parse!');
                  }
                  const parsed = parseBulkQuestions(importText);
                  if (parsed.length === 0) {
                    return toast.error('No questions identified in the text. Make sure questions are separated by blank lines.');
                  }
                  setParsedQuestions(parsed);
                  toast.success(`Successfully analyzed ${parsed.length} questions! Review them below.`);
                }}
                className="text-xs gap-1"
              >
                <Search size={13} /> Analyze & Parse
              </Button>
            </div>
          </div>

          {/* Parsed questions preview list */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-250 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">
                Parsed Questions Preview ({parsedQuestions.length})
              </h4>
              
              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 divide-y divide-slate-200 dark:divide-slate-800">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-bold text-slate-500">Question #{idx + 1} Text</span>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => {
                            const updated = [...parsedQuestions];
                            updated[idx].text = e.target.value;
                            setParsedQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const updated = [...parsedQuestions];
                            updated[idx].type = e.target.value;
                            setParsedQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="mcq_single">Single MCQ</option>
                          <option value="true_false">True / False</option>
                          <option value="subjective">Subjective</option>
                          <option value="coding">Coding</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-semibold text-slate-500 uppercase">Difficulty</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const updated = [...parsedQuestions];
                            updated[idx].difficulty = e.target.value;
                            setParsedQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-500 uppercase">Category</label>
                        <input
                          type="text"
                          value={q.category}
                          onChange={(e) => {
                            const updated = [...parsedQuestions];
                            updated[idx].category = e.target.value;
                            setParsedQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-500 uppercase">Default Marks</label>
                        <input
                          type="number"
                          value={q.defaultMarks}
                          onChange={(e) => {
                            const updated = [...parsedQuestions];
                            updated[idx].defaultMarks = parseInt(e.target.value) || 5;
                            setParsedQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                loading={importing}
                onClick={async () => {
                  setImporting(true);
                  try {
                    await api.post('/admin/questions/bulk-import', { questions: parsedQuestions });
                    toast.success(`Successfully imported ${parsedQuestions.length} questions!`);
                    setImportOpen(false);
                    setParsedQuestions([]);
                    setImportText('');
                    fetchQuestions();
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to import parsed questions.');
                  } finally {
                    setImporting(false);
                  }
                }}
                className="w-full mt-4"
              >
                ✅ Confirm & Import {parsedQuestions.length} Questions
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Questions;
