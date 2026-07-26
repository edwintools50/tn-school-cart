export const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar",
] as const;

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  STATIONERY: "Stationery",
  FURNITURE: "Furniture",
  EDUCATIONAL_CONTENT: "Educational Content & Exam Guides",
  NOTEBOOKS: "Notebooks & Books",
  HEALTH_HYGIENE: "Health & Hygiene",
  SPORTS: "Sports Equipment",
  IT_ELECTRONICS: "IT, Electronics & Appliances",
  EXAM_PRINT_STATIONERY: "Exam & Print Stationery",
  UNIFORM_MERCHANDISE: "Uniforms & Merchandise",
  OTHER: "Other Supplies",
};

export const GIG_CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  TOILET_CLEANING: "Toilet Cleaning",
  GENERAL_CLEANING: "General & Room Cleaning",
  CARPENTRY: "Carpentry",
  PAINTING: "Painting / Whitewashing",
  PEST_CONTROL: "Pest Control",
  GARDENING: "Gardening / Campus Upkeep",
  IT_SUPPORT: "IT / Computer / Printer Support",
  RO_WATER_SERVICE: "RO Water Purifier Sales & Service",
  SMART_BOARD_CCTV: "Smart Board / CCTV / Broadband Installation",
  PRINTING_SERVICES: "Printing & Banner/Certificate Services",
  CATERING: "Tea / Snacks / Lunch Catering",
  STUDENT_STAFF_TRANSPORT: "Student & Staff Commute Vehicle",
  GOODS_TRANSPORT: "Goods Transport / Carrier Service",
  OTHER: "Other Gig Work",
};

export const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "School Principal / Head Master (Buyer)",
  SUPPLIER: "Supplier (Seller)",
  WORKER: "Gig Worker (Service Provider)",
  TEACHER: "Teacher (Job Seeker)",
  COACHING_CENTRE: "Coaching Centre (Recruiter)",
  ADMIN: "Admin",
};

export const TEACHING_SUBJECT_LABELS: Record<string, string> = {
  TAMIL: "Tamil",
  ENGLISH: "English",
  MATHS: "Maths",
  SCIENCE: "Science",
  SOCIAL_SCIENCE: "Social Science",
  COMPUTER_SCIENCE: "Computer Science",
  PHYSICAL_EDUCATION: "Physical Education",
  ARTS_CRAFT: "Arts & Craft",
  MUSIC: "Music",
  PRIMARY_TEACHER: "Primary Teacher (General)",
  SPECIAL_EDUCATOR: "Special Educator",
  LIBRARIAN: "Librarian",
  // PG Teacher (postgraduate subject) specializations
  PG_TAMIL: "PG Teacher - Tamil",
  PG_SPECIAL_TAMIL: "PG Teacher - Special Tamil",
  PG_ENGLISH: "PG Teacher - English",
  PG_HINDI: "PG Teacher - Hindi",
  PG_ARABIC: "PG Teacher - Arabic",
  PG_FRENCH: "PG Teacher - French",
  PG_MATHS: "PG Teacher - Maths",
  PG_PHYSICS: "PG Teacher - Physics",
  PG_CHEMISTRY: "PG Teacher - Chemistry",
  PG_BIOLOGY: "PG Teacher - Biology",
  PG_BOTANY: "PG Teacher - Botany",
  PG_ZOOLOGY: "PG Teacher - Zoology",
  PG_BIO_CHEMISTRY: "PG Teacher - Bio Chemistry",
  PG_MICRO_BIOLOGY: "PG Teacher - Micro Biology",
  PG_ACCOUNTANCY: "PG Teacher - Accountancy",
  PG_COMMERCE: "PG Teacher - Commerce",
  PG_HISTORY: "PG Teacher - History",
  PG_ECONOMICS: "PG Teacher - Economics",
  PG_BUSINESS_MATHS: "PG Teacher - Business Maths",
  PG_STATISTICS: "PG Teacher - Statistics",
  PG_COMPUTER_SCIENCE: "PG Teacher - Computer Science",
  PG_POLITICAL_SCIENCE: "PG Teacher - Political Science",
  PG_NURSING: "PG Teacher - Nursing",
  PG_PSYCHOLOGY: "PG Teacher - Psychology",
  PG_SOCIOLOGY: "PG Teacher - Sociology",
  PG_VOCATIONAL_OFFICE_MANAGEMENT: "PG Teacher - Vocational (Office Management)",
  PG_VOCATIONAL_GENERAL_NURSING: "PG Teacher - Vocational (General Nursing)",
  PG_VOCATIONAL_NUTRITION_DIETETICS: "PG Teacher - Vocational (Nutrition & Dietetics)",
  PG_VOCATIONAL_BASIC_ENGINEERING: "PG Teacher - Vocational (Basic Engineering)",
  PG_VOCATIONAL_TEXTILE_TECHNOLOGY: "PG Teacher - Vocational (Textile Technology)",
  // Competitive-exam coaching experts
  NEET_EXPERT_BIOLOGY: "NEET Expert - Biology",
  NEET_EXPERT_BOTANY: "NEET Expert - Botany",
  NEET_EXPERT_PHYSICS: "NEET Expert - Physics",
  NEET_EXPERT_CHEMISTRY: "NEET Expert - Chemistry",
  NEET_EXPERT_ZOOLOGY: "NEET Expert - Zoology",
  JEE_MAIN_EXPERT_PHYSICS: "JEE (Main) Expert - Physics",
  JEE_MAIN_EXPERT_CHEMISTRY: "JEE (Main) Expert - Chemistry",
  JEE_MAIN_EXPERT_MATHS: "JEE (Main) Expert - Maths",
  JEE_ADVANCED_EXPERT_PHYSICS: "JEE (Advanced) Expert - Physics",
  JEE_ADVANCED_EXPERT_CHEMISTRY: "JEE (Advanced) Expert - Chemistry",
  JEE_ADVANCED_EXPERT_MATHS: "JEE (Advanced) Expert - Maths",
  // TET (Teacher Eligibility Test) coaching experts
  TET_PAPER_I_EXPERT_TAMIL: "TET Paper I Expert - Tamil",
  TET_PAPER_I_EXPERT_ENGLISH: "TET Paper I Expert - English",
  TET_PAPER_I_EXPERT_MATHS: "TET Paper I Expert - Maths",
  TET_PAPER_I_EXPERT_SCIENCE: "TET Paper I Expert - Science",
  TET_PAPER_I_EXPERT_SOCIAL: "TET Paper I Expert - Social Science",
  TET_PAPER_II_EXPERT_TAMIL: "TET Paper II Expert - Tamil",
  TET_PAPER_II_EXPERT_ENGLISH: "TET Paper II Expert - English",
  TET_PAPER_II_EXPERT_MATHS: "TET Paper II Expert - Maths",
  TET_PAPER_II_EXPERT_SCIENCE: "TET Paper II Expert - Science",
  TET_PAPER_II_EXPERT_SOCIAL: "TET Paper II Expert - Social Science",
  OTHER: "Other Subject",
};

// Grouped view of TEACHING_SUBJECT_LABELS for <optgroup>-rendered dropdowns —
// the flat list above is 60+ options, unusable without grouping.
export const TEACHING_SUBJECT_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "School Subjects",
    keys: [
      "TAMIL", "ENGLISH", "MATHS", "SCIENCE", "SOCIAL_SCIENCE", "COMPUTER_SCIENCE",
      "PHYSICAL_EDUCATION", "ARTS_CRAFT", "MUSIC", "PRIMARY_TEACHER",
      "SPECIAL_EDUCATOR", "LIBRARIAN",
    ],
  },
  {
    label: "PG Teacher Specializations",
    keys: [
      "PG_TAMIL", "PG_SPECIAL_TAMIL", "PG_ENGLISH", "PG_HINDI", "PG_ARABIC", "PG_FRENCH",
      "PG_MATHS", "PG_PHYSICS", "PG_CHEMISTRY", "PG_BIOLOGY", "PG_BOTANY", "PG_ZOOLOGY",
      "PG_BIO_CHEMISTRY", "PG_MICRO_BIOLOGY", "PG_ACCOUNTANCY", "PG_COMMERCE", "PG_HISTORY",
      "PG_ECONOMICS", "PG_BUSINESS_MATHS", "PG_STATISTICS", "PG_COMPUTER_SCIENCE",
      "PG_POLITICAL_SCIENCE", "PG_NURSING", "PG_PSYCHOLOGY", "PG_SOCIOLOGY",
      "PG_VOCATIONAL_OFFICE_MANAGEMENT", "PG_VOCATIONAL_GENERAL_NURSING",
      "PG_VOCATIONAL_NUTRITION_DIETETICS", "PG_VOCATIONAL_BASIC_ENGINEERING",
      "PG_VOCATIONAL_TEXTILE_TECHNOLOGY",
    ],
  },
  {
    label: "NEET / JEE Coaching Experts",
    keys: [
      "NEET_EXPERT_BIOLOGY", "NEET_EXPERT_BOTANY", "NEET_EXPERT_PHYSICS",
      "NEET_EXPERT_CHEMISTRY", "NEET_EXPERT_ZOOLOGY",
      "JEE_MAIN_EXPERT_PHYSICS", "JEE_MAIN_EXPERT_CHEMISTRY", "JEE_MAIN_EXPERT_MATHS",
      "JEE_ADVANCED_EXPERT_PHYSICS", "JEE_ADVANCED_EXPERT_CHEMISTRY", "JEE_ADVANCED_EXPERT_MATHS",
    ],
  },
  {
    label: "TET Coaching Experts",
    keys: [
      "TET_PAPER_I_EXPERT_TAMIL", "TET_PAPER_I_EXPERT_ENGLISH", "TET_PAPER_I_EXPERT_MATHS",
      "TET_PAPER_I_EXPERT_SCIENCE", "TET_PAPER_I_EXPERT_SOCIAL",
      "TET_PAPER_II_EXPERT_TAMIL", "TET_PAPER_II_EXPERT_ENGLISH", "TET_PAPER_II_EXPERT_MATHS",
      "TET_PAPER_II_EXPERT_SCIENCE", "TET_PAPER_II_EXPERT_SOCIAL",
    ],
  },
  {
    label: "Other",
    keys: ["OTHER"],
  },
];

// A curated slice of TEACHING_SUBJECT_LABELS for the home page's "browse by
// subject" tiles — the full list is 60+ entries, fine in a grouped <select>
// but unusable as a flat tile grid.
export const POPULAR_TEACHING_SUBJECTS: string[] = [
  "TAMIL", "ENGLISH", "MATHS", "SCIENCE", "SOCIAL_SCIENCE", "COMPUTER_SCIENCE",
  "PRIMARY_TEACHER", "SPECIAL_EDUCATOR",
  "PG_PHYSICS", "PG_CHEMISTRY", "PG_BIOLOGY", "PG_COMMERCE",
  "NEET_EXPERT_BIOLOGY", "JEE_MAIN_EXPERT_MATHS",
  "TET_PAPER_I_EXPERT_TAMIL", "TET_PAPER_II_EXPERT_ENGLISH",
];

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
};

export const COACHING_MODE_LABELS: Record<string, string> = {
  OFFLINE: "Offline / In-person",
  ONLINE: "Online",
  HYBRID: "Hybrid (Offline + Online)",
};

export const COMPETITIVE_EXAM_LABELS: Record<string, string> = {
  NEET: "NEET (UG)",
  JEE_MAIN: "JEE (Main)",
  JEE_ADVANCED: "JEE (Advanced)",
  CUET: "CUET",
  CLAT: "CLAT",
  TET: "TET (Paper I & II)",
  BANK_SSC_RAILWAYS: "Bank / SSC / Railways Recruitment",
  OTHER: "Other Competitive Exam",
};
