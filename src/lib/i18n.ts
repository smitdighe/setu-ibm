/**
 * i18n.ts — lightweight static UI string dictionary (EN / GU).
 * No framework dependency — just a plain key-value lookup.
 * AI-generated content is translated natively by Granite via a lang prompt
 * instruction; this file only covers hardcoded UI labels.
 */

export type Lang = "en" | "gu";

const dict = {
  en: {
    // Branding
    appName: "SETU",
    tagline: "Learning without limits",
    hero: "A bridge to every student's pace.",
    heroSub:
      "Setu brings AI-powered personalized learning and teacher assistance to Gujarat's government and rural schools.",

    // Nav / auth
    signIn: "Sign In",
    signOut: "Sign out",
    loading: "Loading\u2026",
    classId: "Class ID",
    math: "Math",
    science: "Science",
    topic: "Topic",
    weekOf: "Week of",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    questionCount: "Question Count",
    questionType: "Question Type",
    mixedQuestions: "Mixed (MCQ + Short Answer)",
    mcqOnly: "MCQ Only",
    shortAnswerOnly: "Short Answer Only",
    loadPlan: "Load Plan",
    loadExisting: "Load Existing",
    generateNew: "Generate New",
    generating: "Generating\u2026",
    enterClassId: "Enter a Class ID",
    enterTopic: "Enter a Topic",
    classIdPlaceholder: "e.g. class_6a_math",
    topicPlaceholder: "e.g. fractions",
    servedFromCache: "Served from cache \u2014 no LLM call made.",
    noDataYet: "No data yet",
    noAtRiskStudents: "No at-risk students detected. Great work!",
    student: "Student",
    action: "Action",
    pace: "Pace",
    remedialPlan: "Remedial Plan",
    planSent: "Plan sent \u2713",
    generatedAssessment: "Generated Assessment",
    questions: "questions",
    draft: "Draft",
    correct: "correct",
    expectedAnswer: "Expected answer / key points:",
    assessmentSaved: "Assessment saved as draft. Load assessments above to review student responses once submitted.",
    allFeedbackReviewed: "All feedback has been reviewed. \u2713",
    pendingFeedback: "with pending feedback",
    pending: "pending",
    approve: "Approve",
    reject: "Reject",
    activity: "Activity",
    worksheet: "Worksheet",
    openPrintable: "Open printable version",
    minutes: "min",
    noContentBlocks: "No content blocks available.",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    signingIn: "Signing in…",
    invalidCredentials: "Invalid email or password.",
    chatError: "Sorry, something went wrong.",
    networkError: "Network error. Please try again.",
    done: "Done! ✓",
    failed: "Failed.",
    noClassesAssigned: "No classes assigned yet. Ask your admin to assign you a class.",

    // Teacher sidebar nav
    overview: "Overview",
    lessonPlans: "Lesson Plans",
    assessments: "Assessments",

    // Student header nav
    learn: "Learn",
    myResults: "My Results",

    // Dashboard labels
    skillDistribution: "Skill Distribution",
    atRiskStudents: "At-Risk Students",
    totalStudents: "Total Students",
    avgClassRisk: "Avg Class Risk",
    remedial: "Remedial",
    onTrack: "On Track",
    advanced: "Advanced",
    students: "students",
    atRisk: "at risk",

    // Chat widget
    chatTitle: "Teacher Assistant",
    chatSubtitle: "Powered by IBM Granite",
    chatPlaceholder: "Ask about your class\u2026",
    chatGreeting:
      "Hi! Ask me anything about your class \u2014 e.g. 'Which students are falling behind in fractions?'",
    chatThinking: "Thinking\u2026",

    // Feature cards
    feature1Title: "Personalized Learning",
    feature1Desc: "Adaptive learning paths built around every student's pace.",
    feature2Title: "AI Lesson Planning",
    feature2Desc: "Create curriculum-ready lesson plans and content in minutes.",
    feature3Title: "Real-Time Insights",
    feature3Desc: "Spot students needing support with clear class analytics.",

    // Student dashboard
    myProgress: "My Progress",
    myProgressSub: "Your current skill level and learning pace",
    riskScore: "Risk Score",
    learningPace: "Learning Pace",
    masteryByTopic: "Mastery by Topic",
    myRecommendations: "Recommended Resources",
    myRecommendationsSub: "Next best resources for your learning path",
    noRecommendations: "No recommendations yet.",
    noRecommendationsSub: "Complete an assessment so we can personalise your feed.",
    subject: "Subject",
    pace_slow: "Slow",
    pace_average: "Average",
    pace_fast: "Fast",
    trend_improving: "Improving \u2191",
    trend_declining: "Declining \u2193",
    trend_stable: "Stable \u2192",
  },

  gu: {
    // Branding
    appName: "સેતુ",
    tagline: "અમર્યાદ અભ્યાસ",
    hero: "દરેક વિદ્યાર્થીની ગતિ સાથે સેતુ.",
    heroSub:
      "સેતુ ગુજરાતની સરકારી અને ગ્રામ્ય શાળાઓ માટે AI-સંચાલિત વ્યક્તિગત અભ્યાસ અને શિક્ષક સહાય લાવે છે.",

    // Nav / auth
    signIn: "પ્રવેશ કરો",
    signOut: "સાઇન આઉટ",
    loading: "લોડ થઈ રહ્યું છે…",
    classId: "વર્ગ ID",
    math: "ગણિત",
    science: "વિજ્ઞાન",
    topic: "વિષય",
    weekOf: "અઠવાડિયા",
    difficulty: "કઠિનાઈ",
    easy: "સરળ",
    medium: "મધ્યમ",
    hard: "કઠિન",
    questionCount: "પ્રશ્નોની સંખ્યા",
    questionType: "પ્રશ્નનો પ્રકાર",
    mixedQuestions: "મિશ્ર (MCQ + ટૂંકો જવાબ)",
    mcqOnly: "માત્ર MCQ",
    shortAnswerOnly: "માત્ર ટૂંકા જવાબ",
    loadPlan: "યોજના લોડ કરો",
    loadExisting: "હાલના લોડ કરો",
    generateNew: "નવું બનાવો",
    generating: "બની રહ્યું છે…",
    enterClassId: "વર્ગ ID દાખલ કરો",
    enterTopic: "વિષય દાખલ કરો",
    classIdPlaceholder: "ઉદા. class_6a_math",
    topicPlaceholder: "ઉદા. fractions",
    servedFromCache: "કેશમાંથી મળ્યું — LLM કોલ થયો નથી.",
    noDataYet: "હજી ડેટા નથી",
    noAtRiskStudents: "જોખમમાં કોઈ વિદ્યાર્થી નથી. શાબાશ!",
    student: "વિદ્યાર્થી",
    action: "ક્રિયા",
    pace: "ગતિ",
    remedialPlan: "ઉપચારાત્મક યોજના",
    planSent: "યોજના મોકલવામાં આવી છે ✓",
    generatedAssessment: "બનાવેલ મૂલ્યાંકન",
    questions: "પ્રશ્નો",
    draft: "મુસદ્દો",
    correct: "સાચો",
    expectedAnswer: "અપેક્ષિત જવાબ / મુખ્ય મુદ્દા:",
    assessmentSaved: "મૂલ્યાંકન મુસદ્દા તરીકે સાચવવામાં આવ્યું છે. વિદ્યાર્થીના પ્રતિચારો સમીક્ષા માટે ઉપર મૂલ્યાંકનો લોડ કરો.",
    allFeedbackReviewed: "બધા પ્રતિચારોનું સમીક્ષણ થઈ ગયું છે. ✓",
    pendingFeedback: "બાકી પ્રતિચાર સાથે",
    pending: "બાકી",
    approve: "મંજૂર",
    reject: "નામંજૂર",
    activity: "પ્રવૃત્તિ",
    worksheet: "કાર્યપત્રક",
    openPrintable: "પ્રિન્ટ યોગ્ય આવૃત્તિ ખોલો",
    minutes: "મિનિટ",
    noContentBlocks: "કોઈ સામગ્રી બ્લોક ઉપલબ્ધ નથી.",
    email: "ઈમેલ",
    password: "પાસવર્ડ",
    passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો",
    signingIn: "પ્રવેશ થઈ રહ્યા છે…",
    invalidCredentials: "ઈમેલ અથવા પાસવર્ડ અમાન્ય છે.",
    chatError: "માફ કરશો, કંઈક ખોટું થયું છે.",
    networkError: "નેટવર્ક ભૂલ. કૃપા કરી પાછું પ્રયત્ન કરો.",
    done: "થઈ ગયું! ✓",
    failed: "નિષ્ફળ ગયું.",
    noClassesAssigned: "હજી કોઈ વર્ગ સોંપાયો નથી. તમારા વર્ગ સોંપવા માટે એડમિનને પૂછો.",

    // Teacher sidebar nav
    overview: "ઝાંખી",
    lessonPlans: "પાઠ યોજના",
    assessments: "મૂલ્યાંકન",

    // Student header nav
    learn: "અભ્યાસ",
    myResults: "મારા પરિણામ",

    // Dashboard labels
    skillDistribution: "કૌશલ્ય વિતરણ",
    atRiskStudents: "જોખમમાં વિદ્યાર્થીઓ",
    totalStudents: "કુલ વિદ્યાર્થીઓ",
    avgClassRisk: "સરેરાશ વર્ગ જોખમ",
    remedial: "ઉપચારાત્મક",
    onTrack: "પ્રગતિમાં",
    advanced: "અદ્યતન",
    students: "વિદ્યાર્થીઓ",
    atRisk: "જોખમમાં",

    // Chat widget
    chatTitle: "શિક્ષક સહાયક",
    chatSubtitle: "IBM Granite દ્વારા સંચાલિત",
    chatPlaceholder: "તમારા વર્ગ વિશે પૂછો…",
    chatGreeting:
      "નમસ્તે! તમારા વર્ગ વિશે ગમે તે પૂછો — જેમ કે 'ભિન્નાંકોમાં કોણ પાછળ પડ્યું છે?'",
    chatThinking: "વિચારી રહ્યો છે…",

    // Feature cards
    feature1Title: "વ્યક્તિગત અભ્યાસ",
    feature1Desc: "દરેક વિદ્યાર્થીની ગતિ અનુસાર અનુકૂળ અભ્યાસ માર્ગ.",
    feature2Title: "AI પાઠ આયોજન",
    feature2Desc: "મિનિટોમાં અભ્યાસક્રમ-તૈયાર પાઠ યોજના બનાવો.",
    feature3Title: "રીઅલ-ટાઇમ આંતરદૃષ્ટિ",
    feature3Desc: "સ્પષ્ટ વર્ગ વિશ્લેષણ સાથે સહાયની જરૂર ધરાવતા વિદ્યાર્થીઓ શોધો.",

    // Student dashboard
    myProgress: "મારી પ્રગતિ",
    myProgressSub: "તમારું વર્તમાન કૌશલ્ય સ્તર અને શીખવાની ગતિ",
    riskScore: "જોખમ સ્કોર",
    learningPace: "શીખવાની ગતિ",
    masteryByTopic: "વિષય અનુસાર નિપુણતા",
    myRecommendations: "ભલામણ કરેલ સ્રોત",
    myRecommendationsSub: "તમારા અભ્યાસ માટે પસંદ કરેલા સ્રોત",
    noRecommendations: "હજી સુધી કોઈ ભલામણ નથી.",
    noRecommendationsSub: "ફીડ વ્યક્તિગત બનાવવા માટે મૂલ્યાંકન પૂર્ણ કરો.",
    subject: "વિષય",
    pace_slow: "ધીમો",
    pace_average: "સરેરાશ",
    pace_fast: "ઝડપી",
    trend_improving: "સુધારો ↑",
    trend_declining: "ઘટાડો ↓",
    trend_stable: "સ્થિર →",
  },

} as const;

export type DictKey = keyof typeof dict.en;

/** Translate a key into the selected language, falling back to English. */
export function t(key: DictKey, lang: Lang): string {
  return (dict[lang] as Record<string, string>)[key] ?? dict.en[key];
}

export default dict;
