import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleItems = [
  // Armas
  { name: 'Espada Dracônica +16', category: 'WEAPON', grade: 'S', valorGsInt: 850, valorDkp: 1200 },
  
  // Armaduras
  { name: 'Armadura Imperial +15', category: 'ARMOR', grade: 'A', valorGsInt: 420, valorDkp: 800 },
  
  // Capacetes
  { name: 'Elmo do Dragão +12', category: 'HELMET', grade: 'A', valorGsInt: 280, valorDkp: 600 },
  
  // Calças
  { name: 'Calças Imperiais +14', category: 'PANTS', grade: 'A', valorGsInt: 350, valorDkp: 700 },
  
  // Botas
  { name: 'Botas do Vento +13', category: 'BOOTS', grade: 'B', valorGsInt: 220, valorDkp: 450 },
  
  // Luvas
  { name: 'Luvas de Força +11', category: 'GLOVES', grade: 'B', valorGsInt: 180, valorDkp: 400 },
  
  // Escudo
  { name: 'Escudo Celestial +10', category: 'SHIELD', grade: 'A', valorGsInt: 320, valorDkp: 650 },
  
  // Acessórios
  { name: 'Colar da Sabedoria', category: 'NECKLACE', grade: 'S', valorGsInt: 150, valorDkp: 300 },
  { name: 'Brinco da Velocidade', category: 'EARRING', grade: 'A', valorGsInt: 120, valorDkp: 250 },
  { name: 'Anel do Poder', category: 'RING', grade: 'A', valorGsInt: 100, valorDkp: 200 },
];

async function seedSampleItems() {
  console.log('🌱 Criando itens de exemplo...');
  
  try {
    // Limpar itens existentes (opcional)
    await prisma.item.deleteMany({});
    console.log('🗑️  Itens existentes removidos');
    
    // Criar novos itens
    for (const item of sampleItems) {
      await prisma.item.create({
        data: item,
      });
      console.log(`✅ Criado: ${item.name}`);
    }
    
    console.log('🎉 Todos os itens de exemplo foram criados!');
    
    // Mostrar estatísticas
    const totalItems = await prisma.item.count();
    console.log(`📊 Total de itens no banco: ${totalItems}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar itens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleItems();
