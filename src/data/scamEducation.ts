export interface ScamGuide {
  id: string;
  title: string;
  category: 'Scholarship' | 'Recruitment' | 'Impersonation' | 'Phishing' | 'Messaging';
  summary: string;
  commonTactics: string[];
  redFlags: string[];
  verificationSteps: string[];
  educationalExample: string;
}

export interface QuizQuestion {
  id: string;
  scenarioTitle: string;
  snippet: string;
  question: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  takeaway: string;
}

export const SCAM_EDUCATION_GUIDES: ScamGuide[] = [
  {
    id: 'fake-scholarships',
    title: 'Fake Scholarship Advertisements',
    category: 'Scholarship',
    summary:
      'Fraudulent posts promising full tuition or generous monthly stipends in exchange for upfront "seat reservation," "visa processing," or "insurance" payments.',
    commonTactics: [
      'Using names almost identical to prestigious national or university fellowships.',
      'Claiming selection happened "without an interview" via a special committee.',
      'Requesting small upfront fees ($50–$300) into personal wallets or money-transfer agents.',
    ],
    redFlags: [
      'Payment requested to a personal bank account, mobile wallet, crypto, or gift card.',
      'Short countdown timers (e.g., 4–24 hours) threatening forfeiture.',
      'Official-sounding letter sent from @gmail.com or @outlook.com.',
    ],
    verificationSteps: [
      'Locate the university or ministry website via an independent search—never via links inside the message.',
      'Confirm whether the scholarship exists on the institution’s official financial aid portal.',
    ],
    educationalExample:
      'Educational example: "You are awarded a 100% Global Merit Grant. Send $150 refundable documentation fee to our coordinator’s mobile wallet within 6 hours."',
  },
  {
    id: 'recruitment-payment-scams',
    title: 'Recruitment & Equipment Payment Scams',
    category: 'Recruitment',
    summary:
      'Fake employers conduct rapid text-only interviews and then demand payment for "background checks," "training kits," "work permits," or "software licenses."',
    commonTactics: [
      'Sending a counterfeit check and asking you to wire part of it to a "vendor" for home-office equipment.',
      'Charging a refundable security deposit before issuing an onboarding laptop.',
    ],
    redFlags: [
      'Upfront fee required before starting work or receiving an official contract.',
      'Salary far above market rate for entry-level tasks with minimal screening.',
    ],
    verificationSteps: [
      'Legitimate employers deduct payroll taxes and supply equipment directly—they never ask candidates to pay vendors.',
      'Call the company’s published corporate phone number to confirm the recruiter’s identity.',
    ],
    educationalExample:
      'Educational example: "Welcome aboard! Deposit $250 for your verified remote-work security token, reimbursed on your first paycheck."',
  },
  {
    id: 'university-impersonation',
    title: 'University & Embassy Impersonation',
    category: 'Impersonation',
    summary:
      'Attackers copy official university crests, faculty names, and letterhead into PDF offer letters while routing replies to lookalike domains.',
    commonTactics: [
      'Registering domains like university-admissions-office.org instead of the official .edu / .ac.uk domain.',
      'Copying real professor signatures from public faculty pages.',
    ],
    redFlags: [
      'Domain in the "Reply-To" header or footer differs from the university’s real web domain.',
      'Pressure to keep the admission letter confidential from campus advisors.',
    ],
    verificationSteps: [
      'Compare the sender domain character-by-character with the university’s real domain.',
      'Forward suspicious offer letters to the university’s official admissions office.',
    ],
    educationalExample:
      'Educational example: A PDF letter bearing a stolen university logo directs tuition deposits to "admissions-portal-verify.com".',
  },
  {
    id: 'fake-wfh-offers',
    title: 'Fake Work-From-Home & Task Scams',
    category: 'Recruitment',
    summary:
      'Unsolicited messages offering high daily pay for simple online tasks (liking videos, reviewing apps, data entry) that escalate into "VIP deposit" traps.',
    commonTactics: [
      'Paying a tiny initial reward ($5–$15) to build trust, then requiring larger deposits to unlock "commission tiers."',
      'Showing fake dashboard balances that freeze until you top up more funds.',
    ],
    redFlags: [
      'Paying money to unlock higher-paying work tasks.',
      'Recruiters operating exclusively on Telegram or WhatsApp without a verifiable company.',
    ],
    verificationSteps: [
      'Never pay out-of-pocket to unlock wages or task batches.',
      'Verify the company’s legal registration and official careers site.',
    ],
    educationalExample:
      'Educational example: "Earn $300/day rating products from home—deposit $100 USDT to activate your merchant workbench."',
  },
  {
    id: 'internship-certificate-scams',
    title: 'Pay-to-Play Internship Certificate Scams',
    category: 'Recruitment',
    summary:
      'Programs targeting students desperate for resume credentials by charging fees for "guaranteed internship completion certificates" with no real mentorship.',
    commonTactics: [
      'Marketing as an "elite virtual internship" partnered with major tech firms without proof.',
      'Requiring a certificate issuance fee or "exam fee" after an automated acceptance email.',
    ],
    redFlags: [
      'Unverified claims of "ISO" or Fortune-500 partnership badges.',
      'Everyone who applies is accepted instantly and billed a registration fee.',
    ],
    verificationSteps: [
      'Ask your university career center whether the organization is a vetted internship partner.',
      'Note that legitimate training bootcamps clearly disclose tuition upfront; they do not disguise tuition as a paid job offer.',
    ],
    educationalExample:
      'Educational example: "Congrats on passing! Pay $49 registration fee today to receive your Tech Giant Partnered Internship Offer Letter."',
  },
  {
    id: 'phishing-emails',
    title: 'Lookalike Phishing Emails',
    category: 'Phishing',
    summary:
      'Crafted emails mimicking LinkedIn, HR portals, or scholarship systems with deceptive hyperlinks or homoglyph lookalike domains.',
    commonTactics: [
      'Using Cyrillic or accented lookalike letters (homoglyphs) or deceptive subdomains like linkedin.verify-login.top.',
      'Embedding urgent "Account Suspended" or "Pending Offer Expiring" lures.',
    ],
    redFlags: [
      'Hovering over a button reveals an unrelated destination domain.',
      'Shortened links (bit.ly, tinyurl) used for sensitive sign-in screens.',
    ],
    verificationSteps: [
      'Type the official platform URL manually in a new browser tab instead of clicking email links.',
      'Check if the message appears inside your authenticated portal inbox.',
    ],
    educationalExample:
      'Educational example: An email styled like a job board asks you to log in via "https://careers-portal.secure-check.xyz" to view an interview invite.',
  },
  {
    id: 'credential-theft',
    title: 'OTP & Credential Harvesting',
    category: 'Phishing',
    summary:
      'Messages asking for your email password, banking PIN, passport copy, or SMS one-time passcode (OTP) under the guise of "payroll verification."',
    commonTactics: [
      'Claiming HR needs your 6-digit SMS code to "link your direct deposit" or "confirm your identity."',
      'Collecting high-resolution national ID + selfie photos before any real interview.',
    ],
    redFlags: [
      'Any request for passwords, PINs, or OTP verification codes.',
      'Requests for sensitive government IDs over chat apps before a verified interview.',
    ],
    verificationSteps: [
      'Never share passwords or OTP codes—no legitimate support agent or recruiter will ever ask for them.',
      'Use official HR onboarding portals only after verifying your employer.',
    ],
    educationalExample:
      'Educational example: "Reply with the 6-digit code just sent to your phone so our HR bot can verify your university email."',
  },
  {
    id: 'whatsapp-recruitment',
    title: 'Suspicious WhatsApp & Telegram Recruitment',
    category: 'Messaging',
    summary:
      'Unsolicited messages from unknown international numbers claiming to be "HR Managers" from well-known agencies.',
    commonTactics: [
      'Starting with vague praise ("Your resume was shortlisted by our HR team") without naming the role you applied for.',
      'Moving candidates off official job boards onto encrypted messaging apps.',
    ],
    redFlags: [
      'Recruiter refuses to send confirmation from an official corporate email domain.',
      'Interview consists solely of a Telegram chat followed by an instant offer.',
    ],
    verificationSteps: [
      'Ask the recruiter to email you from their verified corporate domain.',
      'Check your own job-application tracker to confirm you actually applied.',
    ],
    educationalExample:
      'Educational example: "Hi, I am Sophia from Global Talent HR. We found your number for a $60/hr part-time role. Message our director on Telegram @hr_director99."',
  },
];

export const RED_FLAG_QUIZ: QuizQuestion[] = [
  {
    id: 'quiz-1',
    scenarioTitle: 'Scholarship Acceptance Notice',
    snippet:
      '"Dear Applicant, you have been selected for the Excellence Merit Award ($15,000). Please send $120 via bank transfer to Coordinator J. Khan before 5:00 PM today to avoid losing your slot, and reply to award.office.desk@gmail.com."',
    question: 'Which combination of signals is the clearest indicator of a scam risk?',
    options: [
      {
        id: 'q1-a',
        label: 'The award amount is $15,000, which is large.',
        isCorrect: false,
        feedback:
          'Many legitimate merit scholarships exceed $15,000. Award size alone is not proof of fraud.',
      },
      {
        id: 'q1-b',
        label:
          'Same-day payment to an individual’s account paired with a free Gmail address.',
        isCorrect: true,
        feedback:
          'Correct. Legitimate institutions do not collect fees into personal accounts or run official awards from free Gmail accounts under a same-day ultimatum.',
      },
      {
        id: 'q1-c',
        label: 'The greeting starts with "Dear Applicant".',
        isCorrect: false,
        feedback:
          'While generic greetings are worth noting, large automated announcements sometimes use generic salutations.',
      },
    ],
    takeaway:
      'Always evaluate financial requests, sender domain authenticity, and artificial urgency together.',
  },
  {
    id: 'quiz-2',
    scenarioTitle: 'Internship Payroll Onboarding',
    snippet:
      '"To activate your stipend, log in at https://portal-login.university-stipend.top and reply with the 6-digit verification code sent to your phone."',
    question: 'What is the most critical immediate danger in this message?',
    options: [
      {
        id: 'q2-a',
        label: 'The stipend uses HTTPS, which means it is encrypted and safe.',
        isCorrect: false,
        feedback:
          'Incorrect. Phishing sites routinely have free HTTPS certificates. HTTPS only encrypts traffic to the attacker’s server—it does not prove legitimacy.',
      },
      {
        id: 'q2-b',
        label: 'The message harvests login credentials and an OTP on a lookalike .top domain.',
        isCorrect: true,
        feedback:
          'Correct. Requesting a login plus a 6-digit OTP on an unofficial subdomain is a direct account-takeover attack.',
      },
      {
        id: 'q2-c',
        label: 'It mentions a 6-digit code instead of a 4-digit code.',
        isCorrect: false,
        feedback:
          'Legitimate 2FA codes are often 6 digits—the red flag is being asked to share that code or enter it on an unofficial domain.',
      },
    ],
    takeaway:
      'Never rely on HTTPS alone as proof of trust, and never share OTP verification codes.',
  },
  {
    id: 'quiz-3',
    scenarioTitle: 'Short Text Snippet',
    snippet: '"Congratulations! Your profile has been shortlisted for Phase 2."',
    question: 'How should a responsible fraud-analysis system classify this message alone?',
    options: [
      {
        id: 'q3-a',
        label: '95/100 High Risk Fraud immediately.',
        isCorrect: false,
        feedback:
          'Incorrect. Assigning a high fraud score to a single vague sentence with no sender or financial ask would be arbitrary.',
      },
      {
        id: 'q3-b',
        label: '0/100 Officially Verified Genuine.',
        isCorrect: false,
        feedback:
          'Incorrect. Absence of red flags in a short snippet does not verify that the sender is legitimate.',
      },
      {
        id: 'q3-c',
        label: 'Insufficient Evidence — request sender details, org name, and full context.',
        isCorrect: true,
        feedback:
          'Correct. Responsible evidence-based analysis avoids guessing a score when crucial context is missing.',
      },
    ],
    takeaway:
      'Trustworthy risk scoring refuses to fabricate confidence when evidence is incomplete.',
  },
  {
    id: 'quiz-4',
    scenarioTitle: 'Cross-Border Remote Internship',
    snippet:
      '"TechBridge Labs (https://techbridgelabs.org) is recruiting remote junior QA interns ($18/hr). Notice: applicants must have strong written English; minor grammatical variations in local notices are okay. Two technical interviews required; zero fees charged."',
    question: 'Should minor grammar mistakes automatically flag an international opportunity as fraudulent?',
    options: [
      {
        id: 'q4-a',
        label: 'Yes, any grammar error proves an international offer is a scam.',
        isCorrect: false,
        feedback:
          'Incorrect. Multilingual teams and regional postings may contain minor phrasing differences while remaining completely genuine.',
      },
      {
        id: 'q4-b',
        label:
          'No — evaluate substance (domain alignment, interview process, absence of fees) with cultural awareness.',
        isCorrect: true,
        feedback:
          'Correct. Ethical fraud analysis avoids penalizing regional phrasing and focuses on verifiable identity, financial, and security risks.',
      },
    ],
    takeaway:
      'Always evaluate verifiable evidence rather than stereotyping regional origin or minor phrasing quirks.',
  },
];
