import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const simpleDocsPlugin: FastifyPluginAsync = async (fastify) => {
  // Simple documentation endpoint
  fastify.get('/docs', async (request, reply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lineage 2 Company Party API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .endpoint { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; margin: 10px 0; padding: 15px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-right: 10px; }
        .get { background: #28a745; }
        .post { background: #007bff; }
        .put { background: #ffc107; color: black; }
        .delete { background: #dc3545; }
        .auth { background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
        .admin-only { background: #fd7e14; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
        pre { background: #f1f3f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .section { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏰 Lineage 2 Company Party Management API</h1>
        <p>Sistema completo de gerenciamento de Company Parties com autenticação JWT</p>
        <p><strong>Base URL:</strong> http://localhost:3000</p>
    </div>

    <div class="section">
        <h2>🔐 Autenticação</h2>
        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/auth/login</strong>
            <p>Fazer login e obter token JWT</p>
            <pre>
curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@lineage.com","password":"admin123"}'
            </pre>
        </div>
    </div>

    <div class="section">
        <h2>👥 Company Parties</h2>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/company-parties</strong>
            <span class="auth">AUTH</span>
            <p>Listar todas as Company Parties</p>
            <pre>
curl -X GET http://localhost:3000/company-parties \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/company-parties/{id}</strong>
            <span class="auth">AUTH</span>
            <p>Buscar Company Party por ID</p>
            <pre>
curl -X GET http://localhost:3000/company-parties/COMPANY_PARTY_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>

        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/company-parties</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Criar nova Company Party</p>
            <pre>
curl -X POST http://localhost:3000/company-parties \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Dragon Knights"}'
            </pre>
        </div>

        <div class="endpoint">
            <span class="method put">PUT</span>
            <strong>/company-parties/{id}</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Atualizar Company Party</p>
            <pre>
curl -X PUT http://localhost:3000/company-parties/COMPANY_PARTY_ID \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Dragon Knights Elite"}'
            </pre>
        </div>

        <div class="endpoint">
            <span class="method delete">DELETE</span>
            <strong>/company-parties/{id}</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Deletar Company Party</p>
            <pre>
curl -X DELETE http://localhost:3000/company-parties/COMPANY_PARTY_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>

        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/company-parties/{id}/players</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Adicionar player à Company Party</p>
            <pre>
curl -X POST http://localhost:3000/company-parties/COMPANY_PARTY_ID/players \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"userId":"USER_ID"}'
            </pre>
        </div>

        <div class="endpoint">
            <span class="method delete">DELETE</span>
            <strong>/company-parties/{id}/players/{playerId}</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Remover player da Company Party</p>
            <pre>
curl -X DELETE http://localhost:3000/company-parties/COMPANY_PARTY_ID/players/PLAYER_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>
    </div>

    <div class="section">
        <h2>👤 Usuários</h2>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/users</strong>
            <span class="auth">AUTH</span>
            <p>Listar usuários</p>
            <pre>
curl -X GET http://localhost:3000/users \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/users/{id}</strong>
            <span class="auth">AUTH</span>
            <p>Buscar usuário por ID (inclui Company Parties)</p>
            <pre>
curl -X GET http://localhost:3000/users/USER_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
            </pre>
        </div>

        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/users</strong>
            <span class="auth">AUTH</span>
            <span class="admin-only">ADMIN</span>
            <p>Criar novo usuário</p>
            <pre>
curl -X POST http://localhost:3000/users \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email":"newplayer@example.com",
    "name":"New Player",
    "nickname":"NewPlayer",
    "password":"player123",
    "role":"PLAYER",
    "lvl":1
  }'
            </pre>
        </div>
    </div>

    <div class="section">
        <h2>🧪 Usuários de Teste</h2>
        <ul>
            <li><strong>Admin:</strong> admin@lineage.com / admin123</li>
            <li><strong>Player:</strong> john.doe@example.com / user123</li>
        </ul>
    </div>

    <div class="section">
        <h2>🔒 Controle de Acesso</h2>
        <ul>
            <li><strong>ADMIN:</strong> Pode gerenciar Company Parties e usuários</li>
            <li><strong>PLAYER:</strong> Pode apenas visualizar informações</li>
        </ul>
    </div>

    <div class="section">
        <h2>📊 Health Checks</h2>
        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/health</strong>
            <p>Status do servidor</p>
        </div>
        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ready</strong>
            <p>Verificar se o servidor está pronto</p>
        </div>
    </div>

</body>
</html>
    `;
    
    reply.type('text/html');
    return html;
  });
};

export default fp(simpleDocsPlugin, {
  name: 'simple-docs',
});
