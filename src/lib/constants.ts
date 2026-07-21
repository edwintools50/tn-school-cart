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
  OTHER: "Other Subject",
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
};
