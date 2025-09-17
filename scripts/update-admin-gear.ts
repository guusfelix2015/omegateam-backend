import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminGear() {
  console.log('🔧 Atualizando gear do usuário admin...');
  
  try {
    // Buscar todos os itens criados
    const items = await prisma.item.findMany();
    console.log(`📦 Encontrados ${items.length} itens`);
    
    // Buscar o usuário admin
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@lineage.com' }
    });
    
    if (!admin) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    console.log(`👤 Admin encontrado: ${admin.name} (${admin.email})`);
    
    // Calcular gear score total
    const totalGearScore = items.reduce((sum, item) => sum + item.valorGsInt, 0);
    
    // Atualizar admin com os itens
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        ownedItemIds: items.map(item => item.id),
        gearScore: totalGearScore,
      },
    });
    
    console.log(`✅ Admin atualizado com ${items.length} itens`);
    console.log(`⭐ Gear Score total: ${totalGearScore}`);
    
    // Mostrar itens por categoria
    const itemsByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item.name);
      return acc;
    }, {} as Record<string, string[]>);
    
    console.log('\n📋 Itens por categoria:');
    Object.entries(itemsByCategory).forEach(([category, itemNames]) => {
      console.log(`  ${category}: ${itemNames.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar gear do admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminGear();
