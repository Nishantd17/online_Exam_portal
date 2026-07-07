import mongoose from 'mongoose';

const BASE = 'http://localhost:5000/api/v1';

const req = async (url, method = 'GET', body, token) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + url, opts);
  const json = await r.json();
  if (!r.ok) throw new Error(`${method} ${url} failed: ${json.message || r.status}`);
  return json.data;
};

const MONGO_URI = 'mongodb://online_exam_portal:plm2MgCrrctPmy0y@ac-zvmf8mt-shard-00-00.hzzmrud.mongodb.net:27017,ac-zvmf8mt-shard-00-01.hzzmrud.mongodb.net:27017,ac-zvmf8mt-shard-00-02.hzzmrud.mongodb.net:27017/?ssl=true&replicaSet=atlas-mjclr8-shard-0&authSource=admin';

const test = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Pre-create verified OTPs directly in DB so we skip the email flow
  const tag = Math.random().toString(36).substring(2, 7);
  const adminEmail = `admin_${tag}@testmail.com`;
  const studentEmail = `student_${tag}@testmail.com`;

  await db.collection('otps').insertMany([
    { email: adminEmail, otp: '123456', isVerified: true, createdAt: new Date() },
    { email: studentEmail, otp: '123456', isVerified: true, createdAt: new Date() }
  ]);
  console.log('Pre-inserted verified OTPs for', adminEmail, 'and', studentEmail);

  // 1. Admin signup
  console.log('\n[1] Admin signup...');
  const adminSignup = await req('/auth/signup', 'POST', {
    fullName: 'Workflow Admin',
    email: adminEmail,
    password: 'Password123!',
    role: 'admin',
    organization: 'Workflow Academy'
  });
  // joinCode is on the populated organizationId subdoc
  const joinCode = adminSignup.organizationId?.joinCode;
  console.log('  Join code:', joinCode);

  // 2. Admin login
  console.log('[2] Admin login...');
  const adminLogin = await req('/auth/login', 'POST', { email: adminEmail, password: 'Password123!' });
  const adminToken = adminLogin.accessToken;
  console.log('  Admin token obtained:', !!adminToken);

  // 3. Student signup using join code
  console.log('\n[3] Student signup...');
  await req('/auth/signup', 'POST', {
    fullName: 'Workflow Student',
    email: studentEmail,
    password: 'Password123!',
    role: 'student',
    joinCode
  });

  // 4. Student login
  console.log('[4] Student login...');
  const studentLogin = await req('/auth/login', 'POST', { email: studentEmail, password: 'Password123!' });
  const studentToken = studentLogin.accessToken;
  console.log('  Student token obtained:', !!studentToken);

  // 5. Create a question (Admin)
  console.log('\n[5] Creating question...');
  const question = await req('/admin/questions', 'POST', {
    type: 'mcq_single',
    text: 'What is 2 + 2?',
    options: [
      { text: '3', isCorrect: false, order: 0 },
      { text: '4', isCorrect: true, order: 1 },
      { text: '5', isCorrect: false, order: 2 }
    ],
    correctAnswer: 1,
    difficulty: 'easy',
    category: 'Math',
    topics: ['Arithmetic']
  }, adminToken);
  console.log('  Question ID:', question._id);

  // 6. Create an exam (Admin)
  console.log('[6] Creating exam...');
  const exam = await req('/exams', 'POST', {
    title: 'Workflow Math Test',
    category: 'Math',
    type: 'quiz',
    duration: 30,
    totalMarks: 5,
    passingMarks: 50,
    settings: { maxAttempts: 1 },
    questions: [{ question: question._id, marks: 5, order: 0 }],
    status: 'published'
  }, adminToken);
  console.log('  Exam ID:', exam._id);

  // 7. Start exam (Student)
  console.log('\n[7] Starting exam session...');
  await req(`/exams/student/${exam._id}/start`, 'GET', null, studentToken);

  // 8. Save answer (Student)
  console.log('[8] Saving answer (correct answer: option index 1)...');
  await req(`/exams/student/${exam._id}/save-answer`, 'POST', {
    questionId: question._id,
    selectedOption: '1',
    status: 'answered'
  }, studentToken);

  // 9. Submit exam (Student)
  console.log('[9] Submitting exam...');
  const submission = await req(`/results/student/${exam._id}/submit`, 'POST', null, studentToken);
  const resultId = submission._id;
  console.log('  Result ID:', resultId);
  console.log('  Status (expect Pending):', submission.status);
  console.log('  ObtainedMarks (expect 0):', submission.obtainedMarks);
  console.log('  Passed (expect false):', submission.passed);

  if (submission.status !== 'Pending') throw new Error('FAIL: Result not in Pending state!');
  if (submission.obtainedMarks !== 0) throw new Error('FAIL: Marks should be 0 while pending!');

  // 10. Student fetches own result (should be masked)
  console.log('\n[10] Fetching result as student (should be masked)...');
  const studentResult = await req(`/results/${resultId}`, 'GET', null, studentToken);
  console.log('  obtainedMarks visible to student:', studentResult.obtainedMarks);
  console.log('  questionBreakdown visible to student:', !!studentResult.questionBreakdown);
  if (studentResult.obtainedMarks !== undefined) throw new Error('FAIL: Marks leaked to student during Pending!');

  // 11. Admin fetches pending list
  console.log('\n[11] Admin fetching pending reviews list...');
  const pending = await req('/results/admin/pending', 'GET', null, adminToken);
  console.log('  Pending count:', pending.length);
  const found = pending.find(r => r._id === resultId);
  if (!found) throw new Error('FAIL: Result not found in admin pending list!');

  // 12. Admin approves result
  console.log('\n[12] Admin approving result...');
  const approved = await req(`/results/admin/review/${resultId}/approve`, 'POST', null, adminToken);
  console.log('  Status (expect Published):', approved.status);
  console.log('  ObtainedMarks (expect 5):', approved.obtainedMarks);
  console.log('  Percentage (expect 100):', approved.percentage);
  console.log('  Passed (expect true):', approved.passed);
  if (approved.status !== 'Published') throw new Error('FAIL: Result not Published after approval!');
  if (approved.obtainedMarks !== 5) throw new Error('FAIL: ObtainedMarks not 5 after approval!');
  if (!approved.passed) throw new Error('FAIL: Result not marked as passed!');

  // 13. Student fetches result post-publication
  console.log('\n[13] Student fetching published result...');
  const published = await req(`/results/${resultId}`, 'GET', null, studentToken);
  console.log('  ObtainedMarks visible (expect 5):', published.obtainedMarks);
  console.log('  Percentage visible (expect 100):', published.percentage);
  if (published.obtainedMarks !== 5) throw new Error('FAIL: Student cannot see published marks!');

  console.log('\n✅ ALL WORKFLOW CHECKS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
  process.exit(0);
};

test().catch(err => {
  console.error('\n❌ Test Failed:', err.message);
  mongoose.disconnect().then(() => process.exit(1));
});
