#!/usr/bin/env node

/**
 * Script para verificar se todas as variáveis de ambiente necessárias estão configuradas
 * Execute com: node scripts/check-env.js
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'WHATSAPP_API_URL',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN',
];

console.log('🔍 Verificando variáveis de ambiente...\n');

let missing = [];
let placeholder = [];

requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  
  if (!value) {
    missing.push(envVar);
    console.log(`❌ ${envVar}: Não encontrada`);
  } else if (value.includes('your_') || value.includes('_here') || value === 'build-time-placeholder') {
    placeholder.push(envVar);
    console.log(`⚠️  ${envVar}: Usando valor placeholder`);
  } else {
    console.log(`✅ ${envVar}: Configurada`);
  }
});

console.log('\n📊 Resumo:');
console.log(`✅ Configuradas: ${requiredEnvVars.length - missing.length - placeholder.length}`);
console.log(`⚠️  Placeholders: ${placeholder.length}`);
console.log(`❌ Faltando: ${missing.length}`);

if (missing.length > 0) {
  console.log('\n❌ ERRO: Variáveis de ambiente faltando!');
  console.log('\nCrie um arquivo .env.local na raiz do projeto com:');
  missing.forEach((envVar) => {
    console.log(`${envVar}=seu_valor_aqui`);
  });
  console.log('\nVeja .env.example para referência.');
  process.exit(1);
}

if (placeholder.length > 0) {
  console.log('\n⚠️  AVISO: Algumas variáveis estão com valores placeholder.');
  console.log('Atualize-as com valores reais antes de fazer deploy em produção.');
  placeholder.forEach((envVar) => {
    console.log(`  - ${envVar}`);
  });
}

if (missing.length === 0 && placeholder.length === 0) {
  console.log('\n🎉 Todas as variáveis de ambiente estão configuradas corretamente!');
  console.log('Você pode executar: npm run dev');
}


