import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, BarChart3, Link, Lock, Settings, ChevronDown, CheckCircle2, GraduationCap, Copy, Search, HelpCircle, Phone, Mail, MapPin } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Accordion from '../../components/ui/Accordion';
import toast from 'react-hot-toast';

const Landing = () => {
  // FAQs Search state
  const [faqSearch, setFaqSearch] = useState('');
  
  // Contact Form state
  const [formData, setFormData] = useState({ fullName: '', email: '', subject: 'General', message: '' });
  const [sending, setSending] = useState(false);

  // Statistics counters state
  const [counters, setCounters] = useState({ institutions: 0, exams: 0, uptime: 0, students: 0 });

  useEffect(() => {
    // Basic count-up simulation on mount
    const interval = setInterval(() => {
      setCounters((prev) => {
        const inst = prev.institutions < 10000 ? prev.institutions + 250 : 10000;
        const exm = prev.exams < 5000000 ? prev.exams + 125000 : 5000000;
        const upt = prev.uptime < 99.9 ? Number((prev.uptime + 2.5).toFixed(1)) : 99.9;
        const std = prev.students < 50000000 ? prev.students + 1250000 : 50000000;
        return { institutions: inst, exams: exm, uptime: upt, students: std };
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Your message has been sent successfully! Our sales team will get back to you shortly.', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#1E293B', color: '#FFF' }
      });
      setFormData({ fullName: '', email: '', subject: 'General', message: '' });
      setSending(false);
    }, 1500);
  };

  const faqData = [
    { q: 'How does AI-powered proctoring prevent cheating?', a: 'Our system tracks tab switches, fullscreen exit attempts, and copy/paste triggers. It locks down the browser and logs warnings. Optionally, webcam analysis flags multiple faces or absence.' },
    { q: 'Can I import questions in bulk from Excel or CSV?', a: 'Yes! Administrators can download our pre-formatted template and drag-drop CSV sheets directly to import questions, matching column parameters dynamically.' },
    { q: 'What kinds of question formats are supported?', a: 'We support Single MCQ, Multi MCQ, True/False, Fill in the Blanks, Subjective responses, and Coding questions equipped with automated test-case evaluation.' },
    { q: 'Is there a free trial option available?', a: 'Absolutely. We offer a full-featured 14-day trial for universities and schools to conduct mock examinations with up to 100 concurrent students.' },
    { q: 'How is student data protected?', a: 'All communication is encrypted using TLS. Personal identifiers are hashed, passwords stored with bcrypt, and sessions verified through secure HTTP-only refresh cookies.' },
    { q: 'What happens if a student disconnects from the internet?', a: 'The Exam Interface auto-saves responses locally every 15 seconds to localStorage. When connection is restored, answers sync back to our server.' }
  ];

  const filteredFaqs = faqData.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-50 dark:bg-darkBg transition-colors duration-300">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 -left-40 h-96 w-96 rounded-full bg-brand-blue/10 dark:bg-brand-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -right-40 h-[450px] w-[450px] rounded-full bg-brand-violet/10 dark:bg-brand-violet/5 blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 dark:bg-brand-blue/20 dark:border-brand-blue/30 text-brand-blue dark:text-brand-blueLight text-xs font-bold uppercase tracking-wider"
          >
            🚀 Version 2.0 is Live
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          >
            Transform Your <br />
            <span className="bg-gradient-to-r from-brand-blue via-brand-violet to-brand-blueLight bg-clip-text text-transparent">
              Assessment Process
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-600 dark:text-darkMuted text-base md:text-lg leading-relaxed max-w-xl"
          >
            Create, manage, and conduct secure online examinations with AI-powered proctoring, Monaco code runtime evaluation, and granular analytics reports. Trusted by educators globally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2 w-full sm:w-auto"
          >
            <a href="#contact" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">Start Free Trial</Button>
            </a>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Explore Features</Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 dark:text-darkMuted pt-4 border-t border-slate-200/50 dark:border-slate-800/50 w-full"
          >
            <span>• No credit card required</span>
            <span>• Free 14-day sandbox access</span>
            <span>• Instant dynamic grading</span>
          </motion.div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl border border-slate-200/60 bg-white/70 dark:bg-slate-900/60 dark:border-slate-800/80 p-4 shadow-2xl glass-panel overflow-hidden"
          >
            <div className="h-6 flex gap-1.5 items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
                <div className="h-6 bg-brand-emerald/10 text-brand-emerald text-xs px-2 py-0.5 rounded-full font-bold">Active Session</div>
              </div>
              <div className="h-32 bg-slate-50 dark:bg-darkSurface rounded-xl border border-slate-200/40 dark:border-slate-800/50 flex flex-col justify-center px-6 gap-3">
                <div className="h-3 bg-slate-350 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-2 bg-brand-blue/30 rounded w-full overflow-hidden">
                  <div className="h-full w-2/3 bg-brand-blue" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200/40 dark:border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Integrity Score</span>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">98.4%</p>
                </div>
                <div className="border border-slate-200/40 dark:border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Registered Exams</span>
                  <p className="text-xl font-extrabold text-brand-blue">24,800</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">Enterprise Features</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Security & Analytics at Scale
          </h2>
          <p className="text-slate-500 dark:text-darkMuted text-sm md:text-base leading-relaxed">
            Everything you need to compile test patterns, manage students registrations, lock browsers, and review metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-4 dark:bg-brand-blue/20 dark:text-brand-blueLight">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">AI-Powered Proctoring</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              Detect tab switches, exit attempts, and cut/paste alerts dynamically. Automatically submit on continuous violations.
            </p>
          </Card>

          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet mb-4 dark:bg-brand-violet/20">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">Code Compiler Integration</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              Support real code execution in Monaco editor with customizable hidden unit test cases for JS, Python, and Java.
            </p>
          </Card>

          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald mb-4 dark:bg-brand-emerald/20 dark:text-brand-emerald">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">Granular Report Analytics</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              Generate interactive radar graphs and bell curve reports summarizing question completion percentages and averages.
            </p>
          </Card>

          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-4 dark:bg-slate-800 dark:text-darkText">
              <Link size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">CSV Multi-Field Importer</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              Upload spreadsheets, configure custom fields maps, and validate rows dynamically before saving database items.
            </p>
          </Card>

          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red mb-4 dark:bg-brand-red/20 dark:text-brand-red">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">JWT Session Rotation</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              High protection using short access token intervals coupled with secure HTTP-only cookies refresh routines.
            </p>
          </Card>

          <Card hoverLift variant="glass">
            <div className="h-10 w-10 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber mb-4 dark:bg-brand-amber/20 dark:text-brand-amber">
              <Settings size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">Customizable Exam Rules</h3>
            <p className="text-slate-500 dark:text-darkMuted text-xs leading-relaxed">
              Control flexible time ranges, shuffle order settings, display of correct answers rules, and negative marks policies.
            </p>
          </Card>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="bg-slate-900 dark:bg-slate-950 text-white py-16 relative overflow-hidden">
        {/* Parallax style light overlay grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-brand-blueLight">
              {counters.institutions.toLocaleString()}+
            </p>
            <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider">Institutions Worldwide</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-brand-violet">
              {(counters.exams / 1000000).toFixed(1)}M+
            </p>
            <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider">Exams Evaluated</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-brand-emerald">
              {counters.uptime}%
            </p>
            <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider">Platform Uptime</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-brand-amber">
              {(counters.students / 1000000).toFixed(0)}M+
            </p>
            <p className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider">Registered Candidates</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">Support FAQ</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          
          {/* FAQ Search bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-1 shadow-sm">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <Accordion key={idx} title={faq.q}>
                {faq.a}
              </Accordion>
            ))
          ) : (
            <div className="text-center py-6 text-slate-450 dark:text-darkMuted">
              No matching questions found. Try search query terms like "cheat" or "code".
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Connect with our <br />
            <span className="text-brand-blue">Solutions Expert</span>
          </h2>
          <p className="text-slate-500 dark:text-darkMuted text-sm leading-relaxed max-w-sm">
            Interested in scaling our examination system inside your organization? Fill the form, and our sales team will draft a trial blueprint.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue dark:bg-brand-blue/20">
                <Mail size={16} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-darkText">support@examportal.com</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet dark:bg-brand-violet/20">
                <Phone size={16} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-darkText">+1 (555) 019-2834</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald dark:bg-brand-emerald/20 dark:text-brand-emerald">
                <MapPin size={16} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-darkText">San Francisco, CA</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative">
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-55/40 border border-slate-200 dark:bg-darkBg dark:border-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-55/40 border border-slate-200 dark:bg-darkBg dark:border-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Inquiry</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-55/40 border border-slate-200 dark:bg-darkBg dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-brand-blue"
              >
                <option value="General">General Support</option>
                <option value="Sales">Sales & Enterprise Pricing</option>
                <option value="Partnership">Institutional Partnership</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Description</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-55/40 border border-slate-200 dark:bg-darkBg dark:border-slate-800 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>

            <Button type="submit" loading={sending} className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 dark:bg-slate-950 dark:text-darkMuted py-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded bg-gradient-to-tr from-brand-blue to-brand-violet flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <span className="font-bold text-base">ExamPortal</span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs">
              Transforming corporate and academic testing through high security online assessments and evaluations.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Features list</a></li>
              <li><a href="#proctor" className="hover:text-white transition-colors">Integrity proctor</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Institutional plans</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#docs" className="hover:text-white transition-colors">API Reference docs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Help FAQ</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">Educational Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Regulatory</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of service</a></li>
              <li><a href="#gdpr" className="hover:text-white transition-colors">GDPR compliance</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs gap-4">
          <p>© 2026 ExamPortal Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
            <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
