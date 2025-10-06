# Guia de Deploy

Este guia cobre diferentes opções de deploy para a aplicação WhatsApp Chat.

## Opção 1: Vercel (Recomendado)

A Vercel é a plataforma recomendada pois é otimizada para Next.js.

### Deploy via CLI

1. Instale a Vercel CLI:

```bash
npm install -g vercel
```

2. Faça login:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

4. Para produção:

```bash
vercel --prod
```

### Deploy via GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "New Project"
4. Importe seu repositório
5. Configure as variáveis de ambiente
6. Clique em "Deploy"

### Configurar Variáveis de Ambiente

No dashboard da Vercel:

1. Selecione seu projeto
2. Vá em Settings → Environment Variables
3. Adicione cada variável:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
WHATSAPP_API_URL
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
```

## Opção 2: Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Selecione seu repositório
6. Configure as variáveis de ambiente
7. Deploy automático!

## Opção 3: Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Faça login
3. Clique em "Add new site" → "Import an existing project"
4. Conecte ao GitHub
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Adicione variáveis de ambiente
7. Deploy!

## Opção 4: Docker

### Criar Dockerfile

Crie um arquivo `Dockerfile` na raiz:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Build e Run

```bash
# Build
docker build -t whatsapp-chat .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain \
  # ... outras variáveis de ambiente
  whatsapp-chat
```

## Opção 5: AWS (EC2)

### 1. Criar instância EC2

1. Acesse AWS Console
2. Lance uma instância Ubuntu
3. Configure security group (porta 80, 443, 22)

### 2. Instalar dependências

```bash
# SSH na instância
ssh -i sua-chave.pem ubuntu@seu-ip

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### 3. Deploy da aplicação

```bash
# Clone o repositório
git clone seu-repositorio
cd chat

# Instalar dependências
npm install

# Criar .env.local
nano .env.local
# Cole suas variáveis de ambiente

# Build
npm run build

# Iniciar com PM2
pm2 start npm --name "whatsapp-chat" -- start

# Auto-restart no boot
pm2 startup
pm2 save
```

### 4. Configurar Nginx

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar
sudo nano /etc/nginx/sites-available/whatsapp-chat

# Cole:
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar
sudo ln -s /etc/nginx/sites-available/whatsapp-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Auto-renovação
sudo certbot renew --dry-run
```

## Configuração Pós-Deploy

### 1. Atualizar Webhook do WhatsApp

Após o deploy, atualize a URL do webhook:

1. Acesse Meta for Developers
2. WhatsApp → Configuration → Webhook
3. Atualize para: `https://seu-dominio.com/api/webhook`

### 2. Testar a Aplicação

1. Acesse a URL de produção
2. Crie uma conta
3. Envie uma mensagem de teste do WhatsApp
4. Verifique se a mensagem chega
5. Envie uma mensagem da aplicação
6. Verifique se chega no WhatsApp

### 3. Monitoramento

#### Vercel

- Dashboard integrado com logs
- Analytics automático

#### PM2 (EC2)

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs whatsapp-chat

# Monitorar
pm2 monit
```

## Domínio Personalizado

### Vercel

1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### Outros

Configure um registro A ou CNAME apontando para:

- Railway: fornece subdomínio automático
- Netlify: fornece subdomínio automático
- EC2: use o IP público

## Backup e Recuperação

### Firebase

- Dados são automaticamente replicados
- Configure backups programados no console

### Código

- Use Git para versionamento
- Mantenha branches de produção protegidas

## Segurança

### Checklist de Segurança

- [ ] Variáveis de ambiente nunca no código
- [ ] HTTPS habilitado
- [ ] Regras de segurança do Firebase configuradas
- [ ] Access Token do WhatsApp seguro
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs de erro configurados

## Troubleshooting

### Build falha

- Verifique versões do Node.js
- Limpe cache: `npm clean cache --force`
- Delete node_modules e reinstale

### Variáveis de ambiente não funcionam

- Verifique se todas estão configuradas
- Reinicie a aplicação após mudanças
- Verifique o prefixo NEXT*PUBLIC* para vars do cliente

### Webhook não funciona

- Verifique se a URL é HTTPS
- Confirme que está acessível publicamente
- Veja logs da aplicação

## Performance

### Otimizações Recomendadas

1. **Habilitar cache:**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

2. **Configurar CDN:**

- Vercel: automático
- Outros: use CloudFlare ou AWS CloudFront

3. **Otimizar imagens:**

- Use Next.js Image component
- Configure formatos modernos (WebP)

## Custos Estimados

### Vercel

- Hobby: Grátis (projetos pessoais)
- Pro: $20/mês por usuário

### Railway

- Starter: $5/mês
- Developer: $20/mês

### AWS EC2

- t2.micro: ~$8/mês (free tier por 12 meses)
- t3.small: ~$15/mês

### Firebase

- Spark (grátis): Limitado
- Blaze (pay-as-you-go): Varia com uso

### WhatsApp Business API

- Conversações gratuitas: 1000/mês
- Após isso: varia por país

---

Escolha a opção que melhor se adequa às suas necessidades e orçamento! 🚀

