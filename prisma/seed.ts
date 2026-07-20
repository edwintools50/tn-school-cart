import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env before running the seed script.");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const db = new PrismaClient({ adapter });

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "PRINCIPAL" | "SUPPLIER" | "WORKER" | "ADMIN";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  schoolName?: string;
  udiseNumber?: string;
  district?: string;
  businessName?: string;
  serviceArea?: string;
}) {
  const passwordHash = await hash(data.password);
  return db.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role,
      status: data.status ?? "APPROVED",
      schoolName: data.schoolName,
      udiseNumber: data.udiseNumber,
      district: data.district,
      businessName: data.businessName,
      serviceArea: data.serviceArea,
    },
  });
}

async function main() {
  console.log("Seeding TN School Cart...");

  const admin = await upsertUser({
    name: "TN School Cart Admin",
    email: "admin@tnschoolcart.in",
    password: "admin123",
    phone: "9840000000",
    role: "ADMIN",
  });

  const stationerySupplier = await upsertUser({
    name: "R. Kumaresan",
    email: "supplier.saraswathi@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011111",
    role: "SUPPLIER",
    businessName: "Sri Saraswathi Stationery Mart",
    serviceArea: "Coimbatore",
  });

  const furnitureSupplier = await upsertUser({
    name: "M. Anandan",
    email: "supplier.annafurniture@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011112",
    role: "SUPPLIER",
    businessName: "Anna Furniture Works",
    serviceArea: "Madurai",
  });

  const eduSupplier = await upsertUser({
    name: "P. Lakshmi",
    email: "supplier.edutech@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011113",
    role: "SUPPLIER",
    businessName: "EduTech Learning Resources",
    serviceArea: "Chennai",
  });

  const pendingSupplier = await upsertUser({
    name: "S. Bala",
    email: "supplier.newmart@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011114",
    role: "SUPPLIER",
    status: "PENDING",
    businessName: "New Horizon Supplies",
    serviceArea: "Salem",
  });

  const plumber = await upsertUser({
    name: "K. Murugan",
    email: "worker.murugan@tnschoolcart.in",
    password: "worker123",
    phone: "9840022221",
    role: "WORKER",
    businessName: "Murugan Plumbing Services",
    serviceArea: "Chennai",
  });

  const electrician = await upsertUser({
    name: "V. Karthik",
    email: "worker.brightspark@tnschoolcart.in",
    password: "worker123",
    phone: "9840022222",
    role: "WORKER",
    businessName: "Bright Spark Electricals",
    serviceArea: "Coimbatore",
  });

  const cleaner = await upsertUser({
    name: "S. Meena",
    email: "worker.cleanpro@tnschoolcart.in",
    password: "worker123",
    phone: "9840022223",
    role: "WORKER",
    businessName: "CleanPro Facility Services",
    serviceArea: "Madurai",
  });

  const pendingWorker = await upsertUser({
    name: "T. Ravi",
    email: "worker.newcarpentry@tnschoolcart.in",
    password: "worker123",
    phone: "9840022224",
    role: "WORKER",
    status: "PENDING",
    businessName: "Ravi Carpentry Works",
    serviceArea: "Trichy",
  });

  const principal2 = await upsertUser({
    name: "R. Selvam",
    email: "principal.selvam@tnschoolcart.in",
    password: "principal123",
    phone: "9840033332",
    role: "PRINCIPAL",
    schoolName: "Government Higher Secondary School, Anna Nagar",
    udiseNumber: "33070100601",
    district: "Madurai",
  });

  const digitalPrintSupplier = await upsertUser({
    name: "A. Saravanan",
    email: "supplier.digitalprint@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011115",
    role: "SUPPLIER",
    businessName: "TN Digital & Print Solutions",
    serviceArea: "Chennai",
  });

  const aquapureSupplier = await upsertUser({
    name: "N. Vignesh",
    email: "supplier.aquapure@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011116",
    role: "SUPPLIER",
    businessName: "AquaPure Water Solutions",
    serviceArea: "Coimbatore",
  });

  const sportsUniformSupplier = await upsertUser({
    name: "K. Priya",
    email: "supplier.championsports@tnschoolcart.in",
    password: "supplier123",
    phone: "9840011117",
    role: "SUPPLIER",
    businessName: "Champion Sports & Uniforms",
    serviceArea: "Madurai",
  });

  const techcareWorker = await upsertUser({
    name: "J. Arun",
    email: "worker.techcare@tnschoolcart.in",
    password: "worker123",
    phone: "9840022225",
    role: "WORKER",
    businessName: "TechCare IT & AV Services",
    serviceArea: "Chennai",
  });

  const painterWorker = await upsertUser({
    name: "D. Suresh",
    email: "worker.colortouch@tnschoolcart.in",
    password: "worker123",
    phone: "9840022226",
    role: "WORKER",
    businessName: "ColorTouch Painters",
    serviceArea: "Tiruchirappalli",
  });

  const cateringWorker = await upsertUser({
    name: "L. Kavitha",
    email: "worker.annapoorna@tnschoolcart.in",
    password: "worker123",
    phone: "9840022227",
    role: "WORKER",
    businessName: "Annapoorna Catering Services",
    serviceArea: "Chennai",
  });

  const transportWorker = await upsertUser({
    name: "P. Mohan",
    email: "worker.safetransit@tnschoolcart.in",
    password: "worker123",
    phone: "9840022228",
    role: "WORKER",
    businessName: "Safe Transit School Travels",
    serviceArea: "Chennai",
  });

  console.log("Users ready:", {
    admin: admin.email,
    stationerySupplier: stationerySupplier.email,
    furnitureSupplier: furnitureSupplier.email,
    eduSupplier: eduSupplier.email,
    pendingSupplier: pendingSupplier.email,
    plumber: plumber.email,
    electrician: electrician.email,
    cleaner: cleaner.email,
    pendingWorker: pendingWorker.email,
    principal2: principal2.email,
    digitalPrintSupplier: digitalPrintSupplier.email,
    aquapureSupplier: aquapureSupplier.email,
    sportsUniformSupplier: sportsUniformSupplier.email,
    techcareWorker: techcareWorker.email,
    painterWorker: painterWorker.email,
    cateringWorker: cateringWorker.email,
    transportWorker: transportWorker.email,
  });

  const productSeed = [
    {
      supplierId: stationerySupplier.id,
      title: "Ruled Notebook 200 Pages (Pack of 10)",
      description: "Long-lasting ruled exercise notebooks, 200 pages each, ideal for daily classroom use.",
      category: "NOTEBOOKS" as const,
      price: 480,
      unit: "pack of 10",
      stock: 500,
    },
    {
      supplierId: stationerySupplier.id,
      title: "Blue Ball Pens (Box of 50)",
      description: "Smooth-writing blue ball pens, box of 50, suitable for staff and student use.",
      category: "STATIONERY" as const,
      price: 350,
      unit: "box of 50",
      stock: 300,
    },
    {
      supplierId: stationerySupplier.id,
      title: "Wax Crayons 12-Shade Set (Pack of 20)",
      description: "Non-toxic wax crayons for primary school art classes, 12 shades per set.",
      category: "STATIONERY" as const,
      price: 900,
      unit: "pack of 20 sets",
      stock: 150,
    },
    {
      supplierId: furnitureSupplier.id,
      title: "Dual-Seater Student Desk & Bench",
      description: "Sturdy powder-coated steel frame dual-seater desk and bench set for classrooms.",
      category: "FURNITURE" as const,
      price: 4200,
      unit: "set",
      stock: 60,
    },
    {
      supplierId: furnitureSupplier.id,
      title: "Teacher's Table with Drawer",
      description: "Solid wood-finish teacher's table with a lockable drawer.",
      category: "FURNITURE" as const,
      price: 5600,
      unit: "piece",
      stock: 25,
    },
    {
      supplierId: furnitureSupplier.id,
      title: "Steel Bookshelf (5 Shelves)",
      description: "Rust-resistant steel bookshelf with 5 adjustable shelves for the school library.",
      category: "FURNITURE" as const,
      price: 6800,
      unit: "piece",
      stock: 20,
    },
    {
      supplierId: eduSupplier.id,
      title: "Tamil Nadu State Board Science Chart Set (Class 6-8)",
      description: "Laminated wall charts covering key science topics for classes 6 to 8, TN State Board aligned.",
      category: "EDUCATIONAL_CONTENT" as const,
      price: 1200,
      unit: "set of 10",
      stock: 100,
    },
    {
      supplierId: eduSupplier.id,
      title: "World & India Political Map Combo",
      description: "Large laminated wall maps of the world and India, political edition.",
      category: "EDUCATIONAL_CONTENT" as const,
      price: 850,
      unit: "combo",
      stock: 80,
    },
    {
      supplierId: eduSupplier.id,
      title: "Classroom Digital Learning Kit (Tablet + Content)",
      description: "Preloaded tablet with TN State Board digital learning content for classes 6-10.",
      category: "EDUCATIONAL_CONTENT" as const,
      price: 8500,
      unit: "kit",
      stock: 15,
    },
    {
      supplierId: stationerySupplier.id,
      title: "First-Aid Kit for School Sick Room",
      description: "Comprehensive first-aid kit including bandages, antiseptics and basic medical supplies.",
      category: "HEALTH_HYGIENE" as const,
      price: 1500,
      unit: "kit",
      stock: 40,
    },
    {
      supplierId: stationerySupplier.id,
      title: "Liquid Hand Wash 5L (Case of 4)",
      description: "Dermatologically tested liquid hand wash, 5 litre cans, case of 4.",
      category: "HEALTH_HYGIENE" as const,
      price: 2100,
      unit: "case of 4",
      stock: 60,
    },
    {
      supplierId: furnitureSupplier.id,
      title: "Sanitary Napkin Vending Machine",
      description: "Coin-free sanitary napkin dispensing unit for girls' washrooms, wall-mountable.",
      category: "HEALTH_HYGIENE" as const,
      price: 7200,
      unit: "unit",
      stock: 10,
    },
    {
      supplierId: eduSupplier.id,
      title: "Competitive Exam Guide Books (TNPSC / NEET / JEE Foundation)",
      description: "School guides and reference books for TNPSC, NEET and JEE foundation preparation, classes 10-12.",
      category: "EDUCATIONAL_CONTENT" as const,
      price: 350,
      unit: "book",
      stock: 200,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "Laser Printer (All-in-One)",
      description: "Print, scan and copy laser printer suitable for school office and staff room use.",
      category: "IT_ELECTRONICS" as const,
      price: 12000,
      unit: "piece",
      stock: 20,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "Desktop PC (Office Configuration)",
      description: "Branded desktop computer with monitor, keyboard and mouse, suitable for office and computer lab use.",
      category: "IT_ELECTRONICS" as const,
      price: 28000,
      unit: "piece",
      stock: 15,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "Toner Cartridge (Compatible, Black)",
      description: "Compatible black toner cartridge for common office laser printer models.",
      category: "IT_ELECTRONICS" as const,
      price: 1800,
      unit: "piece",
      stock: 100,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "Interactive Smart Board 65-inch",
      description: "Touch-enabled interactive smart board for classrooms, with stand and installation kit.",
      category: "IT_ELECTRONICS" as const,
      price: 65000,
      unit: "piece",
      stock: 8,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "CCTV Camera Kit (4-Channel with DVR)",
      description: "4-channel CCTV camera kit with DVR, cables and night-vision cameras for campus security.",
      category: "IT_ELECTRONICS" as const,
      price: 15000,
      unit: "kit",
      stock: 25,
    },
    {
      supplierId: aquapureSupplier.id,
      title: "RO Water Purifier (Wall-Mounted, 15L)",
      description: "Wall-mounted RO+UV water purifier with 15L storage, suitable for school staff rooms and canteens.",
      category: "IT_ELECTRONICS" as const,
      price: 9500,
      unit: "piece",
      stock: 30,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "A4 Copier Paper (Box of 5 Reams)",
      description: "75 GSM A4 copier paper, box of 5 reams, for daily office and classroom printing needs.",
      category: "EXAM_PRINT_STATIONERY" as const,
      price: 1100,
      unit: "box of 5 reams",
      stock: 200,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "OMR Answer Sheets (Pack of 100)",
      description: "Machine-readable OMR answer sheets for objective-type examinations, pack of 100.",
      category: "EXAM_PRINT_STATIONERY" as const,
      price: 450,
      unit: "pack of 100",
      stock: 300,
    },
    {
      supplierId: digitalPrintSupplier.id,
      title: "Ruled Exam Answer Booklets (Pack of 100)",
      description: "Ruled answer booklets for school and board exams, pack of 100.",
      category: "EXAM_PRINT_STATIONERY" as const,
      price: 900,
      unit: "pack of 100",
      stock: 150,
    },
    {
      supplierId: sportsUniformSupplier.id,
      title: "School Shoes (Black, Pair)",
      description: "Durable black school shoes for daily student wear, available in bulk sizes.",
      category: "UNIFORM_MERCHANDISE" as const,
      price: 450,
      unit: "pair",
      stock: 300,
    },
    {
      supplierId: sportsUniformSupplier.id,
      title: "School T-Shirts (House Colors, Pack of 10)",
      description: "House-color sports T-shirts for annual day and sports events, pack of 10.",
      category: "UNIFORM_MERCHANDISE" as const,
      price: 2200,
      unit: "pack of 10",
      stock: 100,
    },
    {
      supplierId: sportsUniformSupplier.id,
      title: "Sports Trophies (Assorted Sizes, Set of 5)",
      description: "Assorted-size trophies for annual sports day and inter-school competitions, set of 5.",
      category: "UNIFORM_MERCHANDISE" as const,
      price: 3500,
      unit: "set of 5",
      stock: 40,
    },
    {
      supplierId: sportsUniformSupplier.id,
      title: "Championship Shields (Wooden Finish)",
      description: "Wooden-finish championship shields for award ceremonies and annual day functions.",
      category: "UNIFORM_MERCHANDISE" as const,
      price: 850,
      unit: "piece",
      stock: 60,
    },
  ];

  for (const p of productSeed) {
    const existing = await db.product.findFirst({
      where: { supplierId: p.supplierId, title: p.title },
    });
    if (!existing) {
      await db.product.create({ data: { ...p, status: "APPROVED" } });
    }
  }

  // One pending product awaiting review, to populate the admin moderation queue.
  const pendingProductExisting = await db.product.findFirst({
    where: { supplierId: pendingSupplier.id, title: "Assorted Notice Boards" },
  });
  if (!pendingProductExisting) {
    await db.product.create({
      data: {
        supplierId: pendingSupplier.id,
        title: "Assorted Notice Boards",
        description: "Cork and magnetic notice boards in various sizes for staff rooms and corridors.",
        category: "FURNITURE",
        price: 1800,
        unit: "piece",
        stock: 30,
        status: "PENDING",
      },
    });
  }

  const serviceSeed = [
    {
      workerId: plumber.id,
      category: "PLUMBING" as const,
      title: "Complete Plumbing Repairs & Installation",
      description: "Pipe leak repairs, tap and washroom fittings, water tank maintenance for schools.",
      priceType: "HOURLY",
      price: 350,
      serviceArea: "Chennai",
    },
    {
      workerId: electrician.id,
      category: "ELECTRICAL" as const,
      title: "Licensed Electrician - Wiring & Repairs",
      description: "Classroom and lab wiring, fan/light installation, electrical safety checks.",
      priceType: "HOURLY",
      price: 400,
      serviceArea: "Coimbatore",
    },
    {
      workerId: cleaner.id,
      category: "TOILET_CLEANING" as const,
      title: "Toilet & Washroom Deep Cleaning",
      description: "Deep cleaning and sanitisation of student and staff washrooms, weekly or one-time.",
      priceType: "FIXED",
      price: 2500,
      serviceArea: "Madurai",
    },
    {
      workerId: cleaner.id,
      category: "GENERAL_CLEANING" as const,
      title: "Full Campus General Cleaning",
      description: "Classroom, corridor and campus ground cleaning service for schools.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Madurai",
    },
    {
      workerId: electrician.id,
      category: "IT_SUPPORT" as const,
      title: "Computer Lab Setup & Maintenance",
      description: "Desktop setup, networking and annual maintenance for school computer labs.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Coimbatore",
    },
    {
      workerId: cleaner.id,
      category: "GENERAL_CLEANING" as const,
      title: "Classroom & Staff Room Cleaning",
      description: "Daily or weekly cleaning of classrooms, staff rooms and common areas.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Madurai",
    },
    {
      workerId: techcareWorker.id,
      category: "IT_SUPPORT" as const,
      title: "Desktop PC, Printer & Toner AMC Service",
      description: "Annual maintenance contract for desktop PCs and printers, including cartridge refill and toner service.",
      priceType: "HOURLY",
      price: 300,
      serviceArea: "Chennai",
    },
    {
      workerId: techcareWorker.id,
      category: "SMART_BOARD_CCTV" as const,
      title: "Smart Board / CCTV / Broadband Installation",
      description: "Installation and setup of interactive smart boards, CCTV camera systems and broadband connectivity for schools.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
    {
      workerId: techcareWorker.id,
      category: "PRINTING_SERVICES" as const,
      title: "Booklet, Brochure & Invitation Printing",
      description: "Design and printing of school booklets, brochures and event invitation cards, with delivery.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
    {
      workerId: techcareWorker.id,
      category: "PRINTING_SERVICES" as const,
      title: "Certificate & Flex Banner Printing with Delivery",
      description: "Custom certificate printing and flex banner printing for annual day and school events, with delivery.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
    {
      workerId: techcareWorker.id,
      category: "RO_WATER_SERVICE" as const,
      title: "RO Water Purifier Installation & AMC",
      description: "Installation, servicing and annual maintenance of RO water purifiers for school staff rooms and canteens.",
      priceType: "FIXED",
      price: 800,
      serviceArea: "Chennai",
    },
    {
      workerId: painterWorker.id,
      category: "PAINTING" as const,
      title: "Whitewashing & Colour Washing",
      description: "Whitewashing and colour washing of classrooms, corridors and campus buildings before the academic year.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Tiruchirappalli",
    },
    {
      workerId: cateringWorker.id,
      category: "CATERING" as const,
      title: "Tea, Snacks & Lunch Vendor Supply",
      description: "Tea, snacks and lunch supply for teacher training programs, meetings and school events.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
    {
      workerId: transportWorker.id,
      category: "STUDENT_STAFF_TRANSPORT" as const,
      title: "Student & Staff Commute Vehicle Service",
      description: "Bus and van hire for daily student and staff commute, school trips and events.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
    {
      workerId: transportWorker.id,
      category: "GOODS_TRANSPORT" as const,
      title: "School Goods Transportation / Carrier Service",
      description: "Goods carrier vehicles for transporting furniture, books and other school supplies.",
      priceType: "QUOTE",
      price: null,
      serviceArea: "Chennai",
    },
  ];

  for (const s of serviceSeed) {
    const existing = await db.gigService.findFirst({
      where: { workerId: s.workerId, title: s.title },
    });
    if (!existing) {
      await db.gigService.create({ data: { ...s, status: "APPROVED" } });
    }
  }

  // One pending service awaiting review.
  const pendingServiceExisting = await db.gigService.findFirst({
    where: { workerId: pendingWorker.id, title: "Custom Carpentry & Furniture Repair" },
  });
  if (!pendingServiceExisting) {
    await db.gigService.create({
      data: {
        workerId: pendingWorker.id,
        category: "CARPENTRY",
        title: "Custom Carpentry & Furniture Repair",
        description: "Desk, bench and door repair, custom wooden fittings for classrooms.",
        priceType: "QUOTE",
        price: null,
        serviceArea: "Trichy",
        status: "PENDING",
      },
    });
  }

  console.log(`Seeded ${productSeed.length + 1} products and ${serviceSeed.length + 1} services.`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
