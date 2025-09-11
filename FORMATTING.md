# 🎨 Guia de Formatação do Código

## ❌ Problema Resolvido
O VSCode estava aplicando suas próprias regras de formatação que conflitavam com o Prettier, causando o erro `Delete ·eslintprettier/prettier`.

## ✅ Solução Implementada
Desabilitei completamente a formatação automática do VSCode e configurei métodos alternativos para usar apenas o Prettier.

## 🔧 Como Formatar o Código

### Opção 1: Comando Manual (Recomendado)
```bash
# Formatar todos os arquivos
npm run format

# Formatar arquivo específico
npx prettier --write src/modules/users/user.repository.ts
```

### Opção 2: Atalhos do VSCode
- **Cmd+S**: Apenas salva (sem formatação)
- **Cmd+Shift+S**: Salva + Formata com Prettier
- **Cmd+K Cmd+F**: Formatar documento atual com Prettier

### Opção 3: Command Palette
1. Pressione `Cmd+Shift+P`
2. Digite "Format Document with Prettier"
3. Pressione Enter

### Opção 4: Script Shell
```bash
./format-current.sh src/modules/users/user.repository.ts
```

## 📋 Configurações Aplicadas

### VSCode Settings
- ❌ Formatação automática desabilitada
- ❌ Formatação do TypeScript desabilitada
- ❌ Auto-indent desabilitado
- ✅ Prettier configurado como formatador manual

### Prettier Config
- `bracketSpacing: false` - Remove espaços em chaves vazias
- `singleQuote: true` - Aspas simples
- `semi: true` - Ponto e vírgula
- `tabWidth: 2` - Indentação de 2 espaços

## 🎯 Resultado Esperado

### ✅ Formatação Correta
```typescript
constructor(private prisma: PrismaClient) {}
const {page, limit} = query;
import {PrismaClient, Prisma} from '@prisma/client';
```

### ❌ Formatação Incorreta (não deve mais acontecer)
```typescript
constructor(private prisma: PrismaClient) { }
const { page, limit } = query;
import { PrismaClient, Prisma } from '@prisma/client';
```

## 🚀 Workflow Recomendado

1. **Edite o código normalmente**
2. **Pressione Cmd+S para salvar** (sem formatação)
3. **Quando terminar de editar, execute:**
   ```bash
   npm run format
   ```
4. **Ou use Cmd+Shift+S para salvar + formatar**

## 🔄 Para Reativar Formatação Automática (se quiser tentar)

Se quiser tentar reativar a formatação automática no futuro:

1. Edite `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

2. Recarregue a janela: `Cmd+Shift+P` → "Developer: Reload Window"

## 📝 Scripts Disponíveis

```bash
npm run format          # Formatar todos os arquivos
npm run format:check    # Verificar formatação
npm run lint           # Verificar ESLint
npm run lint:fix       # Corrigir ESLint
npm run fix            # Formatar + corrigir ESLint
npm run check          # Verificar tudo
```

---

**Nota**: A formatação automática foi desabilitada para evitar conflitos. Use os métodos manuais acima para garantir formatação consistente com Prettier.
