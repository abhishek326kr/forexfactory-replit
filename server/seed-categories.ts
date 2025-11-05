import { prisma } from "./db";

const categories = [
  { name: "Expert Advisors", description: "Automated trading robots for MT4/MT5" },
  { name: "Indicators", description: "Technical analysis indicators and tools" },
  { name: "Trading Strategies", description: "Proven forex trading strategies and methods" },
  { name: "Market Analysis", description: "Market insights and technical analysis" },
  { name: "Tutorials", description: "Step-by-step guides and educational content" },
  { name: "News & Updates", description: "Latest forex market news and platform updates" },
  { name: "Risk Management", description: "Risk management techniques and tools" },
  { name: "Platform Setup", description: "MT4/MT5 installation and configuration guides" }
];

async function seedCategories() {
  console.log("🌱 Seeding categories...");
  
  for (const cat of categories) {
    try {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            status: 'active'
          }
        });
        console.log(`✅ Created category: ${cat.name}`);
      } else {
        console.log(`⏭️ Category already exists: ${cat.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating category ${cat.name}:`, error);
    }
  }
  
  console.log("✨ Categories seeded successfully!");
}

seedCategories()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Error:", error);
    prisma.$disconnect();
    process.exit(1);
  });