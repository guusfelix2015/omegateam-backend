import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignItemsToUser() {
  console.log('🎯 Atribuindo itens ao usuário...');
  
  try {
    // Buscar todos os itens criados
    const items = await prisma.item.findMany();
    console.log(`📦 Encontrados ${items.length} itens`);
    
    // Buscar o primeiro usuário (assumindo que é o usuário de teste)
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    console.log(`👤 Usuário encontrado: ${user.name} (${user.email})`);
    
    // Calcular gear score total
    const totalGearScore = items.reduce((sum, item) => sum + item.valorGsInt, 0);
    
    // Atualizar usuário com os itens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ownedItemIds: items.map(item => item.id),
        gearScore: totalGearScore,
      },
    });
    
    console.log(`✅ Usuário atualizado com ${items.length} itens`);
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
    console.error('❌ Erro ao atribuir itens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignItemsToUser();
